// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { quickViewMotion } from '@/features/menu-browser/quick-view.motion';
import { loadGsap, scaleFor } from '@/shared/motion';
import type { MotionTools, Playing } from '@/shared/motion/island';

/** The quick view's choreography against the REAL GSAP (core, in a DOM). */

let overlay: HTMLElement;
let panel: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="overlay">
      <div data-part="panel">Details</div>
    </div>`;
  overlay = document.getElementById('overlay') as HTMLElement;
  panel = overlay.querySelector('[data-part="panel"]') as HTMLElement;
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
  it('starts with a see-through scrim and a panel that is lower and slightly smaller', async () => {
    quickViewMotion.from?.(overlay, await tools());

    expect(overlay.style.opacity).toBe('0');
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.transform).toContain('32px');
    expect(panel.style.transform).toContain('0.97');
  });

  it('plays in to a clean resting state: no inline styles are left behind', async () => {
    const kit = await tools();
    quickViewMotion.from?.(overlay, kit);

    held(quickViewMotion.enter(overlay, kit)).progress(1, false);

    expect(overlay.style.opacity).toBe('');
    expect(panel.style.opacity).toBe('');
    expect(panel.style.transform).toBe('');
  });

  it('closing in the middle of the entrance carries on from where the dialog has got to', async () => {
    const kit = await tools();
    quickViewMotion.from?.(overlay, kit);
    const entering = held(quickViewMotion.enter(overlay, kit));
    entering.progress(0.4, false);
    const reached = Number.parseFloat(panel.style.opacity);
    expect(reached).toBeGreaterThan(0);
    expect(reached).toBeLessThan(1);
    entering.kill();

    const leaving = held(quickViewMotion.exit(overlay, kit));
    leaving.progress(0.001, false); // the tween notes its starting values on its first render

    expect(Number.parseFloat(panel.style.opacity)).toBeCloseTo(reached, 1); // no jump back to fully visible or fully hidden
  });
});
