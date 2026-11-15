import { FOCUSABLE } from './focusable';
import { type Box, type Candidate, type Direction, directionOf, isBackKey, pickNext } from './spatial';

export interface SpatialNavigatorOptions {
  /** Called for the remote's Back key. Return true if handled. */
  readonly onBack?: () => boolean;
  /** Called after focus moves (e.g. to scroll). */
  readonly onFocus?: (element: HTMLElement) => void;
}

const toBox = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none';
}

/**
 * D-pad navigation for TV browsers: arrow keys move focus to the geometrically nearest focusable.
 * Enter on non-native controls triggers click. Returns an unsubscribe.
 */
export function attachSpatialNavigation(
  doc: Document,
  options: SpatialNavigatorOptions = {},
  signal?: AbortSignal,
): void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    if (isBackKey(event) && options.onBack?.()) {
      event.preventDefault();
      return;
    }

    const direction: Direction | null = directionOf(event);
    if (!direction) return;

    const active = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    // Let text inputs keep their own arrow-key behavior.
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;

    // An open modal keeps the D-pad to itself, like it does Tab: the page behind it is not reachable.
    const scope = doc.querySelector('[aria-modal="true"]') ?? doc;
    const focusables = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el !== active && isVisible(el),
    );
    if (focusables.length === 0) return;

    const candidates: Candidate[] = focusables.map((el, id) => ({ id, box: toBox(el.getBoundingClientRect()) }));
    const from = active
      ? toBox(active.getBoundingClientRect())
      : { left: 0, top: 0, right: 0, bottom: 0 };

    const nextId = pickNext(from, candidates, direction);
    const next = nextId === null ? undefined : focusables[nextId];
    if (!next) return;

    event.preventDefault();
    next.focus({ preventScroll: true });
    options.onFocus?.(next);
  };

  doc.addEventListener('keydown', onKeyDown, signal ? { signal } : undefined);
}
