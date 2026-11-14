# 0007. Content as validated JSON behind repository ports

Status: Accepted

## Context

The owner will edit copy, hours, links and the menu without touching code, and may later move to a CMS. A typo in content
must never ship a broken page.

## Decision

- Content lives in `src/content/*.json` and is exposed through **Astro content collections** with **Zod schemas**
  (`infrastructure/content/schemas.ts`). Invalid content **fails the build** with a precise message.
- Entities define **ports** (`SiteRepository`, `MenuRepository`). `infrastructure/content` implements them;
  `composition/container.ts` is the only place that chooses the adapter. Sections never read content directly.
- Money is **integer minor units** in the domain (JSON uses major units for editors and is converted once at the
  boundary) and is formatted in one place.
- Images are resolved by key (`food/pizza`) through `infrastructure/images`; a raster file wins over the SVG
  placeholder with the same base name.
- A unit test validates the real JSON against the schemas, checks relationships (unique ids, every item has a known
  category, every category has items, enough popular items, every image key has a file) and checks that bad content is
  rejected.

## Consequences

- Swapping in a CMS is a new adapter plus a one-line change in the container.
- Placeholders (business name, address, phone, prices, copy, art) are ordinary content and assets, replaceable without
  code changes.
- Relationships between files are checked by tests rather than by the schema, because collections are validated
  independently. (An item with an unknown category also fails the build, in the menu adapter.)
