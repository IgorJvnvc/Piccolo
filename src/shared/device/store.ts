import { classify } from './classify';
import { probe } from './probe';
import type { Capabilities, MotionTier } from './types';

export type CapabilitiesListener = (caps: Capabilities) => void;

export interface CapabilitiesStore {
  get(): Capabilities;
  subscribe(listener: CapabilitiesListener): () => void;
}

const MEDIA_QUERIES = [
  '(prefers-reduced-motion: reduce)',
  '(hover: hover)',
  '(pointer: fine)',
  '(pointer: coarse)',
] as const;

const same = (a: Capabilities, b: Capabilities): boolean =>
  a.device === b.device &&
  a.motion === b.motion &&
  a.pointer === b.pointer &&
  a.hover === b.hover &&
  a.reducedMotion === b.reducedMotion &&
  a.saveData === b.saveData &&
  a.lowEnd === b.lowEnd;

/**
 * Live capabilities. Re-classifies on resize (debounced) and when the relevant media queries change
 * (e.g. the user toggles "reduce motion" or docks a tablet).
 */
export function createCapabilitiesStore(win: Window): CapabilitiesStore {
  let current = classify(probe(win));
  const listeners = new Set<CapabilitiesListener>();
  let timer: number | undefined;

  const refresh = (): void => {
    const next = classify(probe(win));
    if (same(current, next)) {
      current = next; // width may have changed; keep the freshest snapshot without notifying
      return;
    }
    current = next;
    listeners.forEach((listener) => listener(next));
  };

  win.addEventListener(
    'resize',
    () => {
      win.clearTimeout(timer);
      timer = win.setTimeout(refresh, 150);
    },
    { passive: true },
  );

  for (const query of MEDIA_QUERIES) {
    win.matchMedia(query).addEventListener('change', refresh);
  }

  return {
    get: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Mirrors capabilities onto <html data-*> so CSS can react (no class churn). */
export function applyToDocument(doc: Document, caps: Capabilities): void {
  const root = doc.documentElement;
  root.setAttribute('data-device', caps.device);
  root.setAttribute('data-motion', caps.motion);
  root.setAttribute('data-pointer', caps.pointer);
}

/**
 * The motion tier the document is in right now. It reads what `applyToDocument` and the inline bootstrap wrote, so it
 * follows a visitor who switches reduced motion on while the page is open. Without the attribute (no script ran, or an
 * unknown value) nothing may animate: the conservative answer is `static`.
 */
export function motionTierOf(doc: Document): MotionTier {
  const tier = doc.documentElement.getAttribute('data-motion');
  return tier === 'full' || tier === 'lite' ? tier : 'static';
}
