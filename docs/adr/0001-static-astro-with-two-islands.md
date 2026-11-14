# 0001. Static Astro site with exactly two Preact islands

Status: Accepted

## Context

Piccolo is a marketing one-pager. It must be fast on weak phones and TVs, indexable by search engines, readable without
JavaScript, and cheap to host. There are no orders, accounts or server state. Only two things are genuinely interactive:
the mobile navigation and the menu browser (category tabs plus an item quick view).

## Decision

- Astro with `output: 'static'`. Everything renders to HTML at build time.
- Interactive UI is limited to **two Preact islands**: `MobileNav` (`client:media="(max-width: 1023px)"`, so desktops never
  download it) and `MenuBrowser` (`client:idle`).
- Everything else (scroll animation, smooth scroll, TV navigation, "open now") is a small vanilla *enhancement* run by a
  scheduler (see [0003](0003-progressive-enhancement-and-reveal-protocol.md)), not a component framework.
- The menu browser server-renders **every** category panel; the island turns them into tabs.

## Consequences

- Most of the page costs no hydration and works with JavaScript disabled or broken.
- Search engines and no-JS visitors get the whole menu.
- Preact 11 runs through `@astrojs/preact` with `compat`, which also lets Motion's React API work (see
  [0002](0002-gsap-for-scenes-motion-for-islands.md)).
- A third island needs a real reason; most new behaviour should be an enhancement on server-rendered markup.

## Alternatives considered

- **A client-side SPA / React**: far more JavaScript and hydration for a page that is mostly static.
- **No islands at all** (vanilla JS for tabs and dialogs): possible, but focus trapping, presence animations and shared
  layout transitions are exactly what a small component runtime is good at.
