import { defineEnhancement } from '@/shared/enhance';
import { attachSpatialNavigation } from '@/shared/focus';

/**
 * TV: D-pad (arrow keys) moves focus to the nearest focusable element, Enter activates, and the remote's
 * Back key closes any open modal. Only runs when the device is classified as a TV.
 */
export default defineEnhancement({
  id: 'tv-navigation',
  selector: 'html',
  when: 'load',
  tiers: ['full', 'lite', 'static'],
  enabled: (caps) => caps.device === 'tv',

  setup({ root, signal }) {
    attachSpatialNavigation(
      document,
      {
        onFocus: (element) => element.scrollIntoView({ block: 'center', behavior: 'smooth' }),
        onBack: () => {
          if (!root.hasAttribute('data-scroll-lock')) return false;
          // A modal is open: translate the remote's Back into Escape, which every dialog already handles.
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return true;
        },
      },
      signal,
    );
  },
});
