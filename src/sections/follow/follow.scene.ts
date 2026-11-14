import { defineEnhancement } from '@/shared/enhance';
import { requirePart } from '@/shared/lib';
import { scaleFor } from '@/shared/motion';
import { FOLLOW } from './follow.hooks';

/** Measured from the reel: width follows `expo.out` over ~0.96 s (RMSE 0.4% of the travel). */
const DURATION = 0.96;
const EASE = 'expo.out';
const THIN_WIDTH_REM = 1.15;
/** Half the card height (17.5rem): a perfect stadium. The reel keeps it for ~0.3 s ... */
const START_RADIUS_REM = 8.75;
const END_RADIUS_REM = 2;
/** ... then the corners relax with their own expo.out (tau ~ 0.115 s => ~0.8 s). */
const RADIUS_DELAY = 0.3;
const RADIUS_DURATION = 0.8;

/**
 * Follow-card scene: the dark card grows from a 16 px stadium to full width while its art and text
 * spread outward from the center, un-clipped, and fade in.
 *
 * Position-triggered, time-based: it fires ONCE when the card top reaches 70% of the viewport and then
 * plays out in time, so it looks identical whether the visitor wheels, drags or jumps (the reel was
 * scrolled by hand; its width kept growing after the page had stopped moving).
 */
export default defineEnhancement({
  id: 'follow',
  selector: FOLLOW.root,
  when: 'visible',

  async setup({ root, caps, gsap: loadGsap }) {
    const { gsap } = await loadGsap();
    const scale = scaleFor(caps.motion);

    const stage = requirePart(root, FOLLOW.parts.stage);
    const bg = requirePart(root, FOLLOW.parts.bg);
    const art = requirePart(root, FOLLOW.parts.art);
    const content = requirePart(root, FOLLOW.parts.content);
    const sparkle = requirePart<SVGElement>(root, FOLLOW.parts.sparkle);

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const desktop = window.matchMedia('(min-width: 1024px)').matches;

    // Desktop: both layers start at the card's center and travel to their resting place.
    const center = stage.getBoundingClientRect().left + stage.offsetWidth / 2;
    const offsetToCenter = (element: HTMLElement): number => {
      const rect = element.getBoundingClientRect();
      return center - (rect.left + rect.width / 2);
    };
    const artFrom = desktop ? offsetToCenter(art) : 0;
    const contentFrom = desktop ? offsetToCenter(content) : 0;

    const layers = [art, content, sparkle];
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: stage, start: 'top 70%', once: true },
      onStart: () => {
        stage.dataset['state'] = 'open';
      },
    });

    // 1. The card: width first ...
    timeline.fromTo(
      bg,
      { width: THIN_WIDTH_REM * rem },
      {
        width: stage.offsetWidth,
        duration: DURATION * scale.time,
        ease: EASE,
        clearProps: 'width',
      },
      0,
    );

    // ... and its corners on their own, later curve (stadium -> 2rem).
    timeline.fromTo(
      bg,
      { borderRadius: START_RADIUS_REM * rem },
      {
        borderRadius: END_RADIUS_REM * rem,
        duration: RADIUS_DURATION * scale.time,
        ease: EASE,
        clearProps: 'borderRadius',
      },
      RADIUS_DELAY * scale.time,
    );

    // 2. Art and text slide out from the center (same curve) ...
    timeline.fromTo(
      art,
      { x: artFrom, y: desktop ? 0 : 24 },
      { x: 0, y: 0, duration: DURATION * scale.time, ease: EASE, clearProps: 'transform' },
      0,
    );
    timeline.fromTo(
      content,
      { x: contentFrom, y: desktop ? 0 : 24 },
      { x: 0, y: 0, duration: DURATION * scale.time, ease: EASE, clearProps: 'transform' },
      0,
    );

    // 3. ... and fade in: art almost at once, text a beat later (reel: ~35% at +0.13 s, full at +0.23 s).
    timeline.fromTo(
      art,
      { opacity: 0 },
      { opacity: 1, duration: 0.18, ease: 'power1.out', clearProps: 'opacity,visibility' },
      0,
    );
    timeline.fromTo(
      content,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power1.out', clearProps: 'opacity,visibility' },
      0.1,
    );
    timeline.fromTo(
      sparkle,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power1.out', clearProps: 'opacity,visibility' },
      0.15,
    );

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([bg, ...layers], { clearProps: 'all' });
      stage.dataset['state'] = 'open';
    };
  },
});
