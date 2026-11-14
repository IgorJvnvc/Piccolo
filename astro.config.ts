import preact from '@astrojs/preact';
import { defineConfig, fontProviders } from 'astro/config';

/**
 * Piccolo: static marketing site.
 *
 * - Preact (compat) powers exactly two interactive islands (MobileNav, MenuBrowser).
 * - Everything else is static HTML + CSS, enhanced by lazy `*.scene.ts` / `*.behavior.ts` modules.
 * - `build.target` is lowered to the TV browser floor (Chromium 94: LG webOS 23+, Samsung Tizen 2023+).
 *   Older TVs still receive readable static HTML + CSS because nothing critical depends on JS.
 */
export default defineConfig({
  site: 'https://piccolo.example',
  output: 'static',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  prefetch: false,
  build: {
    // One page: inline the CSS to save a round trip (matters on slow TV browsers).
    inlineStylesheets: 'always',
  },
  integrations: [preact({ compat: true })],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Playfair Display',
      cssVariable: '--font-display',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-sans',
      weights: ['300 800'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Caveat Brush',
      cssVariable: '--font-script',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['cursive'],
    },
  ],
  vite: {
    build: {
      target: ['chrome94', 'safari15', 'firefox100'],
      cssTarget: 'chrome94',
    },
  },
});
