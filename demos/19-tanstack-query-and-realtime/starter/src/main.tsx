import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { router } from './router';

// TODO(lab-1.2): wrap the tree in <QueryClientProvider client={queryClient}> (the
// module-scope client from lib/queryClient.ts) and mount <ReactQueryDevtools>
// behind `import.meta.env.DEV`, lazily, so the production bundle never sees it.

installInterceptors();

// Providers sit OUTSIDE the router: the header and every page live inside it,
// and nothing here re-renders on navigation. (The wishlist provider that sat
// here in Demo 12 is gone — a Zustand store needs no provider.)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
