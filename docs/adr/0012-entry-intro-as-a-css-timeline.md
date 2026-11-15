# 0012. The entry intro is a CSS timeline that the page waits for

Status: Accepted

## Context

The owner asked for a different first screen: a pizza spinning on the brand orange, stopping after 3 seconds, splitting into six
slices, each slice leaving the screen and pulling its triangle of orange with it, so that the landing page is uncovered. The page's
own animations must start only after the last slice has gone. It is not in the reel.

What shapes it:

- At first paint no script has run: the boot chunk and GSAP arrive later (ADR 0005), so an intro built on them would start late and
  flash the page. The hero's own load intro is already pure CSS for the same reason.
- The navbar, hero and dock animate on load with CSS keyframes and fixed delays. They would play behind the overlay unless they are told to wait.
- Reduced motion, no JavaScript and a failed runtime must still get the page at once (ADR 0003).
- The slices are big layers. A layer that starts moving without having been drawn costs a first-frame stall (ADR 0009).

## Decision

1. **A pure CSS timeline** in `sections/intro`, painted in the first frame. It animates `transform` and `opacity` only, on layers
   that exist from the start, so it stays smooth while the page hydrates. Six wedges, each a 64 degree orange triangle (4 degrees of
   overlap, so no hairline shows between neighbours) carrying one 60 degree `clip-path` sector of the same pizza image
   (`food/pizza-whole.svg`, which also serves the hero's small pizza). The spinning whole pizza is swapped for the six sectors in the
   same frame it stops, and the cuts drawn in the art line up with the sectors. Slices leave along their own direction, 60 ms apart; in
   portrait the whole arrangement turns 30 degrees so each slice has about as far to go.
2. **A gate**: a tiny ES5 script, first thing in `<body>`, sets `html[data-intro]`. It does nothing for reduced motion
   (`data-motion="static"`), forced colours, or `sessionStorage['piccolo:intro'] === 'seen'` (which only the test harness sets).
   Without the attribute the overlay is `display: none` and nothing waits: no JavaScript, no intro. A `#hash` in the URL is not a
   reason to skip: `anchors.behavior.ts` writes one whenever an in-page link is used, so a reload would lose the intro as soon as the
   visitor had clicked anything. When it plays, the gate also turns scroll restoration off and drops the `#hash`, so the page starts
   at its top and the intro ends on the landing page, not on whichever section the visitor had reloaded from or linked to.
3. **One clock instead of a handshake.** `--intro-wait` is `0s`; under `html[data-intro]` it is the whole intro (3 s + 0.4 s + 1.1 s + 5 x 60 ms).
   The 13 load-animation delays add it. Everything starts in the same frame, so the hero starts exactly when the last slice is
   gone, and there is no event to miss.
4. **The failsafe is the existing one.** `html.no-enhance` (ADR 0003, rule 5) hides the overlay and sets `--intro-wait: 0s`, so a dead
   runtime shows the page at once instead of after five seconds of orange.
5. **Every full load plays it** (the owner's choice), a reload included, except as in 2. No skip control and no scroll lock: the overlay blocks pointer
   events and `touch-action: none` stops touch scrolling, but a mouse wheel still scrolls the page underneath.

## Consequences

- The hero appears about 4.8 s after load, so a lab measurement of Largest Contentful Paint reads 5 to 6 s on a normal load.
  Visitors with reduced motion are unaffected. Playing it once per session would limit that to the first load; it is a three line change in the gate.
- **Every new load animation must add `var(--intro-wait)` to its delay**, or it plays behind the overlay. `data-intro` and the timeline
  tokens must not change after load: a changed delay re-times an animation that is already running.
- Two CSS facts cost time here. A timing function written inside `@keyframes` cannot take `var()` (it silently becomes `linear`), so the
  split is two animations. And a delay that is a sum of fractions of a second can leave an animation a rounding error short of its
  end, so a discrete `visibility` flip must be a stepped keyframe, not `to { visibility: hidden }`.
- Every spec runs with the intro marked as seen (`introSeen` in `tests/e2e/fixtures.ts`); `intro.spec.ts` turns it off, checks the
  pizza is 25 to 33 percent of the shorter side, and samples every frame to prove the hero never shows while any of the overlay does.

## Alternatives considered

- **A GSAP timeline**: it would start after first paint and its frames come from the main thread.
- **Pausing the page's animations and resuming them on `animationend`**: needs a failsafe timer and a copy of the duration in JavaScript,
  and a missed event leaves the hero hidden.
- **Hiding the intro for repeat visits (once per session)**: not wanted; every entry plays it.
