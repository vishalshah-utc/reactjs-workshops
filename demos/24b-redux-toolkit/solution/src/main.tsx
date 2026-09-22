import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { router } from './router';
import { store } from './store';

installInterceptors();

// Providers sit OUTSIDE the router: the header and every page live inside it,
// and nothing here re-renders on navigation. (The wishlist provider that sat
// here in Demo 12 is gone — a Zustand store needs no provider.)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The Provider does not OWN the store — it publishes the module-scope one
        through context so useSelector can find it. It must wrap RouterProvider,
        because every page that reads the store lives inside the router.
        ThemeProvider and ToastProvider stay: Context is the right tool for a
        value with few writers that never needs selectors or devtools. */}
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
