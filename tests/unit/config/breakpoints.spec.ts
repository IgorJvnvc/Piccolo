import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BREAKPOINTS } from '@/shared/config/breakpoints';

/**
 * BREAKPOINTS (TypeScript) is mirrored in CSS media queries, `sizes` attributes, matchMedia() and
 * client:media. They cannot import each other, so this scans the sources and fails on any ad-hoc breakpoint.
 */

const SRC = fileURLToPath(new URL('../../../src', import.meta.url));
const SCANNED = new Set(['.css', '.astro', '.tsx', '.ts', '.js']);

// A width media condition in px: "(min-width: 1024px)" in CSS, `sizes`, matchMedia and client:media.
const WIDTH_CONDITION = /\((?:min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g;

// `min-width: N` pairs with `max-width: N - 1` for the opposite side of the same breakpoint.
const ALLOWED = new Set<number>(Object.values(BREAKPOINTS).flatMap((value) => [value, value - 1]));

describe('breakpoints', () => {
  const found: Array<{ readonly file: string; readonly condition: string; readonly value: number }> = [];

  for (const relative of readdirSync(SRC, { recursive: true, encoding: 'utf8' })) {
    if (!SCANNED.has(extname(relative))) continue;
    const text = readFileSync(join(SRC, relative), 'utf8');
    for (const match of text.matchAll(WIDTH_CONDITION)) {
      found.push({ file: relative.replaceAll('\\', '/'), condition: match[0], value: Number(match[1]) });
    }
  }

  it('actually finds the media queries (the scan is not vacuous)', () => {
    expect(found.length).toBeGreaterThan(10);
  });

  it('uses only the shared breakpoint values (or one pixel below, for max-width)', () => {
    const adHoc = found.filter(({ value }) => !ALLOWED.has(value)).map(({ file, condition }) => `${file}: ${condition}`);
    expect(adHoc).toEqual([]);
  });
});
