# 0004. Layered architecture, enforced by lint

Status: Accepted

## Context

The site will grow ("more features later"), and AI tools will edit it. Convention alone erodes: a section imports a
neighbour, a component reads `import.meta.env`, a script pulls in GSAP directly and defeats the lazy chunk.

## Decision

Organise code into layers with a strict, one-way dependency order and **enforce it mechanically**:

```
pages -> layouts -> sections -> features -> entities -> shared
                      infrastructure (adapters) and composition (build-time root)
```

- `eslint-plugin-boundaries` holds the policy (what each layer may import; sections, features and entities are isolated
  from their siblings). Files outside any layer are an error.
- Single-owner rules (`gsap`, `motion/react`, `lenis`, `astro:content`, `astro:assets`, `import.meta.env`) are
  `no-restricted-imports` / `no-restricted-syntax` rules with an explicit exception table in `eslint.config.js`.
- `dependency-cruiser` covers what ESLint cannot: cycles, dev dependencies in shipped code, unresolvable imports.
- `knip` keeps each layer's `index.ts` honest (export only what is consumed) and finds dead code.
- Sections and features cross-talk only through the typed event bus or through `composition`.

## Consequences

- A violation fails `npm run lint` at the import, with a message naming both layers. Planted violations were verified
  to fail: cross-section, cross-entity, upward import, forbidden `gsap`, `import.meta.env`, `autoAlpha`, unknown folder.
- Adding a top-level folder is a deliberate act: it must be classified in `eslint.config.js`.
- dependency-cruiser cannot parse `.astro` files, so the layer policy lives in ESLint (whose Astro parser sees every
  import). A first dependency-cruiser config silently skipped all package edges because it excluded `.d.ts` files; the
  rule was proven with a planted violation, which is the standard to hold new rules to.
- Known gap: `composition -> sections` is meant to be type-only, but the rule cannot yet express that.
