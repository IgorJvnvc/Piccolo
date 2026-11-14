import { type Scene, createScene, openRoot } from '@/shared/motion';
import { type Enhancement, defineEnhancement } from './enhancement';

export interface SceneDefinition {
  readonly id: string;
  /** CSS selector of the scene root(s), usually `[data-enhance="name"]`. */
  readonly selector: string;
  /** ScrollTrigger `start`, e.g. `enter.about`. */
  readonly start: string;
  /** The element whose top crosses `start`. Default: the root. It must not be an element the scene moves. */
  readonly trigger?: (root: HTMLElement) => Element;
  /** The choreography. Runs once the GSAP kit has loaded; use `scene.timeline` and its helpers. */
  readonly build: (scene: Scene, root: HTMLElement) => void;
}

/**
 * A scroll scene: an enhancement that plays one timeline once when its section arrives (`when: 'visible'`, full and
 * lite tiers). It owns the whole lifecycle, so scenes only describe the choreography:
 *  - GSAP is loaded on demand, and nothing is built if the scene was torn down while it loaded;
 *  - teardown reverts the GSAP context and leaves the root revealed;
 *  - if the scene cannot run (the download failed, markup is missing), `recover` reveals the root instead of
 *    leaving content invisible.
 */
export function defineScene({ id, selector, start, trigger, build }: SceneDefinition): Enhancement {
  return defineEnhancement({
    id,
    selector,
    when: 'visible',
    recover: openRoot,
    async setup({ root, caps, signal, gsap: loadKit }) {
      const kit = await loadKit();
      if (signal.aborted) return undefined;
      return createScene(kit, { root, tier: caps.motion, start, trigger: trigger?.(root) }, (scene) => build(scene, root));
    },
  });
}
