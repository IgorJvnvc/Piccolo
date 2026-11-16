import { expect, ready, settled, test } from './fixtures';

const CATEGORIES = ['Pizza & Calzones', 'Hot Dogs & Sandwiches', 'Sweet Pies & Sandwiches', 'Salads, Soups & Sides', 'Hot Drinks', 'Cold Drinks'];

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('uses the static tier and shows everything immediately', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'static');
    // Nothing is left pre-hidden for a scene that will never run.
    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-reveal]')).filter((el) => getComputedStyle(el).opacity === '0').length,
    );
    expect(hidden).toBe(0);
    const stageState = await page.locator('#offers [data-part="stage"]').getAttribute('data-state');
    expect(stageState).toBe('idle'); // attribute is untouched, but CSS only applies idle styling when motion is allowed
    const bgWidth = (await page.locator('#offers [data-part="bg"]').boundingBox())?.width ?? 0;
    const stageWidth = (await page.locator('#offers [data-part="stage"]').boundingBox())?.width ?? 1;
    expect(bgWidth).toBeGreaterThan(stageWidth - 2);
  });

  test('keeps the hero food still: no parallax', async ({ page }) => {
    await ready(page);
    await settled(page);
    await page.mouse.move(20, 300);
    const hero = page.locator('[data-enhance="hero"]');
    await expect(hero).not.toHaveAttribute('data-parallax', '');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('still renders the whole page, with every menu category listed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fast Food');
    await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible();
    // no tab UI, but every category is present and visible, stacked
    await expect(page.getByRole('tab', { includeHidden: true })).toHaveCount(6);
    await expect(page.getByRole('tab', { includeHidden: true }).first()).toBeHidden();
    for (const name of CATEGORIES) {
      await expect(page.getByRole('heading', { name, level: 3, exact: true })).toBeVisible();
    }
    const stageWidth = (await page.locator('#offers [data-part="stage"]').boundingBox())?.width ?? 1;
    const bgWidth = (await page.locator('#offers [data-part="bg"]').boundingBox())?.width ?? 0;
    expect(bgWidth).toBeGreaterThan(stageWidth - 2);
    // Every page of a long category is shown, and the pager that would turn them is not.
    await expect(page.getByRole('heading', { name: 'Ultra Energy', level: 3 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Cold Drinks pages', includeHidden: true })).toBeHidden();
  });
});

// An island whose code cannot be loaded would leave a dead tab row and a dead hamburger, which are worse than none: the bootstrap
// reacts to Astro's `astro:hydration-error` (fired after its own single retry) by falling back to the no-JS layout.
test.describe('an island that never arrives', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('leaves the no-JS layout instead of controls that do nothing', async ({ page }) => {
    // Block the island chunks the way an ad blocker or a flaky connection would. Astro retries a failed import once with
    // `?astro-retry=...`, so the match has to cover that too. The runtime itself loads.
    const chunks = new Set(Array.from((await (await page.request.get('/')).text()).matchAll(/component-url="([^"]+)"/g), (match) => match[1]));
    await page.route(/\/_astro\/[^?]+\.js/, (route) => (chunks.has(new URL(route.request().url()).pathname) ? route.abort() : route.continue()));

    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/no-enhance/, { timeout: 10_000 });
    expect(await page.evaluate(() => window.__PICCOLO_READY__)).toBe(true); // it is the islands that failed, not the runtime

    await expect(page.getByRole('tab', { includeHidden: true }).first()).toBeHidden();
    for (const name of CATEGORIES) {
      await expect(page.getByRole('heading', { name, level: 3, exact: true })).toBeVisible();
    }
    await expect(page.locator('[data-details]:visible')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });
});