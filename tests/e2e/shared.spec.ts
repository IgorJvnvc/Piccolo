import { expect, hydrated, ready, test } from './fixtures';

/** Runs on every device class. */
test.describe('page (all devices)', () => {
  test('boots without console problems and detects the device', async ({ page, problems }) => {
    await ready(page);
    const html = page.locator('html');
    await expect(html).toHaveClass(/\bjs\b/);
    await expect(html).toHaveAttribute('data-device', /^(phone|tablet|laptop|desktop|tv)$/);
    await expect(html).toHaveAttribute('data-motion', /^(full|lite|static)$/);
    expect(problems).toEqual([]);
  });

  test('has one h1, landmarks and the hero copy', async ({ page }) => {
    await ready(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fast Food');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeAttached();
  });

  test('never scrolls horizontally', async ({ page }) => {
    await ready(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('menu categories switch with correct ARIA state', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    const hotDogs = page.getByRole('tab', { name: 'Hot Dogs' });
    await hotDogs.scrollIntoViewIfNeeded();
    await hotDogs.click();
    await expect(hotDogs).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Hot Dogs' })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Pizza' })).toBeHidden();
  });

  // The Popular section and the Menu render the same card, so each opener is scoped to its own section.
  // (An unscoped `.first()` is unstable: which card it resolves to depends on what has been revealed.)
  for (const [label, scope] of [
    ['a Popular card', '[data-enhance="popular"]'],
    ['a Menu card', '#menu'],
  ] as const) {
    test(`quick view from ${label} opens, traps focus, closes with Escape and returns focus`, async ({ page }) => {
      await ready(page);
      await hydrated(page, 'MenuBrowser');
      const opener = page.locator(scope).getByRole('button', { name: 'Details: Pizza Margherita' });
      await opener.scrollIntoViewIfNeeded();
      await opener.click();

      const dialog = page.getByRole('dialog', { name: 'Pizza Margherita' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Contains:');

      // Focus moves into the dialog on open (which also means its key handlers are attached).
      await expect(dialog.getByRole('button', { name: 'Close details' })).toBeFocused();

      // Tab never leaves the dialog.
      for (let i = 0; i < 3; i += 1) {
        await page.keyboard.press('Tab');
        await expect(dialog.locator(':focus')).toHaveCount(1);
      }

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }

  test('follow card expands once it is scrolled into view', async ({ page }) => {
    await ready(page);
    const stage = page.locator('#offers [data-part="stage"]');
    await expect(stage).toHaveAttribute('data-state', 'idle');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-state', 'open');
    await expect.poll(async () => (await page.locator('#offers [data-part="bg"]').boundingBox())?.width ?? 0).toBeGreaterThan(
      ((await stage.boundingBox())?.width ?? 0) - 2,
    );
  });
});
