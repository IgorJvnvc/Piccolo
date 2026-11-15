// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScheduler } from '@/runtime/scheduler';
import type { Capabilities } from '@/shared/device';
import { type EnhancementContext, defineScene } from '@/shared/enhance';
import { createAppBus } from '@/shared/events';
import { enter } from '@/shared/motion';
import { fakeKit, timelineVars } from '../motion/fake-kit';

const caps = (motion: Capabilities['motion'] = 'full'): Capabilities => ({
  device: 'desktop',
  motion,
  pointer: 'fine',
  hover: true,
  reducedMotion: false,
  saveData: false,
  lowEnd: false,
  width: 1440,
});

let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `
    <section data-enhance="demo">
      <h2 data-reveal="up">Title</h2>
      <p data-reveal="up">Copy</p>
      <div data-part="stage" data-state="idle"></div>
    </section>`;
  root = document.querySelector('[data-enhance="demo"]') as HTMLElement;
});

afterEach(() => {
  document.body.innerHTML = '';
});

function contextFor(loadKit: EnhancementContext['gsap'], overrides: Partial<EnhancementContext> = {}): EnhancementContext {
  return { root, caps: caps(), bus: createAppBus(), signal: new AbortController().signal, gsap: loadKit, ...overrides };
}

const definition = { id: 'demo', selector: '[data-enhance="demo"]', start: enter.about };

describe('defineScene', () => {
  it('builds the choreography once the kit has loaded, for the tier the device runs', async () => {
    const { kit, gsap, context } = fakeKit();
    const build = vi.fn();
    const scene = defineScene({ ...definition, build });

    const teardown = await scene.setup(contextFor(() => Promise.resolve(kit), { caps: caps('lite') }));

    expect(build).toHaveBeenCalledTimes(1);
    const [built, builtRoot] = build.mock.calls[0] as [{ tier: string; timeline: unknown }, HTMLElement];
    expect(built.tier).toBe('lite');
    expect(builtRoot).toBe(root);
    expect(timelineVars(gsap).scrollTrigger).toMatchObject({ start: enter.about, trigger: root });

    expect(typeof teardown).toBe('function');
    (teardown as () => void)();
    expect(context.revert).toHaveBeenCalledTimes(1);
  });

  it('builds nothing if it was torn down while GSAP was still loading', async () => {
    const { kit, gsap } = fakeKit();
    const build = vi.fn();
    const controller = new AbortController();
    const scene = defineScene({ ...definition, build });

    const pending = scene.setup(
      contextFor(
        () =>
          new Promise((resolve) => {
            controller.abort();
            resolve(kit);
          }),
        { signal: controller.signal },
      ),
    );

    expect(await pending).toBeUndefined();
    expect(build).not.toHaveBeenCalled();
    expect(gsap.timeline).not.toHaveBeenCalled();
  });

  it('rejects when GSAP fails to load, so the scheduler can recover', async () => {
    const scene = defineScene({ ...definition, build: () => undefined });

    await expect(scene.setup(contextFor(() => Promise.reject(new Error('chunk failed'))))).rejects.toThrow('chunk failed');
  });

  it('gives up on a GSAP download that never finishes, so the scheduler can recover', async () => {
    vi.useFakeTimers();
    try {
      const scene = defineScene({ ...definition, build: () => undefined });
      const settled = expect(scene.setup(contextFor(() => new Promise(() => undefined)))).rejects.toThrow(/did not load/);

      await vi.advanceTimersByTimeAsync(60_000);
      await settled;
    } finally {
      vi.useRealTimers();
    }
  });

  it('does nothing once the bootstrap failsafe has already shown the page', async () => {
    const loadKit = vi.fn(() => Promise.reject(new Error('must not be asked for')));
    const scene = defineScene({ ...definition, build: () => undefined });
    document.documentElement.classList.add('no-enhance');
    try {
      expect(await scene.setup(contextFor(loadKit))).toBeUndefined();
      expect(loadKit).not.toHaveBeenCalled();
    } finally {
      document.documentElement.classList.remove('no-enhance');
    }
  });

  it('recover reveals everything the scene hid and opens idle stages', () => {
    const scene = defineScene({ ...definition, build: () => undefined });

    scene.recover?.(root);

    expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
  });
});

describe('a scene whose GSAP download fails (through the real scheduler)', () => {
  it('leaves its content visible instead of hidden forever', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const scene = defineScene({ ...definition, build: () => undefined });
    const scheduler = createScheduler([scene], {
      doc: document,
      bus: createAppBus(),
      gsap: () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
      timing: { whenIdle: () => () => undefined, whenVisible: (_element, run) => (run(), () => undefined) },
    });

    expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(2); // hidden by the CSS pre-state

    scheduler.reconcile(caps());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(error).toHaveBeenCalledWith('[enhance] "demo" failed', expect.any(Error));
    expect(root.querySelectorAll('[data-reveal]:not([data-revealed])')).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('[data-part="stage"]')?.dataset['state']).toBe('open');
  });
});
