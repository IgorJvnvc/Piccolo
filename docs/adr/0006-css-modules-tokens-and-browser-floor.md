# 0006. CSS Modules, design tokens and a Chromium 94 floor

Status: Accepted

## Context

Styles must be maintainable by many hands, scale from a phone to a 1920 px TV without a pile of one-off values, and run on
TV browsers that are years behind desktop Chrome.

## Decision

- **CSS Modules** for every component (private, hashed class names; no global leakage). No CSS-in-JS, no utility
  framework.
- **Design tokens** in `src/styles/tokens.css` for colours, radii, shadows, drop-shadow filters, easings and spacing.
  Components use `var(--...)` and never raw colour values.
- **rem scaling model**: all lengths are rem; at >= 1024 px the root font size is
  `clamp(87%, 1.1111vw, 280%)`, so 1 rem is 1/16 of the 1440 px artboard the layout was measured from. The design
  scales smoothly to desktop and TV sizes without per-device overrides.
- **Browser floor: Chromium 94 / Safari 15 / Firefox 100** (also the Vite build target). stylelint rejects newer
  features: `@layer`, `@container`, `@scope`, `:has()`, `:is()`, dynamic viewport units, `color-mix()`, individual
  transform properties, and **native nesting** (custom rule). `:is()` is avoided because of CSS Modules class hashing.
- Breakpoints are `640 / 768 / 1024 / 1440`, mirrored in TypeScript and verified by a unit test.

## Consequences

- Consistent look, one place to change a colour or shadow, and no surprises on old TVs.
- Newer CSS can still be used as an enhancement: write the older declaration first and justify the newer one with an
  explicit `stylelint-disable-next-line <rule> -- <reason>` (the hero uses `100vh` then `100svh` this way).
- Authors must write full selectors instead of nesting; the cost is some repetition in larger files.
- Adding a colour means adding a token first. The initial audit found six raw `rgb()` values in components; they became
  tokens with identical values (no visual change).
