import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/routes/RootLayout';
import { RouteError } from '@/routes/RouteError';

/**
 * Every URL this app answers to, in one file.
 *
 * Reading this should tell you the whole shape of the product without opening
 * anything else. That is worth protecting: when routes get declared in six
 * different components, nobody can answer "what pages do we have?" without a
 * grep.
 *
 * ── The nesting model ──────────────────────────────────────────────────────
 *
 * A route with `children` is a LAYOUT route. Its element renders, and wherever
 * that element puts an `<Outlet />`, the matched child renders. So:
 *
 *   /                     → RootLayout + CatalogPage
 *   /products/keyboard-x  → RootLayout + ProductDetailPage
 *
 * renders the header and footer ONCE and swaps only the middle. The header
 * does not unmount between pages, which is why the cart badge does not flicker
 * and an open dropdown survives navigation.
 *
 * `errorElement` catches anything thrown while rendering this route or its
 * children. Putting it here rather than at the very top is deliberate: the
 * layout stays alive, so a failed page still has a header to navigate away
 * from.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      /*
       * TODO(lab-1.2): give the layout something to render.
       *
       * `children` is empty, so every URL renders the shell with a blank
       * middle — the Outlet has nothing to put there. Add the index route:
       *
       *   import { CatalogPage } from '@/routes/CatalogPage';
       *
       *   { index: true, element: <CatalogPage /> },
       *
       * `index: true` marks the child that renders when the PARENT's path
       * matches exactly. It is how "/" gets content without the layout needing
       * a path of its own, and it is the piece people miss — a layout route
       * with children but no index renders nothing at its own URL.
       *
       * Guide, Lab 1 step C.
       */

      /*
       * TODO(lab-2.1): add the product detail route.
       *
       *   { path: 'products/:slug', element: <ProductDetailPage /> },
       *
       * `:slug` is a DYNAMIC SEGMENT. It matches any single path segment and
       * hands you the value — `/products/keyboard-x` gives `slug` the string
       * "keyboard-x". The component reads it with `useParams()`.
       *
       * Note the path has no leading slash. Child paths are RELATIVE to the
       * parent, so `products/:slug` under `/` resolves to `/products/:slug`.
       * Writing `/products/:slug` here works too but stops being portable the
       * moment the parent moves.
       *
       * Guide, Lab 2 step A.
       */

      /*
       * TODO(lab-2.2): add the cart route and a catch-all 404.
       *
       *   { path: 'cart', element: <CartPage /> },
       *   { path: '*', element: <NotFound /> },
       *
       * `*` is a SPLAT: it matches anything no other route claimed. React
       * Router ranks routes by specificity rather than by order, so this is
       * safe anywhere in the array — but keep it last, because that is where a
       * reader expects to find it.
       *
       * Without it, a typo'd URL renders the layout with an empty middle and
       * no explanation, which reads as a broken site rather than a wrong
       * address.
       *
       * Guide, Lab 2 step B.
       */

      /*
       * TODO(lab-4.1): add the back-office route, lazily.
       *
       * Most visitors never open an admin screen, so shipping it in the main
       * bundle makes every customer download code they will not run.
       *
       *   const BackOfficePage = lazy(() => import('@/routes/BackOfficePage'));
       *
       *   {
       *     path: 'backoffice',
       *     element: (
       *       <Suspense fallback={<RouteFallback />}>
       *         <BackOfficePage />
       *       </Suspense>
       *     ),
       *   },
       *
       * `lazy` and `Suspense` both come from 'react'. The Suspense boundary is
       * not optional — without one, React throws the moment the lazy component
       * suspends.
       *
       * BackOfficePage is a DEFAULT export, because that is what `lazy`
       * expects: a function returning a promise for a module with a `default`.
       *
       * Guide, Lab 4 step C.
       */
    ],
  },
]);
