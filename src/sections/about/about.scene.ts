import { defineScene } from '@/shared/enhance';
import { parts, requirePart } from '@/shared/lib';
import { duration, ease, enter, stagger, travel } from '@/shared/motion';
import { ABOUT } from './about.hooks';

/**
 * About scene: the food cluster flies in from the bottom-left, then label, heading, paragraph and CTA
 * fade up ~0.2 s apart (measured from the reel). Position-triggered (plays once at 72% of the viewport),
 * never scrubbed: the reel was scrolled by hand, so timing must not depend on scroll speed.
 */
export default defineScene({
  id: 'about',
  selector: ABOUT.root,
  start: enter.about,

  build({ timeline, tier, scale, px, fadeUp }, root) {
    timeline.fromTo(
      requirePart(root, ABOUT.parts.cluster),
      {
        opacity: 0,
        x: () => -px(travel.cluster) * scale.distance,
        y: () => px(travel.cluster) * scale.distance,
        scale: tier === 'full' ? 0.96 : 1,
      },
      { opacity: 1, x: 0, y: 0, scale: 1, duration: duration.cluster, ease: ease.out, clearProps: 'transform,opacity' },
      0,
    );

    fadeUp(parts(root, ABOUT.parts.item), { travel: travel.copy, stagger: stagger.copy, at: 0.3 });
  },
});
