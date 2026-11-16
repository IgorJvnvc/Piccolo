import { expect, test as base } from '@playwright/test';

/**
 * Collects console errors / page errors / failed requests so every test can assert a clean run.
 *
 * `introSeen` (default true) marks the entry intro as already seen, the way the page itself would be skipped for a visitor who has
 * seen it, so the 5 seconds of orange do not sit in front of every test. `intro.spec.ts` turns it off.
 */
export const test = base.extend<{ problems: string[]; introSeen: boolean }>({
  introSeen: [true, { option: true }],
  context: async ({ context, introSeen }, use) => {
    if (introSeen) {
      await context.addInitScript(() => {
        try {
          window.sessionStorage.setItem('piccolo:intro', 'seen');
        } catch {
          // an opaque origin (about:blank) has no storage
        }
      });
    }
    await use(context);
  },
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
 * Resolves once every `idle` enhancement has had its turn: the runtime queued them before READY and idle callbacks run in the
 * order they were queued. Needed before asserting that an enhancement did NOT run, which would otherwise pass too early.
 */
export async function settled(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestIdleCallback(() => resolve())));
}

/**
 * Scrolls through the whole page so every once-only scene plays, then returns to the top once each reveal target has been
 * handed over from the CSS pre-state (`data-revealed`). The scenes themselves may still be playing out.
 *
 * A scene starts when its section is seen, and a section is only seen in a rendered frame. Pacing the sweep by time lets a
 * stalled machine outrun its own frames and skip a section entirely (it then never reveals, and the wait times out), so
 * each position gets two frames. The jumps are instant: the page's smooth scrolling would glide on.
 */
export async function revealAll(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async () => {
    const frames = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await frames();
    }
  });
  // How long the last scene takes to start depends on the machine (GSAP has to download first), so wait for it.
  await page.waitForFunction(() => document.querySelectorAll('[data-reveal]:not([data-revealed])').length === 0, undefined, { timeout: 20_000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
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
