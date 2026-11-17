// @vitest-environment happy-dom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MenuBrowser from '@/features/menu-browser/MenuBrowser.island';
import type { MenuBrowserCategory } from '@/features/menu-browser';
import { appBus } from '@/shared/events';

/**
 * Opening the quick view must not re-render the menu. The state used to live in MenuBrowser, so the click that opened the dialog
 * re-rendered every card of every category (71 of them), 47 ms of the main thread on a phone, right where the dialog's first
 * frame waits (ADR 0016). `MenuCard` is replaced by a counter: a card that renders again is a card that was diffed again.
 */
const cardRenders = vi.hoisted(() => ({ count: 0 }));
vi.mock('@/entities/menu/ui', () => ({
  MenuCard: () => {
    cardRenders.count += 1;
    return null;
  },
}));
// shared/ui also exports .astro components, which a plain Vite config cannot load.
vi.mock('@/shared/ui', () => ({ Icon: () => null, Picture: () => null }));

const card = (id: string) => ({
  id,
  name: `Item ${id}`,
  description: '',
  priceLabel: '100 RSD',
  sizes: [],
  allergens: [],
  tags: [],
  image: { src: '/dish.svg', width: 10, height: 10 },
});
const categories: MenuBrowserCategory[] = [
  { id: 'pizza', title: 'Pizza', blurb: '', cards: [card('a'), card('b')] },
  { id: 'drinks', title: 'Drinks', blurb: '', cards: [card('c')] },
];
const phone = { display: '+00 000 000 0000', href: 'tel:+000000000000' };
const DIALOG = '[role="dialog"][aria-labelledby="quick-view-title"]';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  act(() => render(null, container));
  container.remove();
  cardRenders.count = 0;
});

describe('the quick view and the menu behind it', () => {
  it('opens and closes without rendering a single card again', () => {
    act(() => render(h(MenuBrowser, { categories, phone }), container));
    expect(cardRenders.count).toBeGreaterThan(0); // the menu did render
    const rendered = cardRenders.count;
    expect(document.querySelector(DIALOG)).toBeNull();

    act(() => appBus.emit('menu:details', { itemId: 'b', opener: null }));
    expect(document.querySelector(DIALOG)?.textContent).toContain('Item b');
    expect(cardRenders.count, 'cards rendered again by opening the dialog').toBe(rendered);

    act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    expect(cardRenders.count, 'cards rendered again by closing the dialog').toBe(rendered);
  });
});
