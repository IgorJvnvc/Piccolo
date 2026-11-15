export type ScrollTarget = HTMLElement | number;

export type ScrollDriver = (target: ScrollTarget) => void;

let driver: ScrollDriver | null = null;

/** The smooth-scroll behavior registers itself here; anchors work with or without it. */
export function setScrollDriver(next: ScrollDriver): () => void {
  driver = next;
  return () => {
    if (driver === next) driver = null;
  };
}

/**
 * Scrolls via the registered driver (Lenis) or the browser, whose scroll-behavior (base.css) is smooth unless reduced motion is on.
 * A section lands where the stylesheet says: the page's `scroll-padding-top` (room for the navbar) plus the section's own
 * `scroll-margin-top` (negative = a little further). Lenis reads both itself; the browser path adds them here.
 */
export function scrollTo(target: ScrollTarget): void {
  if (driver) {
    driver(target);
    return;
  }
  window.scrollTo({ top: typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - inset(target) });
}

function inset(target: HTMLElement): number {
  const px = (value: string): number => parseFloat(value) || 0;
  return px(getComputedStyle(document.documentElement).scrollPaddingTop) + px(getComputedStyle(target).scrollMarginTop);
}
