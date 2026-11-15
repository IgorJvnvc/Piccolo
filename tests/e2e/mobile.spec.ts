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
    await expect(page.locator('#visit')).toBeFocused(); // the menu does not take focus back from the section it just sent you to
  });

  test('mobile menu keeps Shift+Tab inside it, even after a tap on an empty spot', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();

    await dialog.click({ position: { x: 2, y: 400 } }); // the panel's own padding: focus lands on the dialog itself
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);
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
