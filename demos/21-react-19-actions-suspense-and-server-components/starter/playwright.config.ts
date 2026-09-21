import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Playwright drives a real browser against a real BUILD.
 *
 * `npm run preview` serves `dist/`, not the dev server — so this suite tests
 * the artefact you deploy: minified, with the production env file, with the
 * React Compiler's output and with the mock price feed absent (it is a
 * `serve`-only Vite plugin). Point it at `npm run dev` and you are testing
 * something no user will ever load.
 */
export default defineConfig({
  testDir: './e2e',
  // A journey that touches the network is not a millisecond test. Say so once,
  // here, instead of sprinkling timeouts through the spec.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Deterministic in CI: no `.only` left behind, retry a flake twice, one worker.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // Artefacts only for failures: a trace is ~1 MB and useless when green.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  /**
   * Playwright builds and serves the app itself, so `npm run test:e2e` is one
   * command on a laptop and the same one command in CI.
   */
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
