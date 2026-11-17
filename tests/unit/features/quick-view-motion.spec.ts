// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQuickViewMotion } from '@/features/menu-browser/quick-view.motion';
import { loadGsap, scaleFor } from '@/shared/motion';
import type { MotionTools, Playing } from '@/shared/motion/island';

/** The quick view's choreography against the REAL GSAP (core, in a DOM). */

let overlay: HTMLElement;
let panel: HTMLElement;
let dish: HTMLElement;

const rect = (left: number, top: number, size: number): DOMRect =>
  ({ left, top, width: size, height: size, right: left + size, bottom: top + size, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

// The dish rests at 200..480 x 300..580 (centre 340, 440); the card's picture is a 100 px square at 20, 400 (centre 70, 450).
const card = { getBoundingClientRect: () => rect(20, 400, 100) } as Element;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="overlay">
      <div data-part="panel">Details<img alt="" /></div>
    </div>`;
  overlay = document.getElementById('overlay') as HTMLElement;
  panel = overlay.querySelector('[data-part="panel"]') as HTMLElement;
  dish = overlay.querySelector('img') as HTMLElement;
  dish.getBoundingClientRect = () => rect(200, 300, 280);
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

describe('the quick view choreography', () => {
  const motion = createQuickViewMotion(() => null);

  it('starts with a see-through scrim and a panel that is lower and slightly smaller', async () => {
    motion.from?.(overlay, await tools());

    expect(overlay.style.opacity).toBe('0');
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.transform).toContain('24px');
    expect(panel.style.transform).toContain('0.97');
  });

  it('plays in to a clean resting state: no inline styles are left behind', async () => {
    const kit = await tools();
    motion.from?.(overlay, kit);

    held(motion.enter(overlay, kit)).progress(1, false);

    expect(overlay.style.opacity).toBe('');
    expect(panel.style.opacity).toBe('');
    expect(panel.style.transform).toBe('');
  });

  it('closing in the middle of the entrance carries on from where the dialog has got to', async () => {
    const kit = await tools();
    motion.from?.(overlay, kit);
    const entering = held(motion.enter(overlay, kit));
    entering.progress(0.4, false);
    const reached = Number.parseFloat(panel.style.opacity);
    expect(reached).toBeGreaterThan(0);
    expect(reached).toBeLessThan(1);
    entering.kill();

    const leaving = held(motion.exit(overlay, kit));
    leaving.progress(0.001, false); // the tween notes its starting values on its first render

    expect(Number.parseFloat(panel.style.opacity)).toBeCloseTo(reached, 1); // no jump back to fully visible or fully hidden
  });
});

describe('the dish stepping out of its card', () => {
  const motion = createQuickViewMotion(() => card);

  it('starts on the card it was tapped on, as small as the card picture', async () => {
    motion.from?.(overlay, await tools());

    expect(dish.style.transform).toContain('-270px'); // the card's centre is 270 px left of where the dish rests
    expect(dish.style.transform).toContain('10px');
    expect(dish.style.transform).toMatch(/scale\(0\.357/); // 100 / 280
  });

  it('steps out to its place and leaves no inline style behind', async () => {
    const kit = await tools();
    motion.from?.(overlay, kit);

    held(motion.enter(overlay, kit)).progress(1, false);

    expect(dish.style.transform).toBe('');
  });

  it('goes back to the card when the dialog closes', async () => {
    const kit = await tools();
    motion.from?.(overlay, kit);
    held(motion.enter(overlay, kit)).progress(1, false);

    held(motion.exit(overlay, kit)).progress(1, false);

    expect(dish.style.transform).toContain('-270px');
    expect(dish.style.transform).toMatch(/scale\(0\.357/);
  });

  it('stays where it is when nothing says which card it came from', async () => {
    createQuickViewMotion(() => null).from?.(overlay, await tools());

    expect(dish.style.transform).toBe('');
  });
});