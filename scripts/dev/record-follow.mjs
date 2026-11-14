/**
 * Dev tool: scrolls toward the Follow card with real mouse-wheel events (the reel was scrolled by hand) while
 * capturing CDP screencast frames with timestamps, so the expansion can be measured frame by frame.
 *
 *   node scripts/dev/record-follow.mjs --out .shots/follow
 *
 * Output: <out>/frames/f_<ms since first wheel + 100000>.jpg and <out>/marks.json.
 * Measure with: python scripts/dev/track_card.py <out>/frames
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { parseArgs, serve } from './serve.mjs';

const args = parseArgs();
const width = Number(args.width ?? 1253);
const height = Number(args.height ?? 712);
const out = resolve(args.out ?? '.shots/follow');
const framesDir = join(out, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const { base, close } = await serve('dist');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width, height } });
const page = await context.newPage();
await page.goto(`${base}/`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const stageTop = await page.evaluate(() => {
  const stage = document.querySelector('#offers [data-part="stage"]');
  return stage.getBoundingClientRect().top + window.scrollY;
});
// Park the card just below the fold (do not trigger it), then start capturing.
await page.evaluate((y) => window.scrollTo(0, y), stageTop - Number(args.park ?? 820));
await page.waitForTimeout(1500);

const client = await context.newCDPSession(page);
const frames = [];
client.on('Page.screencastFrame', (event) => {
  frames.push({ data: event.data, at: event.metadata.timestamp * 1000 });
  client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => undefined);
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
await page.waitForTimeout(300);

await page.mouse.move(width / 2, height / 2);
const wheelStart = Date.now();
for (let i = 0; i < Number(args.notches ?? 6); i += 1) {
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(80);
}
await page.waitForTimeout(2600);
await client.send('Page.stopScreencast');

const finalState = await page.evaluate(() => {
  const stage = document.querySelector('#offers [data-part="stage"]');
  return { state: stage.dataset.state, width: Math.round(stage.getBoundingClientRect().width) };
});
await browser.close();
close();

for (const frame of frames) {
  const ms = Math.round(frame.at - wheelStart) + 100000;
  writeFileSync(join(framesDir, `f_${String(ms).padStart(7, '0')}.jpg`), Buffer.from(frame.data, 'base64'));
}
writeFileSync(join(out, 'marks.json'), JSON.stringify({ frames: frames.length, finalState }, null, 2));
console.log(`captured ${frames.length} frames; final`, JSON.stringify(finalState));
