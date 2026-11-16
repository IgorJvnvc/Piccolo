import { defineEnhancement } from '@/shared/enhance';
import { HERO } from './hero.hooks';

/** How far to the pointer the drift goes each frame (0 to 1): the food trails the pointer a little instead of snapping to it. */
const FOLLOW = 0.1;

/**
 * Hero parallax: on a screen with a mouse, the food drifts a few pixels against the pointer, each piece by its own depth.
 * The behavior only publishes the pointer as --hero-x and --hero-y, -1 to 1 from the middle of the section; the stylesheet turns
 * them into a transform (opacity and transform only, ADR 0003). It never runs for reduced motion, on touch or on a TV.
 */
export default defineEnhancement({
  id: 'hero-parallax',
  selector: HERO.root,
  when: 'idle',
  tiers: ['full'],
  enabled: (caps) => caps.pointer === 'fine' && caps.hover,

  setup({ root, signal }) {
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const step = (): void => {
      frame = 0;
      x += (targetX - x) * FOLLOW;
      y += (targetY - y) * FOLLOW;
      root.style.setProperty('--hero-x', x.toFixed(3));
      root.style.setProperty('--hero-y', y.toFixed(3));
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.004) frame = requestAnimationFrame(step);
    };
    const aim = (nextX: number, nextY: number): void => {
      targetX = nextX;
      targetY = nextY;
      if (!frame) frame = requestAnimationFrame(step);
    };

    root.addEventListener(
      'pointermove',
      (event) => {
        const box = root.getBoundingClientRect();
        aim(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
      },
      { passive: true, signal },
    );
    root.addEventListener('pointerleave', () => aim(0, 0), { signal });

    root.dataset['parallax'] = '';
    return () => {
      cancelAnimationFrame(frame);
      delete root.dataset['parallax'];
      root.style.removeProperty('--hero-x');
      root.style.removeProperty('--hero-y');
    };
  },
});
