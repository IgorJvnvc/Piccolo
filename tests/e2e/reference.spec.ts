import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { expect, ready, revealAll, test } from './fixtures';

/**
 * Layout fidelity against the reference reel, at the reel's viewport (1253 x 712).
 *
 * The baseline (reference.golden.json) holds the boxes of the key elements in the sections the reel shows (hero, about,
 * popular, follow card, footer). It was verified against the reel by overlaying screenshots, and each box is compared
 * with a small tolerance, so accidental layout drift is caught. If you change the layout ON PURPOSE:
 *
 *   1. re-check it against the reel (node scripts/dev/scan.mjs, then python scripts/dev/match_frames.py),
 *   2. regenerate the baseline:  UPDATE_GOLDEN=1 npx playwright test --project=reference
 *   3. review the diff of reference.golden.json in the same change.
 *
 * Positions are relative to the element's own section, so unrelated content (the menu, the visit section) cannot shift them.
 */

const GOLDEN = fileURLToPath(new URL('./reference.golden.json', import.meta.url));
/** px. Sub-pixel differences between machines are expected; real layout changes are larger. */
const TOLERANCE = 2;

interface Target {
  readonly key: string;
  readonly selector: string;
  /** Which match to measure (default: the first). */
  readonly index?: number;
  /** Selector of the section the position is measured against. */
  readonly within: string;
}

const HERO = '[data-enhance="hero"]';
const ABOUT = '#about';
const POPULAR = '[data-enhance="popular"]';
const FOLLOW = '#offers';
const FOOTER = 'footer';

const TARGETS: readonly Target[] = [
  { key: 'hero.section', selector: HERO, within: HERO },
  { key: 'hero.title', selector: `${HERO} h1`, within: HERO },
  { key: 'hero.cta', selector: `${HERO} a[href="#menu"]`, within: HERO },

  { key: 'about.section', selector: ABOUT, within: ABOUT },
  { key: 'about.title', selector: `${ABOUT} h2`, within: ABOUT },
  { key: 'about.cta', selector: `${ABOUT} a[href="#menu"]`, within: ABOUT },

  { key: 'popular.section', selector: POPULAR, within: POPULAR },
  { key: 'popular.title', selector: `${POPULAR} h2`, within: POPULAR },
  { key: 'popular.card.0', selector: `${POPULAR} article`, index: 0, within: POPULAR },
  { key: 'popular.card.1', selector: `${POPULAR} article`, index: 1, within: POPULAR },
  { key: 'popular.card.2', selector: `${POPULAR} article`, index: 2, within: POPULAR },

  { key: 'follow.section', selector: FOLLOW, within: FOLLOW },
  { key: 'follow.card', selector: `${FOLLOW} [data-part="stage"]`, within: FOLLOW },
  { key: 'follow.title', selector: `${FOLLOW} h2`, within: FOLLOW },

  { key: 'footer.section', selector: FOOTER, within: FOOTER },
  { key: 'footer.heading.0', selector: `${FOOTER} h2`, index: 0, within: FOOTER },
  { key: 'footer.heading.1', selector: `${FOOTER} h2`, index: 1, within: FOOTER },
  { key: 'footer.heading.2', selector: `${FOOTER} h2`, index: 2, within: FOOTER },
];

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

type Boxes = Record<string, Box>;

/** Plays every once-only scene so each element is measured in its settled, final state. */
async function settle(page: Page): Promise<void> {
  await revealAll(page);
  await page.waitForTimeout(400);
}

async function measure(page: Page): Promise<Boxes> {
  return page.evaluate((targets) => {
    const round = (value: number): number => Math.round(value * 10) / 10;
    const boxes: Record<string, { left: number; top: number; width: number; height: number }> = {};
    for (const { key, selector, index = 0, within } of targets) {
      const element = document.querySelectorAll(selector)[index];
      const section = document.querySelector(within);
      if (!element || !section) throw new Error(`Missing target "${key}" (${selector}[${index}] within ${within})`);
      const rect = element.getBoundingClientRect();
      const base = section.getBoundingClientRect();
      boxes[key] = { left: round(rect.left), top: round(rect.top - base.top), width: round(rect.width), height: round(rect.height) };
    }
    return boxes;
  }, TARGETS);
}

const sameBoxes = (a: Boxes, b: Boxes): boolean =>
  Object.entries(a).every(([key, box]) => (['left', 'top', 'width', 'height'] as const).every((property) => Math.abs(box[property] - (b[key]?.[property] ?? Number.NaN)) < 0.2));

/** Measures once nothing is moving any more: two measurements a moment apart agree (the last scenes may still be playing out). */
async function measureSettled(page: Page): Promise<Boxes> {
  let previous = await measure(page);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.waitForTimeout(250);
    const current = await measure(page);
    if (sameBoxes(previous, current)) return current;
    previous = current;
  }
  return previous;
}

test.describe('layout matches the reference reel (1253 x 712)', () => {
  test('key element boxes stay within tolerance of the verified baseline', async ({ page }) => {
    await ready(page);
    await settle(page);
    const actual = await measureSettled(page);

    if (process.env['UPDATE_GOLDEN']) {
      writeFileSync(GOLDEN, `${JSON.stringify(actual, null, 2)}\n`);
      test.info().annotations.push({ type: 'baseline', description: `rewrote ${GOLDEN}` });
      return;
    }

    const expected = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Boxes;
    const drift: string[] = [];
    for (const { key } of TARGETS) {
      const want = expected[key];
      const got = actual[key];
      if (!want || !got) {
        drift.push(`${key}: not in the baseline (run with UPDATE_GOLDEN=1 after verifying the layout)`);
        continue;
      }
      for (const property of ['left', 'top', 'width', 'height'] as const) {
        const delta = got[property] - want[property];
        if (Math.abs(delta) > TOLERANCE) {
          drift.push(`${key}.${property}: expected ${want[property]} (+/-${TOLERANCE}), got ${got[property]} (${delta > 0 ? '+' : ''}${delta.toFixed(1)})`);
        }
      }
    }
    expect(drift, 'layout drifted from the verified reference baseline').toEqual([]);
  });
});
