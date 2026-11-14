import type { Brand } from '@/shared/kernel';

export type MenuItemId = Brand<string, 'MenuItemId'>;
export type CategoryId = Brand<string, 'CategoryId'>;

/** Smart constructors: the only places a raw string becomes an id (call at the infrastructure boundary). */
export const menuItemId = (value: string): MenuItemId => value as MenuItemId;
export const categoryId = (value: string): CategoryId => value as CategoryId;

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
  readonly id: CategoryId;
  readonly title: string;
  readonly blurb: string;
  readonly order: number;
}

export interface MenuItem {
  readonly id: MenuItemId;
  readonly categoryId: CategoryId;
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
