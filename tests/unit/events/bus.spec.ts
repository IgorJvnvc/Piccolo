import { describe, expect, it, vi } from 'vitest';
import { createAppBus } from '@/shared/events';
import { createBus } from '@/shared/events/bus';

interface Events {
  ping: { readonly n: number };
  note: { readonly text: string };
}

/** Lets queued microtasks and timers run. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('createBus', () => {
  it('delivers a payload to every subscriber, in subscription order', () => {
    const bus = createBus<Events>();
    const order: string[] = [];
    bus.on('ping', ({ n }) => order.push(`a${n}`));
    bus.on('ping', ({ n }) => order.push(`b${n}`));

    bus.emit('ping', { n: 1 });

    expect(order).toEqual(['a1', 'b1']);
  });

  it('keeps event types separate', () => {
    const bus = createBus<Events>();
    const ping = vi.fn();
    bus.on('ping', ping);

    bus.emit('note', { text: 'hello' });

    expect(ping).not.toHaveBeenCalled();
  });

  it('stops delivering once the returned unsubscribe function is called', () => {
    const bus = createBus<Events>();
    const handler = vi.fn();
    const off = bus.on('ping', handler);

    bus.emit('ping', { n: 1 });
    off();
    bus.emit('ping', { n: 2 });

    expect(handler).toHaveBeenCalledExactlyOnceWith({ n: 1 });
  });

  it('lets a handler unsubscribe itself mid-emit without skipping the others', () => {
    const bus = createBus<Events>();
    const second = vi.fn();
    const off = bus.on('ping', () => off());
    bus.on('ping', second);

    bus.emit('ping', { n: 1 });
    bus.emit('ping', { n: 2 });

    expect(second).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes when its AbortSignal fires', () => {
    const bus = createBus<Events>();
    const controller = new AbortController();
    const handler = vi.fn();
    bus.on('ping', handler, { signal: controller.signal });

    bus.emit('ping', { n: 1 });
    controller.abort();
    bus.emit('ping', { n: 2 });

    expect(handler).toHaveBeenCalledExactlyOnceWith({ n: 1 });
  });

  it('never subscribes with an already aborted signal', () => {
    const bus = createBus<Events>();
    const handler = vi.fn();
    bus.on('ping', handler, { signal: AbortSignal.abort() });

    bus.emit('ping', { n: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps delivering to other subscribers when one throws, and reports the error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const bus = createBus<Events>();
    const healthy = vi.fn();
    bus.on('ping', () => {
      throw new Error('boom');
    });
    bus.on('ping', healthy);

    bus.emit('ping', { n: 1 });

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('drops an event nobody listened to when it is not sticky', async () => {
    const bus = createBus<Events>({ sticky: ['note'] });
    bus.emit('ping', { n: 1 });

    const late = vi.fn();
    bus.on('ping', late, { replay: true });
    await flush();

    expect(late).not.toHaveBeenCalled();
  });
});

describe('createBus: sticky events', () => {
  const create = () => createBus<Events>({ sticky: ['note'] });

  it('replays an event that fired before anyone listened, asynchronously and only once', async () => {
    const bus = create();
    bus.emit('note', { text: 'early' });

    const first = vi.fn();
    bus.on('note', first, { replay: true });
    // Async on purpose: the subscriber finishes its own setup before the replay arrives.
    expect(first).not.toHaveBeenCalled();
    await flush();
    expect(first).toHaveBeenCalledExactlyOnceWith({ text: 'early' });

    const second = vi.fn();
    bus.on('note', second, { replay: true });
    await flush();
    expect(second).not.toHaveBeenCalled();
  });

  it('keeps only the latest payload', async () => {
    const bus = create();
    bus.emit('note', { text: 'one' });
    bus.emit('note', { text: 'two' });

    const handler = vi.fn();
    bus.on('note', handler, { replay: true });
    await flush();

    expect(handler).toHaveBeenCalledExactlyOnceWith({ text: 'two' });
  });

  it('does not deliver to a subscriber that did not ask for a replay, and keeps the event for one that does', async () => {
    const bus = create();
    bus.emit('note', { text: 'early' });

    const plain = vi.fn();
    bus.on('note', plain);
    await flush();
    expect(plain).not.toHaveBeenCalled();

    const replaying = vi.fn();
    bus.on('note', replaying, { replay: true });
    await flush();
    expect(replaying).toHaveBeenCalledExactlyOnceWith({ text: 'early' });
  });

  it('does not retain an event that reached a live subscriber', async () => {
    const bus = create();
    const live = vi.fn();
    bus.on('note', live);
    bus.emit('note', { text: 'seen' });

    const late = vi.fn();
    bus.on('note', late, { replay: true });
    await flush();

    expect(live).toHaveBeenCalledTimes(1);
    expect(late).not.toHaveBeenCalled();
  });
});

describe('createAppBus', () => {
  it('makes only menu:details sticky, so a click before the menu island hydrates is not lost', async () => {
    const bus = createAppBus();
    bus.emit('menu:details', { itemId: 'pizza-margherita', opener: null });
    bus.emit('nav:menu', { open: true });

    const details = vi.fn();
    const nav = vi.fn();
    bus.on('menu:details', details, { replay: true });
    bus.on('nav:menu', nav, { replay: true });
    await flush();

    expect(details).toHaveBeenCalledExactlyOnceWith({ itemId: 'pizza-margherita', opener: null });
    expect(nav).not.toHaveBeenCalled();
  });
});
