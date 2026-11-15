import { defineEnhancement } from '@/shared/enhance';
import { LAG_SMOOTHING } from '@/shared/motion';
import { setScrollDriver } from './controller';

/**
 * Lenis smooth scroll: the reel's decelerating glide after each wheel step.
 * Desktop + fine pointer + full motion tier only. Touch keeps native momentum, TVs and
 * reduced-motion visitors keep native scrolling. Synced with GSAP's ticker so ScrollTrigger stays exact.
 */
export default defineEnhancement({
  id: 'smooth-scroll',
  selector: 'html',
  when: 'idle',
  tiers: ['full'],
  enabled: (caps) => caps.pointer === 'fine' && (caps.device === 'laptop' || caps.device === 'desktop'),

  async setup({ root, bus, signal, gsap: loadGsap }) {
    const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import('lenis'), loadGsap()]);
    if (signal.aborted) return undefined;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    // A dialog may have opened before Lenis finished loading: its `scroll:lock` event is long gone, the attribute it set is not.
    if (root.hasAttribute('data-scroll-lock')) lenis.stop();

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number): void => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Lenis measures real time, so GSAP must not stretch it after a hitch. This is global to GSAP, so it is undone on teardown.
    gsap.ticker.lagSmoothing(0);

    // No offset: Lenis reads the CSS `scroll-padding-top` and the target's `scroll-margin-top` itself, and adding one here counted them twice.
    const release = setScrollDriver((target) => {
      lenis.scrollTo(target, { duration: 1.2 });
    });

    bus.on('scroll:lock', ({ locked }) => (locked ? lenis.stop() : lenis.start()), { signal });

    return () => {
      release();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(...LAG_SMOOTHING);
      lenis.destroy();
    };
  },
});
