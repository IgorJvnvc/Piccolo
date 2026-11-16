import { defineEnhancement } from '@/shared/enhance';
import { TO_TOP } from './to-top.hooks';

/** How far the page has to be scrolled before the button shows: as soon as the visitor has left the top. */
const SHOW_AFTER = 80;

/**
 * Back to top: shows the button once the page is scrolled (a nav link or the wheel alike) and hides it again at the top.
 * Hidden, it is out of the tab order and the accessibility tree; the click itself is an ordinary `#top` link (anchors.behavior.ts).
 */
export default defineEnhancement({
  id: 'to-top',
  selector: TO_TOP.root,
  when: 'load',
  tiers: ['full', 'lite', 'static'],

  setup({ root, signal }) {
    let shown = false;
    const update = (): void => {
      const next = window.scrollY > SHOW_AFTER;
      if (next === shown) return;
      shown = next;
      root.toggleAttribute('data-visible', shown);
      root.tabIndex = shown ? 0 : -1;
      root.setAttribute('aria-hidden', String(!shown));
    };
    window.addEventListener('scroll', update, { passive: true, signal });
    update();
  },
});