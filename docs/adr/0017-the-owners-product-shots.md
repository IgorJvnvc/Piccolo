# 0017. The owner's product shots, enhanced and cut out

Status: Accepted. Supersedes [0015](0015-one-picture-for-every-product.md). Its parking of the salads and sides is superseded by [0018](0018-real-details-and-add-ons.md): they became add-on groups.

## Context

ADR 0015 gave every product a generated drawing until photographs existed. The owner then supplied 36 shots: packaged drinks on pure
white, plated food on a light-grey backdrop, three whole pizzas on a wooden board, two soups. They are small (107 to 506 px wide), fully
opaque, with their background and a baked-in shadow, and they cover 36 of the 71 menu items. The owner decided that the menu shows only
products that have a picture, and that salads and sides will go to a card section that is not defined yet.

## Decision

1. **The menu is the 36 items with a picture, one picture each.** 22 items without a shot are removed (pizza box, large hot dog, kifla,
   apple pie, the six hot drinks, plain Fanta, Next Limunana, Life strawberry, the five nectars, Rosa sparkling water, Aqua Viva, Guarana,
   Ultra Energy), so the Hot Drinks tab is gone. The 4 salads and 9 sides are parked in `src/content/menu/parked.json`, which no collection
   loads, until the card section exists. The two soups keep a tab of their own, "Soups". Popular Picks shows Small Hot Dog where it showed
   Large Hot Dog.
2. **One local script makes every picture**: `scripts/menu-images/build.py` (Python, in the gitignored `.shots/venv`, pinned by
   `requirements.txt`). A shot goes in as `scripts/menu-images/originals/<item id>.png`, which the site never imports, and comes out as
   `src/assets/menu/<item id>.webp`. Real-ESRGAN general x4v3 enhances it (4x, and it removes the compression noise), rembg
   (`isnet-general-use`) finds the product, closed-form matting (pymatting) draws a soft edge and takes the old background's colour out of
   it, then a light unsharp pass and a lossy WebP with alpha finish it. It runs on the CPU and uploads nothing. `--sheet` writes review
   sheets: each picture on the card, on the quick view's glow and on a dark backdrop, where a halo shows.
3. **A picture is as wide as its product, not square.** The card limits a picture's height (`max-height: 9rem`), so in a square canvas a
   sandwich took a third of the card's width. A tight picture (longer side 640 px) shows a wide dish about 1.6 times larger at the same
   height and changes nothing for a bottle.
4. **Three kinds of shot need a fix that is a property of the shot**, kept in `scripts/menu-images/options.json`. The whole pizzas are
   round: the largest circle inside the pizza drops the dark board under it and the flat cuts the frame made. The white yogurt carton on
   white has no edge for a model to find: the product is the convex hull of what is not white. The beef soup is a bowl inside a still life
   with raw meat and carrots: its outline is drawn by hand and refined by matting.
5. **A WebP passes through the image catalog untouched**: no srcset, no AVIF. A picture is already exported at about twice its largest
   display size, and three formats of it for every card would not fit the HTML budget.
6. **The drawn menu art is gone**: the 70 SVGs and `scripts/art/menu.mjs`. `npm run art` still draws the hero and section art.
7. **The pictures show manufacturers' packaging and logos.** ADR 0015 kept them out of drawings because trade dress is not ours to draw; a
   shop shows the products it sells, and the owner supplied the shots.

## Consequences

- Measured on the build: the HTML is 24.69 kB gzipped (28.65 kB before; the limit is 30). The 36 pictures weigh 1,118 kB (16 to 78 kB
  each, 31 kB on average) against 220 kB of SVG. The heaviest page of cards is Pizza (313 kB); pages that are not shown stay lazy and hidden.
- `scripts/dev/stall-lab.mjs` (desktop, cold Chrome, median of 3, the worst gap between two frames, new build then old): Menu 27 against
  110 ms, quick view 70 against 106, Popular 69 against 55, About 118 against 133. No first-frame stall was added. Not measured on a real phone.
- The source caps the sharpness. The upscaler adds crispness and smoothing, not information: labels are legible, but broth, pie crust and
  cheese look slightly painted, and on a 3x phone the quick view shows a wide dish about 1.5 times enlarged by the browser. A larger original
  in the same folder and `build.py <item id>` redo a picture in seconds; nothing else changes.
- Cold Drinks has 19 items, so its page 3 holds a single card.
- A new product: put its shot in `originals/`, run the script, look at the sheets, commit the WebP. The environment (torch, rembg and
  pymatting: 1.1 GB, plus two models downloaded on first use, 170 MB and 5 MB) is not part of `npm run verify` or the build; the finished
  pictures are committed.
- `tests/unit/content/menu-images.spec.ts` keeps it honest: one picture per item, none left over, each a transparent WebP that is 640 px on
  its longer side and under 80 kB.
- The parked items have no pictures (their drawings are deleted) and will need shots when the card section exists.

## Alternatives considered

- **A square canvas** (the first version): wide dishes looked small in their cards.
- **Keeping a drawing for each item without a shot**: a page would mix two styles; the owner chose to remove those items.
- **Hiding items with a flag**: a schema field and a selector for something the owner wanted gone.
- **Generated pictures** (an image model) for a shot that looks poor: invented labels, and food that is not this shop's. Possible per
  picture, if the owner chooses it.
- **Lanczos instead of a model**: softer labels and the same compression noise at four times the size.
- **A white key for the cut-out**: it eats white labels, caps, plates and cartons.
