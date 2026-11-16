/**
 * One picture per menu item (src/assets/menu/<item id>.svg). Same light as the rest of the art (top left): a lit edge, a core, a shaded
 * underside. Light on purpose (ADR 0013, 0015): no texture to speak of, no blur filters, a few dozen elements each, because a
 * menu page paints nine different pictures in the frame the cards rise in. The page puts a soft shadow under each, so none is drawn here.
 *
 * Replace any of them with a photo of the same name (src/assets/menu/<id>.png): the catalog prefers the raster file.
 */
import { hotDog, pizzaSlice, pizzaWhole, svgDoc, withDetail } from './shapes.mjs';

const n1 = (value) => Number(value.toFixed(1));

const stop = ([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`;
const lin = (id, stops, [x1, y1, x2, y2] = [0, 0, 0, 1]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(stop).join('')}</linearGradient>`;
const rad = (id, stops, [cx, cy, r] = [0.4, 0.35, 0.8]) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(stop).join('')}</radialGradient>`;

/** A wavy line: `count` half-waves of width `seg` and height `amp`, starting at (x, y). */
const ripple = (x, y, seg, count, amp) => `M${x} ${y}q${seg / 2} ${-amp} ${seg} 0${`t${seg} 0`.repeat(count - 1)}`;

/** A drawing from shapes.mjs without the contact shadow it carries (the page adds its own). */
const stripShadow = (shape) => ({ ...shape, body: shape.body.replace(/<ellipse[^>]*fill="#2b1a10"[^>]*\/>/, '') });
const reuse = (shape, title) => svgDoc({ width: shape.width, height: shape.height, defs: shape.defs, body: stripShadow(shape).body, title });

const BREAD = [[0, '#F9DBA0'], [0.55, '#E3AE60'], [1, '#C98A3E']];
const CRUST = [[0, '#F7D283'], [0.5, '#DDA24A'], [1, '#AE6A22']];
const CHEESE = [[0, '#FFE98F'], [0.55, '#FAC73A'], [1, '#EC9A1B']];

/* ---------- pizzas ---------- */

/** A whole pizza from above, cut in six, without toppings (240 x 240, centre 120 120). */
function pizzaBase(id) {
  const at = (angle, radius) => {
    const a = (angle * Math.PI) / 180;
    return [n1(120 + radius * Math.cos(a)), n1(120 + radius * Math.sin(a))];
  };
  const cuts = [30, 90, 150]
    .map((a) => {
      const [x1, y1] = at(a, 116);
      const [x2, y2] = at(a + 180, 116);
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join('');
  const defs = [lin(`${id}-crust`, CRUST, [0, 0, 1, 1]), lin(`${id}-cheese`, CHEESE, [0.1, 0, 0.9, 1]), rad(`${id}-melt`, [[0, '#FFF6C2', 0.5], [1, '#FFF6C2', 0]], [0.4, 0.38, 0.62])].join('');
  const body = `
    <circle cx="120" cy="120" r="116" fill="url(#${id}-crust)" stroke="#8F4F14" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M15.7 92A108 108 0 0 1 148 15.7" fill="none" stroke="#FADB9A" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <path d="M19 86A106 106 0 0 1 142 19" fill="none" stroke="#FFF1CF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
    <circle cx="120" cy="120" r="100" fill="#D6301F" opacity="0.9"/>
    <circle cx="120" cy="120" r="95" fill="url(#${id}-cheese)"/>
    <circle cx="120" cy="120" r="95" fill="url(#${id}-melt)"/>
    <path d="${cuts}" fill="none" stroke="#B8761A" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round"/>`;
  return { defs, body, at };
}

const pizzaDoc = (id, title, toppings) => {
  const base = pizzaBase(id);
  return svgDoc({ width: 240, height: 240, defs: base.defs, body: base.body + toppings(base.at), title });
};

const chickenPizza = () =>
  pizzaDoc('cp', 'Whole chicken pizza', (at) => {
    const chunk = ([x, y], turn) =>
      `<g transform="translate(${x} ${y}) rotate(${turn})"><rect x="-14" y="-9.5" width="28" height="19" rx="8" fill="#F4DDB4" stroke="#B9854A" stroke-width="1.8"/><rect x="-8" y="-6" width="12" height="4.5" rx="2.2" fill="#FFF7E6" opacity="0.8"/></g>`;
    const chunks = [at(20, 58), at(95, 52), at(165, 60), at(230, 54), at(300, 62), at(55, 84), at(130, 82), at(200, 86), at(270, 80), at(340, 84), [120, 120]]
      .map((point, index) => chunk(point, (index * 47) % 180))
      .join('');
    const pepper = [at(10, 76), at(75, 70), at(140, 74), at(210, 70), at(285, 76), at(335, 66)]
      .map(([x, y], index) => `<path d="M${x - 9} ${y}a9 9 0 0 1 18 0" fill="none" stroke="#4FA33A" stroke-width="4.5" stroke-linecap="round" transform="rotate(${index * 60} ${x} ${y})"/>`)
      .join('');
    const corn = [at(40, 44), at(120, 40), at(185, 44), at(255, 40), at(320, 44), at(30, 70), at(110, 68), at(250, 66), at(180, 72), at(310, 78), at(75, 96), at(160, 100), at(235, 98), at(350, 98)]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#FFD23F"/>`)
      .join('');
    return `${corn}${pepper}${chunks}`;
  });

const tunaPizza = () =>
  pizzaDoc('tp', 'Whole tuna pizza', (at) => {
    const flake = ([x, y], turn, tint) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="7.5" transform="rotate(${turn} ${x} ${y})" fill="${tint}"/>`;
    const tints = ['#EDB39E', '#DB947E', '#F5D2C2'];
    const flakes = [at(15, 52), at(70, 58), at(130, 54), at(190, 60), at(250, 52), at(315, 58), at(40, 82), at(105, 84), at(165, 80), at(225, 86), at(290, 82), at(350, 80), [120, 120], [104, 132], [136, 106]]
      .map((point, index) => flake(point, (index * 53) % 180, tints[index % 3]))
      .join('');
    const olives = [at(35, 70), at(100, 66), at(160, 68), at(220, 72), at(280, 66), at(335, 72)]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#2A2A2E" stroke-width="4.2"/><circle cx="${n1(x - 2)}" cy="${n1(y - 2)}" r="1.6" fill="#fff" opacity="0.5"/>`)
      .join('');
    const onion = [at(60, 92), at(130, 94), at(195, 90), at(260, 94), at(325, 90)]
      .map(([x, y], index) => `<path d="M${x - 10} ${y}a10 10 0 0 1 20 0" fill="none" stroke="#A8478F" stroke-width="2.6" stroke-linecap="round" transform="rotate(${index * 70} ${x} ${y})"/>`)
      .join('');
    return `${flakes}${onion}${olives}`;
  });

/** A calzone: a folded half moon with a thick crimped edge, a vent, and sauce and cheese pushing out at one end. */
const calzone = () => {
  const id = 'cz';
  const defs = [lin(`${id}-crust`, CRUST), lin(`${id}-cheese`, CHEESE), lin(`${id}-rim`, [[0, '#E2AE62'], [1, '#B8762E']])].join('');
  const body = `
    <path d="M16 140C16 60 66 30 130 30S244 60 244 140C200 166 60 166 16 140Z" fill="url(#${id}-crust)"/>
    <path d="M26 118C32 72 74 46 130 44" fill="none" stroke="#FFF1CF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <ellipse cx="150" cy="84" rx="48" ry="16" fill="#FFE8A8" opacity="0.3"/>
    <path d="M22 142C70 166 190 166 238 142" fill="none" stroke="url(#${id}-rim)" stroke-width="15" stroke-linecap="round" stroke-dasharray="10 5"/>
    <path d="M22 138C70 162 190 162 238 138" fill="none" stroke="#F7D790" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 5" opacity="0.8"/>
    <path d="M100 58q16 18 8 46M136 54q16 18 8 46" fill="none" stroke="#8A4A18" stroke-width="3.4" stroke-linecap="round" opacity="0.55"/>
    <path d="M232 132c18 4 22 26 4 32-14 4-22-8-16-18Z" fill="#D6301F"/>
    <path d="M226 138c14-2 24 10 14 20-8 6-18 2-18-8Z" fill="url(#${id}-cheese)"/>
    <g fill="#4FA33A"><path d="M84 70c8-8 18-4 16 4-2 8-12 8-16-4Z"/><path d="M168 98c8-8 18-4 16 4-2 8-12 8-16-4Z"/></g>
    <g fill="#fff" opacity="0.5"><circle cx="60" cy="86" r="1.8"/><circle cx="190" cy="62" r="1.6"/><circle cx="208" cy="108" r="1.8"/><circle cx="46" cy="116" r="1.5"/><circle cx="120" cy="120" r="1.8"/></g>`;
  return svgDoc({ width: 260, height: 190, defs, body, title: 'Calzone' });
};
/** A closed kraft pizza box with the Piccolo mark on the lid. */
const pizzaBox = () => {
  const id = 'pb';
  const defs = [lin(`${id}-top`, [[0, '#E6C28E'], [1, '#CFA066']], [0, 0, 1, 1]), lin(`${id}-left`, [[0, '#C79A5E'], [1, '#B08046']]), lin(`${id}-right`, [[0, '#B08046'], [1, '#98693A']])].join('');
  const body = `
    <path d="M24 118V78l68 44v40Z" fill="url(#${id}-left)"/>
    <path d="M92 122 244 74v40L92 162Z" fill="url(#${id}-right)"/>
    <path d="M24 78 176 34l68 40-152 48Z" fill="url(#${id}-top)"/>
    <path d="M24 78 176 34M24 78l68 44" fill="none" stroke="#FFF1CF" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>
    <path d="M36 87 176 46l54 32" fill="none" stroke="#9A6B38" stroke-width="1.4" opacity="0.35"/>
    <path d="M92 122V162" stroke="#7E5429" stroke-width="1.5" opacity="0.5"/>
    <g transform="matrix(1.52 -0.44 0.68 0.44 24 78)">
      <circle cx="50" cy="50" r="24" fill="#F26A12"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#FFB27A" stroke-width="2" opacity="0.6"/>
      <g transform="translate(48 50) scale(1.1)"><path d="M-8 -14H3A9.5 9.5 0 0 1 3 5H-2V14H-8Z M-2 -8H3A3.5 3.5 0 0 1 3 -1H-2Z" fill="#fff" fill-rule="evenodd"/></g>
    </g>
    <g stroke="#9A6B38" stroke-width="2.2" stroke-linecap="round" opacity="0.5"><path d="M116 134l20-6M148 124l20-6M180 114l20-6"/></g>`;
  return svgDoc({ width: 260, height: 180, defs, body, title: 'Pizza box' });
};

/* ---------- hot dogs ---------- */

/** The small hot dog: a short bun, one line of mustard. */
const smallHotDog = () => {
  const id = 'sh';
  const defs = [
    lin(`${id}-bunback`, [[0, '#F0B25E'], [0.5, '#CC8837'], [1, '#A4631E']]),
    lin(`${id}-sausage`, [[0, '#E8764D'], [0.45, '#C64B2D'], [1, '#8A281A']]),
    lin(`${id}-front`, [[0, '#FDE3AE'], [0.4, '#F1BC68'], [1, '#D68A38']]),
    lin(`${id}-shade`, [[0, '#8A4A18', 0], [1, '#8A4A18', 0.38]]),
    `<clipPath id="${id}-fclip"><rect x="16" y="92" width="228" height="62" rx="31"/></clipPath>`,
  ].join('');
  const body = `
    <rect x="12" y="62" width="236" height="90" rx="45" fill="url(#${id}-bunback)"/>
    <rect x="4" y="54" width="252" height="46" rx="23" fill="url(#${id}-sausage)"/>
    <path d="M26 62Q130 54 234 62" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.3"/>
    <path d="${ripple(24, 80, 24, 9, 7)}" fill="none" stroke="#B8860B" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <path d="${ripple(24, 80, 24, 9, 7)}" fill="none" stroke="#F8CB1F" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(24, 78.4, 24, 9, 7)}" fill="none" stroke="#FFF2A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    <rect x="16" y="92" width="228" height="62" rx="31" fill="url(#${id}-front)"/>
    <g clip-path="url(#${id}-fclip)"><rect x="16" y="128" width="228" height="26" fill="url(#${id}-shade)"/></g>
    <path d="M36 102Q130 92 224 102" fill="none" stroke="#FFEBC4" stroke-width="3" stroke-linecap="round" opacity="0.75"/>`;
  return svgDoc({ width: 260, height: 170, defs, body, title: 'Small hot dog' });
};

/* ---------- sandwiches: a roll cut open, 320 x 190 ---------- */

const lettuce = (y) => `
    <path d="${ripple(10, y, 20, 15, 20)}" fill="none" stroke="#3E8A2E" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(10, y - 2, 20, 15, 20)}" fill="none" stroke="#5FB041" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ripple(10, y - 6, 20, 15, 20)}" fill="none" stroke="#A5E07A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;

const tomatoes = (y, xs) =>
  xs.map((x) => `<ellipse cx="${x}" cy="${y}" rx="24" ry="8" fill="#E2402C" stroke="#B02818" stroke-width="1.2"/><ellipse cx="${x}" cy="${y - 2}" rx="17" ry="4" fill="#F47866" opacity="0.7"/>`).join('');

/** The roll: bottom half, `filling` between, domed scored top held above it so the filling shows. */
const roll = (id, title, filling) => {
  const defs = [lin(`${id}-bread`, [[0, '#F4CE92'], [1, '#D39A4E']]), lin(`${id}-top`, BREAD)].join('');
  const body = `
    <path d="M18 130H302V148Q302 166 282 166H38Q18 166 18 148Z" fill="url(#${id}-bread)"/>
    <path d="M18 130H302V135H18Z" fill="#B3732B" opacity="0.3"/>
    ${filling}
    <path d="M12 84Q12 26 160 24Q308 26 308 84V88H12Z" fill="url(#${id}-top)"/>
    <g stroke="#B97626" stroke-width="5.5" stroke-linecap="round" opacity="0.45"><path d="M70 44l16 32M118 34l16 42M170 32l14 44M222 38l12 38"/></g>
    <path d="M30 68Q40 36 110 28" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity="0.45"/>
    <path d="M12 88H308" stroke="#B3732B" stroke-width="2" opacity="0.35"/>`;
  return svgDoc({ width: 320, height: 180, defs, body, title });
};
const slice = (x, y, color, edge) => `<path d="M${x - 40} ${y}q10 -16 20 -2t20 -2t20 -2t20 -2t20 0v15q-10 12 -20 2t-20 2t-20 2t-20 2t-20 -2Z" fill="${color}" stroke="${edge}" stroke-width="1.4"/>`;

const hamSandwich = () =>
  roll('hs', 'Ham sandwich', `
    ${lettuce(126)}
    ${tomatoes(114, [66, 134, 202, 262])}
    <path d="M22 98h276v9H22Z" fill="#FFD84A"/><path d="M22 98h276v3H22Z" fill="#fff" opacity="0.35"/>
    ${slice(80, 88, '#F4A3A8', '#D9737F')}${slice(160, 90, '#F7B0B4', '#D9737F')}${slice(240, 88, '#F4A3A8', '#D9737F')}`);

const porkLoinSandwich = () =>
  roll('pl', 'Smoked pork loin sandwich', `
    ${lettuce(126)}
    <g fill="#9BBF4C" stroke="#6F8F30" stroke-width="1.5"><ellipse cx="70" cy="112" rx="13" ry="6"/><ellipse cx="150" cy="114" rx="13" ry="6"/><ellipse cx="236" cy="112" rx="13" ry="6"/></g>
    ${slice(72, 90, '#C77A74', '#8A3A3A')}${slice(150, 92, '#B96A66', '#8A3A3A')}${slice(228, 90, '#C77A74', '#8A3A3A')}`);

const chickenSandwich = () =>
  roll('cs', 'Chicken breast sandwich', `
    ${lettuce(126)}
    ${tomatoes(114, [66, 134, 202, 262])}
    <g stroke="#C99A5C" stroke-width="1.6">
      <rect x="26" y="90" width="86" height="17" rx="8" fill="#F6E2BC"/><rect x="104" y="92" width="86" height="17" rx="8" fill="#F9E9CB"/><rect x="182" y="90" width="86" height="17" rx="8" fill="#F6E2BC"/><rect x="238" y="94" width="62" height="15" rx="7" fill="#F9E9CB"/>
    </g>
    <g fill="#E9B773" opacity="0.75"><rect x="30" y="90" width="78" height="4" rx="2"/><rect x="108" y="92" width="78" height="4" rx="2"/><rect x="186" y="90" width="78" height="4" rx="2"/></g>`);

const kulenSandwich = () =>
  roll('ks', 'Kulen sandwich', `
    ${lettuce(126)}
    <path d="M22 100h276v9H22Z" fill="#FFD84A"/>
    ${[44, 84, 124, 164, 204, 244, 284]
      .map(
        (x, index) =>
          `<ellipse cx="${x}" cy="${index % 2 ? 96 : 100}" rx="15" ry="${index % 2 ? 17 : 15}" fill="#C8472B" stroke="#8E2A18" stroke-width="2"/><ellipse cx="${x - 4}" cy="${index % 2 ? 91 : 95}" rx="7" ry="4" fill="#E56B4A" opacity="0.7"/><g fill="#FBE3D0"><circle cx="${x + 5}" cy="${index % 2 ? 100 : 104}" r="2.2"/><circle cx="${x - 6}" cy="${index % 2 ? 104 : 106}" r="1.8"/><circle cx="${x + 7}" cy="${index % 2 ? 90 : 94}" r="1.8"/></g>`,
      )
      .join('')}`);

const tunaSandwich = () =>
  roll('ts', 'Tuna sandwich', `
    ${lettuce(126)}
    <g fill="#8DBA52" stroke="#5F8E36" stroke-width="2"><circle cx="64" cy="116" r="11"/><circle cx="132" cy="118" r="11"/><circle cx="200" cy="116" r="11"/><circle cx="268" cy="118" r="11"/></g>
    <g fill="#D3EBB0"><circle cx="64" cy="116" r="6.5"/><circle cx="132" cy="118" r="6.5"/><circle cx="200" cy="116" r="6.5"/><circle cx="268" cy="118" r="6.5"/></g>
    <path d="M14 106c0-14 14-18 26-16s16-8 32-6 18-8 34-6 20-6 34-4 18-8 34-6 20-4 34-2 18-6 32-2 18 8 26 14c4 14-8 22-26 22H34c-14 0-20-4-20-10Z" fill="#E9C4B0" stroke="#C99C84" stroke-width="1.5"/>
    <g fill="#F7DDCF" opacity="0.8"><ellipse cx="50" cy="98" rx="14" ry="5"/><ellipse cx="116" cy="94" rx="14" ry="5"/><ellipse cx="190" cy="96" rx="14" ry="5"/><ellipse cx="256" cy="94" rx="14" ry="5"/></g>
    <g fill="#CFA08A" opacity="0.7"><ellipse cx="84" cy="104" rx="10" ry="4"/><ellipse cx="156" cy="102" rx="10" ry="4"/><ellipse cx="226" cy="104" rx="10" ry="4"/></g>`);

/* ---------- a crescent roll ---------- */

const kifla = () => {
  const id = 'kf';
  const defs = lin(`${id}-bread`, [[0, '#F9DBA0'], [0.5, '#E3AE60'], [1, '#C07A32']]);
  const outer = (t) => [150 + 116 * Math.cos(Math.PI * (1 - t)), 180 - 116 * Math.sin(Math.PI * (1 - t))];
  const inner = (t) => {
    const angle = ((117.6 - t * 55.2) * Math.PI) / 180;
    return [150 + 250 * Math.cos(angle), 401.5 - 250 * Math.sin(angle)];
  };
  const ridges = [0.17, 0.3, 0.43, 0.57, 0.7, 0.83]
    .map((t) => {
      const [x1, y1] = outer(t);
      const [x2, y2] = inner(t);
      return `M${n1(x1)} ${n1(y1)}L${n1(x2)} ${n1(y2)}`;
    })
    .join('');
  const body = `
    <path d="M34 180A116 116 0 0 1 266 180A250 250 0 0 0 34 180Z" fill="url(#${id}-bread)" stroke="#C98A3E" stroke-width="8" stroke-linejoin="round"/>
    <path d="${ridges}" fill="none" stroke="#A96A24" stroke-width="3.6" stroke-linecap="round" opacity="0.5"/>
    <path d="M52 150A104 104 0 0 1 170 80" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.4"/>
    <g fill="#FFF3D6" opacity="0.85"><circle cx="96" cy="104" r="1.8"/><circle cx="150" cy="86" r="1.8"/><circle cx="204" cy="100" r="1.8"/><circle cx="130" cy="112" r="1.6"/><circle cx="176" cy="116" r="1.6"/></g>`;
  return svgDoc({ width: 300, height: 190, defs, body, title: 'Kifla' });
};

/* ---------- shared helpers for the next pictures ---------- */

/** A small seeded generator, so a re-run draws the same picture. */
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

/** `count` things scattered inside an ellipse [cx, cy, rx, ry]; `draw(x, y, index, next)` returns the markup of one. */
function scatter(seed, count, [cx, cy, rx, ry], draw) {
  const next = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const angle = next() * Math.PI * 2;
    const radius = Math.sqrt(next());
    return draw(n1(cx + Math.cos(angle) * radius * rx), n1(cy + Math.sin(angle) * radius * ry), index, next);
  }).join('');
}

/* ---------- pies, from above: a crimped rim, fruit, and a lattice over it ---------- */

const latticePie = (id, title, { filling, fruit }) => {
  const defs = [
    lin(`${id}-crust`, CRUST, [0, 0, 1, 1]),
    lin(`${id}-strip`, [[0, '#F8D68A'], [1, '#D99A48']]),
    rad(`${id}-fill`, [[0, filling[0]], [1, filling[1]]], [0.4, 0.35, 0.8]),
    `<clipPath id="${id}-clip"><circle cx="120" cy="120" r="92"/></clipPath>`,
  ].join('');
  const strips = (turn) =>
    `<g transform="rotate(${turn} 120 120)">${[36, 76, 116, 156, 196].map((y) => `<rect x="0" y="${y}" width="240" height="17" fill="url(#${id}-strip)"/><rect x="0" y="${y}" width="240" height="3.5" fill="#FFF1CF" opacity="0.6"/>`).join('')}</g>`;
  const body = `
    <circle cx="120" cy="120" r="116" fill="url(#${id}-crust)" stroke="#8F4F14" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="120" cy="120" r="104" fill="none" stroke="#B8762E" stroke-width="9" stroke-linecap="round" stroke-dasharray="0.1 13" opacity="0.65"/>
    <path d="M17 92A108 108 0 0 1 148 17" fill="none" stroke="#FFF1CF" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <circle cx="120" cy="120" r="92" fill="url(#${id}-fill)"/>
    <g clip-path="url(#${id}-clip)">${fruit}${strips(45)}${strips(-45)}</g>
    <circle cx="120" cy="120" r="92" fill="none" stroke="#B8762E" stroke-width="3" opacity="0.5"/>`;
  return svgDoc({ width: 240, height: 240, defs, body, title });
};

const cherries = scatter(11, 14, [120, 120, 76, 76], (x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#8E1A2B" stroke="#5E0F1C" stroke-width="1.5"/><ellipse cx="${n1(x - 3.5)}" cy="${n1(y - 4)}" rx="3.4" ry="2" fill="#fff" opacity="0.5"/>`);
const berries = scatter(23, 18, [120, 120, 76, 76], (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#D6325A" stroke="#9C1E40" stroke-width="1.4"/><circle cx="${n1(x - 3)}" cy="${n1(y - 3)}" r="1.8" fill="#FFB3C4"/><circle cx="${n1(x + 3)}" cy="${n1(y + 1)}" r="1.5" fill="#FFB3C4"/>`);
const appleSlices = scatter(5, 14, [120, 120, 76, 76], (x, y, _i, next) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="7" transform="rotate(${n1(next() * 180)} ${x} ${y})" fill="#F6E3A1" stroke="#CFA24A" stroke-width="1.4"/>`);

/* ---------- a sweet sandwich: two slices with jam between ---------- */

const jamSandwich = (id, title, { jam, topping }) => {
  const defs = [lin(`${id}-slice`, [[0, '#FBE3B0'], [1, '#E9B96E']]), lin(`${id}-crust`, [[0, '#E2A456'], [1, '#B8762E']]), lin(`${id}-jam`, [[0, jam[0]], [1, jam[1]]])].join('');
  const body = `
    <rect x="22" y="106" width="216" height="46" rx="18" fill="url(#${id}-crust)"/>
    <rect x="30" y="110" width="200" height="36" rx="13" fill="url(#${id}-slice)"/>
    <path d="M26 104C60 94 80 112 124 102s70 10 112 0c4 14 2 22-10 28-14 6-24-4-30 8s-16 6-22 0-16 6-30 0-18 4-28 0-26 8-40 0-24 2-24-12Z" fill="url(#${id}-jam)"/>
    <path d="M40 108q20-6 40-2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    <rect x="22" y="48" width="216" height="52" rx="22" fill="url(#${id}-crust)"/>
    <rect x="30" y="54" width="200" height="40" rx="17" fill="url(#${id}-slice)"/>
    <path d="M44 64q40-8 90-6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <g fill="#fff" opacity="0.8"><circle cx="70" cy="78" r="1.8"/><circle cx="104" cy="70" r="1.6"/><circle cx="150" cy="80" r="1.8"/><circle cx="188" cy="68" r="1.6"/><circle cx="120" cy="84" r="1.5"/></g>
    ${topping}`;
  return svgDoc({ width: 260, height: 170, defs, body, title });
};

const cherryTop = `<path d="M180 52c-4-14 2-24 12-30" fill="none" stroke="#4F7F2E" stroke-width="3" stroke-linecap="round"/><circle cx="180" cy="62" r="13" fill="#8E1A2B" stroke="#5E0F1C" stroke-width="1.5"/><ellipse cx="175" cy="57" rx="4" ry="2.4" fill="#fff" opacity="0.55"/>`;
const berryTop = `<g fill="#D6325A" stroke="#9C1E40" stroke-width="1.4"><circle cx="176" cy="60" r="9"/><circle cx="192" cy="58" r="9"/><circle cx="184" cy="48" r="9"/></g><g fill="#FFB3C4"><circle cx="173" cy="57" r="1.8"/><circle cx="189" cy="55" r="1.8"/><circle cx="181" cy="45" r="1.8"/></g>`;

/* ---------- bowls: salads (a mound) and soups (a surface) ---------- */

/** A bowl. `rim` is [y of the rim's centre, its half height]: a salad's bowl is seen nearly from the side, a soup's from higher up. */
const bowl = (id, title, inside, [rimY, rimRy] = [104, 22]) => {
  const defs = [lin(`${id}-bowl`, [[0, '#FFFFFF'], [0.6, '#F1EBE7'], [1, '#D9CFCA']], [0, 0, 1, 0]), lin(`${id}-inner`, [[0, '#E2D9D3'], [1, '#F6F1ED']])].join('');
  const body = `
    <path d="M28 ${rimY}Q28 184 130 184T232 ${rimY}Z" fill="url(#${id}-bowl)"/>
    <path d="M34 ${rimY + 28}Q130 ${rimY + 54} 226 ${rimY + 28}" fill="none" stroke="#4B7FB7" stroke-width="6" opacity="0.8"/>
    <path d="M40 ${rimY + 8}Q44 ${rimY + 46} 78 168" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="130" cy="${rimY}" rx="102" ry="${rimRy}" fill="url(#${id}-inner)" stroke="#D3C9C2" stroke-width="2"/>
    ${inside}
    <path d="M28 ${rimY}Q130 ${rimY + 2 * rimRy - 10} 232 ${rimY}" fill="none" stroke="#F6F1ED" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 ${rimY}Q130 ${rimY + 2 * rimRy - 10} 232 ${rimY}" fill="none" stroke="#D3C9C2" stroke-width="1.5"/>`;
  return svgDoc({ width: 260, height: 200, defs, body, title });
};

const mound = (fill, edge, bits) =>
  `<path d="M40 104Q42 34 130 32T220 104Q130 128 40 104Z" fill="${fill}" stroke="${edge}" stroke-width="2"/><path d="M60 80Q78 48 124 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.4"/>${bits}`;
const dill = `<path d="M130 36q-4-14 6-22M130 36q8-10 20-8M130 36q-12-6-22-2" fill="none" stroke="#4F9A3A" stroke-width="2.6" stroke-linecap="round"/>`;
const PILE = [130, 78, 72, 28];

const russianSalad = () =>
  bowl('rs', 'Russian salad', mound('#F7ECE0', '#D7C7A4',
    `${scatter(3, 18, PILE, (x, y) => `<circle cx="${x}" cy="${y}" r="4.4" fill="#6DB74A" stroke="#4F8F34" stroke-width="1"/>`)}${scatter(8, 12, PILE, (x, y) => `<rect x="${x}" y="${y}" width="9" height="9" rx="1.8" fill="#F29A3C" stroke="#C9741C" stroke-width="1"/>`)}${scatter(14, 7, PILE, (x, y) => `<rect x="${x}" y="${y}" width="11" height="8" rx="2" fill="#BFD98A" stroke="#8FB04F" stroke-width="1"/>`)}${scatter(30, 5, PILE, (x, y) => `<rect x="${x}" y="${y}" width="8" height="8" rx="2" fill="#FFF8E6" stroke="#D8C9A0" stroke-width="1"/>`)}${dill}`));

const chickenSalad = () =>
  bowl('cs', 'Chicken salad', mound('#F9F1DE', '#D9C59A',
    `${scatter(5, 14, PILE, (x, y, i) => `<rect x="${x}" y="${y}" width="17" height="11" rx="5.5" transform="rotate(${i * 37 % 180} ${x} ${y})" fill="#F1D6A0" stroke="#C99A5C" stroke-width="1.5"/>`)}${scatter(9, 12, PILE, (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#6DB74A" stroke="#4F8F34" stroke-width="1"/>`)}${scatter(17, 8, PILE, (x, y) => `<rect x="${x}" y="${y}" width="8" height="8" rx="2" fill="#F29A3C"/>`)}${dill}`));

const beefSalad = () =>
  bowl('bs', 'Beef salad', mound('#F2E2D8', '#CFA894',
    `${scatter(7, 15, PILE, (x, y, i) => `<rect x="${x}" y="${y}" width="15" height="10" rx="4.5" transform="rotate(${i * 41 % 180} ${x} ${y})" fill="#A9605A" stroke="#7A3A36" stroke-width="1.4"/>`)}${scatter(12, 8, PILE, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.5" fill="#9BBF4C" stroke="#6F8F30" stroke-width="1.2"/>`)}${scatter(19, 9, PILE, (x, y) => `<rect x="${x}" y="${y}" width="8" height="8" rx="2" fill="#F29A3C"/>`)}${dill}`));

const tunaSalad = () =>
  bowl('ts2', 'Tuna salad', mound('#F6E8DF', '#D9B8A6',
    `${scatter(6, 14, PILE, (x, y, i) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" transform="rotate(${i * 43 % 180} ${x} ${y})" fill="#EDB39E" stroke="#C98A74" stroke-width="1.3"/>`)}${scatter(10, 6, PILE, (x, y) => `<circle cx="${x}" cy="${y}" r="6.5" fill="none" stroke="#2A2A2E" stroke-width="3.6"/>`)}${scatter(15, 9, PILE, (x, y) => `<circle cx="${x}" cy="${y}" r="3.8" fill="#FFD23F"/>`)}<path d="M64 74q12-26 38-26" fill="none" stroke="#5FB041" stroke-width="9" stroke-linecap="round"/>`));

/** Soup: a surface in a bowl seen from higher up, with what is in it. */
const soup = (id, title, { broth, bits }) =>
  bowl(id, title, `<ellipse cx="130" cy="92" rx="92" ry="31" fill="${broth[0]}"/><ellipse cx="130" cy="96" rx="82" ry="24" fill="${broth[1]}" opacity="0.55"/><path d="M62 86q22-8 44 0M150 84q22-8 44 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.4"/>${bits}`, [92, 40]);

const SOUP = [130, 93, 72, 22];
const steam = '<path d="M96 52q-8-12 0-22M130 46q-8-12 0-22M164 52q-8-12 0-22" fill="none" stroke="#CFC4BC" stroke-width="4" stroke-linecap="round" opacity="0.8"/>';

const chickenSoup = () =>
  soup('cso', 'Chicken soup', {
    broth: ['#F2C86A', '#E3A93A'],
    bits: `${scatter(4, 8, SOUP, (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#F29A3C" stroke="#C9741C" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="2.6" fill="#FBC98A"/>`)}${scatter(13, 9, SOUP, (x, y) => `<path d="M${x - 9} ${y}q4.5-6 9 0t9 0" fill="none" stroke="#FBEFC4" stroke-width="3.4" stroke-linecap="round"/>`)}${scatter(21, 7, SOUP, (x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#4F9A3A"/>`)}${steam}`,
  });

const beefSoup = () =>
  soup('bso', 'Beef soup', {
    broth: ['#B8742F', '#8C531C'],
    bits: `${scatter(8, 6, SOUP, (x, y) => `<rect x="${x - 8}" y="${y - 5}" width="16" height="11" rx="4.5" fill="#7A3A2A" stroke="#4E2118" stroke-width="1.4"/>`)}${scatter(2, 6, SOUP, (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#F29A3C" stroke="#C9741C" stroke-width="1.4"/>`)}${scatter(24, 5, SOUP, (x, y) => `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="2" fill="#F1DDA0"/>`)}${scatter(27, 6, SOUP, (x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#4F9A3A"/>`)}${steam}`,
  });
/* ---------- sides: cheese, meats, a spread, biscuits, jam ---------- */

const holes = (seed, count, region) => scatter(seed, count, region, (x, y, _i, next) => `<ellipse cx="${x}" cy="${y}" rx="${n1(3 + next() * 3)}" ry="${n1(2.4 + next() * 2)}" fill="#E0A21F"/>`);

const kashkaval = () => {
  const id = 'kv';
  const defs = [lin(`${id}-front`, [[0, '#FFE98F'], [1, '#F2B722']]), lin(`${id}-top`, [[0, '#FFF3B8'], [1, '#FCD25A']])].join('');
  const body = `
    <path d="M24 84 150 40l92 34-126 52Z" fill="url(#${id}-top)"/>
    <path d="M24 84v34l92 52v-44Z" fill="url(#${id}-front)"/>
    <path d="M116 126 242 74v36L116 170Z" fill="#E6A91E"/>
    <path d="M24 84 150 40" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/>
    ${holes(2, 4, [60, 120, 22, 18])}${holes(6, 3, [176, 100, 34, 14])}
    <path d="M38 98v24l30 18" fill="none" stroke="#FFF7CC" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>`;
  return svgDoc({ width: 260, height: 190, defs, body, title: 'Kashkaval cheese' });
};

/** A fan of slices of a cold cut: `rim` is the edge colour, `meat` the middle. */
const slicesFan = (id, title, { meat, rim, fleck }) => {
  const defs = lin(`${id}-meat`, [[0, meat[0]], [1, meat[1]]], [0, 0, 1, 1]);
  const slice = (x, y, turn) =>
    `<g transform="translate(${x} ${y}) rotate(${turn})"><ellipse rx="52" ry="40" fill="${rim}"/><ellipse rx="46" ry="34" fill="url(#${id}-meat)"/><ellipse cx="-14" cy="-12" rx="20" ry="8" fill="#fff" opacity="0.25"/>${fleck}</g>`;
  return svgDoc({ width: 260, height: 190, defs, body: `${slice(86, 86, -14)}${slice(150, 100, 6)}${slice(196, 80, 20)}`, title });
};

const sideHam = () => {
  const id = 'sm';
  const defs = lin(`${id}-ham`, [[0, '#F9B6B8'], [1, '#E5808A']]);
  const fold = (y, turn) =>
    `<g transform="translate(130 ${y}) rotate(${turn})"><path d="M-96 0q24-28 48 0t48 0t48 0t48 0v22q-24 24-48 0t-48 0t-48 0t-48 0Z" fill="url(#${id}-ham)" stroke="#D9737F" stroke-width="1.6"/><path d="M-90 4q22-22 44 0t44 0t44 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.35"/></g>`;
  return svgDoc({ width: 260, height: 190, defs, body: `${fold(138, -4)}${fold(104, 3)}${fold(70, -2)}`, title: 'Ham' });
};

const sideKulen = () => {
  const id = 'kl';
  const defs = lin(`${id}-skin`, [[0, '#B23A22'], [1, '#7A1E10']]);
  const round = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="#C8472B" stroke="#8E2A18" stroke-width="2.4"/><ellipse cx="${x - 8}" cy="${y - 10}" rx="12" ry="7" fill="#E56B4A" opacity="0.7"/>${scatter(x, 6, [x, y, 18, 22], (px, py) => `<circle cx="${px}" cy="${py}" r="2.4" fill="#FBE3D0"/>`)}`;
  const body = `
    <rect x="132" y="68" width="116" height="58" rx="26" fill="url(#${id}-skin)"/>
    <path d="M144 80h92" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
    <ellipse cx="136" cy="97" rx="14" ry="29" fill="#C8472B" stroke="#8E2A18" stroke-width="2.2"/>
    ${scatter(41, 6, [136, 97, 8, 20], (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="#FBE3D0"/>`)}
    ${round(64, 112)}${round(100, 58)}`;
  return svgDoc({ width: 260, height: 190, defs, body, title: 'Kulen' });
};

const sideChicken = () =>
  slicesFan('ch', 'Chicken breast', { meat: ['#FBEBCF', '#F1D6A8'], rim: '#D9A55E', fleck: '<path d="M-30 6q14 8 30 0t30 0" fill="none" stroke="#E4C28A" stroke-width="2" stroke-linecap="round"/>' });
const sidePork = () =>
  slicesFan('pk', 'Smoked pork loin', { meat: ['#D48A86', '#B5605C'], rim: '#7A2E2E', fleck: '<g fill="#F4D9D6" opacity="0.7"><circle cx="-8" cy="4" r="2.4"/><circle cx="14" cy="-6" r="2"/><circle cx="6" cy="14" r="2.2"/></g>' });

/** A jar with a lid and a label. `lid` is the cap colour, `fill` the colour of what is inside. */
const jar = (id, title, { fill, lid, label, extra = '' }) => {
  const defs = [lin(`${id}-glass`, [[0, '#FFFFFF', 0.85], [1, '#DCE6EA', 0.7]], [0, 0, 1, 0]), lin(`${id}-fill`, [[0, fill[0]], [1, fill[1]]]), lin(`${id}-lid`, [[0, lid[0]], [1, lid[1]]])].join('');
  const body = `
    <rect x="60" y="64" width="140" height="132" rx="26" fill="url(#${id}-glass)" stroke="#C9D5DA" stroke-width="2"/>
    <rect x="66" y="84" width="128" height="106" rx="22" fill="url(#${id}-fill)"/>
    <ellipse cx="116" cy="96" rx="40" ry="8" fill="#fff" opacity="0.25"/>
    <rect x="72" y="118" width="116" height="52" rx="10" fill="${label}"/>
    <circle cx="130" cy="144" r="15" fill="${fill[1]}"/><circle cx="125" cy="139" r="4" fill="#fff" opacity="0.5"/>
    <rect x="56" y="38" width="148" height="34" rx="9" fill="url(#${id}-lid)"/>
    <path d="M64 46h132" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    <path d="M74 90v90" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
    ${extra}`;
  return svgDoc({ width: 260, height: 210, defs, body, title });
};

const eurokrem = () =>
  jar('ek', 'Chocolate hazelnut spread', {
    fill: ['#8A5A3A', '#5E3620'], lid: ['#F2A33A', '#D17F18'], label: '#F8E4C4',
    extra: '<g fill="#B97626" stroke="#8A4A18" stroke-width="1.6"><ellipse cx="226" cy="178" rx="13" ry="15"/><ellipse cx="238" cy="188" rx="11" ry="13"/></g><path d="M222 168q4-4 8 0" fill="none" stroke="#F4C37A" stroke-width="2" stroke-linecap="round"/>',
  });
const jamJar = (id, title, jam, cap) =>
  jar(id, title, { fill: jam, lid: ['#F5EFE6', '#D8CFC2'], label: '#FFF7EC', extra: `<path d="M56 56h148" stroke="${cap}" stroke-width="7" stroke-dasharray="9 6" opacity="0.9"/>` });

const plazma = () => {
  const id = 'pl2';
  const defs = lin(`${id}-biscuit`, [[0, '#F2C98A'], [1, '#CF9246']], [0, 0, 1, 1]);
  const biscuit = (x, y, turn) =>
    `<g transform="translate(${x} ${y}) rotate(${turn})"><rect x="-62" y="-32" width="124" height="64" rx="9" fill="url(#${id}-biscuit)" stroke="#A8702A" stroke-width="1.6"/><path d="M-56 -26h112" stroke="#FFF1CF" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>${[-36, -12, 12, 36].map((px) => [-14, 6, 24].map((py) => `<circle cx="${px}" cy="${py}" r="2.6" fill="#A8702A" opacity="0.7"/>`).join('')).join('')}</g>`;
  return svgDoc({ width: 260, height: 190, defs, body: `${biscuit(112, 118, -12)}${biscuit(144, 86, 8)}${biscuit(120, 58, -5)}`, title: 'Plazma biscuits' });
};
/* ---------- hot drinks: a cup on a saucer seen from a little above, and one glass mug ---------- */

const steamAt = (cx, y) =>
  `<path d="M${cx - 18} ${y}q-8-12 0-22M${cx} ${y - 6}q-8-12 0-22M${cx + 18} ${y}q-8-12 0-22" fill="none" stroke="#CFC4BC" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;

/** The cup's contents seen through its rim: an outer ring and an inner surface. */
const liquid = (rim, rimY, [edge, mid], bits = '') => {
  const ry = Math.round(rim * 0.28);
  return `<ellipse cx="122" cy="${rimY + 1}" rx="${rim - 6}" ry="${ry - 3}" fill="${edge}"/><ellipse cx="122" cy="${rimY + 2}" rx="${rim - 14}" ry="${ry - 7}" fill="${mid}"/>${bits}`;
};

const cup = (id, title, { rim = 66, rimY = 90, band, inside, above = '', beside = '', steam = true }) => {
  const cx = 122;
  const ry = Math.round(rim * 0.28);
  const x2 = cx + rim;
  const handle = `M${x2 - 8} ${rimY + 12}C${x2 + 30} ${rimY + 4} ${x2 + 34} ${rimY + 50} ${x2 - 12} ${rimY + 50}`;
  const defs = [lin(`${id}-cup`, [[0, '#FFFFFF'], [0.6, '#F1EBE7'], [1, '#D9CFCA']], [0, 0, 1, 0]), lin(`${id}-sau`, [[0, '#FFFFFF'], [1, '#DDD4CE']])].join('');
  const body = `
    <ellipse cx="${cx}" cy="158" rx="${rim + 36}" ry="24" fill="url(#${id}-sau)" stroke="#D3C9C2" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="154" rx="${n1(rim * 0.72)}" ry="13" fill="#E9E1DB"/>
    ${beside}
    <path d="${handle}" fill="none" stroke="#D3C9C2" stroke-width="12" stroke-linecap="round"/>
    <path d="${handle}" fill="none" stroke="#F6F1ED" stroke-width="8" stroke-linecap="round"/>
    <path d="M${cx - rim} ${rimY}C${cx - rim} 144 ${cx - 30} 156 ${cx} 156C${cx + 30} 156 ${x2} 144 ${x2} ${rimY}Z" fill="url(#${id}-cup)"/>
    <path d="M${cx - rim + 6} ${rimY + 22}Q${cx} ${rimY + 16 + 2 * ry} ${x2 - 6} ${rimY + 22}" fill="none" stroke="${band}" stroke-width="6" opacity="0.85"/>
    <path d="M${cx - rim + 8} ${rimY + 10}Q${cx - rim + 12} ${rimY + 40} ${cx - rim + 30} 138" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="${cx}" cy="${rimY}" rx="${rim}" ry="${ry}" fill="#F3EEEA" stroke="#D3C9C2" stroke-width="2"/>
    ${inside}${above}
    ${steam ? steamAt(cx, rimY - ry - 8) : ''}`;
  return svgDoc({ width: 260, height: 200, defs, body, title });
};

const espresso = () =>
  cup('es', 'Espresso', { rim: 50, rimY: 104, band: '#D8442E', inside: liquid(50, 104, ['#B97A3F', '#6A3A1C'], '<ellipse cx="108" cy="103" rx="13" ry="2.6" fill="#fff" opacity="0.3"/>') });

const coffeeWithMilk = () =>
  cup('cm', 'Coffee with milk', { rim: 62, rimY: 94, band: '#F29A3C', inside: liquid(62, 94, ['#B98652', '#D6AE84'], '<path d="M98 95q12-6 24 0t24 0" fill="none" stroke="#F0DCC0" stroke-width="3" stroke-linecap="round" opacity="0.75"/>') });

const cappuccino = () =>
  cup('cc', 'Cappuccino', { band: '#4B7FB7', inside: liquid(66, 90, ['#B98652', '#F6E9D6'], '<path d="M122 100C106 92 110 80 122 86C134 80 138 92 122 100Z" fill="#B98652"/>') });

const cappuccinoChocolate = () =>
  cup('ch', 'Cappuccino with chocolate', {
    band: '#6B3A1E',
    inside: liquid(66, 90, ['#B98652', '#F4E2C6'], `${scatter(31, 46, [122, 92, 44, 8], (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#5A3018"/>`)}<path d="M94 92l8-5l10 9l10-9l10 9l10-9l10 9l8-4" fill="none" stroke="#5A3018" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`),
    beside: '<g transform="rotate(-12 188 162)"><rect x="172" y="152" width="32" height="20" rx="3" fill="#6B3A1E" stroke="#4A2410" stroke-width="1.5"/><path d="M182 152v20M193 152v20M172 162h32" stroke="#4A2410" stroke-width="1.2" opacity="0.7"/><rect x="174" y="154" width="8" height="6" rx="1.5" fill="#fff" opacity="0.25"/></g>',
  });

const mocaccino = () => {
  const y = 92;
  const tier = (cy, rx, ry) => `<ellipse cx="122" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFDF7" stroke="#E2D2BC" stroke-width="1.5"/>`;
  return cup('mc', 'Mocaccino with cream and chocolate', {
    band: '#8C531C',
    steam: false,
    inside: liquid(66, 94, ['#6A3A1C', '#4A2410']),
    above: `${tier(y, 46, 13)}${tier(y - 11, 34, 10)}${tier(y - 21, 22, 8)}<path d="M122 ${y - 28}q8-6 2-14q-10 2-2 14Z" fill="#FFFDF7" stroke="#E2D2BC" stroke-width="1.5"/><path d="M88 ${y - 2}q8 8 16 0t16 0t16 0t16 0M102 ${y - 13}q7 7 14 0t14 0t14 0" fill="none" stroke="#5A2E18" stroke-width="3" stroke-linecap="round"/>`,
    rimY: 94,
  });
};

const nesquik = () => {
  const handle = 'M170 84C210 80 214 136 170 138';
  const defs = [lin('nq-milk', [[0, '#B77C52'], [1, '#7E4526']]), lin('nq-glass', [[0, '#FFFFFF', 0.9], [0.5, '#EAF2F6', 0.6], [1, '#CFDDE6', 0.8]], [0, 0, 1, 0])].join('');
  const body = `
    <path d="${handle}" fill="none" stroke="#C3D0D8" stroke-width="12" stroke-linecap="round"/>
    <path d="${handle}" fill="none" stroke="#EAF2F6" stroke-width="8" stroke-linecap="round"/>
    <path d="M72 62V140Q72 160 92 160H152Q172 160 172 140V62Z" fill="url(#nq-glass)" stroke="#C3D0D8" stroke-width="2"/>
    <path d="M77 82V138Q77 155 94 155H150Q167 155 167 138V82Z" fill="url(#nq-milk)"/>
    <ellipse cx="122" cy="82" rx="45" ry="11" fill="#C99468"/>
    <ellipse cx="122" cy="83" rx="37" ry="7" fill="#EBCDA8"/>
    <path d="M77 112Q122 126 167 112" fill="none" stroke="#F2B705" stroke-width="7" opacity="0.9"/>
    <ellipse cx="122" cy="62" rx="50" ry="13" fill="#F6FAFC" fill-opacity="0.55" stroke="#C3D0D8" stroke-width="2"/>
    <path d="M82 74V142" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.65"/>
    ${steamAt(122, 44)}`;
  return svgDoc({ width: 260, height: 200, defs, body, title: 'Nesquik' });
};
/* ---------- cold drinks: a container and what goes with it, colour-coded by flavour, no brands ---------- */

const FLOOR = 186;
const GLASS_EDGE = '#B7C6CF';

const FRUIT = {
  apple: '<path d="M0-12C-6-17-18-13-17 0C-16 12-8 18 0 15C8 18 16 12 17 0C18-13 6-17 0-12Z" fill="#D9302C" stroke="#9C1B1B" stroke-width="1.5"/><path d="M0-12q1-6 5-8" fill="none" stroke="#6B4420" stroke-width="2" stroke-linecap="round"/><path d="M2-15q8-6 12-1q-6 6-12 1Z" fill="#5FB041"/><ellipse cx="-7" cy="-4" rx="3" ry="5" fill="#fff" opacity="0.35"/>',
  peach: '<circle r="16" fill="#F8A25C" stroke="#D9743A" stroke-width="1.5"/><path d="M0-15Q-8 0 0 15" fill="none" stroke="#D9743A" stroke-width="1.5"/><path d="M1-15q8-8 15-3q-5 8-15 3Z" fill="#5FB041"/><ellipse cx="-7" cy="-5" rx="3" ry="5" fill="#fff" opacity="0.4"/>',
  blueberry: '<g fill="#3E5FA8" stroke="#243F7C" stroke-width="1.4"><circle cx="-8" cy="4" r="9"/><circle cx="8" cy="4" r="9"/><circle cx="0" cy="-8" r="9"/></g><circle cx="-10" cy="1" r="2" fill="#fff" opacity="0.4"/>',
  orange: '<circle r="16" fill="#FF9A1F" stroke="#D9700A" stroke-width="1.5"/><path d="M1-15q8-8 15-3q-5 8-15 3Z" fill="#5FB041"/><ellipse cx="-7" cy="-5" rx="3" ry="5" fill="#fff" opacity="0.4"/>',
  strawberry: '<path d="M0 17C-12 10-17-2-14-9C-10-15 10-15 14-9C17-2 12 10 0 17Z" fill="#E0243C" stroke="#A11427" stroke-width="1.5"/><path d="M-8-13l4 4l4-5l4 5l4-4l-4-4h-8Z" fill="#5FB041"/><g fill="#FFE9A8"><circle cx="-6" cy="-2" r="1.4"/><circle cx="5" cy="-3" r="1.4"/><circle cx="0" cy="3" r="1.4"/><circle cx="-4" cy="9" r="1.4"/><circle cx="6" cy="6" r="1.4"/></g>',
  lemon: '<path d="M-17 0C-17-10-6-14 0-14C8-14 20-12 20-6l-4 6l4 6C20 12 8 14 0 14C-6 14-17 10-17 0Z" fill="#F7DE55" stroke="#C9A914" stroke-width="1.5"/><ellipse cx="-6" cy="-5" rx="5" ry="2.5" fill="#fff" opacity="0.45"/>',
  lime: '<path d="M-17 0C-17-10-6-14 0-14C8-14 20-12 20-6l-4 6l4 6C20 12 8 14 0 14C-6 14-17 10-17 0Z" fill="#8CCB4A" stroke="#5E9A2A" stroke-width="1.5"/><ellipse cx="-6" cy="-5" rx="5" ry="2.5" fill="#fff" opacity="0.45"/>',
  berries: '<g stroke="#4B1236" stroke-width="1.2"><circle cx="-8" cy="4" r="8" fill="#7A2C6E"/><circle cx="8" cy="4" r="8" fill="#A32A5C"/><circle cx="0" cy="-8" r="8" fill="#5A2A7E"/></g><circle cx="-9" cy="1" r="1.8" fill="#fff" opacity="0.4"/>',
  flower: '<g fill="#fff" stroke="#DCD3BC" stroke-width="1.2"><circle cx="9" cy="0" r="7"/><circle cx="2.8" cy="8.6" r="7"/><circle cx="-7.3" cy="5.3" r="7"/><circle cx="-7.3" cy="-5.3" r="7"/><circle cx="2.8" cy="-8.6" r="7"/></g><circle r="4" fill="#F7C948"/>',
};
const fruit = (kind, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${FRUIT[kind]}</g>`;
const citrus = (x, y, [rind, flesh]) =>
  `<g transform="translate(${x} ${y})"><circle r="13" fill="${rind}"/><circle r="10.5" fill="${flesh}"/><path d="M-10.5 0H10.5M0-10.5V10.5M-7.4-7.4L7.4 7.4M-7.4 7.4L7.4-7.4" stroke="#fff" stroke-width="1.3" opacity="0.85"/></g>`;
const ORANGE_SLICE = ['#FF9A1F', '#FFC25A'];
const LEMON_SLICE = ['#F3D54A', '#FBEF9A'];
const LIME_SLICE = ['#6FB23A', '#C5E58A'];

const part = (p) => (typeof p === 'string' ? { defs: '', body: p } : p);
const scene = (title, ...parts) => {
  const all = parts.map(part);
  return svgDoc({ width: 220, height: 200, defs: all.map((p) => p.defs).join(''), body: all.map((p) => p.body).join(''), title });
};

/** A tumbler standing on the floor line, centred on `x`. */
const tumbler = (id, x, { w = 58, h = 86, liquid, ice = true, bubbles = 0, straw, slice, extra = '' }) => {
  const t = FLOOR - h;
  const l = x - w / 2;
  const r = x + w / 2;
  const bl = x - w * 0.37;
  const br = x + w * 0.37;
  const shell = `M${l} ${t}L${bl} ${FLOOR - 6}Q${bl + 1} ${FLOOR} ${bl + 7} ${FLOOR}H${br - 7}Q${br - 1} ${FLOOR} ${br} ${FLOOR - 6}L${r} ${t}Z`;
  const wet = `M${l + 2.5} ${t + 12}L${bl + 2} ${FLOOR - 7}Q${bl + 3} ${FLOOR - 3} ${bl + 8} ${FLOOR - 3}H${br - 8}Q${br - 3} ${FLOOR - 3} ${br - 2} ${FLOOR - 7}L${r - 2.5} ${t + 12}Z`;
  const cube = (cx, cy, a) => `<rect x="${n1(cx - 7)}" y="${n1(cy - 7)}" width="14" height="14" rx="3" transform="rotate(${a} ${n1(cx)} ${n1(cy)})" fill="#fff" fill-opacity="0.45" stroke="#fff" stroke-opacity="0.85" stroke-width="1.2"/>`;
  const defs = lin(`${id}-liq`, [[0, liquid[0]], [1, liquid[1]]]) + lin(`${id}-gl`, [[0, '#FFFFFF', 0.85], [0.5, '#EAF2F6', 0.4], [1, '#CFDDE6', 0.7]], [0, 0, 1, 0]);
  const rx = n1(w / 2 - 3);
  const body = `
    <path d="${shell}" fill="url(#${id}-gl)"/>
    <path d="${wet}" fill="url(#${id}-liq)"/>
    <ellipse cx="${x}" cy="${t + 12}" rx="${rx}" ry="4.5" fill="${liquid[0]}"/><ellipse cx="${x}" cy="${t + 12}" rx="${rx}" ry="4.5" fill="#fff" opacity="0.28"/>
    ${ice ? cube(x - w * 0.18, t + 24, -14) + cube(x + w * 0.14, t + 20, 12) + cube(x - w * 0.02, t + 42, 6) : ''}
    ${bubbles ? scatter(7, bubbles, [x, t + h * 0.58, w * 0.3, h * 0.3], (bx, by) => `<circle cx="${bx}" cy="${by}" r="1.5" fill="#fff" opacity="0.7"/>`) : ''}
    ${straw ? `<path d="M${n1(x + 4)} ${t - 20}L${n1(x - w * 0.12)} ${FLOOR - 16}" stroke="${straw}" stroke-width="5" stroke-linecap="round"/>` : ''}
    <path d="${shell}" fill="none" stroke="${GLASS_EDGE}" stroke-width="2"/>
    <ellipse cx="${x}" cy="${t}" rx="${n1(w / 2)}" ry="5" fill="#F6FAFC" fill-opacity="0.5" stroke="${GLASS_EDGE}" stroke-width="2"/>
    <path d="M${l + 7} ${t + 14}L${n1(bl + 6)} ${FLOOR - 14}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    ${slice ? citrus(r - 4, t + 2, slice) : ''}${extra}`;
  return { defs, body };
};

const BOTTLES = {
  contour: { path: 'M-7.5 12H7.5V38C7.5 54 25 60 25 84C25 98 20 106 20 118C20 132 26 138 26 150V158Q26 168 16 168H-16Q-26 168 -26 158V150C-26 138 -20 132 -20 118C-20 106 -25 98 -25 84C-25 60 -7.5 54 -7.5 38Z', level: 36, label: [84, 44] },
  pet: { path: 'M-7.5 12H7.5V28C7.5 38 24 42 24 58V154Q24 168 12 168H-12Q-24 168 -24 154V58C-24 42 -7.5 38 -7.5 28Z', level: 32, label: [74, 48] },
};

/** A bottle with a cap, a wrapped label and a wave across it. */
const bottle = (id, x, { shape, liquid, tint = '#EAF2F6', label, wave, cap, icon = '', bubbles = 0 }) => {
  const { path, level, label: [ly, lh] } = BOTTLES[shape];
  const defs = `${lin(`${id}-liq`, [[0, liquid[0]], [1, liquid[1]]])}<clipPath id="${id}-c"><path d="${path}"/></clipPath>`;
  const body = `<g transform="translate(${x} ${FLOOR - 168})">
    <path d="${path}" fill="${tint}" fill-opacity="0.6"/>
    <g clip-path="url(#${id}-c)">
      <rect x="-30" y="${level}" width="60" height="140" fill="url(#${id}-liq)"/>
      <ellipse cx="0" cy="${level}" rx="9" ry="2.4" fill="#fff" opacity="0.3"/>
      ${bubbles ? scatter(3, bubbles, [0, 146, 17, 16], (bx, by) => `<circle cx="${bx}" cy="${by}" r="1.5" fill="#fff" opacity="0.8"/>`) : ''}
      <rect x="-30" y="${ly}" width="60" height="${lh}" fill="${label}"/>
      <path d="M-30 ${ly + lh * 0.8}q15-12 30 0t30 0" fill="none" stroke="${wave}" stroke-width="5"/>
      ${icon}
    </g>
    <path d="${path}" fill="none" stroke="#9FB0BA" stroke-width="1.6"/>
    <path d="M-17 ${ly + 4}V${ly + lh - 4}M-4 18V32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
    <rect x="-8.5" y="0" width="17" height="13" rx="3" fill="${cap}" stroke="#00000022" stroke-width="1"/>
  </g>`;
  return { defs, body };
};

/** A carton with a straw, a fruit on a white disc and a white wave at its foot. */
const carton = (x, { front, side, kind }) =>
  `<g transform="translate(${x} ${FLOOR - 168})">
    <path d="M12 62L34 54V158L12 168Z" fill="${side}"/>
    <rect x="-30" y="62" width="42" height="106" fill="${front}"/>
    <path d="M-30 148q10-9 21 0t21 0V168H-30Z" fill="#fff" fill-opacity="0.85"/>
    <circle cx="-9" cy="104" r="19" fill="#fff"/>
    ${fruit(kind, -9, 104, 1.05)}
    <path d="M-27 66V144" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
    <path d="M-30 62L-8 54H34L12 62Z" fill="#F7F3EE"/>
    <path d="M-8 54L-5 49H30L34 54Z" fill="#fff" stroke="#D9D2CC" stroke-width="1"/>
    <path d="M16 58L36 12H50" fill="none" stroke="#E5484D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

const NECTAR = 'M-6 22H6V36C6 46 22 50 22 66V148Q22 158 12 158H-12Q-22 158 -22 148V66C-22 50 -6 46 -6 36Z';
/** A small glass bottle of juice with a crown cap and a fruit on the label. */
const juiceBottle = (id, x, { liquid, cap, kind }) => ({
  defs: `${lin(`${id}-liq`, [[0, liquid[0]], [1, liquid[1]]])}<clipPath id="${id}-c"><path d="${NECTAR}"/></clipPath>`,
  body: `<g transform="translate(${x} ${FLOOR - 158})">
    <path d="${NECTAR}" fill="#EAF2F6" fill-opacity="0.6"/>
    <g clip-path="url(#${id}-c)">
      <rect x="-30" y="40" width="60" height="130" fill="url(#${id}-liq)"/>
      <rect x="-30" y="84" width="60" height="52" fill="#fff"/>
      <rect x="-30" y="84" width="60" height="5" fill="${liquid[1]}"/><rect x="-30" y="131" width="60" height="5" fill="${liquid[1]}"/>
    </g>
    ${fruit(kind, 0, 110, 1)}
    <path d="${NECTAR}" fill="none" stroke="#9FB0BA" stroke-width="1.6"/>
    <path d="M-15 70V82M-3 24V34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <path d="M-8.5 13H8.5L7 23H-7Z" fill="${cap}"/>
  </g>`,
});

/** A slim can with its art drawn by the caller. */
const can = (id, x, { body, edge, art }) => ({
  defs: lin(`${id}-can`, [[0, edge], [0.3, body], [0.7, body], [1, edge]], [0, 0, 1, 0]),
  body: `<g transform="translate(${x} ${FLOOR - 150})">
    <path d="M-22 12Q-22 6 -15 4H15Q22 6 22 12V138Q22 146 14 148H-14Q-22 146 -22 138Z" fill="url(#${id}-can)"/>
    <ellipse cx="0" cy="4" rx="15" ry="3.6" fill="#D5D9DE" stroke="#A7AEB6" stroke-width="1"/>
    <ellipse cx="0" cy="3.4" rx="5" ry="1.6" fill="#B8BEC5"/>
    ${art}
    <path d="M-16 24V128" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
  </g>`,
});

const seed = (x, y) => `<g transform="translate(${x} ${y})"><circle r="10" fill="#F6EBD2"/><circle r="6.2" fill="#2B1612"/><ellipse cx="-2" cy="-2" rx="2" ry="1.4" fill="#fff" opacity="0.5"/></g>`;

/** A bottle of fizzy drink and a glass of the same, with ice. */
const soda = (id, title, { liquid, tint, label, wave, cap, slice, beside = '' }) =>
  scene(title, bottle(id, 70, { shape: 'contour', liquid, tint, label, wave, cap }), tumbler(`${id}g`, 152, { liquid, slice, bubbles: 20 }), beside);

const COLA = ['#4A2412', '#24110A'];
const cola = () => soda('cola', 'Cola', { liquid: COLA, label: '#D6322E', wave: '#fff', cap: '#D6322E' });
const colaZero = () => soda('colz', 'Cola zero', { liquid: COLA, label: '#1E1E22', wave: '#C9CDD2', cap: '#1E1E22' });
const lemonLime = () => soda('lml', 'Lemon-lime soda', { liquid: ['#EAF6C8', '#CFE79A'], tint: '#BFE39A', label: '#1F9D55', wave: '#fff', cap: '#1F9D55', slice: LIME_SLICE, beside: fruit('lime', 200, 172) });
const orangeSoda = () => soda('ors', 'Orange soda', { liquid: ['#FFA436', '#F0720F'], label: '#fff', wave: '#F0720F', cap: '#F0720F', beside: fruit('orange', 200, 170) });
const orangeSodaSlice = () => soda('osl', 'Orange soda with a slice of orange', { liquid: ['#FFA436', '#F0720F'], label: '#F0720F', wave: '#fff', cap: '#F0720F', slice: ORANGE_SLICE, beside: fruit('orange', 200, 170) });
const bitter = () => soda('bit', 'Bitter lemon soda', { liquid: ['#F1E3A0', '#D9C25A'], label: '#14532D', wave: '#E8C547', cap: '#E8C547', slice: LEMON_SLICE, beside: fruit('lemon', 198, 172) });

const mint = (x, y) => `<g fill="#4FA23A" stroke="#35792A" stroke-width="1"><path d="M${x} ${y}q-12-4-14-16q12 0 14 16Z"/><path d="M${x} ${y}q12-4 16-16q-12 0-16 16Z"/><path d="M${x} ${y}q-2-12 6-22q6 10-6 22Z"/></g>`;
const lemonade = () =>
  scene('Lemonade', tumbler('lmd', 84, { w: 84, h: 126, liquid: ['#FBEF9A', '#F3D54A'], straw: '#E5484D', slice: LEMON_SLICE, bubbles: 16, extra: mint(66, 64) }), fruit('lemon', 168, 168, 1.35), fruit('lemon', 198, 176, 0.8));

const fuze = (id, title, { kind, liquid, label, wave }) =>
  scene(title, bottle(id, 72, { shape: 'pet', liquid, label, wave, cap: wave, icon: fruit(kind, 0, 92, 0.95) }), fruit(kind, 160, 168, 1.5), fruit(kind, 194, 176, 0.9));

const juiceGlass = (id, title, { liquid, slice, straw, beside }) =>
  scene(title, tumbler(id, 84, { w: 84, h: 126, liquid, slice, straw, ice: false }), beside);

const lifeCarton = (id, title, { kind, front, side }) =>
  scene(title, carton(76, { front, side, kind }), fruit(kind, 166, 166, 1.5), fruit(kind, 198, 176, 0.9));

const nectarBottle = (id, title, { kind, liquid }) =>
  scene(title, juiceBottle(id, 76, { liquid, cap: '#C9302C', kind }), fruit(kind, 150, 168, 1.5), fruit(kind, 186, 176, 0.9));

const DROP = '<path d="M0 82C-9 94-11 100-11 105A11 11 0 0 0 11 105C11 100 9 94 0 82Z" fill="#fff" opacity="0.9"/>';
const water = (id, title, { label, cap, sparkling }) =>
  scene(title, bottle(id, 70, { shape: 'pet', liquid: ['#E4F3FA', '#B7DDF0'], label, wave: '#fff', cap, icon: DROP, bubbles: sparkling ? 26 : 0 }), tumbler(`${id}g`, 152, { liquid: ['#EAF6FC', '#C5E5F4'], ice: !sparkling, bubbles: sparkling ? 26 : 0, slice: LEMON_SLICE }));

const yogurt = () => {
  const tub = `<g transform="translate(70 ${FLOOR}) scale(1.35)">
    <path d="M-30-72H30L24-6Q23 0 17 0H-17Q-23 0-24-6Z" fill="#F6F1ED" stroke="#D3C9C2" stroke-width="1.5"/>
    <path d="M-27.5-44H27.5L25.5-22H-25.5Z" fill="#4B8BD6"/>
    <path d="M-27-32q9-8 18 0t18 0t18 0" fill="none" stroke="#fff" stroke-width="3"/>
    <ellipse cx="0" cy="-72" rx="30" ry="6" fill="#DADFE4" stroke="#B7C0C8" stroke-width="1.2"/>
    <ellipse cx="0" cy="-72" rx="24" ry="4" fill="#F4F6F8"/>
    <path d="M-22-64L-19-18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  </g>`;
  return scene('Yogurt', tub, tumbler('yg', 152, { liquid: ['#FFFFFF', '#F0E9DC'], ice: false, extra: '<path d="M136 112q10-6 20 0t10 0" fill="none" stroke="#E9DFC9" stroke-width="3" stroke-linecap="round"/>' }));
};

const guarana = () =>
  scene('Guarana drink', can('gu', 78, { body: '#C2272D', edge: '#7A1218', art: `${seed(0, 52)}${seed(-4, 92)}${seed(6, 122)}` }), tumbler('gug', 156, { liquid: ['#F0B35A', '#C97A1E'], bubbles: 18 }), seed(200, 176));

const energy = () =>
  scene('Energy drink', can('en', 78, { body: '#1B2E66', edge: '#0B1636', art: '<path d="M6 36L-12 86H-1L-7 126L15 72H4Z" fill="#36D1F0"/><path d="M-22 134q11-8 22 0t22 0" fill="none" stroke="#36D1F0" stroke-width="4"/>' }), tumbler('eng', 156, { liquid: ['#6FE3F5', '#2F9FE0'], bubbles: 18 }), '<path d="M204 150L192 176H199L195 190L210 168H203Z" fill="#36D1F0"/>');
/** [item id, svg document] for every menu picture. */
export function menuPictures() {
  return withDetail(0, () => [
    ['pizza-slice', reuse(pizzaSlice('pz'), 'Slice of pepperoni pizza')],
    ['whole-pizza', reuse(pizzaWhole('pw'), 'Whole pepperoni pizza')],
    ['calzone', calzone()],
    ['whole-chicken-pizza', chickenPizza()],
    ['whole-tuna-pizza', tunaPizza()],
    ['pizza-box', pizzaBox()],
    ['small-hot-dog', smallHotDog()],
    ['large-hot-dog', reuse(hotDog('hd'), 'Large hot dog with mustard and ketchup')],
    ['ham-sandwich', hamSandwich()],
    ['smoked-pork-loin-sandwich', porkLoinSandwich()],
    ['chicken-breast-sandwich', chickenSandwich()],
    ['kulen-sandwich', kulenSandwich()],
    ['tuna-sandwich', tunaSandwich()],
    ['kifla', kifla()],
    ['sour-cherry-pie', latticePie('cp2', 'Sour cherry pie', { filling: ['#A8283C', '#6E1226'], fruit: cherries })],
    ['apple-pie', latticePie('ap', 'Apple pie', { filling: ['#F2DFA0', '#D9B25A'], fruit: appleSlices })],
    ['raspberry-pie', latticePie('rp', 'Raspberry pie', { filling: ['#E04870', '#A21E48'], fruit: berries })],
    ['raspberry-sandwich', jamSandwich('rsw', 'Raspberry sandwich', { jam: ['#E04870', '#A21E48'], topping: berryTop })],
    ['sour-cherry-sandwich', jamSandwich('csw', 'Sour cherry sandwich', { jam: ['#A8283C', '#6E1226'], topping: cherryTop })],
    ['russian-salad', russianSalad()],
    ['chicken-salad', chickenSalad()],
    ['beef-salad', beefSalad()],
    ['tuna-salad', tunaSalad()],
    ['chicken-soup', chickenSoup()],
    ['beef-soup', beefSoup()],
    ['side-kashkaval', kashkaval()],
    ['side-ham', sideHam()],
    ['side-smoked-pork-loin', sidePork()],
    ['side-kulen', sideKulen()],
    ['side-chicken-breast', sideChicken()],
    ['side-eurokrem', eurokrem()],
    ['side-plazma', plazma()],
    ['side-sour-cherry', jamJar('scj', 'Sour cherry jam', ['#A8283C', '#6E1226'], '#C9302C')],
    ['side-raspberry', jamJar('rj', 'Raspberry jam', ['#E04870', '#A21E48'], '#D6325A')],
    ['espresso', espresso()],
    ['coffee-with-milk', coffeeWithMilk()],
    ['cappuccino', cappuccino()],
    ['cappuccino-with-chocolate', cappuccinoChocolate()],
    ['mocaccino', mocaccino()],
    ['nesquik', nesquik()],
    ['coca-cola', cola()],
    ['coca-cola-zero', colaZero()],
    ['sprite', lemonLime()],
    ['fanta', orangeSoda()],
    ['fanta-orange', orangeSodaSlice()],
    ['schweppes-bitter', bitter()],
    ['next-lemonade', lemonade()],
    ['fuze-peach', fuze('fzp', 'Peach iced tea', { kind: 'peach', liquid: ['#F8B777', '#E8742C'], label: '#FFE2C2', wave: '#F8A25C' })],
    ['fuze-forest-fruits', fuze('fzf', 'Forest fruits iced tea', { kind: 'berries', liquid: ['#9B3B7A', '#4B1236'], label: '#E6D5EE', wave: '#7A2C6E' })],
    ['fuze-lemon', fuze('fzl', 'Lemon iced tea', { kind: 'lemon', liquid: ['#F8E27A', '#E6B91C'], label: '#FFF6B8', wave: '#E6B91C' })],
    ['joy-orange', juiceGlass('jo', 'Orange juice drink', { liquid: ['#FFB23A', '#FF8A00'], slice: ORANGE_SLICE, straw: '#E5484D', beside: `${fruit('orange', 168, 168, 1.35)}${fruit('orange', 198, 176, 0.8)}` })],
    ['joy-multivitamin', juiceGlass('jm', 'Multivitamin juice drink', { liquid: ['#FFC94A', '#F28C1E'], slice: ORANGE_SLICE, straw: '#E5484D', beside: `${fruit('orange', 152, 170, 1.15)}${fruit('apple', 182, 172, 1)}${fruit('lemon', 202, 178, 0.75)}` })],
    ['joy-elderflower', juiceGlass('je', 'Elderflower drink', { liquid: ['#F7F3C8', '#E6DE8E'], slice: LEMON_SLICE, straw: '#E5484D', beside: `${fruit('flower', 156, 160, 1.5)}${fruit('flower', 190, 172, 1.1)}${fruit('flower', 200, 142, 0.8)}` })],
    ['life-apple', lifeCarton('lia', 'Apple juice', { kind: 'apple', front: '#6FBF4A', side: '#4F9A34' })],
    ['life-peach', lifeCarton('lip', 'Peach juice', { kind: 'peach', front: '#F8A25C', side: '#D9743A' })],
    ['life-blueberry', lifeCarton('lib', 'Blueberry juice', { kind: 'blueberry', front: '#4B5FB0', side: '#34447F' })],
    ['life-orange', lifeCarton('lio', 'Orange juice', { kind: 'orange', front: '#FF9A1F', side: '#D9700A' })],
    ['life-strawberry', lifeCarton('lis', 'Strawberry juice', { kind: 'strawberry', front: '#E0243C', side: '#A11427' })],
    ['nectar-apple', nectarBottle('nea', 'Apple nectar', { kind: 'apple', liquid: ['#F2D86A', '#D9AE2C'] })],
    ['nectar-peach', nectarBottle('nep', 'Peach nectar', { kind: 'peach', liquid: ['#F8B777', '#E8742C'] })],
    ['nectar-blueberry', nectarBottle('neb', 'Blueberry nectar', { kind: 'blueberry', liquid: ['#6B5AA8', '#34286B'] })],
    ['nectar-orange', nectarBottle('neo', 'Orange nectar', { kind: 'orange', liquid: ['#FFB23A', '#FF8A00'] })],
    ['nectar-strawberry', nectarBottle('nes', 'Strawberry nectar', { kind: 'strawberry', liquid: ['#F0546A', '#B01E3E'] })],
    ['knjaz-milos', water('kmw', 'Still mineral water', { label: '#1C8A4A', cap: '#1C8A4A' })],
    ['rosa', water('rsw2', 'Still water', { label: '#E5527A', cap: '#2D6FD4' })],
    ['rosa-sparkling-water', water('rsp', 'Sparkling water', { label: '#8E2F6B', cap: '#8E2F6B', sparkling: true })],
    ['aqua-viva', water('avw', 'Spring water', { label: '#2D6FD4', cap: '#2D6FD4' })],
    ['yogurt', yogurt()],
    ['guarana', guarana()],
    ['ultra-energy', energy()],
  ]);
}
