import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from './routes/RootLayout';
import { RootErrorBoundary } from './routes/RootErrorBoundary';
import { AppBootSplash } from './routes/AppBootSplash';
import { ProductsPage, productsAction, productsLoader } from './routes/ProductsPage';
import { ProductDetailPage, productDetailLoader } from './routes/ProductDetailPage';
import { ProductErrorBoundary } from './routes/ProductErrorBoundary';
import { AboutPage } from './routes/AboutPage';
import { NotFoundPage } from './routes/NotFoundPage';

// TODO(lab-3.1): the /login route — Component + loader + action
// TODO(lab-4.3): /account subtree with middleware: [authMiddleware]; /account/team with requireRole('admin')
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary, // the safety net — without it, any uncaught error blanks the app
    HydrateFallback: AppBootSplash, // first load only, while root loaders run against a blank page
    children: [
      { index: true, loader: () => redirect('/products') },

      // A route file exports its Component, loader and action together; the tree stays a readable map.
      { path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction },
      {
        path: 'products/:productId',
        Component: ProductDetailPage,
        loader: productDetailLoader,
        ErrorBoundary: ProductErrorBoundary, // scoped: a missing product keeps the navbar
      },

      { path: 'about', Component: AboutPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
