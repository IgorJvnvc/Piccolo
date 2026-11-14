// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScene, duration, ease, type Scene, travel } from '@/shared/motion';
import { fakeKit, timelineVars } from './fake-kit';

let root: HTMLElement;

beforeEach(() => {
  document.documentElement.style.fontSize = '20px';
  document.body.innerHTML = `
    <section id="root">
      <h2 data-reveal="up">Title</h2>
      <p data-reveal="up">Copy</p>
      <div data-part="stage" data-state="idle"></div>
    </section>`;
  root = document.getElementById('root') as HTMLElement;
});

afterEach(() => {
  document.documentElement.style.fontSize = '';
  document.body.innerHTML = '';
});

const start = 'top 80%';

describe('createScene', () => {
  it('scopes one GSAP context to the root', () => {
    const { kit, gsap, context } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);

    expect(gsap.context).toHaveBeenCalledTimes(1);
    expect(gsap.context).toHaveBeenCalledWith(expect.any(Function), root);
    expect(context.add).toHaveBeenCalledTimes(1);
  });

  it('plays once from a re-measuring ScrollTrigger on the root, never scrubbed', () => {
    const { kit, gsap } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);

    expect(timelineVars(gsap).scrollTrigger).toEqual({ trigger: root, start, once: true, invalidateOnRefresh: true });
  });

  it('triggers on the given element instead of the root when asked (an animated root would be measured displaced)', () => {
    const { kit, gsap } = fakeKit();
    const trigger = root.querySelector('h2') as HTMLElement;
    createScene(kit, { root, tier: 'full', start, trigger }, () => undefined);

    expect(timelineVars(gsap).scrollTrigger['trigger']).toBe(trigger);
  });

  it('gives every tween the same ease and duration through the timeline defaults', () => {
    const { kit, gsap } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);

    expect(timelineVars(gsap).defaults).toMatchObject({ ease: ease.soft, duration: duration.reveal });
  });

  it('keeps clearProps OUT of the defaults: a fromTo inherits them into its internal start-state tween, which would wipe the from-state at once', () => {
    const { kit, gsap } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);

    expect(timelineVars(gsap).defaults).not.toHaveProperty('clearProps');
  });

  it.each([
    ['full', 1],
    ['lite', 4 / 3],
  ] as const)('runs the %s tier at timeScale %d, so durations, delays and staggers scale together', (tier, speed) => {
    const { kit, timeline } = fakeKit();
    createScene(kit, { root, tier, start }, () => undefined);

    expect(timeline.timeScale).toHaveBeenCalledWith(speed);
  });

  it('hands a tween’s targets over from the CSS pre-state when that tween starts, not before', () => {
    const { kit, gsap } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);
    const [title, copy] = root.querySelectorAll('[data-reveal]');
    expect(root.querySelectorAll('[data-revealed]')).toHaveLength(0);

    timelineVars(gsap).defaults.onStart.call({ targets: () => [title] });

    expect(title?.hasAttribute('data-revealed')).toBe(true);
    expect(copy?.hasAttribute('data-revealed')).toBe(false);
  });

  describe('scene.fadeUp', () => {
    const build = (tier: 'full' | 'lite', use: (scene: Scene) => void) => {
      const kit = fakeKit();
      createScene(kit.kit, { root, tier, start }, use);
      return kit;
    };

    it('fades from 0 and rises from a function-based distance, to rest', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline } = build('full', (scene) => scene.fadeUp(target));

      const [targets, from, to] = timeline.fromTo.mock.calls[0] as [unknown, { opacity: number; y: () => number }, Record<string, unknown>];
      expect(targets).toBe(target);
      expect(from.opacity).toBe(0);
      expect(from.y()).toBe(travel.rise * 20); // rem * the 20px root font size, re-read on every call
      expect(to).toEqual({ opacity: 1, y: 0, clearProps: 'transform,opacity' });
    });

    it('re-reads the root font size on every call, which is what makes a resize re-measure', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline } = build('full', (scene) => scene.fadeUp(target));
      const from = (timeline.fromTo.mock.calls[0] as [unknown, { y: () => number }])[1];

      document.documentElement.style.fontSize = '30px';
      expect(from.y()).toBe(travel.rise * 30);
    });

    it('travels half as far on the lite tier', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline } = build('lite', (scene) => scene.fadeUp(target));
      const from = (timeline.fromTo.mock.calls[0] as [unknown, { y: () => number }])[1];

      expect(from.y()).toBe(travel.rise * 20 * 0.5);
    });

    it('passes only what it was given, so the timeline defaults keep applying', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline } = build('full', (scene) => scene.fadeUp(target, { travel: travel.card, stagger: 0.3, at: 0.25 }));

      const [, from, to, at] = timeline.fromTo.mock.calls[0] as [unknown, { y: () => number }, Record<string, unknown>, unknown];
      expect(from.y()).toBe(travel.card * 20);
      expect(to).toEqual({ opacity: 1, y: 0, clearProps: 'transform,opacity', stagger: 0.3 });
      expect(to).not.toHaveProperty('duration');
      expect(to).not.toHaveProperty('ease');
      expect(at).toBe(0.25);
    });

    it('lets a call override the duration and pick a named ease', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline } = build('full', (scene) => scene.fadeUp(target, { duration: duration.card, ease: 'out' }));

      expect((timeline.fromTo.mock.calls[0] as unknown[])[2]).toEqual({
        opacity: 1,
        y: 0,
        clearProps: 'transform,opacity',
        duration: duration.card,
        ease: ease.out,
      });
    });

    it('never animates visibility (ADR 0003: hidden content cannot take keyboard focus)', () => {
      const target = root.querySelector('h2') as HTMLElement;
      const { timeline, gsap } = build('full', (scene) => scene.fadeUp(target));

      const text = JSON.stringify([timeline.fromTo.mock.calls, gsap.timeline.mock.calls], (_key, value: unknown) => (typeof value === 'function' ? 'fn' : value));
      expect(text).not.toMatch(/visibility|autoAlpha/);
    });
  });

  describe('teardown', () => {
    it('reverts the context, and leaves the root revealed rather than in the CSS pre-hidden state', () => {
      const { kit, context } = fakeKit();
      const teardown = createScene(kit, { root, tier: 'full', start }, () => undefined);
      expect(root.querySelectorAll('[data-revealed]')).toHaveLength(0);

      teardown();

      expect(context.revert).toHaveBeenCalledTimes(1);
      expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
      expect(root.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
    });

    it('reverts before it reveals, so GSAP’s inline styles are gone when the CSS state hands over', () => {
      const { kit, context } = fakeKit();
      let revealedWhenReverted = -1;
      context.revert.mockImplementation(() => {
        revealedWhenReverted = root.querySelectorAll('[data-revealed]').length;
      });

      createScene(kit, { root, tier: 'full', start }, () => undefined)();

      expect(revealedWhenReverted).toBe(0);
      expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
    });
  });

  describe('when the choreography throws', () => {
    it('reverts, opens the root so nothing stays hidden, and rethrows for the scheduler to log', () => {
      const { kit, context } = fakeKit();
      const failure = new Error('missing part');

      expect(() =>
        createScene(kit, { root, tier: 'full', start }, () => {
          throw failure;
        }),
      ).toThrow(failure);

      expect(context.revert).toHaveBeenCalledTimes(1);
      expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
      expect(root.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
    });
  });
});
