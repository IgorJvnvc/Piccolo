import { ease } from '@/shared/motion';
import type { MotionTools, Playing } from '@/shared/motion/island';

/** Seconds and pixels from the menu browser's own design, not from the reel. */
const PILL = { duration: 0.45 } as const;
const CARDS = { duration: 0.5, stagger: 0.06, rise: 28 } as const;

/** Where the selected tab's pill is, measured from the tab list's left edge so that scrolling the tab row does not matter. */
export interface PillBox {
  readonly left: number;
  readonly width: number;
}

/** The pill as it looks right now, mid-slide included, or `null` if there is none. */
export function measurePill(list: HTMLElement | null): PillBox | null {
  const pill = list?.querySelector<HTMLElement>('[data-part="pill"]');
  if (!list || !pill) return null;
  const box = pill.getBoundingClientRect();
  return { left: box.left - list.getBoundingClientRect().left, width: box.width };
}

/**
 * The new selection's pill slides in from where the old one was. Selecting re-renders the pill inside the newly selected
 * tab, so it starts at its resting place; this tween gives it the old position and width and eases it home, the way a
 * shared-layout animation does. Nothing to do if it did not move.
 */
export function slidePill(list: HTMLElement, from: PillBox, { gsap, scale }: MotionTools): Playing | undefined {
  const pill = list.querySelector<HTMLElement>('[data-part="pill"]');
  const to = measurePill(list);
  if (!pill || !to) return undefined;
  const moved = Math.abs(from.left - to.left) >= 0.5 || Math.abs(from.width - to.width) >= 0.5;
  if (!moved) return undefined;

  const timeline = gsap.timeline();
  timeline.fromTo(
    pill,
    { x: from.left - to.left, width: from.width },
    { x: 0, width: to.width, duration: PILL.duration, ease: ease.out, clearProps: 'transform,width' },
  );
  return timeline.timeScale(scale.speed);
}

/** The cards of a newly shown category rise in one after another. */
export function revealCards(cards: ArrayLike<Element>, { gsap, scale }: MotionTools): Playing | undefined {
  if (cards.length === 0) return undefined;
  const timeline = gsap.timeline();
  timeline.fromTo(
    cards,
    { opacity: 0, y: CARDS.rise * scale.distance },
    { opacity: 1, y: 0, duration: CARDS.duration, ease: ease.out, stagger: CARDS.stagger, clearProps: 'opacity,transform' },
  );
  return timeline.timeScale(scale.speed);
}
