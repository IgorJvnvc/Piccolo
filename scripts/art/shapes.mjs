/**
 * Placeholder illustrations for Piccolo (vector, lit from the top left).
 *
 * Each shape returns `{ defs, body, width, height }` in its own local coordinate space. IDs are namespaced
 * by the caller so several instances can live in one SVG without gradient collisions.
 *
 * The light is one: top left. Every shape has a lit edge (a rim of highlight), a core, and a shaded underside; surfaces
 * carry a little texture (pores, flecks, char) placed by a seeded generator, so the output is the same on every run.
 *
 * Replace the generated files in src/assets with real product photos (same file names) at any time.
 */

const SHADOW = '#2b1a10';

/** A small seeded generator: the same seed gives the same flecks, so `npm run art` stays deterministic. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (value) => Number(value.toFixed(1));

/**
 * Texture is a budget. Every speck is a vector element the browser has to paint, and painting an art layer is what stalls the first
 * frame of the scene that reveals it (ADR 0009), so the counts below are asked for in a generous "amount of grain" and scaled down.
 * Blur filters are avoided for the same reason: each one is an off-screen pass. Soft shade is a gradient or a faint, wider stroke.
 */
let detail = 0.45;
const scaled = (count) => (detail === 0 ? 0 : Math.max(1, Math.round(count * detail)));

/** Runs `build` with another amount of texture (0 for none): art that is decoded at the very moment its scene starts asks for less. */
export function withDetail(amount, build) {
  const previous = detail;
  detail = amount;
  try {
    return build();
  } finally {
    detail = previous;
  }
}

/** `count` round specks in the box [x0, y0, x1, y1]; the caller's group gives them their colour. */
export function specks(seed, count, [x0, y0, x1, y1], [r0, r1]) {
  const next = seeded(seed);
  return Array.from({ length: scaled(count) }, () => {
    const x = x0 + next() * (x1 - x0);
    const y = y0 + next() * (y1 - y0);
    return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r0 + next() * (r1 - r0))}"/>`;
  }).join('');
}

/** `count` tilted ovals in a box: browning on cheese, blisters on crust. */
function blobs(seed, count, [x0, y0, x1, y1], [rx0, rx1], [ry0, ry1]) {
  const next = seeded(seed);
  return Array.from({ length: scaled(count) }, () => {
    const x = x0 + next() * (x1 - x0);
    const y = y0 + next() * (y1 - y0);
    const rx = rx0 + next() * (rx1 - rx0);
    const ry = ry0 + next() * (ry1 - ry0);
    return `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry)}" transform="rotate(${n1(next() * 180)} ${n1(x)} ${n1(y)})"/>`;
  }).join('');
}

/** Specks scattered along a quadratic curve, up to `spread` to either side: flour on a crust. */
function alongCurve(seed, count, [p0, p1, p2], spread, [r0, r1]) {
  const next = seeded(seed);
  return Array.from({ length: scaled(count) }, () => {
    const t = next();
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const length = Math.hypot(dx, dy) || 1;
    const side = (next() * 2 - 1) * spread;
    return `<circle cx="${n1(x - (dy / length) * side)}" cy="${n1(y + (dx / length) * side)}" r="${n1(r0 + next() * (r1 - r0))}"/>`;
  }).join('');
}


/** One pepperoni disc (the caller defines the radial gradient `${id}-pep`): darker rim, fat flecks and a gloss. */
function pepperoni(id, x, y, r) {
  const flecks = specks(Math.round(x * 31 + y * 17), 5, [x - r * 0.55, y - r * 0.55, x + r * 0.55, y + r * 0.55], [r * 0.05, r * 0.1]);
  const gx = n1(x - r * 0.32);
  const gy = n1(y - r * 0.38);
  return `
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}-pep)" stroke="#8E1D0E" stroke-width="1.5"/>
    <circle cx="${x}" cy="${y}" r="${n1(r * 0.7)}" fill="none" stroke="#F4907A" stroke-width="1.1" opacity="0.3"/>
    <g fill="#F9B9A6" opacity="0.6">${flecks}</g>
    <ellipse cx="${gx}" cy="${gy}" rx="${n1(r * 0.3)}" ry="${n1(r * 0.16)}" transform="rotate(-32 ${gx} ${gy})" fill="#fff" opacity="0.5"/>`;
}

/** The shade under a set of pepperoni: each disc's twin, nudged down and to the right. */
const pepperoniShade = (id, discs) =>
  `<g fill="#5A1A0A" opacity="0.24">${discs
    .map(([x, y, r]) => `<ellipse cx="${n1(x + r * 0.14)}" cy="${n1(y + r * 0.24)}" rx="${r}" ry="${n1(r * 0.95)}"/>`)
    .join('')}</g>`;

/** A slice of pizza, tip pointing to the lower left, crust to the upper right. */
export function pizzaSlice(id) {
  const defs = `
    <linearGradient id="${id}-cheese" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#FFE98F"/><stop offset="0.55" stop-color="#FAC73A"/><stop offset="1" stop-color="#EC9A1B"/></linearGradient>
    <radialGradient id="${id}-melt" cx="0.42" cy="0.42" r="0.6"><stop offset="0" stop-color="#FFF6C2" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF6C2" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-crust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D283"/><stop offset="0.5" stop-color="#DDA24A"/><stop offset="1" stop-color="#AE6A22"/></linearGradient>
    <radialGradient id="${id}-pep" cx="0.38" cy="0.34" r="0.78"><stop offset="0" stop-color="#F0704F"/><stop offset="0.65" stop-color="#C93A2B"/><stop offset="1" stop-color="#9A2216"/></radialGradient>
    <clipPath id="${id}-clip"><path d="M38 214 84 44Q182 16 212 120Z"/></clipPath>`;

  const discs = [[118, 90, 19], [170, 114, 16], [88, 136, 17], [122, 152, 12], [66, 186, 10]];
  const crust = [[86, 34], [190, 6], [222, 118]];

  const body = `
    <ellipse cx="128" cy="240" rx="94" ry="8" fill="${SHADOW}" opacity="0.14"/>
    <path d="M34 206c-12 16-8 38 4 38 12 0 14-16 10-30Z" fill="url(#${id}-cheese)"/>
    <ellipse cx="33" cy="228" rx="3" ry="7.5" fill="#FFF6BD" opacity="0.8"/>
    <path d="M38 214 84 44Q182 16 212 120Z" fill="url(#${id}-cheese)"/>
    <g clip-path="url(#${id}-clip)">
      <rect x="30" y="20" width="200" height="210" fill="url(#${id}-melt)"/>
      <g fill="#D98A1E" opacity="0.38">${blobs(3, 11, [60, 50, 200, 200], [6, 14], [3, 6])}</g>
      <g fill="#FFF3B5" opacity="0.5">${blobs(5, 6, [70, 60, 190, 190], [7, 13], [3, 5])}</g>
      <path d="M84 44Q182 16 212 120" fill="none" stroke="#A9620F" stroke-width="13" opacity="0.18"/>
      <g fill="#B8681A" opacity="0.4">${specks(9, 16, [50, 40, 210, 210], [0.9, 1.8])}</g>
    </g>
    <path d="M38 214 84 44" fill="none" stroke="#FFF6C8" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <path d="M86 34Q190 6 222 118" fill="none" stroke="url(#${id}-crust)" stroke-width="30" stroke-linecap="round"/>
    <path d="M88 25Q188-1 215 106" fill="none" stroke="#FADB9A" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <path d="M92 22Q188-4 213 100" fill="none" stroke="#FFF1CF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
    <g fill="#B66D1C" opacity="0.5">
      <circle cx="106" cy="30" r="2.8"/><circle cx="133" cy="29" r="2.6"/><circle cx="153" cy="34" r="3.2"/>
      <circle cx="172" cy="42" r="2.8"/><circle cx="190" cy="56" r="3.2"/><circle cx="201" cy="72" r="2.8"/><circle cx="212" cy="96" r="2.6"/>
    </g>
    <g fill="#7A3F0E" opacity="0.32">${blobs(13, 8, [100, 18, 226, 108], [2.4, 4.4], [1.5, 2.6])}</g>
    <g fill="#fff" opacity="0.38">${alongCurve(7, 26, crust, 11, [0.6, 1.5])}</g>
    ${pepperoniShade(id, discs)}
    ${discs.map(([x, y, r]) => pepperoni(id, x, y, r)).join('')}
    <g clip-path="url(#${id}-clip)" fill="#4E8F2E" opacity="0.8">${specks(21, 14, [50, 40, 210, 210], [0.8, 1.5])}</g>
    <g fill="none" stroke="#58AA3A" stroke-width="5" stroke-linecap="round">
      <path d="M140 60q10 6 8 18"/><path d="M146 132q9 2 12 12"/><path d="M60 98q8-6 16-2"/>
    </g>
    <path d="M150 74c12-10 25-4 23 8-2 10-17 14-27 8Z" fill="#3F9B3E"/>
    <path d="M150 76 168 82" stroke="#2D7A33" stroke-width="1.5" opacity="0.7"/>`;

  return { defs, body, width: 240, height: 250 };
}

/** A hot dog with mustard and ketchup, lying horizontally. */
export function hotDog(id) {
  const defs = `
    <linearGradient id="${id}-bunback" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0B25E"/><stop offset="0.5" stop-color="#CC8837"/><stop offset="1" stop-color="#A4631E"/></linearGradient>
    <linearGradient id="${id}-sausage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8764D"/><stop offset="0.45" stop-color="#C64B2D"/><stop offset="1" stop-color="#8A281A"/></linearGradient>
    <linearGradient id="${id}-ends" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A140C" stop-opacity="0.5"/><stop offset="0.12" stop-color="#4A140C" stop-opacity="0"/><stop offset="0.88" stop-color="#4A140C" stop-opacity="0"/><stop offset="1" stop-color="#4A140C" stop-opacity="0.5"/></linearGradient>
    <linearGradient id="${id}-under" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#4A140C" stop-opacity="0"/><stop offset="1" stop-color="#4A140C" stop-opacity="0.5"/></linearGradient>
    <linearGradient id="${id}-bunfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE3AE"/><stop offset="0.4" stop-color="#F1BC68"/><stop offset="1" stop-color="#D68A38"/></linearGradient>
    <linearGradient id="${id}-bunshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A4A18" stop-opacity="0"/><stop offset="1" stop-color="#8A4A18" stop-opacity="0.38"/></linearGradient>
    <clipPath id="${id}-sclip"><rect x="2" y="56" width="376" height="56" rx="28"/></clipPath>
    <clipPath id="${id}-fclip"><rect x="22" y="100" width="336" height="76" rx="38"/></clipPath>`;

  const wave = (startX, y, amp, seg, count) =>
    `M${startX} ${y}q${seg / 2} ${-amp * 2} ${seg} 0${`t${seg} 0`.repeat(count - 1)}`;
  const marks = Array.from({ length: 15 }, (_, index) => `<path d="M${22 + index * 25} 58l-9 52"/>`).join('');

  const body = `
    <ellipse cx="190" cy="196" rx="172" ry="10" fill="${SHADOW}" opacity="0.14"/>
    <rect x="18" y="66" width="344" height="108" rx="54" fill="url(#${id}-bunback)"/>
    <rect x="2" y="56" width="376" height="56" rx="28" fill="url(#${id}-sausage)"/>
    <g clip-path="url(#${id}-sclip)">
      <rect x="2" y="56" width="376" height="56" fill="url(#${id}-ends)"/>
      <rect x="2" y="56" width="376" height="56" fill="url(#${id}-under)"/>
      <g stroke="#5E160D" stroke-width="3.2" opacity="0.2">${marks}</g>
      <path d="M30 66Q190 58 350 66" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
      <ellipse cx="96" cy="67.5" rx="34" ry="2.4" fill="#fff" opacity="0.5"/>
    </g>
    <path d="${wave(30, 84, 8, 28, 11)}" fill="none" stroke="#B8860B" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <path d="${wave(30, 84, 8, 28, 11)}" fill="none" stroke="#F8CB1F" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${wave(30, 82.2, 8, 28, 11)}" fill="none" stroke="#FFF2A8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    <path d="${wave(44, 94, 7, 28, 10)}" fill="none" stroke="#7E160C" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <path d="${wave(44, 94, 7, 28, 10)}" fill="none" stroke="#D4301E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${wave(44, 92.6, 7, 28, 10)}" fill="none" stroke="#FF8F7C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
    <rect x="22" y="100" width="336" height="76" rx="38" fill="url(#${id}-bunfront)"/>
    <g clip-path="url(#${id}-fclip)">
      <rect x="22" y="100" width="336" height="9" fill="#8A4A18" opacity="0.22"/>
      <rect x="22" y="140" width="336" height="36" fill="url(#${id}-bunshade)"/>
      <g fill="#B97626" opacity="0.28">${specks(31, 70, [26, 104, 354, 172], [0.7, 1.5])}</g>
      <path d="M44 114Q190 100 336 114" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.2"/>
    </g>
    <path d="M40 112Q190 100 340 112" fill="none" stroke="#FFEBC4" stroke-width="3.2" stroke-linecap="round" opacity="0.75"/>
    <path d="M40 156Q190 172 340 156" fill="none" stroke="#B97626" stroke-width="3" stroke-linecap="round" opacity="0.25"/>`;

  return { defs, body, width: 380, height: 210 };
}

/** A toasted club sandwich with a toothpick, front view. */
export function sandwich(id) {
  const defs = `
    <linearGradient id="${id}-bread" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4CE92"/><stop offset="1" stop-color="#D39A4E"/></linearGradient>
    <linearGradient id="${id}-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9DBA0"/><stop offset="0.55" stop-color="#E3AE60"/><stop offset="1" stop-color="#C98A3E"/></linearGradient>
    <linearGradient id="${id}-ham" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9B6B8"/><stop offset="1" stop-color="#E5808A"/></linearGradient>
    <linearGradient id="${id}-cheese" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE878"/><stop offset="1" stop-color="#F2B31F"/></linearGradient>
    <radialGradient id="${id}-tom" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#F4624C"/><stop offset="1" stop-color="#CC2E1E"/></radialGradient>
    <radialGradient id="${id}-olive" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#9DB043"/><stop offset="1" stop-color="#566622"/></radialGradient>
    <clipPath id="${id}-topclip"><path d="M18 126V112Q18 62 140 62Q262 62 262 112V126Z"/></clipPath>
    <clipPath id="${id}-botclip"><path d="M20 180H260V192Q260 206 246 206H34Q20 206 20 192Z"/></clipPath>`;

  const ripple = (startX, y, seg, count, amp) =>
    `M${startX} ${y}q${seg / 2} ${-amp} ${seg} 0${`t${seg} 0`.repeat(count - 1)}`;
  const tomatoes = [[68, 143, 28, 9.5], [140, 146, 30, 10], [212, 143, 28, 9.5]];
  const grill = ['M72 84 90 114', 'M110 74 128 114', 'M150 72 168 114', 'M190 76 208 114', 'M226 90 238 114'];

  const body = `
    <ellipse cx="140" cy="216" rx="120" ry="8" fill="${SHADOW}" opacity="0.14"/>
    <path d="M20 180H260V192Q260 206 246 206H34Q20 206 20 192Z" fill="url(#${id}-bread)"/>
    <g clip-path="url(#${id}-botclip)">
      <g fill="#A9692A" opacity="0.3">${specks(41, 34, [24, 184, 256, 204], [0.7, 1.4])}</g>
      <rect x="20" y="197" width="240" height="10" fill="#8C531C" opacity="0.25"/>
    </g>
    <path d="M20 180H260V185H20Z" fill="#B3732B" opacity="0.35"/>
    <path d="M14 162H266V178q-12 12-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0Z" fill="url(#${id}-ham)"/>
    <path d="M18 170H262" stroke="#fff" stroke-width="2" opacity="0.28"/>
    <path d="${ripple(12, 152, 20, 13, 22)}" fill="none" stroke="#3E8A2E" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(12, 150, 20, 13, 22)}" fill="none" stroke="#5FB041" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(12, 145, 20, 13, 22)}" fill="none" stroke="#A5E07A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
    ${tomatoes
      .map(
        ([cx, cy, rx, ry], index) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-tom)" stroke="#B02818" stroke-width="1.2"/>
    <ellipse cx="${cx}" cy="${cy - 2}" rx="${n1(rx * 0.72)}" ry="${n1(ry * 0.5)}" fill="#F47866" opacity="0.7"/>
    <g fill="#FFD9A0" opacity="0.8">${specks(51 + index, 6, [cx - rx * 0.45, cy - ry * 0.1, cx + rx * 0.45, cy + ry * 0.5], [0.8, 1.3])}</g>`,
      )
      .join('')}
    <rect x="26" y="134" width="228" height="8" fill="#5B1209" opacity="0.2"/>
    <path d="M24 124H256V136H170L158 156L146 136H24Z" fill="url(#${id}-cheese)"/>
    <path d="M24 124H256V128H24Z" fill="#fff" opacity="0.3"/>
    <path d="M24 136H146L158 156L170 136H256" fill="none" stroke="#C98A0E" stroke-width="1.4" opacity="0.5"/>
    <path d="M18 126V112Q18 62 140 62Q262 62 262 112V126Z" fill="url(#${id}-top)"/>
    <g clip-path="url(#${id}-topclip)">
      <g fill="#8A5522" opacity="0.32">${specks(47, 46, [20, 64, 260, 124], [0.8, 1.6])}</g>
      <rect x="18" y="114" width="244" height="12" fill="#7A4318" opacity="0.2"/>
    </g>
    <g fill="none" stroke-linecap="round">
      <g stroke="#7A4A1E" stroke-width="6" opacity="0.5">${grill.map((d) => `<path d="${d}"/>`).join('')}</g>
      <g stroke="#E2B06A" stroke-width="1.6" opacity="0.7" transform="translate(-1.6 -0.4)">${grill.map((d) => `<path d="${d}"/>`).join('')}</g>
    </g>
    <path d="M40 92Q90 66 150 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    <line x1="140" y1="64" x2="140" y2="16" stroke="#E9CD90" stroke-width="3" stroke-linecap="round"/>
    <line x1="141.2" y1="64" x2="141.2" y2="18" stroke="#B88B45" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    <ellipse cx="140" cy="20" rx="11" ry="9" fill="url(#${id}-olive)"/>
    <circle cx="140" cy="20" r="3.5" fill="#D6402E"/>
    <ellipse cx="135.6" cy="16" rx="3.4" ry="1.8" transform="rotate(-25 135.6 16)" fill="#fff" opacity="0.5"/>`;

  return { defs, body, width: 280, height: 226 };
}

/** A takeaway cup with a straw and the Piccolo "P" on an orange band. */
export function drink(id) {
  const defs = `
    <linearGradient id="${id}-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="#FCF9F8"/><stop offset="0.75" stop-color="#EDE6E3"/><stop offset="1" stop-color="#D9CFCB"/></linearGradient>
    <linearGradient id="${id}-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8133"/><stop offset="1" stop-color="#EE600F"/></linearGradient>
    <linearGradient id="${id}-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7A2A00" stop-opacity="0.26"/></linearGradient>
    <linearGradient id="${id}-foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7A8A2" stop-opacity="0"/><stop offset="1" stop-color="#B7A8A2" stop-opacity="0.4"/></linearGradient>
    <linearGradient id="${id}-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B4451"/><stop offset="1" stop-color="#26222A"/></linearGradient>
    <clipPath id="${id}-body"><path d="M20 85H130L116 246Q114 262 98 262H52Q36 262 34 246Z"/></clipPath>`;

  const drops = [[50, 214, 3], [98, 228, 2.4], [62, 238, 2], [44, 176, 2.2], [106, 198, 2.6], [88, 250, 1.8]]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.75"/><circle cx="${n1(x - r * 0.25)}" cy="${n1(y - r * 0.3)}" r="${n1(r * 0.35)}" fill="#fff"/><path d="M${n1(x - r)} ${n1(y + r * 0.2)}A${r} ${r} 0 0 0 ${n1(x + r)} ${n1(y + r * 0.2)}" fill="none" stroke="#B7A8A2" stroke-width="0.7" opacity="0.5"/>`,
    )
    .join('');

  const body = `
    <ellipse cx="75" cy="266" rx="46" ry="6" fill="${SHADOW}" opacity="0.16"/>
    <line x1="88" y1="64" x2="108" y2="8" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <line x1="88" y1="64" x2="108" y2="8" stroke="#E5342A" stroke-width="9" stroke-linecap="round" stroke-dasharray="7 7"/>
    <line x1="85.8" y1="63" x2="105.8" y2="8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <line x1="91.4" y1="65" x2="111.4" y2="9" stroke="#7A1810" stroke-width="2" stroke-linecap="round" opacity="0.22"/>
    <path d="M16 78Q16 56 36 56H114Q134 56 134 78Z" fill="url(#${id}-lid)"/>
    <path d="M24 70Q26 62 38 60H80" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.28"/>
    <rect x="10" y="72" width="130" height="13" rx="6.5" fill="#4B4452"/>
    <path d="M17 75.5H133" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.25"/>
    <path d="M20 85H130L116 246Q114 262 98 262H52Q36 262 34 246Z" fill="url(#${id}-cup)"/>
    <g clip-path="url(#${id}-body)">
      <path d="M23.2 120H126.8L120.8 190H29.2Z" fill="url(#${id}-band)"/>
      <path d="M23.2 120H126.8M29.2 190H120.8" stroke="#C94E08" stroke-width="1" opacity="0.4"/>
      <rect x="10" y="86" width="130" height="180" fill="url(#${id}-side)"/>
      <rect x="10" y="226" width="130" height="38" fill="url(#${id}-foot)"/>
      <path d="M30 96 40 238" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
    </g>
    <circle cx="75" cy="155" r="21" fill="#fff"/>
    <circle cx="75" cy="155" r="21" fill="none" stroke="#E2D9D5" stroke-width="0.8"/>
    <g transform="translate(72.75 155)"><path d="M-8 -14H3A9.5 9.5 0 0 1 3 5H-2V14H-8Z M-2 -8H3A3.5 3.5 0 0 1 3 -1H-2Z" fill="#EE600F" fill-rule="evenodd"/></g>
    ${drops}`;

  return { defs, body, width: 150, height: 272 };
}

/** One basil leaf (pointing up). */
export function basil(id) {
  const defs = `<linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6DC257"/><stop offset="1" stop-color="#2A8139"/></linearGradient>`;
  const body = `
    <path d="M50 4C84 26 96 64 70 112c-8 12-14 16-20 16s-12-4-20-16C4 64 16 26 50 4Z" fill="url(#${id}-leaf)"/>
    <path d="M50 8C28 28 14 62 34 104 24 80 28 40 50 8Z" fill="#fff" opacity="0.16"/>
    <path d="M50 14V122M50 52 34 40M50 52 66 40M50 80 30 66M50 80 70 66" fill="none" stroke="#1F6A2D" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
    <path d="M47 18V110" fill="none" stroke="#C6F0A4" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`;
  return { defs, body, width: 100, height: 130 };
}

/** A halved cherry tomato. */
export function tomatoHalf(id) {
  const defs = `<radialGradient id="${id}-t" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#F5705A"/><stop offset="1" stop-color="#C8301F"/></radialGradient>`;
  const body = `
    <circle cx="30" cy="30" r="28" fill="url(#${id}-t)" stroke="#A8271A" stroke-width="1.2"/>
    <circle cx="30" cy="30" r="20" fill="#F98A74" opacity="0.55"/>
    <g fill="#FFE9A8"><ellipse cx="30" cy="16" rx="3" ry="5"/><ellipse cx="43" cy="30" rx="5" ry="3"/><ellipse cx="30" cy="44" rx="3" ry="5"/><ellipse cx="17" cy="30" rx="5" ry="3"/></g>
    <circle cx="30" cy="30" r="4" fill="#E64A33"/>
    <path d="M12 20A22 22 0 0 1 24 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>`;
  return { defs, body, width: 60, height: 60 };
}

/** Sauce drops scattered by the caller. */
export function drop(color = '#D6301F') {
  return `<path d="M0-9C6-1 8 4 0 8-8 4-6-1 0-9Z" fill="${color}" opacity="0.9"/>`;
}

/** A whole pepperoni pizza from above, cut into six (cut lines at 30, 90 and 150 degrees). 240 x 240, centre (120, 120). */
export function pizzaWhole(id) {
  const defs = `
    <linearGradient id="${id}-cheese" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#FFE98F"/><stop offset="0.55" stop-color="#FAC73A"/><stop offset="1" stop-color="#EC9A1B"/></linearGradient>
    <radialGradient id="${id}-melt" cx="0.4" cy="0.38" r="0.62"><stop offset="0" stop-color="#FFF6C2" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF6C2" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-crust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D283"/><stop offset="0.5" stop-color="#DDA24A"/><stop offset="1" stop-color="#AE6A22"/></linearGradient>
    <radialGradient id="${id}-pep" cx="0.38" cy="0.34" r="0.78"><stop offset="0" stop-color="#F0704F"/><stop offset="0.65" stop-color="#C93A2B"/><stop offset="1" stop-color="#9A2216"/></radialGradient>
    <clipPath id="${id}-clip"><circle cx="120" cy="120" r="95"/></clipPath>`;

  const at = (angle, radius) => {
    const a = (angle * Math.PI) / 180;
    return [Number((120 + radius * Math.cos(a)).toFixed(1)), Number((120 + radius * Math.sin(a)).toFixed(1))];
  };
  // Hand-jittered rings, so six slices do not read as one slice copied six times.
  const inner = [0, 60, 120, 180, 240, 300].map((a, i) => [...at(a + [6, -5, 4, -6, 5, -4][i], 54 + [0, 4, -3, 3, -4, 2][i]), [14, 15, 13, 15, 14, 13][i]]);
  const outer = [30, 90, 150, 210, 270, 330].map((a, i) => [...at(a + [-4, 5, -6, 4, -5, 6][i], 78 + [0, -3, 2, -2, 3, -1][i]), [11, 12, 11, 12, 11, 12][i]]);
  const discs = [[120, 120, 17], ...inner, ...outer];

  const leaf = ([x, y], rotate) =>
    `<g transform="translate(${x} ${y}) rotate(${rotate}) translate(-9 0)"><path d="M0 0C5-8 15-8 18 0 15 8 5 8 0 0Z" fill="#3F9B3E"/><path d="M2 0H15" stroke="#2D7A33" stroke-width="0.8" opacity="0.7"/></g>`;
  const leaves = [leaf(at(30, 54), 40), leaf(at(150, 54), -30), leaf(at(270, 54), 70), leaf(at(0, 84), 100), leaf(at(120, 84), 20), leaf(at(240, 84), -60)].join('');

  const cuts = [30, 90, 150]
    .map((a) => {
      const [x1, y1] = at(a, 116);
      const [x2, y2] = at(a + 180, 116);
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join('');
  const bubbles = [[12, 109, 3], [41, 111, 2.6], [70, 108, 3.2], [99, 110, 2.8], [128, 109, 3.4], [160, 111, 2.6], [188, 108, 3], [216, 110, 3.2], [245, 109, 2.6], [276, 111, 3.4], [305, 108, 2.8], [337, 110, 3]]
    .map(([a, r, size]) => {
      const [x, y] = at(a, r);
      return `<circle cx="${x}" cy="${y}" r="${size}"/>`;
    })
    .join('');

  // Blisters and flour on the crust ring, placed by angle.
  const ring = (seed, count, [rMin, rMax]) => {
    const next = seeded(seed);
    return Array.from({ length: scaled(count) }, () => {
      const angle = next() * Math.PI * 2;
      const radius = rMin + next() * (rMax - rMin);
      return [n1(120 + radius * Math.cos(angle)), n1(120 + radius * Math.sin(angle)), (angle * 180) / Math.PI + 90];
    });
  };
  const blisters = ring(17, 14, [104, 113]).map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.9" transform="rotate(${n1(a)} ${x} ${y})"/>`).join('');
  const flour = ring(19, 34, [102, 114]).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9"/>`).join('');

  const body = `
    <circle cx="120" cy="120" r="116" fill="url(#${id}-crust)" stroke="#8F4F14" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M15.7 92A108 108 0 0 1 148 15.7" fill="none" stroke="#FADB9A" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <path d="M19 86A106 106 0 0 1 142 19" fill="none" stroke="#FFF1CF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
    <g fill="#B66D1C" opacity="0.5">${bubbles}</g>
    <g fill="#7A3F0E" opacity="0.3">${blisters}</g>
    <g fill="#fff" opacity="0.38">${flour}</g>
    <circle cx="120" cy="120" r="100" fill="#D6301F" opacity="0.9"/>
    <circle cx="120" cy="120" r="95" fill="url(#${id}-cheese)"/>
    <g clip-path="url(#${id}-clip)">
      <rect x="25" y="25" width="190" height="190" fill="url(#${id}-melt)"/>
      <g fill="#D98A1E" opacity="0.36">${blobs(23, 16, [30, 30, 210, 210], [8, 17], [4, 8])}</g>
      <g fill="#FFF3B5" opacity="0.5">${blobs(29, 7, [40, 40, 200, 200], [8, 15], [3.5, 6])}</g>
      <circle cx="120" cy="120" r="89" fill="none" stroke="#A9620F" stroke-width="12" opacity="0.18"/>
      <g fill="#B8681A" opacity="0.4">${specks(31, 22, [28, 28, 212, 212], [0.9, 1.8])}</g>
    </g>
    <path d="${cuts}" fill="none" stroke="#B8761A" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${cuts}" transform="translate(0.9 0.9)" fill="none" stroke="#FFF1B0" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/>
    ${leaves}
    ${pepperoniShade(id, discs)}
    ${discs.map(([x, y, r]) => pepperoni(id, x, y, r)).join('')}`;

  return { defs, body, width: 240, height: 240 };
}

/** Wraps a shape for placement inside a composed SVG: center (cx, cy), uniform scale, rotation in degrees. */
export function place(shape, { cx, cy, scale = 1, rotate = 0, flip = false }) {
  const sx = flip ? -scale : scale;
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${sx} ${scale}) translate(${-shape.width / 2} ${-shape.height / 2})">${shape.body}</g>`;
}

/** Final standalone document. */
export function svgDoc({ width, height, defs = '', body, title }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>${defs}</defs>
  ${body}
</svg>
`;
}
