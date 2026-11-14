/**
 * The two halves of the reveal protocol that every scene shares (ADR 0003). Pure DOM, no GSAP.
 *
 *  - `data-reveal` elements are hidden by CSS (base.css) until they are marked `data-revealed`;
 *  - a stage that starts `data-state="idle"` (the Follow card) is opened when its scene starts.
 */

/** Marks elements as revealed so the CSS "pre-hidden" state (base.css) stops applying. */
export function markRevealed(elements: Iterable<Element>): void {
  for (const element of elements) element.setAttribute('data-revealed', '');
}

/**
 * Ends every hidden or idle state under `root`: marks `[data-reveal]` elements revealed and opens
 * `[data-state="idle"]` stages. It is a scene's final state when it is torn down, and the fail-safe when a scene
 * cannot run at all (GSAP failed to load, expected markup is missing, ...): a broken enhancement must never leave
 * content invisible.
 */
export function openRoot(root: ParentNode): void {
  markRevealed(root.querySelectorAll('[data-reveal]'));
  for (const stage of root.querySelectorAll<HTMLElement>('[data-state="idle"]')) stage.dataset['state'] = 'open';
}
