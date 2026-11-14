import { expect, ready, test } from './fixtures';

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
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('still renders the whole page, with every menu category listed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fast Food');
    await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible();
    // no tab UI, but every category is present and visible, stacked
    await expect(page.getByRole('tab', { includeHidden: true })).toHaveCount(4);
    await expect(page.getByRole('tab', { includeHidden: true }).first()).toBeHidden();
    for (const name of ['Pizza', 'Hot Dogs', 'Sandwiches', 'Drinks']) {
      await expect(page.getByRole('heading', { name, level: 3 }).first()).toBeVisible();
    }
    const stageWidth = (await page.locator('#offers [data-part="stage"]').boundingBox())?.width ?? 1;
    const bgWidth = (await page.locator('#offers [data-part="bg"]').boundingBox())?.width ?? 0;
    expect(bgWidth).toBeGreaterThan(stageWidth - 2);
  });
});
