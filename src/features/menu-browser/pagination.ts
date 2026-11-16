/** Cards on one page of a category: a full row of three on a desktop, three rows of them. */
export const PAGE_SIZE = 9;

/** Splits a category's cards into pages. An empty list is still one (empty) page. */
export function paginate<T>(items: readonly T[], size = PAGE_SIZE): T[][] {
  const count = Math.max(1, Math.ceil(items.length / size));
  return Array.from({ length: count }, (_, index) => items.slice(index * size, (index + 1) * size));
}