/**
 * Placeholder illustrations for Piccolo (vector, flat + gradient).
 *
 * Each shape returns `{ defs, body, width, height }` in its own local coordinate space. IDs are namespaced
 * by the caller so several instances can live in one SVG without gradient collisions.
 *
 * Replace the generated files in src/assets with real product photos (same file names) at any time.
 */

const SHADOW = '#2b1a10';

/** A slice of pizza, tip pointing to the lower left, crust to the upper right. */
export function pizzaSlice(id) {
  const defs = `
    <linearGradient id="${id}-cheese" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#FFE585"/><stop offset="1" stop-color="#F2A91B"/></linearGradient>
    <linearGradient id="${id}-crust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3C46C"/><stop offset="1" stop-color="#BF7A28"/></linearGradient>
    <radialGradient id="${id}-pep" cx="0.38" cy="0.34" r="0.78"><stop offset="0" stop-color="#EE684D"/><stop offset="0.7" stop-color="#C93A2B"/><stop offset="1" stop-color="#A12619"/></radialGradient>`;

  const pep = (x, y, r) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}-pep)" stroke="#97220F" stroke-width="1.6"/>
    <circle cx="${x}" cy="${y}" r="${(r * 0.6).toFixed(1)}" fill="none" stroke="#F4907A" stroke-width="1.2" opacity="0.35"/>
    <circle cx="${(x - r * 0.32).toFixed(1)}" cy="${(y - r * 0.34).toFixed(1)}" r="${(r * 0.15).toFixed(1)}" fill="#FFD6CA" opacity="0.75"/>`;

  const body = `
    <ellipse cx="128" cy="240" rx="94" ry="8" fill="${SHADOW}" opacity="0.14"/>
    <path d="M34 206c-12 16-8 38 4 38 12 0 14-16 10-30Z" fill="url(#${id}-cheese)"/>
    <ellipse cx="33" cy="228" rx="3" ry="7.5" fill="#FFF6BD" opacity="0.75"/>
    <path d="M38 214 84 50Q180 24 207 122Z" fill="url(#${id}-cheese)"/>
    <path d="M86 34Q190 6 222 118" fill="none" stroke="url(#${id}-crust)" stroke-width="30" stroke-linecap="round"/>
    <path d="M88 25Q188-1 215 106" fill="none" stroke="#FADB9A" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <g fill="#B66D1C" opacity="0.5">
      <circle cx="106" cy="30" r="2.8"/><circle cx="133" cy="29" r="2.6"/><circle cx="153" cy="34" r="3.2"/>
      <circle cx="172" cy="42" r="2.8"/><circle cx="190" cy="56" r="3.2"/><circle cx="201" cy="72" r="2.8"/><circle cx="212" cy="96" r="2.6"/>
    </g>
    ${pep(118, 90, 19)}${pep(170, 114, 16)}${pep(88, 136, 17)}${pep(122, 152, 12)}${pep(66, 186, 10)}
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
    <linearGradient id="${id}-bunback" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBAA58"/><stop offset="1" stop-color="#BB7629"/></linearGradient>
    <linearGradient id="${id}-sausage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CC5733"/><stop offset="1" stop-color="#86241A"/></linearGradient>
    <linearGradient id="${id}-bunfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAD494"/><stop offset="1" stop-color="#DE9C46"/></linearGradient>`;

  const wave = (startX, y, amp, seg, count) =>
    `M${startX} ${y}q${seg / 2} ${-amp * 2} ${seg} 0${`t${seg} 0`.repeat(count - 1)}`;

  const body = `
    <ellipse cx="190" cy="196" rx="172" ry="10" fill="${SHADOW}" opacity="0.14"/>
    <rect x="18" y="66" width="344" height="108" rx="54" fill="url(#${id}-bunback)"/>
    <rect x="2" y="56" width="376" height="56" rx="28" fill="url(#${id}-sausage)"/>
    <rect x="20" y="62" width="340" height="9" rx="4.5" fill="#fff" opacity="0.22"/>
    <path d="${wave(30, 84, 8, 28, 11)}" fill="none" stroke="#F8CB1F" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${wave(44, 94, 7, 28, 10)}" fill="none" stroke="#D4301E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="22" y="100" width="336" height="76" rx="38" fill="url(#${id}-bunfront)"/>
    <path d="M34 110Q190 98 346 110" fill="none" stroke="#FFE9BE" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
    <path d="M40 156Q190 172 340 156" fill="none" stroke="#B97626" stroke-width="3" stroke-linecap="round" opacity="0.25"/>`;

  return { defs, body, width: 380, height: 210 };
}

/** A toasted club sandwich with a toothpick, front view. */
export function sandwich(id) {
  const defs = `
    <linearGradient id="${id}-bread" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2C98B"/><stop offset="1" stop-color="#D89E55"/></linearGradient>
    <linearGradient id="${id}-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5CF92"/><stop offset="1" stop-color="#D6954B"/></linearGradient>`;

  const ripple = (startX, y, seg, count, amp) =>
    `M${startX} ${y}q${seg / 2} ${-amp} ${seg} 0${`t${seg} 0`.repeat(count - 1)}`;

  const body = `
    <ellipse cx="140" cy="216" rx="120" ry="8" fill="${SHADOW}" opacity="0.14"/>
    <path d="M20 180H260V192Q260 206 246 206H34Q20 206 20 192Z" fill="url(#${id}-bread)"/>
    <path d="M20 180H260V185H20Z" fill="#B3732B" opacity="0.35"/>
    <path d="M14 162H266V178q-12 12-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0t-24 0Z" fill="#F29FA3"/>
    <path d="${ripple(12, 150, 20, 13, 22)}" fill="none" stroke="#5FB041" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(12, 146, 20, 13, 22)}" fill="none" stroke="#86CF5B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    <ellipse cx="68" cy="143" rx="28" ry="9.5" fill="#E2412F"/><ellipse cx="140" cy="146" rx="30" ry="10" fill="#E2412F"/><ellipse cx="212" cy="143" rx="28" ry="9.5" fill="#E2412F"/>
    <ellipse cx="68" cy="141" rx="20" ry="5" fill="#F47866" opacity="0.7"/><ellipse cx="140" cy="144" rx="22" ry="5.5" fill="#F47866" opacity="0.7"/><ellipse cx="212" cy="141" rx="20" ry="5" fill="#F47866" opacity="0.7"/>
    <path d="M24 124H256V136H170L158 156L146 136H24Z" fill="#FFD53F"/>
    <path d="M24 124H256V128H24Z" fill="#fff" opacity="0.3"/>
    <path d="M18 126V112Q18 62 140 62Q262 62 262 112V126Z" fill="url(#${id}-top)"/>
    <g stroke="#8B5A2B" stroke-width="6" stroke-linecap="round" opacity="0.5">
      <path d="M72 84 90 114"/><path d="M110 74 128 114"/><path d="M150 72 168 114"/><path d="M190 76 208 114"/><path d="M226 90 238 114"/>
    </g>
    <path d="M40 92Q90 66 150 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
    <line x1="140" y1="64" x2="140" y2="16" stroke="#E9CD90" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="140" cy="20" rx="11" ry="9" fill="#6B7B2B"/><circle cx="140" cy="20" r="3.5" fill="#D6402E"/>`;

  return { defs, body, width: 280, height: 226 };
}

/** A takeaway cup with a straw and the Piccolo "P" on an orange band. */
export function drink(id) {
  const defs = `
    <linearGradient id="${id}-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FBF7F6"/><stop offset="1" stop-color="#EAE3E1"/></linearGradient>
    <linearGradient id="${id}-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7B2E"/><stop offset="1" stop-color="#EE600F"/></linearGradient>`;

  const body = `
    <ellipse cx="75" cy="266" rx="46" ry="6" fill="${SHADOW}" opacity="0.16"/>
    <line x1="88" y1="64" x2="108" y2="8" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <line x1="88" y1="64" x2="108" y2="8" stroke="#E5342A" stroke-width="9" stroke-linecap="round" stroke-dasharray="7 7"/>
    <path d="M16 78Q16 56 36 56H114Q134 56 134 78Z" fill="#2E2A30"/>
    <rect x="10" y="72" width="130" height="13" rx="6.5" fill="#443E47"/>
    <path d="M20 85H130L116 246Q114 262 98 262H52Q36 262 34 246Z" fill="url(#${id}-cup)"/>
    <path d="M23.2 120H126.8L120.8 190H29.2Z" fill="url(#${id}-band)"/>
    <circle cx="75" cy="155" r="21" fill="#fff"/>
    <text x="75" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="30" fill="#EE600F">P</text>
    <path d="M30 96 40 238" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.4"/>
    <path d="M119 96 109 238" stroke="#000" stroke-width="10" stroke-linecap="round" opacity="0.06"/>
    <g fill="#fff" opacity="0.7"><circle cx="50" cy="214" r="3"/><circle cx="98" cy="228" r="2.4"/><circle cx="62" cy="238" r="2"/></g>`;

  return { defs, body, width: 150, height: 272 };
}

/** One basil leaf (pointing up). */
export function basil(id) {
  const defs = `<linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63B94E"/><stop offset="1" stop-color="#2A8139"/></linearGradient>`;
  const body = `
    <path d="M50 4C84 26 96 64 70 112c-8 12-14 16-20 16s-12-4-20-16C4 64 16 26 50 4Z" fill="url(#${id}-leaf)"/>
    <path d="M50 14V122M50 52 34 40M50 52 66 40M50 80 30 66M50 80 70 66" fill="none" stroke="#1F6A2D" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>`;
  return { defs, body, width: 100, height: 130 };
}

/** A halved cherry tomato. */
export function tomatoHalf(id) {
  const defs = `<radialGradient id="${id}-t" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#F5705A"/><stop offset="1" stop-color="#C8301F"/></radialGradient>`;
  const body = `
    <circle cx="30" cy="30" r="28" fill="url(#${id}-t)"/>
    <circle cx="30" cy="30" r="20" fill="#F98A74" opacity="0.55"/>
    <g fill="#FFE9A8"><ellipse cx="30" cy="16" rx="3" ry="5"/><ellipse cx="43" cy="30" rx="5" ry="3"/><ellipse cx="30" cy="44" rx="3" ry="5"/><ellipse cx="17" cy="30" rx="5" ry="3"/></g>
    <circle cx="30" cy="30" r="4" fill="#E64A33"/>`;
  return { defs, body, width: 60, height: 60 };
}

/** Sauce drops scattered by the caller. */
export function drop(color = '#D6301F') {
  return `<path d="M0-9C6-1 8 4 0 8-8 4-6-1 0-9Z" fill="${color}" opacity="0.9"/>`;
}

/** Wooden skewer pair (the "diagonal prop" of the follow-card art). */
export function rods(id, length = 200) {
  const defs = `<linearGradient id="${id}-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A58"/><stop offset="0.5" stop-color="#8A5330"/><stop offset="1" stop-color="#4C2C18"/></linearGradient>`;
  const body = `
    <path d="M0 0H${length}L${length + 14} 5 ${length} 10H0Z" fill="url(#${id}-w)"/>
    <path d="M0 14H${length}L${length + 14} 19 ${length} 24H0Z" fill="url(#${id}-w)"/>
    <path d="M4 2H${length - 6}" stroke="#F2C894" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
    <path d="M4 16H${length - 6}" stroke="#F2C894" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`;
  return { defs, body, width: length + 14, height: 24 };
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
