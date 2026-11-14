/** Breakpoints in CSS px. Mirrored in CSS media queries (keep in sync; a test asserts it). */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;
