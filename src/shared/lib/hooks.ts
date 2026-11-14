/**
 * Markup <-> behavior contract.
 *
 * Markup declares WHAT it is (`data-enhance="hero"`, `data-part="cards"`); behaviors find it through
 * these helpers. Neither side hard-codes the other's class names, so CSS Modules stay private.
 */
export const ENHANCE_ATTR = 'data-enhance';
export const PART_ATTR = 'data-part';

/** Attribute bag for `{...spread}` in Astro/TSX markup. */
export const enhanceAttr = (name: string): Record<typeof ENHANCE_ATTR, string> => ({
  [ENHANCE_ATTR]: name,
});

export const partAttr = (name: string): Record<typeof PART_ATTR, string> => ({
  [PART_ATTR]: name,
});

/** CSS selector builders for behaviors. */
export const selector = {
  enhance: (name: string): string => `[${ENHANCE_ATTR}="${name}"]`,
  part: (name: string): string => `[${PART_ATTR}="${name}"]`,
} as const;

/** Typed querySelector that throws a helpful error for required parts. */
export function requirePart<T extends Element = HTMLElement>(root: ParentNode, name: string): T {
  const el = root.querySelector<T>(selector.part(name));
  if (!el) throw new Error(`Missing required part "${name}" (${selector.part(name)})`);
  return el;
}

export function parts<T extends Element = HTMLElement>(root: ParentNode, name: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector.part(name)));
}
