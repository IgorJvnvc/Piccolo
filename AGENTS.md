# AGENTS.md

Guidance for AI coding agents working in this repository. Humans should start with [README.md](README.md) and
[docs/architecture.md](docs/architecture.md); the reasons behind the rules are in [docs/adr](docs/adr/README.md).

## What this is

A static, single-page marketing site (Astro 7, two Preact islands, GSAP + Lenis) for a fast-food place. It copies a
reference reel's layout and motion ([docs/reference-spec.md](docs/reference-spec.md)) and works from phones to TVs. No
backend. All business content and artwork are **placeholders**.

## Commands

```bash
npm run dev             # dev server
npm run verify          # check + lint + lint:css + arch + knip + test + build + html + size  (run before finishing)
npm run test:e2e        # Playwright: required for anything visible or interactive
npm run verify:all      # both
```

On Windows PowerShell use `npm.cmd` / `npx.cmd` if script execution policy blocks `.ps1` shims.

## Rules the tooling enforces (do not work around them)

- **Layering.** `pages -> layouts -> sections -> features -> entities -> shared`; `infrastructure` and `composition` sit
  beside them. Sections, features and entities must not import their siblings. Cross-talk uses the typed event bus
  (`shared/events`) or `composition`. Allowed edges: `eslint.config.js` (`layerPolicies`).
- **Single owners.** Only `shared/motion/gsap.ts` imports `gsap` (everything else gets it through the kit: scenes via
  `defineScene`, islands via `shared/motion/island`); only `features/smooth-scroll` imports `lenis`; only
  `infrastructure/**` and `content.config.ts` import `astro:content`; only `shared/config/env.ts` reads `import.meta.env`.
- **Animation code animates `opacity` and `transform` only** (scenes, behaviors, `*.motion.ts`, `shared/motion`). Never
  `visibility` or `autoAlpha`: hidden content cannot take keyboard focus
  ([ADR 0003](docs/adr/0003-progressive-enhancement-and-reveal-protocol.md)).
- **CSS:** CSS Modules + tokens (`src/styles/tokens.css`). No raw colours (add a token), no `@layer`, `@container`,
  `:has()`, `:is()`, `dvh/svh`, `color-mix()`, or native nesting. The browser floor is Chromium 94 / Safari 15 / Firefox 100.
- **Barrels (`index.ts`) export only what is consumed** (knip). Types are exempt.
- **TypeScript is the strictest preset.** With `exactOptionalPropertyTypes`, pass-through props such as `class` are
  declared `class?: string | undefined` because CSS Module lookups are `string | undefined`.

## Where things go

| You want to... | Do this |
| --- | --- |
| Change copy, hours, links, menu | Edit `src/content/*.json` (validated at build time) |
| Add a menu item | Append to `src/content/menu/items.json`; `image` must have a file under `src/assets` |
| Add a section | `src/sections/<name>/` (`.astro`, `.module.css`, `.hooks.ts`, `types.ts`, `index.ts`); props in `composition/home.ts`; add to `pages/index.astro` |
| Animate a section on scroll | `<name>.scene.ts` default-exporting `defineScene({ id, selector, start, build })`; `build` gets the scene's `timeline`, `fadeUp`, `px`. Numbers (eases, durations, travel in rem) come from `shared/motion/tokens.ts` |
| Add interaction (not UI state) | `*.behavior.ts` in the owning feature |
| Animate an island | A `*.motion.ts` in the feature (plain functions of `(node, tools)`) driven by `usePresence` / `useMotion` from `shared/motion/island` |
| Add stateful UI | Think twice: a third island needs a reason ([ADR 0001](docs/adr/0001-static-astro-with-two-islands.md)) |
| Share a message between features | Add to `AppEvents` in `shared/events/events.ts` |
| Add a colour / shadow | Add a token in `src/styles/tokens.css` first |

More recipes: [docs/architecture.md](docs/architecture.md#recipes).

## Verification expectations

- Run `npm run verify` before declaring work done; run `npm run test:e2e` when behaviour or markup changed.
- **A new lint/check rule is not done until you have planted a violation and watched it fail.** A rule that has never failed has
  never been proven (an earlier dependency-cruiser config silently skipped all package imports).
- Prefer tests that fail when the behaviour breaks. The unit suite is mutation-checked; keep it that way.
- Layout is compared with the reference at 1253 x 712: `tests/e2e/reference.spec.ts` checks element boxes against a
  baseline verified with the reel. If you change layout on purpose, re-verify with `scripts/dev` (`scan.mjs` +
  `match_frames.py`) and regenerate it: `UPDATE_GOLDEN=1 npx playwright test --project=reference`. The other tools in
  `scripts/dev` (screenshots, overlays, Follow-card animation fit, motion profiles) are described in their file headers.
  Judge a stall or a layer change with `scripts/dev/stall-lab.mjs`: it starts a cold Chrome per run and A/Bs two builds or
  injected CSS variants. Measure cold and by median; a warm browser shows almost no stalls ([ADR 0009](docs/adr/0009-first-frame-stalls.md)).

## Agent skills (user-level)

Skills live in the developer's own opencode setup (`~/.config/opencode/skills`, `~/.agents/skills`, plugins in
`~/.config/opencode/opencode.jsonc`), never in this repo, so nothing here vendors, pins or locks them. Used for this
project: the official GreenSock skills (`gsap-*`), `impeccable` and `design-taste-frontend` (design), `playwright-cli`
(browser checks), `ponytail` (less code) and `img2threejs` (dormant: 3D needs an ADR first). Load only what the task
needs: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger` and `gsap-performance` for scenes; `gsap-react` for island
hooks; `gsap-plugins` before adding a plugin. In a session that started before an install, read the `SKILL.md` directly.

**Project rules win over skill defaults.** Where a skill disagrees with this file or an ADR, follow the project:

| A skill says | This project | Why |
| --- | --- | --- |
| Prefer `autoAlpha` for fades | Animate `opacity` and `transform` only | `visibility: hidden` removes content from the tab order ([ADR 0003](docs/adr/0003-progressive-enhancement-and-reveal-protocol.md)); lint-enforced |
| Don't animate `width` | The Follow card animates `width` and `border-radius` | It is the reel's signature; change it only with before/after numbers from `scripts/dev/sample-follow.mjs` |
| Use `useGSAP` / `@gsap/react` | `defineScene` (scenes) and `useMotion` / `usePresence` in `shared/motion/island` (islands), built on `gsap.context()` + `revert()` | `@gsap/react` imports GSAP statically, and GSAP must stay a lazy chunk |
| `gsap.matchMedia()` for `prefers-reduced-motion` | The scheduler's motion tiers decide; GSAP never loads on the `static` tier | One owner for capability decisions ([ADR 0005](docs/adr/0005-device-capabilities-and-motion-tiers.md)) |

## Gotchas (each one cost time once)

- **Cards render twice** (Popular row and Menu) so element ids must be unique per placement: `MenuCard` takes `idScope`.
- **In Playwright, scope locators** to a section when the same control appears twice (`#menu`, `[data-enhance="popular"]`);
  `.first()` depends on what has been revealed.
- **Wait for hydration with `hydrated(page, 'MenuBrowser')`**: Astro 7 names the component in `astro-island[component-export]`
  (the URL is a hashed barrel chunk) and removes the `ssr` attribute when done.
- **Quick-view and mobile-menu focus** returns to the exact opener (`opener` in the `menu:details` event), because
  `document.activeElement` is unreliable after a tap.
- **Phone numbers use non-breaking spaces** (`nbsp()` in composition); the `tel:` href strips them.
- **Money is integer minor units** in the domain; JSON is in major units and converted once in the adapter.
- **Astro frontmatter exports are fragile**: put section prop types in `types.ts`.
- **`gsap.context()` needs a function.** Without one it returns the context that is *currently running* (undefined at
  setup), not a new one. `createScene` passes a no-op and runs the scene through `context.add`.
- **Never put `clearProps` in a timeline's `defaults`.** A `fromTo` writes its from-state through an internal tween that
  inherits the defaults, so the from-state is cleared the instant it is written. Put it on each tween.
- **CSS animations do not replay when only their direction changes.** The `data-presence` fade (`base.css`) uses two
  keyframes, `presence-in` and `presence-out`, for that reason. Reduced motion keeps that short fade on purpose, so it
  overrides the blanket "no animation" rule with `!important`.
- **`html { scroll-behavior: smooth }` makes programmatic scrolls slow** (seconds, in a test). Jump with
  `scrollTo({ top, behavior: 'instant' })`; a scene plays in real time from the moment its trigger is crossed.
- **The 4 s `no-enhance` failsafe fires on a loaded CI machine.** Tests that assert the hidden pre-state neutralise it
  (`tests/e2e/motion.spec.ts`); `progressive.spec.ts` covers the failsafe itself.
- **Motion specs sample every frame and assert intermediate frames.** A failed scene opens its content at once and looks
  "visible" to every other test. Wait for GSAP (`gsapReady`) before an interaction that must animate: before it arrives
  the island fades with CSS instead, by design.
- **Sweep the page by frames, not by time.** A scene starts when its section is seen in a rendered frame, so a scroll sweep
  paced by timeouts lets a stalled machine outrun its frames and skip a section, which then never reveals (a 20 s
  timeout in `reference.spec.ts` once). Use `revealAll(page)` from `tests/e2e/fixtures.ts`: two frames per position.
- **A stalled frame can swallow a whole fade.** The quick view's first frame takes about 220 ms in software-rendered
  Chrome and the animation clock does not wait, so the first frame that lands already shows the fade at 97%, and no
  frame falls inside it. `islands.spec.ts` records through `record()`, which repeats an interaction whose recording shows
  no motion *and* contains a gap above 120 ms; a recording with every frame on time that shows no motion still fails.
- **Headless Chrome is software-rendered**, so the stalls at a scene's start are GPU-process tasks (texture upload of the
  layers that start animating), not JavaScript. Read profiles relatively (before vs after), never absolutely.
- **`gsap` and `lenis` are loaded with dynamic `import()`**, so a grep for `from 'gsap'` finds nothing; lint covers both forms.
- **TypeScript is pinned to ~6.0** because typescript-eslint and `@astrojs/check` do not yet accept 7.
- **Editing source through a shell:** in PowerShell, backticks and `$` inside double-quoted strings are escape sequences
  (a stray `` `a `` or `` `v `` silently inserts control characters). Prefer the editor tools, or single-quoted strings.

## Out of scope unless asked

Ordering, carts, accounts, payments, a CMS, analytics, or a backend. Do not commit, push or install third-party agent
skills without being asked.
