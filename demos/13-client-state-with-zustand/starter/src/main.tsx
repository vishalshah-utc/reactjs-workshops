import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { router } from './router';

installInterceptors();

// Providers sit OUTSIDE the router: the header and every page live inside it, and unlike
// RootLayout nothing here re-renders on navigation. Their `children` is the same
// <RouterProvider> element every time, so React skips it — only consumers re-render.
// TODO(lab-1.2): delete <WishlistProvider> here and src/context/WishlistContext.tsx — a store needs no provider
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
