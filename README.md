# Piccolo

A fast, accessible, single-page marketing site for a fast-food place (pizza, hot dogs, sandwiches, drinks). It
reproduces the layout and motion of a reference reel and is built to work on phones, tablets, laptops, desktops and TVs
(including D-pad navigation). Static output, two small interactive islands, no backend.

Everything shown (name, address, phone, prices, copy, artwork) is **placeholder content** to be replaced; see
[Go-live checklist](#go-live-checklist).

## Quick start

Requires Node 22.23+ (developed on Node 26) and network access at build time (fonts are downloaded from Google Fonts and
self-hosted).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

On Windows PowerShell, use `npm.cmd` / `npx.cmd` if script execution policy blocks the `.ps1` shims.

## Commands

| Command | What it does |
| --- | --- |
| `npm run verify` | Everything except browser tests: type check, lint, CSS lint, architecture, dead code, unit tests, build, HTML validation, size budgets |
| `npm run verify:all` | `verify` plus the Playwright suite |
| `npm run check` | `astro check` (strictest TypeScript; 0 errors, warnings and hints) |
| `npm run lint` / `lint:css` | ESLint (layering, a11y, motion rules) / stylelint (tokens, browser floor) |
| `npm run arch` / `knip` | dependency-cruiser (cycles, dev deps in shipped code) / unused files, exports, dependencies |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright on desktop, phone, tablet and TV profiles (uses the system Chrome) |
| `npm run html` / `size` | Validate the built HTML / enforce size budgets on the build |
| `npm run art` | Regenerate the placeholder SVG artwork in `src/assets` |

## Editing content

| To change | Edit |
| --- | --- |
| Business name, tagline, phone, e-mail, address, opening hours, social links | `src/content/site.json` |
| Page copy (hero, about, footer, labels) | `src/content/home.json` |
| Menu categories and items (prices in major units, RSD, e.g. `220`) | `src/content/menu/categories.json`, `items.json` |
| Artwork | `src/assets/<group>/<name>.png / jpg / webp / avif`, same base name as the placeholder SVG (the raster wins); each menu picture is `src/assets/menu/<item id>` |

Content is validated at build time: a typo fails the build with a precise message instead of shipping a broken page.

## Go-live checklist

- [ ] Replace placeholder content in `src/content/*.json` (name, phone, address, hours with the correct IANA time zone,
      socials, menu, prices and allergens).
- [ ] Replace placeholder artwork with real photos (transparent cut-outs work best for the food items).
- [ ] Set `site` in `astro.config.ts` to the real URL (it feeds canonical links and JSON-LD; it is currently
      `https://piccolo.example`), and add the real logo / favicon in `public/`.
- [ ] Decide on the follow-ups listed in [docs/architecture.md](docs/architecture.md#known-trade-offs).
- [ ] `npm run verify:all`, then deploy `dist/` to any static host.

## How it is built

- **Astro 7** static site; **Preact 11** for exactly two islands (mobile navigation, menu browser).
- **GSAP + ScrollTrigger** (one lazy chunk) animate both the scroll scenes and the two islands, **Lenis** gives fine-pointer
  laptops and desktops smooth scroll.
- Layered architecture with dependency rules enforced by lint; the reasoning is recorded in
  [docs/adr](docs/adr/README.md).
- Works without JavaScript (every menu category is rendered), honours reduced motion, and targets a Chromium 94 browser
  floor (LG webOS 23+, Samsung Tizen 2023+).

## Documentation

- [docs/architecture.md](docs/architecture.md): layers, runtime, device model, quality gates, recipes
- [docs/adr](docs/adr/README.md): why the big decisions were made
- [docs/reference-spec.md](docs/reference-spec.md): measurements taken from the reference reel
- [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md): who the site is for, and the visual system as it is built
- [AGENTS.md](AGENTS.md): guidance for AI coding agents
