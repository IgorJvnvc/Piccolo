// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { measurePill, revealCards, slidePill } from '@/features/menu-browser/menu-browser.motion';
import { loadGsap, scaleFor } from '@/shared/motion';
import type { MotionTools, Playing } from '@/shared/motion/island';

/** The menu browser's choreography against the REAL GSAP (core, in a DOM with hand-set geometry). */

let list: HTMLElement;
let pill: HTMLElement;

const rect = (left: number, width: number): DOMRect => ({ left, width, right: left + width, top: 0, bottom: 40, height: 40, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;

/** happy-dom has no layout, so each element reports the box the test gives it. */
function place(element: Element, left: number, width: number): void {
  element.getBoundingClientRect = () => rect(left, width);
}

beforeEach(() => {
  document.body.innerHTML = `
    <div id="list"><button><span data-part="pill"></span>Pizza</button></div>
    <ul id="cards"><li>A</li><li>B</li><li>C</li></ul>`;
  list = document.getElementById('list') as HTMLElement;
  pill = list.querySelector('[data-part="pill"]') as HTMLElement;
  place(list, 100, 600);
});

afterEach(() => {
  document.body.innerHTML = '';
});

async function tools(tier: 'full' | 'lite' = 'full'): Promise<MotionTools> {
  const { gsap } = await loadGsap();
  return { gsap, tier, scale: scaleFor(tier) };
}

function held(animation: Playing | undefined) {
  const timeline = animation as unknown as { pause: () => unknown; progress: (value: number, suppressEvents?: boolean) => unknown; kill: () => unknown };
  timeline.pause();
  return timeline;
}

/** GSAP writes immediateRender from-states lazily, on its next tick (it batches DOM writes). */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 60));

describe('measurePill', () => {
  it('measures from the tab list, so scrolling the tab row does not matter', () => {
    place(pill, 230, 96);

    expect(measurePill(list)).toEqual({ left: 130, width: 96 });
  });
});

describe('slidePill', () => {
  it('starts at the old pill and eases to the new one, then leaves no inline styles behind', async () => {
    place(pill, 330, 120); // the new pill's resting place, 230 px right of the list's left edge
    const kit = await tools();

    const sliding = held(slidePill(list, { left: 20, width: 80 }, kit)); // it used to be 20 px in, 80 px wide
    await tick();

    expect(pill.style.transform).toContain('-210px'); // 20 - 230
    expect(pill.style.width).toBe('80px');
    sliding.progress(0.5, false);
    expect(Number.parseFloat(pill.style.width)).toBeGreaterThan(80);
    expect(Number.parseFloat(pill.style.width)).toBeLessThan(120);
    sliding.progress(1, false);
    expect(pill.style.transform).toBe('');
    expect(pill.style.width).toBe('');
  });
});

describe('revealCards', () => {
  const cards = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#cards li')];

  it('hides the cards below their place, then raises them one after another', async () => {
    const kit = await tools();

    const rising = held(revealCards(cards(), kit));
    await tick();

    expect(cards().every((card) => card.style.opacity === '0')).toBe(true);
    expect(cards()[0]?.style.transform).toContain('28px');

    rising.progress(0.3, false); // 0.3 of 0.62 s: the first card is well under way, the last has barely begun
    const [first, , last] = cards().map((card) => Number.parseFloat(card.style.opacity));
    expect(first).toBeGreaterThan(0.2);
    expect(last).toBeLessThan(first ?? 0);

    rising.progress(1, false);
    expect(cards().every((card) => card.style.opacity === '' && card.style.transform === '')).toBe(true);
  });
});
