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
  ]);
}
