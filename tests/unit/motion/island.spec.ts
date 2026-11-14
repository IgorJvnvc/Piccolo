// @vitest-environment happy-dom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MotionTools, type Playing, type PresenceMotion, useMotion, usePresence } from '@/shared/motion/island';

const loadGsap = vi.hoisted(() => vi.fn());
vi.mock('@/shared/motion/gsap', () => ({ loadGsap }));

const kit = { gsap: { marker: 'gsap' }, ScrollTrigger: {} };
const root = document.documentElement;
let container: HTMLElement;

/** A stand-in for a GSAP animation that the test completes by hand. */
function fakeAnimation() {
  let onComplete: (() => void) | undefined;
  return {
    kill: vi.fn(),
    eventCallback: vi.fn((_type: 'onComplete', callback: () => void) => {
      onComplete = callback;
    }),
    complete: (): void => onComplete?.(),
  };
}

/** Lets a resolved download (a microtask) land, and Preact flush what it scheduled. */
const settle = (): Promise<void> => act(async () => void (await Promise.resolve()));

beforeEach(() => {
  root.setAttribute('data-motion', 'full');
  loadGsap.mockResolvedValue(kit);
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  act(() => render(null, container));
  container.remove();
  root.removeAttribute('data-motion');
  vi.useRealTimers();
});

describe('useMotion', () => {
  function probe() {
    const seen: { get: () => MotionTools | null } = { get: () => null };
    const Probe = () => {
      seen.get = useMotion();
      return null;
    };
    act(() => render(h(Probe, {}), container));
    return seen;
  }

  it('starts the download with the island and offers the tools once they have arrived', async () => {
    const seen = probe();
    expect(loadGsap).toHaveBeenCalledTimes(1);
    expect(seen.get()).toBeNull(); // still downloading: not an error, the interaction just is not animated

    await settle();

    expect(seen.get()).toEqual({ gsap: kit.gsap, tier: 'full', scale: { distance: 1, speed: 1 } });
  });

  it('scales the tools for the lite tier', async () => {
    root.setAttribute('data-motion', 'lite');
    const seen = probe();
    await settle();

    expect(seen.get()).toMatchObject({ tier: 'lite', scale: { distance: 0.5, speed: 4 / 3 } });
  });

  it('never downloads GSAP on the static tier', async () => {
    root.setAttribute('data-motion', 'static');
    const seen = probe();
    await settle();

    expect(loadGsap).not.toHaveBeenCalled();
    expect(seen.get()).toBeNull();
    expect(loadGsap).not.toHaveBeenCalled();
  });

  it('reads the tier when an animation starts, so reduced motion switched on mid-visit is honoured', async () => {
    const seen = probe();
    await settle();
    expect(seen.get()).not.toBeNull();

    root.setAttribute('data-motion', 'static');

    expect(seen.get()).toBeNull();
  });

  it('retries a failed download on the next interaction instead of giving up for the visit', async () => {
    loadGsap.mockRejectedValueOnce(new Error('chunk failed'));
    const seen = probe();
    await settle();
    expect(seen.get()).toBeNull(); // the retry starts here
    expect(loadGsap).toHaveBeenCalledTimes(2);

    await settle();

    expect(seen.get()).not.toBeNull();
  });
});

describe('usePresence', () => {
  function mount(motion: PresenceMotion<HTMLDivElement>, open: boolean) {
    const Host = (props: { open: boolean }) => {
      const { present, ref } = usePresence<HTMLDivElement>(props.open, motion);
      return present ? h('div', { id: 'node', ref }) : null;
    };
    const set = (next: boolean): void => void act(() => render(h(Host, { open: next }), container));
    set(open);
    return { set, node: (): HTMLElement | null => container.querySelector<HTMLElement>('#node') };
  }

  const motionWith = (parts: { enter?: () => Playing | undefined; exit?: () => Playing | undefined } = {}) => {
    const entering = fakeAnimation();
    const leaving = fakeAnimation();
    const motion = {
      from: vi.fn(),
      enter: vi.fn(parts.enter ?? (() => entering)),
      exit: vi.fn(parts.exit ?? (() => leaving)),
    } satisfies PresenceMotion<HTMLDivElement>;
    return { motion, entering, leaving };
  };

  it('renders nothing while closed', async () => {
    const { motion } = motionWith();
    const { node } = mount(motion, false);
    await settle();

    expect(node()).toBeNull();
    expect(motion.from).not.toHaveBeenCalled();
    expect(motion.enter).not.toHaveBeenCalled();
  });

  it('puts the node in the very render that opens it, hides it, then plays it in', async () => {
    const { motion } = motionWith();
    const { set, node } = mount(motion, false);
    await settle();

    set(true);

    const element = node();
    expect(element).not.toBeNull(); // a dialog looks for its node in an effect of the same commit
    expect(motion.from).toHaveBeenCalledWith(element, expect.objectContaining({ tier: 'full' }));
    expect(motion.enter).toHaveBeenCalledWith(element, expect.objectContaining({ tier: 'full' }));
    expect(motion.from.mock.invocationCallOrder[0]).toBeLessThan(motion.enter.mock.invocationCallOrder[0] ?? 0);
  });

  it('keeps the node through its exit, and removes it when the exit completes', async () => {
    const { motion, leaving } = motionWith();
    const { set, node } = mount(motion, false);
    await settle();
    set(true);

    set(false);
    expect(node()).not.toBeNull();
    expect(motion.exit).toHaveBeenCalledTimes(1);

    act(() => leaving.complete());
    expect(node()).toBeNull();
  });

  it('keeps the node through its exit even when the host re-renders in the meantime', async () => {
    const { motion, leaving } = motionWith();
    const { set, node } = mount(motion, false);
    await settle();
    set(true);
    set(false);

    set(false); // an unrelated re-render while the exit is still playing
    expect(node()).not.toBeNull();

    act(() => leaving.complete());
    expect(node()).toBeNull();
  });

  it('removes the node at once when there is nothing to play out', async () => {
    const { motion } = motionWith({ exit: () => undefined });
    const { set, node } = mount(motion, false);
    await settle();
    set(true);

    set(false);

    expect(node()).toBeNull();
  });

  it('reopening during the exit stops the exit and carries on in, without hiding the node again', async () => {
    const entrances = [fakeAnimation(), fakeAnimation()];
    const { motion, leaving } = motionWith({ enter: () => entrances.shift() });
    const { set, node } = mount(motion, false);
    await settle();
    set(true);
    set(false);
    expect(node()).not.toBeNull();

    set(true);

    expect(leaving.kill).toHaveBeenCalledTimes(1);
    expect(motion.from).toHaveBeenCalledTimes(1); // the first open only
    expect(motion.enter).toHaveBeenCalledTimes(2);
    act(() => leaving.complete()); // a stale completion must not remove a node that is open again
    expect(node()).not.toBeNull();
  });

  it('stops the entrance when the exit begins', async () => {
    const { motion, entering } = motionWith();
    const { set } = mount(motion, false);
    await settle();
    set(true);

    set(false);

    expect(entering.kill).toHaveBeenCalledTimes(1);
  });

  it('stops whatever is playing when it unmounts', async () => {
    const { motion, entering } = motionWith();
    const { set } = mount(motion, false);
    await settle();
    set(true);

    act(() => render(null, container));

    expect(entering.kill).toHaveBeenCalledTimes(1);
  });

  it('starts from hidden again on a second, separate open', async () => {
    const { motion, leaving } = motionWith();
    const { set } = mount(motion, false);
    await settle();
    set(true);
    set(false);
    act(() => leaving.complete());

    set(true);

    expect(motion.from).toHaveBeenCalledTimes(2);
  });

  describe('without GSAP: the CSS fade', () => {
    const animated = (animationName: string) =>
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ animationName } as unknown as CSSStyleDeclaration);

    it('marks the node as entering and leaves the choreography alone (static tier)', async () => {
      root.setAttribute('data-motion', 'static');
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();

      set(true);

      expect(node()?.getAttribute('data-presence')).toBe('enter');
      expect(motion.from).not.toHaveBeenCalled();
      expect(motion.enter).not.toHaveBeenCalled();
    });

    it('also falls back while GSAP is still downloading', async () => {
      loadGsap.mockReturnValue(new Promise(() => undefined));
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();

      set(true);

      expect(node()?.getAttribute('data-presence')).toBe('enter');
      expect(motion.enter).not.toHaveBeenCalled();
    });

    it('keeps the node until its fade ends', async () => {
      root.setAttribute('data-motion', 'static');
      animated('presence-fade');
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();
      set(true);

      set(false);
      expect(node()?.getAttribute('data-presence')).toBe('exit');

      act(() => void node()?.dispatchEvent(new Event('animationend', { bubbles: true })));
      expect(node()).toBeNull();
    });

    it('is not ended by the animation of something inside the node', async () => {
      root.setAttribute('data-motion', 'static');
      animated('presence-fade');
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();
      set(true);
      set(false);
      const child = document.createElement('span');
      node()?.append(child);

      act(() => void child.dispatchEvent(new Event('animationend', { bubbles: true })));

      expect(node()).not.toBeNull();
    });

    it('gives up waiting after a moment if the animation never ends', async () => {
      vi.useFakeTimers();
      root.setAttribute('data-motion', 'static');
      animated('presence-fade');
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();
      set(true);
      set(false);

      act(() => void vi.advanceTimersByTime(399));
      expect(node()).not.toBeNull();
      act(() => void vi.advanceTimersByTime(2));

      expect(node()).toBeNull();
    });

    it('does not wait at all for a node that has no CSS animation', async () => {
      root.setAttribute('data-motion', 'static');
      animated('none');
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();
      set(true);

      set(false);

      expect(node()).toBeNull();
    });

    it('hands a node over cleanly if GSAP arrives between its entrance and its exit', async () => {
      let arrive: (value: typeof kit) => void = () => undefined;
      loadGsap.mockReturnValueOnce(new Promise((resolve) => (arrive = resolve))); // not downloaded yet when it opens
      const { motion } = motionWith();
      const { set, node } = mount(motion, false);
      await settle();
      set(true);
      expect(node()?.getAttribute('data-presence')).toBe('enter');

      arrive(kit);
      await settle();
      set(false);

      expect(motion.exit).toHaveBeenCalledTimes(1);
      // A CSS animation left on the node would override GSAP's inline opacity and the exit would never show.
      expect(node()?.hasAttribute('data-presence')).toBe(false);
    });
  });
});
