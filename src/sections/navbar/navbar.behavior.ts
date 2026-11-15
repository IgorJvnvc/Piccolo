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

    const links = parts<HTMLAnchorElement>(root, 'link');
    const targets = links.flatMap((link) => {
      const id = link.getAttribute('href')?.replace(/^#/, '');
      const section = id ? document.getElementById(id) : null;
      return section ? [{ link, section }] : [];
    });

    // Scroll-spy: the link whose section has its top nearest above the middle of the viewport is current. At the very end of the
    // page it is the last one, because a short last section (Contact) never gets its top that high.
    let spied: HTMLAnchorElement | null | undefined;
    const spy = (y: number): void => {
      let current: HTMLAnchorElement | null = null;
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 2) {
        current = targets[targets.length - 1]?.link ?? null;
      } else {
        let nearest = Number.NEGATIVE_INFINITY;
        for (const { link, section } of targets) {
          const top = section.getBoundingClientRect().top;
          if (top <= window.innerHeight / 2 && top > nearest) {
            nearest = top;
            current = link;
          }
        }
      }
      if (current === spied) return;
      spied = current;
      for (const link of links) {
        if (link === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
        // Nothing current (the hero): the first link carries the mark, like the reel.
        link.toggleAttribute('data-active', current === null && link === links[0]);
      }
    };

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
      spy(y);

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

    return () => {
      cancelAnimationFrame(frame);
      delete root.dataset['state'];
      root.style.removeProperty('--nav-y');
    };
  },
});
