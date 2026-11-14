/** Browser-safe public API of the menu entity (pure TS: no Astro, no DOM). UI lives in ./ui. */
export type { MenuCardModel } from './card-model';
export {
  ALLERGENS,
  DIETARY_TAGS,
  type Allergen,
  type CategoryId,
  type DietaryTag,
  type MenuCategory,
  type MenuItem,
  type MenuItemId,
  type MenuSize,
  type Money,
  categoryId,
  menuItemId,
} from './model';
export type { MenuRepository } from './ports';
export { type CategoryGroup, type MoneyFormatter, byOrder, groupByCategory, popularItems, toCardModel } from './selectors';
