// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScene, type Scene, travel } from '@/shared/motion';
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

  it('keeps clearProps OUT of the defaults: a fromTo inherits them into its internal start-state tween, which would wipe the from-state at once', () => {
    const { kit, gsap } = fakeKit();
    createScene(kit, { root, tier: 'full', start }, () => undefined);

    expect(timelineVars(gsap).defaults).not.toHaveProperty('clearProps');
  });

  it('runs the lite tier at timeScale 4/3 (so durations, delays and staggers scale together) and the full tier at 1', () => {
    for (const [tier, speed] of [['full', 1], ['lite', 4 / 3]] as const) {
      const { kit, timeline } = fakeKit();
      createScene(kit, { root, tier, start }, () => undefined);

      expect(timeline.timeScale).toHaveBeenCalledWith(speed);
    }
  });

  describe('scene.fadeUp', () => {
    const build = (tier: 'full' | 'lite', use: (scene: Scene) => void) => {
      const kit = fakeKit();
      createScene(kit.kit, { root, tier, start }, use);
      return kit;
    };

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
