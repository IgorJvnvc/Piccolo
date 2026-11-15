import { expect, ready, test } from './fixtures';

/*
 * The entry intro (src/sections/intro): a pizza spins on orange, splits, and each slice leaves with its triangle of orange; the landing
 * page's own load animations start only after the last one has gone. Every other spec runs with it marked as seen (fixtures.ts).
 */
test.describe('entry intro', () => {
  test.use({ introSeen: false });

  test('a pizza 25-33% of the screen spins on orange, and the hero starts only after every slice has left', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('data-intro', '');

    const overlay = page.locator('[data-intro-root]');
    await expect(overlay).toBeVisible();

    // The pizza box is the last child (it pops in, which takes 0.5 s, and `ready` has already waited longer than that).
    const pizza = await overlay.locator(':scope > :last-child').boundingBox();
    const viewport = page.viewportSize();
    if (!pizza || !viewport) throw new Error('no pizza box or viewport');
    const share = pizza.width / Math.min(viewport.width, viewport.height);
    expect(share).toBeGreaterThan(0.25);
    expect(share).toBeLessThan(0.33);
    // It is in the middle of the screen.
    expect(Math.abs(pizza.x + pizza.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(Math.abs(pizza.y + pizza.height / 2 - viewport.height / 2)).toBeLessThan(2);

    // Frame by frame until the hero has appeared: it must never show while any of the intro is still on screen.
    const early = await page.evaluate(
      () =>
        new Promise<{ violations: number; frames: number; sawHero: boolean }>((resolve) => {
          const root = document.querySelector('[data-intro-root]');
          const line = document.querySelector('h1 span');
          if (!root || !line) throw new Error('no intro or hero');
          let violations = 0;
          let frames = 0;
          const started = performance.now();
          const tick = (): void => {
            frames += 1;
            const hero = Number(getComputedStyle(line).opacity);
            if (hero > 0 && getComputedStyle(root).visibility !== 'hidden') violations += 1;
            if (hero >= 1 || performance.now() - started > 9000) resolve({ violations, frames, sawHero: hero >= 1 });
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    expect(early.sawHero).toBe(true);
    expect(early.violations).toBe(0);

    await expect(overlay).toBeHidden();
  });

  test('is skipped for reduced motion; a URL with a #hash (the page writes one itself) plays it and starts at the top', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', '');
    await expect(page.locator('[data-intro-root]')).toBeHidden();
    await expect(page.locator('h1 span').first()).toHaveCSS('opacity', '1');

    // Leave the page first: going from / to /#menu would only be a fragment navigation, not a load.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('about:blank');
    await page.goto('/#menu');
    await expect(page.locator('html')).toHaveAttribute('data-intro', '');
    await expect(page.locator('[data-intro-root]')).toBeVisible();
    expect(await page.evaluate(() => [window.location.hash, window.scrollY])).toEqual(['', 0]);
  });
});
