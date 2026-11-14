import { getCollection } from 'astro:content';
import {
  type MenuCategory,
  type MenuItem,
  type MenuRepository,
  byOrder,
  categoryId,
  menuItemId,
} from '@/entities/menu';

export interface MenuSourceOptions {
  /** ISO 4217 currency for every price (owned by the site entity, injected by the composition root). */
  readonly currency: () => Promise<string>;
}

const toMinor = (major: number): number => Math.round(major * 100);

/** Adapter: content collections (src/content/menu/*.json) -> MenuRepository. */
export function createContentMenuRepository({ currency }: MenuSourceOptions): MenuRepository {
  return {
    async categories(): Promise<readonly MenuCategory[]> {
      const entries = await getCollection('categories');
      return byOrder(
        entries.map((entry) => ({
          id: categoryId(entry.id),
          title: entry.data.title,
          blurb: entry.data.blurb,
          order: entry.data.order,
        })),
      );
    },

    async items(): Promise<readonly MenuItem[]> {
      const [entries, code, categories] = await Promise.all([
        getCollection('items'),
        currency(),
        getCollection('categories'),
      ]);
      const known = new Set(categories.map((category) => category.id));

      const money = (major: number) => ({ minor: toMinor(major), currency: code });

      return byOrder(
        entries.map((entry): MenuItem => {
          if (!known.has(entry.data.category)) {
            throw new Error(`Menu item "${entry.id}" references unknown category "${entry.data.category}"`);
          }
          return {
            id: menuItemId(entry.id),
            categoryId: categoryId(entry.data.category),
            name: entry.data.name,
            description: entry.data.description,
            price: money(entry.data.price),
            sizes: entry.data.sizes.map((size) => ({ label: size.label, price: money(size.price) })),
            imageKey: entry.data.image,
            allergens: entry.data.allergens,
            tags: entry.data.tags,
            popular: entry.data.popular,
            order: entry.data.order,
          };
        }),
      );
    },
  };
}
