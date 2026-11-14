import type { Probe } from './types';

type ProbeWindow = Pick<Window, 'innerWidth' | 'innerHeight' | 'matchMedia' | 'navigator'>;

interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** Reads raw measurements from a window. The only place that touches matchMedia/navigator. */
export function probe(win: ProbeWindow): Probe {
  const matches = (query: string): boolean =>
    typeof win.matchMedia === 'function' && win.matchMedia(query).matches;

  const nav = win.navigator as Navigator & NavigatorExtras;

  return {
    userAgent: nav.userAgent,
    width: win.innerWidth,
    height: win.innerHeight,
    hover: matches('(hover: hover)'),
    pointerFine: matches('(pointer: fine)'),
    pointerCoarse: matches('(pointer: coarse)'),
    reducedMotion: matches('(prefers-reduced-motion: reduce)'),
    saveData: nav.connection?.saveData === true,
    hardwareConcurrency: typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    maxTouchPoints: typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints : 0,
  };
}
