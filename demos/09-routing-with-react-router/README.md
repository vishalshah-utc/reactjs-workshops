# Demo 9 — Routing with React Router v8

**Demo guide** · ~110 minutes · the app becomes pages, and a search becomes a link

---

## Where you are starting from

The starter is **Demo 8, finished**: real create/edit/delete through the
service layer, one `useApi` hook for every fetch. It is one URL. Nothing is
linkable, the back button leaves the site, and a refresh forgets every filter.

New stubs: `src/router.tsx`, `src/routes/RootLayout.tsx`,
`src/routes/NotFoundPage.tsx`, `src/routes/ProductDetailPage.tsx`,
`src/hooks/useProductFilters.ts`. Finished and ready: `src/routes/AboutPage.tsx`.

## What you ship today

A routed app: a layout with a real navbar, `/products`, `/products/42`,
`/about`, a 404 that keeps the navbar, a redirect from `/`, a detail *page*
that replaces the drawer, a wishlist shared between the header and the grid
through Outlet context, and every filter — search, sort, category, page —
living in the query string.

By the end you will be able to answer, without hesitating:

- What changed in React Router **v8**, and why `react-router-dom` no longer exists
- The three modes, and why a Vite SPA with its own backend wants **Data Mode**
- How nested routes and `<Outlet />` compose pages inside layouts
- Why a React Bootstrap `Nav.Link` needs `as={NavLink}` — and what happens without it
- Why URL params are always strings
- Why filters belong in the URL, the two `useSearchParams` traps, and when to `replace`

> **A version check that matters.** This track pins `react-router@8.3.1`. If
> you've used v6 or v7, three things are different and one of them will bite
> you in the first five minutes — read §21 of the study guide or the table in
> Lab 1 before writing an import.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/09-routing-with-react-router/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/09-routing-with-react-router/starter && npm install && npm run dev`.
**Node 22.22+ is required** from this demo on — `react-router@8` enforces it.

---

## The cold open

Ninety seconds. Run the app. Filter to a category. Sort by price. Type a
search. Open a product in the drawer.

1. **Send a colleague what you're looking at.** You can't. The address bar
   says `/`.
2. **Reload.** Everything resets.
3. **Press the back button.** You leave the site.
4. **Open the product's drawer, and try to bookmark *it*.** There's nothing to
   bookmark.

None of that is a missing feature. It's a consequence of a decision made in
Demo 2 and never revisited: the app stores what the user is looking at in
`useState`, and `useState` lives in memory, which the address bar knows
nothing about. Today you move it.

---

## Lab 1 — Your first router (25 min)

### Problem

One component renders everything. There is no concept of "a page", so there
is nothing for a URL to point at.

### Concept

**What v8 changed.** Read this table even if you know React Router:

| | v6 | v7 | **v8** |
|---|---|---|---|
| Package | `react-router-dom` | `react-router` (dom is a shim) | **`react-router` only — `react-router-dom` is removed** |
| `RouterProvider` from | `react-router-dom` | `react-router/dom` | **`react-router/dom`** |
| Everything else from | `react-router-dom` | `react-router` | **`react-router`** |
| Middleware | — | behind a flag | **always on** (Demo 11) |
| Minimum React / Node | 16.8 / 14 | 18 / 20 | **19.2.7 / 22.22** |

The import rule, memorised:

```tsx
import { createBrowserRouter, Link, useParams /* …everything else */ } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { LoaderFunctionArgs } from 'react-router';   // the types come from the same package — no @types/… to install
```

If you paste a snippet that imports from `react-router-dom`, that's your
first fix.

**Three modes.** *Declarative* (`<BrowserRouter>` + `<Routes>`): components
only, no data features. *Framework*: the Vite plugin, file-based routes, SSR.
**Data Mode** — `createBrowserRouter([…])` + `<RouterProvider>` — is the one
for a Vite SPA with a separate backend, because Demo 10's loaders, actions and
error boundaries need it. That's us.

**A route object** names a path and a component, and can nest `children`
that render into the parent's `<Outlet />`:

```tsx
createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,          // navbar + <Outlet />
    children: [
      { path: 'products', Component: ProductsPage },   // renders INSIDE RootLayout
      { path: '*', Component: NotFoundPage },          // anything unmatched
    ],
  },
]);
```

**Create the router once, at module scope.** Never in a component, never in
state. It owns the navigation history; recreating it resets that.

### Steps

**A. Create `src/routes/ProductsPage.tsx` — `TODO(lab-1.4)` in `App.tsx`**

Move `App.tsx` into it. Concretely:

1. Rename the file to `src/routes/ProductsPage.tsx` and the function to
   `export function ProductsPage()` (named export, no default).
2. Fix every import path: `./api/…` → `../api/…`, `./hooks/…` → `../hooks/…`,
   `./components/…` → `../components/…`, `./lib/…` → `../lib/…`.
3. **Delete** the `<SiteHeader …/>` line and the `<Container className="py-4">`
   wrapper (keep its children). The layout owns both now.
4. Delete the `SiteHeader` and `Container` imports.

Leave the wishlist, drawer and filters state where they are for now — Labs
2–4 move each one.

**B. `src/routes/RootLayout.tsx` — `TODO(lab-1.2)`** — add scroll restoration:

```tsx
import { Outlet, ScrollRestoration } from 'react-router';
// …
      <Container className="py-4">
        <Outlet />
      </Container>

      {/* Restores scroll on back/forward, resets to top on new navigations — what real page loads do for free. */}
      <ScrollRestoration />
```

SPAs break scroll behaviour by default: navigate "back" and you're at the top
of a list you'd scrolled halfway down. One element fixes it.

**C. `src/router.tsx` — `TODO(lab-1.1)`**

```tsx
import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from './routes/RootLayout';
import { ProductsPage } from './routes/ProductsPage';
import { AboutPage } from './routes/AboutPage';
import { NotFoundPage } from './routes/NotFoundPage';

/** The route tree. Created ONCE, at module scope — never inside a component. The array literal is fully typed: a typo in `Component` or `loader` is a compile error. */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // "/" itself has no content — send visitors somewhere useful.
      { index: true, loader: () => redirect('/products') },

      { path: 'products', Component: ProductsPage },
      { path: 'about', Component: AboutPage },

      // "*" matches anything unmatched above. Inside the layout, so the 404 keeps the navbar.
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
```

`{ index: true }` is the child that renders when the parent's path matches
*exactly*. Here it's a `loader` that redirects — a preview of Demo 10. Delete
the `import App` line.

**D. `src/main.tsx` — `TODO(lab-1.3)`**

```tsx
import { RouterProvider } from 'react-router/dom';
import { router } from './router';
// …
<StrictMode>
  <RouterProvider router={router} />
</StrictMode>
```

Delete the `import App` line.

### Verify

Visit `/` — redirected to `/products`, the app as before. Visit `/about` —
the About card, **inside the navbar**. Visit `/nonsense` — "Not found.",
still inside the navbar, because the `*` route is a child of the layout.

Move `{ path: '*', … }` *outside* `children` (as a second top-level route)
and revisit `/nonsense`. The navbar is gone. That's nesting doing its job.
Put it back.

### Watch out

**`<Button as={Link} to="/products">` is a type error.** In JavaScript this
works; in TypeScript, react-bootstrap's `as` prop can't see the router `Link`'s
props, so `to` is *"not assignable"*. The idiom is the other way round — a
`Link` wearing Bootstrap's button classes: `<Link to="/products" className="btn btn-outline-secondary">`.
Same pixels, and it type-checks. (`Nav.Link as={NavLink}` and
`Navbar.Brand as={Link}` are fine — those components are typed to accept it.)

**`import … from 'react-router-dom'`** — *"Failed to resolve import"*. The
package doesn't exist in v8. `react-router`, and `react-router/dom` for
`RouterProvider` only.

**`Component: <ProductsPage />`** instead of `Component: ProductsPage`. The
prop wants the *component*, not an *element*. (`element: <ProductsPage />`
also works, for legacy reasons — pick `Component` and be consistent.)

**A refresh on `/about` 404s in production.** Dev is fine — Vite serves
`index.html` for every path. A static host needs a rewrite rule
(`/* /index.html 200` on Netlify, `try_files $uri /index.html` on nginx).
Demo 14.

### Challenge (2 min)

Add a `/deals` route that renders `<ProductsPage />` too. Notice it works —
and notice that the URL now says "deals" while the page shows everything.
Lab 4 gives you the tool to make `/deals` actually *mean* something.

### In the real world

The route tree is the first file a new developer opens in a React app. Keep it
readable: one `router.tsx`, routes that point at files named after them, and
no logic — just the map.

---

## Lab 2 — Layouts, links, and shared state (25 min)

### Problem

Three things are still wrong. The nav links are `<a href="#…">` — click one
and the page reloads, losing everything. The 404 page is a bare "Not found."
And the wishlist: it lived in `App`, which no longer exists, so the header
count and the grid can't both see it.

### Concept

**Never use `<a href>` inside an SPA.** It triggers a full page load — every
piece of state is gone. `<Link to>` navigates without reloading. `<NavLink to>`
is a `Link` that knows whether it's *active*, so it can style itself.

**With React Bootstrap, that's `as={Link}`.** Any Bootstrap component that
renders an anchor — `Nav.Link`, `Navbar.Brand`, `Button`, `Breadcrumb.Item` —
takes an `as` prop:

```tsx
<Nav.Link as={NavLink} to="/products" end>Products</Nav.Link>      {/* ✅ type-checks */}
<Link to="/products" className="btn btn-outline-secondary">Back</Link>  {/* ✅ a Link dressed as a button */}
<Button as={Link} to="/products">Back</Button>                      {/* ❌ compiles in JS, a type error in TS — see Watch out */}
```

Forget `as={Link}` and you have a beautifully styled full-page reload.

**`end` on `NavLink`** means "active only on an exact match". Without it,
`/products` stays highlighted while you're on `/products/42`.

**Outlet context shares state from a layout to its pages.** The wishlist
belongs to the *app*, not to the products page — it should survive
navigating to About and back. So it lives in `RootLayout`, and `<Outlet
context={…} />` hands it down. Any page reads it with `useOutletContext()`.
It's the lightest tool for "state owned by the layout, read by some pages" —
lighter than Context, and scoped to the route tree.

### Steps

**A. `src/components/SiteHeader.tsx` — `TODO(lab-2.1)`**

```tsx
import { Link, NavLink } from 'react-router';

/** Data, not markup. `to` paths, not `href`s — these are router links now. */
const NAV_LINKS = [
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
];
// …
<Navbar.Brand as={Link} to="/">
// …
{NAV_LINKS.map((link) => (
  <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.to === '/products'}>
    {link.label}
  </Nav.Link>
))}
```

**B. `src/routes/NotFoundPage.tsx` — `TODO(lab-2.2)`**

```tsx
import { Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <Alert variant="warning">
      <Alert.Heading className="h5">Page not found</Alert.Heading>
      <p>
        Nothing lives at <code>{location.pathname}</code>.
      </p>
      {/* react-bootstrap's `as` prop doesn't type-check against the router's Link — so a Link wearing Bootstrap's button classes */}
      <Link to="/products" className="btn btn-outline-secondary">
        Back to products
      </Link>
    </Alert>
  );
}
```

**C. `src/routes/RootLayout.tsx` — `TODO(lab-2.3)`** — the wishlist moves up:

```tsx
import { useState } from 'react';
// …
/** What the layout shares with its pages. Pages read it with useOutletContext<RootOutletContext>(). */
export interface RootOutletContext {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
}

export function RootLayout() {
  const [wishlist, setWishlist] = useState<number[]>([]);

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  const outletContext: RootOutletContext = { wishlist, toggleWishlist };   // typed once, here

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      <Container className="py-4">
        <Outlet context={outletContext} />
      </Container>

      <ScrollRestoration />
    </>
  );
}
```

And in **`src/routes/ProductsPage.tsx`**, read it instead of owning it:

```tsx
import { useOutletContext } from 'react-router';
import type { RootOutletContext } from './RootLayout';
// …
// The generic is the contract: the layout exports the type, the page imports it. Rename a field and both sides know.
const { wishlist, toggleWishlist } = useOutletContext<RootOutletContext>();
```

Delete the page's own `wishlist` state and `toggleWishlist` function, and the
`setWishlist(…)` line inside `handleDelete`.

### Verify

Click **About**, then **Products**. No page reload — watch the Network tab:
nothing. The active link is highlighted, and only the active one. Click a few
hearts, go to About, come back: **the hearts survive**, because the layout
never unmounted. Visit `/nowhere` — the 404 names the path and links home.

### Watch out

**`<Nav.Link href="/products">`** — styled perfectly, reloads the page,
wishlist gone. `as={NavLink} to=`.

**`useOutletContext()` returns `undefined`** — the page is rendered outside a
layout that provides it, or the `<Outlet>` has no `context` prop. Check the
route tree.

**`NavLink` without `end`** — `/products` stays active on `/products/42`
(next lab). Add it to the link whose path is a prefix of others.

### Challenge (2 min)

Add a **Wishlist** badge to the navbar that's a `<Link to="/products?saved=1">`.
It won't do anything yet — Lab 4 is where a query param starts to mean
something. Think about what `ProductsPage` would need to read.

### In the real world

Outlet context scales to "a handful of values the layout owns". Beyond that —
auth user, theme, a cart with reducers — you're into Context or a store. The
signal to upgrade is a page that reaches for something the layout *doesn't*
own but is passing through. Notice you don't have that problem yet.

---

## Lab 3 — Dynamic segments: a real product page (25 min)

### Problem

The product drawer isn't linkable. You can't bookmark it, share it, or open
it in a new tab. Detail views should almost always be *routes*, not modal
state.

### Concept

**`:productId` is a param.** `path: 'products/:productId'` matches
`/products/42` and captures `{ productId: '42' }`, readable with
`useParams()`.

**Params are always strings.** `'42'`, never `42`. `product.id === productId`
is `false` for `1 === '1'`. Coerce before you compare or calculate.

**Route ranking is by specificity, not order.** `/products/new` beats
`/products/:id` even if declared after it — a static segment outranks a
dynamic one. You don't have to order routes carefully.

**Siblings or nested?** `products/:productId` *inside* `products` would
render the detail *within* the list page's `<Outlet />` — a master-detail
layout. That's a legitimate design (email clients). Here we want the detail
to *replace* the list, so they're siblings. Nest for shared UI; keep siblings
for separate screens.

### Steps

**A. `src/routes/ProductDetailPage.tsx` — `TODO(lab-3.1)`**

```tsx
import { useCallback } from 'react';
import { Badge, Card, Col, Placeholder, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router';
import { getProduct } from '../api/services/products';
import { useApi } from '../hooks/useApi';
import { PriceTag } from '../components/PriceTag';
import { StockBadge } from '../components/StockBadge';
import { ErrorNotice } from '../components/ErrorNotice';

export function ProductDetailPage() {
  // Params are always STRINGS — the generic says which names exist, not that they're numbers.
  const { productId = '' } = useParams<{ productId: string }>();
  const fetcher = useCallback((signal: AbortSignal) => getProduct(productId, { signal }), [productId]);
  const { data: product, loading, error, reload } = useApi(fetcher, [productId]);

  return (
    <>
      {/* A Link wearing button classes — see "Watch out" for why not <Button as={Link}> */}
      <Link to="/products" className="btn btn-link ps-0 mb-3 text-decoration-none">
        <ArrowLeft className="me-1" />
        Back to products
      </Link>

      <ErrorNotice error={error} onRetry={reload} />

      {loading && (
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} style={{ height: 320 }} className="rounded" />
        </Placeholder>
      )}

      {product && !loading && (
        <Card>
          <Card.Body>
            <Row className="g-4">
              <Col md={5}>
                <Ratio aspectRatio="1x1">
                  <img src={product.thumbnail} alt="" className="object-fit-contain bg-body-secondary rounded" />
                </Ratio>
              </Col>
              <Col md={7}>
                <Stack gap={3}>
                  <div>
                    <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>
                    <h1 className="h3 mb-0">{product.title}</h1>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
                    <StockBadge stock={product.stock} />
                    <span className="text-muted">★ {product.rating}</span>
                  </div>
                  <p className="mb-0">{product.description}</p>
                  <div className="d-flex flex-wrap gap-1">
                    {product.tags?.map((tag) => (
                      <Badge key={tag} bg="light" text="dark" className="border">{tag}</Badge>
                    ))}
                  </div>
                  <dl className="row mb-0 small">
                    <dt className="col-4 text-muted fw-normal">SKU</dt>
                    <dd className="col-8 font-monospace">{product.sku}</dd>
                    <dt className="col-4 text-muted fw-normal">Warranty</dt>
                    <dd className="col-8">{product.warrantyInformation}</dd>
                    <dt className="col-4 text-muted fw-normal">Shipping</dt>
                    <dd className="col-8">{product.shippingInformation}</dd>
                    <dt className="col-4 text-muted fw-normal">Returns</dt>
                    <dd className="col-8">{product.returnPolicy}</dd>
                  </dl>
                </Stack>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
```

Everything inside `product && …` is the drawer's body, re-laid-out as a page.
`useApi`, `PriceTag`, `StockBadge`, `ErrorNotice` — all reused, unchanged.

Register it in **`src/router.tsx`** as a sibling of `products`:

```tsx
{ path: 'products', Component: ProductsPage },
{ path: 'products/:productId', Component: ProductDetailPage },
```

**B. `src/components/ProductCard.tsx` — `TODO(lab-3.2)`** — links, not
click handlers:

```tsx
import { Link } from 'react-router';
// …
export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onEdit, onDelete }: ProductCardProps) {
  // …
  <Link to={`/products/${product.id}`} aria-hidden="true" tabIndex={-1}>
    <Card.Img … style={{ height: isCompact ? 110 : 160 }} />
  </Link>
  // …
  <Card.Title …>
    <Link to={`/products/${product.id}`} className="text-decoration-none text-reset fw-semibold">
      {product.title}
    </Link>
  </Card.Title>
```

Remove the `onSelect` prop, the `cursor` style, and the two `onClick`s. Two
links to the same place — the image one is `aria-hidden` and untabbable so
keyboard users get one stop per card, not two.

Remove `onSelect` from `ProductGrid` too, and from `ProductsPage`: delete the
`selectedId` state, the `<ProductDetail …/>` render and its import. **Delete
`src/components/ProductDetail.tsx`** — the page replaces it.

### Verify

Click a product. A full page at `/products/<id>`, back link at the top,
navbar still there, **Products** *not* highlighted (that's `end`). Press the
browser **back** button — the list, at the scroll position you left. Copy the
URL into a new tab — it loads directly. Visit `/products/999999` — the
`ErrorNotice` from `ApiError`: *"We couldn't find what you were looking
for."* (Demo 10 turns that into a proper route-level 404.)

### Watch out

**`useParams()` gives strings.** `getProduct(productId)` is fine (it's
encoded into a URL). `products.find((p) => p.id === productId)` is not —
`Number(productId)` first.

**And TypeScript says `string | undefined`.** `useParams<{ productId: string }>()`
names the param, but the router can't prove the URL had it, so the type stays
optional. `const { productId = '' } = …` settles it in one line — a `!` would
too, but the default fails soft if the route is ever renamed.

**Nesting the detail under `products`.** The detail renders *inside* the
list — or nowhere, if the list has no `<Outlet />`. Siblings.

**`<Link href=…>`.** It's `to`. `href` on a `Link` is silently ignored.

### Challenge (2 min)

Make the detail page's back link go *back* (preserving the filters you came
from) rather than to `/products`. `useNavigate()` and `navigate(-1)` is one
way; think about what happens if the user arrived from a bookmark.

### In the real world

"The detail should be a route" is one of the highest-leverage decisions in a
React app. It gives you shareable links, browser history, bookmarks, and
new-tab behaviour for free — and it means analytics, error reporting and
support tickets all have a URL to point at.

---

## Lab 4 — The URL is state (35 min)

### Problem

Search, sort, category, page: all in `useState`. Refresh loses them. Back
doesn't undo them. You can't send anyone "cheap laptops, page 2".

### Concept

**Filters belong in the query string.** `useSearchParams` works like
`useState` — except the value lives in the URL:

```ts
const [searchParams, setSearchParams] = useSearchParams();
searchParams.get('q');                       // read — string | null, ALWAYS text
setSearchParams({ q: 'phone', page: '2' });  // write — REPLACES all params
```

`searchParams` is a standard `URLSearchParams`.

**Two traps.**

*Setting replaces everything.* `setSearchParams({ page: '2' })` deletes `q`
and `category`. Use the updater form and mutate a copy:

```ts
setSearchParams((previous) => {
  const next = new URLSearchParams(previous);
  next.set('page', '2');
  return next;
});
```

*Every write is a history entry.* Type "phone" and the back button needs five
presses to escape. Pass `{ replace: true }` for high-frequency updates. Rule
of thumb: **filters replace, navigation pushes** — typing shouldn't fill
history; clicking to page 2 arguably should.

**Debounce the fetch, not the URL.** The search box writes to the URL on every
keystroke (with `replace`, so no history spam). That keeps the input
*controlled by the URL* — the back button updates it, a shared link
populates it, there is no local draft to fall out of sync. The *request* is
what we debounce, and we already have the hook for that.

### Steps

**A. `src/hooks/useProductFilters.ts` — `TODO(lab-4.1)`**

```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { SortKey } from '../lib/catalog';

/** Everything the server needs to know about what the user is looking at. */
export interface ProductFilters {
  query: string;
  sort: SortKey;
  category: string;
  /** 0-based in the app (for skip); 1-based in the URL (for humans). */
  page: number;
}

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const page = Number(searchParams.get('page') ?? '1');
    return {
      query: searchParams.get('q') ?? '',
      // The URL is untyped text; the cast is a promise we keep in updateFilters, where only SortKeys are written.
      sort: (searchParams.get('sort') ?? '') as SortKey,
      category: searchParams.get('category') ?? 'all',
      page: Number.isFinite(page) && page > 0 ? page - 1 : 0,
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (patch: Partial<ProductFilters>, { replace = true }: { replace?: boolean } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);   // copy — never mutate the argument

          const write = (key: string, value: string | number | undefined, emptyValue?: string | number) => {
            if (value === undefined) return;
            if (value === '' || value === emptyValue) next.delete(key);
            else next.set(key, String(value));
          };

          write('q', patch.query);
          write('sort', patch.sort);
          write('category', patch.category, 'all');
          if (patch.page !== undefined) write('page', patch.page + 1, 1);
          else next.delete('page');                     // a filter change invalidates the current page

          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  return { filters, updateFilters };
}
```

Three things this hook owns so nothing else has to:

- **The URL contract.** `q`, `sort`, `category`, `page` — the names and the
  defaults, in one file.
- **Clean URLs.** Empty values are *removed*, so you never see `?q=&category=all`.
- **The page-reset rule** — `next.delete('page')` on any non-page change —
  the same rule `updateFilters` enforced in Demo 7, now against the URL.

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-4.2)`**

```tsx
import { useProductFilters } from '../hooks/useProductFilters';
// …
const { filters, updateFilters } = useProductFilters();   // filters: ProductFilters — same shape App's useState had
```

Delete the `INITIAL_FILTERS` constant, the `useState(INITIAL_FILTERS)` line,
and the page's own `updateFilters` function. The hook's `filters` has the
same shape, so `useDebouncedValue(filters.query)`, the `useCallback` deps,
and every `updateFilters({…})` call **work unchanged**. One difference: make
paging *push* history:

```tsx
<Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page }, { replace: false })} />
```

### Verify

Type **phone** — the URL becomes `/products?q=phone` *as you type*, but the
Network tab shows **one** request, 400 ms after you stop. Pick a category, a
sort, go to page 2: `/products?category=beauty&sort=price-desc&page=2`.

**Copy that URL into a new tab.** The exact view loads — filters, sort, page,
and the search box populated. **Reload.** Nothing lost. Press **back**: page
1. Press back again: the sort is undone — no wait, it isn't: filters used
`replace`, so back skips them and goes to the *previous page number*. That's
"filters replace, navigation pushes", felt.

Now the `end` payoff: on `/products?q=phone`, **Products** is highlighted. On
`/products/42` it isn't.

### Watch out

**`setSearchParams({ page })`** — wipes every other param. Updater form,
copy, mutate, return.

**Forgetting `replace: true`** on the search box — twenty history entries
for a ten-letter word.

**`page` 0-based in the URL.** `?page=0` looks broken to humans. Add one on
the way out, subtract one on the way in, and keep the conversion in the hook.

**Keeping a `useState` mirror of the URL.** Two sources of truth. The URL
*is* the state; read it every render.

### Challenge (2 min)

Make `/deals` from Lab 1's challenge mean something: a route that renders
`ProductsPage` with `sort=price-asc` forced. Two approaches — a wrapper
component, or a `loader` that `redirect`s to `/products?sort=price-asc`. Which
one keeps the URL honest?

### In the real world

"Is this in the URL?" is the first question to ask about any filter, tab,
modal, or selection. If a user would want to share it, bookmark it, or undo
it with the back button, it's URL state. The `useProductFilters` hook is the
shape every such feature takes: one file that owns the contract between the
address bar and the app.

---

## Wrap-up — what you can now do

- [x] Import from `react-router` / `react-router/dom` and know why `-dom` is gone
- [x] Build a route tree with a layout, nested children, an index redirect and a splat 404
- [x] Use `as={Link}` / `as={NavLink}` on React Bootstrap components, with `end`
- [x] Share layout-owned state through Outlet context
- [x] Read URL params (as strings) and turn a drawer into a page
- [x] Put filters in the query string with `useSearchParams`, avoiding both traps
- [x] Choose `replace` for filters and `push` for navigation

**What's still true:** every page fetches in `useApi` *after* it renders —
an empty shell, then a skeleton, then content. And a missing product shows an
inline alert instead of a proper 404. Demo 10 moves fetching *into the
router*, and both problems go away.

## Next demo

**Demo 10 — Loaders, Actions & Error Boundaries.** Data before render.
Mutations as route actions with automatic refetch. Fetchers that don't
navigate. Route-level error boundaries that keep the navbar alive. And a
progress bar that appears while the next page loads.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| *"Failed to resolve import react-router-dom"* | v8 removed it. `react-router`, and `react-router/dom` for `RouterProvider`. |
| Clicking a nav link reloads the page | `href=` on a Bootstrap link. `as={Link} to=`. |
| Wishlist resets on navigation | It's in a page's state. Move it to `RootLayout` + Outlet context. |
| `useOutletContext()` is `undefined` | The `<Outlet>` has no `context` prop, or the page isn't under that layout. |
| **Products** stays active on a detail page | Missing `end` on the NavLink. |
| 404 page has no navbar | The `*` route is outside the layout's `children`. |
| Setting one search param deletes the others | Updater form: copy `previous`, mutate, return. |
| Back button steps through every keystroke | Missing `{ replace: true }`. |
| Refresh on `/about` gives a real 404 | Production hosting needs an SPA rewrite to `index.html`. Dev is fine. |
| `Type '{ to: string; … }' is not assignable to type 'IntrinsicAttributes & ButtonProps'` | `<Button as={Link} to=…>`. Use `<Link className="btn btn-…">` instead — see Watch out. |
| `useOutletContext()` returns `unknown` / `Property 'wishlist' does not exist` | Pass the generic: `useOutletContext<RootOutletContext>()`. |
