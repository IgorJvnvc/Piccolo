# 0015. One picture for every product

Status: Superseded by [0017](0017-the-owners-product-shots.md)

## Context

After ADR 0014 the menu had 71 items and five illustrations: a page of nine cards showed the same drawing up to nine times. The owner
wants a picture for each product and will supply photographs later.

## Decision

1. **One generated SVG per product**, `src/assets/menu/<item id>.svg`. The drawings live in `scripts/art/menu.mjs` and `npm run art`
   writes them. 70 files serve 71 items: the two Next lemonade lines share `menu/next-lemonade`. A photo with the same base name replaces
   a drawing (the catalog prefers rasters).
2. **Drinks are generic and colour-coded by flavour**: a bottle, carton, can or glass, a label colour and a fruit. No brand logos,
   labels or trade dress.
3. **The same paint budget as the hero art (ADR 0013)**: no texture and no blur, a few dozen elements each, and no drawn contact shadow
   (the card adds one). The 70 files weigh 220 KB raw (3.1 KB on average); images on pages that are not shown are lazy and hidden.
4. **The HTML budget is 30 kB** (28.65 kB used): every card now carries its own image URL, in the markup and in the island's props.
5. **The five old cutouts are gone** (`food/pizza`, `hotdog`, `sandwich`, `drink`, `basil`). `food/pizza-whole` stays: the intro and the
   heading badge use it. The hero keeps its own pieces.

## Consequences

- The pictures are illustrations: they show what a product is, not how this shop's version looks, and they do not change with the size.
- A new product needs a picture of its own, or the key of one that fits (`next-limunana` reuses `next-lemonade`).
- Photographs will add a `srcset` to every card; the HTML budget needs another look then.
- Measured with `scripts/dev/stall-lab.mjs` (desktop, cold Chrome, median of 6): the Menu scene's worst frame gap was 118 ms against 135 ms
  for the build with five pictures, so the extra drawings cost no first-frame stall.

## Alternatives considered

- **Brand-accurate drinks**: trade dress that is not ours to draw.
- **A few shared pictures per category**: the cards look repeated, which is what this replaces.
- **Waiting for photographs**: the menu would stay placeholder-looking for as long as that takes.