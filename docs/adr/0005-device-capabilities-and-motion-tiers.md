# 0005. Measured device capabilities and motion tiers

Status: Accepted

## Context

The page must feel right on a 6" phone, a laptop with a trackpad, a desktop, and a TV watched from a sofa with a
remote. User-agent sniffing alone is brittle; media queries alone cannot decide *behaviour* (smooth scroll, D-pad
navigation) and cannot run before first paint.

## Decision

- **Layout is pure CSS** (media queries and the rem model). Device class never changes layout.
- **Behaviour branches on measured capabilities**: `device` (phone, tablet, laptop, desktop, tv), `pointer`
  (fine, coarse, none), `hover`, `reducedMotion`, `saveData`, `lowEnd`, producing a **motion tier**: `full`, `lite`
  (TV, data saver, low-end hardware) or `static` (reduced motion).
- Classification is a **pure function** (`shared/device/classify.ts`), unit-testable without a browser.
- A **hand-written ES5 mirror** (`bootstrap.inline.js`) runs inline in `<head>` so `html[data-device]` and
  `html[data-motion]` exist before first paint (no layout flash) and on very old TV browsers.
- The **scheduler** re-evaluates enhancements whenever capabilities change (resize, reduced motion toggled).
- TVs get spatial **D-pad navigation** (`shared/focus/spatial.ts`, pure geometry) and larger focus rings and type.

## Consequences

- Two implementations of one rule will drift, so a unit test runs the real bootstrap script against `classify()` over
  about 29,000 combinations including every breakpoint boundary. The test was mutation-checked.
- Capabilities are measurements, not guesses: a touch laptop with a fine pointer is a laptop; a pointer-less 1920 px
  screen without a TV token is still treated as a TV.
- TV remote Back keys (Tizen 10009, webOS 461) are only reachable through the deprecated `keyCode`, so
  `shared/focus/spatial.ts` declares exactly that field on purpose.
