import type { Capabilities, MotionTier } from '@/shared/device';
import type { AppBus } from '@/shared/events';
import type { GsapKit } from '@/shared/motion';

/**
 * When an enhancement starts:
 * - load:    right after boot
 * - idle:    when the main thread is idle (smooth scroll, ...)
 * - visible: when its root element approaches the viewport (scroll scenes)
 */
export type When = 'load' | 'idle' | 'visible';

export interface EnhancementContext {
  /** The element that matched `selector`. */
  readonly root: HTMLElement;
  readonly caps: Capabilities;
  readonly bus: AppBus;
  /** Aborted when this enhancement is torn down (capabilities changed, page hidden for good, ...). */
  readonly signal: AbortSignal;
  /** Loads GSAP + ScrollTrigger on demand (one shared chunk). */
  readonly gsap: () => Promise<GsapKit>;
}

export type Teardown = () => void;

/**
 * A unit of progressive enhancement: a `*.scene.ts` (scroll/animation) or `*.behavior.ts` (interaction).
 * The default export of every such file is found by runtime/registry.ts via import.meta.glob.
 */
export interface Enhancement {
  readonly id: string;
  /** CSS selector of the root(s), usually `[data-enhance="name"]` (see shared/lib/hooks). */
  readonly selector: string;
  readonly when: When;
  /** Motion tiers it may run on. Default: full + lite (static/reduced-motion skips animation). */
  readonly tiers?: readonly MotionTier[];
  /** Extra capability gate, re-evaluated whenever capabilities change. */
  readonly enabled?: (caps: Capabilities) => boolean;
  /**
   * Called when `setup` fails, so a broken enhancement can leave the page usable (a scene reveals what it hid).
   * It must be safe to call at any time and more than once.
   */
  readonly recover?: (root: HTMLElement) => void;
  // `void` is intentional: most setups return nothing, and `() => {}` is only assignable to a `void` return.
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  setup(context: EnhancementContext): void | Teardown | Promise<void | Teardown>;
}

const DEFAULT_TIERS: readonly MotionTier[] = ['full', 'lite'];

export const defineEnhancement = (definition: Enhancement): Enhancement => definition;

/** Pure gate used by the scheduler (unit-tested). */
export function qualifies(enhancement: Enhancement, caps: Capabilities): boolean {
  const tiers = enhancement.tiers ?? DEFAULT_TIERS;
  if (!tiers.includes(caps.motion)) return false;
  return enhancement.enabled ? enhancement.enabled(caps) : true;
}
