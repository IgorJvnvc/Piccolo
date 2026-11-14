import AxeBuilder from '@axe-core/playwright';
import { expect, ready, test } from './fixtures';

test.describe('accessibility (axe)', () => {
  test('home page has no serious or critical violations', async ({ page }) => {
    await ready(page);
    // Let reveal scenes finish so contrast is measured on final colors, not mid-fade.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1800);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })),
    ).toEqual([]);
  });
});
