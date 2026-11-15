import { ease } from '@/shared/motion';
import type { PresenceMotion } from '@/shared/motion/island';

/** Seconds and pixels from the dialog's own design, not from the reel. */
const SCRIM = 0.25;
const PANEL = { duration: 0.45, enterRise: 32, enterScale: 0.97, exitRise: 24, exitScale: 0.98 } as const;
const DISH = { enter: 0.55, exit: 0.4 } as const;

const panelOf = (overlay: HTMLElement): HTMLElement | null => overlay.querySelector<HTMLElement>('[data-part="panel"]');
const dishOf = (overlay: HTMLElement): HTMLElement | null => overlay.querySelector<HTMLElement>('img');

/** From the dish's place in the dialog to the card's picture: how far it moves and how much smaller it is there. */
interface Hop {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/**
 * The item quick view: the scrim fades in while the panel rises and settles, and the dish steps out of the card it was tapped
 * on (`origin` is that card's picture) into its place in the dialog. Closing plays it back and the dish goes home. Every tween
 * is a `to`, so closing or reopening in the middle of one carries on from wherever the dialog has got to.
 */
export function createQuickViewMotion(origin: () => Element | null): PresenceMotion<HTMLElement> {
  const hops = new WeakMap<HTMLElement, Hop>();

  return {
    from(overlay, { gsap, scale }) {
      // Measured before anything below moves the dialog.
      const dish = dishOf(overlay);
      const card = origin()?.getBoundingClientRect();
      const rest = dish?.getBoundingClientRect();
      if (dish && card && rest && card.width > 0 && rest.width > 0) {
        hops.set(overlay, {
          x: card.left + card.width / 2 - (rest.left + rest.width / 2),
          y: card.top + card.height / 2 - (rest.top + rest.height / 2),
          scale: card.width / rest.width,
        });
      } else {
        hops.delete(overlay);
      }

      gsap.set(overlay, { opacity: 0 });
      const panel = panelOf(overlay);
      if (panel) gsap.set(panel, { opacity: 0, y: PANEL.enterRise * scale.distance, scale: PANEL.enterScale });
      const hop = hops.get(overlay);
      if (dish && hop) gsap.set(dish, hop);
    },

    enter(overlay, { gsap, scale }) {
      const timeline = gsap.timeline({ defaults: { ease: ease.out } });
      timeline.to(overlay, { opacity: 1, duration: SCRIM, ease: ease.fade, clearProps: 'opacity' }, 0);
      const panel = panelOf(overlay);
      if (panel) timeline.to(panel, { opacity: 1, y: 0, scale: 1, duration: PANEL.duration, clearProps: 'opacity,transform' }, 0);
      const dish = dishOf(overlay);
      if (dish && hops.has(overlay)) {
        timeline.to(dish, { x: 0, y: 0, scale: 1, duration: DISH.enter, ease: ease.expo, clearProps: 'transform' }, 0);
      }
      return timeline.timeScale(scale.speed);
    },

    exit(overlay, { gsap, scale }) {
      const timeline = gsap.timeline({ defaults: { ease: ease.out } });
      timeline.to(overlay, { opacity: 0, duration: SCRIM, ease: ease.fade }, 0);
      const panel = panelOf(overlay);
      if (panel) {
        timeline.to(panel, { opacity: 0, y: PANEL.exitRise * scale.distance, scale: PANEL.exitScale, duration: PANEL.duration }, 0);
      }
      const dish = dishOf(overlay);
      const hop = hops.get(overlay);
      if (dish && hop) timeline.to(dish, { ...hop, duration: DISH.exit }, 0);
      return timeline.timeScale(scale.speed);
    },
  };
}