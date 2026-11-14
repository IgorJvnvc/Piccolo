import { ease } from '@/shared/motion';
import type { PresenceMotion } from '@/shared/motion/island';

/** Where the menu opens from: the toggle button's center, and the radius that reaches the farthest corner of the viewport. */
export interface Origin {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/** Seconds and pixels from the menu's own design, not from the reel. */
const CIRCLE = { duration: 0.65 } as const;
const LINKS = { duration: 0.55, at: 0.28, stagger: 0.07, rise: 36 } as const;
const FOOTER = { duration: 0.5, at: 0.6, rise: 24 } as const;

/** While this attribute is on the panel, the stylesheet clips it to the circle described by `--x`, `--y` and `--r`. */
const CLIP = 'data-clip';

/**
 * The mobile menu's choreography: the panel opens as a circle that grows from the toggle button while the links and the
 * footer rise in, and closes by shrinking back. `getOrigin` is read when the menu opens.
 *
 * The circle is one number (`circle.radius`), and both directions tween it, so closing a half-open menu shrinks it from
 * the size it has reached instead of jumping to full size first. The stylesheet clips the panel only while this runs, so a
 * menu at rest has no clip at all.
 */
export function createPanelMotion(getOrigin: () => Origin): PresenceMotion<HTMLElement> {
  const circle = { radius: 0 };
  let origin: Origin = { x: 0, y: 0, radius: 0 };

  const paint = (panel: HTMLElement): void => {
    panel.style.setProperty('--r', `${circle.radius}px`);
  };

  return {
    from(panel, { gsap, scale }) {
      origin = getOrigin();
      circle.radius = 0;
      panel.style.setProperty('--x', `${origin.x}px`);
      panel.style.setProperty('--y', `${origin.y}px`);
      panel.setAttribute(CLIP, '');
      paint(panel);
      gsap.set(panel.querySelectorAll('[data-part="link"]'), { opacity: 0, y: LINKS.rise * scale.distance });
      gsap.set(panel.querySelectorAll('[data-part="footer"]'), { opacity: 0, y: FOOTER.rise * scale.distance });
    },

    enter(panel, { gsap, scale }) {
      const timeline = gsap.timeline({ defaults: { ease: ease.out } });
      timeline.to(
        circle,
        {
          radius: origin.radius,
          duration: CIRCLE.duration,
          onUpdate: () => paint(panel),
          onComplete: () => panel.removeAttribute(CLIP),
        },
        0,
      );
      timeline.to(
        panel.querySelectorAll('[data-part="link"]'),
        { opacity: 1, y: 0, duration: LINKS.duration, stagger: LINKS.stagger, clearProps: 'opacity,transform' },
        LINKS.at,
      );
      timeline.to(
        panel.querySelectorAll('[data-part="footer"]'),
        { opacity: 1, y: 0, duration: FOOTER.duration, clearProps: 'opacity,transform' },
        FOOTER.at,
      );
      return timeline.timeScale(scale.speed);
    },

    exit(panel, { gsap, scale }) {
      panel.setAttribute(CLIP, '');
      paint(panel);
      const timeline = gsap.timeline();
      timeline.to(circle, { radius: 0, duration: CIRCLE.duration, ease: ease.out, onUpdate: () => paint(panel) });
      return timeline.timeScale(scale.speed);
    },
  };
}
