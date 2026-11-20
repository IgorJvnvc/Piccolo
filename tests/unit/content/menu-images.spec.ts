import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LONGER_SIDE = 640; // scripts/menu-images/build.py: SUBJECT + 2 * MARGIN
const MAX_BYTES = 80 * 1024; // the textured pizzas are the heavy ones (about 70 kB); a bottle is under 30

const items = JSON.parse(readFileSync(`${ROOT}src/content/menu/items.json`, 'utf8')) as { id: string; image: string }[];
const stems = (folder: string, extension: string): string[] =>
  readdirSync(`${ROOT}${folder}`).filter((file) => file.endsWith(extension)).map((file) => file.slice(0, -extension.length)).sort();

/** Size and alpha flag from a WebP header: the simple lossy, lossless and extended (lossy with alpha) layouts. */
function webpHeader(file: Buffer): { width: number; height: number; alpha: boolean } {
  expect([file.toString('ascii', 0, 4), file.toString('ascii', 8, 12)]).toEqual(['RIFF', 'WEBP']);
  const layout = file.toString('ascii', 12, 16);
  if (layout === 'VP8X') return { width: 1 + file.readUIntLE(24, 3), height: 1 + file.readUIntLE(27, 3), alpha: (file.readUInt8(20) & 0x10) !== 0 };
  if (layout === 'VP8L') {
    const bits = file.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff), alpha: ((bits >>> 28) & 1) === 1 };
  }
  return { width: file.readUInt16LE(26) & 0x3fff, height: file.readUInt16LE(28) & 0x3fff, alpha: false }; // plain lossy: no alpha
}

// The pictures are the owner's product shots, cut out and made by scripts/menu-images (ADR 0017). The build already fails on an item whose
// picture is missing; this names the mistake, and checks what the build cannot: nothing is left over, and each picture is a real cut-out.
describe('menu pictures', () => {
  it('gives every item a picture of its own', () => {
    const keys = items.map((item) => item.image);
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([]); // a page of nine must not show one drawing twice
    expect(keys.filter((key) => !existsSync(`${ROOT}src/assets/${key}.webp`))).toEqual([]);
  });

  it('keeps no picture, and no original shot, that belongs to no item', () => {
    const ids = items.map((item) => item.id).sort();
    expect(stems('src/assets/menu', '.webp')).toEqual(ids);
    expect(stems('scripts/menu-images/originals', '.png')).toEqual(ids);
  });

  it.each(items.map((item) => item.image))('%s is a transparent cut-out of the agreed size and weight', (key) => {
    const file = readFileSync(`${ROOT}src/assets/${key}.webp`);
    const { width, height, alpha } = webpHeader(file);
    expect(alpha).toBe(true); // an opaque rectangle would sit as a white box on the cream glow and the dark panels
    expect(Math.max(width, height)).toBe(LONGER_SIDE);
    expect(file.length).toBeLessThanOrEqual(MAX_BYTES);
  });
});
