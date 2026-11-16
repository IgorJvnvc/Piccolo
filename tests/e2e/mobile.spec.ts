import { expect, hydrated, ready, settled, test } from './fixtures';

test.describe('phone and tablet', () => {
  test('touch devices keep native scrolling (no smooth-scroll library)', async ({ page }) => {
    await ready(page);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    await expect(page.locator('html')).toHaveAttribute('data-pointer', 'coarse');
  });

  test('the dock already holds Call and Directions, so the hero keeps Call us hidden and the pointer parallax off', async ({ page }) => {
    await ready(page);
    await settled(page);
    await expect(page.locator('[data-enhance="hero"] a[href^="tel:"]')).toBeHidden();
    await expect(page.locator('[data-enhance="hero"]')).not.toHaveAttribute('data-parallax', '');
  });

  test('the scroll-to-top button shows once scrolled and sits above the dock, not on it', async ({ page }) => {
    await ready(page);
    const toTop = page.getByRole('link', { name: 'Scroll to top' });
    await expect(toTop).toHaveCount(0);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await expect(toTop).toBeVisible();
    const button = await toTop.boundingBox();
    const dock = await page.getByRole('group', { name: 'Quick actions' }).boundingBox();
    if (!button || !dock) throw new Error('no button or dock box');
    expect(button.y + button.height).toBeLessThanOrEqual(dock.y);
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
    // The browser's own scroll (no Lenis on touch) puts the section at the stylesheet's inset, too.
    const inset = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(document.getElementById('visit')!).scrollMarginTop),
    );
    await expect.poll(async () => Math.round((await page.locator('#visit').boundingBox())?.y ?? 9999), { timeout: 8000 }).toBeCloseTo(inset, -1);
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

  test('the action dock keeps call, WhatsApp, directions and the open status in reach', async ({ page }) => {
    await ready(page);
    const dock = page.getByRole('group', { name: 'Quick actions' });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Call' })).toHaveAttribute('href', /^tel:/);
    await expect(dock.getByRole('link', { name: 'WhatsApp' })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Directions' })).toBeVisible();
    await expect(dock).toContainText(/(Open|Closed) now/); // the open-status behaviour has run

    // It slides up once the page is ready, stays at the bottom of the screen, and the page leaves room for it: the last link is not hidden behind it.
    await expect(dock).toBeInViewport({ ratio: 1 });
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    const last = await page.getByRole('link', { name: /Back to top/ }).boundingBox();
    const bar = await dock.boundingBox();
    expect((last?.y ?? 9999) + (last?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
  });

  test('popular dishes become a horizontal snap scroller below 768px', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 768, 'phone layout only');
    await ready(page);
    const grid = page.locator('[data-enhance="popular"] ul');
    const overflowX = await grid.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });

  test('every control below 1024px is a thumb-sized target (a dish card is its own hit area, so its arrow is left out)', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    const controls = [
      ...(await page.getByRole('banner').getByRole('link').all()),
      ...(await page.getByRole('banner').getByRole('button').all()),
      ...(await page.getByRole('contentinfo').getByRole('link').all()),
      ...(await page.getByRole('group', { name: 'Quick actions' }).getByRole('link').all()),
      ...(await page.getByRole('tab').all()),
      ...(await page.locator('#offers').getByRole('link', { name: /^\+/ }).all()),
    ];
    expect(controls.length).toBeGreaterThan(15);
    const small: string[] = [];
    for (const control of controls) {
      const box = await control.boundingBox();
      if (box && box.height < 43.5) small.push(`${(await control.textContent())?.trim() || (await control.getAttribute('aria-label'))}: ${Math.round(box.width)}x${Math.round(box.height)}`);
    }
    expect(small).toEqual([]);
  });

  test('a 320px screen does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});
