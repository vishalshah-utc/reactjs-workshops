import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { router } from './router';

installInterceptors();

// TODO(lab-2.2): wrap <RouterProvider> in <ThemeProvider> — providers sit OUTSIDE the router, above the layout and every page
// TODO(lab-3.2): wrap it in <ToastProvider> too — the toast viewport must outlive any route
// TODO(lab-4.2): and in <WishlistProvider> — the wishlist leaves RootLayout
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
