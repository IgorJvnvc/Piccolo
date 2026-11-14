import type { Capabilities } from '@/shared/device';
import { type Enhancement, type EnhancementContext, type Teardown, qualifies } from '@/shared/enhance';
import type { GsapKit } from '@/shared/motion';
import type { Services } from '@/shared/services';
import { whenIdle, whenVisible } from './timing';

export interface SchedulerDeps {
  readonly doc: Document;
  readonly services: Services;
  readonly gsap: () => Promise<GsapKit>;
  /** Overridable for tests. */
  readonly timing?: {
    readonly whenIdle: typeof whenIdle;
    readonly whenVisible: typeof whenVisible;
  };
}

interface Running {
  readonly controller: AbortController;
  cancelWait: () => void;
  teardown: Teardown | undefined;
}

export interface Scheduler {
  /** Starts enhancements that now qualify, stops ones that no longer do. Safe to call repeatedly. */
  reconcile(caps: Capabilities): void;
  destroy(): void;
}

/**
 * Decides WHAT runs (tier + capability gates, re-evaluated on every capability change) and WHEN
 * (load / idle / visible). Each (enhancement, root) pair is isolated: one failure never affects another.
 */
export function createScheduler(enhancements: readonly Enhancement[], deps: SchedulerDeps): Scheduler {
  const timing = deps.timing ?? { whenIdle, whenVisible };
  const running = new Map<Enhancement, Map<HTMLElement, Running>>();

  const start = (enhancement: Enhancement, root: HTMLElement, caps: Capabilities): void => {
    const controller = new AbortController();
    const entry: Running = { controller, cancelWait: () => undefined, teardown: undefined };
    let bucket = running.get(enhancement);
    if (!bucket) {
      bucket = new Map();
      running.set(enhancement, bucket);
    }
    bucket.set(root, entry);

    const context: EnhancementContext = {
      root,
      caps,
      services: deps.services,
      bus: deps.services.bus,
      signal: controller.signal,
      gsap: deps.gsap,
    };

    const run = (): void => {
      if (controller.signal.aborted) return;
      Promise.resolve()
        .then(() => enhancement.setup(context))
        .then((teardown) => {
          if (typeof teardown !== 'function') return;
          if (controller.signal.aborted) teardown();
          else entry.teardown = teardown;
        })
        .catch((error: unknown) => console.error(`[enhance] "${enhancement.id}" failed`, error));
    };

    switch (enhancement.when) {
      case 'load':
        run();
        break;
      case 'idle':
        entry.cancelWait = timing.whenIdle(run);
        break;
      case 'visible':
        entry.cancelWait = timing.whenVisible(root, run);
        break;
    }
  };

  const stop = (enhancement: Enhancement, root: HTMLElement): void => {
    const bucket = running.get(enhancement);
    const entry = bucket?.get(root);
    if (!bucket || !entry) return;
    entry.cancelWait();
    entry.controller.abort();
    try {
      entry.teardown?.();
    } catch (error) {
      console.error(`[enhance] "${enhancement.id}" teardown failed`, error);
    }
    bucket.delete(root);
  };

  return {
    reconcile(caps) {
      for (const enhancement of enhancements) {
        const roots = Array.from(deps.doc.querySelectorAll<HTMLElement>(enhancement.selector));
        const wanted = qualifies(enhancement, caps) ? new Set(roots) : new Set<HTMLElement>();

        for (const root of wanted) {
          if (!running.get(enhancement)?.has(root)) start(enhancement, root, caps);
        }
        for (const root of Array.from(running.get(enhancement)?.keys() ?? [])) {
          if (!wanted.has(root)) stop(enhancement, root);
        }
      }
    },

    destroy() {
      for (const [enhancement, bucket] of running) {
        for (const root of Array.from(bucket.keys())) stop(enhancement, root);
      }
      running.clear();
    },
  };
}
