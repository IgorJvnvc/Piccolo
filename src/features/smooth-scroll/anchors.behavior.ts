import { defineEnhancement } from '@/shared/enhance';
import { anchorOffset, scrollTo } from './controller';

/**
 * In-page links (#menu, #top, ...): smooth scroll (Lenis when active, native otherwise), keep the URL hash,
 * and move keyboard focus to the target so screen-reader and keyboard users land where the page scrolled.
 */
export default defineEnhancement({
  id: 'anchors',
  selector: 'html',
  when: 'load',
  tiers: ['full', 'lite', 'static'],

  setup({ root, signal }) {
    root.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        const origin = event.target;
        if (!(origin instanceof Element)) return;
        const link = origin.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!link) return;

        const hash = link.getAttribute('href') ?? '';
        const id = decodeURIComponent(hash.slice(1));
        const toTop = id === '' || id === 'top';
        const target = toTop ? 0 : document.getElementById(id);
        if (target === null) return;

        event.preventDefault();
        scrollTo(target, toTop ? 0 : anchorOffset());
        history.replaceState(null, '', toTop ? location.pathname + location.search : hash);

        if (target instanceof HTMLElement) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      },
      { signal },
    );
  },
});
