import { defineScene } from '@/shared/enhance';
import { requirePart } from '@/shared/lib';
import { ease, enter } from '@/shared/motion';
import { FOLLOW } from './follow.hooks';

/** Measured from the reel: width follows `expo.out` over ~0.96 s (RMSE 0.4% of the travel). */
const DURATION = 0.96;
const THIN_WIDTH_REM = 1.15;
/** Half the card height (17.5rem): a perfect stadium. The reel keeps it for ~0.3 s ... */
const START_RADIUS_REM = 8.75;
const END_RADIUS_REM = 2;
/** ... then the corners relax with their own expo.out (tau ~ 0.115 s => ~0.8 s). */
const RADIUS_DELAY = 0.3;
const RADIUS_DURATION = 0.8;
/** Below the desktop layout the layers rise 24 px (1.5rem at the 16 px phone/tablet root) instead of spreading. */
const MOBILE_RISE_REM = 1.5;
/** Art and text fade in over the opening moments: art almost at once, text a beat later (reel: ~35% at +0.13 s, full at +0.23 s). */
const FADE = {
  art: { at: 0, duration: 0.18 },
  content: { at: 0.1, duration: 0.3 },
  sparkle: { at: 0.15, duration: 0.25 },
} as const;

/**
 * Follow-card scene: the dark card grows from a 16 px stadium to full width while its art and text
 * spread outward from the center, un-clipped, and fade in.
 *
 * Position-triggered, time-based: it fires ONCE when the card top reaches 70% of the viewport and then
 * plays out in time, so it looks identical whether the visitor wheels, drags or jumps (the reel was
 * scrolled by hand; its width kept growing after the page had stopped moving).
 *
 * Every size is a function, so a resize or rotation before it plays re-measures instead of reusing stale numbers.
 */
export default defineScene({
  id: 'follow',
  selector: FOLLOW.root,
  start: enter.follow,
  trigger: (root) => requirePart(root, FOLLOW.parts.stage),

  build({ gsap, timeline, px }, root) {
    const stage = requirePart(root, FOLLOW.parts.stage);
    const bg = requirePart(root, FOLLOW.parts.bg);
    const art = requirePart(root, FOLLOW.parts.art);
    const content = requirePart(root, FOLLOW.parts.content);
    const sparkle = requirePart<SVGElement>(root, FOLLOW.parts.sparkle);

    const isDesktop = (): boolean => window.matchMedia('(min-width: 1024px)').matches;
    // Desktop: both layers start at the card's center and travel to their resting place. GSAP re-measures whenever it
    // re-initialises a tween (a ScrollTrigger refresh, an invalidation), and by then the layer already sits at its
    // from-state, so its own translate is taken back out: the result is its layout position whenever it is measured.
    const fromCenter = (layer: HTMLElement) => (): number => {
      if (!isDesktop()) return 0;
      const rect = layer.getBoundingClientRect();
      const laidOutCenter = rect.left + rect.width / 2 - Number(gsap.getProperty(layer, 'x'));
      return stage.getBoundingClientRect().left + stage.offsetWidth / 2 - laidOutCenter;
    };
    const mobileRise = (): number => (isDesktop() ? 0 : px(MOBILE_RISE_REM));

    // The idle (thin pill) shape hands over to GSAP's inline state the moment the scene starts.
    timeline.eventCallback('onStart', () => {
      stage.dataset['state'] = 'open';
    });

    // 1. The card: width first ...
    timeline.fromTo(
      bg,
      { width: () => px(THIN_WIDTH_REM) },
      { width: () => stage.offsetWidth, duration: DURATION, ease: ease.expo, clearProps: 'width' },
      0,
    );

    // ... and its corners on their own, later curve (stadium -> 2rem).
    timeline.fromTo(
      bg,
      { borderRadius: () => px(START_RADIUS_REM) },
      { borderRadius: () => px(END_RADIUS_REM), duration: RADIUS_DURATION, ease: ease.expo, clearProps: 'borderRadius' },
      RADIUS_DELAY,
    );

    // 2. Art and text slide out from the center (same curve) ...
    for (const layer of [art, content]) {
      timeline.fromTo(
        layer,
        { x: fromCenter(layer), y: mobileRise },
        { x: 0, y: 0, duration: DURATION, ease: ease.expo, clearProps: 'transform' },
        0,
      );
    }

    // 3. ... and fade in.
    for (const [layer, { at, duration }] of [
      [art, FADE.art],
      [content, FADE.content],
      [sparkle, FADE.sparkle],
    ] as const) {
      timeline.fromTo(layer, { opacity: 0 }, { opacity: 1, duration, ease: ease.fade, clearProps: 'opacity' }, at);
    }
  },
});
