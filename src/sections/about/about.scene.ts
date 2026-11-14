import { defineEnhancement } from '@/shared/enhance';
import { requirePart, parts } from '@/shared/lib';
import { ease, markRevealed, scaleFor, stagger } from '@/shared/motion';
import { ABOUT } from './about.hooks';

/**
 * About scene: the food cluster flies in from the bottom-left, then label, heading, paragraph and CTA
 * fade up ~0.2 s apart (measured from the reel). Position-triggered (plays once at 72% of the viewport),
 * never scrubbed: the reel was scrolled by hand, so timing must not depend on scroll speed.
 */
export default defineEnhancement({
  id: 'about',
  selector: ABOUT.root,
  when: 'visible',

  async setup({ root, caps, gsap: loadGsap }) {
    const { gsap } = await loadGsap();
    const scale = scaleFor(caps.motion);
    const cluster = requirePart(root, ABOUT.parts.cluster);
    const items = parts(root, ABOUT.parts.item);

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 72%', once: true },
    });

    timeline.fromTo(
      cluster,
      { opacity: 0, x: -90 * scale.distance, y: 90 * scale.distance, scale: caps.motion === 'full' ? 0.96 : 1 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.1 * scale.time,
        ease: ease.out,
        clearProps: 'transform,opacity,visibility',
        onStart: () => markRevealed([cluster]),
      },
      0,
    );

    timeline.fromTo(
      items,
      { opacity: 0, y: 24 * scale.distance },
      {
        opacity: 1,
        y: 0,
        duration: 0.7 * scale.time,
        ease: ease.soft,
        stagger: stagger.copy,
        clearProps: 'transform,opacity,visibility',
        onStart: () => markRevealed(items),
      },
      0.3 * scale.time,
    );

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([cluster, ...items], { clearProps: 'all' });
      markRevealed([cluster, ...items]);
    };
  },
});
