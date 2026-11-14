import type { Enhancement } from '@/shared/enhance';

/**
 * Every `*.scene.ts` and `*.behavior.ts` in the project, discovered at build time.
 * Eager on purpose: each module is tiny (GSAP/Lenis are lazy-imported inside them), so one boot chunk
 * knows what exists and decides WHEN to run it (see scheduler.ts).
 */
const modules = import.meta.glob<Enhancement>('/src/**/*.{scene,behavior}.ts', {
  eager: true,
  import: 'default',
});

export const enhancements: readonly Enhancement[] = Object.values(modules);
