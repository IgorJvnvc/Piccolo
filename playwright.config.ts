import { defineConfig } from '@playwright/test';

const PORT = 4321;
const TV_USER_AGENT =
  'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36';

/**
 * Device matrix. Uses the system Chrome (no browser download). Each project loads the same built
 * site; capability detection decides what runs, which is exactly what we want to verify per device.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  // The frame-sampling specs take 10 to 30 s on a loaded machine (software-rendered Chrome, a busy disk), and the 30 s default
  // turned slow context teardowns into failures. A test that really hangs still ends within a minute.
  timeout: 60_000,
  fullyParallel: true,
  // Five device projects share one machine; unbounded parallelism makes island-hydration timing flaky.
  workers: process.env['CI'] ? 2 : 3,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
  // The frame-sampling specs are the slow ones, so each runs where it can fail differently: `motion` on desktop (full tier)
  // and TV (lite tier), `islands` on desktop (quick view, tabs) and phone (mobile menu as well). The tablet and the phone share
  // the mobile menu, and the TV runs the desktop's islands.
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testMatch: /(desktop|shared|a11y|progressive|not-found|motion|islands)\.spec\.ts/ },
    {
      name: 'reference',
      use: { viewport: { width: 1253, height: 712 } },
      testMatch: /reference\.spec\.ts/,
    },
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
      testMatch: /(mobile|shared|not-found|islands)\.spec\.ts/,
    },
    {
      name: 'tablet',
      use: { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
      testMatch: /(mobile|shared|not-found)\.spec\.ts/,
    },
    {
      name: 'tv',
      use: { viewport: { width: 1920, height: 1080 }, userAgent: TV_USER_AGENT },
      testMatch: /(tv|shared|not-found|motion)\.spec\.ts/,
    },
  ],
});
