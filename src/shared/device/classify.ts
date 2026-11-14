import { BREAKPOINTS } from '@/shared/config';
import type { Capabilities, DeviceClass, MotionTier, PointerKind, Probe } from './types';

/** TV platforms. Keep in sync with bootstrap.inline.js (a parity test enforces it). */
const TV_UA =
  /(smart-?tv|tizen|web0s|webos|hbbtv|netcast|appletv|crkey|bravia|sonydtv|vidaa|roku|hisense|philipstv|googletv|android tv|\bgtv\b)/i;
const FIRE_TV_UA = /\bAFT[A-Z]{1,5}\b/;

/** Touch devices whose shortest side is below this are phones. */
export const PHONE_SHORT_SIDE = 600;
/** Large screens with no pointer and no hover are treated as TVs even without a UA token. */
export const TV_MIN_WIDTH = 1920;

export function isTvUserAgent(userAgent: string): boolean {
  return TV_UA.test(userAgent) || FIRE_TV_UA.test(userAgent);
}

export function pointerOf(probe: Pick<Probe, 'pointerFine' | 'pointerCoarse'>): PointerKind {
  if (probe.pointerFine) return 'fine';
  if (probe.pointerCoarse) return 'coarse';
  return 'none';
}

function deviceOf(probe: Probe, pointer: PointerKind): DeviceClass {
  if (isTvUserAgent(probe.userAgent)) return 'tv';
  if (pointer === 'none' && !probe.hover && probe.width >= TV_MIN_WIDTH) return 'tv';

  const touchOnly = pointer === 'coarse' && !probe.hover;
  if (touchOnly) {
    return Math.min(probe.width, probe.height) < PHONE_SHORT_SIDE ? 'phone' : 'tablet';
  }

  if (probe.width >= BREAKPOINTS.xl) return 'desktop';
  if (probe.width >= BREAKPOINTS.lg) return 'laptop';
  return 'tablet';
}

function motionOf(probe: Probe, device: DeviceClass, lowEnd: boolean): MotionTier {
  if (probe.reducedMotion) return 'static';
  if (device === 'tv' || probe.saveData || lowEnd) return 'lite';
  return 'full';
}

/** Pure classification: no DOM access. */
export function classify(probe: Probe): Capabilities {
  const pointer = pointerOf(probe);
  const device = deviceOf(probe, pointer);
  const lowEnd =
    (typeof probe.hardwareConcurrency === 'number' && probe.hardwareConcurrency <= 2) ||
    (typeof probe.deviceMemory === 'number' && probe.deviceMemory <= 2);

  return {
    device,
    motion: motionOf(probe, device, lowEnd),
    pointer,
    hover: probe.hover,
    reducedMotion: probe.reducedMotion,
    saveData: probe.saveData,
    lowEnd,
    width: probe.width,
  };
}
