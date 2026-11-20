# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hungry locals on their phones, deciding where and what to eat nearby. Their job is to decide quickly, check that the place is open, and then act: call, open directions, or walk in. There is no ordering on the site; the action happens off it.

Not confirmed as audiences: guests on a TV or in-venue screen, and resellers of the site as a template. The code still supports TV browsers (D-pad navigation, a lite motion tier), and that capability must keep working, but TV is not what the design optimises for.

## Product Purpose

A single-page marketing site for a fast-food place (pizza, hot dogs, sandwiches, drinks). It shows the menu with prices, sizes, add-ons and allergens, the opening hours with an "open now" indicator, and the ways to get in touch or find the place. Success is a phone visitor who reaches a call or directions action within seconds of arriving.

## Positioning

Undecided. The business is real (a fast-food place in Borča, Belgrade, open around the clock), but the owner has not named a differentiator, so none is confirmed. Design must not invent one, and must not depend on one.

## Operating Context

Static site on any static host: no backend, no accounts, no cart, no payments, no CMS, no analytics. All content lives in validated JSON files (`src/content`) and is edited by hand. Phones are the main device. The browser floor is Chromium 94, Safari 15 and Firefox 100.

## Capabilities and Constraints

- One page, sections in this order: hero, about, popular dishes, menu, follow (offers and phone), visit (address, hours, map), footer.
- Menu browsing by category with an item quick view (sizes, add-ons, allergens); static popular cards; every category is server-rendered so the page works without JavaScript.
- Opening hours are evaluated in the restaurant's time zone and shown as an "open now" chip.
- Exactly two interactive islands (mobile menu, menu browser); a third needs a documented reason (ADR 0001).
- Size budgets in gzip: HTML 30 kB, boot runtime 6.5 kB, GSAP and ScrollTrigger 48 kB, Lenis 6.5 kB, all JavaScript 85 kB.
- Out of scope unless asked: ordering, carts, accounts, payments, a CMS, analytics, a backend.
- Undecided product facts: the positioning and the page copy are placeholders, and the About text still carries claims nobody has confirmed (dough made daily, sauces cooked in small batches).

## Brand Commitments

Binding, from the reference reel the project reproduces:

- The section order and overall structure of the page.
- The Follow card's expansion: a pill-shaped card that widens to its full width while its corner radius eases out, with the art and text sliding out from its centre. It is the signature motion.

Not binding (free to change): the orange-on-warm-white palette, the three typefaces (Playfair Display, Plus Jakarta Sans, Caveat Brush), and the layout inside each section. The tagline and the page copy are placeholders.

## Evidence on Hand

- Generated SVG illustrations in `src/assets`: hero and section art. The 36 menu pictures are the product shots the owner supplied, enhanced and cut out by `scripts/menu-images` (ADR 0017); no stock photography.
- The real business details in `src/content/site.json` (address, phone, hours, Instagram, Facebook; the shop has no email, WhatsApp or TikTok) and placeholder page copy in `home.json`. The menu is the owner's printed one, cut to the 36 items that have a picture (in-store prices in RSD, ADR 0014 and 0017). Its descriptions and add-ons come from the shop's own Wolt and Glovo listings (ADR 0018); there is no allergen data yet.
- No photographs of the premises or the people, no logo, testimonials, reviews, awards, press, customer counts or social proof. Future work must not fabricate any of these.

## Product Principles

1. Phone first, thumb to action: the call and directions actions are always close at hand, and the page earns its first screen quickly.
2. Truthful by construction: placeholders read as placeholders, and nothing invents a claim about the business (hours, prices, awards, reviews). A price is shown only where the shop states one: the sauces show none, and nothing is called free.
3. The page is complete before any script runs. Motion and interaction only enhance it, and every failure path (no JavaScript, reduced motion, a dead island, a slow download) still leaves usable content.
4. The food and the actions are the subject. Effects must serve them and must not compete with the one signature motion.
5. One repo, one set of rules: the architecture, motion and accessibility rules in AGENTS.md and the ADRs win over any default a design skill suggests.

## Accessibility & Inclusion

WCAG 2.1 AA, checked by axe on every device profile. Reduced motion is honoured with no pre-hidden content. Keyboard focus is never removed or hidden (ADR 0003). Text stays readable on small phones, and TV D-pad navigation keeps working.
