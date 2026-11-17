import type { Locator, Page } from '@playwright/test';
import { expect, hydrated, ready, test } from './fixtures';

/**
 * The two islands' motion, in a real browser: the mobile menu's growing circle, the quick view's fade-and-settle, the tab pill's
 * slide and the cards' stagger. Each is checked frame by frame, because a state change that happens in one frame looks
 * "correct" to every other test. Also: reduced motion must not download GSAP and still fades, and a failed GSAP download must
 * leave every interaction working.
 */

type Frames = Array<[number, number]>;

declare global {
  interface Window {
    __frames?: Record<string, { rows: Frames; stopped: boolean }>;
  }
}

let samplers = 0;

/**
 * Starts reading `expression` on every animation frame. Do the thing, wait until the motion is over, then `stop()` for the
 * `[performance.now(), value]` rows. Nothing here depends on how long the interaction takes, so a slow machine cannot make
 * the recording end before the motion starts. It has taken its first frames before this returns, so there is a "before".
 */
async function sampling(page: Page, expression: string): Promise<{ stop: () => Promise<Frames> }> {
  samplers += 1;
  const key = `s${samplers}`;
  await page.evaluate(
    ({ source, id }) => {
      const read = new Function(`return (${source})`) as () => number;
      const store = { rows: [] as Frames, stopped: false };
      (window.__frames ??= {})[id] = store;
      const tick = (): void => {
        store.rows.push([performance.now(), read()]);
        if (!store.stopped) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { source: expression, id: key },
  );
  await page.waitForFunction((id) => (window.__frames?.[id]?.rows.length ?? 0) >= 2, key);
  return {
    stop: () =>
      page.evaluate((id) => {
        const store = window.__frames?.[id];
        if (!store) return [];
        store.stopped = true;
        return store.rows;
      }, key),
  };
}

/**
 * GSAP downloads in the background from the moment the page boots. An interaction before it arrives still works (it fades
 * with CSS instead), so the tests that look for the GSAP choreography wait for it first, as a visitor's first tap would.
 */
async function gsapReady(page: Page): Promise<void> {
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((entry) => /\/_astro\/ScrollTrigger\./.test(entry.name)));
  await page.waitForTimeout(300);
}

const MENU = '#mobile-menu';
/** The circle's radius in px; -1 = no menu in the DOM, -2 = menu without a clip (open and at rest). */
const RADIUS = `(() => {
  const panel = document.querySelector('${MENU}');
  if (!panel) return -1;
  const circle = /circle\\(([\\d.]+)px/.exec(getComputedStyle(panel).clipPath);
  return circle ? Number(circle[1]) : -2;
})()`;
const PANEL_OPACITY = `(() => { const panel = document.querySelector('${MENU}'); return panel ? Number(getComputedStyle(panel).opacity) : -1; })()`;

const QUICK_VIEW = '[role="dialog"][aria-labelledby="quick-view-title"]';
/** The quick view scrim's opacity, or -1 when the dialog is not in the DOM. */
const SCRIM_OPACITY = `(() => { const dialog = document.querySelector('${QUICK_VIEW}'); return dialog?.parentElement ? Number(getComputedStyle(dialog.parentElement).opacity) : -1; })()`;
/** The quick view panel's opacity (it fades over 0.32 s, the scrim over 0.2 s), or -1 when the dialog is not in the DOM. */
const PANEL_FADE = `(() => { const dialog = document.querySelector('${QUICK_VIEW}'); return dialog ? Number(getComputedStyle(dialog).opacity) : -1; })()`;

const isPhoneLayout = (page: Page): boolean => (page.viewportSize()?.width ?? 0) < 1024;
const GSAP_CHUNK = /\/_astro\/(gsap|ScrollTrigger)\.[^/]+\.js$/;

/** The values from the frames in which the thing was in the DOM (and, for the circle, clipped). */
const present = (rows: Frames): number[] => rows.map((row) => row[1]).filter((value) => value >= 0);
const between = (values: number[], low: number, high: number): number => values.filter((value) => value > low && value < high).length;
/** Frames that caught an opacity part-way through a fade. */
const fadeFrames = (rows: Frames): number => between(present(rows), 0.05, 0.95);
/** Frames that caught the circle part-way (between 5% and 95% of the largest radius seen). */
const growthFrames = (rows: Frames): number => {
  const radii = present(rows);
  const peak = Math.max(...radii);
  return between(radii, peak * 0.05, peak * 0.95);
};

/** Two frames further apart than this: the browser stalled. */
const STALL_MS = 120;
const TRIES = 3;
const stalled = (rows: Frames): boolean => rows.some((row, index) => index > 0 && row[0] - (rows[index - 1]?.[0] ?? row[0]) > STALL_MS);

/**
 * Records `expressions` frame by frame while `act` plays. Headless Chrome is software-rendered, so the first frame of something
 * big (the quick view's blurred scrim takes about 220 ms here) stalls, and the animation clock does not wait for it: the first
 * frame that lands already shows the fade at 97%, and none lands inside it. A recording that does not `show` the motion and
 * has such a stall in it proves nothing about the animation, so `undo` puts the page back and `act` runs again (three tries
 * at most). One that does not show it with every frame on time is a real failure, and is returned as it is.
 */
async function recordAll(
  page: Page,
  expressions: readonly string[],
  act: () => Promise<void>,
  undo: () => Promise<void>,
  shows: (recordings: Frames[]) => boolean,
): Promise<Frames[]> {
  for (let attempt = 1; ; attempt += 1) {
    const samplers: Array<Awaited<ReturnType<typeof sampling>>> = [];
    for (const expression of expressions) samplers.push(await sampling(page, expression));
    await act();
    const recordings = await Promise.all(samplers.map((sampler) => sampler.stop()));
    if (shows(recordings) || attempt >= TRIES || !stalled(recordings[0] ?? [])) return recordings;
    await undo();
  }
}

/** `recordAll` for one expression. */
async function record(
  page: Page,
  expression: string,
  act: () => Promise<void>,
  undo: () => Promise<void>,
  shows: (rows: Frames) => boolean,
): Promise<Frames> {
  const [rows = []] = await recordAll(page, [expression], act, undo, ([only = []]) => shows(only));
  return rows;
}

/** Opens the mobile menu and waits until `settled` reads `rest`. */
async function openMenu(page: Page, settled: string, rest: number): Promise<void> {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect.poll(() => page.evaluate(settled), { message: 'the menu at rest', timeout: 10_000 }).toBe(rest);
}

async function closeMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.locator(MENU)).toHaveCount(0);
}

async function openQuickView(page: Page, opener: Locator): Promise<void> {
  await opener.click();
  await expect.poll(() => page.evaluate(SCRIM_OPACITY), { message: 'resting scrim', timeout: 10_000 }).toBe(1);
  await expect.poll(() => page.evaluate(PANEL_FADE), { message: 'resting panel', timeout: 10_000 }).toBe(1);
}

async function closeQuickView(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.locator(QUICK_VIEW)).toHaveCount(0);
}

test.describe('the mobile menu', () => {
  test.beforeEach(({ page }) => {
    test.skip(!isPhoneLayout(page), 'the mobile menu only exists below 1024px');
  });

  test('opens as a circle that grows from the button, and ends with no clip left on it', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    await gsapReady(page);

    const rows = await record(
      page,
      RADIUS,
      () => openMenu(page, RADIUS, -2),
      () => closeMenu(page),
      (frames) => growthFrames(frames) >= 1,
    );

    // At rest the menu has no clip left on it (that is what `openMenu` waited for).
    expect(Math.max(...present(rows)), 'the circle reaches the far corner of the screen').toBeGreaterThan(300);
    expect(growthFrames(rows), 'frames caught mid-growth').toBeGreaterThanOrEqual(1);
    await expect(page.locator(`${MENU} [data-part="link"]`).last()).toHaveCSS('opacity', '1');
  });

  test('closes by shrinking back from the full circle, then leaves the DOM', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    await gsapReady(page);
    await openMenu(page, RADIUS, -2);

    const rows = await record(
      page,
      RADIUS,
      () => closeMenu(page),
      () => openMenu(page, RADIUS, -2),
      (frames) => {
        const radii = present(frames);
        return radii.length >= 1 && (radii[0] ?? 0) > 300 && (radii.at(-1) ?? 0) < (radii[0] ?? 0);
      },
    );
    const radii = present(rows);

    expect(radii.length, 'frames caught shrinking').toBeGreaterThanOrEqual(1);
    expect(radii[0] ?? 0, 'it starts from the full circle').toBeGreaterThan(300);
    expect(radii.at(-1) ?? 0, 'and ends at nothing').toBeLessThan(radii[0] ?? 0);
  });

  test('opening and closing 120 ms apart leaves the menu gone, not stuck half open', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MobileNav');
    await gsapReady(page);

    // Timed inside the page so that test latency cannot change how far the menu got. (That it closes from the size it had
    // reached is pinned with the real GSAP in tests/unit/features/mobile-nav-motion.spec.ts.)
    await page.evaluate(async () => {
      const toggle = document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-menu"]');
      toggle?.click();
      await new Promise((resolve) => setTimeout(resolve, 120));
      toggle?.click();
    });
    await expect(page.locator(MENU)).toHaveCount(0);
  });
  test('reduced motion: GSAP is never downloaded, and the menu fades instead of growing', async ({ page }) => {
    const downloads: string[] = [];
    page.on('request', (request) => GSAP_CHUNK.test(request.url()) && downloads.push(request.url()));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await hydrated(page, 'MobileNav');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'static');

    const fadedIn = await record(
      page,
      PANEL_OPACITY,
      () => openMenu(page, PANEL_OPACITY, 1),
      () => closeMenu(page),
      (frames) => fadeFrames(frames) >= 1,
    );
    expect(fadeFrames(fadedIn), 'frames caught mid-fade').toBeGreaterThanOrEqual(1);
    expect(await page.evaluate(RADIUS), 'no circle: the menu simply fades').toBe(-2);

    const fadedOut = await record(
      page,
      PANEL_OPACITY,
      () => closeMenu(page),
      () => openMenu(page, PANEL_OPACITY, 1),
      (frames) => fadeFrames(frames) >= 1,
    );
    expect(fadeFrames(fadedOut), 'frames caught mid-fade').toBeGreaterThanOrEqual(1);
    expect(downloads, 'GSAP downloads on the static tier').toEqual([]);
  });

  test('when GSAP cannot be downloaded the menu still opens, fades and closes', async ({ page }) => {
    await page.route(GSAP_CHUNK, (route) => route.abort());
    await ready(page);
    await hydrated(page, 'MobileNav');

    await page.getByRole('button', { name: 'Open menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Find Us' })).toBeVisible();
    await expect(dialog).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(page.locator(MENU)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });
});

test.describe('the quick view', () => {
  const prepare = async (page: Page) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    await gsapReady(page);
    const opener = page.locator('#menu').getByRole('button', { name: 'Details: Pizza Slice' });
    await opener.scrollIntoViewIfNeeded();
    return opener;
  };

  test('fades in and settles, and plays out before it leaves the DOM', async ({ page }) => {
    const opener = await prepare(page);

    const opening = await record(
      page,
      PANEL_FADE,
      () => openQuickView(page, opener),
      () => closeQuickView(page),
      (frames) => fadeFrames(frames) >= 1,
    );
    expect(fadeFrames(opening), 'frames caught mid-fade').toBeGreaterThanOrEqual(1);
    await expect(page.locator(QUICK_VIEW)).toBeVisible();

    const closing = await record(
      page,
      PANEL_FADE,
      () => closeQuickView(page),
      () => openQuickView(page, opener),
      (frames) => fadeFrames(frames) >= 1,
    );
    expect(fadeFrames(closing), 'frames caught mid-fade').toBeGreaterThanOrEqual(1);
    await expect(opener).toBeFocused();
  });

  test('draws its animated parts on their own compositor layers', async ({ page }) => {
    // Without them the entrance is painted into the page's root layer and every frame re-rasters the whole screen: on a real phone
    // that was 172 raster tasks in 900 ms and 9 frames over 20 ms (ADR 0016). The headless browser cannot show the cost, only the cause.
    const opener = await prepare(page);
    await openQuickView(page, opener);

    const dialog = page.locator(QUICK_VIEW);
    await expect(dialog.locator('xpath=..'), 'the scrim').toHaveCSS('will-change', 'opacity');
    await expect(dialog, 'the panel').toHaveCSS('will-change', 'transform, opacity');
    await expect(dialog.locator('img'), 'the dish').toHaveCSS('will-change', 'transform');
  });

  test('can be opened again while it is still playing out', async ({ page }) => {
    const opener = await prepare(page);

    await opener.click();
    await expect(page.locator(QUICK_VIEW)).toBeVisible();
    await page.keyboard.press('Escape');
    // The closing dialog covers the button, so click it from inside the page: this lands while the exit is still playing.
    await opener.dispatchEvent('click');
    const dialog = page.getByRole('dialog', { name: 'Pizza Slice' });

    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(SCRIM_OPACITY), { message: 'it settles fully open again', timeout: 10_000 }).toBe(1);
    await expect(dialog.getByRole('button', { name: 'Close details' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator(QUICK_VIEW)).toHaveCount(0);
  });

  test('when GSAP cannot be downloaded it still opens and closes', async ({ page }) => {
    await page.route(GSAP_CHUNK, (route) => route.abort());
    const opener = await prepare(page);

    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Pizza Slice' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close details' })).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(page.locator(QUICK_VIEW)).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe('the menu pages', () => {
  test('a long category shows nine cards, the pager turns the page, and the other pages stay out of view', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    const menu = page.locator('#menu');
    await menu.getByRole('tab', { name: 'Cold Drinks' }).click();
    const panel = menu.getByRole('tabpanel', { name: 'Cold Drinks' });
    const visible = panel.locator('article:visible');
    const status = (text: string): Locator => panel.getByText(text, { exact: true });
    const next = panel.getByRole('button', { name: 'Next', exact: true });
    const previous = panel.getByRole('button', { name: 'Previous', exact: true });

    await expect(visible).toHaveCount(9);
    await expect(status('Page 1 of 4')).toBeVisible();
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    const firstOfPageOne = await visible.first().getAttribute('data-card');

    await next.click();
    await expect(status('Page 2 of 4')).toBeVisible();
    await expect(visible).toHaveCount(9);
    expect(await visible.first().getAttribute('data-card')).not.toBe(firstOfPageOne);

    await next.click();
    await next.click();
    await expect(status('Page 4 of 4')).toBeVisible();
    await expect(visible).toHaveCount(4); // 31 cards: three full pages and four
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused(); // pressing the end of the range did not drop focus

    await previous.click();
    await previous.click();
    await previous.click();
    await expect(status('Page 1 of 4')).toBeVisible();
    expect(await visible.first().getAttribute('data-card')).toBe(firstOfPageOne);
  });

  test('a category that fits on one page has no pager', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    const menu = page.locator('#menu');
    await expect(menu.getByRole('tabpanel', { name: 'Pizza & Calzones' }).locator('article:visible')).toHaveCount(6);
    await expect(menu.getByRole('navigation')).toHaveCount(0);
  });
});

test.describe('the menu tabs', () => {
  /** Left edge of the selected tab's pill, from the tab list's left edge; -1 when there is no pill. */
  const PILL = `(() => {
    const pill = document.querySelector('#menu [data-part="pill"]');
    const list = document.querySelector('#menu [role="tablist"]');
    if (!pill || !list) return -1;
    return Math.round((pill.getBoundingClientRect().left - list.getBoundingClientRect().left) * 10) / 10;
  })()`;
  /** How far ahead the first card of the shown category is of its last: above 0 only while they rise one after another. */
  const STAGGER = `(() => {
    const cards = [...document.querySelectorAll('#menu [role="tabpanel"]:not([hidden]) [data-part="page"]:not([hidden]) [data-part="cell"]')];
    if (cards.length < 2) return -1;
    return Number(getComputedStyle(cards[0]).opacity) - Number(getComputedStyle(cards[cards.length - 1]).opacity);
  })()`;
  const INLINE_PILL = `(() => document.querySelector('#menu [data-part="pill"]')?.style.cssText ?? 'no pill')()`;
  const INLINE_CARDS = `[...document.querySelectorAll('#menu [role="tabpanel"]:not([hidden]) [data-part="page"]:not([hidden]) [data-part="cell"]')].map((card) => card.style.cssText).join('')`;

  test('the pill slides to the new tab and the cards rise in one after another', async ({ page }) => {
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    await gsapReady(page);
    const menu = page.locator('#menu');
    const tab = menu.getByRole('tab', { name: 'Hot Dogs' });
    await tab.scrollIntoViewIfNeeded();

    const switchTo = async (target: Locator): Promise<void> => {
      await target.click();
      // When the tweens end GSAP removes what it set, and the stylesheet takes over again.
      await expect.poll(() => page.evaluate(INLINE_PILL), { message: 'inline styles left on the pill', timeout: 10_000 }).toBe('');
      await expect.poll(() => page.evaluate(INLINE_CARDS), { message: 'inline styles left on the cards', timeout: 10_000 }).toBe('');
    };
    let before = 0;
    let after = 0;
    const slid = (positions: Frames): number => between(present(positions), before + 2, after - 2);
    const highest = (staggers: Frames): number => Math.max(...staggers.map((row) => row[1]));

    const [sliding = [], rising = []] = await recordAll(
      page,
      [PILL, STAGGER],
      async () => {
        before = await page.evaluate<number>(PILL);
        await switchTo(tab);
        after = await page.evaluate<number>(PILL);
      },
      () => switchTo(menu.getByRole('tab', { name: 'Pizza' })),
      ([positions = [], staggers = []]) => slid(positions) >= 1 && highest(staggers) > 0.2,
    );

    expect(after, 'the pill ended up under the new tab').toBeGreaterThan(before + 20);
    expect(slid(sliding), 'frames caught mid-slide').toBeGreaterThanOrEqual(1);
    expect(highest(rising), 'the first card is ahead of the last while they rise').toBeGreaterThan(0.2);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('switching tabs still works when GSAP cannot be downloaded', async ({ page }) => {
    await page.route(GSAP_CHUNK, (route) => route.abort());
    await ready(page);
    await hydrated(page, 'MenuBrowser');
    const tab = page.locator('#menu').getByRole('tab', { name: 'Hot Dogs' });
    await tab.scrollIntoViewIfNeeded();

    await tab.click();

    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Hot Dogs' })).toBeVisible();
    await expect(page.locator('#menu [role="tabpanel"]:not([hidden]) [data-part="page"]:not([hidden]) [data-part="cell"]').first()).toHaveCSS('opacity', '1');
  });
});
