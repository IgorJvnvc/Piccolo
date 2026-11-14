import { defineEnhancement } from '@/shared/enhance';
import { parts } from '@/shared/lib';
import { NAVBAR } from './navbar.hooks';

type NavState = 'top' | 'hidden' | 'shown';

/** Scroll distance in one direction before the bar reacts (avoids jitter on trackpads). */
const DIRECTION_THRESHOLD = 8;

/**
 * Navbar behavior:
 *  - `top`:    scrolls away with the page (reel behavior) via --nav-y
 *  - `hidden`: scrolling down
 *  - `shown`:  scrolling up (frosted bar)
 * plus a scroll-spy that marks the link of the section under the viewport middle.
 */
export default defineEnhancement({
  id: 'navbar',
  selector: NAVBAR.root,
  when: 'load',
  tiers: ['full', 'lite', 'static'],

  setup({ root, bus, signal }) {
    let state: NavState = 'top';
    let lastY = window.scrollY;
    let accumulated = 0;
    let menuOpen = false;
    let frame = 0;

    const apply = (next: NavState): void => {
      if (next === state && root.dataset['state']) return;
      state = next;
      root.dataset['state'] = next;
    };

    const update = (): void => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const height = root.offsetHeight;
      const delta = y - lastY;
      lastY = y;

      root.style.setProperty('--nav-y', String(Math.min(y, height)));

      if (menuOpen) {
        apply('shown');
        return;
      }

      accumulated = Math.sign(delta) === Math.sign(accumulated) ? accumulated + delta : delta;

      if (y <= 4) {
        apply('top');
      } else if (accumulated < -DIRECTION_THRESHOLD) {
        apply('shown');
      } else if (accumulated > DIRECTION_THRESHOLD && y > height) {
        apply('hidden');
      } else if (state === 'top' && y > height) {
        apply('hidden');
      }
    };

    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    root.dataset['state'] = 'top';
    update();
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { passive: true, signal });

    bus.on(
      'nav:menu',
      ({ open }) => {
        menuOpen = open;
        schedule();
      },
      { signal },
    );

    // Scroll-spy: the link whose section crosses the middle of the viewport is current.
    const links = parts<HTMLAnchorElement>(root, 'link');
    const targets = links.flatMap((link) => {
      const id = link.getAttribute('href')?.replace(/^#/, '');
      const section = id ? document.getElementById(id) : null;
      return section ? [{ link, section }] : [];
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const hit = targets.find((target) => target.section === entry.target);
          if (!hit) continue;
          if (entry.isIntersecting) {
            for (const { link } of targets) link.removeAttribute('aria-current');
            hit.link.setAttribute('aria-current', 'true');
            for (const link of links) link.removeAttribute('data-active');
          } else if (hit.link.getAttribute('aria-current') === 'true') {
            hit.link.removeAttribute('aria-current');
          }
        }
        // Nothing current (hero area): fall back to the first link, like the reel.
        if (!targets.some(({ link }) => link.hasAttribute('aria-current'))) {
          links[0]?.setAttribute('data-active', '');
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const { section } of targets) observer.observe(section);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      delete root.dataset['state'];
      root.style.removeProperty('--nav-y');
    };
  },
});
