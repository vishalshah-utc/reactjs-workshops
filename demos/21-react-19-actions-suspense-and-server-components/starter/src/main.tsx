import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { queryClient } from './lib/queryClient';
import { router } from './router';

installInterceptors();

/**
 * The devtools are a DEV TOOL, and about 50 kB of one.
 *
 * `import.meta.env.DEV` is a compile-time constant, so in a production build
 * the condition is `false`, the dynamic import is never reached and Rollup
 * drops the chunk entirely. `lazy` + `Suspense` is what lets us do that
 * without a top-level `await`.
 */
const Devtools = lazy(async () => {
  const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
  return { default: ReactQueryDevtools };
});

// Providers sit OUTSIDE the router: the header and every page live inside it,
// and nothing here re-renders on navigation. (The wishlist provider that sat
// here in Demo 12 is gone — a Zustand store needs no provider.)
//
// QueryClientProvider does NOT own the client — it publishes the module-scope
// one from lib/queryClient.ts through context, so hooks can find it. The
// loaders import the same object directly.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
);
