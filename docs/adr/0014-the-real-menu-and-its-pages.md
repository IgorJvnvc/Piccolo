# 0014. The real menu, in pages, with a larger HTML budget

Status: Accepted

## Context

The owner supplied the shop's printed menu (two images, in Serbian, prices in dinars): 8 sections and 71 items once the sizes of one
product are merged (Coca-Cola 0.25, 0.33 and 0.5 l is one item). It replaces the 15 placeholder dishes. The printed menu has names,
sizes and prices only; descriptions will be added later and shown when a dish is opened. The owner will also replace the placeholder
pictures later.

What shapes it:

- ADR 0003 and the architecture notes: the server renders every category, so search engines and visitors without JavaScript get the
  whole menu. Every item also travels in the island's props; markup and props together cost about 0.065 kB gzipped per item.
- 71 cards in one tab is too long to read, and the browser would paint all of them.
- The HTML budget was 24 kB gzipped (23.5 kB used).

## Decision

1. **Content**: 6 tabs (Pizza & Calzones | Hot Dogs & Sandwiches | Sweet Pies & Sandwiches | Salads, Soups & Sides | Hot Drinks |
   Cold Drinks), names translated to English, local products kept by name (kulen, kifla, kashkaval). Several sizes of one product
   are one item with `sizes`; the base price is the cheapest size. The two Next lemonade lines and the Fanta lines are kept as printed.
   Allergen and dietary data is not invented: the lists stay empty and the quick view says to ask.
2. **`description` is optional** (default empty). A card and the quick view leave the line out until the owner adds one.
3. **Prices are `220 RSD`**: the amount, then the currency code, no decimals for whole amounts, no thousands separator, as printed.
   The site currency is RSD.
4. **Pages of nine** (`features/menu-browser`: `paginate`, `Pager`). Every page of every category stays in the markup; only the current
   one is visible (`hidden`). Switching is instant, needs no fetch, and reuses the same card; a page remounts when shown, so the cards
   rise in as they do on a tab switch. A category of nine or fewer has no pager. Without JavaScript (or after a dead island) every page
   shows and the pager is hidden. At either end the pager button is `aria-disabled`, not `disabled`, so focus stays where it was.
5. **The HTML budget is 28 kB** (27.1 kB used). Images on pages that are not shown are lazy and `display: none`, so they are not fetched.

## Consequences

- The page is about 198 KB of HTML before compression, mostly the menu twice (markup and props). A low-end TV parses that on every load.
- The next lever, if that matters: render only the first page of each category and serve the rest from a static `/menu/` page. It
  would shrink the home page and give up "every page is in the home page's HTML".
- Cards without a description keep their height (`min-height`), so the grid does not change when descriptions arrive.
- Every card uses one of five placeholder illustrations until the owner supplies pictures.

## Alternatives considered

- **Compact rows (name and price) for sides, salads and drinks**: lighter, but the owner wants a picture for each dish.
- **Loading other categories on demand**: the smallest page, but visitors without JavaScript would see one category.
- **A different component on "next page"**: not needed; the same card is rendered for another slice of the list.