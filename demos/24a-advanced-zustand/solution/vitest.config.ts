import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * ONE config, extended — the tests run through the app's real Vite pipeline.
 *
 * Today's tests are STORE tests: no components, no jsdom needed for the store
 * itself. `environment: 'jsdom'` is here for one reason only — `persist` talks
 * to `localStorage`, and Node has none.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules/**', 'dist/**'],
      css: false,
      restoreMocks: true,
      /**
       * Vitest does not read `.env.development` — that is a `vite dev` thing.
       * Without this, the first import that reaches `src/config/env.ts` throws
       * "Missing required env var VITE_API_BASE_URL" before a test runs.
       */
      env: {
        VITE_API_BASE_URL: 'https://dummyjson.com',
        VITE_PAGE_SIZE: '12',
        VITE_LOG_LEVEL: 'error',
      },
    },
  }),
);
