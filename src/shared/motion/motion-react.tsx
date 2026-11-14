/**
 * The ONLY module family that imports `motion/react` (Motion for React, running on Preact via
 * preact/compat). Islands import from here, never from `motion/react` directly.
 *
 * `LazyMotion` + `m.*` keeps the initial island payload tiny: the animation features are a separate
 * lazy chunk (`motion-features.ts`).
 */
import type { ComponentChildren } from 'preact';
import { LazyMotion, MotionConfig } from 'motion/react';

export { AnimatePresence, m, useReducedMotion } from 'motion/react';

const loadFeatures = (): Promise<typeof import('./motion-features').default> =>
  import('./motion-features').then((mod) => mod.default);

export interface MotionRootProps {
  readonly children: ComponentChildren;
}

/** Wrap an island's tree once. Honors the user's reduced-motion preference automatically. */
export function MotionRoot({ children }: MotionRootProps) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
