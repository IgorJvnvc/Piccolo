import { expect, hydrated, ready, test } from './fixtures';

test.describe('TV', () => {
  test('is classified as a TV on the lite tier with no smooth scroll', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('data-device', 'tv');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'lite');
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  });

  test('arrow keys move focus between controls (D-pad)', async ({ page }) => {
    await ready(page);
    const first = page.getByRole('banner').getByRole('link', { name: 'Menu' });
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Offers' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Find Us' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Offers' })).toBeFocused();
  });

  test('the D-pad stays inside an open dialog', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    await page.locator('#menu').getByRole('button', { name: 'Details: Pizza Margherita' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Pizza Margherita' });
    await expect(dialog.getByRole('button', { name: 'Close details' })).toBeFocused();

    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowUp']) {
      await page.keyboard.press(key);
      await expect(dialog.locator(':focus')).toHaveCount(1);
    }
  });

  test('focus ring is large enough for a 10-foot UI', async ({ page }) => {
    await ready(page);
    await page.getByRole('banner').getByRole('link', { name: 'Menu' }).focus();
    await page.keyboard.press('Tab');
    const width = await page.evaluate(() => parseFloat(getComputedStyle(document.activeElement as Element).outlineWidth));
    expect(width).toBeGreaterThanOrEqual(4);
  });

  test('body copy is at least 16 CSS px (readable from a couch)', async ({ page }) => {
    await ready(page);
    const size = await page.locator('[data-enhance="about"] p').nth(1).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
});
