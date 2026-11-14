import AxeBuilder from '@axe-core/playwright';
import { expect, ready, revealAll, test } from './fixtures';

test.describe('accessibility (axe)', () => {
  test('home page has no serious or critical violations', async ({ page }) => {
    await ready(page);
    // Let reveal scenes finish so contrast is measured on final colors, not mid-fade.
    await revealAll(page);
    await page.waitForTimeout(1800);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })),
    ).toEqual([]);
  });
});
