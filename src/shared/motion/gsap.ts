/**
 * The ONLY module that imports `gsap`. GSAP + ScrollTrigger are loaded on demand, once, in their own chunk, so pages
 * that never animate (static/reduced-motion tier) never download them.
 */
export interface GsapKit {
  readonly gsap: typeof import('gsap').gsap;
  readonly ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
}

let pending: Promise<GsapKit> | undefined;

async function load(): Promise<GsapKit> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
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
