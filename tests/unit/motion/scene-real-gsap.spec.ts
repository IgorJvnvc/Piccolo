// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScene, loadGsap, travel } from '@/shared/motion';

/**
 * The scene helper against the REAL GSAP (core, in a DOM). The fake-kit tests pin the orchestration; these pin that
 * the orchestration is valid GSAP: for example `gsap.context()` without a function returns the running context
 * instead of a new one, which a fake that always returns an object cannot reveal.
 */
let root: HTMLElement;

beforeEach(() => {
  document.documentElement.style.fontSize = '20px';
  document.body.innerHTML = `
    <section id="root">
      <h2 data-reveal="up">Title</h2>
      <p data-reveal="up">Copy</p>
      <div data-part="stage" data-state="idle"></div>
    </section>`;
  root = document.getElementById('root') as HTMLElement;
});

afterEach(() => {
  document.documentElement.style.fontSize = '';
  document.body.innerHTML = '';
});

/** GSAP writes immediateRender from-states lazily, on its next tick (it batches DOM writes). */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 60));

/**
 * The real gsap with its timelines held paused and ScrollTrigger removed from their config. A DOM without layout puts
 * every trigger at position 0, so a real ScrollTrigger would fire at once; here the test owns the playhead instead.
 * (The ScrollTrigger config itself is asserted in the fake-kit tests, and exercised for real in the browser.)
 */
async function coreKit() {
  const { gsap } = await loadGsap();
  const timeline = (vars: Record<string, unknown> = {}) => {
    const { scrollTrigger: _dropped, ...rest } = vars;
    return gsap.timeline(rest).pause();
  };
  return { gsap: Object.create(gsap, { timeline: { value: timeline } }) as typeof gsap, ScrollTrigger: undefined as never };
}

describe('createScene with the real GSAP', () => {
  it('builds a scene and hands back a working teardown (a real context, not undefined)', async () => {
    const kit = await coreKit();
    let built = false;

    const teardown = createScene(kit, { root, tier: 'full', start: 'top 80%' }, () => {
      built = true;
    });

    expect(built).toBe(true);
    expect(() => teardown()).not.toThrow();
  });

  it('applies the hidden from-state straight away (on the next GSAP tick), rising from the token distance in rem', async () => {
    const kit = await coreKit();
    const title = root.querySelector('h2') as HTMLElement;

    createScene(kit, { root, tier: 'full', start: 'top 80%' }, ({ fadeUp }) => fadeUp(title));
    await tick();

    expect(title.style.opacity).toBe('0');
    expect(title.style.transform).toContain(`${travel.rise * 20}px`); // 2 rem at the 20 px root font size
  });

  it('scales the rise by tier', async () => {
    const kit = await coreKit();
    const title = root.querySelector('h2') as HTMLElement;

    createScene(kit, { root, tier: 'lite', start: 'top 80%' }, ({ fadeUp }) => fadeUp(title));
    await tick();

    expect(title.style.transform).toContain(`${travel.rise * 20 * 0.5}px`);
  });

  it('teardown restores the inline styles GSAP set, and reveals the root instead of re-hiding it', async () => {
    const kit = await coreKit();
    const title = root.querySelector('h2') as HTMLElement;
    const teardown = createScene(kit, { root, tier: 'full', start: 'top 80%' }, ({ fadeUp }) => fadeUp(title));
    await tick();
    expect(title.style.opacity).toBe('0');

    teardown();

    expect(title.style.opacity).toBe('');
    expect(title.style.transform).toBe('');
    expect(title.hasAttribute('data-revealed')).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
  });

  it('marks the targets revealed only when their tween starts, and clears its inline styles at the end', async () => {
    const kit = await coreKit();
    const title = root.querySelector('h2') as HTMLElement;
    const copy = root.querySelector('p') as HTMLElement;
    let timeline: ReturnType<typeof kit.gsap.timeline> | undefined;
    createScene(kit, { root, tier: 'full', start: 'top 80%' }, (scene) => {
      timeline = scene.timeline;
      scene.fadeUp(title, { at: 0 });
      scene.fadeUp(copy, { at: 5 });
    });
    expect(title.hasAttribute('data-revealed')).toBe(false);

    timeline?.pause().time(0.1, false); // inside the first tween, long before the second begins (events on: seek() would mute onStart)
    expect(title.hasAttribute('data-revealed')).toBe(true);
    expect(copy.hasAttribute('data-revealed')).toBe(false);

    timeline?.progress(1, false); // played out
    expect(title.style.opacity).toBe(''); // cleared: the CSS now owns the resting state
    expect(title.style.transform).toBe('');
    expect(copy.hasAttribute('data-revealed')).toBe(true);
  });

  it('a throwing build still reverts a real context and reveals the root', async () => {
    const kit = await coreKit();
    const title = root.querySelector('h2') as HTMLElement;

    expect(() =>
      createScene(kit, { root, tier: 'full', start: 'top 80%' }, ({ fadeUp }) => {
        fadeUp(title);
        throw new Error('missing part');
      }),
    ).toThrow('missing part');

    expect(title.style.opacity).toBe('');
    expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
  });
});
