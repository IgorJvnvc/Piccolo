/** GSAP ease names matching the CSS curves (tokens.css). Keep in sync. */
export const ease = {
  /** cubic-bezier(.22,1,.36,1) */
  out: 'power4.out',
  /** cubic-bezier(.16,1,.3,1) */
  expo: 'expo.out',
  /** cubic-bezier(.33,1,.68,1) */
  soft: 'power3.out',
} as const;

/** The reel's measured stagger values (seconds). */
export const stagger = {
  cards: 0.3,
  copy: 0.2,
} as const;

/** The lite tier (TV / low-end) travels less and finishes sooner. */
export function scaleFor(tier: 'full' | 'lite' | 'static'): { readonly distance: number; readonly time: number } {
  return tier === 'full' ? { distance: 1, time: 1 } : { distance: 0.5, time: 0.75 };
}
