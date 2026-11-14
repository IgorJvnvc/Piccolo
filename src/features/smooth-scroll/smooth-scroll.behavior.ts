import { defineEnhancement } from '@/shared/enhance';
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

  async setup({ bus, signal, gsap: loadGsap }) {
    const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import('lenis'), loadGsap()]);
    if (signal.aborted) return undefined;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number): void => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const release = setScrollDriver((target, { offset }) => {
      lenis.scrollTo(target, { offset, duration: 1.2 });
    });

    bus.on('scroll:lock', ({ locked }) => (locked ? lenis.stop() : lenis.start()), { signal });

    return () => {
      release();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  },
});
