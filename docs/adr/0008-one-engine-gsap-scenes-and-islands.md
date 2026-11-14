# 0008. One animation engine: GSAP for scenes and islands, on a shared motion kit

Status: Accepted. Supersedes [0002](0002-gsap-for-scenes-motion-for-islands.md).

## Context

[0002](0002-gsap-for-scenes-motion-for-islands.md) split the work between two engines: GSAP for scroll scenes and Motion
for the islands. A review of the motion layer, whose timings had been measured from the reel but whose code had grown by
copy-and-paste, found these problems:

- **Five scenes hand-rolled the same plumbing** (a ScrollTrigger timeline, fade-up tweens, clean-up) with pixel distances
  written inline: the About cluster travelled 90 px, the Popular cards 110 px. The layout scales with the root font size
  above 1024 px (13.9 px at the reference's 1253 px width, 21.3 px at 1920 px), but the distances did not, so on a wide
  screen the layout was 53% larger while the entrances still travelled the same pixels.
- **The lite tier (TV, low-end) was applied by hand, scene by scene.** Durations were scaled, but each scene chose what else
  to scale: some delays were, no stagger ever was.
- **A scene that failed left its section hidden.** The scheduler logged the error and nothing else, so an exception (or a
  GSAP chunk that failed to download) left the section at the CSS pre-state, `opacity: 0`, until a reload.
- **Nothing tested the motion itself.** No end-to-end test sampled a frame in between, so nothing distinguished a scene
  that animates from one that snaps open.
- **Motion was the heaviest part of the JavaScript** (125.5 kB gzip in total) for a sliding pill and two dialogs. It needed
  its larger `domMax` feature set for `layoutId` alone.

## Decision

1. **GSAP animates everything; Motion is removed** (the dependency, `motion-react.tsx`, `motion-features.ts`, the Vite
   `noExternal` entry and the lint rule). `shared/motion/gsap.ts` remains the only file that imports `gsap`.
2. **Scenes share one kit.** `defineScene` (built on `createScene`) owns the GSAP context, the ScrollTrigger-linked
   play-once timeline with its shared defaults, resize re-measuring (`invalidateOnRefresh` with function-based values) and
   teardown. `shared/motion/tokens.ts` holds the reel-measured eases, durations, staggers and travel distances. Travel is in
   rem, so it scales with the layout. The lite tier travels half as far and runs the whole timeline, delays and staggers
   included, a third faster; that is defined once (`scaleFor`).
3. **A scene that cannot run recovers.** The scheduler calls the enhancement's `recover`, and the section opens instead of
   staying hidden.
4. **Islands describe their choreography in `*.motion.ts`**, plain functions of `(node, tools)`, and two hooks in
   `shared/motion/island.ts` run them: `useMotion` (GSAP when it is ready, otherwise `null`) and `usePresence` (a node that
   comes and goes, with an exit that can be interrupted). The mobile menu's circle is a CSS clip driven by custom properties
   (`--x`, `--y`, `--r`, switched on by `data-clip` only while it moves); the tab pill slides by tweening the new pill from
   the old one's position and width.
5. **GSAP is optional for the islands.** On the static tier (reduced motion) it is never downloaded. Without it, a dialog
   carries `data-presence="enter|exit"` and `base.css` fades it in `--dur-1` (0.18 s). Reduced-motion visitors keep that
   short, opacity-only fade on purpose, so the rule overrides the blanket "no animation" reset with `!important`.
6. **Motion is verified in a real browser, frame by frame.** The scene specs sample every frame and require intermediate
   frames, check that a resize does not corrupt a scene and that a blocked GSAP chunk still opens the section. The island
   specs sample the same way and also cover reduced motion and a blocked GSAP. Both were mutation-checked: planted
   regressions (closing from full size instead of from the size reached, no clip, the reduced-motion override removed, GSAP
   downloaded on the static tier, a skipped exit, a pill that does not slide) each make a spec fail.

## Consequences

- **JavaScript fell from 125.5 kB to 76.9 kB gzip** (39%), and the boot chunk from 6.8 kB to 5.7 kB. The budgets in
  `.size-limit.json` were tightened to match.
- A scene states only its choreography (Menu and Visit are fifteen lines each) and cannot forget the fail-safe, the tier
  scaling or the clean-up.
- The first tap on a phone before the GSAP chunk has arrived gets the CSS fade instead of the circle. GSAP starts
  downloading when the island hydrates (`useMotion`), so this is a slow-network corner, not the normal path.
- `base.css` and `usePresence` are coupled by the `data-presence` attribute. Unit and end-to-end tests cover each side.
- Motion on phones and TVs is no longer pixel-for-pixel what it was, because distances now follow the root font size:
  phones travel about 15% farther (16 px against the reference's 13.9 px), TVs about 50% farther, and a TV's staggers and
  delays now run a third faster too. Desktop at the reference width is unchanged.

## Alternatives considered

- **Keep Motion, but animate the pill with a transform** so the smaller `domAnimation` set suffices: still a second engine,
  and the scenes' problems would be unchanged.
- **CSS and the Web Animations API for the islands**: the sequencing (staggers, an exit that is interruptible and carries
  on from where it is) would have to be built by hand.
- **`@gsap/react` (`useGSAP`)**: imports GSAP statically, which would put it in the first bundle instead of a lazy chunk.
- **`gsap.matchMedia()` for reduced motion**: the scheduler's motion tiers already own that decision
  ([0005](0005-device-capabilities-and-motion-tiers.md)).
