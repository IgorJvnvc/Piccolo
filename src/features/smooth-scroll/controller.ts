export type ScrollTarget = HTMLElement | number;

export interface ScrollOptions {
  /** Added to the target position (negative = stop above it). */
  readonly offset: number;
}

export type ScrollDriver = (target: ScrollTarget, options: ScrollOptions) => void;

let driver: ScrollDriver | null = null;

/** The smooth-scroll behavior registers itself here; anchors work with or without it. */
export function setScrollDriver(next: ScrollDriver): () => void {
  driver = next;
  return () => {
    if (driver === next) driver = null;
  };
}

/** Scrolls via the registered driver (Lenis) or the browser, whose scroll-behavior (base.css) is smooth unless reduced motion is on. */
export function scrollTo(target: ScrollTarget, offset = 0): void {
  if (driver) {
    driver(target, { offset });
    return;
  }
  const top = typeof target === 'number' ? target + offset : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top });
}

/** Offset that leaves room for the navbar (mirrors the CSS `scroll-padding-top`). */
export function anchorOffset(): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(padding) ? -padding : 0;
}
