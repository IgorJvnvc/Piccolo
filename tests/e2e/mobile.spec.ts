import { expect, hydrated, ready, test } from './fixtures';

test.describe('phone and tablet', () => {
  test('touch devices keep native scrolling (no smooth-scroll library)', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    await expect(page.locator('html')).toHaveAttribute('data-pointer', 'coarse');
  });

  test('mobile menu opens as a dialog, navigates and closes', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-scroll-lock', '');

    await dialog.getByRole('link', { name: 'Find Us' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-lock', '');
    await expect(page).toHaveURL(/#visit$/);
  });

  test('mobile menu closes with Escape and returns focus to its button', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('popular dishes become a horizontal snap scroller below 768px', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 768, 'phone layout only');
    await ready(page);
    const grid = page.locator('[data-enhance="popular"] ul');
    const overflowX = await grid.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });
});
