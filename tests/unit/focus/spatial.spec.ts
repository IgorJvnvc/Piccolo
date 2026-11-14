import { describe, expect, it } from 'vitest';
import { type Box, type Candidate, directionOf, isBackKey, pickNext } from '@/shared/focus/spatial';

const box = (left: number, top: number, width = 100, height = 100): Box => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

/** A 3 x 2 grid of 100 px boxes with 20 px gaps. id = row * 3 + column. */
const GRID: readonly Candidate[] = [0, 1, 2, 3, 4, 5].map((id) => ({
  id,
  box: box((id % 3) * 120, Math.floor(id / 3) * 120),
}));

const others = (from: number): Candidate[] => GRID.filter((candidate) => candidate.id !== from);
const boxOf = (id: number): Box => {
  const found = GRID.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no grid cell ${id}`);
  return found.box;
};

describe('pickNext', () => {
  it('moves along the grid in all four directions', () => {
    expect(pickNext(boxOf(1), others(1), 'right')).toBe(2);
    expect(pickNext(boxOf(1), others(1), 'left')).toBe(0);
    expect(pickNext(boxOf(1), others(1), 'down')).toBe(4);
    expect(pickNext(boxOf(4), others(4), 'up')).toBe(1);
  });

  it('prefers the same row over a nearer diagonal neighbour', () => {
    // From the top-left cell, "right" should stay on row 0 (id 1), not drop to row 1 (id 4).
    expect(pickNext(boxOf(0), others(0), 'right')).toBe(1);
    expect(pickNext(boxOf(0), others(0), 'down')).toBe(3);
  });

  it('returns null when nothing lies in that direction', () => {
    expect(pickNext(boxOf(0), others(0), 'left')).toBeNull();
    expect(pickNext(boxOf(0), others(0), 'up')).toBeNull();
    expect(pickNext(boxOf(5), others(5), 'right')).toBeNull();
    expect(pickNext(boxOf(5), others(5), 'down')).toBeNull();
  });

  it('returns null without candidates', () => {
    expect(pickNext(box(0, 0), [], 'right')).toBeNull();
  });

  it('ignores a candidate whose centre is not strictly in that direction', () => {
    const from = box(0, 0);
    const sameCentre: Candidate = { id: 1, box: box(0, 0) };
    const directlyBelow: Candidate = { id: 2, box: box(0, 200) };
    expect(pickNext(from, [sameCentre, directlyBelow], 'right')).toBeNull();
    expect(pickNext(from, [sameCentre, directlyBelow], 'down')).toBe(2);
  });

  it('weighs cross-axis drift double: a far aligned target beats a near but misaligned one', () => {
    const from = box(0, 0);
    const aligned: Candidate = { id: 1, box: box(300, 0) }; // dx 300, dy 0   -> score 300
    const nearMisaligned: Candidate = { id: 2, box: box(100, 130) }; // dx 100, dy 130 -> score 360
    const nearSlightlyOff: Candidate = { id: 3, box: box(100, 60) }; // dx 100, dy 60  -> score 220

    expect(pickNext(from, [aligned, nearMisaligned], 'right')).toBe(1);
    expect(pickNext(from, [aligned, nearSlightlyOff], 'right')).toBe(3);
  });
});

describe('directionOf', () => {
  it.each([
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
  ] as const)('maps key %s to %s', (key, expected) => {
    expect(directionOf({ key, keyCode: 0 })).toBe(expected);
  });

  it.each([
    [37, 'left'],
    [38, 'up'],
    [39, 'right'],
    [40, 'down'],
  ] as const)('falls back to legacy keyCode %i for TV browsers that leave `key` empty', (keyCode, expected) => {
    expect(directionOf({ key: 'Unidentified', keyCode })).toBe(expected);
    expect(directionOf({ key: '', keyCode })).toBe(expected);
  });

  it('prefers `key` over `keyCode`', () => {
    expect(directionOf({ key: 'ArrowLeft', keyCode: 39 })).toBe('left');
  });

  it('ignores every other key', () => {
    expect(directionOf({ key: 'Enter', keyCode: 13 })).toBeNull();
    expect(directionOf({ key: 'a', keyCode: 65 })).toBeNull();
    expect(directionOf({ key: 'Tab', keyCode: 9 })).toBeNull();
  });
});

describe('isBackKey', () => {
  it('accepts Escape and the Tizen and webOS remote Back codes', () => {
    expect(isBackKey({ key: 'Escape', keyCode: 27 })).toBe(true);
    expect(isBackKey({ key: 'Unidentified', keyCode: 27 })).toBe(true);
    expect(isBackKey({ key: 'Unidentified', keyCode: 10009 })).toBe(true); // Tizen
    expect(isBackKey({ key: 'Unidentified', keyCode: 461 })).toBe(true); // webOS
  });

  it('rejects navigation and ordinary keys', () => {
    expect(isBackKey({ key: 'ArrowLeft', keyCode: 37 })).toBe(false);
    expect(isBackKey({ key: 'Backspace', keyCode: 8 })).toBe(false);
    expect(isBackKey({ key: 'Enter', keyCode: 13 })).toBe(false);
  });
});
