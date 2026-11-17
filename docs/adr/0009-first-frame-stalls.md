# 0009. First-frame stalls: what was measured, and the two things adopted

Status: Accepted. Its finding that `will-change` hurts the quick view is superseded by [0016](0016-quick-view-on-a-real-phone.md): it came from software rendering, and on a real phone the layers are what makes the quick view smooth.

## Context

After [0008](0008-one-engine-gsap-scenes-and-islands.md) the motion was consistent but still hitched at the start of a scene or a
dialog: the first frame that draws something big takes tens to hundreds of milliseconds, and GSAP's clock keeps running through
it. Its lag smoothing only starts at 500 ms, so a 300 ms hitch is charged in full to the animation that begins in it, and a
450 ms fade first shows at 90%. Traces taken earlier put every stall over 40 ms in the GPU process (layer creation, raster,
upload), not in JavaScript (the longest main-thread task is about 10 ms).

The levers were measured with `scripts/dev/stall-lab.mjs`. Every run starts a **new** headless Chrome, because a visitor's first
page view starts a cold GPU process and compiles shaders, and a warm browser shows almost no stalls. Variants are injected after
load (CSS or JavaScript), so a hypothesis needs no rebuild; they are interleaved, and each cell is the median of 4 or 5 runs.
Headless Chrome here is software-rendered, so the absolute numbers are higher than on a GPU: only the comparisons mean anything.

## What was measured

Worst gap between two frames in the first 700 ms of a scene (ms), desktop 1253 x 712 / phone 390 x 844 at 2x:

| Variant | About | Popular | Visit | Quick view |
| --- | --- | --- | --- | --- |
| nothing | 93 / 105 | 61 / 58 | 62 / 77 | 77 / 161 |
| `will-change` on every reveal target | 67 / 40 | 73 / 101 | 59 / 57 | 98 / 162 |
| box shadows off | 118 / 77 | 19 / 24 | 31 / 75 | 42 / 81 |

- **`will-change` on everything** helps the About cluster and hurts the cards and the quick view: more layers to create at once.
- **`will-change` on the About cluster alone**: on a phone its worst gap falls from 70 to 29 ms (94 to 31 in the final build), on
  the TV nothing changes (52 to 51), and on desktop the final build reads 138 to 120 ms, which is within the noise. The cluster
  is the one large layer (an image with a drop shadow).
- **Decoding images before the scroll** did nothing (Popular 58 to 89 ms on desktop).
- **Drop-shadow filters off** changed little; **backdrop blur off** took the quick view from 76 to 50 ms (the lite tier already
  does that).
- **Box shadows off** is the biggest single effect on cards, Visit and the quick view. They are the design, and a software
  rasteriser blurs them on the CPU where a GPU draws them analytically, so this number is probably the most exaggerated.
- **Lag smoothing at 60 ms** does not shorten a stall; it stops the animation from skipping the part the stall covered. The biggest
  change of the animated value between two frames (percentage points of opacity) falls on a phone from 55 to 23 for the quick
  view, from 29 to 16 for Popular and from 26 to 16 for About, and the quick view's fade is drawn in 9 frames instead of 3. On the
  TV, Popular goes from 43 to 18 points and Follow's width step from 572 to 374 px.

## Decision

1. **`will-change: transform, opacity` on the About cluster**, where the scenes run (`full` and `lite` tiers), and nowhere else.
2. **`gsap.ticker.lagSmoothing(60, 33)`**, set where GSAP loads (`LAG_SMOOTHING` in `shared/motion/gsap.ts`). Smooth scroll turns lag
   smoothing off while it runs, because Lenis needs real time, and puts the same constant back on teardown.
3. **Nothing else.** Blanket `will-change`, image decoding ahead of time and removing filters or shadows either did not help or
   changed the design.

## Consequences

- The cluster's layer lives as long as the page: roughly 1 to 3 MB of GPU memory on a 2x phone.
- A frame later than 60 ms now counts as 33 ms of animation time, so a hitch delays an animation by its length instead of skipping
  it. On a device that cannot hold 17 frames a second everything runs slower than real time, which is the intended way to degrade.
- With Lenis (desktop with a fine pointer) lag smoothing is off, so a hitch there still skips part of an animation. The island
  specs allow for that (`record()` in `tests/e2e/islands.spec.ts`).
- The ranking of the levers comes from a software rasteriser. It should be re-checked on a real phone and a real TV, first with the
  box shadows, which were the largest effect and were not changed.

## Alternatives considered

- **Starting a tween after its first painted frame**: the stalls happen in the frames after the first one, so it would not move them.
- **Pre-rastering by flashing a layer at 1% opacity**: it works on paper, flashes on a slow device, and needs a hook per scene.
- **Lag smoothing for the island tweens only**: GSAP has one ticker, so it cannot be set per tween.
