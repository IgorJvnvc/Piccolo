import type { ImageSource } from '@/shared/ui';
import type { DietaryTag } from './model';

/**
 * Everything a menu card (and the quick view) needs, already formatted. Serializable, so the same
 * model feeds static Astro rendering and the hydrated MenuBrowser island.
 */
export interface MenuCardModel {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description: string;
  /** "€8.50" or "from €8.50". */
  readonly priceLabel: string;
  readonly sizes: ReadonlyArray<{ readonly label: string; readonly priceLabel: string }>;
  readonly allergens: readonly string[];
  readonly tags: readonly DietaryTag[];
  readonly image: ImageSource;
}
