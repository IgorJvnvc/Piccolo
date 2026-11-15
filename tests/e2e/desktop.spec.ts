import { expect, ready, test } from './fixtures';

test.describe('desktop', () => {
  test('uses smooth scroll (Lenis) and the full motion tier', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('data-device', /^(laptop|desktop)$/);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/, { timeout: 10_000 });
  });

  test('navbar scrolls away, hides on scroll down and returns on scroll up', async ({ page }) => {
    await ready(page);
    const nav = page.locator('[data-enhance="navbar"]');
    await expect(nav).toHaveAttribute('data-state', 'top');

    await page.mouse.move(700, 400);
    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(40);
    }
    await expect(nav).toHaveAttribute('data-state', 'hidden', { timeout: 8000 });

    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(40);
    }
    await expect(nav).toHaveAttribute('data-state', 'shown', { timeout: 8000 });
    await expect(nav).toBeInViewport();
  });

  test('anchor links scroll to their section, which lands where the stylesheet puts it, and keep the hash', async ({ page }) => {
    await ready(page);
    await page.getByRole('banner').getByRole('link', { name: 'Find Us' }).click();
    await expect(page).toHaveURL(/#visit$/);
    // scroll-padding-top (room for the navbar) plus the section's scroll-margin-top: Lenis and the browser each honour it once, never twice.
    const inset = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(document.getElementById('visit')!).scrollMarginTop),
    );
    await expect.poll(async () => Math.round((await page.locator('#visit').boundingBox())?.y ?? 9999), { timeout: 8000 }).toBeCloseTo(inset, -1);
  });

  test('the phone action dock is not shown on a desktop', async ({ page }) => {
    await ready(page);
    await expect(page.getByRole('group', { name: 'Quick actions' })).toBeHidden();
  });

  test('the logo goes back to the top and takes keyboard focus with it', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
    await page.getByRole('banner').getByRole('link', { name: /PICCOLO/ }).focus(); // brings the hidden bar back
    await page.keyboard.press('Enter');

    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 8000 }).toBeLessThan(5);
    await expect(page.locator('body')).toBeFocused();
    await expect(page).not.toHaveURL(/#/);
  });

  test('the navbar marks nothing on the hero, then the section in view as current, Contact once the page ends', async ({ page }) => {
    await ready(page);
    const current = page.getByRole('banner').locator('[aria-current="true"]');
    await expect(current).toHaveCount(0); // the page opens on the hero, so no link may claim a section yet
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(current).toHaveText('Contact');
    await page.evaluate(() => document.getElementById('visit')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(current).toHaveText('Find Us');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(current).toHaveCount(0);
  });

  test('a hidden navbar comes back when keyboard focus enters it', async ({ page }) => {
    await ready(page);
    const nav = page.locator('[data-enhance="navbar"]');
    await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
    await expect(nav).toHaveAttribute('data-state', 'hidden');
    await expect(nav).not.toBeInViewport();

    await nav.getByRole('link', { name: 'Menu' }).focus();
    await expect(nav).toBeInViewport();
  });

  test('hero art intro plays from CSS (no JS needed)', async ({ page }) => {
    await page.goto('/');
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toBeVisible();
    await expect.poll(async () => Number(await title.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  });
});
