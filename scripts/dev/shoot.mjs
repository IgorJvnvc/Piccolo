/**
 * Dev tool: serves dist/ and screenshots the page with the system Chrome (no browser download).
 *
 *   node scripts/dev/shoot.mjs --width 1253 --height 712 --scrolls 0,900,1800 --out .shots/desktop
 *
 * Flags: --path (default /, e.g. /404.html) --width --height --scrolls (comma list of y px, or "end") --out --wait (ms after load, default 3000)
 *        --dpr --ua (user agent) --touch (emulate touch) --reduced (prefers-reduced-motion) --full (full-page shot)
 * Prints console errors / page errors / failed requests, and the <html> data attributes.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, token, index, all) => {
    if (token.startsWith('--')) {
      const next = all[index + 1];
      pairs.push([token.slice(2), next && !next.startsWith('--') ? next : 'true']);
    }
    return pairs;
  }, []),
);

const width = Number(args.width ?? 1253);
const height = Number(args.height ?? 712);
const scrolls = String(args.scrolls ?? '0').split(',');
const out = resolve(args.out ?? '.shots/default');
const waitMs = Number(args.wait ?? 3000);
const dist = resolve('dist');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon',
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
  let file = normalize(join(dist, pathname));
  if (!file.startsWith(dist)) { response.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { response.writeHead(404).end('not found'); return; }
  response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: Number(args.dpr ?? 1),
  hasTouch: args.touch === 'true',
  isMobile: args.touch === 'true',
  reducedMotion: args.reduced === 'true' ? 'reduce' : 'no-preference',
  ...(args.ua ? { userAgent: args.ua } : {}),
});
const page = await context.newPage();

const problems = [];
page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) problems.push(`console.${message.type()}: ${message.text()}`); });
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
page.on('response', (response) => { if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`); });

await page.goto(`${base}${args.path ?? '/'}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(waitMs);

const attrs = await page.evaluate(() => {
  const html = document.documentElement;
  return { class: html.className, device: html.dataset.device, motion: html.dataset.motion, pointer: html.dataset.pointer, scrollHeight: document.documentElement.scrollHeight, ready: window.__PICCOLO_READY__ };
});
console.log('html:', JSON.stringify(attrs));

for (const token of scrolls) {
  // "sel:<css>@<y>" scrolls so the element's TOP edge sits at y px from the viewport top (handy to match reel frames).
  let y;
  if (token.startsWith('sel:')) {
    const [selector, at] = token.slice(4).split('@');
    y = await page.evaluate(([sel, target]) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return Math.max(0, r.top + window.scrollY - target); }, [selector, Number(at)]);
  } else {
    y = token === 'end' ? await page.evaluate(() => document.documentElement.scrollHeight) : Number(token);
  }
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(Number(args.settle ?? 1600));
  const name = token.startsWith('sel:') ? `s${scrolls.indexOf(token)}.png` : `y${token}.png`;
  await page.screenshot({ path: join(out, name), fullPage: args.full === 'true' });
  console.log('shot', name, 'scrollY=', await page.evaluate(() => Math.round(window.scrollY)));
}

if (args.overflow) {
  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth; const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
        const path = [];
        for (let n = el; n && n !== document.body && path.length < 3; n = n.parentElement) path.unshift(n.tagName.toLowerCase() + '.' + String(n.className?.baseVal ?? n.className).split(' ')[0]);
        out.push(path.join(' > ') + ' left=' + Math.round(r.left) + ' right=' + Math.round(r.right));
      }
    }
    return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: out.slice(0, 25) };
  });
  console.log('overflow:', JSON.stringify(offenders, null, 1));
}

console.log(problems.length ? `PROBLEMS (${problems.length}):\n  ${[...new Set(problems)].join('\n  ')}` : 'no console problems');
await browser.close();
server.close();
