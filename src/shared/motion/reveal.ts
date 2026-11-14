import type { GsapKit } from './gsap';
import { markRevealed } from './gsap';
import { ease, scaleFor } from './tokens';

export interface RevealOptions {
  /** Plays when this element reaches `start`. */
  readonly trigger: Element;
  readonly targets: readonly Element[];
  readonly tier: 'full' | 'lite' | 'static';
  /** ScrollTrigger start, default "top 80%". */
  readonly start?: string;
  /** Rise distance in px (scaled down on the lite tier). */
  readonly distance?: number;
  /** Seconds between targets. */
  readonly stagger?: number;
}

/**
 * Generic fade-up reveal. Position-triggered and time-based (never scrubbed), plays once.
 * Marks targets `data-revealed` as soon as they start so the CSS pre-hidden state hands over to GSAP
 * without a flash, then clears inline styles so the element ends in its natural CSS state.
 *
 * Animates `opacity` only, never `autoAlpha`/`visibility`: hidden content cannot take keyboard focus, so a
 * visibility toggle would make controls unreachable (or blur the focused one) until the tween ran.
 * Returns a teardown.
 */
export function revealOnEnter({ gsap }: GsapKit, options: RevealOptions): () => void {
  const scale = scaleFor(options.tier);
  const targets = [...options.targets];

  const tween = gsap.fromTo(
    targets,
    { opacity: 0, y: (options.distance ?? 28) * scale.distance },
    {
      opacity: 1,
      y: 0,
      duration: 0.7 * scale.time,
      ease: ease.soft,
      stagger: options.stagger ?? 0.15,
      clearProps: 'transform,opacity,visibility',
      onStart: () => markRevealed(targets),
      scrollTrigger: { trigger: options.trigger, start: options.start ?? 'top 80%', once: true },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(targets, { clearProps: 'all' });
    markRevealed(targets);
  };
}
