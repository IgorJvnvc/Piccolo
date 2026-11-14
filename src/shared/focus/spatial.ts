export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface Candidate {
  readonly id: number;
  readonly box: Box;
}

const centerX = (b: Box): number => (b.left + b.right) / 2;
const centerY = (b: Box): number => (b.top + b.bottom) / 2;

/** Orthogonal drift is penalized so "right" prefers things on the same row. */
const CROSS_AXIS_WEIGHT = 2;

/**
 * Picks the best focus target in `direction` from `from`.
 *
 * Pure geometry (no DOM) so it is unit-testable. Candidates must lie in the half-plane of the
 * direction (by center), then we minimise `primary distance + 2 x cross-axis distance`.
 */
export function pickNext(from: Box, candidates: readonly Candidate[], direction: Direction): number | null {
  const fx = centerX(from);
  const fy = centerY(from);

  let bestId: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const dx = centerX(candidate.box) - fx;
    const dy = centerY(candidate.box) - fy;

    const primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    if (primary <= 0) continue;

    const cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + cross * CROSS_AXIS_WEIGHT;

    if (score < bestScore) {
      bestScore = score;
      bestId = candidate.id;
    }
  }

  return bestId;
}

/**
 * The part of a KeyboardEvent we read. `keyCode` is deprecated in the DOM, but TV remotes still report some
 * keys only through it (Tizen Back = 10009, webOS Back = 461), so it is declared here on purpose.
 */
export interface KeyInput {
  readonly key: string;
  readonly keyCode: number;
}

/** Maps a keyboard event to a direction. Includes the legacy arrow key codes some TV browsers send. */
export function directionOf(event: KeyInput): Direction | null {
  switch (event.key) {
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    default:
      break;
  }
  // Legacy TV browsers may not populate `key`.
  switch (event.keyCode) {
    case 37:
      return 'left';
    case 39:
      return 'right';
    case 38:
      return 'up';
    case 40:
      return 'down';
    default:
      return null;
  }
}

/** TV remote "Back" keys: Tizen 10009, webOS 461, plus Escape/Backspace-less browsers. */
export function isBackKey(event: KeyInput): boolean {
  return event.key === 'Escape' || event.keyCode === 10009 || event.keyCode === 461 || event.keyCode === 27;
}
