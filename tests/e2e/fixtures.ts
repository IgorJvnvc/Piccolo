import { expect, test as base } from '@playwright/test';

/** Collects console errors / page errors / failed requests so every test can assert a clean run. */
export const test = base.extend<{ problems: string[] }>({
  problems: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`));
    page.on('response', (response) => {
      if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
    });
    await use(problems);
  },
});

export { expect };

/** Waits until the enhancement runtime has booted (window.__PICCOLO_READY__). */
export async function ready(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Waits for an Astro island to finish hydrating (Astro removes the `ssr` attribute from `astro-island`; the component is named by `component-export`).
 * Islands hydrate on idle/media, so interacting before this is a race the app handles but tests should not rely on.
 */
export async function hydrated(page: import('@playwright/test').Page, component: string): Promise<void> {
  await page.waitForFunction(
    (name) => {
      const island = Array.from(document.querySelectorAll('astro-island')).find(
        (el) => el.getAttribute('component-export') === name,
      );
      return island !== undefined && !island.hasAttribute('ssr');
    },
    component,
    { timeout: 20_000 },
  );
}
