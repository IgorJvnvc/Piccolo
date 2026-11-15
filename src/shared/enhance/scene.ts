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

/** A kit that has not arrived by then counts as a failed download: the content opens instead of staying hidden. */
const KIT_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`GSAP did not load within ${ms} ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * A scroll scene: an enhancement that plays one timeline once when its section arrives (`when: 'visible'`, full and
 * lite tiers). It owns the whole lifecycle, so scenes only describe the choreography:
 *  - GSAP is loaded on demand, and nothing is built if the scene was torn down while it loaded;
 *  - teardown reverts the GSAP context and leaves the root revealed;
 *  - if the scene cannot run (the download failed or stalled, markup is missing), `recover` reveals the root instead of
 *    leaving content invisible;
 *  - if the runtime was so late that the bootstrap's failsafe (`html.no-enhance`) already showed the page, it does
 *    nothing: hiding visible content to play it in again would flash it.
 */
export function defineScene({ id, selector, start, trigger, build }: SceneDefinition): Enhancement {
  return defineEnhancement({
    id,
    selector,
    when: 'visible',
    recover: openRoot,
    async setup({ root, caps, signal, gsap: loadKit }) {
      if (root.ownerDocument.documentElement.classList.contains('no-enhance')) return undefined;
      const kit = await withTimeout(loadKit(), KIT_TIMEOUT_MS);
      if (signal.aborted) return undefined;
      return createScene(kit, { root, tier: caps.motion, start, trigger: trigger?.(root) }, (scene) => build(scene, root));
    },
  });
}
