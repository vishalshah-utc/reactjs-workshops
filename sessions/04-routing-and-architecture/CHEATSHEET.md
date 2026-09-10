# Session 4 — Cheat sheet

**React Router 7.** One page. Skim before the session; refer to it during.

---

## Two import paths

```jsx
import { RouterProvider } from 'react-router/dom';   // ← ONLY this one
import { createBrowserRouter, Link, useParams } from 'react-router';  // everything else
```

`react-router/dom` is the browser History API entry point. Everything else
comes from bare `react-router`. Getting this wrong is the first error most
people hit.

---

## Declaring routes

```jsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,          // renders for every child
    errorElement: <RouteError />,     // catches render errors below here
    children: [
      { index: true, element: <CatalogPage /> },        // matches "/" exactly
      { path: 'products/:slug', element: <Detail /> },  // dynamic segment
      { path: 'cart', element: <CartPage /> },
      { path: '*', element: <NotFound /> },             // splat — last
    ],
  },
]);
```

| Piece | Means |
|---|---|
| `children` | this is a **layout route** |
| `index: true` | renders when the parent path matches *exactly* |
| `:slug` | dynamic segment — one path segment, any value |
| `*` | splat — anything nothing else claimed |
| no leading `/` on a child | path is **relative to the parent** |

---

## Rendering the child

```jsx
import { Outlet } from 'react-router';

<main>
  <Outlet />                        {/* the matched child goes here */}
  <Outlet context={someValue} />    {/* …and can be handed a value */}
</main>
```

```jsx
const value = useOutletContext();   // read it in the child
```

> **Blank page below the header?** Missing `<Outlet />`. It produces no error
> and no warning.

---

## Navigating

```jsx
<Link to="/cart">Cart</Link>
<Link to={`/products/${slug}`}>View</Link>
<Link to=".." relative="path">Up</Link>

<NavLink
  to="/"
  end                                     // ← without this, "/" is active everywhere
  className={({ isActive }) => (isActive ? 'active' : '')}
>
  Storefront
</NavLink>
```

**`<a href>` triggers a full document request.** The bundle re-downloads, the
app re-mounts, and all state is lost. `<Link>` swaps the route in place.

Programmatic:

```jsx
const navigate = useNavigate();
navigate('/cart');
navigate('/cart', { replace: true });   // no new history entry
navigate(-1);                           // back
```

---

## Reading the URL

```jsx
const { slug } = useParams();            // string | undefined
const location = useLocation();          // { pathname, search, hash, state }
const [params, setParams] = useSearchParams();
```

### `useSearchParams` — the big one

```jsx
const [searchParams, setSearchParams] = useSearchParams();

searchParams.get('q');                   // string | null
searchParams.getAll('tag');              // string[]
searchParams.has('sort');

setSearchParams(newParams);                     // pushes a history entry
setSearchParams(newParams, { replace: true });  // overwrites the current one
```

**Derive, never duplicate:**

```jsx
const filters = parseFilters(searchParams);     // ✓ one source of truth
const [filters, setFilters] = useState(...);    // ✗ now two, and they will drift
```

---

## replace vs push

| Interaction | Use |
|---|---|
| Typing in a search box | `{ replace: true }` |
| Dragging a slider | `{ replace: true }` |
| Picking a category | push (default) |
| Changing the sort | push (default) |

**Continuous edits replace. Discrete choices push.** Six history entries for
"laptop" means six Back presses to escape.

---

## The URL is untrusted input

```ts
// ✗ a cast is a lie — the value is whatever was in the address bar
sort: params.get('sort') as SortKey,

// ✓ validate against the union
sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : defaultFilters.sort,
```

**Omit defaults when writing:**

```
/?q=&category=all&sort=featured        ✗
/?q=laptop&sort=price-asc              ✓
```

---

## What belongs in the URL?

| In the URL | Local state |
|---|---|
| Search query, filters, sort | Display density |
| Page number | Whether a dropdown is open |
| Selected tab | Unsaved form text |
| Anything you would send someone | Anything private or transient |

The test: **would a colleague opening this link expect to see the same
screen?**

---

## Route errors

```jsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

const error = useRouteError();

if (isRouteErrorResponse(error)) {
  // a Response the router threw — error.status, error.statusText
} else if (error instanceof Error) {
  // an ordinary exception — error.message
}
```

**Catches:** errors thrown while rendering the route or its children.
**Does not catch:** event handlers, async callbacks that already escaped,
errors after unmount. Those need normal `try`/`catch`.

Put `errorElement` on the layout's **children**, so the header survives.

---

## Code splitting a route

```jsx
import { lazy, Suspense } from 'react';

const BackOffice = lazy(() => import('@/routes/BackOfficePage'));  // DEFAULT export

{
  path: 'backoffice',
  element: <Suspense fallback={<RouteFallback />}><BackOffice /></Suspense>,
}
```

Verify with `npm run build` — the chunk appears separately.

---

## Architecture

```
routes/     →  features/  →  components/, hooks/, lib/
```

Dependencies point **one way**. Shared code never imports from a feature.

| Question | Answer |
|---|---|
| Could this appear in a different product? | → `components/` |
| Does it know what a product is? | → `features/catalog/` |
| Does it work on any value? | → `hooks/` |

Enforce it:

```js
'no-restricted-imports': ['error', {
  patterns: [{ group: ['@/features/*', '@/routes/*'], message: '…' }],
}],
```

---

## Deploying an SPA — the one config item

The host must rewrite **all unknown paths to `/index.html`**, or a refresh on
`/products/42` returns 404. Vite's dev server does this for you; Netlify,
Vercel, nginx and S3 each need telling.

---

## Errors you will hit

| Message / symptom | Cause |
|---|---|
| Blank below the header | Missing `<Outlet />` |
| Blank at `/` but other routes work | Missing `index: true` route |
| `useNavigate() may be used only in the context of a <Router>` | Component rendered outside `RouterProvider` |
| Nav link always highlighted | Missing `end` on the `/` NavLink |
| Full page reload on every nav | Still using `<a href>` |
| `A <Route> is only ever to be used as the child of <Routes>` | Mixing the JSX and object route APIs |
| 404 on refresh in production | Host is not rewriting to `index.html` |
| Lazy route throws immediately | Missing `<Suspense>` boundary |
