/** Runs `callback` once the main thread is idle (falls back to a timeout on browsers without rIC). */
export function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

/**
 * Runs `callback` once when `element` is within 25% of the viewport height.
 * Elements already above the viewport (page reloaded mid-scroll) count as visible so their scene can
 * settle into its end state instead of staying pre-hidden forever.
 */
export function whenVisible(element: Element, callback: () => void): () => void {
  if (typeof IntersectionObserver !== 'function') {
    callback();
    return () => undefined;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((entry) => entry.isIntersecting || entry.boundingClientRect.top < 0);
      if (!hit) return;
      observer.disconnect();
      callback();
    },
    { rootMargin: '25% 0px' },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
