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
  /** Key into the image catalog (e.g. "food/pizza"). */
  readonly imageKey: string;
  readonly allergens: readonly Allergen[];
  readonly tags: readonly DietaryTag[];
  readonly popular: boolean;
  readonly order: number;
}
