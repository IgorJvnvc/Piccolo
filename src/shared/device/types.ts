/** What kind of screen/input the visitor has. Drives behavior (not layout: layout is pure CSS). */
export type DeviceClass = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'tv';

/**
 * How much motion we are allowed to ship.
 * - full:   everything (smooth scroll on desktop, scroll scenes, blur)
 * - lite:   TV / low-end / data-saver: opacity+transform only, no smooth-scroll, no blur
 * - static: prefers-reduced-motion: nothing moves, everything is visible immediately
 */
export type MotionTier = 'full' | 'lite' | 'static';

export type PointerKind = 'fine' | 'coarse' | 'none';

export interface Capabilities {
  readonly device: DeviceClass;
  readonly motion: MotionTier;
  readonly pointer: PointerKind;
  readonly hover: boolean;
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  readonly lowEnd: boolean;
  readonly width: number;
}

/** Raw measurements. `classify(probe)` is pure, so it is unit-testable without a browser. */
export interface Probe {
  readonly userAgent: string;
  readonly width: number;
  readonly height: number;
  readonly hover: boolean;
  readonly pointerFine: boolean;
  readonly pointerCoarse: boolean;
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  readonly hardwareConcurrency: number | undefined;
  readonly deviceMemory: number | undefined;
  readonly maxTouchPoints: number;
}
