import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { categorySchema, homeSchema, itemSchema, siteSchema } from '@/infrastructure/content/schemas';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

type Row = Record<string, unknown>;
const readJson = (file: string): unknown => JSON.parse(readFileSync(`${ROOT}src/content/${file}`, 'utf8'));
const mainOf = (file: string): Row => (readJson(file) as { main: Row }).main;
const rowsOf = (file: string): Row[] => readJson(file) as Row[];

const site = mainOf('site.json');
const home = mainOf('home.json');
const categories = rowsOf('menu/categories.json');
const items = rowsOf('menu/items.json');

const problems = (name: string, result: { success: boolean; error?: { message: string } }): string[] =>
  result.success ? [] : [`${name}: ${result.error?.message ?? ''}`];

// The build validates the same files (collections, menu row count, image catalog). This names a failure in `npm test` and
// checks what the build cannot: that no category is an empty tab and the highlight row has enough items.
describe('src/content', () => {
  it('matches its schemas', () => {
    expect([
      ...problems('site', siteSchema.safeParse(site)),
      ...problems('home', homeSchema.safeParse(home)),
      ...categories.flatMap((row) => problems(`category ${String(row['id'])}`, categorySchema.safeParse(row))),
      ...items.flatMap((row) => problems(`item ${String(row['id'])}`, itemSchema.safeParse(row))),
    ]).toEqual([]);
  });

  it('has no empty category tab and enough popular items for the highlight row', () => {
    const empty = categories.filter((category) => !items.some((item) => item['category'] === category['id']));
    expect(empty.map((category) => category['id'])).toEqual([]);
    expect(items.filter((item) => item['popular'] === true).length).toBeGreaterThanOrEqual(3);
  });

  it('prices an item from its cheapest size and lists each size once', () => {
    const sized = items.filter((item) => Array.isArray(item['sizes']) && item['sizes'].length > 0);
    expect(sized.length).toBeGreaterThan(0);
    const wrong = sized.filter((item) => {
      const sizes = item['sizes'] as { label: string; price: number }[];
      return item['price'] !== Math.min(...sizes.map((size) => size.price)) || new Set(sizes.map((size) => size.label)).size !== sizes.length;
    });
    expect(wrong.map((item) => item['id'])).toEqual([]);
  });});

describe('schemas reject bad content', () => {
  const hours = site['hours'] as { weekly: Row };
  const monday = (mon: unknown): Row => ({ ...site, hours: { ...hours, weekly: { ...hours.weekly, mon } } });

  it.each([
    ['an hour past 23', monday({ open: '25:00', close: '23:00' })],
    ['an unpadded time', monday({ open: '9:30', close: '23:00' })],
    ['an unknown time zone', { ...site, hours: { ...hours, timezone: 'Europe/Atlantis' } }],
    ['a currency that is not a 3-letter code', { ...site, currency: 'EURO' }],
  ])('site.json: %s', (_name, bad) => {
    expect(siteSchema.safeParse(bad).success).toBe(false);
  });

  it.each([
    ['a free item', { price: 0 }],
    ['a price with fractions of a cent', { price: 8.505 }],
    ['an id that is not a slug', { id: 'Big Mac' }],
    ['an unknown allergen', { allergens: ['pollen'] }],
  ])('items.json: %s', (_name, patch) => {
    expect(itemSchema.safeParse({ ...items[0], ...patch }).success).toBe(false);
  });

  it('fills defaults for optional item fields', () => {
    const minimal = itemSchema.parse({
      id: 'plain',
      category: 'pizza',
      name: 'Plain',
      description: 'Just a plain pizza.',
      price: 7,
      image: 'food/pizza',
    });
    expect(minimal).toMatchObject({ sizes: [], allergens: [], tags: [], popular: false, order: 0 });
  });
});
