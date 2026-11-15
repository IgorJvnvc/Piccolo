import { afterEach, describe, expect, it, vi } from 'vitest';
import { LAG_SMOOTHING } from '@/shared/motion/gsap';

afterEach(() => {
  vi.doUnmock('gsap');
  vi.doUnmock('gsap/ScrollTrigger');
  vi.resetModules();
});

/** A fresh copy of the module (its `pending` state is module-level) with `gsap` mocked. */
async function loaderWith(registerPlugin: () => void, lagSmoothing: (...args: number[]) => void = () => undefined) {
  vi.resetModules();
  vi.doMock('gsap', () => ({ gsap: { registerPlugin, ticker: { lagSmoothing } } }));
  vi.doMock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { id: 'scroll-trigger' } }));
  return (await import('@/shared/motion/gsap')).loadGsap;
}

describe('loadGsap', () => {
  it('loads once, registers ScrollTrigger once, and shares the result', async () => {
    const registerPlugin = vi.fn();
    const lagSmoothing = vi.fn();
    const loadGsap = await loaderWith(registerPlugin, lagSmoothing);

    const first = loadGsap();
    expect(loadGsap()).toBe(first);
    const kit = await first;

    expect(registerPlugin).toHaveBeenCalledTimes(1);
    expect(registerPlugin).toHaveBeenCalledWith(kit.ScrollTrigger);
    expect(lagSmoothing).toHaveBeenCalledExactlyOnceWith(...LAG_SMOOTHING);
    expect(await loadGsap()).toBe(kit);
  });

  it('forgets a failed load, so the next caller retries instead of inheriting the rejection', async () => {
    let failing = true;
    const registerPlugin = vi.fn(() => {
      if (failing) throw new Error('chunk failed to load');
    });
    const loadGsap = await loaderWith(registerPlugin);

    await expect(loadGsap()).rejects.toThrow('chunk failed to load');

    failing = false;
    const kit = await loadGsap();
    expect(kit.ScrollTrigger).toEqual({ id: 'scroll-trigger' });
    expect(registerPlugin).toHaveBeenCalledTimes(2);
  });
});
