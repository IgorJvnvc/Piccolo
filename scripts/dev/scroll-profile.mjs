/**
 * Dev tool: scroll performance. Scrolls the whole page down and back up at a steady reading pace (real wheel events on
 * desktop, real touch gestures on phones) and reports where the main thread spends its time and which frames are late:
 * frame-gap percentiles, Long Animation Frames (script vs render time), Blink's own layout/style/script counters, and the
 * worst frames with the page section they happened in.
 *
 * Software-rendered headless Chrome exaggerates paint cost, so read the numbers relatively (before vs after), and judge
 * absolute smoothness on a real GPU.
 *
 *   node scripts/dev/scroll-profile.mjs [--preset desktop|phone|tv] [--label baseline] [--passes 2]
 *
 * Writes .shots/<label>/scroll-<preset>.json. Needs a built dist/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { skipIntro } from './skip-intro.mjs';
import { serve } from './serve.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, all) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : 'true']);
  return pairs;
}, []));
const presetName = args.preset ?? 'desktop';
const label = args.label ?? 'latest';
const passes = Number(args.passes ?? 2);

const TV_UA = 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36';
const PRESETS = {
  desktop: { viewport: { width: 1253, height: 712 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tv: { viewport: { width: 1920, height: 1080 }, userAgent: TV_UA },
};
const preset = PRESETS[presetName];
if (!preset) throw new Error(`unknown preset "${presetName}"`);
const touch = Boolean(preset.hasTouch);

const { base, close } = await serve('dist');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext(preset);
await skipIntro(context);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
await page.goto(`${base}/`);
await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500); // let load-time work (idle GSAP/Lenis setup, hero intro) finish before measuring

const layout = await page.evaluate(() => {
  const sections = [...document.querySelectorAll('header, main > section, footer')].map((el) => ({
    name: el.getAttribute('data-enhance') ?? el.id ?? el.tagName.toLowerCase(),
    top: el.getBoundingClientRect().top + window.scrollY,
    bottom: el.getBoundingClientRect().bottom + window.scrollY,
  }));
  return { height: document.documentElement.scrollHeight, viewport: window.innerHeight, sections, device: document.documentElement.dataset.device, motion: document.documentElement.dataset.motion };
});
const sectionAt = (y) => layout.sections.find((s) => y >= s.top && y < s.bottom)?.name ?? '?';

await page.evaluate(() => {
  window.scrollTo(0, 0);
  window.__frames = [];
  window.__loaf = [];
  window.__run = true;
  const loop = (now) => {
    window.__frames.push([now, window.scrollY]);
    if (window.__run) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__loaf.push({ start: e.startTime, dur: e.duration, block: e.blockingDuration, renderStart: e.renderStart, styleStart: e.styleAndLayoutStart, script: e.scripts.reduce((sum, s) => sum + s.duration, 0) });
    }
  }).observe({ type: 'long-animation-frame', buffered: false });
});
const metricsBefore = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const t0 = await page.evaluate(() => performance.now());

const maxScroll = layout.height - layout.viewport;
for (let pass = 0; pass < passes; pass++) {
  for (const direction of [1, -1]) {
    if (!touch) {
      // ~1500 px/s: a brisk but readable scroll. Node timers are coarse, so the real pace is whatever the loop achieves.
      for (let travelled = 0; travelled < maxScroll; travelled += 50) {
        await page.mouse.wheel(0, 50 * direction);
        await page.waitForTimeout(24);
      }
    } else {
      // A finger drag: down, 20 small moves, up (~1500 px/s). Chrome may add a short fling after the release.
      for (let travelled = 0; travelled < maxScroll; travelled += 500) {
        const y0 = direction > 0 ? 700 : 200;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: y0 }] });
        for (let step = 1; step <= 20; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: y0 - direction * 25 * step }] });
          await page.waitForTimeout(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
    }
    await page.waitForTimeout(400);
  }
}
await page.waitForTimeout(600);
await page.evaluate(() => { window.__run = false; });
const metricsAfter = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const { frames, loaf } = await page.evaluate(() => ({ frames: window.__frames, loaf: window.__loaf }));
await browser.close();
close();

const run = frames.filter(([t]) => t >= t0);
const gaps = run.slice(1).map(([t, y], i) => ({ gap: t - run[i][0], at: (t - t0) / 1000, y }));
const sorted = gaps.map((g) => g.gap).sort((a, b) => a - b);
const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
const count = (over) => gaps.filter((g) => g.gap > over).length;
const sum = (list, pick) => list.reduce((total, item) => total + pick(item), 0);
const loafRun = loaf.filter((e) => e.start >= t0);
const metric = (name) => (metricsAfter[name] ?? 0) - (metricsBefore[name] ?? 0);

const report = {
  preset: presetName,
  device: layout.device,
  motion: layout.motion,
  pageHeight: layout.height,
  scrollReached: { min: Math.min(...run.map(([, y]) => y)), max: Math.max(...run.map(([, y]) => y)) },
  frames: gaps.length,
  gapMs: { median: pct(50), p95: pct(95), p99: pct(99), max: sorted[sorted.length - 1] },
  slowFrames: { over25ms: count(25), over33ms: count(33), over50ms: count(50), over100ms: count(100) },
  longAnimationFrames: {
    count: loafRun.length,
    blockingMs: sum(loafRun, (e) => e.block),
    scriptMs: sum(loafRun, (e) => e.script),
    renderMs: sum(loafRun, (e) => (e.renderStart ? e.start + e.dur - e.renderStart : 0)),
    styleLayoutMs: sum(loafRun, (e) => (e.styleStart ? e.start + e.dur - e.styleStart : 0)),
  },
  blink: {
    layoutMs: metric('LayoutDuration') * 1000, layoutCount: metric('LayoutCount'),
    styleMs: metric('RecalcStyleDuration') * 1000, styleCount: metric('RecalcStyleCount'),
    scriptMs: metric('ScriptDuration') * 1000, taskMs: metric('TaskDuration') * 1000,
  },
  worstFrames: [...gaps].sort((a, b) => b.gap - a.gap).slice(0, 8).map((g) => ({ gapMs: g.gap, atSeconds: g.at, scrollY: g.y, section: sectionAt(g.y + layout.viewport / 2) })),
};
// Which sections hold the slow frames (>33 ms)?
const bySection = {};
for (const g of gaps) if (g.gap > 33) bySection[sectionAt(g.y + layout.viewport / 2)] = (bySection[sectionAt(g.y + layout.viewport / 2)] ?? 0) + 1;
report.slowFramesBySection = bySection;

const f = (x, d = 1) => x.toFixed(d);
console.log(`preset=${presetName}  device=${layout.device}  motion=${layout.motion}  page=${layout.height}px  scrolled ${f(report.scrollReached.min, 0)}..${f(report.scrollReached.max, 0)}px  frames=${report.frames}  (${passes} pass${passes > 1 ? 'es' : ''} down+up)`);
if (report.scrollReached.max < maxScroll * 0.9) console.log(`WARNING: the page only scrolled to ${f(report.scrollReached.max, 0)} of ${maxScroll}px; this profile is not valid`);
console.log(`frame gap   median ${f(report.gapMs.median)} ms | p95 ${f(report.gapMs.p95)} | p99 ${f(report.gapMs.p99)} | max ${f(report.gapMs.max)}`);
console.log(`slow frames >25ms: ${report.slowFrames.over25ms} | >33ms: ${report.slowFrames.over33ms} | >50ms: ${report.slowFrames.over50ms} | >100ms: ${report.slowFrames.over100ms}`);
console.log(`long animation frames: ${report.longAnimationFrames.count} | blocking ${f(report.longAnimationFrames.blockingMs, 0)} ms | script ${f(report.longAnimationFrames.scriptMs, 0)} ms | render ${f(report.longAnimationFrames.renderMs, 0)} ms (style+layout ${f(report.longAnimationFrames.styleLayoutMs, 0)} ms)`);
console.log(`blink totals: layout ${f(report.blink.layoutMs, 0)} ms (${report.blink.layoutCount}x) | style ${f(report.blink.styleMs, 0)} ms (${report.blink.styleCount}x) | script ${f(report.blink.scriptMs, 0)} ms | tasks ${f(report.blink.taskMs, 0)} ms`);
console.log(`slow frames (>33ms) by section: ${JSON.stringify(bySection)}`);
console.log('worst frames:');
for (const w of report.worstFrames) console.log(`  ${f(w.gapMs, 0).padStart(5)} ms at ${f(w.atSeconds, 1).padStart(5)} s  scrollY ${f(w.scrollY, 0).padStart(5)}  (${w.section})`);

const outDir = resolve(`.shots/${label}`);
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, `scroll-${presetName}.json`), JSON.stringify(report, null, 2));
console.log(`\nwrote ${resolve(outDir, `scroll-${presetName}.json`)}`);
