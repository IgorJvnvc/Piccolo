/**
 * Dev tool: samples the Follow card's real width and corner radius on every animation frame while it expands (driven by
 * real wheel events) and fits them to the spec in follow.scene.ts. More exact than the screencast recorder, because
 * rAF timestamps have no capture jitter. The anchor (first frame whose data-state is not "idle") lags the true timeline
 * start by about one frame, so that offset is fitted; a healthy build shows a fit of ~15-20 ms and RMSE well under 1%.
 *
 * Runs are bimodal in software-rendered headless Chrome: most fit at ~0.3% of travel, but some show ~2% because a few
 * frames stall. Run with DUMP=1 to see why: the Long Animation Frames API attributes each stall, and for this scene
 * they are "no script: style/layout/paint", i.e. rasterising the card's large soft shadow and the art's drop-shadow
 * filters on the CPU, not JavaScript. Judge conformance by the good runs; judge smoothness on a real GPU.
 *
 *   node scripts/dev/sample-follow.mjs          (DUMP=1 for raw frames and stall attribution)
 */
import { chromium } from 'playwright-core';
import { skipIntro } from './skip-intro.mjs';
import { serve } from './serve.mjs';

const { base, close } = await serve('dist');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1253, height: 712 } });
await skipIntro(context);
const page = await context.newPage();
await page.goto(`${base}/`);
await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
await page.evaluate(() => document.fonts.ready);

await page.evaluate(() => {
  const stage = document.querySelector('#offers [data-part="stage"]');
  const bg = document.querySelector('#offers [data-part="bg"]');
  window.__samples = [];
  window.__loaf = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__loaf.push({
          start: e.startTime,
          dur: e.duration,
          scripts: e.scripts.map((s) => ({ inv: s.invoker, src: (s.sourceURL || '').split('/').pop(), fn: s.sourceFunctionName, dur: Math.round(s.duration), layout: Math.round(s.forcedStyleAndLayoutDuration) })),
        });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { /* not supported */ }
  let t0 = null;
  const tick = () => {
    // performance.now(), not the rAF argument: during a stall the rAF timestamp is the (earlier) vsync time while GSAP
    // renders with the real current time, which would pair a stale timestamp with a fresher value.
    const now = performance.now();
    const started = stage.getAttribute('data-state') !== 'idle';
    if (started && t0 === null) { t0 = now; window.__t0 = now; }
    if (t0 !== null) {
      window.__samples.push({ t: now - t0, w: bg.getBoundingClientRect().width, r: parseFloat(getComputedStyle(bg).borderTopLeftRadius) });
    }
    if (t0 === null || now - t0 < 2500) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

for (let i = 0; i < 60; i += 1) {
  await page.mouse.wheel(0, 180);
  await page.waitForTimeout(25);
}
await page.waitForTimeout(3500);

const { samples, rem, loaf, anchor } = await page.evaluate(() => ({
  loaf: window.__loaf,
  anchor: window.__t0,
  samples: window.__samples,
  rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
}));
await browser.close();
close();

if (process.env.DUMP) {
  console.log('raw frames (t ms, width px, radius px, frame gap ms):');
  console.log(samples.slice(0, 36).map((s, i) => `${s.t.toFixed(0)}:${s.w.toFixed(0)}:${s.r.toFixed(0)}:${i ? (s.t - samples[i - 1].t).toFixed(0) : '-'}`).join('  '));
}
if (process.env.DUMP) {
  console.log('long animation frames overlapping the expansion (ms relative to its start):');
  for (const e of loaf.filter((f) => f.start + f.dur > anchor - 150 && f.start < anchor + 1500)) {
    const who = e.scripts.map((s) => `${s.src || '(inline)'}${s.fn ? '#' + s.fn : ''} ${s.dur}ms${s.layout ? ` (forced layout ${s.layout}ms)` : ''} via ${s.inv}`).join(' | ') || '(no script: style/layout/paint)';
    console.log(`  at ${(e.start - anchor).toFixed(0).padStart(5)}  dur ${e.dur.toFixed(0).padStart(3)}ms  ${who}`);
  }
}
const first = samples[0];
const last = samples[samples.length - 1];
const W = last.w;
const w0 = 1.15 * rem;
const R0 = 8.75 * rem;
const R1 = 2 * rem;
const expoOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - 2 ** (-10 * x));
const widthAt = (ms) => w0 + (W - w0) * expoOut(ms / 960);
const radiusAt = (ms) => R0 + (R1 - R0) * expoOut((ms - 300) / 800);

// The anchor (first frame whose data-state is not "idle") lags the timeline start by about one frame, so fit that offset.
const rmse = (offset) => {
  const rows = samples.filter((s) => s.t >= 30);
  const w = Math.sqrt(rows.reduce((a, s) => a + (s.w - widthAt(s.t + offset)) ** 2, 0) / rows.length);
  const r = Math.sqrt(rows.reduce((a, s) => a + (s.r - radiusAt(s.t + offset)) ** 2, 0) / rows.length);
  return { w, r };
};
let bestOffset = 0;
let best = Infinity;
for (let offset = -40; offset <= 80; offset += 1) {
  const e = rmse(offset);
  const score = e.w / W + e.r / R0;
  if (score < best) { best = score; bestOffset = offset; }
}
const fit = rmse(bestOffset);
// A healthy run has an even ~17 ms frame cadence. Dropped frames (gaps) distort the fit without the tween being wrong.
const gaps = samples.slice(1).map((s, i) => s.t - samples[i].t).filter((gap) => gap > 25);
console.log(`FRAMES: ${samples.length} sampled, ${gaps.length} gap(s) > 25 ms${gaps.length ? ` (longest ${Math.max(...gaps).toFixed(0)} ms): the fit below is unreliable, re-run` : ' (even cadence: the fit below is trustworthy)'}`);
console.log(`FIT: anchor is ${bestOffset} ms behind the timeline start (negative = ahead)  =>  width RMSE ${fit.w.toFixed(1)} px (${((100 * fit.w) / W).toFixed(2)}% of travel), radius RMSE ${fit.r.toFixed(1)} px (${((100 * fit.r) / R0).toFixed(2)}% of travel)`);
for (const target of [50, 100, 200, 300, 400, 600]) {
  const s = samples.reduce((b, c) => (Math.abs(c.t - target) < Math.abs(b.t - target) ? c : b));
  console.log(`  t=${String(Math.round(s.t)).padStart(4)}ms  width ${s.w.toFixed(0).padStart(4)} vs spec ${widthAt(s.t + bestOffset).toFixed(0).padStart(4)}   radius ${s.r.toFixed(0).padStart(4)} vs spec ${radiusAt(s.t + bestOffset).toFixed(0).padStart(4)}`);
}
console.log(`rem=${rem.toFixed(2)}px  samples=${samples.length}  first t=${first.t.toFixed(0)}ms w=${first.w.toFixed(0)}  final w=${W.toFixed(1)} r=${last.r.toFixed(1)}`);
console.log('  t(ms)   width: measured  spec   diff |  radius: measured  spec   diff');
let maxW = 0;
let maxR = 0;
for (const target of [0, 50, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500]) {
  const s = samples.reduce((best, c) => (Math.abs(c.t - target) < Math.abs(best.t - target) ? c : best));
  const dw = s.w - widthAt(s.t);
  const dr = s.r - radiusAt(s.t);
  maxW = Math.max(maxW, Math.abs(dw));
  maxR = Math.max(maxR, Math.abs(dr));
  console.log(`${String(Math.round(s.t)).padStart(7)}   ${s.w.toFixed(1).padStart(14)} ${widthAt(s.t).toFixed(1).padStart(6)} ${dw.toFixed(1).padStart(6)} | ${s.r.toFixed(1).padStart(16)} ${radiusAt(s.t).toFixed(1).padStart(6)} ${dr.toFixed(1).padStart(6)}`);
}
console.log(`max |width diff| = ${maxW.toFixed(1)} px (${((100 * maxW) / W).toFixed(2)}% of final)   max |radius diff| = ${maxR.toFixed(1)} px`);
