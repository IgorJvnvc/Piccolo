# Architecture decision records

Short records of the decisions that shape this codebase: what was decided, why, and what it costs. Add a new numbered
file when a decision would be expensive to reverse or surprising to a newcomer. Do not rewrite an accepted record;
supersede it with a new one.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-static-astro-with-two-islands.md) | Static Astro site with exactly two Preact islands | Accepted |
| [0002](0002-gsap-for-scenes-motion-for-islands.md) | GSAP for scroll scenes, Motion for island UI | Accepted |
| [0003](0003-progressive-enhancement-and-reveal-protocol.md) | Progressive enhancement and the reveal protocol (never toggle `visibility`) | Accepted |
| [0004](0004-layered-architecture-enforced-by-lint.md) | Layered architecture, enforced by lint | Accepted |
| [0005](0005-device-capabilities-and-motion-tiers.md) | Measured device capabilities and motion tiers | Accepted |
| [0006](0006-css-modules-tokens-and-browser-floor.md) | CSS Modules, design tokens and a Chromium 94 floor | Accepted |
| [0007](0007-content-collections-behind-ports.md) | Content as validated JSON behind repository ports | Accepted |

Format: **Context** (the forces), **Decision**, **Consequences** (good and bad), and **Alternatives** when they were
seriously considered.
