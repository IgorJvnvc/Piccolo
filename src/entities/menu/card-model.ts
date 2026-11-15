import type { ImageSource } from '@/shared/ui';

/**
 * Everything a menu card (and the quick view) needs, already formatted. Serializable, so the same
 * model feeds static Astro rendering and the hydrated MenuBrowser island.
 */
export interface MenuCardModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** "€8.50" or "from €8.50". */
  readonly priceLabel: string;
  readonly sizes: ReadonlyArray<{ readonly label: string; readonly priceLabel: string }>;
  readonly allergens: readonly string[];
  /** Display labels, like the allergens: "Vegetarian", "Spicy". */
  readonly tags: readonly string[];
  readonly image: ImageSource;
}
