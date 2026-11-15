# Piccolo: Reference Spec (from the reel recording)

Status: the measurement record the site was built from. It is implemented; where the build deliberately differs, the ADRs say why.
Source: `C:\Users\ijovanovic\Videos\2026-11-13 16-40-16.mp4` (OBS capture of the Instagram reel).
Evidence: `reference/frames/` keeps the five key frames the layout baseline was matched against (see the evidence index at the end).

## 1. Source and measurement basis

- Video: 8.2 s, 1280x720, 30 fps, H.264, 246 frames (audio ignored). It is one scroll-through of a single-page landing for a concept brand called "SAKURA" (sushi, pizza, burger).
- Page area inside the frame: x 11..1263, y 3..714, which is **1253 x 712 px**. The rest is window border. This is the **reference viewport**.
- All pixel values below are video px at that viewport unless marked "1440". Accuracy: positions and sizes about +/-3 px, colors a few levels (video compression), fonts are best guesses.
- **Likely source artboard: 1440 px wide (unverified).** Multiplying by 1.149 turns the measurements into round numbers (cards 300 px, gap 32, newsletter card 1100x280, radius 32, section h2 48). The "1440" column below uses that scale. Validate by visual diff at build time.

## 2. Decisions (confirmed by the owner)

| Topic | Decision |
|---|---|
| Scope | Marketing only: one landing page. No orders, login, admin or backend. |
| Ordering elements in the reel | Replace with marketing equivalents: nav Menu / Offers / Find Us / Contact; hero CTA "View Menu" (or "Call Now"); card bag button becomes "Details"; the newsletter card becomes a Follow us / Call / WhatsApp card that keeps the same expand animation; payment logos become social links. |
| Hero art | Same composition: Piccolo items (pizza slice, hot dog, sandwich, drink) on a dark slab, plus a diagonal steel fork and knife in place of the chopsticks, and a small whole pizza in place of the inline badge before "Fast Food". The Follow card holds its pizza slice on a fork instead of chopsticks. |
| Navbar | Same look at the top, but it reappears on scroll-up (the reel's navbar scrolls away and never returns). |
| Languages / TV | English only. TV means "looks great in a TV browser" (large type, safe margins, arrow-key/remote navigation, lighter animation tier). |

Proposed, not yet confirmed: the reel's Search field and bag icon (drop, or replace with a phone / "Open now" indicator); rewritten copy; the extrapolated sections in section 8.

## 3. Page structure (top to bottom)

1. Navbar (static in the reel)
2. Hero ("Enjoy Delicious Fast Food")
3. About ("We Provide Healthy food")
4. Popular Dishes (3 cards)
5. Newsletter card (dark, expands on scroll)
6. Footer

## 4. Layout

### Navbar
| Property | Reel px | 1440 |
|---|---|---|
| Container x range | 130..1145 (1015 wide, 81%) | about 1170 |
| Side padding | about 119 (9.5%) | about 137 |
| Row center y | 55 | about 63 |
| Left links | "Menu" (orange, short orange underline), "Offer", "Order Track"; x 131 / 210 / 288; about 13 px, medium | about 15 |
| Logo | "SAKURA", bold sans, 94 px wide, 15 px cap height, centered; subtitle in tracked uppercase orange (about 6 px), x 566..712 | |
| Right | underlined "Search" field with magnifier (x 955..1083) and a bag icon (x about 1132) with an orange dot 10x12 | |

### Hero (full viewport)
| Property | Reel px | 1440 |
|---|---|---|
| h1 | "Enjoy Delicious / Fast Food", Playfair Display, about 59 px, line pitch 63, left x 131, block y 208..313 | about 68 / 72 |
| Inline badge | dark disc with orange center and two gold ticks, 46 px, before "Fast Food" (static) | about 53 |
| Subtext | 2 lines, about 12 px light gray sans, x 131..470 | about 14 |
| CTA | orange pill 149x37 (x 134..282, y 410..446), white 14 px label plus arrow, soft orange glow | about 171x43 |
| Scroll indicator | dark circle 42 px (center 540.5, 397) with a rotating text ring about 78 px | about 48 / 90 |
| Chopsticks | gold, from the top-right corner to the tip at (754, 318), bbox x 754..1262, y 40..340 | |
| Slab | dark rectangle in perspective, bbox x 810..1264+ (bleeds off right), y 246..514, carrying pizza slice, nigiri, cheeseburger | |
| Background | white with a peach radial glow centered about (1000, 150), `#FEEBE2` fading to `#FEF9F8` | |

### About
| Property | Reel px | 1440 |
|---|---|---|
| Left column | food cluster (burger, panini, pizza slice, basil, sauce drops) x 120..530, y 195..445; a pale-gold contour-line circle (about 150 px) behind its top-left; peach glow | |
| Right column | starts x 783 (62% of width) | about 887 |
| Script label | "About us", orange brush script, about 22 px | about 25 |
| h2 | "We Provide / Healthy food", Playfair, about 44 px, line pitch about 58, bbox x 783..1049, y 221..321; inline red target icon (about 22 px) after "Provide" | about 50 / 67 |
| Paragraph | 3 lines, about 11 to 12 px light gray, x 780..1170 | about 13 to 14 |
| CTA | orange circle 44 px with white play triangle (center 806, 465) plus orange "Explore More" label (12 px) | about 50 |

### Popular Dishes
| Property | Reel px | 1440 |
|---|---|---|
| h2 | "Popular Dishes", Playfair, about 42 px, centered, x 498..782 | about 48 |
| Cards | 3 white cards `#FEFEFE`, 262 wide x about 315 tall, gap 28 (x 218..480 / 508..770 / 797..1058, total 842 = 67% of width), radius about 16, very faint shadow | 300 x 362, gap 32, radius about 18 |
| Heading to cards gap | about 48 | about 55 |
| Card content | centered cutout (about 160 px tall); title Playfair about 16 px semibold, left, 18 px padding; 2-line description about 10 px gray with ellipsis; price "240.00" orange bold about 13 px (no currency symbol); square 24 px outlined icon button bottom-right | |

### Newsletter
| Property | Reel px | 1440 |
|---|---|---|
| Card | `#271B25`, 954 x 244 (76% of width), centered at x 638, radius about 28, large soft shadow | about 1100 x 280, radius 32 |
| Left art | salmon nigiri, lemon, basil, chopsticks bleeding off the card's left edge; x 162..420 | |
| Right block | starts x 710: script label (orange, about 22 px); h2 "Subscribe for / Offer Updates" white Playfair about 32 px (line pitch 38) | about 25 / 37 |
| Input pill | cream pill 340 x about 42 (x 710..1050) with an orange button 115 x 30 overlapping its right end, light ring around the button | about 391 x 48 |
| Detail | tiny orange sparkle mark at the card's top-right inner corner | |

### Footer
- White, thin top divider. Four columns, text left edges at x 160 / 444 / 659 / 893: logo (20 px bold sans) plus 3-line blurb | "Main Menu" (About, Menus, Events, Offer) | "Information" (Contact, Order & Returns, Videos, Reservation) | "Address" (2-line address plus bold hours "9:00AM - 11:00PM").
- Headings about 13 px bold; links about 12 px light gray.
- Bottom bar (divider at y about 638): 4 round 27 px social icons (first filled orange, others light gray) at x 112..248; centered copyright (about 10 px gray); right-aligned payment logos (Stripe, Visa, PayPal, Mastercard).

## 5. Design tokens (measured; true values are slightly darker where text is thin)

| Token | Value |
|---|---|
| Accent orange | about `#FB6917` (CTA fill), gradient to about `#E8731E` on the newsletter button |
| Peach glow | `#FEEBE2` |
| Page background | about `#FDFAFB` (effectively white, warm tint); card white `#FEFEFE` |
| Dark card | `#271B25` |
| Ink (headings) | about `#2F2E30` or darker (neutral charcoal) |
| Body gray | about `#9A9A9A` (visual) |
| Heading font | Playfair Display (h1, h2, card titles, newsletter heading) |
| Script font | brush script for "About us" and "Newsletter" (Caveat Brush is the closest guess) |
| UI/body font | geometric sans (Urbanist or Plus Jakarta Sans-like; best guess) |
| Radii | cards about 16; newsletter card about 28; buttons fully round |
| Shadows | CTA: soft orange glow below; newsletter card: large soft dark shadow; dish cards: very faint |

## 6. Motion inventory (measured at 30 fps; t = seconds from recording start)

| Element | Trigger | Timing | Behavior |
|---|---|---|---|
| Navbar + logo | load | 0.27 to 0.65 | slide down 22 px and fade in, ease-out |
| Chopsticks | load | 0.55 to 1.2 | slide in about 150 px from top-right, ease-out |
| h1 | load | 0.5 to 0.9 | fade in |
| Subtext | load | 0.7 to 1.2 | fade in |
| CTA | load | 0.85 to 1.35 | rises 16 px and fades in |
| Slab | load | 0.85 to 1.6 | appears and slides left about 76 px (x 886 to 810), exponential-style decay |
| Scroll indicator | load | 1.05 to 1.5 | fades in; the text ring then rotates continuously at about 10 deg/s (about 34 s per turn). The inline badge in the h1 does not rotate. |
| Food on slab | load | 1.1 to 1.8 | pizza and sushi 1.1 to 1.5, burger 1.3 to 1.7; staggered about 0.1 to 0.2 s |
| About | scroll (enter) | about 2.6 to 3.6 | food cluster enters from the bottom-left; then label, heading, paragraph, CTA fade up about 0.2 s apart |
| Dish cards | scroll (enter) | starts 4.13 / 4.40 / 4.73 | each rises at least 100 px and fades in over about 0.6 s; stagger about 0.3 s; ease-out |
| Newsletter card | scroll: starts when the card top reaches about 70% of viewport height | 5.83 to 6.6 | width 16 to 954 px (height constant 244) and radius pill to 28 px over about 0.8 s; width curve fits `power4.out` / `expo.out`; contents fade in as it opens. Before the trigger it sits as a thin 16 px vertical dark pill. |
| Footer | n/a | n/a | no animation seen |
| Scrolling | user | n/a | decelerating glide after each wheel step (browser smoothing or a smooth-scroll library; cannot tell) |

Newsletter width samples (s: px): 5.87: 350, 5.93: 574, 6.00: 714, 6.07: 798, 6.13: 862, 6.20: 906, 6.27: 926, 6.33: 938, 6.40: 944, 6.53: 952, 6.60: 954.

Engine mapping (proposal): load intro = one GSAP timeline; scroll reveals = GSAP ScrollTrigger (once); newsletter expansion = GSAP ScrollTrigger animating `width` or `clip-path: inset(...)` with border-radius; Motion is not used by anything in the reel; the state-driven UI in the extrapolated parts (mobile menu, menu tabs, quick view) is animated with GSAP as well, through the island hooks (see [ADR 0008](adr/0008-one-engine-gsap-scenes-and-islands.md)); the Motion library first proposed for it was dropped.

## 7. Piccolo adaptation map

| Reel element | Piccolo |
|---|---|
| "SAKURA / Fine dining & restaurant" | "PICCOLO" + tagline (e.g. pizza, hot dogs, sandwiches & drinks) |
| Nav: Menu / Offer / Order Track | Menu / Offers / Find Us / Contact |
| Search + bag icon | proposed: removed, or phone / "Open now" indicator |
| "Order Now" | "View Menu" (primary), "Call Now" (secondary option) |
| Chopsticks + black slab with pizza, sushi, burger | dark slab with Piccolo items (pizza slice, hot dog, sandwich, drink) + a diagonal steel fork and knife |
| About: burger / panini / pizza cluster | Piccolo cluster; keep the gold contour circle and peach glow |
| Popular Dishes (3 cards, bag button) | Popular picks (3 cards, "Details" button) |
| Newsletter card | Follow us / Call / WhatsApp card, same expand animation |
| Footer address, hours, payment logos | real Piccolo address and hours; payment logos become social links |

## 8. Sections not in the reel (design extrapolation, needs approval)

- Full **Menu** with four categories (Pizza, Hot dogs, Sandwiches, Drinks): tabs plus card grid in the same card style, placed after Popular picks.
- **Location / hours / contact** block (the reel only has the footer column).
- Other breakpoints: the reel is one 1253 px viewport. Proposed rules: <768 stacks the hero (text first, art below) and makes the card row a horizontal snap-scroller; 768 to 1023 keeps two columns with smaller type; >=1920 and TV scale up with larger type and safe margins; the newsletter card expands to full container width on every size.

## 9. Assets needed from the owner

Piccolo logo (SVG); product photos or transparent cutouts: pizza, hot dog, sandwich, drink; a hero slab composition and diagonal prop; the real menu (items, sizes, prices, allergens); address, hours, phone, WhatsApp and social links. Until then: placeholders.

## 10. Open items and limits

- Fonts are best guesses from a compressed video; confirm or supply the real ones.
- Hover, focus and pressed states, mobile and tablet layouts, and any code are not visible in the reel.
- Whether the scroll glide is a library or browser smoothing is unknown.
- Visual match target: visually indistinguishable at the reference viewport, checked by overlay against the extracted frames (not byte-identical).

## 11. Evidence index

- Kept in `reference/frames/` (full 1280x720, the frames `scripts/dev/match_frames.py` compares against): `k_2.5` hero, `k_3.7` about, `k_5.6` popular, `k_7.6` follow, `k_8.1` footer.
- Removed once the measurements above were taken (still in git history): the other ten key frames, the contact sheets (`sheet_*`, 2 fps and three bursts) and the typography crops (`z_nav`, `z_hero_text`, `z_newsletter`).
