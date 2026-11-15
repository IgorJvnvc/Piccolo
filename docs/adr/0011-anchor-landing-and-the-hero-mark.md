# 0011. Anchor jumps land where the stylesheet says, and nothing is current on the hero

Status: Accepted

## Context

Two things confused visitors on a laptop:

- The page opened with **Menu** underlined. The reel marks the first link at the top; here the first link is Menu, and a visitor
  on the hero is not in it.
- A jump to a section stopped short, so the section was not entirely on screen. Lenis 1.3 subtracts the page's
  `scroll-padding-top` and the target's `scroll-margin-top` by itself, and `anchors` also passed the padding as an offset, so it
  counted twice: 77 px too low at 1253 px wide, 100 px at 1920. Phones and tablets use the browser's scroll and were right.

## Decision

- No link is current until a section is. `aria-current` is the only mark (the stylesheet styles it); the first-link rule and
  `data-active` are gone.
- One source for where a jump lands: `scroll-padding-top` on `html` plus an optional `scroll-margin-top` on the section. Lenis reads
  both; the browser path in `controller.ts` adds both; there is no offset parameter.
- Two sections add their own margin, measured at laptop heights (1366 x 657, 1536 x 730): the Menu by -6rem from 1024 px (its
  heading lands just under the returning bar, 4.5rem, and the tabs and the first row of dishes fit), the Visit section by -3rem
  below 1024 px (more of the map shows above the dock).

## Consequences

- A jump lands one inset from the top, not two. `desktop.spec` (Lenis) and `mobile.spec` (browser scroll) assert the exact inset,
  and both tests failed when the old behaviour was put back.
- The test is also the tripwire for a Lenis upgrade: if it stops reading the CSS values, the landing moves.
- The reel's marked first link is deliberately not reproduced.
- Without JavaScript the browser's own `#hash` jump honours the same two properties.

## Alternatives

- **Pass `offset: 0` and measure the landing in `controller.ts`.** Duplicates what Lenis already does.
- **Mark the hero as current.** There is no hero link, and a mark on nothing is the same confusion.
- **A larger `scroll-padding-top` for everything.** The sections differ: the Menu is taller than a laptop screen, the Visit
  section is cut by the dock only on phones.
