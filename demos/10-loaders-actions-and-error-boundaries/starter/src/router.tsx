import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from './routes/RootLayout';
import { ProductsPage } from './routes/ProductsPage';
import { ProductDetailPage } from './routes/ProductDetailPage';
import { AboutPage } from './routes/AboutPage';
import { NotFoundPage } from './routes/NotFoundPage';

/**
 * The route tree. Created ONCE, at module scope — never inside a component,
 * never in state: the router owns navigation history, and recreating it
 * would reset that.
 */
// TODO(lab-1.3): attach loader / action to the product routes
// TODO(lab-2.2): HydrateFallback: AppBootSplash on the root route
// TODO(lab-5.3): ErrorBoundary on the root route and on the product detail route
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // "/" itself has no content — send visitors somewhere useful.
      { index: true, loader: () => redirect('/products') },

      { path: 'products', Component: ProductsPage },
      // Siblings, not nested: the detail page REPLACES the list, it doesn't render inside it.
      { path: 'products/:productId', Component: ProductDetailPage },

      { path: 'about', Component: AboutPage },

      // "*" matches anything unmatched above. Inside the layout, so the 404 keeps the navbar.
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
