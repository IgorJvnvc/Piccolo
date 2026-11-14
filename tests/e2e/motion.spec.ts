import type { Page } from '@playwright/test';
import { expect, ready, test } from './fixtures';

/**
 * Motion, in a real browser with the real ScrollTrigger. The other specs prove content ends up visible; these prove how
 * it gets there: each scene must really animate (a scene that fails opens its content at once, which looks "visible"
 * to every other test), the Follow card must spread from its center, a resize must not corrupt a scene, and a failed
 * GSAP download must still leave a usable page.
 *
 * Scrolling is an instant jump on purpose: `html` has `scroll-behavior: smooth`, which would stretch every programmatic
 * scroll over seconds. A scene plays in real time from the moment its trigger is crossed, however it was crossed.
 */

const SCENES = [
  { name: 'about', root: '[data-enhance="about"]', target: '[data-enhance="about"] [data-part="item"]' },
  { name: 'popular', root: '[data-enhance="popular"]', target: '[data-enhance="popular"] [data-part="card"]' },
  { name: 'menu', root: '[data-enhance="menu"]', target: '[data-enhance="menu"] [data-part="head"]' },
  { name: 'visit', root: '[data-enhance="visit"]', target: '[data-enhance="visit"] [data-part="item"]' },
] as const;

const STAGE = '[data-enhance="follow"] [data-part="stage"]';

/** A real reveal fades from 5% to 95% in about 0.45 s (0.33 s on the lite tier); a snap, or a bare CSS transition, takes far less. */
const MIN_FADE_MS = 150;
/** The Follow art covers 10% to 90% of its travel in about 0.3 s (0.23 s on the lite tier); a snap covers it in one frame. */
const MIN_SPREAD_MS = 100;

/** Jumps (never glides) until the element's top sits at `fraction` of the viewport height. */
async function jumpTo(page: Page, selector: string, fraction = 0.45): Promise<void> {
  await page.evaluate(
    ({ sel, at }) => {
      const element = document.querySelector(sel);
      if (!element) throw new Error(`no element matches ${sel}`);
      window.scrollTo({ top: Math.max(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight * at), behavior: 'instant' });
    },
    { sel: selector, at: fraction },
  );
}

/**
 * Brings a scene's root inside the build look-ahead without crossing its trigger, and waits for it to build. The first scene
 * on a page downloads and initialises GSAP, a one-off hitch of hundreds of milliseconds; what the tests record afterwards is
 * the reveal itself, as a visitor scrolling gradually would see it.
 */
async function arm(page: Page, selector: string): Promise<void> {
  await jumpTo(page, selector, 1.15);
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((entry) => /\/_astro\/ScrollTrigger\./.test(entry.name)));
  await page.waitForTimeout(600);
}

type Recording = 'opacity' | 'follow';
/** `[time, opacity]` per frame, or `[time, open (0|1), art center minus card center]` per frame for the Follow card. */
type Frame = number[];

/** Samples on every animation frame until the motion has settled: `selector`'s opacity, or the Follow card's art offset. */
async function startRecording(page: Page, kind: Recording, selector: string): Promise<void> {
  await page.evaluate(
    ({ mode, sel }) => {
      const centerOf = (element: Element): number => {
        const box = element.getBoundingClientRect();
        return box.left + box.width / 2;
      };
      const store = { frames: [] as number[][], done: false, openedAt: null as number | null };
      (window as unknown as { __motion: typeof store }).__motion = store;
      const tick = (): void => {
        const now = performance.now();
        if (mode === 'opacity') {
          const element = document.querySelector(sel);
          if (element) {
            const opacity = Number.parseFloat(getComputedStyle(element).opacity);
            store.frames.push([now, opacity]);
            store.done = opacity >= 0.999;
          }
        } else {
          const stage = document.querySelector('[data-enhance="follow"] [data-part="stage"]');
          const art = document.querySelector('[data-enhance="follow"] [data-part="art"]');
          if (stage && art) {
            const open = stage.getAttribute('data-state') === 'open';
            if (open && store.openedAt === null) store.openedAt = now;
            store.frames.push([now, open ? 1 : 0, centerOf(art) - centerOf(stage)]);
            // The longest piece of the card's motion ends ~1.3 s after it opens.
            store.done = store.openedAt !== null && now - store.openedAt > 1700;
          }
        }
        if (!store.done) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { mode: kind, sel: selector },
  );
  // Resolve only once a frame has been recorded, so there is always a "before" sample, however loaded the machine is.
  await page.waitForFunction(() => (window as unknown as { __motion: { frames: unknown[] } }).__motion.frames.length >= 2);
}

/** Waits for the sampler to see the motion settle (or gives up, so the assertions report what was seen), then returns the frames. */
async function finishRecording(page: Page): Promise<Frame[]> {
  await page
    .waitForFunction(() => (window as unknown as { __motion: { done: boolean } }).__motion.done, undefined, { timeout: 10_000 })
    .catch(() => undefined);
  return page.evaluate(() => (window as unknown as { __motion: { frames: number[][] } }).__motion.frames);
}

/** How far the Follow art's center is from the card's center right now (px). */
const artOffset = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const centerOf = (element: Element): number => {
      const box = element.getBoundingClientRect();
      return box.left + box.width / 2;
    };
    const stage = document.querySelector('[data-enhance="follow"] [data-part="stage"]');
    const art = document.querySelector('[data-enhance="follow"] [data-part="art"]');
    return stage && art ? centerOf(art) - centerOf(stage) : Number.NaN;
  });

const at = (frame: Frame | undefined): number => frame?.[0] ?? Number.NaN;
const isDesktopLayout = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 1024;

test.beforeEach(async ({ page }) => {
  // The inline bootstrap reveals everything (`html.no-enhance`) if the runtime has not booted within 4 s. A loaded CI machine
  // can be that slow, and these tests assert the hidden state that precedes a scene, so keep that timer from firing here.
  // (The failsafe itself is covered by progressive.spec.ts.)
  await page.addInitScript(() => {
    const original = window.setTimeout.bind(window) as (handler: TimerHandler, timeout?: number, ...args: unknown[]) => number;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      typeof handler === 'function' && handler.toString().includes('no-enhance') ? 0 : original(handler, timeout, ...args)) as unknown as typeof window.setTimeout;
  });
});

test.describe('scenes really animate', () => {
  for (const scene of SCENES) {
    test(`${scene.name} reveals through intermediate frames, and no enhancement fails`, async ({ page, problems }) => {
      await ready(page);
      await arm(page, scene.root);
      await startRecording(page, 'opacity', scene.target);
      await jumpTo(page, scene.root);
      const frames = await finishRecording(page);

      expect(frames[0]?.[1], 'hidden before it plays').toBeLessThan(0.05);
      expect(frames.at(-1)?.[1], 'fully shown afterwards').toBeGreaterThan(0.99);

      const visible = frames.find((frame) => (frame[1] ?? 0) > 0.05);
      const shown = frames.find((frame) => (frame[1] ?? 0) >= 0.95);
      // A snap (a failed scene opening its content at once) goes from hidden to shown inside a single frame.
      expect(at(shown) - at(visible), 'ms from 5% to 95% opacity').toBeGreaterThanOrEqual(MIN_FADE_MS);
      expect(frames.filter((frame) => (frame[1] ?? 0) > 0.05 && (frame[1] ?? 0) < 0.95).length, 'frames caught mid-reveal').toBeGreaterThanOrEqual(2);

      // When the tween ends GSAP removes its inline styles and the CSS resting state takes over; it must not be the hidden one.
      await page.waitForTimeout(400);
      expect(await page.$eval(scene.target, (element) => Number.parseFloat(getComputedStyle(element).opacity)), 'still shown once the scene is over').toBe(1);
      expect(problems.filter((problem) => problem.includes('[enhance]'))).toEqual([]);
    });
  }

  test('the follow card spreads its art out from the card center instead of snapping to rest', async ({ page, problems }) => {
    test.skip(!isDesktopLayout(page), 'the layers only spread from the center in the desktop layout');
    await ready(page);
    await arm(page, STAGE);
    await startRecording(page, 'follow', STAGE);
    await jumpTo(page, STAGE);
    const frames = await finishRecording(page);

    const opened = frames.filter((frame) => frame[1] === 1);
    expect(opened.length, 'the card opened').toBeGreaterThan(0);
    const offsets = opened.map((frame) => Math.abs(frame[2] ?? 0));
    const rest = offsets.at(-1) ?? 0;
    expect(rest, 'the art ends well away from the center').toBeGreaterThan(100);
    expect(offsets[0], 'the art starts near the card center').toBeLessThan(rest * 0.3);

    const leaving = opened.find((frame) => Math.abs(frame[2] ?? 0) > rest * 0.1);
    const arrived = opened.find((frame) => Math.abs(frame[2] ?? 0) >= rest * 0.9);
    // A snap to rest covers the whole distance inside a single frame.
    expect(at(arrived) - at(leaving), 'ms from 10% to 90% of the travel').toBeGreaterThanOrEqual(MIN_SPREAD_MS);
    expect(offsets.filter((value) => value > rest * 0.1 && value < rest * 0.9).length, 'frames caught mid-slide').toBeGreaterThanOrEqual(2);
    expect(problems.filter((problem) => problem.includes('[enhance]'))).toEqual([]);
  });
});

test.describe('scenes survive layout changes', () => {
  test('the follow card re-measures when the viewport changes before it plays', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'one desktop run is enough to pin the re-measuring');
    await ready(page);

    // Let the scene build (its root is inside the 25% look-ahead) without letting it play (its trigger is at 70%).
    await jumpTo(page, STAGE, 1.15);
    // Building takes as long as GSAP takes to download on this machine; until then the art simply sits at its resting place.
    await expect.poll(() => artOffset(page).then(Math.abs), { message: 'the art waits at the card center until it plays', timeout: 10_000 }).toBeLessThan(4);

    // A much narrower desktop layout moves the card center and the art's resting place.
    await page.setViewportSize({ width: 1100, height: 760 });

    // ScrollTrigger refreshes (debounced) and re-reads every start value; a stale one would leave the art off-center for good.
    await expect
      .poll(() => artOffset(page).then(Math.abs), { message: 'back at the card center, not at a stale offset from the old width', timeout: 10_000 })
      .toBeLessThan(4);
  });

  test('a finished reveal stays revealed through a resize', async ({ page }) => {
    await ready(page);
    const selector = '[data-enhance="about"] [data-part="item"]';

    await arm(page, '[data-enhance="about"]');
    await startRecording(page, 'opacity', selector);
    await jumpTo(page, '[data-enhance="about"]');
    await finishRecording(page);
    await page.waitForTimeout(1500); // the later items finish after the first
    const width = page.viewportSize()?.width ?? 1280;
    await page.setViewportSize({ width: width - 60, height: page.viewportSize()?.height ?? 800 });
    await page.waitForTimeout(900);
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(300);

    const opacities = await page.$$eval(selector, (items) => items.map((item) => Number.parseFloat(getComputedStyle(item).opacity)));
    expect(opacities.length).toBeGreaterThan(0);
    for (const value of opacities) expect(value).toBe(1);
  });
});

test.describe('when GSAP cannot be downloaded', () => {
  test('every section is still visible, the card is open, and the page stays usable', async ({ page }) => {
    await page.route(/\/_astro\/(gsap|ScrollTrigger)\.[^/]+\.js$/, (route) => route.abort());
    await ready(page);

    // Visit every scene so each one tries to build, fails, and has to recover on its own.
    for (const selector of [...SCENES.map((scene) => scene.root), STAGE]) {
      await jumpTo(page, selector, 0.6);
      await page.waitForTimeout(250);
    }

    const hiddenCount = (): Promise<number> =>
      page.$$eval('[data-reveal]', (items) => items.filter((item) => Number.parseFloat(getComputedStyle(item).opacity) < 1).length);
    await expect.poll(hiddenCount, { message: 'elements the reveal protocol left invisible', timeout: 8000 }).toBe(0);
    await expect(page.locator(STAGE)).toHaveAttribute('data-state', 'open');

    // Content that was hidden must also be reachable by keyboard (hidden content cannot take focus).
    const link = page.locator('[data-enhance="about"] a').first();
    await link.focus();
    await expect(link).toBeFocused();
  });
});
