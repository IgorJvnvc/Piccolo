/**
 * Dev tool: device trace. How does the quick view open on a REAL Android phone, frame by frame?
 *
 *   node scripts/dev/device-trace.mjs head=<dist>[,work=<dist>[+variant[+variant]]...] [--runs 6] [--serial <adb serial>] [--intro] [--card 0] [--raw] [--trace f] [--shot f]
 *
 * Needs the phone on USB with debugging on, and Chrome open on it (adb is looked up on PATH). Each `label=dist` is served from
 * this PC and reached on the phone as http://localhost:<port> through `adb reverse`; the builds are interleaved, run after run,
 * so a warm-up or a thermal drift hits all of them alike. Per run the tool loads the page in a fresh tab, scrolls the menu to
 * a card, taps its Details button with a real touch event (Chrome's own input pipeline, over CDP), and records:
 *
 *   tapToClick  ms from the touch to the click event (our synthetic tap holds for 40 ms, so about 40 is normal)
 *   pause    ms from the click to the dialog being in the DOM (the render that opens it)
 *   block    the longest stretch the main thread was blocked from the touch to 600 ms later (long animation frames)
 *   long     long-animation-frame entries in that time
 *   rAF      the gaps between animation frames the page saw (main thread): worst, and how many were over 20 ms (a missed frame at 60 Hz)
 *   shown    the same for frames PRESENTED on the screen (SurfaceFlinger's own record of Chrome's surface), the number that counts
 *   frames   how many frames were presented between the first and the last one of the animation
 *   jump     the biggest change of the panel's opacity between two sampled frames, in percentage points (a stall skips part of a fade)
 *
 * `label=dist+variant+variant` also injects those CSS hypotheses (see VARIANTS) into the page after it has loaded.
 *
 * Every number is the median over the runs. The intro is marked as seen (like the specs do) unless --intro is given.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { parseArgs, serve } from './serve.mjs';

const args = parseArgs();
const DIALOG = '[role="dialog"][aria-labelledby="quick-view-title"]';
/** Hypotheses, injected as CSS after the page has loaded: what does each part of the animation cost on this phone? label=dist+variant. */
const VARIANTS = {
  flatpanel: ` { transform: none !important; opacity: 1 !important; }`,
  flatdish: ` img { transform: none !important; }`,
  flatscrim: `body > div:has(> ) { opacity: 1 !important; }`,
  flatall: `body > div:has(> ),  { opacity: 1 !important; transform: none !important; }  img { transform: none !important; }`,
  wcall: `body > div:has(> ${DIALOG}), ${DIALOG}, ${DIALOG} img { will-change: transform, opacity; }`,
  wcoverlay: `body > div:has(> ${DIALOG}) { will-change: opacity; }`,
  wcpanel: ` { will-change: transform, opacity; }`,
  /** Parts of the dialog hidden one at a time, to find what its first frame spends its time drawing. */
  hideshadow: `${DIALOG} { box-shadow: none !important; }`,
  hideimg: `${DIALOG} img { visibility: hidden !important; }`,
  hidemediabg: `${DIALOG} > div:first-of-type { background: none !important; }`,
  hidebody: `${DIALOG} > div:last-of-type { visibility: hidden !important; }`,
  hideall: `${DIALOG} { box-shadow: none !important; } ${DIALOG} img { visibility: hidden !important; } ${DIALOG} > div:first-of-type { background: none !important; } ${DIALOG} > div:last-of-type { visibility: hidden !important; }`,
  noblur: '* { backdrop-filter: none !important; }',
  /** Puts back what the phone rules of quick-view.module.css take away, to see whether it costs anything. */
  restorefx: `${DIALOG} { box-shadow: var(--sh-dark) !important; } ${DIALOG} img { filter: var(--fx-item) !important; }`,
  restoreblur: `body > div:has(> ${DIALOG}) { backdrop-filter: blur(0.375rem) !important; background: var(--c-scrim) !important; }`,
  nodishfx: `${DIALOG} img { filter: none !important; }`,
  noscroller: `body > div:has(> ),  { overflow: visible !important; }`,
  noradius: ` { border-radius: 0 !important; }`,
};
const builds = (process.argv[2] ?? '').split(',').filter((part) => part.includes('=')).map((part) => {
  const [label, spec] = part.split('=');
  const [dist, ...variant] = spec.split('+');
  for (const name of variant) if (!VARIANTS[name]) throw new Error(`unknown variant "${name}"`);
  return { label, dist, variant };
});
if (builds.length === 0) throw new Error('usage: device-trace.mjs head=<dist>[,work=<dist>...] [--runs N] [--serial S] [--intro]');
const RUNS = Number(args.runs ?? 6);
const CARD = Number(args.card ?? 0);
/** --trace <file>: a Chrome trace of the first run of the first build (open it in ui.perfetto.dev, or summarise it). */
const TRACE_FILE = args.trace && args.trace !== 'true' ? args.trace : null;
const TRACE_CATEGORIES = 'toplevel,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,cc,gpu,viz,benchmark,input,blink.user_timing';
/** --shot <file>: a screenshot of the phone after the last run's dialog has settled (is the dish still crisp?). */
const SHOT_FILE = args.shot && args.shot !== 'true' ? args.shot : null;
const CDP_PORT = 9222;
const FIRST_DEVICE_PORT = 18081;

const adbBase = args.serial ? ['-s', args.serial] : [];
const adb = (...parts) => execFileSync('adb', [...adbBase, ...parts], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const shell = (command) => adb('shell', command);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return NaN;
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** SurfaceFlinger's name for the surface Chrome's compositor draws the web content into (it carries an id that changes per Chrome start). */
function chromeLayer() {
  const names = shell('dumpsys SurfaceFlinger --list').split(/\r?\n/).map((line) => line.trim());
  const layer = names.find((name) => /^com\.android\.chrome\/ChromeChildSurface#\d+$/.test(name));
  if (!layer) throw new Error('no Chrome child surface: is Chrome open and in the foreground?');
  return layer;
}

/** Times (ms) at which frames of `layer` reached the screen since the last clear. */
function presented(layer) {
  const rows = shell(`dumpsys SurfaceFlinger --latency '${layer}'`).split(/\r?\n/).map((line) => line.trim().split(/\s+/));
  return rows
    .slice(2)
    .map((row) => Number(row[1]))
    .filter((ns) => Number.isFinite(ns) && ns > 0 && ns < 1e18)
    .map((ns) => ns / 1e6)
    .sort((a, b) => a - b);
}

const gapsOf = (times) => times.slice(1).map((time, index) => time - times[index]);
const over = (gaps, limit) => gaps.filter((gap) => gap > limit).length;

/** Runs in the page before the tap: records the main thread's view of what follows (see the header). */
function installProbe() {
  const probe = { down: 0, click: 0, dialogAt: 0, frames: [], samples: [], loaf: [], longtasks: [], events: [] };
  window.__probe = probe;
  const dialog = () => document.querySelector('[role="dialog"][aria-labelledby="quick-view-title"]');
  const observe = (type, into) => {
    try {
      new PerformanceObserver((list) => into.push(...list.getEntries().map((entry) => entry.toJSON()))).observe({ type, buffered: false });
    } catch {
      // this Chrome does not have it
    }
  };
  observe('long-animation-frame', probe.loaf);
  observe('longtask', probe.longtasks);
  try {
    new PerformanceObserver((list) => probe.events.push(...list.getEntries().map((entry) => entry.toJSON()))).observe({ type: 'event', durationThreshold: 16, buffered: false });
  } catch {
    // no Event Timing
  }
  new MutationObserver(() => {
    if (!probe.dialogAt && dialog()) probe.dialogAt = performance.now();
  }).observe(document.body, { childList: true });
  const tick = (now) => {
    const panel = dialog();
    probe.frames.push(now);
    probe.samples.push([now, panel ? Number(getComputedStyle(panel).opacity) : -1]);
    if (probe.down && now - probe.down < 1600) requestAnimationFrame(tick);
  };
  document.addEventListener(
    'click',
    (event) => {
      probe.click = event.timeStamp;
    },
    { capture: true, once: true },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      probe.down = event.timeStamp;
      requestAnimationFrame(tick);
    },
    { capture: true, once: true },
  );
}

async function openPage(context, origin, variant) {
  const page = await context.newPage();
  if (args.intro !== 'true') {
    await page.addInitScript(() => {
      try {
        window.sessionStorage.setItem('piccolo:intro', 'seen');
      } catch {
        // an opaque origin has no storage
      }
    });
  }
  await page.goto(`${origin}/?run=${Date.now()}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__PICCOLO_READY__ === true, undefined, { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const island = [...document.querySelectorAll('astro-island')].find((el) => el.getAttribute('component-export') === 'MenuBrowser');
      return island !== undefined && !island.hasAttribute('ssr');
    },
    undefined,
    { timeout: 30_000 },
  );
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((entry) => /\/_astro\/ScrollTrigger\./.test(entry.name)), undefined, { timeout: 30_000 });
  if (variant.length > 0) await page.addStyleTag({ content: variant.map((name) => VARIANTS[name]).join('\n') });
  return page;
}

/** The centre of the CARD-th Details button in the menu, in CSS px of the viewport, after scrolling it into the middle. */
async function aimAtCard(page) {
  await page.evaluate((index) => {
    const button = document.querySelectorAll('#menu [data-details]')[index];
    button?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, CARD);
  await sleep(1800); // the menu scene plays, the cards are in
  return page.evaluate((index) => {
    const rect = document.querySelectorAll('#menu [data-details]')[index]?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  }, CARD);
}

async function tap(cdp, point) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
  await sleep(40);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/** Records a Chrome trace while during runs, and writes it to ile. */
async function traced(browser, file, during) {
  const session = await browser.newBrowserCDPSession();
  await session.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: TRACE_CATEGORIES.split(','), recordMode: 'recordContinuously' } });
  try {
    return await during();
  } finally {
    const done = new Promise((resolve) => session.once('Tracing.tracingComplete', resolve));
    await session.send('Tracing.end');
    const { stream } = await done;
    const chunks = [];
    for (;;) {
      const part = await session.send('IO.read', { handle: stream, size: 1 << 20 });
      chunks.push(part.data);
      if (part.eof) break;
    }
    await session.send('IO.close', { handle: stream });
    writeFileSync(file, chunks.join(''));
    await session.detach();
  }
}

async function measure(context, origin, layer, variant, browser, traceFile, shotFile) {
  const page = await openPage(context, origin, variant);
  try {
    const point = await aimAtCard(page);
    if (!point) throw new Error('no Details button in the menu');
    await page.evaluate(installProbe);
    const cdp = await context.newCDPSession(page);
    shell(`dumpsys SurfaceFlinger --latency-clear '${layer}'`);
    const act = async () => {
      await tap(cdp, point);
      await sleep(1900);
    };
    if (traceFile) await traced(browser, traceFile, act);
    else await act();
    if (shotFile) writeFileSync(shotFile, execFileSync('adb', [...adbBase, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 }));
    const shown = presented(layer);
    const probe = await page.evaluate(() => window.__probe);
    await cdp.detach();

    const since = (entries, key = 'startTime') => entries.filter((entry) => entry[key] >= probe.down && entry[key] <= probe.down + 600);
    const blocking = [...since(probe.loaf).map((entry) => entry.blockingDuration), ...since(probe.longtasks).map((entry) => entry.duration - 50)];
    const window_ = probe.dialogAt ? probe.frames.filter((time) => time >= probe.dialogAt - 20 && time <= probe.dialogAt + 450) : [];
    const rafGaps = gapsOf(window_);
    const opacities = probe.samples.filter(([time, value]) => value >= 0 && time >= probe.down).map(([, value]) => value);
    const jumps = opacities.slice(1).map((value, index) => Math.abs(value - opacities[index]) * 100);
    const first = shown.length > 0 ? shown[0] : 0;
    const animation = shown.filter((time) => time >= first && time <= first + 700);
    const shownGaps = gapsOf(animation);
    return {
      tapToClick: probe.click ? probe.click - probe.down : NaN,
      pause: probe.dialogAt && probe.click ? probe.dialogAt - probe.click : NaN,
      block: Math.max(0, ...blocking),
      long: since(probe.loaf).length,
      rafWorst: Math.max(0, ...rafGaps),
      rafOver20: over(rafGaps, 20),
      shownWorst: Math.max(0, ...shownGaps),
      shownOver20: over(shownGaps, 20),
      shownOver33: over(shownGaps, 33),
      frames: animation.length,
      jump: Math.max(0, ...jumps),
    };
  } finally {
    await page.close();
  }
}

const servers = [];
try {
  const device = adb('devices').split(/\r?\n/).filter((line) => /\sdevice$/.test(line));
  if (device.length === 0) throw new Error('no phone on adb (USB debugging on, screen unlocked, "Allow" tapped)');
  for (const [index, build] of builds.entries()) {
    const server = await serve(build.dist);
    servers.push(server);
    build.devicePort = FIRST_DEVICE_PORT + index;
    adb('reverse', `tcp:${build.devicePort}`, `tcp:${new URL(server.base).port}`);
    build.origin = `http://localhost:${build.devicePort}`;
  }
  adb('forward', `tcp:${CDP_PORT}`, 'localabstract:chrome_devtools_remote');
  shell(`am start -a android.intent.action.VIEW -d ${builds[0].origin}/ com.android.chrome`);
  await sleep(2500);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error('Chrome exposes no browser context over CDP');
  const layer = chromeLayer();
  console.log(`layer: ${layer}\n`);

  const results = new Map(builds.map((build) => [build.label, []]));
  for (let run = 1; run <= RUNS; run += 1) {
    for (const build of builds) {
      try {
        results.get(build.label).push(await measure(context, build.origin, layer, build.variant, browser, run === 1 && build === builds[0] ? TRACE_FILE : null, run === RUNS && build === builds[builds.length - 1] ? SHOT_FILE : null));
        console.log(`run ${run} ${build.label} done`);
      } catch (error) {
        console.log(`run ${run} ${build.label} FAILED: ${error.message}`);
      }
    }
  }

  const rows = ['tapToClick', 'pause', 'block', 'long', 'rafWorst', 'rafOver20', 'shownWorst', 'shownOver20', 'shownOver33', 'frames', 'jump'];
  console.log(`\n${'median of runs'.padEnd(14)}${builds.map((build) => `${build.label} (${results.get(build.label).length})`.padStart(16)).join('')}`);
  for (const row of rows) {
    console.log(row.padEnd(14) + builds.map((build) => String(Math.round(median(results.get(build.label).map((result) => result[row])) * 10) / 10).padStart(16)).join(''));
  }
  await browser.close();
  if (args.raw === 'true') {
    for (const build of builds) {
      console.log(`\n${build.label}: per run`);
      for (const result of results.get(build.label)) console.log(`  ${rows.map((row) => `${row}=${Math.round(result[row] * 10) / 10}`).join(' ')}`);
    }
  }
} finally {
  for (const server of servers) server.close();
  for (const build of builds) if (build.devicePort) try { adb('reverse', '--remove', `tcp:${build.devicePort}`); } catch { /* already gone */ }
  try { adb('forward', '--remove', `tcp:${CDP_PORT}`); } catch { /* already gone */ }
}
