import type { MotionTier } from '@/shared/device';

/**
 * GSAP eases matching the CSS curves in tokens.css (`--ease-*`). tests/unit/motion/tokens.spec.ts samples both and
 * fails when they drift apart.
 */
export const ease = {
  /** --ease-out: cubic-bezier(.22,1,.36,1), quint-out. */
  out: 'power4.out',
  /** --ease-expo: cubic-bezier(.16,1,.3,1), expo-out. */
  expo: 'expo.out',
  /** --ease-soft: cubic-bezier(.25,1,.5,1), quart-out. The reveals' curve, fitted to the reel. */
  soft: 'power3.out',
  /** A quick opacity-only fade (no CSS counterpart). */
  fade: 'power1.out',
} as const;

/** Reveal timings in seconds, measured from the reel. */
export const duration = {
  /** Copy, headings and panels fading up. */
  reveal: 0.7,
  /** Dish cards: ~0.6 s to the eye, because the ease's tail is imperceptible. */
  card: 0.8,
  /** The food cluster flying in. */
  cluster: 1.1,
} as const;

/** Seconds between staggered targets, measured from the reel. */
export const stagger = {
  cards: 0.3,
  copy: 0.2,
} as const;

/**
 * Travel in rem, calibrated at the reference viewport (13.92 px per rem at 1253 px wide). The layout scales with the
 * root font size above 1024 px, so its motion must scale with it: fixed pixels were 53% too small on a TV (21.3 px/rem).
 */
export const travel = {
  /** Label, paragraph, CTA. */
  copy: 1.75,
  /** Headings and panels. */
  rise: 2,
  /** Dish cards. */
  card: 8,
  /** The food cluster's flight from the bottom-left. */
  cluster: 6.5,
} as const;

/** ScrollTrigger `start` per scene: the viewport line the trigger's top crosses to play the scene. */
export const enter = {
  about: 'top 72%',
  popular: 'top 85%',
  menu: 'top 78%',
  visit: 'top 78%',
  follow: 'top 70%',
} as const;

export interface TierScale {
  /** Multiplies every travel distance. */
  readonly distance: number;
  /** The scene timeline's `timeScale`: durations, delays and staggers all run this much faster. */
  readonly speed: number;
}

/** The lite tier (TV, low-end) travels half as far and runs a third faster. Scenes never run on the static tier. */
export function scaleFor(tier: MotionTier): TierScale {
  return tier === 'full' ? { distance: 1, speed: 1 } : { distance: 0.5, speed: 4 / 3 };
}
