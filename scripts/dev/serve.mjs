import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon',
};

/** Tiny static file server for dist/ (dev tooling only). Resolves to { base, close }. */
export async function serve(directory = 'dist') {
  const root = resolve(directory);
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
    let file = normalize(join(root, pathname));
    if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404).end('not found'); return; }
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

/** Parses `--key value` / `--flag` CLI arguments. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  argv.forEach((token, index) => {
    if (!token.startsWith('--')) return;
    const next = argv[index + 1];
    out[token.slice(2)] = next && !next.startsWith('--') ? next : 'true';
  });
  return out;
}
