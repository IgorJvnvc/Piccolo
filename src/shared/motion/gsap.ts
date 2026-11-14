/**
 * The ONLY module that imports `gsap`. GSAP + ScrollTrigger are loaded on demand, once, in their own chunk, so pages
 * that never animate (static/reduced-motion tier) never download them.
 */
export interface GsapKit {
  readonly gsap: typeof import('gsap').gsap;
  readonly ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
}

let pending: Promise<GsapKit> | undefined;

/**
 * `gsap.ticker.lagSmoothing(threshold, adjustedLag)`: a frame that arrives later than `threshold` ms counts as `adjustedLag`
 * ms. GSAP's own default threshold is 500 ms, so a 300 ms hitch (the first frame of something big on a weak device) is charged
 * in full to the animation that starts in it, and a 450 ms fade first shows at 90%. At 60 ms the hitch delays the animation
 * instead. Smooth scroll turns it off while it runs, because Lenis needs real time, and puts this back on teardown.
 */
export const LAG_SMOOTHING = [60, 33] as const;

async function load(): Promise<GsapKit> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(...LAG_SMOOTHING);
  return { gsap, ScrollTrigger };
}

/**
 * Loads the kit once and shares it. A failed download is forgotten, so the next caller (the next scene to start)
 * retries instead of inheriting a rejection for the rest of the visit.
 */
export function loadGsap(): Promise<GsapKit> {
  pending ??= load().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
