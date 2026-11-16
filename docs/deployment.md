# Deployment: GitHub and Vercel

Piccolo builds to a folder of static files (`dist/`), so any static host works. This page covers the setup used for the public demo:
the code on GitHub, the site on Vercel, a new deployment on every push.

## 1. Put the code on GitHub

```bash
git remote add origin https://github.com/IgorJvnvc/Piccolo.git
git push -u origin main
```

Git asks you to sign in the first time. Sign in as the account that owns the repository: a machine can hold credentials for a different
GitHub account (Git Credential Manager keeps one per host), and a push as the wrong account fails with a 403.

## 2. Host it on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub and choose **Add New... > Project**, then import `IgorJvnvc/Piccolo`
   (Vercel asks for access to that repository the first time).
2. Vercel recognises Astro. The settings it should show, none of which need changing:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Astro |
   | Install command | `npm install` |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Node.js version | 22.x or newer (the project needs 22.23.4+) |

3. Deploy. The build needs network access, because the three fonts are downloaded from Google Fonts and self-hosted in the build; Vercel
   builds have it.

After that, every push to `main` publishes to production and every other branch or pull request gets its own preview URL.

## What the repository configures for Vercel

- **`vercel.json`** gives everything under `/_astro/` (the hashed scripts, images and fonts) a one-year immutable cache. The page itself
  keeps Vercel's default so an update shows at once.
- **`astro.config.ts`** reads `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets while it builds, and uses it as `site`. The canonical
  link, the Open Graph tags and the structured data therefore carry the real address with no edit. Outside Vercel the value falls back to
  `https://piccolo.example`.

## Custom domain

Add the domain under the project's **Settings > Domains**. Vercel then reports the domain as the production URL, so the canonical link
follows it. If the build does not pick it up, set `site` in `astro.config.ts` to the domain.

## The demo is placeholder content

The name, address, phone number, hours and artwork are placeholders (see the [go-live checklist](../README.md#go-live-checklist)), and the
page publishes them as structured data for a restaurant. Until the real details are in, keep the demo out of search results by adding
this entry to `vercel.json`, then remove it at go-live:

```json
{
  "source": "/(.*)",
  "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }]
}
```

## Check a deployment

- `npm run verify:all` passes locally before the push; Vercel only runs the build.
- Open the deployment on a phone and on a laptop and scroll the whole page once: the sections reveal as you reach them.
- View the page source: the `<link rel="canonical">` should name the deployment's own address, not `piccolo.example`.