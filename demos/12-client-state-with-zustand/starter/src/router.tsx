import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout, rootLoader } from './routes/RootLayout';
import { RootErrorBoundary } from './routes/RootErrorBoundary';
import { AppBootSplash } from './routes/AppBootSplash';
import { ProductsPage, productsAction, productsLoader } from './routes/ProductsPage';
import { ProductDetailPage, productDetailLoader } from './routes/ProductDetailPage';
import { ProductErrorBoundary } from './routes/ProductErrorBoundary';
import { AboutPage } from './routes/AboutPage';
import { LoginPage, loginAction, loginLoader } from './routes/LoginPage';
import { AccountLayout, accountLoader } from './routes/account/AccountLayout';
import { ProfilePage, profileLoader } from './routes/account/ProfilePage';
import { CartsPage, cartsLoader } from './routes/account/CartsPage';
import { TeamPage, teamLoader } from './routes/account/TeamPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { authMiddleware, requireRole } from './routes/middleware';

export const router = createBrowserRouter([
  {
    id: 'root', // lets any page read the root loader's data with useRouteLoaderData<typeof rootLoader>('root')
    path: '/',
    Component: RootLayout,
    loader: rootLoader,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: AppBootSplash,
    children: [
      { index: true, loader: () => redirect('/products') },

      { path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction },
      {
        path: 'products/:productId',
        Component: ProductDetailPage,
        loader: productDetailLoader,
        ErrorBoundary: ProductErrorBoundary,
      },

      { path: 'about', Component: AboutPage },
      { path: 'login', Component: LoginPage, loader: loginLoader, action: loginAction },

      {
        path: 'account',
        Component: AccountLayout,
        loader: accountLoader,
        middleware: [authMiddleware], // ← protects EVERYTHING below, including routes added later
        children: [
          { index: true, Component: ProfilePage, loader: profileLoader },
          { path: 'carts', Component: CartsPage, loader: cartsLoader },
          // TODO(lab-4.3): { path: 'checkout', action: checkoutAction } — an action-only route, guarded by the middleware above
          {
            path: 'team',
            Component: TeamPage,
            loader: teamLoader,
            middleware: [requireRole('admin')], // ← chain: auth → role → loader
          },
        ],
      },

      { path: '*', Component: NotFoundPage },
    ],
  },
]);
