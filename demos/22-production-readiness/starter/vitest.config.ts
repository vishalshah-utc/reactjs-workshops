import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * ONE config, extended — not a second one.
 *
 * `mergeConfig` starts from the app's real `vite.config.ts`, so the tests run
 * through exactly the same pipeline as the app: the React Compiler plugin,
 * the same `resolve`, the same TypeScript/JSX handling. A separate, hand-built
 * test config is the classic way to end up with tests that pass against code
 * the production build never sees.
 *
 * Vitest loads `vitest.config.ts` in preference to `vite.config.ts`, which is
 * why this file exists at all: it keeps `test` out of the build config while
 * still inheriting every line of it.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      /** A DOM without a browser. `render()` needs `document`; Node has none. */
      environment: 'jsdom',

      /** `describe`/`it`/`expect`/`vi` without an import in every file. Mirrored in tsconfig.app.json's `types`. */
      globals: true,

      /** Runs once per test FILE, before anything else: matchers, cleanup, the MSW server, jsdom's missing APIs. */
      setupFiles: ['./src/test/setup.ts'],

      /**
       * THE line that makes this project testable at all.
       *
       * Vitest does not read `.env.development` — that is a `vite dev` thing.
       * Without this, the first `import` of anything that reaches
       * `src/config/env.ts` throws "Missing required env var VITE_API_BASE_URL"
       * before a single test runs.
       */
      env: {
        VITE_API_BASE_URL: 'https://dummyjson.com',
        VITE_PAGE_SIZE: '12',
        VITE_LOG_LEVEL: 'error',
      },

      /** Tests live next to the code they test. `e2e/` is Playwright's — Vitest must never try to run it. */
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],

      /** CSS is not what these tests assert on; skipping it makes every file faster. */
      css: false,

      /** `vi.fn()` spies are reset between tests, so one test cannot see another's calls. */
      restoreMocks: true,

      coverage: {
        // Needs @vitest/coverage-v8; Vitest offers to install it the first time you run `npm run test:coverage`.
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        // Config, types and the test kit itself are not the thing under test.
        exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts', 'src/types/**'],
      },
    },
  }),
);
