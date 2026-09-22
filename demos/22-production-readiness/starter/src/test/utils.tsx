import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

/**
 * A query client PER TEST, never the app's.
 *
 * `src/lib/queryClient.ts` creates one at module scope, which is right for a
 * browser tab and wrong for a test run: one cache shared by two hundred tests
 * means test 41 sees what test 12 fetched, and the order they run in decides
 * whether the suite passes. A fresh client is thrown away with the test.
 *
 * `retry: false` is the other half. The app's client retries twice with
 * backoff — correct in production, and in a test it turns "assert the error
 * state" into a five-second wait for a failure you deliberately arranged.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** The URL the component thinks it is on — `<Link>`, `useSearchParams`, `useParams`. */
  route?: string;
  /** Pass your own when the test needs to seed or inspect the cache. */
  client?: QueryClient;
  /**
   * Set to `false` when the thing under test brings its own router — a
   * `createRoutesStub` (Lab 5) is a router, and two routers nested inside one
   * another is an error, not a stricter test.
   */
  withRouter?: boolean;
}

interface ProvidersResult extends RenderResult {
  client: QueryClient;
  user: ReturnType<typeof userEvent.setup>;
}

/**
 * Render a component with everything `main.tsx` gives it — minus the router,
 * which is a `MemoryRouter` here because jsdom has no address bar.
 *
 * Every test in this project goes through this function. The alternative is a
 * wrapper copy-pasted into forty files, and the day you add a provider you
 * edit forty files.
 */
export function renderWithProviders(ui: ReactElement, { route = '/', client = createTestQueryClient(), withRouter = true, ...options }: ProvidersOptions = {}): ProvidersResult {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <ToastProvider>{withRouter ? <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> : children}</ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    // `userEvent.setup()` before render, once per test: it installs its own
    // pointer/keyboard state, and calling it per interaction loses that state.
    user: userEvent.setup(),
    client,
    ...render(ui, { wrapper: Providers, ...options }),
  };
}
