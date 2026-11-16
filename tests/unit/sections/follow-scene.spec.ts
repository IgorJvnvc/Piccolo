// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import follow from '@/sections/follow/follow.scene';
import type { Capabilities } from '@/shared/device';
import type { EnhancementContext } from '@/shared/enhance';
import { createAppBus } from '@/shared/events';
import { loadGsap } from '@/shared/motion';

/**
 * The Follow card's choreography against the REAL GSAP: the actual scene file, a stubbed layout (happy-dom has none),
 * and a timeline the test drives by hand (no ScrollTrigger: a layout-less DOM would fire it at once).
 * It pins what the page must do: the card widens, the art and text slide out from the card's center, and every
 * inline style is cleared when it ends.
 */
const caps: Capabilities = { device: 'desktop', motion: 'full', pointer: 'fine', hover: true, reducedMotion: false, saveData: false, lowEnd: false, width: 1440 };

interface Fixture {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly bg: HTMLElement;
  readonly art: HTMLElement;
  readonly content: HTMLElement;
}

const part = (root: HTMLElement, name: string): HTMLElement => root.querySelector(`[data-part="${name}"]`) as HTMLElement;
const rect = (left: number, width: number): DOMRect => ({ left, width, right: left + width, top: 0, bottom: 100, height: 100, x: left, y: 0, toJSON: () => ({}) });

const currentX = (element: HTMLElement): number => {
  const match = /translate(?:3d)?\(\s*(-?[\d.]+)px/.exec(element.style.transform);
  return match ? Number(match[1]) : 0;
};

function mount(): Fixture {
  document.body.innerHTML = `
    <section data-enhance="follow">
      <div data-part="stage" data-state="idle">
        <div data-part="bg"></div>
        <div data-part="art"></div>
        <div data-part="content"></div>
        <svg data-part="sparkle"></svg>
      </div>
    </section>`;
  const root = document.querySelector('[data-enhance="follow"]') as HTMLElement;
  const [stage, bg, art, content] = ['stage', 'bg', 'art', 'content'].map((name) => part(root, name)) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
  // A 1000 px card whose center is 500. The art sits left of it (center 200), the text right of it (center 800).
  Object.defineProperty(stage, 'offsetWidth', { value: 1000 });
  stage.getBoundingClientRect = () => rect(0, 1000);
  // Like a browser, a rectangle moves with the element's current translate: measuring a displaced layer gives its
  // displaced position, which is what makes re-measuring a layer that is mid-flight (or sitting at its from-state) tricky.
  art.getBoundingClientRect = () => rect(100 + currentX(art), 200);
  content.getBoundingClientRect = () => rect(700 + currentX(content), 200);
  return { root, stage, bg, art, content };
}

let fixture: Fixture;

beforeEach(() => {
  document.documentElement.style.fontSize = '16px';
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('1024'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
  fixture = mount();
});

afterEach(async () => {
  document.documentElement.style.fontSize = '';
  document.body.innerHTML = '';
  // The real ticker and ScrollTrigger's 250 ms sync timer ask for a frame in callbacks of their own; once happy-dom is torn down
  // those calls fail as an unhandled error. Put both to sleep.
  const { gsap, ScrollTrigger } = await loadGsap();
  gsap.ticker.sleep();
  ScrollTrigger.disable();
});

/** Runs the real scene; returns its (paused, trigger-less) timeline and the gsap it used. */
async function run() {
  const { gsap } = await loadGsap();
  const timelines: Array<ReturnType<typeof gsap.timeline>> = [];
  const timeline = (vars: Record<string, unknown> = {}) => {
    const { scrollTrigger: _dropped, ...rest } = vars;
    const created = gsap.timeline(rest).pause();
    timelines.push(created);
    return created;
  };
  const kit = { gsap: Object.create(gsap, { timeline: { value: timeline } }) as typeof gsap, ScrollTrigger: undefined as never };
  const context: EnhancementContext = { root: fixture.root, caps, bus: createAppBus(), signal: new AbortController().signal, gsap: () => Promise.resolve(kit) };
  const teardown = await follow.setup(context);
  const first = timelines[0];
  if (!first) throw new Error('the scene created no timeline');
  return { gsap, timeline: first, teardown: teardown as () => void };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 60));
const translateX = (element: HTMLElement): number => {
  const match = /translate(?:3d)?\(\s*(-?[\d.]+)px/.exec(element.style.transform);
  return match ? Number(match[1]) : 0;
};

describe('Follow scene (real GSAP)', () => {
  it('starts the art and text at the card center, as if they had been pulled in to it', async () => {
    await run();
    await tick();

    expect(translateX(fixture.art)).toBeCloseTo(300, 0); // center 500 - art center 200
    expect(translateX(fixture.content)).toBeCloseTo(-300, 0); // center 500 - text center 800
    expect(fixture.stage.dataset['state']).toBe('idle'); // not opened until the scene starts
  });

  it('slides them out along the expo ease while the card widens (art: 300 -> 0)', async () => {
    const { gsap, timeline } = await run();
    await tick();
    const expoOut = gsap.parseEase('expo.out');

    timeline.time(0.3, false);
    const expected = 300 * (1 - expoOut(0.3 / 0.96));
    expect(translateX(fixture.art)).toBeGreaterThan(0);
    expect(translateX(fixture.art)).toBeCloseTo(expected, 0);
    expect(translateX(fixture.content)).toBeCloseTo(-expected, 0);
    expect(fixture.stage.dataset['state']).toBe('open');
  });

  it('measures the same start offset when GSAP re-initialises the tweens while the layers are already displaced', async () => {
    const { timeline } = await run();
    await tick();
    expect(currentX(fixture.art)).toBeCloseTo(300, 0); // displaced to the card center by the first from-state

    // ScrollTrigger refreshes and invalidations re-run the start values; they must not read the displaced layer as "already centered".
    timeline.invalidate();
    timeline.time(0, false);

    expect(currentX(fixture.art)).toBeCloseTo(300, 0);
    expect(currentX(fixture.content)).toBeCloseTo(-300, 0);
  });
});
