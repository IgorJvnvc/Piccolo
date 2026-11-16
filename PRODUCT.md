# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hungry locals on their phones, deciding where and what to eat nearby. Their job is to decide quickly, check that the place is open, and then act: call, message on WhatsApp, open directions, or walk in. There is no ordering on the site; the action happens off it.

Not confirmed as audiences: guests on a TV or in-venue screen, and resellers of the site as a template. The code still supports TV browsers (D-pad navigation, a lite motion tier), and that capability must keep working, but TV is not what the design optimises for.

## Product Purpose

A single-page marketing site for a fast-food place (pizza, hot dogs, sandwiches, drinks). It shows the menu with prices, sizes and allergens, the opening hours with an "open now" indicator, and the ways to get in touch or find the place. Success is a phone visitor who reaches a call, WhatsApp or directions action within seconds of arriving.

## Positioning

Undecided. There is no real business behind the placeholders yet, so there is no confirmed differentiator. Design must not invent one, and must not depend on one.

## Operating Context

Static site on any static host: no backend, no accounts, no cart, no payments, no CMS, no analytics. All content lives in validated JSON files (`src/content`) and is edited by hand. Phones are the main device. The browser floor is Chromium 94, Safari 15 and Firefox 100.

## Capabilities and Constraints

- One page, sections in this order: hero, about, popular dishes, menu, follow (offers and phone), visit (address, hours, map), footer.
- Menu browsing by category with an item quick view; static popular cards; every category is server-rendered so the page works without JavaScript.
- Opening hours are evaluated in the restaurant's time zone and shown as an "open now" chip.
- Exactly two interactive islands (mobile menu, menu browser); a third needs a documented reason (ADR 0001).
- Size budgets in gzip: HTML 24 kB, boot runtime 6.5 kB, GSAP and ScrollTrigger 48 kB, Lenis 6.5 kB, all JavaScript 85 kB.
- Out of scope unless asked: ordering, carts, accounts, payments, a CMS, analytics, a backend.
- Undecided product facts: the business name, address, phone, hours, prices and positioning are all placeholders.

## Brand Commitments

Binding, from the reference reel the project reproduces:

- The section order and overall structure of the page.
- The Follow card's expansion: a pill-shaped card that widens to its full width while its corner radius eases out, with the art and text sliding out from its centre. It is the signature motion.

Not binding (free to change): the orange-on-warm-white palette, the three typefaces (Playfair Display, Plus Jakarta Sans, Caveat Brush), and the layout inside each section. The name "Piccolo", the tagline and all copy are placeholders.

## Evidence on Hand

- Generated SVG illustrations in `src/assets`: hero and section art, and one drawing for each of the 70 menu pictures (ADR 0015). The user chose to keep them as the imagery for now; no stock photography.
- Placeholder business content in `src/content/*.json`. The menu is the owner's printed one (71 items, prices in RSD, ADR 0014); it has no descriptions and no allergen data yet.
- No real photographs, logo, testimonials, reviews, awards, press, customer counts or social proof. Future work must not fabricate any of these.

## Product Principles

1. Phone first, thumb to action: the call, WhatsApp and directions actions are always close at hand, and the page earns its first screen quickly.
2. Truthful by construction: placeholders read as placeholders, and nothing invents a claim about the business (hours, prices, awards, reviews).
3. The page is complete before any script runs. Motion and interaction only enhance it, and every failure path (no JavaScript, reduced motion, a dead island, a slow download) still leaves usable content.
4. The food and the actions are the subject. Effects must serve them and must not compete with the one signature motion.
5. One repo, one set of rules: the architecture, motion and accessibility rules in AGENTS.md and the ADRs win over any default a design skill suggests.

## Accessibility & Inclusion

WCAG 2.1 AA, checked by axe on every device profile. Reduced motion is honoured with no pre-hidden content. Keyboard focus is never removed or hidden (ADR 0003). Text stays readable on small phones, and TV D-pad navigation keeps working.
