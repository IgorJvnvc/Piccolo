import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, paginate } from '@/features/menu-browser/pagination';

describe('paginate', () => {
  const list = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

  it('fills each page and leaves the rest on the last', () => {
    const pages = paginate(list(PAGE_SIZE * 3 + 4));
    expect(pages.map((page) => page.length)).toEqual([PAGE_SIZE, PAGE_SIZE, PAGE_SIZE, 4]);
    expect(pages.flat()).toEqual(list(PAGE_SIZE * 3 + 4)); // nothing lost, nothing repeated, same order
  });

  it('makes no extra empty page when the list divides evenly', () => {
    expect(paginate(list(PAGE_SIZE * 2)).map((page) => page.length)).toEqual([PAGE_SIZE, PAGE_SIZE]);
  });

  it('keeps one (empty) page for an empty list', () => {
    expect(paginate([])).toEqual([[]]);
  });
});