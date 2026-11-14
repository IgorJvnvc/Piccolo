import { defineEnhancement } from '@/shared/enhance';
import { appBus } from '@/shared/events';

/**
 * Turns clicks on any `[data-details]` button (static popular cards AND the hydrated menu browser) into a
 * `menu:details` bus event. Cards never know who listens; the menu browser opens the quick view.
 * Delegated on <html>, so it keeps working for cards that are re-rendered by the island.
 */
export default defineEnhancement({
  id: 'menu-details',
  selector: 'html',
  when: 'load',
  tiers: ['full', 'lite', 'static'],

  setup({ root, signal }) {
    root.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest<HTMLElement>('[data-details]');
        const itemId = button?.dataset['details'];
        if (!itemId) return;
        event.preventDefault();
        appBus.emit('menu:details', { itemId, opener: button });
      },
      { signal },
    );
  },
});
