# 0013. The hero is lit art with an ambient layer, and art has a paint budget

Status: Accepted

## Context

The owner found the hero cheap: small flat food on a slab, a lot of empty ground, a low-contrast lead, and nothing that says
when the place is open or how to reach it. The scope became the whole site; for the hero the owner chose to keep the black slab
and the headline, make the food bigger, and add a row of facts, a ghost "Call us" button, a gentle pointer parallax and steam on
the hot food. The reel binds the slab, the headline and the motion of the hero (the reference spec); the additions are not in it.
After seeing it the owner dropped the facts row (it read as a footer) and the steam, and moved the slab up and a little left.

Three forces pull against each other:

- The art has to look cooked and lit, which means texture, and texture is vector elements.
- Every element is paint, and paint is what stalls the first frame of the scene that reveals the art (ADR 0009). The cards draw
  the same four illustrations 15 times, and the Follow card decodes its art in the frame it opens.
- DESIGN.md allows two moments on the page. Parallax is motion that no scroll triggers.

## What was measured

The first re-lit art (seeded flecks, mottled cheese, grill marks, blurred shade) turned the About cluster from 122 into 523
elements (28 KB) and gave seven illustrations a blur filter each. `scripts/dev/stall-lab.mjs` (cold Chrome, desktop, median of 5 to 6 runs):

| Build | About worst gap | Follow worst gap | Follow width step |
| --- | --- | --- | --- |
| Original art | 58 ms | 47 ms | 225 px |
| First re-lit art | 101 ms | 81 ms | 346 px |
| Final (below) | 58 ms | 42 ms | 207 px |

The Follow card's motion spec (first frame must be near the card center) failed in 2 of 2 desktop runs with the first re-lit
art, in 2 of 8 TV runs once the filters were gone but the texture stayed, in 0 of 8 with the original art and in 0 of 10 with the
final one. Swapping group `opacity` for per-child alpha, a hypothesis about off-screen layers, changed nothing and was dropped.

## Decision

1. **A paint budget for generated art** (`scripts/art`). No blur filters: soft shade is a gradient or a faint wider stroke; the
   slab keeps the one blur it always had. Texture (flecks, blisters, pores) is asked for in an amount and scaled by `withDetail`.
   Art that is drawn many times, small, or in the frame a scene starts gets none (`LIGHT = 0`: the gradients and highlights still
   light it): the food cutouts, the intro pizza, the About cluster and the Follow art. The four pieces on the hero are drawn once,
   large, at the top, so they keep the full texture and live in their own files (`hero/pizza`, `hotdog`, `sandwich`, `drink`).
2. **Pointer parallax** (`hero.behavior.ts`), on a fine pointer with hover and the `full` tier only. The behavior publishes the
   pointer as `--hero-x` and `--hero-y` (-1 to 1, lerped in one rAF loop, no GSAP); the stylesheet turns them into a
   `translate3d` on each `<img>` by its own depth (0.35 for the slab to 1.6 for the cup, at most 0.6 x 0.4 rem x depth), so the
   load animation on the `<picture>` and the drift do not fight. The transform and `will-change` exist only while the behavior
   has set `data-parallax`: touch, reduced motion and the TV pay nothing and promote no layers.
3. **The exception to the two-moments rule** is exactly this one: ambient, subtle, only on the `full` tier, and a second
   needs a new record. The Follow card stays the one big moment: it is far below the hero, so they are never in view together.
4. **Bytes**: deleting what nothing used (the Button's soft and large variants, the ten spacing tokens, `--r-sm`) paid for the
   Call us button and the parallax.

## Consequences

- The numbers come from a software rasteriser in headless Chrome. They rank builds; they say little in milliseconds on a real phone
  or TV. Re-check there.
- Two asset sets exist for one drawing (`food/*` light, `hero/*` full). A new dish illustration is generated light.
- `tests/e2e/intro.spec.ts` used to measure the intro pizza after `ready`, which worked only when the boot took longer than the
  0.5 s pop-in (it failed 2 of 8 runs at the original commit). It now waits for the pizza to finish growing.

## Alternatives considered

- **Parallax through GSAP**: the hero has to work before GSAP arrives (ADR 0005), and a CSS variable plus one rAF loop is 0.3 kB.
- **One asset set at a middle amount of texture**: the hero lost its detail and the cards still paid for it.
