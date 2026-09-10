import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';

/**
 * The entry point.
 *
 * Sessions 1–3 rendered `<App />` here. From this session the top of the tree
 * is a ROUTER: it reads the address bar, decides which route matches, and
 * renders that route's element. `App.tsx` is gone — what used to be one
 * component holding a `view` state variable is now several route components
 * that the URL chooses between.
 *
 * TODO(lab-1.1): mount the router.
 *
 * Add two imports at the top of this file:
 *
 *   import { RouterProvider } from 'react-router/dom';
 *   import { router } from '@/router';
 *
 * …then replace the placeholder <div> below with:
 *
 *   <RouterProvider router={router} />
 *
 * Note the import path: `react-router/dom`, not `react-router`. The DOM entry
 * point is the one that knows about the browser's History API. The bare
 * `react-router` import gives you the router-agnostic pieces — `Link`,
 * `useParams`, `createBrowserRouter` — which is what every other file in this
 * app imports.
 *
 * `router` is built in src/router.tsx, which is the next file you open. Right
 * now it declares the layout but has no child routes, so after this step you
 * will get the header and footer with an empty middle. That is expected —
 * Lab 1 step C fills it in.
 *
 * Guide, Lab 1 step B.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-lg font-semibold">No router yet</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Lab 1 replaces this with <code>&lt;RouterProvider /&gt;</code>. See the
        TODO in <code>src/main.tsx</code>.
      </p>
    </div>
  </StrictMode>,
);
