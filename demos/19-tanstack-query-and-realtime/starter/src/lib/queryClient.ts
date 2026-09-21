import { QueryClient } from '@tanstack/react-query';

/**
 * ONE cache for the whole application, created at MODULE SCOPE.
 *
 * Every other provider in this app is a React component (`ThemeProvider`,
 * `ToastProvider`) because only React needs what they hold. The query cache is
 * different: a router LOADER has to reach it, and a loader is a plain function
 * with no component above it and no hooks available. A module-scope client is
 * the only thing both a loader and a hook can import.
 */
// TODO(lab-1.1): configure the defaults — `staleTime` (how long data is fresh),
// `gcTime` (how long an unused entry is kept), a `retry` predicate that reuses
// `isRetryable` from lib/retry.ts, and `mutations: { retry: false }`.
export const queryClient = new QueryClient();
