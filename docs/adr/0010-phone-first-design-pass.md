# 0010. A phone-first pass on the visual system, not a new one

Status: Accepted

## Context

[PRODUCT.md](../../PRODUCT.md) names the visitor: a hungry local on a phone who decides quickly, checks that the place is open
and then calls, messages or goes. The reel binds two things (the section order and the Follow card morph); the palette,
typefaces and the layout inside a section are free. A critique of the live renders (recorded in [DESIGN.md](../../DESIGN.md))
found a competent but template-like page whose phone view was a stacked desktop artboard:

- white text on the orange gradient at 2.6:1, text at 8 to 12 px, a 28 px details target;
- 362 px cards in one column (the page was 6,900 px tall, 39% of it the menu);
- no persistent way to act, and the open status hidden below 1024 px;
- decorative script kickers and 01 to 04 numerals that carry nothing.

The user chose to evolve the current world rather than replace it.

## Decision

- **One contrast token.** `--c-on-accent` is the dark ink: 6.5:1 on the light stop of the orange and 4.95:1 on the dark one.
  White on orange is not used.
- **Phone first, then everyone.** Below 768 px the Menu's dishes are compact rows (`MenuCard variant="row"`), and the whole
  card is the hit area on every screen. Below 1024 px a fixed action dock carries the live status and Call, WhatsApp and
  Directions. The dock is static markup that reuses the `open-status` behavior, not a third island ([ADR 0001](0001-static-astro-with-two-islands.md)).
- **Legibility floor.** Functional text is at least 11 px at every root size, buttons are at least 44 px high, numbers are tabular.
- **Voice.** The kicker above the Menu and Visit headings and the mobile menu numerals are gone. About and Follow keep the reel's
  own kicker, because the reel binds them; no new ones.
- **Effects.** CSS first, opacity and transform only, nothing scroll-linked, nothing new to download. Beyond the Follow morph the
  page has one authored interaction, the quick view's dish stepping out of the card it was tapped on (a transform tween in the
  existing GSAP kit), plus small CSS feedback: press, the navbar underline's hand-off, the hero lines, the call ping, the dock's
  arrival. Reduced motion and no JavaScript keep the end state.

## Consequences

- The reference layout test is untouched: every change either lives below 1024 px or keeps the measured boxes.
- Orange surfaces now carry a dark label, a visible change of look that one token reverts.
- The first frame of the quick view now also moves an image. It is a transform, but it has not been profiled on a real phone
  (see [ADR 0009](0009-first-frame-stalls.md) and `scripts/dev/stall-lab.mjs`).
- Still open: sizes and allergens exist only in the JavaScript dialog, so a visitor without it sees neither; the quick view is a
  centred modal rather than a bottom sheet on phones; the Follow and Visit sections link twice to the same target.

## Alternatives

- **Replace the visual world** through a direction round. Larger payoff, much larger effort, and it would re-baseline the
  layout test section by section. Rejected for now by the user.
- **White on a deeper orange (#c7510d, 4.55:1).** Keeps the white label but loses the vivid orange the rest of the page uses.
- **Hide the dock on scroll like the navbar.** An action bar that is sometimes gone defeats its purpose.
- **Pointer tilt, magnetic buttons, scroll-linked parallax.** Costly on phones, against the scenes' time-based rule (ADR 0008).