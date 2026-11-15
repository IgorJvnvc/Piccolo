import type { ImageSource } from '@/shared/ui';
import type { MenuCardModel } from './card-model';
import type { Allergen, MenuCategory, MenuItem, Money } from './model';

export const byOrder = <T extends { readonly order: number }>(list: readonly T[]): T[] =>
  [...list].sort((a, b) => a.order - b.order);

export const itemsOfCategory = (items: readonly MenuItem[], categoryId: string): MenuItem[] =>
  byOrder(items.filter((item) => item.categoryId === categoryId));

/** Popular items, one per category first so the highlight row shows variety, then by order. */
export function popularItems(items: readonly MenuItem[], limit = 3): MenuItem[] {
  const popular = byOrder(items.filter((item) => item.popular));
  const seen = new Set<string>();
  const varied: MenuItem[] = [];
  const rest: MenuItem[] = [];
  for (const item of popular) {
    if (seen.has(item.categoryId)) rest.push(item);
    else {
      seen.add(item.categoryId);
      varied.push(item);
    }
  }
  return [...varied, ...rest].slice(0, limit);
}

export interface CategoryGroup {
  readonly category: MenuCategory;
  readonly items: readonly MenuItem[];
}

export function groupByCategory(categories: readonly MenuCategory[], items: readonly MenuItem[]): CategoryGroup[] {
  return byOrder(categories)
    .map((category) => ({ category, items: itemsOfCategory(items, category.id) }))
    .filter((group) => group.items.length > 0);
}

/** Lowest price across base price and sizes. */
export function fromPrice(item: MenuItem): Money {
  return item.sizes.reduce<Money>((lowest, size) => (size.price.minor < lowest.minor ? size.price : lowest), item.price);
}

export type MoneyFormatter = (money: Money) => string;

export function priceLabel(item: MenuItem, format: MoneyFormatter): string {
  const base = format(fromPrice(item));
  return item.sizes.length > 1 ? `from ${base}` : base;
}

const ALLERGEN_LABELS: Readonly<Record<Allergen, string>> = {
  gluten: 'Gluten',
  dairy: 'Dairy',
  egg: 'Egg',
  nuts: 'Tree nuts',
  peanuts: 'Peanuts',
  soy: 'Soy',
  fish: 'Fish',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
};

export const allergenLabel = (allergen: Allergen): string => ALLERGEN_LABELS[allergen];

export function toCardModel(item: MenuItem, image: ImageSource, format: MoneyFormatter): MenuCardModel {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceLabel: priceLabel(item, format),
    sizes: item.sizes.map((size) => ({ label: size.label, priceLabel: format(size.price) })),
    allergens: item.allergens.map(allergenLabel),
    tags: item.tags,
    image,
  };
}
