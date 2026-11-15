import { getCollection } from 'astro:content';
import { type MenuCategory, type MenuItem, type MenuRepository, byOrder } from '@/entities/menu';

export interface MenuSourceOptions {
  /** ISO 4217 currency for every price (owned by the site entity, injected by the composition root). */
  readonly currency: () => Promise<string>;
}

const toMinor = (major: number): number => Math.round(major * 100);

/**
 * Astro's file loader only logs a JSON syntax error, a row without an `id` and a duplicate `id`, and the build still passes
 * with a short or empty menu. Vite does fail on a syntax error, so comparing the raw row count with what loaded catches all three.
 */
const rawRows = import.meta.glob<unknown[]>('/src/content/menu/*.json', { eager: true, import: 'default' });

function loaded<T>(name: 'categories' | 'items', entries: readonly T[]): readonly T[] {
  const expected = rawRows[`/src/content/menu/${name}.json`]?.length ?? 0;
  if (entries.length !== expected) {
    throw new Error(
      `src/content/menu/${name}.json has ${expected} rows but ${entries.length} loaded: look for a row without an "id" or a duplicate "id"`,
    );
  }
  return entries;
}

/** Adapter: content collections (src/content/menu/*.json) -> MenuRepository. */
export function createContentMenuRepository({ currency }: MenuSourceOptions): MenuRepository {
  return {
    async categories(): Promise<readonly MenuCategory[]> {
      const entries = loaded('categories', await getCollection('categories'));
      return byOrder(
        entries.map((entry) => ({
          id: entry.id,
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
        loaded('items', entries).map((entry): MenuItem => {
          if (!known.has(entry.data.category)) {
            throw new Error(`Menu item "${entry.id}" references unknown category "${entry.data.category}"`);
          }
          return {
            id: entry.id,
            categoryId: entry.data.category,
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
