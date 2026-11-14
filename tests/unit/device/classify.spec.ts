import { describe, expect, it } from 'vitest';
import { PHONE_SHORT_SIDE, TV_MIN_WIDTH, classify, isTvUserAgent, pointerOf } from '@/shared/device/classify';
import type { Probe } from '@/shared/device/types';

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const BASE: Probe = {
  userAgent: DESKTOP_UA,
  width: 1440,
  height: 900,
  hover: true,
  pointerFine: true,
  pointerCoarse: false,
  reducedMotion: false,
  saveData: false,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  maxTouchPoints: 0,
};

const probe = (overrides: Partial<Probe> = {}): Probe => ({ ...BASE, ...overrides });

const touch = (width: number, height: number): Partial<Probe> => ({
  width,
  height,
  hover: false,
  pointerFine: false,
  pointerCoarse: true,
  maxTouchPoints: 5,
});

describe('classify: device class', () => {
  it.each([
    { width: 1440, expected: 'desktop' },
    { width: 1920, expected: 'desktop' },
    { width: 1439, expected: 'laptop' },
    { width: 1366, expected: 'laptop' },
    { width: 1024, expected: 'laptop' },
    { width: 1023, expected: 'tablet' },
    { width: 800, expected: 'tablet' },
  ])('fine pointer at $width px is a $expected', ({ width, expected }) => {
    expect(classify(probe({ width })).device).toBe(expected);
  });

  it('treats a touch-only device with a short side under 600 px as a phone, in either orientation', () => {
    expect(classify(probe(touch(390, 844))).device).toBe('phone');
    expect(classify(probe(touch(844, 390))).device).toBe('phone');
    expect(classify(probe(touch(PHONE_SHORT_SIDE - 1, 900))).device).toBe('phone');
  });

  it('treats a touch-only device with a short side of 600 px or more as a tablet', () => {
    expect(classify(probe(touch(PHONE_SHORT_SIDE, 900))).device).toBe('tablet');
    expect(classify(probe(touch(820, 1180))).device).toBe('tablet');
    expect(classify(probe(touch(1366, 1024))).device).toBe('tablet');
  });

  it('lets a fine pointer win on hybrid devices (touch laptop)', () => {
    const hybrid = probe({ pointerCoarse: true, pointerFine: true, hover: true, maxTouchPoints: 10, width: 1366 });
    expect(classify(hybrid).device).toBe('laptop');
    expect(classify(hybrid).pointer).toBe('fine');
  });

  it.each([
    ['Samsung Tizen', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36'],
    ['LG webOS', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.128 Safari/537.36 WebAppManager'],
    ['Fire TV', 'Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.0 like Chrome/120.0 Safari/537.36'],
    ['Android TV', 'Mozilla/5.0 (Linux; Android 11; BRAVIA 4K UR3 Build/RD1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Android TV'],
    ['Chromecast', 'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 CrKey/1.56'],
    ['HbbTV', 'Mozilla/5.0 (Linux; HbbTV/1.5.1 (+DRM; Philips; 55PUS7909; ; ) CE-HTML/1.0 NETTV/9.0'],
  ])('detects a TV from the %s user agent regardless of screen size', (_name, userAgent) => {
    expect(classify(probe({ userAgent, width: 1280, height: 720 })).device).toBe('tv');
    expect(classify(probe({ userAgent, ...touch(390, 844) })).device).toBe('tv');
  });

  it('detects a big screen with no pointer and no hover as a TV even without a UA token', () => {
    const bigScreen = probe({ width: TV_MIN_WIDTH, height: 1080, hover: false, pointerFine: false, pointerCoarse: false });
    expect(classify(bigScreen).device).toBe('tv');
  });

  it('does not call a smaller pointer-less screen a TV', () => {
    const smaller = probe({ width: TV_MIN_WIDTH - 1, hover: false, pointerFine: false, pointerCoarse: false });
    expect(classify(smaller).device).not.toBe('tv');
  });
});

describe('classify: motion tier', () => {
  it('defaults to full on a capable desktop', () => {
    expect(classify(probe()).motion).toBe('full');
  });

  it('is static when the visitor prefers reduced motion, even on a TV', () => {
    expect(classify(probe({ reducedMotion: true })).motion).toBe('static');
    const tv = probe({ userAgent: 'Mozilla/5.0 (SMART-TV; Tizen 7.0)', reducedMotion: true });
    expect(classify(tv).motion).toBe('static');
  });

  it('is lite on a TV and when data saver is on', () => {
    expect(classify(probe({ userAgent: 'Mozilla/5.0 (Web0S; Linux/SmartTV)' })).motion).toBe('lite');
    expect(classify(probe({ saveData: true })).motion).toBe('lite');
  });

  it.each([
    { cores: 2, memory: 8, lowEnd: true },
    { cores: 1, memory: undefined, lowEnd: true },
    { cores: 8, memory: 2, lowEnd: true },
    { cores: 8, memory: 0.5, lowEnd: true },
    { cores: 3, memory: 4, lowEnd: false },
    { cores: 8, memory: 8, lowEnd: false },
    { cores: undefined, memory: undefined, lowEnd: false },
  ])('lowEnd=$lowEnd for $cores cores / $memory GB', ({ cores, memory, lowEnd }) => {
    const result = classify(probe({ hardwareConcurrency: cores, deviceMemory: memory }));
    expect(result.lowEnd).toBe(lowEnd);
    expect(result.motion).toBe(lowEnd ? 'lite' : 'full');
  });

  it('passes the raw measurements through', () => {
    const result = classify(probe({ width: 1234, reducedMotion: true, saveData: true, hover: false }));
    expect(result).toMatchObject({ width: 1234, reducedMotion: true, saveData: true, hover: false });
  });
});

describe('pointerOf', () => {
  it('prefers fine over coarse, then coarse, then none', () => {
    expect(pointerOf({ pointerFine: true, pointerCoarse: true })).toBe('fine');
    expect(pointerOf({ pointerFine: false, pointerCoarse: true })).toBe('coarse');
    expect(pointerOf({ pointerFine: false, pointerCoarse: false })).toBe('none');
  });
});

describe('isTvUserAgent', () => {
  it('rejects ordinary browsers', () => {
    expect(isTvUserAgent(DESKTOP_UA)).toBe(false);
    expect(isTvUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe(false);
    expect(isTvUserAgent('')).toBe(false);
  });

  it('matches Fire TV model tokens only as whole words', () => {
    expect(isTvUserAgent('Linux; Android 9; AFTMM Build/PS7233')).toBe(true);
    expect(isTvUserAgent('Linux; Android 9; AFT Build/X')).toBe(false);
    expect(isTvUserAgent('Linux; Android 9; AFTXXXXXXXXX Build/X')).toBe(false);
  });
});
