// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import tvNavigation from '@/features/tv-navigation/tv-navigation.behavior';
import type { EnhancementContext } from '@/shared/enhance';

const attach = vi.hoisted(() => vi.fn());
vi.mock('@/shared/focus', () => ({ attachSpatialNavigation: attach }));

interface Options {
  onFocus: (element: HTMLElement) => void;
  onBack: () => boolean;
}

function start(): Options {
  tvNavigation.setup({ root: document.documentElement, signal: new AbortController().signal } as unknown as EnhancementContext);
  return attach.mock.calls[0]?.[1] as Options;
}

const root = document.documentElement;

beforeEach(() => {
  root.removeAttribute('data-motion');
  root.removeAttribute('data-scroll-lock');
});

afterEach(() => {
  root.removeAttribute('data-motion');
  root.removeAttribute('data-scroll-lock');
});

describe('tv-navigation', () => {
  it('runs on every motion tier, but only on a TV', () => {
    expect(tvNavigation.tiers).toEqual(['full', 'lite', 'static']);
    expect(tvNavigation.enabled?.({ device: 'tv' } as never)).toBe(true);
    expect(tvNavigation.enabled?.({ device: 'desktop' } as never)).toBe(false);
  });

  it('glides focus to the middle of the screen', () => {
    root.dataset['motion'] = 'lite';
    const element = { scrollIntoView: vi.fn() };

    start().onFocus(element as unknown as HTMLElement);

    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('jumps instead of gliding for a visitor who asked for reduced motion, even if they ask while the page is open', () => {
    root.dataset['motion'] = 'full';
    const element = { scrollIntoView: vi.fn() };
    const { onFocus } = start();

    onFocus(element as unknown as HTMLElement);
    expect(element.scrollIntoView).toHaveBeenLastCalledWith({ block: 'center', behavior: 'smooth' });

    root.dataset['motion'] = 'static';
    onFocus(element as unknown as HTMLElement);
    expect(element.scrollIntoView).toHaveBeenLastCalledWith({ block: 'center', behavior: 'auto' });
  });

  it('turns the remote Back key into Escape while a dialog is open, and leaves it alone otherwise', () => {
    const dispatched: Event[] = [];
    vi.spyOn(document, 'dispatchEvent').mockImplementation((event) => (dispatched.push(event), true));
    const { onBack } = start();

    expect(onBack()).toBe(false);
    expect(dispatched).toHaveLength(0);

    root.setAttribute('data-scroll-lock', '');
    expect(onBack()).toBe(true);
    expect(dispatched).toHaveLength(1);
    expect((dispatched[0] as KeyboardEvent).key).toBe('Escape');
  });
});
