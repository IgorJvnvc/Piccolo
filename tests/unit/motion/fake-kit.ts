import { vi } from 'vitest';
import type { GsapKit } from '@/shared/motion';

/**
 * A stand-in for the GSAP kit that records what a scene asks of it. It lets the scene helper's orchestration be
 * tested exactly (defaults, trigger config, cleanup) without a layout engine; the real animation is covered by the
 * Playwright suite and the motion profile.
 */
export function fakeKit() {
  const timeline = { timeScale: vi.fn(), fromTo: vi.fn(), eventCallback: vi.fn() };
  const context = { add: vi.fn(<T>(callback: () => T): T => callback()), revert: vi.fn() };
  const gsap = { context: vi.fn(() => context), timeline: vi.fn((_vars: unknown) => timeline) };
  return { kit: { gsap, ScrollTrigger: {} } as unknown as GsapKit, gsap, timeline, context };
}

/** The `vars` object the scene passed to `gsap.timeline(...)`. */
export function timelineVars(gsap: ReturnType<typeof fakeKit>['gsap']) {
  const vars = gsap.timeline.mock.calls[0]?.[0] as {
    defaults: Record<string, unknown> & { onStart: (this: { targets: () => unknown[] }) => void };
    scrollTrigger: Record<string, unknown>;
  };
  return vars;
}
