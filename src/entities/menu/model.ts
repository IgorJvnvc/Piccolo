export const ALLERGENS = [
  'gluten',
  'dairy',
  'egg',
  'nuts',
  'peanuts',
  'soy',
  'fish',
  'sesame',
  'mustard',
  'celery',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIETARY_TAGS = ['vegetarian', 'vegan', 'spicy', 'new'] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

/** Integer minor units (cents) + ISO 4217 currency. Never floats. */
export interface Money {
  readonly minor: number;
  readonly currency: string;
}

export interface MenuSize {
  readonly label: string;
  readonly price: Money;
}

export interface MenuAddonOption {
  readonly label: string;
  /** `null` when the shop states no price (sauces, toasted or not): nothing is shown, and nothing is claimed. */
  readonly price: Money | null;
}

/** A group of optional extras ("Sauces", "Extras") that go with an item. Informational: the site takes no orders. */
export interface MenuAddonGroup {
  readonly id: string;
  readonly title: string;
  /** Shown beside the title ("60 g each"); empty when there is none. */
  readonly note: string;
  readonly options: readonly MenuAddonOption[];
}

export interface MenuCategory {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly order: number;
}

export interface MenuItem {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description: string;
  /** Base ("from") price. */
  readonly price: Money;
  readonly sizes: readonly MenuSize[];
  /** Optional extras that go with this item, in display order. Empty for most items. */
  readonly addons: readonly MenuAddonGroup[];
  /** Key into the image catalog (e.g. "menu/pizza-slice"). */
  readonly imageKey: string;
  readonly allergens: readonly Allergen[];
  readonly tags: readonly DietaryTag[];
  readonly popular: boolean;
  readonly order: number;
}
