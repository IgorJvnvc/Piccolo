/**
 * Dev tool: stall lab. How much of a scene's or dialog's start does a slow first frame swallow, and which lever helps?
 *
 *   node scripts/dev/stall-lab.mjs <dist> <desktop|phone|tv> <variant[,variant...]> [rounds=3]
 *
 * For every run it starts a NEW headless Chrome (a visitor's first page view starts a cold GPU process and compiles shaders,
 * and that is where the stalls are; a warm browser shows almost none), scrolls through the page as the motion profile does,
 * samples each scene's first target on every animation frame, then opens the quick view from inside the page. Rounds
 * interleave the variants, and every number is the median over the rounds.
 *
 * A variant is `name` (applied to <dist>) or `name@<other dist>` (the same, against another build, to A/B two builds):
 *
 *   control    nothing
 *   wc         will-change: transform, opacity on every reveal target and the Follow parts
 *   wcabout    the same on the About cluster only
 *   nofilter, noblur, noshadow, nofx    drop-shadow filters / backdrop blur / box shadows / all three off
 *   decode     every image loaded and decoded before the page is scrolled
 *
 * Injected after load (CSS or JS), so a hypothesis needs no rebuild. Series: about, popular, menu, follow, visit, quickview.
 * Metrics, per series:
 *
 *   gap      ms between the frame before the first frame that shows motion, and that frame
 *   worst    the longest gap between two frames in the next 700 ms: the stall
 *   jump     the biggest change of the animated value between two frames in that time (opacity x100; Follow: px of width):
 *            how much of the animation a stall skipped
 *   seen     how far the value already was in the first frame that shows it (opacity x100; Follow: px)
 *   frames   frames drawn in the next 400 ms (the quick view: frames with the fade between 5% and 95%)
 *
 * Headless Chrome here is software-rendered, so the absolute numbers are bigger than on a GPU: read them relatively.
 */
import { chromium } from 'playwright-core';
import { skipIntro } from './skip-intro.mjs';
import { serve } from './serve.mjs';

const [dist = 'dist', presetName = 'desktop', variantArg = 'control', roundsArg = '3'] = process.argv.slice(2);
const rounds = Number(roundsArg);
const PRESETS = {
  desktop: { viewport: { width: 1253, height: 712 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tv: {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36',
  },
};
if (!PRESETS[presetName]) throw new Error(`unknown preset "${presetName}"`);

const REVEALING = '[data-reveal], [data-enhance="follow"] [data-part], [data-enhance="about"] [data-part="cluster"]';
const decodeEverything = async () => {
  const images = [...document.images];
  for (const image of images) image.loading = 'eager';
  await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
};
const VARIANTS = {
  control: {},
  wc: { css: `${REVEALING} { will-change: transform, opacity; }` },
  wcabout: { css: '[data-enhance="about"] [data-part="cluster"] { will-change: transform, opacity; }' },
  nofilter: { css: 'img, svg { filter: none !important; }' },
  noblur: { css: '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }' },
  noshadow: { css: '* { box-shadow: none !important; }' },
  nofx: { css: '* { box-shadow: none !important; backdrop-filter: none !important; } img, svg { filter: none !important; }' },
  decode: { js: decodeEverything },
};

const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** What each scene is watched by: an expression evaluated on every frame. */
const opacityOf = (selector) => `(() => { const el = document.querySelector('${selector}'); return el ? Number(getComputedStyle(el).opacity) : -1; })()`;
const SCENES = [
  { name: 'about', root: '[data-enhance="about"]', rises: true, read: opacityOf('[data-enhance="about"] [data-part="cluster"]') },
  { name: 'popular', root: '[data-enhance="popular"]', rises: true, read: opacityOf('[data-enhance="popular"] [data-part="card"]') },
  { name: 'menu', root: '[data-enhance="menu"]', rises: true, read: opacityOf('[data-enhance="menu"] [data-part="head"]') },
  {
    name: 'follow',
    root: '[data-enhance="follow"] [data-part="stage"]',
    rises: false,
    read: `(() => { const el = document.querySelector('[data-enhance="follow"] [data-part="bg"]'); return el ? el.getBoundingClientRect().width : -1; })()`,
  },
  { name: 'visit', root: '[data-enhance="visit"]', rises: true, read: opacityOf('[data-enhance="visit"] [data-part="item"]') },
];
const QUICK_VIEW = '[role="dialog"][aria-labelledby="quick-view-title"]';

/** From rows of [t, value]: the stall in front of the first frame that shows motion, how much that frame showed, and what the next 700 ms were like. */
function startStats(rows, rises) {
  const base = rows[0]?.[1] ?? 0;
  const index = rows.findIndex((row, i) => i > 0 && (rises ? row[1] > base + 0.02 : Math.abs(row[1] - base) > 2));
  if (index < 1) return { gap: NaN, seen: NaN, worst: NaN, jump: NaN, frames: NaN };
  const window = rows.slice(index - 1, index + 40).filter((row) => row[0] - rows[index][0] < 700);
  let worst = 0;
  let jump = 0;
  for (let i = 1; i < window.length; i += 1) {
    worst = Math.max(worst, window[i][0] - window[i - 1][0]);
    jump = Math.max(jump, Math.abs(window[i][1] - window[i - 1][1]));
  }
  return {
    gap: rows[index][0] - rows[index - 1][0],
    seen: rows[index][1],
    worst,
    jump,
    frames: rows.filter((row) => row[0] >= rows[index][0] && row[0] - rows[index][0] < 400).length,
  };
}

const servers = new Map();
async function baseFor(directory) {
  if (!servers.has(directory)) servers.set(directory, await serve(directory));
  return servers.get(directory).base;
}

async function run(spec) {
  const variant = VARIANTS[spec.name];
  if (!variant) throw new Error(`unknown variant "${spec.name}"`);
  const base = await baseFor(spec.dir ?? dist);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext(PRESETS[presetName]);
await skipIntro(context);
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
  await page.evaluate(() => document.fonts.ready);
  if (variant.css) await page.addStyleTag({ content: variant.css });
  if (variant.js) await page.evaluate(variant.js);
  await page.waitForTimeout(1200);

  const result = {};
  for (const scene of SCENES) {
    const y = await page.evaluate(
      (selector) => Math.max(0, document.querySelector(selector).getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45),
      scene.root,
    );
    // Watch the scene's target on every frame while gliding to it, then let the scene play.
    const rows = await page.evaluate(
      async ({ y, read }) => {
        const evaluate = new Function(`return (${read})`);
        const frames = [];
        let done = false;
        const tick = () => {
          frames.push([performance.now(), evaluate()]);
          if (!done) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        await new Promise((resolve) => {
          const step = () => {
            const diff = y - window.scrollY;
            if (Math.abs(diff) < 2) return resolve();
            window.scrollTo({ top: window.scrollY + Math.sign(diff) * Math.min(Math.abs(diff), 34), behavior: 'instant' });
            requestAnimationFrame(step);
          };
          step();
        });
        await new Promise((resolve) => setTimeout(resolve, 2800));
        done = true;
        return frames;
      },
      { y, read: scene.read },
    );
    result[scene.name] = startStats(rows, scene.rises);
  }

  // The quick view, opened from inside the page so that no test latency is in the way.
  await page.evaluate(() => document.querySelector('#menu').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(600);
  const recorded = await page.evaluate(
    ({ selector }) =>
      new Promise((resolve) => {
        const rows = [];
        let clickedAt = 0;
        const t0 = performance.now();
        const tick = () => {
          const t = performance.now();
          const dialog = document.querySelector(selector);
          rows.push([t, dialog ? Number(getComputedStyle(dialog).opacity) : -1]);
          if (!clickedAt && t - t0 > 200) {
            clickedAt = performance.now();
            document.querySelector('#menu [data-details]')?.click();
          }
          if (t - t0 < 1800) requestAnimationFrame(tick);
          else resolve({ rows, clickedAt });
        };
        requestAnimationFrame(tick);
      }),
    { selector: QUICK_VIEW },
  );
  const afterClick = recorded.rows.filter((row) => row[0] >= recorded.clickedAt - 20);
  const present = afterClick.filter((row) => row[1] >= 0);
  const first = present[0];
  const before = first ? afterClick[afterClick.indexOf(first) - 1] : undefined;
  let worst = 0;
  for (let i = 1; i < afterClick.length; i += 1) {
    if (afterClick[i][0] - recorded.clickedAt < 700) worst = Math.max(worst, afterClick[i][0] - afterClick[i - 1][0]);
  }
  result.quickview = {
    gap: first && before ? first[0] - before[0] : NaN,
    seen: first ? first[1] : NaN,
    worst,
    jump: present.reduce((best, row, i) => (i ? Math.max(best, Math.abs(row[1] - present[i - 1][1])) : best), 0),
    frames: present.filter((row) => row[1] > 0.05 && row[1] < 0.95).length,
  };
  await context.close();
  await browser.close();
  return result;
}

const specs = variantArg.split(',').map((arg) => {
  const [name, dir] = arg.split('@');
  return { name, dir, label: dir ? `${name}@${dir.split(/[\\/]/).pop()}` : name };
});
const results = Object.fromEntries(specs.map((spec) => [spec.label, []]));
for (let round = 1; round <= rounds; round += 1) {
  for (const spec of specs) {
    results[spec.label].push(await run(spec));
    process.stderr.write(`round ${round} ${spec.label} done\n`);
  }
}

const SERIES = [...SCENES.map((scene) => scene.name), 'quickview'];
const percent = (metric, series) => (metric === 'seen' || metric === 'jump') && series !== 'follow';
const show = (value) => (Number.isFinite(value) ? String(Math.round(value)) : '-');
console.log(`\n${presetName}, median over ${rounds} cold runs (ms; seen and jump in % of opacity, Follow in px)`);
for (const metric of ['gap', 'worst', 'jump', 'seen', 'frames']) {
  console.log(`\n${metric}`.padEnd(14) + specs.map((spec) => spec.label.padEnd(16)).join(''));
  for (const series of SERIES) {
    const cells = specs.map((spec) => {
      const values = results[spec.label].map((one) => one[series]?.[metric]).map((value) => (percent(metric, series) ? value * 100 : value));
      return show(median(values)).padEnd(16);
    });
    console.log(series.padEnd(14) + cells.join(''));
  }
}
for (const { close } of servers.values()) close();
