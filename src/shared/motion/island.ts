import type { RefObject } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { type MotionTier, motionTierOf } from '@/shared/device';
import { type GsapKit, loadGsap } from './gsap';
import { type TierScale, scaleFor } from './tokens';

/**
 * Motion for Preact islands. A secondary entry, like `shared/focus/use-dialog`: only island code imports it, which keeps the
 * hooks out of the scene bundles. Islands never touch GSAP themselves. They describe their choreography as plain
 * `*.motion.ts` functions of `(node, tools)`, and these hooks decide whether and when to run them:
 *
 *  - on the static tier (reduced motion) GSAP is never downloaded and nothing is animated;
 *  - until GSAP has arrived, or if it never does, an interaction still works: it just is not animated.
 */

export interface MotionTools {
  readonly gsap: GsapKit['gsap'];
  /** Never `static`: there are no tools on that tier. */
  readonly tier: Exclude<MotionTier, 'static'>;
  readonly scale: TierScale;
}

/** The part of a GSAP animation these hooks drive. */
export interface Playing {
  kill: () => unknown;
  eventCallback: (type: 'onComplete', callback: () => void) => unknown;
}

/**
 * GSAP for an island, ready at the moment of use. Returns a function that yields the tools, or `null` while GSAP is still
 * downloading, if it failed to, or on the static tier. It is a function rather than state so that:
 *  - nothing re-renders when the download finishes;
 *  - the tier is read at the moment an animation starts, so a visitor who turns reduced motion on mid-visit is honoured.
 * The download starts with the island, so the first tap normally finds GSAP already there. A failed one is retried on the
 * next interaction.
 */
export function useMotion(): () => MotionTools | null {
  const kit = useRef<GsapKit | null>(null);
  const loading = useRef(false);

  const load = useCallback((): void => {
    if (kit.current || loading.current || motionTierOf(document) === 'static') return;
    loading.current = true;
    loadGsap().then(
      (loaded) => {
        kit.current = loaded;
        loading.current = false;
      },
      () => {
        loading.current = false;
      },
    );
  }, []);

  useEffect(load, [load]);

  return useCallback((): MotionTools | null => {
    const tier = motionTierOf(document);
    if (tier === 'static') return null;
    if (!kit.current) {
      load();
      return null;
    }
    return { gsap: kit.current.gsap, tier, scale: scaleFor(tier) };
  }, [load]);
}

export interface PresenceMotion<T extends HTMLElement> {
  /** The hidden state a freshly mounted node starts from. Applied before its first paint, so it never flashes at rest. */
  readonly from?: (node: T, tools: MotionTools) => void;
  /**
   * Plays the node in. When a closing node is reopened this runs again without `from`, so write it to continue from
   * wherever the node is (a `to` tween), not to restart.
   */
  readonly enter: (node: T, tools: MotionTools) => Playing | undefined;
  /** Plays the node out. It unmounts when the returned animation completes. */
  readonly exit: (node: T, tools: MotionTools) => Playing | undefined;
}

export interface Presence<T extends HTMLElement> {
  /** Render the node while this is true: from the render that opens it until its exit has played. */
  readonly present: boolean;
  readonly ref: RefObject<T | null>;
}

/** The attribute a node carries while its CSS fade (the no-GSAP fallback) runs: `enter` or `exit`. */
const FALLBACK = 'data-presence';
/** A CSS exit is over after this long even if `animationend` never comes (animations switched off, node not rendered). */
const CSS_EXIT_LIMIT_MS = 400;

interface Run {
  readonly stop: () => void;
  readonly exiting: boolean;
}

/**
 * Mounts a node while `open`, and keeps it mounted until its exit animation has played. The node exists in the very render
 * that opens it, so a dialog's focus trap (which looks for it in an effect) finds it.
 *
 * Without GSAP the node fades with CSS instead: it carries `data-presence="enter"` or `"exit"`, which base.css turns into a
 * short opacity fade. The exit waits for `animationend`, and does not wait at all for a node that has no such animation.
 */
export function usePresence<T extends HTMLElement>(open: boolean, motion: PresenceMotion<T>): Presence<T> {
  const getTools = useMotion();
  const ref = useRef<T>(null);
  const latest = useRef(motion);
  latest.current = motion;
  /** `open` as of the last commit. It is still true in the render that closes, which is how the node outlives it. */
  const wasOpen = useRef(false);
  const run = useRef<Run | null>(null);
  const [, setTick] = useState(0);
  /** The exit is over: render again so `present` drops and the node goes. */
  const rerender = useCallback((): void => setTick((count) => count + 1), []);

  const present = open || wasOpen.current || run.current?.exiting === true;

  useLayoutEffect(() => {
    const node = ref.current;
    const wasClosed = !wasOpen.current;
    wasOpen.current = open;

    if (open) {
      const resumed = run.current?.exiting === true;
      run.current?.stop();
      run.current = null;
      if (!node) return;

      const tools = getTools();
      if (!tools) {
        node.setAttribute(FALLBACK, 'enter');
        return;
      }
      node.removeAttribute(FALLBACK);
      if (!resumed) latest.current.from?.(node, tools);
      const playing = latest.current.enter(node, tools);
      if (playing) run.current = { stop: () => void playing.kill(), exiting: false };
      return;
    }

    if (wasClosed) return; // it never opened
    run.current?.stop();
    run.current = null;

    const finish = (): void => {
      run.current = null;
      rerender();
    };
    if (!node) {
      finish();
      return;
    }

    const tools = getTools();
    if (tools) {
      node.removeAttribute(FALLBACK);
      const playing = latest.current.exit(node, tools);
      if (!playing) {
        finish();
        return;
      }
      playing.eventCallback('onComplete', finish);
      run.current = { stop: () => void playing.kill(), exiting: true };
      return;
    }

    node.setAttribute(FALLBACK, 'exit');
    if (getComputedStyle(node).animationName === 'none') {
      finish();
      return;
    }
    const stop = (): void => {
      window.clearTimeout(timer);
      node.removeEventListener('animationend', onEnd);
    };
    const done = (): void => {
      stop();
      finish();
    };
    const onEnd = (event: Event): void => {
      if (event.target === node) done();
    };
    const timer = window.setTimeout(done, CSS_EXIT_LIMIT_MS);
    node.addEventListener('animationend', onEnd);
    run.current = { stop, exiting: true };
  }, [open, getTools, rerender]);

  useEffect(
    () => () => {
      run.current?.stop();
      run.current = null;
    },
    [],
  );

  return { present, ref };
}
