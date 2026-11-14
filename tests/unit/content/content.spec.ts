import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { categorySchema, homeSchema, itemSchema, siteSchema } from '@/infrastructure/content/schemas';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const readJson = (relative: string): unknown => JSON.parse(readFileSync(`${ROOT}${relative}`, 'utf8'));
const mainOf = (value: unknown): Record<string, unknown> => (value as { main: Record<string, unknown> }).main;
const rowsOf = (value: unknown): Array<Record<string, unknown>> => value as Array<Record<string, unknown>>;
const clone = <T>(value: T): T => structuredClone(value);

const IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'avif'] as const;

describe('src/content matches its schemas', () => {
  it('site.json', () => {
    const result = siteSchema.safeParse(mainOf(readJson('src/content/site.json')));
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it('home.json', () => {
    const result = homeSchema.safeParse(mainOf(readJson('src/content/home.json')));
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  describe('menu', () => {
    const categories = rowsOf(readJson('src/content/menu/categories.json'));
    const items = rowsOf(readJson('src/content/menu/items.json'));
    const categoryIds = categories.map((row) => String(row['id']));

    it('every category and item satisfies its schema', () => {
      const problems = [
        ...categories.flatMap((row) => {
          const result = categorySchema.safeParse(row);
          return result.success ? [] : [`category "${String(row['id'])}": ${JSON.stringify(result.error.issues)}`];
        }),
        ...items.flatMap((row) => {
          const result = itemSchema.safeParse(row);
          return result.success ? [] : [`item "${String(row['id'])}": ${JSON.stringify(result.error.issues)}`];
        }),
      ];
      expect(problems).toEqual([]);
    });

    it('ids are unique', () => {
      expect(new Set(categoryIds).size).toBe(categoryIds.length);
      const itemIds = items.map((row) => String(row['id']));
      expect(new Set(itemIds).size).toBe(itemIds.length);
    });

    it('every item belongs to a known category', () => {
      const orphans = items.filter((row) => !categoryIds.includes(String(row['category']))).map((row) => String(row['id']));
      expect(orphans).toEqual([]);
    });

    it('every category has at least one item (an empty tab would be a dead end)', () => {
      const empty = categoryIds.filter((id) => !items.some((row) => row['category'] === id));
      expect(empty).toEqual([]);
    });

    it('has enough popular items for the highlight row', () => {
      expect(items.filter((row) => row['popular'] === true).length).toBeGreaterThanOrEqual(3);
    });

    it('every item image key resolves to a file under src/assets', () => {
      const missing = [...new Set(items.map((row) => String(row['image'])))].filter(
        (key) => !IMAGE_EXTENSIONS.some((extension) => existsSync(`${ROOT}src/assets/${key}.${extension}`)),
      );
      expect(missing).toEqual([]);
    });
  });
});

describe('schemas reject bad content', () => {
  const site = mainOf(readJson('src/content/site.json'));
  const home = mainOf(readJson('src/content/home.json'));
  const firstItem = rowsOf(readJson('src/content/menu/items.json'))[0] ?? {};

  it('accepts the unmodified fixtures (so the failures below are caused by the edit)', () => {
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(homeSchema.safeParse(home).success).toBe(true);
    expect(itemSchema.safeParse(firstItem).success).toBe(true);
  });

  it('rejects a malformed opening time', () => {
    const bad = clone(site);
    (bad['hours'] as { weekly: Record<string, unknown> }).weekly['mon'] = { open: '25:00', close: '23:00' };
    expect(siteSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a currency that is not a 3-letter code', () => {
    expect(siteSchema.safeParse({ ...site, currency: 'EURO' }).success).toBe(false);
  });

  it('rejects an invalid email and an invalid social URL', () => {
    const contact = site['contact'] as Record<string, unknown>;
    expect(siteSchema.safeParse({ ...site, contact: { ...contact, email: 'not-an-email' } }).success).toBe(false);
    expect(siteSchema.safeParse({ ...site, socials: [{ network: 'instagram', label: 'IG', href: 'nope' }] }).success).toBe(false);
  });

  it('rejects an unknown social network', () => {
    expect(siteSchema.safeParse({ ...site, socials: [{ network: 'myspace', label: 'MS', href: 'https://example.com' }] }).success).toBe(false);
  });

  it('rejects a meta description that is too short to be useful', () => {
    const seo = home['seo'] as Record<string, unknown>;
    expect(homeSchema.safeParse({ ...home, seo: { ...seo, description: 'Too short.' } }).success).toBe(false);
  });

  it('rejects a free item, an unknown allergen and an unknown dietary tag', () => {
    expect(itemSchema.safeParse({ ...firstItem, price: 0 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...firstItem, allergens: ['pollen'] }).success).toBe(false);
    expect(itemSchema.safeParse({ ...firstItem, tags: ['halal'] }).success).toBe(false);
  });

  it('fills defaults for optional item fields', () => {
    const minimal = itemSchema.parse({
      category: 'pizza',
      name: 'Plain',
      description: 'Just a plain pizza.',
      price: 7,
      image: 'food/pizza',
    });
    expect(minimal).toMatchObject({ sizes: [], allergens: [], tags: [], popular: false, order: 0 });
  });
});
