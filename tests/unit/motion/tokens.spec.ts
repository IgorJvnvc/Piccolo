import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { duration, ease, enter, loadGsap, scaleFor, stagger, travel } from '@/shared/motion';

const css = readFileSync(new URL('../../../src/styles/tokens.css', import.meta.url), 'utf8');

/** The CSS cubic-bezier(x1, y1, x2, y2) timing function: y as a function of x (time), solved by bisection. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const at = (s: number, a: number, b: number): number => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * b + s ** 3;
  return (x) => {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 48; i++) {
      const mid = (low + high) / 2;
      if (at(mid, x1, x2) < x) low = mid;
      else high = mid;
    }
    return at((low + high) / 2, y1, y2);
  };
}

/** `--ease-<name>: cubic-bezier(...)` declarations in tokens.css. */
const cssEases = [...css.matchAll(/--ease-(\w+):\s*cubic-bezier\(([^)]+)\)/g)].map(([, name, args]) => ({
  name: name as string,
  points: (args as string).split(',').map(Number) as [number, number, number, number],
}));

describe('motion ease tokens', () => {
  it('finds the CSS curves it is meant to mirror', () => {
    expect(cssEases.map((curve) => curve.name).sort()).toEqual(['expo', 'out', 'soft']);
  });

  it.each(cssEases)('--ease-$name and the GSAP ease of the same name stay within 2% of the travel', async ({ name, points }) => {
    const { gsap } = await loadGsap();
    const gsapEase = gsap.parseEase(ease[name as keyof typeof ease]);
    const cssEase = cubicBezier(...points);

    let worst = 0;
    for (let t = 0; t <= 1.0001; t += 0.01) worst = Math.max(worst, Math.abs(gsapEase(t) - cssEase(t)));
    expect(worst).toBeLessThan(0.02);
  });

  it('really does tell different curves apart (a cubic-out is not a quart-out)', async () => {
    const { gsap } = await loadGsap();
    const quartOut = gsap.parseEase('power3.out');
    const cubicOut = cubicBezier(0.33, 1, 0.68, 1); // the old, mismatched --ease-soft
    expect(Math.abs(quartOut(0.1) - cubicOut(0.1))).toBeGreaterThan(0.05);
  });
});

describe('scaleFor', () => {
  it('runs the full tier at full distance and speed', () => {
    expect(scaleFor('full')).toEqual({ distance: 1, speed: 1 });
  });

  it('halves the travel and runs the lite tier a third faster (timeScale 4/3, i.e. 0.75x the time)', () => {
    const lite = scaleFor('lite');
    expect(lite.distance).toBe(0.5);
    expect(1 / lite.speed).toBeCloseTo(0.75, 10);
  });

  it('treats static like lite: scenes never run there, so it only has to be safe', () => {
    expect(scaleFor('static')).toEqual(scaleFor('lite'));
  });
});

describe('measured values', () => {
  it('keeps the reel-measured stagger spacing', () => {
    expect(stagger).toEqual({ cards: 0.3, copy: 0.2 });
  });

  it('keeps travel in rem and calibrated to the 13.92 px/rem reference (28 px, 110 px, 90 px, 24 px)', () => {
    const REFERENCE_REM_PX = 13.92;
    expect(travel.rise * REFERENCE_REM_PX).toBeCloseTo(28, 0);
    expect(travel.card * REFERENCE_REM_PX).toBeCloseTo(110, -1);
    expect(travel.cluster * REFERENCE_REM_PX).toBeCloseTo(90, -1);
    expect(travel.copy * REFERENCE_REM_PX).toBeCloseTo(24, 0);
  });

  it('starts every scene when its trigger is in the lower part of the viewport, never off-screen', () => {
    for (const start of Object.values(enter)) expect(start).toMatch(/^top (6|7|8|9)\d%$/);
  });

  it('has positive durations', () => {
    for (const seconds of Object.values(duration)) expect(seconds).toBeGreaterThan(0);
  });
});
