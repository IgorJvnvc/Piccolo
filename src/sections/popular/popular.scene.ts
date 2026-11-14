import { defineScene } from '@/shared/enhance';
import { parts, requirePart } from '@/shared/lib';
import { duration, enter, stagger, travel } from '@/shared/motion';
import { POPULAR } from './popular.hooks';

/**
 * Popular scene: heading fades up, then each card rises >= 100 px and fades in over ~0.6 s, staggered
 * ~0.3 s (measured from the reel). Plays once when the heading reaches 85% of the viewport.
 */
export default defineScene({
  id: 'popular',
  selector: POPULAR.root,
  start: enter.popular,
  // The heading is animated and ScrollTrigger measures transforms, so trigger on its static container (same top).
  trigger: (root) => requirePart(root, POPULAR.parts.heading).parentElement ?? root,

  build({ fadeUp }, root) {
    fadeUp(requirePart(root, POPULAR.parts.heading), { at: 0 });
    fadeUp(parts(root, POPULAR.parts.card), {
      travel: travel.card,
      duration: duration.card,
      stagger: stagger.cards,
      at: 0.25,
    });
  },
});
