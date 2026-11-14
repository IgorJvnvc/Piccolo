/**
 * The ONLY module that imports `gsap`. GSAP + ScrollTrigger are loaded on demand, once, in their own
 * chunk, so pages that never animate (static/reduced-motion tier) never download them.
 */
export interface GsapKit {
  readonly gsap: typeof import('gsap').gsap;
  readonly ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
}

let pending: Promise<GsapKit> | undefined;

export function loadGsap(): Promise<GsapKit> {
  pending ??= (async (): Promise<GsapKit> => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  })();
  return pending;
}

/** Marks elements as revealed so the CSS "pre-hidden" state (base.css) stops applying. */
export function markRevealed(elements: Iterable<Element>): void {
  for (const el of elements) el.setAttribute('data-revealed', '');
}
