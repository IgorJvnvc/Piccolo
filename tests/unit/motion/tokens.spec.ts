import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ease, loadGsap, scaleFor } from '@/shared/motion';

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
});

describe('scaleFor', () => {
  it('leaves the full tier alone, and halves the travel of the lite tier while running it a third faster (timeScale 4/3)', () => {
    expect(scaleFor('full')).toEqual({ distance: 1, speed: 1 });

    const lite = scaleFor('lite');
    expect(lite.distance).toBe(0.5);
    expect(1 / lite.speed).toBeCloseTo(0.75, 10);
  });
});
