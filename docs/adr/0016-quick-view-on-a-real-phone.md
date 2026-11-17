# 0016. The quick view on a real phone: its own layers, and a state that does not re-render the menu

Status: Accepted. Supersedes the quick-view finding of [0009](0009-first-frame-stalls.md) (what `will-change` does there).

## Context

The owner found the quick view choppy on an Android phone (a OnePlus CPH2621, Android 14, Chrome 157, 1080 x 2400 at 3x, 60 Hz).
Two rounds of work, measured in headless software-rendered Chrome at 390 x 844 at 2x, had not fixed it: shorter timings, then
no blur and no shadows on phones. That browser cannot see a GPU cost, so this time the phone was the instrument:
`scripts/dev/device-trace.mjs` serves a build to it over `adb reverse`, taps a card with a real touch event and records the main
thread (long animation frames), the frames the screen actually presented (SurfaceFlinger's record of Chrome's surface) and,
on request, a Chrome trace. Builds and hypotheses are interleaved, run after run, because the phone drifts between sessions.

## What was measured

Medians of 5 to 8 interleaved runs per session, in the 700 ms after the tap (the animation is 0.2 to 0.42 s long). The phone drifts
between sessions (warm or cold GPU, thermal state), so only builds measured in the same session are compared; the ranges are the sessions:

| Build | frames presented | gaps over 20 ms | worst gap |
| --- | --- | --- | --- |
| before any of this | 11 to 25 | 6.5 to 12 | 34 to 167 ms |
| shorter timings, no blur and shadows | 15 to 16 | 7 to 9.5 | 50 to 125 ms |
| **own layers + host split (this ADR)** | **24 to 25** | **0 to 1.5** | **17 to 125 ms (the first frame only)** |

- **The main thread was never the problem**: no task over 15 ms. The GPU process was: 172 raster tasks in 900 ms, and the root
  layer (1080 x 1993) repainted nearly every frame. The scrim's opacity, the panel and the dish were not on layers of their
  own, so GSAP's per-frame changes were painted into the root layer, and the phone's GPU re-rasterised the whole screen every
  frame. That holds the pipeline at a 30 fps cadence.
- Neutralising each animated part with CSS (flat panel, flat dish, flat scrim, all three) changed nothing: the cost was the
  re-raster, not the animation. **`will-change` on all three parts** took the gaps over 20 ms from 9 to 0 to 1 and raster tasks from 172
  to 49 to 61. The scrim and the panel together are not enough (7 gaps); the dish needs its own layer as well.
- With the layers, the panel's shadow, the dish's drop shadow and the backdrop blur cost nothing measurable on the phone (put
  back by injected CSS: still 0 gaps). The phone-only removals from the first round were dropped. (That block also sat above
  the base rules in the file, so its panel and dish parts never applied.)
- The click handler fell from 47 to 24 ms once the dialog's state left `MenuBrowser`: it had re-rendered all 71 cards in the
  click that opens the dialog.

## Decision

1. **`will-change` on the three animated parts** in `quick-view.module.css`: `.overlay` (`opacity`), `.panel` (`transform,
   opacity`), `.image` (`transform`). The dialog is in the DOM only while it is open, so the layers exist only then. This
   reverses 0009's "will-change hurts the quick view": that came from software rendering, where a layer is CPU work.
2. **`QuickViewHost` owns the dialog's state** (`detailId`, `opener`, the `menu:details` subscription and the portal), so opening
   and closing re-renders the dialog and nothing else.
3. **Shorter motion**, everywhere: scrim 0.25 to 0.2 s, panel 0.45 to 0.32 s (rise 32 to 24 px, on exit 24 to 16), dish in 0.55
   to 0.42 s, dish out 0.4 to 0.28 s.
4. **`scripts/dev/device-trace.mjs`** stays, with its hypotheses (`label=dist+variant`), for the next time something looks rough.

## Consequences

- While the dialog is open it holds three layers: the scrim is a flat colour, the panel about 1.6 megapixels at 3x, the dish
  small. At rest the text and the dish stayed sharp on the phone (screenshot checked).
- **One stall per open can remain**: in some sessions the first frame takes 34 to 167 ms (in the trace the longest raster task, about
  65 ms, is the new panel layer), and everything after it runs at 60 fps; in the last session it did not show (worst gap 17 ms), so
  hiding the shadow, the dish, the glow or the body one at a time could not separate them, and the cause is not pinned down. If it
  ever matters, warm the layers before the tap (mount the dialog on `pointerdown`, play it on `click`).
- `islands.spec.ts` asserts the three `will-change` values and `quick-view-host.spec.ts` that opening and closing renders no
  card again; each fails when its fix is removed.
- A leftover `astro preview` on port 4321 (an interrupted run) is reused by Playwright (`reuseExistingServer`), which then
  skips the rebuild and tests the old `dist`. A planted violation that does not fail may be exactly that.

## Alternatives considered

- **CSS transitions on a `data-state` attribute instead of GSAP** (compositor-driven, the clock waits for the first frame,
  reopening mid-exit reverses by itself): planned, then not needed. The layers alone reached 60 fps on the phone, and the rewrite
  would have cost a second animation path.
- **Dropping the blur, shadows and the panel's scale on phones**: measured, no effect once the layers exist.