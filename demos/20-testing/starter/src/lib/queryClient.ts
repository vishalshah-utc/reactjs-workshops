import { QueryClient } from '@tanstack/react-query';
import { isRetryable } from './retry';

/**
 * ONE cache for the whole application, created at MODULE SCOPE.
 *
 * Every other provider in this app is a React component (`ThemeProvider`,
 * `ToastProvider`) because only React needs what they hold. The query cache is
 * different: a router LOADER has to reach it, and a loader is a plain function
 * with no component above it and no hooks available. A module-scope client is
 * the only thing both a loader and a hook can import.
 *
 * That is safe HERE because ShopScope is a client-only SPA: one browser tab,
 * one user, one module graph, and the module is evaluated once. A server-
 * rendered framework must not do this — one Node process serves every request,
 * so a module-scope cache would leak one user's data into another user's page.
 * There you create the client per request (or in a `useState` initialiser) and
 * hand it to the loader through the router's context instead.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * How long data is considered FRESH. Fresh data is never re-fetched — not
       * on mount, not on focus, not on reconnect. It is the single number that
       * decides how chatty the app is.
       *
       * 0 (the default) means every mount refetches in the background, which is
       * safe and noisy. 30 seconds is the honest answer for a catalogue: prices
       * and stock move, but not between two clicks.
       */
      staleTime: 30_000,

      /**
       * How long an UNUSED entry is kept before it is thrown away. `gcTime`
       * starts when the last component watching a key unmounts. It is not
       * freshness — a stale entry is still rendered instantly while a
       * background refetch runs. Five minutes is the default; ten is a
       * catalogue you page back and forth through.
       */
      gcTime: 10 * 60_000,

      /**
       * `withRetry` (Demo 14) is still the tool for anything OUTSIDE the cache.
       * Inside it, TanStack Query already retries with exponential backoff, so
       * wrapping a `queryFn` in `withRetry` would give you 3 × 3 = 9 attempts
       * and a loader that hangs for half a minute. Pick ONE retry layer per
       * request — this one — and reuse the policy `withRetry` already encodes.
       */
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),

      /** A refetch when the user comes back to the tab is usually right; with a 30 s staleTime it is also rare. */
      refetchOnWindowFocus: true,
    },
    mutations: {
      /** Writes are NOT idempotent. A POST that timed out may have succeeded — see lib/retry.ts. */
      retry: false,
    },
  },
});
