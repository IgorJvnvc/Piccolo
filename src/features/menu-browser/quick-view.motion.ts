import { ease } from '@/shared/motion';
import type { PresenceMotion } from '@/shared/motion/island';

/** Seconds and pixels from the dialog's own design, not from the reel. */
const SCRIM = 0.25;
const PANEL = { duration: 0.45, enterRise: 32, enterScale: 0.97, exitRise: 24, exitScale: 0.98 } as const;

const panelOf = (overlay: HTMLElement): HTMLElement | null => overlay.querySelector<HTMLElement>('[data-part="panel"]');

/**
 * The item quick view: the scrim fades in while the panel rises and settles. Closing plays it back, a little less far, and
 * the dialog goes when the panel has finished. Every tween is a `to`, so closing or reopening in the middle of one carries
 * on from wherever the dialog has got to.
 */
export const quickViewMotion: PresenceMotion<HTMLElement> = {
  from(overlay, { gsap, scale }) {
    gsap.set(overlay, { opacity: 0 });
    const panel = panelOf(overlay);
    if (panel) gsap.set(panel, { opacity: 0, y: PANEL.enterRise * scale.distance, scale: PANEL.enterScale });
  },

  enter(overlay, { gsap, scale }) {
    const timeline = gsap.timeline({ defaults: { ease: ease.out } });
    timeline.to(overlay, { opacity: 1, duration: SCRIM, ease: ease.fade, clearProps: 'opacity' }, 0);
    const panel = panelOf(overlay);
    if (panel) timeline.to(panel, { opacity: 1, y: 0, scale: 1, duration: PANEL.duration, clearProps: 'opacity,transform' }, 0);
    return timeline.timeScale(scale.speed);
  },

  exit(overlay, { gsap, scale }) {
    const timeline = gsap.timeline({ defaults: { ease: ease.out } });
    timeline.to(overlay, { opacity: 0, duration: SCRIM, ease: ease.fade }, 0);
    const panel = panelOf(overlay);
    if (panel) {
      timeline.to(panel, { opacity: 0, y: PANEL.exitRise * scale.distance, scale: PANEL.exitScale, duration: PANEL.duration }, 0);
    }
    return timeline.timeScale(scale.speed);
  },
};
