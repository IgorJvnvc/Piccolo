import { createContext, Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import bootstrapSource from '@/shared/device/bootstrap.inline.js?raw';
import { classify } from '@/shared/device/classify';
import type { Probe } from '@/shared/device/types';

/**
 * bootstrap.inline.js is a hand-written ES5 mirror of classify.ts that runs before first paint.
 * Two implementations of one rule will drift, so this runs the REAL script against classify() over a large
 * input matrix (including every breakpoint boundary) and requires identical answers.
 */

interface Environment {
  readonly userAgent: string;
  readonly width: number;
  readonly height: number;
  readonly hover: boolean;
  readonly fine: boolean;
  readonly coarse: boolean;
  readonly reduced: boolean;
  readonly saveData: boolean;
  readonly cores: number | undefined;
  readonly memory: number | undefined;
}

interface Result {
  readonly device: string | undefined;
  readonly motion: string | undefined;
  readonly pointer: string | undefined;
  readonly className: string;
  readonly failsafe: () => void;
  readonly hydrationError: () => void;
}

const script = new Script(bootstrapSource);
const sandbox: Record<string, unknown> = {};
const context = createContext(sandbox);

function runBootstrap(env: Environment, ready = false): Result {
  const attributes: Record<string, string> = {};
  const root = {
    className: '',
    setAttribute(name: string, value: string): void {
      attributes[name] = value;
    },
  };
  const queries: Record<string, boolean> = {
    '(hover: hover)': env.hover,
    '(pointer: fine)': env.fine,
    '(pointer: coarse)': env.coarse,
    '(prefers-reduced-motion: reduce)': env.reduced,
  };

  let failsafe: () => void = () => undefined;
  let hydrationError: () => void = () => undefined;
  const win: Record<string, unknown> = {
    navigator: {
      userAgent: env.userAgent,
      hardwareConcurrency: env.cores,
      deviceMemory: env.memory,
      connection: env.saveData ? { saveData: true } : undefined,
    },
    innerWidth: env.width,
    innerHeight: env.height,
    matchMedia: (query: string) => ({ matches: queries[query] ?? false }),
    setTimeout: (callback: () => void) => {
      failsafe = callback;
      return 0;
    },
    __PICCOLO_READY__: ready ? true : undefined,
  };

  // The script is an IIFE over the globals `window` and `document`; reuse one context for speed.
  sandbox['window'] = win;
  sandbox['document'] = {
    documentElement: root,
    addEventListener: (type: string, listener: () => void): void => {
      if (type === 'astro:hydration-error') hydrationError = listener;
    },
  };
  script.runInContext(context);

  return {
    device: attributes['data-device'],
    motion: attributes['data-motion'],
    pointer: attributes['data-pointer'],
    get className() {
      return root.className;
    },
    failsafe: () => failsafe(),
    hydrationError: () => hydrationError(),
  };
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36',
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.128 Safari/537.36 WebAppManager',
  'Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.0 like Chrome/120.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 CrKey/1.56',
];

// Every breakpoint boundary (1023/1024, 1439/1440, the 600 px phone side, the 1920 px TV width).
const SIZES: ReadonlyArray<readonly [number, number]> = [
  [390, 844],
  [844, 390],
  [599, 900],
  [600, 900],
  [820, 1180],
  [1023, 768],
  [1024, 768],
  [1366, 768],
  [1439, 900],
  [1440, 900],
  [1919, 1080],
  [1920, 1080],
  [3840, 2160],
];

const POINTERS = [
  { hover: true, fine: true, coarse: false },
  { hover: false, fine: false, coarse: true },
  { hover: false, fine: false, coarse: false },
  { hover: true, fine: true, coarse: true },
  { hover: true, fine: false, coarse: false },
] as const;

const FLAGS = [false, true] as const;
const CORES = [undefined, 2, 3, 8] as const;
const MEMORY = [undefined, 2, 4, 8] as const;

describe('bootstrap.inline.js parity with classify()', () => {
  it('gives the same device, motion tier and pointer for every combination', () => {
    const mismatches: string[] = [];
    let cases = 0;

    for (const userAgent of USER_AGENTS) {
      for (const [width, height] of SIZES) {
        for (const pointer of POINTERS) {
          for (const reduced of FLAGS) {
            for (const saveData of FLAGS) {
              for (const cores of CORES) {
                for (const memory of MEMORY) {
                  const env: Environment = { userAgent, width, height, ...pointer, reduced, saveData, cores, memory };
                  const expected = classify({
                    userAgent,
                    width,
                    height,
                    hover: pointer.hover,
                    pointerFine: pointer.fine,
                    pointerCoarse: pointer.coarse,
                    reducedMotion: reduced,
                    saveData,
                    hardwareConcurrency: cores,
                    deviceMemory: memory,
                    maxTouchPoints: 0,
                  } satisfies Probe);
                  const actual = runBootstrap(env);
                  cases += 1;

                  if (
                    actual.device !== expected.device ||
                    actual.motion !== expected.motion ||
                    actual.pointer !== expected.pointer
                  ) {
                    mismatches.push(
                      `${JSON.stringify({ ...env, userAgent: userAgent.slice(0, 30) })} -> inline ${actual.device}/${actual.motion}/${actual.pointer}, classify ${expected.device}/${expected.motion}/${expected.pointer}`,
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(cases).toBeGreaterThan(10_000);
    expect(mismatches.slice(0, 10)).toEqual([]);
    expect(mismatches).toHaveLength(0);
  });
});

describe('bootstrap.inline.js behaviour', () => {
  const env: Environment = {
    userAgent: USER_AGENTS[0] ?? '',
    width: 1440,
    height: 900,
    hover: true,
    fine: true,
    coarse: false,
    reduced: false,
    saveData: false,
    cores: 8,
    memory: 8,
  };

  it('marks the document as script-enabled before paint', () => {
    expect(runBootstrap(env).className).toBe('js');
  });

  it('reveals content anyway when the runtime never reports ready (failsafe)', () => {
    const result = runBootstrap(env, false);
    result.failsafe();
    expect(result.className).toBe('js no-enhance');
  });

  it('leaves the page alone when the runtime booted before the failsafe fires', () => {
    const result = runBootstrap(env, true);
    result.failsafe();
    expect(result.className).toBe('js');
  });

  it('falls back to the no-JS layout when an island fails to hydrate, once however many fail', () => {
    const result = runBootstrap(env, true);
    result.hydrationError();
    result.hydrationError();
    expect(result.className).toBe('js no-enhance');
  });

  it('survives a browser without matchMedia or navigator hints', () => {
    const bare = new Script(bootstrapSource);
    const attributes: Record<string, string> = {};
    const sandboxed = createContext({
      window: { innerWidth: 1280, innerHeight: 800, setTimeout: () => 0 },
      document: {
        addEventListener: () => undefined,
        documentElement: {
          className: '',
          setAttribute: (name: string, value: string) => {
            attributes[name] = value;
          },
        },
      },
    });
    expect(() => bare.runInContext(sandboxed)).not.toThrow();
    expect(attributes['data-device']).toBe('laptop');
    expect(attributes['data-pointer']).toBe('none');
    expect(attributes['data-motion']).toBe('full');
  });
});
