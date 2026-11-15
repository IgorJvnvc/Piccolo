/**
 * Dev tool: screenshots the built page at every `step` px of scroll (after playing every once-only scene), so a
 * reel frame can be matched to the scroll position where our page looks most like it. See match_frames.py.
 *
 *   node scripts/dev/scan.mjs [from=0] [to=4200] [step=20] [width=1253] [height=712]
 */
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { skipIntro } from './skip-intro.mjs';
import { serve } from './serve.mjs';

const [from = 0, to = 4200, step = 20, width = 1253, height = 712] = process.argv.slice(2).map(Number);
const out = resolve('.shots/scan');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const { base, close } = await serve('dist');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width, height } });
await skipIntro(context);
const page = await context.newPage();
await page.goto(`${base}/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
await page.evaluate(() => document.fonts.ready);

const total = await page.evaluate(() => document.documentElement.scrollHeight);
// Play every once-only scene first, so each shot shows the settled state.
for (let y = 0; y <= total; y += 300) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(2500);

let shots = 0;
for (let y = from; y <= Math.min(to, total - height); y += step) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(out, `y${String(y).padStart(5, '0')}.png`) });
  shots += 1;
}
console.log(`scrollHeight ${total}, ${shots} shots in ${out}`);
await browser.close();
close();
