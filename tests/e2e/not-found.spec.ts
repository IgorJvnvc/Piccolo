import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const MISSING = '/this-page-does-not-exist';

test.describe('404 page', () => {
  test('missing addresses get a real 404 with the friendly page, kept out of search results', async ({ page, problems }) => {
    const response = await page.goto(MISSING);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('off the menu');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);

    // The 404 response itself is expected: the fixture records it as "http 404: <url>", and Chrome adds a generic
    // "Failed to load resource" console error. Any OTHER failing request would still appear as its own "http" entry.
    const unexpected = problems.filter(
      (problem) =>
        !problem.endsWith(MISSING) && !problem.startsWith('console.error: Failed to load resource: the server responded with a status of 404'),
    );
    expect(unexpected).toEqual([]);
  });

  test('links lead back to the real home page', async ({ page }) => {
    await page.goto(MISSING);

    // In-page links from the home page ("#menu") would point at nothing here.
    const footerMenuLink = page.getByRole('contentinfo').getByRole('link', { name: 'Menu', exact: true });
    await expect(footerMenuLink).toHaveAttribute('href', '/#menu');

    // The wordmark leads home, and no link claims to be the current page.
    await expect(page.getByRole('banner').getByRole('link', { name: /PICCOLO/ })).toHaveAttribute('href', '/');
    await expect(page.getByRole('banner').locator('[aria-current="true"]')).toHaveCount(0);

    const home = page.getByRole('link', { name: 'Back to the menu' });
    await expect(home).toHaveAttribute('href', '/');
    await home.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fast Food');
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    await page.goto(MISSING);
    await page.waitForFunction(() => window.__PICCOLO_READY__ === true);
    await page.evaluate(() => document.fonts.ready);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })),
    ).toEqual([]);
  });
});
