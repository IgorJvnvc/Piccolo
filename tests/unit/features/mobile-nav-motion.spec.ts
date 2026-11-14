// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type Origin, createPanelMotion } from '@/features/mobile-nav/mobile-nav.motion';
import { loadGsap, scaleFor } from '@/shared/motion';
import type { MotionTools, Playing } from '@/shared/motion/island';

/** The menu's choreography against the REAL GSAP (core, in a DOM): the numbers it paints, not just the calls it makes. */

const ORIGIN: Origin = { x: 340, y: 40, radius: 800 };
let panel: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="panel">
      <ul><li data-part="link">One</li><li data-part="link">Two</li><li data-part="link">Three</li></ul>
      <div data-part="footer">Call us</div>
    </div>`;
  panel = document.getElementById('panel') as HTMLElement;
});

afterEach(() => {
  document.body.innerHTML = '';
});

async function tools(tier: 'full' | 'lite' = 'full'): Promise<MotionTools> {
  const { gsap } = await loadGsap();
  return { gsap, tier, scale: scaleFor(tier) };
}

/** Holds the animation still so the test owns the playhead. */
function held(animation: Playing | undefined) {
  const timeline = animation as unknown as { pause: () => unknown; progress: (value: number, suppressEvents?: boolean) => unknown; kill: () => unknown };
  timeline.pause();
  return timeline;
}

const radius = (): number => Number.parseFloat(panel.style.getPropertyValue('--r'));
const links = (): HTMLElement[] => [...panel.querySelectorAll<HTMLElement>('[data-part="link"]')];

describe('the mobile menu choreography', () => {
  it('starts hidden: a zero-size circle at the toggle button, links and footer waiting below', async () => {
    const motion = createPanelMotion(() => ORIGIN);

    motion.from?.(panel, await tools());

    expect(panel.hasAttribute('data-clip')).toBe(true);
    expect(panel.style.getPropertyValue('--x')).toBe('340px');
    expect(panel.style.getPropertyValue('--y')).toBe('40px');
    expect(radius()).toBe(0);
    expect(links().every((link) => link.style.opacity === '0')).toBe(true);
    expect(links()[0]?.style.transform).toContain('36px');
    expect((panel.querySelector('[data-part="footer"]') as HTMLElement).style.transform).toContain('24px');
  });

  it('grows the circle to reach the far corner, then removes the clip and the hidden states', async () => {
    const motion = createPanelMotion(() => ORIGIN);
    const kit = await tools();
    motion.from?.(panel, kit);
    const entering = held(motion.enter(panel, kit));

    entering.progress(0.3, false);
    const growing = radius();
    expect(growing).toBeGreaterThan(0);
    expect(growing).toBeLessThan(ORIGIN.radius);
    expect(panel.hasAttribute('data-clip')).toBe(true);

    entering.progress(1, false);
    expect(radius()).toBe(ORIGIN.radius);
    expect(panel.hasAttribute('data-clip')).toBe(false); // a menu at rest has no clip at all
    expect(links().every((link) => link.style.opacity === '' && link.style.transform === '')).toBe(true);
    expect((panel.querySelector('[data-part="footer"]') as HTMLElement).style.opacity).toBe('');
  });

  it('closing a half-open menu shrinks it from the size it had reached', async () => {
    const motion = createPanelMotion(() => ORIGIN);
    const kit = await tools();
    motion.from?.(panel, kit);
    const entering = held(motion.enter(panel, kit));
    entering.progress(0.05, false); // a moment in: a small circle (the opening is front-loaded, so anything later is nearly full)
    const reached = radius();
    expect(reached).toBeGreaterThan(0);
    expect(reached).toBeLessThan(ORIGIN.radius * 0.6);
    entering.kill();

    const leaving = held(motion.exit(panel, kit));
    expect(radius()).toBe(reached);
    leaving.progress(0.02, false); // a moment into the shrink: a little under where it was, not under full size
    expect(radius()).toBeLessThanOrEqual(reached);
    expect(radius()).toBeGreaterThan(reached * 0.5);
  });

  it('reopening a closing menu carries on from the size it has shrunk to, without hiding it again', async () => {
    const motion = createPanelMotion(() => ORIGIN);
    const kit = await tools();
    motion.from?.(panel, kit);
    held(motion.enter(panel, kit)).progress(1, false);
    const leaving = held(motion.exit(panel, kit));
    leaving.progress(0.5, false);
    const shrunk = radius();
    leaving.kill();

    const entering = held(motion.enter(panel, kit)); // no `from` this time
    entering.progress(0.05, false);

    expect(radius()).toBeGreaterThanOrEqual(shrunk - 1);
    expect(radius()).toBeLessThan(ORIGIN.radius);
    entering.progress(1, false);
    expect(radius()).toBe(ORIGIN.radius);
  });
});
