/**
 * Generates the placeholder illustrations into src/assets/.
 *   npm run art
 *
 * Output is committed. Replace any generated file with a real photo/cutout of the same base name
 * (e.g. src/assets/food/pizza.png): the image catalog prefers raster files over these SVG placeholders.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { basil, drink, drop, hotDog, pizzaSlice, pizzaWhole, place, sandwich, svgDoc, tomatoHalf } from './shapes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'assets');

function write(relative, content) {
  const target = join(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  console.log('wrote', relative);
}

const single = (shape, title) =>
  svgDoc({ width: shape.width, height: shape.height, defs: shape.defs, body: shape.body.replace(/<ellipse[^>]*fill="#2b1a10"[^>]*\/>/, ''), title });

const dropAt = (x, y, scale = 1, rotate = 0, color) =>
  `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">${drop(color)}</g>`;

/* ---------- single food cutouts ---------- */
write('food/pizza.svg', single(pizzaSlice('pz'), 'Slice of pepperoni pizza'));
write('food/pizza-whole.svg', single(pizzaWhole('pw'), 'Whole pepperoni pizza'));
write('food/hotdog.svg', single(hotDog('hd'), 'Hot dog with mustard and ketchup'));
write('food/sandwich.svg', single(sandwich('sw'), 'Toasted club sandwich'));
write('food/drink.svg', single(drink('dr'), 'Takeaway drink'));
write('food/basil.svg', single(basil('bs'), 'Basil leaf'));

/* ---------- hero: slab ---------- */
function slab() {
  const L = [4, 201];
  const T = [425, 4];
  const R = [559, 118];
  const B = [138, 315];
  const t = 9;
  const pts = (...p) => p.map((q) => q.join(',')).join(' ');
  const defs = `
    <linearGradient id="slab-top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#232022"/><stop offset="0.55" stop-color="#2c2729"/><stop offset="1" stop-color="#171415"/>
    </linearGradient>
    <linearGradient id="slab-edge-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d4649"/><stop offset="1" stop-color="#1f1b1d"/></linearGradient>
    <linearGradient id="slab-edge-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312c2e"/><stop offset="1" stop-color="#121011"/></linearGradient>
    <linearGradient id="slab-gloss" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity="0.13"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="slab-blur" x="-20%" y="-30%" width="140%" height="190%"><feGaussianBlur stdDeviation="14"/></filter>`;
  const body = `
    <polygon points="${pts([L[0] + 18, L[1] + 34], [T[0] + 18, T[1] + 34], [R[0] + 18, R[1] + 34], [B[0] + 18, B[1] + 48])}" fill="#5a2a14" opacity="0.26" filter="url(#slab-blur)"/>
    <polygon points="${pts(L, B, [B[0], B[1] + t], [L[0], L[1] + t])}" fill="url(#slab-edge-l)" stroke="url(#slab-edge-l)" stroke-width="6" stroke-linejoin="round"/>
    <polygon points="${pts(B, R, [R[0], R[1] + t], [B[0], B[1] + t])}" fill="url(#slab-edge-r)" stroke="url(#slab-edge-r)" stroke-width="6" stroke-linejoin="round"/>
    <polygon points="${pts(L, T, R, B)}" fill="url(#slab-top)" stroke="url(#slab-top)" stroke-width="10" stroke-linejoin="round"/>
    <polygon points="${pts(L, T, R, B)}" fill="url(#slab-gloss)"/>
    <polyline points="${pts(L, B, R)}" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="1.6" stroke-linejoin="round"/>`;
  // Padded viewBox (640 x 430) so the blurred cast shadow is never clipped; content is shifted by (30, 24).
  return svgDoc({ width: 640, height: 430, defs, body: `<g transform="translate(30 24)">${body}</g>`, title: 'Dark serving slab' });
}
write('hero/slab.svg', slab());

/* ---------- about: food cluster + contour circle ---------- */
function cluster() {
  const hd = hotDog('c-hd');
  const sw = sandwich('c-sw');
  const pz = pizzaSlice('c-pz');
  const bs = basil('c-bs');
  const defs = [hd.defs, sw.defs, pz.defs, bs.defs].join('');
  const body = [
    place(sw, { cx: 340, cy: 104, scale: 0.8, rotate: 4 }),
    place(pz, { cx: 410, cy: 252, scale: 0.84, rotate: -4 }),
    place(hd, { cx: 168, cy: 244, scale: 0.86, rotate: -9 }),
    place(bs, { cx: 292, cy: 64, scale: 0.42, rotate: 28 }),
    place(bs, { cx: 488, cy: 168, scale: 0.36, rotate: 70 }),
    place(bs, { cx: 322, cy: 330, scale: 0.34, rotate: -35 }),
    dropAt(40, 150, 1.1, 20),
    dropAt(74, 118, 0.8, -10),
    dropAt(250, 300, 0.9, 30),
    dropAt(470, 262, 1, -20),
    dropAt(222, 40, 0.7, 10, '#F29A1F'),
  ].join('');
  return svgDoc({ width: 540, height: 360, defs, body, title: 'Hot dog, sandwich and pizza' });
}
write('about/cluster.svg', cluster());

function contour() {
  const cx = 100;
  const cy = 100;
  const rings = 7;
  const samples = 40;
  const paths = [];
  for (let i = 0; i < rings; i += 1) {
    const base = 12 + i * 13;
    const pts = [];
    for (let s = 0; s < samples; s += 1) {
      const a = (s / samples) * Math.PI * 2;
      const wobble = 5 * Math.sin(3 * a + i * 0.9) + 3.2 * Math.cos(5 * a - i * 1.7) + 2 * Math.sin(2 * a + i);
      const r = base + wobble * (0.5 + i / rings);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let s = 0; s < samples; s += 1) {
      const p0 = pts[(s - 1 + samples) % samples];
      const p1 = pts[s];
      const p2 = pts[(s + 1) % samples];
      const p3 = pts[(s + 2) % samples];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    paths.push(`<path d="${d}Z"/>`);
  }
  const body = `<g fill="none" stroke="#E7D295" stroke-width="1.7" stroke-linejoin="round">${paths.join('')}</g>`;
  return svgDoc({ width: 200, height: 200, body, title: 'Decorative contour lines' });
}
write('about/contour.svg', contour());

/* ---------- follow card art: pizza slice, basil, tomato (wide, like the reel's art) ---------- */
function followArt() {
  const pz = pizzaSlice('f-pz');
  const bs = basil('f-bs');
  const tm = tomatoHalf('f-tm');
  const defs = [pz.defs, bs.defs, tm.defs].join('');
  const body = [
    dropAt(300, 118, 0.9, 20),
    dropAt(150, 40, 0.7, -20, '#F29A1F'),
    place(bs, { cx: 292, cy: 52, scale: 0.46, rotate: 36 }),
    place(bs, { cx: 150, cy: 196, scale: 0.4, rotate: -48 }),
    place(pz, { cx: 208, cy: 120, scale: 0.74, rotate: 52 }),
    place(tm, { cx: 46, cy: 150, scale: 0.7 }),
    place(tm, { cx: 90, cy: 196, scale: 0.46, rotate: 40 }),
    dropAt(250, 206, 0.8, 30),
  ].join('');
  return svgDoc({ width: 340, height: 220, defs, body, title: 'Pizza slice with basil and tomatoes' });
}
write('follow/art.svg', followArt());

/* ---------- visit: stylised map with an orange pin ---------- */
function mapArt() {
  const road = (d, width) =>
    `<path d="${d}" fill="none" stroke="#E4D8D1" stroke-width="${width + 4}" stroke-linecap="round"/>
     <path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${width}" stroke-linecap="round"/>`;
  const blocks = [
    [20, 20, 110, 70], [170, 24, 140, 66], [352, 20, 120, 70], [510, 24, 110, 66],
    [20, 132, 110, 92], [352, 132, 120, 92], [510, 132, 110, 92],
    [20, 282, 100, 60], [170, 282, 140, 60], [352, 282, 120, 60], [510, 282, 110, 60],
    [20, 382, 90, 40], [170, 382, 150, 40], [352, 382, 110, 40], [510, 382, 110, 40],
  ]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#EDE4DF"/>`)
    .join('');
  const defs = `
    <linearGradient id="pin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7D31"/><stop offset="1" stop-color="#E8590C"/></linearGradient>
    <filter id="pin-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>`;
  const body = `
    <rect width="640" height="440" fill="#F6F0EC"/>
    ${blocks}
    <rect x="182" y="130" width="124" height="96" rx="14" fill="#DCEBCB"/>
    <rect x="516" y="276" width="96" height="104" rx="14" fill="#DCEBCB"/>
    <path d="M0 330C70 300 120 360 190 392L170 440H0Z" fill="#CFE3EE"/>
    ${road('M0 110H640', 18)}
    ${road('M0 252H640', 26)}
    ${road('M0 362H640', 14)}
    ${road('M150 0V440', 16)}
    ${road('M330 0V440', 28)}
    ${road('M500 0V440', 14)}
    ${road('M0 430L640 50', 20)}
    <ellipse cx="330" cy="262" rx="24" ry="7" fill="#2b1a10" opacity="0.25" filter="url(#pin-blur)"/>
    <path d="M330 262C330 262 298 224 298 202a32 32 0 1 1 64 0C362 224 330 262 330 262Z" fill="url(#pin)"/>
    <circle cx="330" cy="202" r="12" fill="#fff"/>`;
  return svgDoc({ width: 640, height: 440, defs, body, title: 'Map showing the restaurant location' });
}
write('visit/map.svg', mapArt());
