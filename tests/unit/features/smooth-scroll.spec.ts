// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrollTo } from '@/features/smooth-scroll/controller';
import smoothScroll from '@/features/smooth-scroll/smooth-scroll.behavior';
import type { Capabilities } from '@/shared/device';
import type { EnhancementContext } from '@/shared/enhance';
import { type GsapKit, LAG_SMOOTHING } from '@/shared/motion';
import { createServices } from '@/shared/services';

interface FakeLenis {
  readonly options: unknown;
  readonly on: ReturnType<typeof vi.fn>;
  readonly raf: ReturnType<typeof vi.fn>;
  readonly stop: ReturnType<typeof vi.fn>;
  readonly start: ReturnType<typeof vi.fn>;
  readonly scrollTo: ReturnType<typeof vi.fn>;
  readonly destroy: ReturnType<typeof vi.fn>;
}

const lenisMock = vi.hoisted(() => ({ instances: [] as FakeLenis[] }));

vi.mock('lenis', () => {
  class Lenis implements FakeLenis {
    readonly on = vi.fn();
    readonly raf = vi.fn();
    readonly stop = vi.fn();
    readonly start = vi.fn();
    readonly scrollTo = vi.fn();
    readonly destroy = vi.fn();
    constructor(readonly options: unknown) {
      lenisMock.instances.push(this);
    }
  }
  return { default: Lenis };
});

const caps: Capabilities = { device: 'desktop', motion: 'full', pointer: 'fine', hover: true, reducedMotion: false, saveData: false, lowEnd: false, width: 1440 };

function fakeKit() {
  const ticker = { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() };
  const ScrollTrigger = { update: vi.fn() };
  return { kit: { gsap: { ticker }, ScrollTrigger } as unknown as GsapKit, ticker, ScrollTrigger };
}

function contextFor(loadKit: EnhancementContext['gsap'], controller = new AbortController()): EnhancementContext {
  const services = createServices();
  return { root: document.documentElement, caps, services, bus: services.bus, signal: controller.signal, gsap: loadKit };
}

/** Sets the behavior up against fakes and returns what it did. */
async function start(controller = new AbortController()) {
  const fake = fakeKit();
  const context = contextFor(() => Promise.resolve(fake.kit), controller);
  const teardown = await smoothScroll.setup(context);
  return { ...fake, context, teardown: teardown as () => void, lenis: lenisMock.instances[0] as FakeLenis, controller };
}

beforeEach(() => {
  lenisMock.instances.length = 0;
  document.documentElement.removeAttribute('data-scroll-lock');
});

afterEach(() => {
  document.documentElement.removeAttribute('data-scroll-lock');
});

describe('smooth-scroll', () => {
  it('drives Lenis from the GSAP ticker, in real time, and keeps ScrollTrigger in step', async () => {
    const { lenis, ticker, ScrollTrigger } = await start();

    expect(lenis.options).toMatchObject({ lerp: 0.09, smoothWheel: true });
    expect(lenis.on).toHaveBeenCalledWith('scroll', ScrollTrigger.update);

    const tick = ticker.add.mock.calls[0]?.[0] as (seconds: number) => void;
    tick(2);
    expect(lenis.raf).toHaveBeenCalledWith(2000); // GSAP counts seconds, Lenis milliseconds
    expect(ticker.lagSmoothing).toHaveBeenLastCalledWith(0);
  });

  it('gives GSAP its own lag smoothing back, and lets go of everything, on teardown', async () => {
    const { lenis, ticker, teardown } = await start();
    const tick = ticker.add.mock.calls[0]?.[0] as unknown;

    teardown();

    expect(ticker.remove).toHaveBeenCalledWith(tick);
    expect(ticker.lagSmoothing).toHaveBeenLastCalledWith(...LAG_SMOOTHING);
    expect(lenis.destroy).toHaveBeenCalledTimes(1);
  });

  it('starts out stopped when a dialog is already open, because its scroll:lock event has come and gone', async () => {
    document.documentElement.setAttribute('data-scroll-lock', '');

    const { lenis } = await start();

    expect(lenis.stop).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes with scroll:lock, until it is torn down', async () => {
    const { lenis, context, controller } = await start();

    context.bus.emit('scroll:lock', { locked: true });
    expect(lenis.stop).toHaveBeenCalledTimes(1);
    context.bus.emit('scroll:lock', { locked: false });
    expect(lenis.start).toHaveBeenCalledTimes(1);

    controller.abort();
    context.bus.emit('scroll:lock', { locked: true });
    expect(lenis.stop).toHaveBeenCalledTimes(1);
  });

  it('becomes the scroll driver for anchors, and hands scrolling back to the browser on teardown', async () => {
    const { lenis, teardown } = await start();
    const top = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    scrollTo(480, -60);
    expect(lenis.scrollTo).toHaveBeenCalledWith(480, { offset: -60, duration: 1.2 });
    expect(top).not.toHaveBeenCalled();

    teardown();
    scrollTo(480, -60);
    expect(lenis.scrollTo).toHaveBeenCalledTimes(1);
    expect(top).toHaveBeenCalledWith({ top: 420, behavior: 'smooth' });
  });

  it('builds nothing if it was torn down while Lenis and GSAP were still loading', async () => {
    const controller = new AbortController();
    const { kit, ticker } = fakeKit();
    const context = contextFor(
      () =>
        new Promise((resolve) => {
          controller.abort();
          resolve(kit);
        }),
      controller,
    );

    expect(await smoothScroll.setup(context)).toBeUndefined();
    expect(lenisMock.instances).toHaveLength(0);
    expect(ticker.add).not.toHaveBeenCalled();
  });
});
