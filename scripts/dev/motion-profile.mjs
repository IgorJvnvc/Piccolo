/**
 * Dev tool: motion fingerprint. Scrolls through the page the way a visitor does (a steady glide to each section, then a
 * pause long enough for the scene to play) while sampling every animated element's real opacity, translation, width and
 * corner radius on every animation frame. Each sampled curve is fitted to the standard GSAP eases, and the report gives,
 * per element: when it started (relative to its scene), how long it took, how far it travelled and which ease fits best.
 *
 * Use it before and after a motion refactor: the numbers show what changed and what did not, in every motion tier.
 *
 *   node scripts/dev/motion-profile.mjs [--preset desktop|phone|tv] [--label baseline]
 *
 * Writes .shots/<label>/motion-<preset>.json. Needs a built dist/. Fits are good to a frame (~17 ms); expect ~1% RMSE.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, all) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : 'true']);
  return pairs;
}, []));
const presetName = args.preset ?? 'desktop';
const label = args.label ?? 'latest';

const TV_UA = 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36';
const PRESETS = {
  desktop: { viewport: { width: 1253, height: 712 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tv: { viewport: { width: 1920, height: 1080 }, userAgent: TV_UA },
};
const preset = PRESETS[presetName];
if (!preset) throw new Error(`unknown preset "${presetName}"`);

/** [series label, selector]; a selector that matches several elements yields label[0], label[1], ... */
const TRACKED = [
  ['about.cluster', '[data-enhance="about"] [data-part="cluster"]'],
  ['about.item', '[data-enhance="about"] [data-part="item"]'],
  ['popular.heading', '[data-enhance="popular"] [data-part="heading"]'],
  ['popular.card', '[data-enhance="popular"] [data-part="card"]'],
  ['menu.head', '[data-enhance="menu"] [data-part="head"]'],
  ['menu.browser', '[data-enhance="menu"] [data-part="browser"]'],
  ['follow.bg', '[data-enhance="follow"] [data-part="bg"]'],
  ['follow.art', '[data-enhance="follow"] [data-part="art"]'],
  ['follow.content', '[data-enhance="follow"] [data-part="content"]'],
  ['follow.sparkle', '[data-enhance="follow"] [data-part="sparkle"]'],
  ['visit.item', '[data-enhance="visit"] [data-part="item"]'],
];
/** Scroll order; each scene is watched from just above its trigger down to a pause that lets it finish. */
const STOPS = ['[data-enhance="about"]', '[data-enhance="popular"]', '[data-enhance="menu"]', '[data-enhance="follow"] [data-part="stage"]', '[data-enhance="visit"]'];

const EASES = {
  'power1.out': (t) => 1 - (1 - t) ** 2,
  'power2.out': (t) => 1 - (1 - t) ** 3,
  'power3.out': (t) => 1 - (1 - t) ** 4,
  'power4.out': (t) => 1 - (1 - t) ** 5,
  'expo.out': (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  'sine.out': (t) => Math.sin((t * Math.PI) / 2),
  none: (t) => t,
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Fits one sampled channel ([[ms, value], ...]) to the eases. Returns null when the channel never moves. */
function fit(samples, threshold) {
  const n = samples.length;
  const to = samples[n - 1][1];
  const dev = samples.map(([, v]) => Math.abs(v - to));
  const eps = threshold * 0.002;
  let a = n - 1;
  while (a > 0 && dev[a - 1] >= dev[a] - eps) a--; // walk back while the distance to the end state keeps shrinking going forward
  const fromDev = dev[a];
  if (fromDev < threshold) return null;
  const p = dev.slice(a).map((d) => clamp01(1 - d / fromDev));
  const t = samples.slice(a).map(([ms]) => ms / 1000);
  const k = p.findIndex((x) => x > 0.02);
  if (k < 1) return null;
  let end = p.findIndex((x) => x >= 0.995);
  if (end < 0) end = p.length - 1;
  const window = [];
  for (let i = Math.max(0, k - 2); i <= Math.min(p.length - 1, end + 3); i++) window.push([t[i], p[i]]);

  const perEase = {};
  for (const [name, f] of Object.entries(EASES)) {
    let best = null;
    for (let duration = 0.1; duration <= 2.8; duration += 0.01) {
      for (let start = t[k - 1] - 0.03; start <= t[k] + 0.001; start += 0.002) {
        let sum = 0;
        for (const [ti, pi] of window) {
          const d = f(clamp01((ti - start) / duration)) - pi;
          sum += d * d;
        }
        const rmse = Math.sqrt(sum / window.length);
        if (!best || rmse < best.rmse) best = { start, duration, rmse };
      }
    }
    perEase[name] = best;
  }
  const [ease, result] = Object.entries(perEase).sort((x, y) => x[1].rmse - y[1].rmse)[0];
  const runnerUp = Object.entries(perEase).filter(([name]) => name !== ease).sort((x, y) => x[1].rmse - y[1].rmse)[0];
  return { travel: fromDev, from: samples[a][1], to, start: result.start, duration: result.duration, ease, rmse: result.rmse, runnerUp: runnerUp[0], runnerUpRmse: runnerUp[1].rmse };
}

const { base, close } = await serve('dist');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext(preset);
const page = await context.newPage();
await page.goto(`${base}/`);
await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
await page.evaluate(() => document.fonts.ready);
const env = await page.evaluate(() => ({ device: document.documentElement.dataset.device, motion: document.documentElement.dataset.motion, lenis: document.documentElement.classList.contains('lenis-smooth'), rem: parseFloat(getComputedStyle(document.documentElement).fontSize) }));

await page.evaluate((tracked) => {
  const series = [];
  for (const [name, selector] of tracked) {
    const elements = [...document.querySelectorAll(selector)];
    elements.forEach((element, index) => series.push({ name: elements.length > 1 ? `${name}[${index}]` : name, element, rows: [] }));
  }
  window.__series = series;
  window.__stop = false;
  const tick = () => {
    const t = performance.now();
    for (const s of series) {
      const cs = getComputedStyle(s.element);
      const m = cs.transform === 'none' ? null : new DOMMatrixReadOnly(cs.transform);
      s.rows.push([t, parseFloat(cs.opacity), m ? m.m41 : 0, m ? m.m42 : 0, parseFloat(cs.width) || 0, parseFloat(cs.borderTopLeftRadius) || 0]);
    }
    if (!window.__stop) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__glide = (target) => new Promise((done) => {
    const step = () => {
      const diff = target - window.scrollY;
      if (Math.abs(diff) < 2) return done();
      window.scrollTo(0, window.scrollY + Math.sign(diff) * Math.min(Math.abs(diff), 34));
      requestAnimationFrame(step);
    };
    step();
  });
}, TRACKED);

for (const stop of STOPS) {
  const target = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return Math.max(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45);
  }, stop);
  await page.evaluate((y) => window.__glide(y), target);
  await page.waitForTimeout(3600);
}
await page.evaluate(() => { window.__stop = true; });
const raw = await page.evaluate(() => window.__series.map((s) => ({ name: s.name, rows: s.rows })));
await browser.close();
close();

const CHANNELS = [['opacity', 1, 0.4, 'opacity'], ['x', 2, 2, 'px'], ['y', 3, 2, 'px'], ['width', 4, 6, 'px'], ['radius', 5, 6, 'px']];

// --dump follow.art:x   prints the raw frames of one series/channel around its movement (to inspect a poor fit).
if (args.dump) {
  const [name, channelName] = String(args.dump).split(':');
  const series = raw.find((s) => s.name === name);
  const channel = CHANNELS.find(([c]) => c === (channelName ?? 'opacity'));
  if (!series || !channel) throw new Error(`--dump: no series "${name}" or channel "${channelName}" (series: ${raw.map((s) => s.name).join(', ')})`);
  const values = series.rows.map((row) => row[channel[1]]);
  const final = values[values.length - 1];
  const moving = values.map((v, i) => [i, v]).filter(([i, v], k, all) => k > 0 && Math.abs(v - all[k - 1][1]) > 1e-6 && Math.abs(v - final) > 1e-6).map(([i]) => i);
  const from = Math.max(0, (moving[0] ?? 0) - 3);
  const to = Math.min(values.length - 1, (moving[moving.length - 1] ?? 0) + 3);
  console.log(`raw frames of ${name}:${channel[0]}  (final value ${final})`);
  const t0 = series.rows[from][0];
  for (let i = from; i <= to; i++) console.log(`  +${(series.rows[i][0] - t0).toFixed(0).padStart(5)} ms  ${values[i].toFixed(3)}`);
}
const results = [];
for (const series of raw) {
  for (const [channel, column, threshold, unit] of CHANNELS) {
    const samples = series.rows.map((row) => [row[0], row[column]]);
    const f = fit(samples, threshold);
    if (f) results.push({ series: series.name, channel, unit, ...f });
  }
}
// Start times are reported relative to the first movement in the same scene (the label before the dot).
const sceneOf = (name) => name.split('.')[0];
const sceneStart = {};
for (const r of results) sceneStart[sceneOf(r.series)] = Math.min(sceneStart[sceneOf(r.series)] ?? Infinity, r.start);
for (const r of results) r.relativeStart = r.start - sceneStart[sceneOf(r.series)];

const fmt = (x, digits = 2) => x.toFixed(digits);

// Start stalls: the longest gap between animation frames in the first 1.2 s of each scene. A smooth start stays near 17 ms;
// a reveal that hitches on its first frames (decoding a large image, promoting a layer, a long task) shows up here.
const frameTimes = raw[0].rows.map((row) => row[0] / 1000);
const stalls = Object.entries(sceneStart).map(([scene, start]) => {
  const gaps = [];
  for (let i = 1; i < frameTimes.length; i++) {
    if (frameTimes[i] >= start - 0.05 && frameTimes[i] <= start + 1.2) gaps.push((frameTimes[i] - frameTimes[i - 1]) * 1000);
  }
  return { scene, maxGapMs: Math.max(...gaps), framesOver25ms: gaps.filter((g) => g > 25).length, frames: gaps.length };
});
console.log(`preset=${presetName}  device=${env.device}  motion=${env.motion}  smooth-scroll=${env.lenis}  rem=${fmt(env.rem, 2)}px`);
console.log('series'.padEnd(20) + 'channel'.padEnd(9) + 'travel'.padStart(10) + 'start'.padStart(9) + 'dur'.padStart(8) + '  ' + 'best ease'.padEnd(12) + 'rmse'.padStart(7) + '  next best');
for (const r of results) {
  const travel = r.unit === 'opacity' ? fmt(r.travel, 2) : `${fmt(r.travel, 1)}px`;
  console.log(r.series.padEnd(20) + r.channel.padEnd(9) + travel.padStart(10) + `${fmt(r.relativeStart, 3)}s`.padStart(9) + `${fmt(r.duration, 2)}s`.padStart(8) + '  ' + r.ease.padEnd(12) + `${fmt(r.rmse * 100, 1)}%`.padStart(7) + `  ${r.runnerUp} (${fmt(r.runnerUpRmse * 100, 1)}%)`);
}
console.log('\nstart stalls (first 1.2 s of each scene; smooth = ~17 ms):');
for (const s of stalls) console.log(`  ${s.scene.padEnd(10)} longest gap ${fmt(s.maxGapMs, 0).padStart(4)} ms   frames over 25 ms: ${s.framesOver25ms} of ${s.frames}`);
const outDir = resolve(`.shots/${label}`);
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, `motion-${presetName}.json`), JSON.stringify({ preset: presetName, env, results, stalls }, null, 2));
console.log(`\nwrote ${resolve(outDir, `motion-${presetName}.json`)}`);
