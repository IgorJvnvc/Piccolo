---
name: Piccolo
description: "A sunlit counter for a fast-food place: warm white, one orange heat, Playfair headlines and soft cut-out food."
colors:
  primary: "#fb6917"
  primary-hi: "#ff7d31"
  primary-lo: "#ed600f"
  primary-text: "#b8420a"
  primary-soft: "#feebe2"
  on-primary: "#271b25"
  red: "#e5342a"
  ok: "#1f9d55"
  bg: "#fdfafb"
  surface: "#fefefe"
  ink: "#232124"
  body: "#6a686f"
  faint: "#b4b1b3"
  line: "#efe9eb"
  cream: "#f1e8e4"
  dark: "#271b25"
  on-dark: "#ffffff"
  scrim: "rgb(35 33 36 / 0.45)"
  glass: "rgb(253 250 251 / 0.84)"
  press: "rgb(39 27 37 / 0.06)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "4rem"
    fontWeight: 500
    lineHeight: 1.125
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "2.3125rem"
    fontWeight: 600
    lineHeight: 1.19
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.25
  script:
    fontFamily: "Caveat Brush, cursive"
    fontSize: "1.5625rem"
    fontWeight: 400
    lineHeight: 1
  body-md:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.75
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1
  label-caps:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.08em"
  wordmark:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
rounded:
  md: "1rem"
  card: "1.125rem"
  xl: "2rem"
  pill: "62.5rem"
spacing:
  content-max: "90rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.75rem"
    height: "2.75rem"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.75rem"
    height: "2.75rem"
  tabs-track:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0.375rem"
  tab:
    textColor: "{colors.body}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "2.75rem"
  tab-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  menu-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "1.375rem 1.3125rem 1.5rem"
  menu-card-pressed:
    backgroundColor: "{colors.press}"
  menu-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "0.875rem 1rem 0.875rem 0.875rem"
  card-details-button:
    textColor: "{colors.body}"
    rounded: "{rounded.sm}"
    size: "1.75rem"
  card-details-button-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  tag-chip:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
  status-dot-open:
    backgroundColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    size: "0.5rem"
  status-dot-closed:
    backgroundColor: "{colors.faint}"
    rounded: "{rounded.pill}"
    size: "0.5rem"
  open-status:
    textColor: "{colors.body}"
  open-status-open:
    textColor: "{colors.ink}"
  action-dock:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "0.5rem 1.25rem"
  dock-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "2.75rem"
  dock-action-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    height: "2.75rem"
  navbar-shown:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    height: "4.5rem"
  follow-card:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.headline-sm}"
    rounded: "{rounded.xl}"
    height: "17.5rem"
    width: "68.5rem"
  follow-phone-pill:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "0 0 0 1.5rem"
    height: "3rem"
  follow-call-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "2.4rem"
  quick-view-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    width: "52rem"
  quick-view-scrim:
    backgroundColor: "{colors.scrim}"
  quick-view-size-row:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  social-icon:
    backgroundColor: "{colors.line}"
    textColor: "{colors.body}"
    rounded: "{rounded.pill}"
    size: "2.25rem"
  social-icon-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
---

# Design System: Piccolo

## Overview

**Creative North Star: "The Sunlit Counter"**

Piccolo is a clean, well-lit counter in a small place that cooks to order. The page is a warm white (#fdfafb) lit from above: plates sit on it and drop long, soft shadows straight down, and food is always a transparent cut-out, so a dish looks set on the surface instead of pasted into a box. Orange is the single source of heat: it fills the one thing to press on each surface, carries an aubergine label, and turns to a burnt-crust brown wherever it has to be read as text. Dark surfaces are rare and always slabs: the charcoal serving slab in the hero art, the aubergine Follow card and the aubergine phone menu.

The voice is editorial-casual rather than fast-food loud. High-contrast Playfair Display carries headlines and dish names, a round geometric sans (Plus Jakarta Sans) carries everything you read quickly or act on, and a brush script (Caveat Brush) is a rare handwritten aside. Density is low: section padding runs 3rem to 8rem and most sections hold one heading, one block of copy and one action or one grid. The layout copies a reference reel measured on a 1440px artboard, and it is phone first: below 1024px a fixed Action Dock keeps the open status, Call, WhatsApp and Directions under the thumb, dishes are compact rows, targets are 44px and everything tappable sinks while it is held.

Motion is quiet and out-curved. Every ease decelerates (quint, expo and quart out); hovers and lifts take 0.35s to 0.6s and are for fine pointers; each section reveals once, in time, as it reaches the viewport (about 0.7s, rising 1.75rem to 2rem). Two moments are choreographed. The first is the entry intro, added by the owner after the reel: a pizza spins on the brand orange, stops after 3s, splits into six slices, and each slice leaves along its own direction with its triangle of orange, uncovering the page, whose own animations begin only when the last slice is gone (about 4.8s, pure CSS; ADR 0012). The second is the Follow card, which widens from a thin stadium to a full plate while its corners relax. That expansion is a binding brand commitment (PRODUCT.md), so other effects must not compete with it; the few small authored effects around it are short and serve the action (the nav underline handed from link to link, the two hero lines rising one after the other, the dock sliding up, a ring leaving the Call-now pill, the quick view's dish stepping out of the card that was tapped). The orange-on-warm-white palette, the three typefaces and the layout inside each section are the incumbent system recorded here, not commitments. Imagery is generated SVG illustration by decision; there is no stock photography.

**Key Characteristics:**
- Warm white page and near-white plates (#fdfafb, #fefefe) separated by shadow, not by tone.
- Orange is the only saturated colour: a vertical gradient pill with an orange floor glow for the action and an aubergine label on it, burnt orange (#b8420a) wherever orange is text.
- Neutrals tinted toward plum, and one dark aubergine slate (#271b25).
- Playfair Display 500 and 600 for headlines, Plus Jakarta Sans for UI and body, Caveat Brush for asides.
- Stadiums for what you press, 1.125rem and 2rem plates for what holds content.
- Soft, tinted shadows with negative spread; 1px hairline rings instead of borders.
- Transparent cut-out food art grounded by drop-shadow filters.
- Phone first: a fixed Action Dock, compact dish rows, 44px targets and a press state on everything tappable.
- All lengths in rem; above 1024px the root scales with the viewport (1rem = 1/16 of a 1440px artboard).
- Two choreographed moments (the entry intro and the Follow card) and ease-out everywhere else.

## Colors

A warm-white page with one hot colour: orange for action, plum-tinted neutrals for everything else, and a dark aubergine slate for the few dark moments. The system is light only (the page declares `color-scheme: light`). Frontmatter keys drop the `--c-` prefix and key the orange family as `primary` (its custom property is `--c-accent`; the label colour on it, `on-primary`, is `--c-on-accent`); every other key matches its `--c-*` custom property in `src/styles/tokens.css`, the single place raw colours are allowed.

### Primary
- **Oven Orange** (#fb6917, `--c-accent`): the flat brand orange. Selection fill, nav underline, hover fills (details button, footer social icons, hero knob), the sparkle and the script line on the Follow card. Never text on a light surface (2.8:1 on the page).
- **Fresh-Baked Highlight** (#ff7d31, `--c-accent-hi`) and **Deep-Baked Orange** (#ed600f, `--c-accent-lo`): the top and bottom stops of the vertical gradient used by every orange-filled pill. The highlight is also the ring that leaves the Follow card's Call-now pill.
- **Burnt Crust** (#b8420a, `--c-accent-text`): every orange word on a light surface (prices, active nav link, "Explore More", tag chips, Visit icons, logo tagline, the script lines); 5.3:1 on the page and 4.8:1 on the peach glow.
- **Peach Glow** (#feebe2, `--c-accent-soft`): tag-chip fill. The same peach, as `--c-glow-1`, `--c-glow-2` and `--c-glow-3` at 100%, 55% and 0% alpha, washes the hero, the quick view's image pane and the 404 page; the About backdrop uses it too.
- **Aubergine Ink on Orange** (#271b25, `--c-on-accent`): the label and glyph on every orange fill, and the selection text. An alias of Aubergine Slate: 6.5:1 on the light gradient stop (#ff7d31), 5.6:1 on the flat orange and 4.95:1 on the dark stop (#ed600f).

### Tertiary
Spot and state colours, each used in one place. They are not a second accent.
- **Tomato Red** (#e5342a, `--c-red`): the target mark after "We Serve".
- **Open-Now Green** (#1f9d55, `--c-ok`): the status dot while the place is open (navbar, Visit card, dock).

### Neutral
- **Counter White** (#fdfafb, `--c-bg`): page background, the lower stop of the hero wash and the quick view's size rows.
- **Plate White** (#fefefe, `--c-surface`): cards and rows, the tab track, the quick view, the Visit card, the footer, the dock and the ghost button.
- **Charcoal Ink** (#232124, `--c-ink`): headings, nav links, dock labels, the hero knob, the skip link and the focus ring.
- **Smoke Grey** (#6a686f, `--c-body`): body copy, descriptions, inactive tabs, footer links; 5.3:1 on the page and 4.8:1 on the peach glow.
- **Ash** (#b4b1b3, `--c-faint`): the closed-status dot only.
- **Hairline Blush** (#efe9eb, `--c-line`): 1px rings and rules, footer social fills, the pressed fill of the menu toggle.
- **Flour Cream** (#f1e8e4, `--c-cream`): the phone pill on the Follow card and the map tile's bed.
- **Aubergine Slate** (#271b25, `--c-dark`): the Follow card and the phone menu, the pill's text on cream and, as `--c-on-accent`, the label on every orange fill.
- **White on Dark** (#ffffff, `--c-on-dark`): text and glyphs on aubergine and on ink: the Follow title, the phone menu, the hero knob's arrow and the skip link (16.5:1 on aubergine, 16.0:1 on ink).
- **Press Tint** (rgb(39 27 37 / 0.06), `--c-press`): the wash laid over a whole dish card or row while it is pressed.
- **Charcoal Scrim** (rgb(35 33 36 / 0.45), `--c-scrim`): the quick view's overlay.
- **Frosted Paper** (rgb(253 250 251 / 0.84), `--c-glass`): the navbar when it returns on scroll up.

### Named Rules
**The One Heat Rule.** Orange is the only saturated UI colour. It fills one action per surface, marks hover and selection, and in its darker text form carries prices, active links and small icons. Gold, red and green are single-use spot colours, never a second accent.

**The Burnt Crust Rule.** Orange text on a light surface is always `--c-accent-text`. The bright `--c-accent` is for fills, underlines, rings and text on aubergine (5.6:1).

**The Dark Label Rule.** Every label or glyph on an orange fill is aubergine (`--c-on-accent`, #271b25): 6.5:1 on #ff7d31 and 4.95:1 on #ed600f. White (`--c-on-dark`) belongs on ink and aubergine surfaces, never on orange.

**The Plum Tint Rule.** The greys lean toward plum (OKLCH hue 299 to 355 degrees) rather than neutral grey, and the dark slate is the same plum at low lightness (hue 332). Pure black appears only inside two drop-shadow filters.

## Typography

**Display Font:** Playfair Display (with Georgia, serif), weights 500 and 600
**Body Font:** Plus Jakarta Sans (with system-ui, sans-serif), weights 400 to 800
**Script Font:** Caveat Brush (with cursive), weight 400 only

**Character:** A high-contrast serif carries the voice, a round geometric sans carries everything you read fast or act on, and a brush script is a rare handwritten aside. Editorial and warm rather than loud. Fonts load through Astro's Fonts API from Google (Latin subset); the serif and the sans are preloaded, the script is not.

Sizes are rem. Below 1024px the root is 16px; above it the root scales with the viewport (see Layout), so every size grows and shrinks with it. The ramp below is the set of roles; the build also carries sizes off it: TV variants, icon sizes, the large button and the phone row title at 1.0625rem, the footer wordmark at 1.4375rem and the logo tagline (see Observations).

### Hierarchy
- **Display** (Playfair 500, 4rem, 1.125, -0.01em): the hero h1 and the 404 title from 1024px up. On phones it is clamp(2.75rem, 12vw, 4rem), 46.8px at 390px wide.
- **Headline** (Playfair 500, 3rem, 1.1, -0.01em): section titles (Popular Picks, Our Menu, Find Us), clamp(2rem, 8vw, 3rem) on phones. The About title runs 3.125rem at 1.32 leading with the same tracking.
- **Headline-sm** (Playfair 600, 2.3125rem, 1.19): the Follow card title, clamp(1.75rem, 7vw, 2.3125rem) on phones. The quick-view title is 2rem at 1.15, also 600.
- **Title** (Playfair 600, 1.1875rem, 1.25): dish names on menu cards; 1.0625rem on the phone rows.
- **Script** (Caveat Brush 400, 1.5625rem, 1): the handwritten aside. Today it is the line above the About and Follow headings (the reel's own, see Observations), the category blurb under the menu tabs (1.375rem, burnt crust, centred) and the 404 code (1.75rem).
- **Body-md** (Plus Jakarta Sans 400, 0.9375rem, 1.7): menu intro, Visit text and quick-view description, in smoke grey. Paragraphs are capped by max-widths of 24.5rem to 30rem.
- **Body-sm** (400, 0.875rem, 1.75): hero copy (1.75 leading), About copy (1.85), footer links, opening-hours rows, and the phone number on the Follow card (500).
- **Caption** (400, 0.8125rem, 1.6): dish descriptions on cards and rows (clamped to two lines), the allergen line, the open or closed status (600) and the footer blurb.
- **Label** (600, 0.9375rem, line-height 1): buttons and menu tabs (0.875rem on phones); nav links are 500 and prices 700 at the same size, and the dock actions are 700 at 0.875rem.
- **Label-caps** (700, 0.6875rem, 0.08em, uppercase): the tag chips. The badge on a dish card or row is max(0.6875rem, 11px), so it never drops below 11px; the quick view's chip is plain 0.6875rem.
- **Wordmark** (Plus Jakarta Sans 800, 1.5rem, 0.01em, uppercase): the PICCOLO logotype, 1.4375rem in the footer.

### Named Rules
**The Serif Voice Rule.** Playfair names things (headings, dish names, the phone menu's links); Plus Jakarta Sans does things (buttons, tabs, prices, hours, body copy); Caveat Brush only comments.

**The Weight Step Rule.** Playfair is 500 at page and section level and 600 inside a contained surface (menu card, quick view, the dark Follow card); the extra weight keeps it crisp at small sizes and on aubergine. Headings balance their lines and paragraphs use `text-wrap: pretty` where the browser supports it.

**The Tabular Figures Rule.** Prices, opening-hours times and quick-view sizes are set in tabular numerals (`font-variant-numeric: tabular-nums`) so stacked figures line up.

## Layout

A single column on a phone and the reel's composition on a desktop, built in rem. Above 1024px the root font-size follows the viewport (clamp(87%, 1.1111vw, 280%)), so 1rem is 1/16 of a 1440px artboard: 16px at 1440, 21.3px at 1920, 28.4px at 2560. From 1024px to 1253px the 87% floor holds the root at 13.92px; 1253 x 712 is the reference viewport the layout is checked against. Below 1024px the root stays 16px. The design scales as one piece to TVs; the TV hook (`data-device='tv'`) adds wider gutters, larger focus rings, taller buttons and tabs and a few larger type sizes. Apart from media-query breakpoints, the only px in the stylesheets are the hero ring label's 8 user units, the navbar's scroll offset, a clip-path fallback, the screen-reader utility and the 11px floor on the dish badge.

Breakpoints are 640, 768, 1024 and 1440 px, mirrored in TypeScript and checked by a unit test.

- **Content column:** a container of max-width 90rem with horizontal padding `--gutter`: 1.25rem below 768px, 2.5rem from 768px, 9.5vw from 1024px (81% of the viewport, as measured on the reel), max(5vw, 3rem) on TV. From 1253px up 90rem is exactly the viewport width, so the gutter, not the cap, sets the column.
- **Navbar height** (`--nav-h`): 4.5rem, 5.5rem from 768px, 7.875rem from 1024px; the returning bar is 4.5rem.
- **Action Dock room** (`--dock-h`): 5.5rem below 1024px, 0 from 1024px. The dock is keyed to width, not to pointer type. The footer adds the room (plus the bottom safe-area inset) as bottom padding so the dock never covers content.
- **Section rhythm** (block padding, phone to desktop): About 4rem 3rem to 6rem 5rem; Popular 3rem, 4rem from 768px, 8rem 5rem from 1024px; Menu 3rem to 5rem 4rem; Follow 2rem 3rem to 3rem 5rem; Visit 3rem 4rem to 4rem 5rem; footer grid 3.5rem 2.5rem to 4.8rem 2.9rem. The hero fills the viewport height on desktop.
- **Hero:** below 1024px the copy leads and the art stage (34rem at most) stacks under it, pulled up by 6rem so the food sits right under the button (the top of the stage is empty: the reel's diagonal chopsticks are not part of this design); the scroll indicator is hidden too. From 1024px the copy (34rem at most) sits left and a 42.5rem art stage sits right, bleeding 2.5rem past the edge. The stage is a 680:620 box whose children are positioned in percent, so it scales as one piece.
- **Entry intro:** a fixed overlay above everything (`--z-intro`), present only when the inline gate sets `html[data-intro]` (never with JavaScript off, reduced motion or forced colours; a reload plays it again, and the page then starts at its top). Flat Oven Orange with a whole pepperoni pizza, 30% of the shorter screen side, that pops in and spins about three turns, easing to a stop at 3s; it then splits into six slices that each leave along their own direction (a small push apart over 0.4s, then 1.1s away, 60ms between slices), each pulling its 64 degree triangle of orange, so the page is uncovered from the middle outwards. The navbar, hero and dock hold their load animations until the last slice has gone (`--intro-wait`). It animates `transform` and `opacity` only, and paints in the first frame.
- **Dishes:** Popular is a horizontal snap-scroller of cards on phones (cards 78% wide, 20rem at most, 1rem gap) and three columns in a 60.25rem grid from 768px (1.25rem gap, 2rem from 1024px). The Menu is a single column of compact rows below 768px (0.75rem apart); from 768px its panels use the same cards in auto-fit columns of at least 14.5rem, three columns from 1024px.
- **Visit:** the info card and the map tile stack on phones; two columns (1fr and 1.05fr, 2rem gap) from 1024px.
- **Footer:** two columns on phones, four from 768px, then, from 1024px, the reel's measured column widths (20.375rem, 15.4375rem, 16.8125rem, the rest).
- **Touch:** below 1024px every control is at least 2.75rem (44px) tall: buttons, menu tabs, footer links and social buttons, dock actions, the menu toggle, the wordmark links and the Follow card's phone number (its Call-now button is drawn 2.4rem tall and framed by an invisible hit area). A whole dish card or row is its own hit area. A test measures them.
- **Anchor landing:** a jump to a section lands where the stylesheet says: the page's `scroll-padding-top` (0.7 of the navbar height) plus the section's own `scroll-margin-top`, honoured once, by Lenis and by the browser path alike. Two sections go further (ADR 0011): the Menu by 6rem from 1024px, so its heading lands just under the returning bar and a laptop-height screen holds the tabs and the first row of dishes; the Visit section by 3rem below 1024px, so more of the map shows above the dock.
- **Stacking:** hero art 1, hero copy 2, navbar 50, dock 60, phone menu 80, quick view and skip link 90.

There is no spacing scale: the build uses rem values on a quarter-rem grid: 0.25rem to 0.5rem inside controls, 0.75rem to 1.5rem between related items, 2rem to 3rem inside plates, 3rem to 8rem between sections.

### Named Rules
**The Artboard Rule.** Write rem, never px. Above 1024px a length measured on the 1440px artboard is the same number in rem.

**The Peek Rule.** A phone scroller shows the edge of its next item so it reads as scrollable: Popular cards are 78% wide, so the next card peeks.

## Elevation & Depth

A hybrid that leans on shadow. The page (#fdfafb) and the plates on it (#fefefe) differ by about one point of lightness, so a card is separated from the page by its shadow and nothing else. Shadows are soft, fall straight down and pull in at the sides (every one has a negative spread), tinted plum on neutral plates and orange under orange pills, so they read as the shade beneath an object on a counter. Cut-out food art does the same job through `drop-shadow()` filters. Dark surfaces (aubergine) are slabs that sit above the page with a tall shadow. The one shadow that falls up is the dock's, because the dock sits on the screen's bottom edge.

### Shadow Vocabulary
- **Orange floor glow** (`box-shadow: 0 0.625rem 1.5rem -0.375rem rgb(251 105 23 / 0.55)`, `--sh-cta`): under orange-filled pills (primary button, selected tab, the quick view's and the phone menu's call pills, the About play button); the Follow card's call pill takes a cream halo ring instead and the dock's Call takes none. Deepens to `0 0.875rem 1.75rem -0.375rem rgb(251 105 23 / 0.6)` (`--sh-cta-hover`) while the primary button is lifted.
- **Plate shadow** (`box-shadow: 0 1.25rem 2.5rem -1.75rem rgb(39 27 37 / 0.22)`, `--sh-card`): menu cards and rows, the tab track, the Visit card and the map tile. On hover and focus-within it becomes `0 1.75rem 3rem -1.5rem rgb(39 27 37 / 0.3)` (`--sh-card-hover`).
- **Slab shadow** (`box-shadow: 0 2.5rem 4.5rem -1.25rem rgb(39 27 37 / 0.5)`, `--sh-dark`): the Follow card and the quick-view panel.
- **Bar shadow** (`box-shadow: 0 0.75rem 2rem -1rem rgb(35 33 36 / 0.25)`, `--sh-bar`): the frosted navbar when it returns, and the hero scroll knob.
- **Dock shadow** (`box-shadow: 0 -0.75rem 2rem -1rem rgb(35 33 36 / 0.25)`, `--sh-dock`): the Action Dock, cast upward from its top edge.
- **Cut-out filters** (`filter: drop-shadow(...)`): item `0 0.875rem 0.875rem rgb(39 27 37 / 0.16)` for dish art (cards, rows, quick view, 404); cluster `0 1.25rem 1.25rem rgb(39 27 37 / 0.12)` for the About food; slab-item `0 0.75rem 0.6rem rgb(0 0 0 / 0.4)` for food resting on the hero slab; on-dark `0 0.75rem 0.75rem rgb(0 0 0 / 0.35)` for the art on the Follow card; badge `0 0.25rem 0.375rem rgb(39 27 37 / 0.22)` under the small pizza in the hero headline.
- **Hairline rings** (`box-shadow: inset 0 0 0 0.0625rem`): in `--c-line` on ghost buttons, dock actions, the details button and the quick-view close button; in `--c-ring-on-dark` (rgb(255 255 255 / 0.28)) on round buttons over aubergine. **Halo rings** (`0 0 0 0.25rem`): `--c-ok-halo` (rgb(31 157 85 / 0.18)) around the open dot and `--c-halo-cream` (rgb(241 232 228 / 0.5)) around the Follow card's call pill.
- **Frost** (`backdrop-filter`): the returning navbar sits on Frosted Paper with `blur(0.875rem) saturate(1.4)`; the quick-view scrim blurs by 0.375rem. Both are dropped where unsupported and in the lite motion tier (solid bar, plain scrim).

### Named Rules
**The Floor Shadow Rule.** A shadow is the shade under an object: it falls straight down, has a negative spread, and takes the colour of what casts it (plum for plates, orange for orange pills). The dock, which sits on the screen edge, is the one that falls up.

**The Quiet Until Touched Rule.** Plates rest flat and lift only on hover (fine pointers) or deepen on focus-within: a card rises 0.375rem and its shadow grows. The lift never changes the plate's colour. On touch there is no lift: a held tappable sinks to 0.97 and a whole card or row takes the `--c-press` tint instead.

## Shapes

Rounded everywhere, with no sharp corners and no heavy borders. Two families: stadiums for what you press and plates for what holds content.

- **Stadium** (`--r-pill`, 62.5rem): buttons, tabs and the tab track, tag chips, dock actions, the Follow card's phone pill. **Circles** (50%): icon buttons (menu toggle, close, social, play, hero knob) and status dots.
- **Plate** (`--r-card`, 1.125rem): menu cards and rows (and the overlay that makes the whole card a button). **Large plate** (`--r-xl`, 2rem): the quick view, the Follow card at rest, the Visit card and the map tile. **Soft rectangle** (`--r-md`, 1rem): size rows in the quick view. **Small** (0.5rem, written out, no token): the card details button and the Follow card's idle pre-state.
- **Borders:** none on containers. 1px hairlines appear as inset rings on controls, a top rule on the footer and its bar, and a dashed rule under each opening-hours row.
- **Clipping:** the phone menu opens through a growing circle (`clip-path: circle()`); the hero and the map tile clip with overflow. Food art is never cropped to a box.
- **Marks:** small marks punctuate headlines: a whole pepperoni pizza (an image, 0.78em tall) before "Fast Food" in the hero, the About target (peach halo, red ring and core; inline SVG) and the Follow sparkle (three orange strokes; inline SVG).
- **Icons:** one drawn set, 24-unit viewBox, 1.8 stroke with round caps and joins, sized in em (1.0625rem inside buttons, 1.25rem in call links and Visit rows); only the play glyph is filled.

### Named Rules
**The Stadium and Plate Rule.** What you press is a stadium or a circle; what holds content is a plate with 1.125rem or 2rem corners. Nothing in the system has a sharp corner.

## Components

### Buttons
Pills that feel pressed rather than clicked: they lift on hover and sink on press.
- **Shape:** stadium (`--r-pill`).
- **Primary:** vertical gradient from #ff7d31 to #ed600f, aubergine 600 label at 0.9375rem (6.5:1 to 4.95:1), 2.75rem tall, 1.75rem side padding, 0.625rem gap to a 1.0625rem icon, with the orange floor glow. One per surface: hero "View Menu", Visit "Get directions", 404 "Back to the menu".
- **Ghost:** Plate White fill, ink label, 1px inset ring in `--c-line` that turns ink on hover. Visit and 404 "Call us".
- **Hover / Focus / Active:** on fine pointers the primary lifts 0.125rem, its glow deepens and its arrow nudges 0.1875rem right over 0.35s. Every `a` and `button` sinks to 0.97 while held (one global rule in `base.css`, which also clears the browser's tap flash and double-tap delay); on a mouse the primary's hover lift wins the cascade, so its press shows on touch. The focus ring is a 0.1875rem ink outline 0.25rem out. On TV a button is 3.5rem tall with a 1.125rem label.
- **Hand-rolled copies:** the Follow card's "Call now" (2.4rem tall), the quick view's call pill (3rem), the phone menu's call pill (3.5rem), the dock's Call action (2.75rem), the selected tab pill and the About play button (3.125rem circle) re-implement the same gradient (and, except on the Follow card and in the dock, the same glow) instead of using the button component.

### Wordmark
A text-only placeholder logotype: uppercase Plus Jakarta Sans 800 (1.5rem, 1.4375rem in the footer) in ink with 0.01em tracking, over a small uppercase tagline in burnt crust with 0.26em tracking (the reel's wordmark lockup, kept as drawn; its size is an observation below). Centred in the desktop navbar, left-aligned in the phone navbar and the footer.

### Navigation
- **Navbar:** on desktop the links sit left, the wordmark centre, and the open-status chip (label only) plus the phone link right, on a transparent bar over the hero. Links are 0.9375rem 500 in ink; hover and the current section turn burnt crust and draw a 0.125rem orange underline over 0.6s: it grows from the left and, when it leaves, runs out to the right, so the underline reads as handed from link to link. No link is current while the hero is in view, only once a section is: the reel marks the first link at the top, but there the first link is Menu and a visitor on the hero is not in it (ADR 0011). The phone link has a 1px ink underline that turns orange on hover. On a phone the bar is the wordmark, a phone icon and the menu toggle (the status moves to the dock).
- **Navbar behaviour:** it scrolls away with the page, hides on scroll down and returns on scroll up as a frosted bar (Frosted Paper fill, bar shadow, 4.5rem tall). It enters on load by sliding down 1.5rem and fading in over 0.38s.
- **Menu tabs:** a Plate White stadium track (0.375rem padding, plate shadow) holding 2.75rem-tall tabs (0.9375rem 600 in smoke grey; 0.875rem with 0.75rem side padding on phones). The selected tab's label is aubergine over an orange gradient pill that slides to the next tab (0.45s ease-out); an unselected tab turns ink on hover. Arrow keys, Home and End move selection. Under the track a one-line script blurb describes the category. The menu has six tabs, so a phone scrolls the track sideways.
- **Phone menu:** a 2.75rem round toggle opens a full-screen aubergine panel through a circle that grows from the button (0.65s). Links are Playfair 500 at clamp(2.25rem, 11vw, 3.25rem) in white, unnumbered; at the bottom a full-width orange call pill (3.5rem tall, aubergine label) and round social buttons (2.75rem, 1px ring). Focus rings turn white on aubergine. It exists only below 1024px.

### Action Dock
A thumb-reach bar for phones and tablets, below 1024px only (from desktop width the navbar carries the phone and the status). It is fixed along the bottom edge on Plate White with the dock shadow cast upward, padded 0.5rem and the gutter plus the bottom safe-area inset, above the page (z 60) and below the phone menu and the quick view; it also appears on the 404 page. Top line: the open-status chip with its detail, centred. Below it three equal 2.75rem stadium actions with an icon and a 0.875rem 700 label: Call (the orange gradient with an aubergine label and no glow, a `tel:` link), WhatsApp and Directions (Plate White, ink label, 1px ring, opening in a new tab). WhatsApp appears only when the business has a number. The dock slides up from below the screen edge 0.8s after load (0.5s expo-out, opacity and transform only). Pages reserve its room at the bottom.

### Chips and tags
- **Tag chip:** peach fill, burnt-crust 700 uppercase label with 0.08em tracking, stadium, 0.25rem 0.75rem padding. In the quick view it is 0.6875rem; on a dish card or row it is max(0.6875rem, 11px) with 0.625rem side padding (floating top-left on a card, 1rem down and 1.1875rem in; in the flow above the title on a row), showing the first tag only (Vegetarian, Spicy, New, Vegan).
- **Open-status chip** (one shared component): a 0.5rem dot and a 0.8125rem 600 label, with an optional detail after a middle dot that says what changes next ("until 11:00 PM", "opens 9:00 AM", "opens tomorrow 9:00 AM", "opens Mon 9:00 AM"). Closed or unknown: ash dot, smoke-grey label. Open: green dot inside an 18% green halo ring, ink label. It appears in three places: the desktop navbar (label only), the Visit card and the dock (with the detail). The behaviour works the label and detail out from the hours in the restaurant's time zone and refreshes each minute.

### Cards / Containers
- **Menu card:** Plate White, 1.125rem corners, plate shadow, padding 1.375rem 1.3125rem 1.5rem, 22.625rem minimum height. A centred transparent cut-out (10rem box, art up to 9rem tall) with the item drop-shadow; the dish name in Playfair 600; a two-line smoke-grey description at 0.8125rem; a footer row with the price in burnt crust (0.9375rem 700, tabular numerals, 0.02em tracking) left and the 1.75rem square details button right (arrow-up-right icon, 1px ring, fills orange with an aubergine glyph on hover). The button's invisible overlay covers the whole card, so a tap anywhere on the card opens the details. On fine pointers a hovered card rises 0.375rem, its shadow deepens and the art scales 1.05 and tilts -2deg over 0.6s; focus-within deepens the shadow. While pressed, neither the card nor its button scales (a transform on the button would shrink its overlay); a 6% plum tint (`--c-press`) fills the card instead. Without script the details button is hidden. One component serves Popular and the Menu.
- **Menu row** (the Menu below 768px): the same component laid out as a compact row, so four or five dishes fit above the dock instead of one. A Plate White plate (1.125rem corners, plate shadow, padding 0.875rem 1rem 0.875rem 0.875rem, 140px to 160px tall where a card is 362px) with a 5rem thumbnail on the left (cut-out up to 4.5rem) and, on the right, the tag chip, the dish name (Playfair 600, 1.0625rem), a two-line description and the price with the details arrow. Rows sit 0.75rem apart, and the whole row is the hit area with the same press tint. Popular keeps the full cards at every width.

- **Menu pager:** under a category of more than nine dishes, centred: a Previous pill, "Page 2 of 4" (0.9375rem 600 in Smoke Grey, 6.5rem wide so the pills do not move), and a Next pill. Each pill is a Plate White stadium (2.75rem tall, 1.25rem side padding, 600 Charcoal Ink, plate shadow, a right arrow turned around for Previous) that turns accent text on hover. At either end the pill is 40% opaque and `aria-disabled`, so focus stays on it. Without JavaScript the pager is hidden and every page shows.
- **Scroll to top:** a 3rem Charcoal Ink square (1rem corners) with an up arrow, fixed bottom right (1.25rem in from the edge and above the dock on a phone, 2rem from 1024px). It is invisible until the page is scrolled, then rises in; on hover it turns accent orange.
- **Visit card and map tile:** Plate White with 2rem corners and the plate shadow; padding 1.75rem 1.5rem, 2.5rem from 768px, 3rem from 1024px. Contents: a start-aligned heading, a paragraph, an address and an opening-hours list (times in tabular numerals) with burnt-crust icons and dashed 1px row rules, the open-status chip with its detail, then a primary and a ghost button. The map tile (Flour Cream bed, 2rem corners, 16rem minimum height) is a link whose image zooms 1.04 over 0.9s on hover.
- **Quick view (dialog):** a Charcoal Scrim overlay with a 0.375rem blur holds a Plate White panel (52rem at most, 2rem corners, slab shadow). From 768px it is two columns (0.9fr image pane with a peach radial glow, 1.1fr body); on phones it stacks. Body: tag chips, a Playfair 600 title at 2rem, a 0.9375rem description, size rows (Counter White fill, 1rem corners, label left and a burnt-crust 700 price right, tabular numerals) or a single 1.25rem price, an allergen line at 0.8125rem, and a full-width orange call pill (3rem tall, aubergine label). The close button is a 2.75rem circle with a 1px ring. It enters with the scrim fading in over 0.25s while the panel rises 32px and settles from scale 0.97 over 0.45s. The dish steps out of the picture on the card that was tapped: it starts at that picture's place and size and moves into the dialog over 0.55s on expo-out, and goes back over 0.4s on close, while the dialog leaves in reverse (24px, scale 0.98); focus is trapped and returns to the opener.
- **Footer:** Plate White under a 1px top rule. Four columns: the wordmark with a blurb, a link list, a contact list and the address with bold hours. Headings are 0.9375rem 700 in ink; links are 0.875rem smoke grey and turn burnt crust on hover. A bar under a second rule holds social circles (2.25rem, 2.75rem below 1024px; the first filled orange with an aubergine glyph, the others Hairline Blush with a grey glyph, all turning orange and lifting 0.125rem on hover), the copyright (0.75rem, centred) and "Back to top" (0.75rem 600, arrow turned up). Below 1024px footer links are 2.75rem tall and the footer pads its bottom by the dock's room.

### Section heading
Centred by default and start-aligned inside the Visit card: a Headline title and nothing above it (the shared heading has no script line). Titles balance their lines.

### Signature Component: The Follow Card
The one choreographed moment, and a binding brand commitment. Its final state is plain CSS: an aubergine plate (2rem corners, slab shadow, up to 68.5rem wide and 17.5rem tall on desktop) with a pizza slice, basil and tomatoes on the left (18.5rem wide, on-dark drop-shadow) and, from 57.5% across, a script line in orange (the reel's own), the title in white Playfair 600 (Headline-sm), and a Flour Cream stadium (3rem tall) holding the phone number (0.875rem 500, aubergine) and an inset orange "Call now" pill (2.4rem tall, 0.3rem inside, aubergine label, with a 0.25rem cream halo ring). A tiny orange sparkle sits at the top-right corner. Under the card, two quiet links (Instagram, WhatsApp; 0.875rem 600 smoke grey, burnt crust on hover, 2.75rem tall). On phones the art rises out of the top edge and everything stacks and centres.
- **Idle pre-state** (only while script runs and motion is allowed): a thin dark pill 1.15rem wide (about 16px at the reference viewport) at the card's full height with 0.5rem corners; the art, text and sparkle are at opacity 0.
- **Sequence:** it fires once when the card's top reaches 70% of the viewport and then plays out in time, never scrubbed. The width grows to full in 0.96s on expo-out. The corners stay a full stadium (8.75rem) for 0.3s, then relax to 2rem over 0.8s on their own expo-out. The art and the text slide out from the card's centre over 0.96s (on phones they rise 1.5rem instead) while fading in: art over 0.18s, text from 0.1s over 0.3s, sparkle from 0.15s over 0.25s. The art and the text are siblings of the plate, not children, so its growth never clips them.
- **Call ping:** once the card is open, a 0.125rem ring in the highlight orange hugs the Call-now pill (70% opacity) and, 1.05s after the card starts opening, leaves it once: scaling from 1 to 1.3 while fading to nothing over 0.9s on expo-out. The point of the card is the call.
- **Tiers:** the lite tier plays the same morph a third faster; the static tier (reduced motion) shows the final state and nothing moves.

**The Two Moments Rule.** The entry intro and the Follow card's expansion are the only choreographed spectacles, and they never overlap: the intro is over before any page motion starts. Every other motion is a short ease-out that serves content (the call ping is the card's coda), and nothing may compete with them.

## Do's and Don'ts

### Do:
- **Do** take every colour, radius, shadow, duration and easing from `src/styles/tokens.css`, and add the token first when a value is missing (stylelint rejects hex and colour functions anywhere else).
- **Do** write lengths in rem: 1rem is 1/16 of the 1440px artboard above 1024px, so artboard measurements convert one to one.
- **Do** set orange text on light surfaces in `--c-accent-text` (#b8420a) and keep `--c-accent` (#fb6917) for fills, underlines, rings and text on aubergine.
- **Do** set the label and glyph on every orange fill in `--c-on-accent` (aubergine #271b25): 6.5:1 on #ff7d31, 4.95:1 on #ed600f. Keep white (`--c-on-dark`) for ink and aubergine surfaces.
- **Do** give each surface one orange-filled action (vertical gradient from #ff7d31 to #ed600f with `--sh-cta`); make secondary actions ghost pills (Plate White fill, 1px `--c-line` ring) or quiet smoke-grey links.
- **Do** make what you press a stadium (62.5rem) or a circle, and give content plates 1.125rem corners (cards) or 2rem corners (quick view, Follow card, Visit card, map tile).
- **Do** set Playfair Display at weight 500 for page and section headings and 600 inside plates (cards, dialog, Follow card); use Plus Jakarta Sans for everything else.
- **Do** ground food art with a `--fx-*` drop-shadow filter and plates with an `--sh-*` shadow, tinted plum or orange.
- **Do** keep every ease an out-curve (`--ease-out`, `--ease-expo`, `--ease-soft`), gate hover lifts behind `@media (hover: hover)` and answer a press with `scale(0.97)`; a whole card or row takes the `--c-press` tint instead.
- **Do** keep the focus ring: a 0.1875rem solid outline in `--c-focus` (ink), 0.25rem out, white on aubergine, 0.3125rem on TV; it is never removed.
- **Do** keep tap targets at 2.75rem (44px) on phones for buttons, tabs, nav, footer links and social buttons and dock actions, and make a whole card or row the hit area (an overlay on its details button) instead of a small arrow.
- **Do** set prices, opening hours and sizes in tabular numerals.
- **Do** floor small labels: the dish badge is max(0.6875rem, 11px), so it never drops below 11px when the root shrinks.
- **Do** reserve `--dock-h` at the bottom of pages below 1024px (the footer's padding) so the Action Dock never covers content.

### Don't:
- **Don't** write a hex or colour function outside `tokens.css`, and don't use `@layer`, `@container`, `@scope`, `:has()`, `:is()`, dvh, svh or lvh units, `color-mix()`, `light-dark()`, individual transform properties (`translate`, `scale`, `rotate`) or native nesting: the floor is Chromium 94, Safari 15 and Firefox 100. The one sanctioned exception is a newer value refining an older declaration written right above it, with an inline stylelint disable and a reason (the hero's `100vh` then `100svh`).
- **Don't** set text on a light surface in `--c-accent` (2.8:1 on the page).
- **Don't** set white text or glyphs on the orange gradient or the flat orange (2.6:1 to 3.3:1): the label on orange is aubergine.
- **Don't** animate anything but `opacity` and `transform`, and never `visibility` or `autoAlpha` in animation code: hidden content cannot take keyboard focus (ADR 0003). The Follow card's width and corner radius are the stated exemption.
- **Don't** add a second choreographed spectacle: the Follow card's expansion is the signature and other effects must not compete with it.
- **Don't** hide content before it is revealed except through the `data-reveal` protocol, which applies only while script runs and motion is allowed; the page must be complete without scripts.
- **Don't** use hard-offset, zero-blur or black shadows on surfaces: every elevation in the system is soft, has a negative spread and falls straight down (the dock's, on the screen edge, falls up).
- **Don't** put a script line above a section heading: the shared heading has none. The About and Follow lines are the reel's own.
- **Don't** transform the card's details button while it is pressed: its overlay is what makes the whole card the hit area, and a transform would shrink it.
- **Don't** introduce a breakpoint other than 640, 768, 1024 and 1440 px (a unit test scans CSS, `sizes`, `matchMedia` and `client:media`).
- **Don't** add stock photography while the generated illustrations stand in as imagery (PRODUCT.md); the incumbent shows food only as transparent cut-outs, never in cropped rectangles.

### Observations carried by the build (not desired state)
These are facts about the current code, recorded so nobody mistakes them for precedent. None is a rule and none has been repaired by this document.
- **Text below 11px.** The logo tagline is 0.4375rem (7px at a 16px root, 6.1px at the 1253px reference viewport), 0.5rem (8px) below 1024px and 0.625rem on TV: it is the reel's wordmark lockup, kept as drawn. The hero's rotating "Scroll down" ring label is about 7px (decorative, hidden from assistive technology). The quick view's tag chip is plain 0.6875rem, so it falls to 9.6px at 1253px (the dish badge is floored at 11px).
- **Small running text.** The footer copyright and "Back to top" are 0.75rem (12px); dish descriptions, allergen lines, status labels, the footer blurb and hours are 0.8125rem (13px); hero and About paragraphs are 0.875rem (14px). Between 1024px and 1253px the root drops to 13.92px, so all of these shrink by 13% (descriptions render at 11.3px, hero copy at 12.2px), smaller than on a phone.
- **Drawings stand in for photographs.** Each of the 70 menu pictures is a generated drawing (`scripts/art/menu.mjs`); drinks are generic and colour-coded by flavour, without brands, and a picture does not change with a size. By decision (PRODUCT.md, ADR 0015) they stand in until real photographs exist, which replace them by base name.
- **Script lines that remain.** About ("About us") and Follow ("Stay in touch") keep the reel's brush-script line above the heading, tilted -2deg on the Follow card, and the 404 page has a script "404" above its title. It is decoration the build carries, not a pattern for new sections. The Menu and Visit headings no longer have one.
- **Duplicate adjacent links.** The Follow card's phone number and its Call-now pill link to the same `tel:` address, and the Visit map tile and its "Get directions" button link to the same map URL under the same accessible name, so each pair is two tab stops for one action.
- **Token drift.** The orange gradient is written out seven times (button, tab pill, About play button, Follow call pill, quick-view call pill, phone-menu call pill, dock Call) instead of being a token, and the card details button and the Follow card's idle pre-state write 0.5rem out instead of using a token.
- **Motion rule drift.** The repo's rule exempts only the Follow card's width and radius from "opacity and transform only", but the tab pill's slide also tweens `width` (a FLIP-style move) and the phone menu's circular reveal drives `clip-path` through a custom property. Both are recorded as built.
