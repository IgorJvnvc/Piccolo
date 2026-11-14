# 0002. GSAP for scroll scenes, Motion for island UI

Status: Superseded by [0008](0008-one-engine-gsap-scenes-and-islands.md)

## Context

Two different kinds of motion exist. The reference's signature effects are **scroll-triggered, time-based timelines**
(staggered entrances; a card that morphs from a thin stadium to a wide rounded rectangle while art and text slide out
from its centre). The islands need **UI-state motion**: a shared-layout pill that glides between tabs, and dialogs that
animate in and out when mounted and unmounted.

## Decision

- **GSAP + ScrollTrigger** drive every scroll scene. They are loaded lazily, once, as a shared chunk, through
  `shared/motion/gsap.ts` (the only file allowed to import `gsap`). Scenes are position-triggered and play in time;
  they are never scrubbed, because the reference kept animating after the page stopped moving.
- **Motion** (`motion/react`, on Preact through `compat`) drives island UI: `layoutId` for the tab pill and
  `AnimatePresence` for dialogs, imported only via `shared/motion/motion-react.tsx`.
- **Lenis** provides the reference's decelerating scroll glide on fine-pointer laptops and desktops only, synced to GSAP's
  ticker so ScrollTrigger stays exact.
- Each engine has a single owner file; ESLint rejects imports anywhere else (static and dynamic).

## Consequences

- Each tool does what it is best at; scenes stay declarative timelines, island motion stays tied to component state.
- Cost: two animation engines. Motion's features chunk is the heaviest asset (about 34 kB gzip; ~53 kB with its core),
  because `layoutId` requires the `domMax` feature set. Replacing the pill with a CSS/GSAP transform would allow the
  smaller `domAnimation` set. Budgets in `.size-limit.json` catch regressions either way.
- GSAP is not loaded at all on the `static` tier (reduced motion).

## Alternatives considered

- **GSAP only**: would mean hand-building layout animation and presence handling in islands.
- **Motion only**: its scroll and timeline choreography is less suited to the multi-element timelines the reference uses.
- **CSS only**: cannot express the Follow card's coordinated width, radius and slide-out timeline cleanly.
