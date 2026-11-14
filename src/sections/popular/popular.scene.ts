import { defineEnhancement } from '@/shared/enhance';
import { parts, requirePart } from '@/shared/lib';
import { ease, markRevealed, scaleFor, stagger } from '@/shared/motion';
import { POPULAR } from './popular.hooks';

/**
 * Popular scene: heading fades up, then each card rises >= 100 px and fades in over ~0.6 s, staggered
 * ~0.3 s (measured from the reel). Plays once when the grid reaches 85% of the viewport.
 */
export default defineEnhancement({
  id: 'popular',
  selector: POPULAR.root,
  when: 'visible',

  async setup({ root, caps, gsap: loadGsap }) {
    const { gsap } = await loadGsap();
    const scale = scaleFor(caps.motion);
    const heading = requirePart(root, POPULAR.parts.heading);
    const cards = parts(root, POPULAR.parts.card);

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
    });

    timeline.fromTo(
      heading,
      { opacity: 0, y: 28 * scale.distance },
      {
        opacity: 1,
        y: 0,
        duration: 0.7 * scale.time,
        ease: ease.soft,
        clearProps: 'transform,opacity,visibility',
        onStart: () => markRevealed([heading]),
      },
      0,
    );

    timeline.fromTo(
      cards,
      { opacity: 0, y: 110 * scale.distance },
      {
        opacity: 1,
        y: 0,
        duration: 0.6 * scale.time + 0.2,
        ease: ease.soft,
        stagger: stagger.cards,
        clearProps: 'transform,opacity,visibility',
        onStart: () => markRevealed(cards),
      },
      0.25 * scale.time,
    );

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([heading, ...cards], { clearProps: 'all' });
      markRevealed([heading, ...cards]);
    };
  },
});
