import type { MotionTier } from '@/shared/device';
import type { GsapKit } from './gsap';
import { markRevealed, openRoot } from './revealed';
import { duration, ease, scaleFor, travel, type TierScale } from './tokens';

type Gsap = GsapKit['gsap'];
export type Timeline = ReturnType<Gsap['timeline']>;
type Targets = Element | readonly Element[];

export interface FadeUpOptions {
  /** Rise distance in rem. Default `travel.rise`. */
  readonly travel?: number;
  /** Seconds. Default `duration.reveal`. */
  readonly duration?: number;
  /** Seconds between targets. */
  readonly stagger?: number;
  /** Default `ease.soft`. */
  readonly ease?: keyof typeof ease;
  /** Timeline position: seconds, a label or a relative string. Default: after the previous tween. */
  readonly at?: number | string;
}

/** What a scene's `build` function works with. */
export interface Scene {
  readonly gsap: Gsap;
  /** The scene's timeline: ScrollTrigger-linked, plays once, and already carries the scene defaults. */
  readonly timeline: Timeline;
  readonly tier: MotionTier;
  readonly scale: TierScale;
  /** rem to px at the current root font size. Call it inside function-based values so a resize re-measures. */
  readonly px: (rem: number) => number;
  /** Fade in while rising `travel` rem to rest. Animates opacity and transform only (ADR 0003). */
  readonly fadeUp: (targets: Targets, options?: FadeUpOptions) => void;
}

export interface SceneOptions {
  /** Scopes the GSAP context, and is where the reveal protocol is settled on teardown. */
  readonly root: Element;
  readonly tier: MotionTier;
  /** ScrollTrigger `start`, e.g. `enter.about`. */
  readonly start: string;
  /**
   * The element whose top crosses `start`. Default: the root. It must not be an element the scene moves:
   * ScrollTrigger measures transforms, so an animated trigger fires early or late by its own travel.
   */
  readonly trigger?: Element | undefined;
}

const rootRem = (): number => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/**
 * Builds one scene: a `gsap.context()` holding a single position-triggered, time-based (never scrubbed) timeline that
 * plays once. The context makes cleanup one call (`revert()` also kills the ScrollTrigger and restores inline styles),
 * the timeline `defaults` give every tween the same ease, duration and clean-up, and `invalidateOnRefresh` makes
 * function-based values re-measure whenever the viewport changes before the scene has played.
 *
 * Returns the teardown. It leaves the root in its final (revealed) state, never in the CSS pre-hidden one.
 */
export function createScene(kit: GsapKit, { root, tier, start, trigger }: SceneOptions, build: (scene: Scene) => void): () => void {
  const { gsap } = kit;
  const scale = scaleFor(tier);
  const px = (rem: number): number => rem * rootRem();

  // A no-op body is required: `gsap.context()` without a function returns the context that is *currently running*
  // (undefined here) instead of making a new one. The scene runs inside it through `add` so a throw can still revert.
  const context = gsap.context(() => undefined, root);
  const settle = (): void => {
    context.revert();
    openRoot(root);
  };

  try {
    context.add(() => {
      const timeline = gsap.timeline({
        // NEVER put `clearProps` here. A `fromTo` writes its from-state through an internal zero-duration tween that
        // inherits these defaults, so it would clear the from-state at the instant it is written, and staggered
        // targets would stand fully visible until their own start. `clearProps` belongs on each tween (see `fadeUp`).
        defaults: {
          ease: ease.soft,
          duration: duration.reveal,
          // Hand each tween's targets over from the CSS pre-state (base.css) the moment that tween starts, so the
          // CSS state stops applying before clearProps removes GSAP's inline one (ADR 0003).
          onStart(this: { targets: () => unknown[] }) {
            markRevealed(this.targets() as Element[]);
          },
        },
        scrollTrigger: { trigger: trigger ?? root, start, once: true, invalidateOnRefresh: true },
      });
      timeline.timeScale(scale.speed);

      build({
        gsap,
        timeline,
        tier,
        scale,
        px,
        fadeUp(targets, options = {}) {
          const { travel: rise = travel.rise, duration: seconds, stagger, ease: curve, at } = options;
          timeline.fromTo(
            targets,
            { opacity: 0, y: () => px(rise) * scale.distance },
            {
              opacity: 1,
              y: 0,
              clearProps: 'transform,opacity',
              ...(seconds !== undefined && { duration: seconds }),
              ...(stagger !== undefined && { stagger }),
              ...(curve !== undefined && { ease: ease[curve] }),
            },
            at,
          );
        },
      });
    });
  } catch (error) {
    settle();
    throw error;
  }

  return settle;
}
