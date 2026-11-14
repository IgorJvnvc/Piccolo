import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    // Worker threads start much faster than the default child processes (the suite is mostly start-up, not tests).
    pool: 'threads',
    // Pure logic runs in Node; a spec that needs a DOM opts in with `// @vitest-environment happy-dom`.
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
