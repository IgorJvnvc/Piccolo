import { describe, expect, it } from 'vitest';
import { ALLERGENS, type MenuCategory, type MenuItem, type Money } from '@/entities/menu/model';
import {
  allergenLabel,
  byOrder,
  fromPrice,
  groupByCategory,
  itemsOfCategory,
  popularItems,
  priceLabel,
  toCardModel,
} from '@/entities/menu/selectors';
import type { ImageSource } from '@/shared/ui';

const money = (minor: number): Money => ({ minor, currency: 'EUR' });
const euro = (value: Money): string => `€${(value.minor / 100).toFixed(2)}`;

interface ItemSpec {
  readonly id: string;
  readonly category: string;
  readonly order?: number;
  readonly popular?: boolean;
  readonly price?: number;
  readonly sizes?: ReadonlyArray<readonly [string, number]>;
}

const item = ({ id, category, order = 0, popular = false, price = 1000, sizes = [] }: ItemSpec): MenuItem => ({
  id,
  categoryId: category,
  name: id.toUpperCase(),
  description: `Description of ${id}`,
  price: money(price),
  sizes: sizes.map(([label, minor]) => ({ label, price: money(minor) })),
  imageKey: 'food/pizza',
  allergens: [],
  tags: [],
  popular,
  order,
});

const category = (id: string, order: number): MenuCategory => ({
  id,
  title: id,
  blurb: `About ${id}`,
  order,
});

const ids = (list: readonly { readonly id: string }[]): string[] => list.map((entry) => entry.id);

describe('byOrder', () => {
  it('sorts ascending without mutating its input', () => {
    const input = [{ order: 3 }, { order: 1 }, { order: 2 }];
    expect(byOrder(input).map((entry) => entry.order)).toEqual([1, 2, 3]);
    expect(input.map((entry) => entry.order)).toEqual([3, 1, 2]);
  });

  it('is stable for equal order values', () => {
    const input = [
      { order: 1, tag: 'a' },
      { order: 1, tag: 'b' },
      { order: 0, tag: 'c' },
    ];
    expect(byOrder(input).map((entry) => entry.tag)).toEqual(['c', 'a', 'b']);
  });
});

describe('itemsOfCategory', () => {
  it('keeps only that category, in display order', () => {
    const items = [
      item({ id: 'b', category: 'pizza', order: 2 }),
      item({ id: 'x', category: 'drinks', order: 1 }),
      item({ id: 'a', category: 'pizza', order: 1 }),
    ];
    expect(ids(itemsOfCategory(items, 'pizza'))).toEqual(['a', 'b']);
  });
});

describe('popularItems', () => {
  const items = [
    item({ id: 'pizza-1', category: 'pizza', order: 1, popular: true }),
    item({ id: 'pizza-2', category: 'pizza', order: 2, popular: true }),
    item({ id: 'dog-1', category: 'hotdogs', order: 3, popular: true }),
    item({ id: 'drink-1', category: 'drinks', order: 4, popular: true }),
    item({ id: 'plain', category: 'pizza', order: 0, popular: false }),
  ];

  it('shows one item per category first, so the highlight row has variety', () => {
    expect(ids(popularItems(items))).toEqual(['pizza-1', 'dog-1', 'drink-1']);
  });

  it('falls back to repeated categories only after every category is represented', () => {
    expect(ids(popularItems(items, 4))).toEqual(['pizza-1', 'dog-1', 'drink-1', 'pizza-2']);
  });

  it('respects the limit and ignores items that are not popular', () => {
    expect(ids(popularItems(items, 2))).toEqual(['pizza-1', 'dog-1']);
    expect(ids(popularItems(items, 10))).not.toContain('plain');
  });

  it('returns nothing when nothing is popular', () => {
    expect(popularItems([item({ id: 'a', category: 'pizza' })])).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('orders categories and drops the ones without items', () => {
    const categories = [category('drinks', 2), category('empty', 3), category('pizza', 1)];
    const items = [item({ id: 'd', category: 'drinks' }), item({ id: 'p', category: 'pizza' })];

    const groups = groupByCategory(categories, items);

    expect(groups.map((group) => group.category.id)).toEqual(['pizza', 'drinks']);
    expect(groups.map((group) => ids(group.items))).toEqual([['p'], ['d']]);
  });
});

describe('fromPrice / priceLabel', () => {
  it('uses the base price when there are no sizes', () => {
    const plain = item({ id: 'a', category: 'pizza', price: 850 });
    expect(fromPrice(plain)).toEqual(money(850));
    expect(priceLabel(plain, euro)).toBe('€8.50');
  });

  it('uses the lowest price across sizes and says "from" when there are several', () => {
    const sized = item({ id: 'a', category: 'pizza', price: 1000, sizes: [['Large', 1400], ['Small', 800]] });
    expect(fromPrice(sized)).toEqual(money(800));
    expect(priceLabel(sized, euro)).toBe('from €8.00');
  });

  it('does not say "from" for a single size', () => {
    const single = item({ id: 'a', category: 'drinks', price: 300, sizes: [['500 ml', 300]] });
    expect(priceLabel(single, euro)).toBe('€3.00');
  });

  it('keeps a base price that is lower than every size', () => {
    const cheapBase = item({ id: 'a', category: 'pizza', price: 500, sizes: [['L', 900], ['XL', 1200]] });
    expect(fromPrice(cheapBase)).toEqual(money(500));
  });
});

describe('toCardModel', () => {
  const image = { marker: 'image' } as unknown as ImageSource;

  it('maps an item to a display-ready, serialisable card', () => {
    const source: MenuItem = {
      ...item({ id: 'margherita', category: 'pizza', price: 850, sizes: [['Small', 850], ['Large', 1250]] }),
      allergens: ['gluten', 'dairy', 'nuts'],
      tags: ['vegetarian'],
    };

    const card = toCardModel(source, image, euro);

    expect(card).toEqual({
      id: 'margherita',
      name: 'MARGHERITA',
      description: 'Description of margherita',
      priceLabel: 'from €8.50',
      sizes: [
        { label: 'Small', priceLabel: '€8.50' },
        { label: 'Large', priceLabel: '€12.50' },
      ],
      allergens: ['Gluten', 'Dairy', 'Tree nuts'],
      tags: ['vegetarian'],
      image,
    });
  });
});

describe('allergenLabel', () => {
  it('has a distinct, human-readable label for every allergen', () => {
    const labels = ALLERGENS.map(allergenLabel);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(ALLERGENS.length);
  });
});
