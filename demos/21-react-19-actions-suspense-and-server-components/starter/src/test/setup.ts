import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

/**
 * Runs once per test file, before any test. Four jobs.
 */

// 1. MATCHERS. `@testing-library/jest-dom/vitest` registers toBeInTheDocument,
//    toBeDisabled, toHaveAttribute and friends on Vitest's `expect`. The
//    `/vitest` entry point matters — the bare one patches Jest's.

// 2. jsdom IS NOT A BROWSER. It implements the DOM; it implements no layout and
//    none of the observer APIs. Anything the app calls that jsdom lacks must be
//    stubbed here, once, rather than in every test that happens to render it.
beforeAll(() => {
  // ThemeContext subscribes to prefers-color-scheme through useSyncExternalStore.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  );

  // useIntersection (EndlessGrid's sentinel) and react-virtual's measurement.
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  vi.stubGlobal('ResizeObserver', NoopObserver);

  // Layout does not exist, so neither does scrolling. The Pager calls it.
  Element.prototype.scrollIntoView = vi.fn();

  // 3. THE NETWORK. One server for the whole run; `onUnhandledRequest: 'error'`
  //    turns "a request nobody mocked" into a loud failure instead of a hang.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // React Testing Library unmounts what a test rendered. Without this, effects
  // from test 1 (timers, subscriptions, polling) are still running during test 2.
  cleanup();
  // Handlers a single test overrode with server.use() go back to the defaults.
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
