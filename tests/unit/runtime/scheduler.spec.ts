// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScheduler } from '@/runtime/scheduler';
import type { Capabilities } from '@/shared/device';
import { type Enhancement, type EnhancementContext, defineEnhancement, qualifies } from '@/shared/enhance';
import { createAppBus } from '@/shared/events';

const caps = (overrides: Partial<Capabilities> = {}): Capabilities => ({
  device: 'desktop',
  motion: 'full',
  pointer: 'fine',
  hover: true,
  reducedMotion: false,
  saveData: false,
  lowEnd: false,
  width: 1440,
  ...overrides,
});

const make = (overrides: Partial<Enhancement> = {}): Enhancement =>
  defineEnhancement({
    id: 'test',
    selector: '[data-enhance="a"]',
    when: 'load',
    setup: () => undefined,
    ...overrides,
  });

/** Lets queued microtasks and timers run (the scheduler starts setup in a promise chain). */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function harness(enhancements: readonly Enhancement[]) {
  const idle: Array<() => void> = [];
  const visible: Array<{ readonly element: Element; readonly run: () => void }> = [];
  const cancelIdle = vi.fn();
  const cancelVisible = vi.fn();
  const bus = createAppBus();

  const scheduler = createScheduler(enhancements, {
    doc: document,
    bus,
    gsap: () => Promise.reject(new Error('GSAP is not used in these tests')),
    timing: {
      whenIdle: (run) => {
        idle.push(run);
        return cancelIdle;
      },
      whenVisible: (element, run) => {
        visible.push({ element, run });
        return cancelVisible;
      },
    },
  });

  return { scheduler, bus, idle, visible, cancelIdle, cancelVisible };
}

describe('qualifies', () => {
  it('allows the full and lite tiers by default, but not static (reduced motion)', () => {
    const enhancement = make();
    expect(qualifies(enhancement, caps({ motion: 'full' }))).toBe(true);
    expect(qualifies(enhancement, caps({ motion: 'lite' }))).toBe(true);
    expect(qualifies(enhancement, caps({ motion: 'static' }))).toBe(false);
  });

  it('honours explicit tiers', () => {
    const fullOnly = make({ tiers: ['full'] });
    expect(qualifies(fullOnly, caps({ motion: 'full' }))).toBe(true);
    expect(qualifies(fullOnly, caps({ motion: 'lite' }))).toBe(false);

    const everywhere = make({ tiers: ['full', 'lite', 'static'] });
    expect(qualifies(everywhere, caps({ motion: 'static' }))).toBe(true);
  });

  it('applies the extra gate, but only after the tier check', () => {
    const enabled = vi.fn((c: Capabilities) => c.device === 'desktop');
    const gated = make({ tiers: ['full'], enabled });

    expect(qualifies(gated, caps({ device: 'desktop' }))).toBe(true);
    expect(qualifies(gated, caps({ device: 'phone' }))).toBe(false);

    enabled.mockClear();
    expect(qualifies(gated, caps({ motion: 'lite' }))).toBe(false);
    expect(enabled).not.toHaveBeenCalled();
  });
});

describe('createScheduler', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<section data-enhance="a"></section><section data-enhance="a"></section><div data-enhance="b"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('starts a "load" enhancement once per matching root with a complete context', async () => {
    const setup = vi.fn();
    const { scheduler, bus } = harness([make({ setup })]);

    scheduler.reconcile(caps());
    await flush();

    expect(setup).toHaveBeenCalledTimes(2);
    const context = setup.mock.calls[0]?.[0] as EnhancementContext;
    expect(context.root.dataset['enhance']).toBe('a');
    expect(context.caps).toEqual(caps());
    expect(context.bus).toBe(bus);
    expect(context.signal.aborted).toBe(false);
  });

  it('does not start anything when no root matches', async () => {
    const setup = vi.fn();
    const { scheduler } = harness([make({ selector: '[data-enhance="missing"]', setup })]);

    scheduler.reconcile(caps());
    await flush();

    expect(setup).not.toHaveBeenCalled();
  });

  it('waits for each root to become visible before a "visible" enhancement runs', async () => {
    const setup = vi.fn();
    const { scheduler, visible } = harness([make({ when: 'visible', setup })]);

    scheduler.reconcile(caps());
    await flush();
    expect(setup).not.toHaveBeenCalled();
    expect(visible).toHaveLength(2);

    visible[0]?.run();
    await flush();
    expect(setup).toHaveBeenCalledTimes(1);
    expect((setup.mock.calls[0]?.[0] as EnhancementContext).root).toBe(visible[0]?.element);
  });

  it('waits for idle time before an "idle" enhancement runs', async () => {
    const setup = vi.fn();
    const { scheduler, idle } = harness([make({ when: 'idle', selector: '[data-enhance="b"]', setup })]);

    scheduler.reconcile(caps());
    await flush();
    expect(setup).not.toHaveBeenCalled();

    idle[0]?.();
    await flush();
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: reconciling again does not start a second copy', async () => {
    const setup = vi.fn();
    const { scheduler } = harness([make({ setup })]);

    scheduler.reconcile(caps());
    scheduler.reconcile(caps());
    scheduler.reconcile(caps({ width: 1500 }));
    await flush();

    expect(setup).toHaveBeenCalledTimes(2);
  });

  it('stops an enhancement that no longer qualifies (teardown + abort) and restarts it when it does again', async () => {
    const teardown = vi.fn();
    const contexts: EnhancementContext[] = [];
    const { scheduler } = harness([
      make({
        selector: '[data-enhance="b"]',
        setup: (context) => {
          contexts.push(context);
          return teardown;
        },
      }),
    ]);

    scheduler.reconcile(caps());
    await flush();
    expect(contexts).toHaveLength(1);

    scheduler.reconcile(caps({ motion: 'static' }));
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.signal.aborted).toBe(true);

    scheduler.reconcile(caps({ motion: 'full' }));
    await flush();
    expect(contexts).toHaveLength(2);
    expect(contexts[1]?.signal.aborted).toBe(false);
  });

  it('re-evaluates the enhancement-specific gate on every reconcile', async () => {
    const setup = vi.fn();
    const { scheduler } = harness([
      make({ selector: '[data-enhance="b"]', enabled: (c) => c.device === 'desktop', setup }),
    ]);

    scheduler.reconcile(caps({ device: 'phone' }));
    await flush();
    expect(setup).not.toHaveBeenCalled();

    scheduler.reconcile(caps({ device: 'desktop' }));
    await flush();
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it('picks up roots that appear later and stops roots that disappear', async () => {
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const { scheduler } = harness([make({ setup })]);

    scheduler.reconcile(caps());
    await flush();
    expect(setup).toHaveBeenCalledTimes(2);

    document.body.insertAdjacentHTML('beforeend', '<section data-enhance="a"></section>');
    scheduler.reconcile(caps());
    await flush();
    expect(setup).toHaveBeenCalledTimes(3);

    document.querySelector('[data-enhance="a"]')?.remove();
    scheduler.reconcile(caps());
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending wait when stopped, and never runs setup afterwards', async () => {
    const setup = vi.fn();
    const { scheduler, visible, cancelVisible } = harness([make({ when: 'visible', setup })]);

    scheduler.reconcile(caps());
    scheduler.reconcile(caps({ motion: 'static' }));
    expect(cancelVisible).toHaveBeenCalledTimes(2);

    // Even if the observer still fires afterwards, a stopped enhancement must not run.
    for (const { run } of visible) run();
    await flush();
    expect(setup).not.toHaveBeenCalled();
  });

  it('isolates a failing setup (sync throw or rejection) from the other enhancements', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const healthy = vi.fn();
    const { scheduler } = harness([
      make({
        id: 'sync-boom',
        selector: '[data-enhance="b"]',
        setup: () => {
          throw new Error('sync');
        },
      }),
      make({ id: 'async-boom', selector: '[data-enhance="b"]', setup: () => Promise.reject(new Error('async')) }),
      make({ id: 'healthy', selector: '[data-enhance="b"]', setup: healthy }),
    ]);

    scheduler.reconcile(caps());
    await flush();

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('[enhance] "sync-boom" failed', expect.any(Error));
    expect(error).toHaveBeenCalledWith('[enhance] "async-boom" failed', expect.any(Error));
  });

  it('lets a failed enhancement recover its root (sync throw or rejection), but not one that succeeded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recovered: string[] = [];
    const recoverAs = (id: string) => (root: HTMLElement) => recovered.push(`${id}:${root.dataset['enhance']}`);
    const { scheduler } = harness([
      make({
        id: 'sync-boom',
        selector: '[data-enhance="b"]',
        setup: () => {
          throw new Error('sync');
        },
        recover: recoverAs('sync-boom'),
      }),
      make({ id: 'async-boom', selector: '[data-enhance="b"]', setup: () => Promise.reject(new Error('async')), recover: recoverAs('async-boom') }),
      make({ id: 'fine', selector: '[data-enhance="b"]', setup: () => undefined, recover: recoverAs('fine') }),
    ]);

    scheduler.reconcile(caps());
    await flush();

    expect(recovered.sort()).toEqual(['async-boom:b', 'sync-boom:b']);
  });

  it('contains a recover that itself throws: it is logged, and other enhancements still recover', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const goodRecover = vi.fn();
    const { scheduler } = harness([
      make({
        id: 'bad',
        selector: '[data-enhance="b"]',
        setup: () => Promise.reject(new Error('setup')),
        recover: () => {
          throw new Error('recover');
        },
      }),
      make({ id: 'good', selector: '[data-enhance="b"]', setup: () => Promise.reject(new Error('setup')), recover: goodRecover }),
    ]);

    scheduler.reconcile(caps());
    await flush();

    expect(goodRecover).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('[enhance] "bad" recover failed', expect.any(Error));
  });

  it('keeps stopping everything when one teardown throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const goodTeardown = vi.fn();
    const { scheduler } = harness([
      make({
        id: 'bad',
        selector: '[data-enhance="b"]',
        setup: () => () => {
          throw new Error('teardown');
        },
      }),
      make({ id: 'good', selector: '[data-enhance="b"]', setup: () => goodTeardown }),
    ]);

    scheduler.reconcile(caps());
    await flush();
    scheduler.destroy();

    expect(goodTeardown).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('[enhance] "bad" teardown failed', expect.any(Error));
  });

  it('runs a teardown that arrives after its enhancement was already stopped', async () => {
    let finish: (teardown: () => void) => void = () => undefined;
    const teardown = vi.fn();
    const { scheduler } = harness([
      make({
        selector: '[data-enhance="b"]',
        setup: () =>
          new Promise<() => void>((resolve) => {
            finish = resolve;
          }),
      }),
    ]);

    scheduler.reconcile(caps());
    await flush();
    scheduler.reconcile(caps({ motion: 'static' })); // stopped while setup is still pending
    expect(teardown).not.toHaveBeenCalled();

    finish(teardown);
    await flush();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('destroy() tears down every running root and aborts its signal', async () => {
    const teardown = vi.fn();
    const contexts: EnhancementContext[] = [];
    const { scheduler } = harness([
      make({
        setup: (context) => {
          contexts.push(context);
          return teardown;
        },
      }),
    ]);

    scheduler.reconcile(caps());
    await flush();
    scheduler.destroy();

    expect(teardown).toHaveBeenCalledTimes(2);
    expect(contexts.every((context) => context.signal.aborted)).toBe(true);
  });
});
