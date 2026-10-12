# Module 14 — Routing & Application Architecture

**Study notes** · ~3 hours

> **Goal.** React renders a tree. It has no idea what the address bar says.
> This module adds the second half of every real app — pages with URLs — using
> React Router v8 in Data Mode, then uses the route tree as the spine of a
> codebase a new team member can navigate in five seconds. If you finish it
> asking "is this in the URL?" before reaching for `useState`, it worked.

**Prerequisites:** [Module 8 §14–16](../08-state-structure/#14-state-lives-at-a-position-in-the-tree)
(state lives at a position; the `key` reset), [Module 10 §4](../10-forms/#4-uncontrolled-inputs-and-formdata)
(uncontrolled inputs and `FormData`), [Module 12 §11](../12-effects/#11-data-fetching-in-an-effect)
(fetching in an effect, and what it gets wrong),
[Module 13 §12](../13-data-fetching-and-custom-hooks/#12-framework-data-loading).

---

## Contents

1. [Why routing is not in React](#1-why-routing-is-not-in-react)
2. [Three modes, one decision](#2-three-modes-one-decision)
3. [Your first router](#3-your-first-router)
4. [Nested routes, layouts and `<Outlet>`](#4-nested-routes-layouts-and-outlet)
5. [Links](#5-links)
6. [Dynamic segments](#6-dynamic-segments)
7. [The URL as state](#7-the-url-as-state)
8. [Programmatic navigation](#8-programmatic-navigation)
9. [Loaders: data before render](#9-loaders-data-before-render)
10. [Pending UI](#10-pending-ui)
11. [Actions and `<Form>`](#11-actions-and-form)
12. [Fetchers](#12-fetchers)
13. [Protected routes and middleware](#13-protected-routes-and-middleware)
14. [When a route fails](#14-when-a-route-fails)
15. [Code splitting by route](#15-code-splitting-by-route)
16. [Deployment: the SPA fallback](#16-deployment-the-spa-fallback)
17. [Application architecture](#17-application-architecture)
18. [Where every kind of state lives](#18-where-every-kind-of-state-lives)
19. [Self-check](#19-self-check)
20. [References](#20-references)

**Hands-on.** Two demos in this repository implement this module against the
ShopScope catalogue used in the code below:
[Demo 9 — Routing with React Router v8](../../demos/09-routing-with-react-router/)
(the route tree, layouts, links, params, filters in the URL) and
[Demo 10 — Loaders, Actions & Error Boundaries](../../demos/10-loaders-actions-and-error-boundaries/)
(loaders, pending UI, actions, fetchers). The guard vocabulary in §13 is built
out in [Demo 11](../../demos/11-auth-and-protected-routes/); lazy routes and
the deployment rewrite in [Demo 14](../../demos/14-advanced-http-and-shipping/).

---

## 1. Why routing is not in React

React's job ends at "given this state, here is the tree". It does not read
`window.location`, does not intercept link clicks, and has no opinion about
what a "page" is ([Module 2 §6](../02-react-introduction/#6-what-react-is-not)).
That is deliberate: React runs in places with no URL at all.

So a single-component app has four problems that are not missing features but
consequences of where its state lives:

| You want to… | What happens with `useState` only |
|---|---|
| Send a colleague what you are looking at | The address bar says `/` |
| Reload | Every filter resets |
| Press the back button | You leave the site |
| Open a product in a new tab | There is nothing to open |

`useState` lives in memory; the address bar knows nothing about memory.
Routing is the discipline of moving the state that *describes what the user
is looking at* into the URL — and then rendering from the URL.

Two families of tool do this. **A router library:** you own the stack (Vite +
React), install `react-router`, and write the route tree in code — this
module. **A framework with file-based routing:** Next.js, or React Router's
own Framework Mode, where `routes/products.$id.tsx` *is* the route and the
framework adds server rendering and data loading on top
([Module 2 §12](../02-react-introduction/#12-option-3--full-stack-frameworks-nextjs-remix-react-router-v7),
[Module 19](../19-server-components/)). Both end in the same place: a tree of
routes, and a URL that selects a path through it.

📖 [react.dev — Build a React App from Scratch: Routing](https://react.dev/learn/build-a-react-app-from-scratch#routing)

---

## 2. Three modes, one decision

React Router ships one package with three ways to use it. Choose before you
write an import, because the modes do not mix.

| | Declarative | **Data** | Framework |
|---|---|---|---|
| Entry point | `<BrowserRouter>` + `<Routes>` | `createBrowserRouter([…])` + `<RouterProvider>` | Vite plugin + `routes.ts` |
| Routes defined as | JSX inside components | objects, at module scope | files |
| Loaders, actions, fetchers, pending UI | — | ✓ | ✓ |
| Route error boundaries, middleware | — | ✓ | ✓ |
| SSR, streaming, generated route types | — | — | ✓ |

```
Client-only, with your own API?                → Data Mode
Need server rendering, or greenfield?          → Framework Mode
Maintaining a pre-2023 codebase?               → Declarative (and plan the move)
```

Declarative Mode is routing without data — the mode every old tutorial shows.
The moment you want "fetch before render" or "a form that posts to the route"
you need Data Mode, and migrating later touches every page. **Start in Data
Mode.**

### The v8 import rule

Version 8 removed `react-router-dom`. Everything comes from `react-router`,
except the browser `RouterProvider`:

```ts
import { createBrowserRouter, Link, Outlet, useParams } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
```

Types ship inside the package; there is no `@types/react-router`. If a snippet
you paste imports from `react-router-dom`, that is your first fix.

> **Versions in these notes:** `react-router` 8.3.1 on React 19.3. v8 needs
> React 19.2+ and Node 22.22+, and middleware is always on (a flag in v7).

📖 [reactrouter.com — Picking a Mode](https://reactrouter.com/start/modes)

**→ In the demos:** Demo 9, Lab 1 (the three modes and the import rule).

---

## 3. Your first router

A route tree, a router created from it, and a provider that renders it:

```tsx
// src/router.tsx
import { createBrowserRouter, redirect } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, loader: () => redirect('/products') },
      { path: 'products', Component: ProductsPage },
      { path: 'about', Component: AboutPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

// src/main.tsx
import { RouterProvider } from 'react-router/dom';
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
```

A route is a plain object. The keys you will use constantly:

| Key | Meaning |
|---|---|
| `path` | Segment to match. Relative to the parent; no leading slash on children |
| `index: true` | The child that renders when the parent matches *exactly* |
| `Component` | What to render — a component, **not** an element |
| `children` | Nested routes, rendered into the parent's `<Outlet>` |
| `loader` / `action` | Data in / data out ([§9](#9-loaders-data-before-render), [§11](#11-actions-and-form)) |
| `ErrorBoundary` | Rendered when the loader, action or render throws ([§14](#14-when-a-route-fails)) |
| `lazy` · `middleware` · `id` | [§15](#15-code-splitting-by-route) · [§13](#13-protected-routes-and-middleware) · a name for `useRouteLoaderData` |

The array literal is fully typed: a typo in `Componnet` is a compile error,
not a blank page.

Three rules that save an afternoon. **Create the router once, at module
scope** — never in a component, never in state; it owns the navigation
history, and recreating it resets that. **`Component: ProductsPage`, not
`Component: <ProductsPage />`** — the prop wants the component (`element:
<X />` exists for legacy reasons; pick one). **`'*'` goes inside the layout's
`children`**, so a 404 keeps the navbar.

**→ In the demos:** Demo 9, Lab 1.

---

## 4. Nested routes, layouts and `<Outlet>`

A child route renders *inside* its parent, where the parent renders
`<Outlet />`. That is how a navbar persists across pages without any page
knowing about it:

```tsx
export function RootLayout() {
  return (
    <>
      <SiteHeader cartCount={3} />
      <Container className="py-4">
        <Outlet />                 {/* ← the matched child renders here */}
      </Container>
      <ScrollRestoration />
    </>
  );
}
```

`/about` renders `RootLayout → AboutPage`; `/products` renders `RootLayout →
ProductsPage`. **`RootLayout` never unmounts** between them — which, by
[Module 8 §14](../08-state-structure/#14-state-lives-at-a-position-in-the-tree),
means any state it holds survives navigation.

**Index routes.** `{ index: true, … }` renders when the parent matches exactly
and nothing deeper does. `{ index: true, loader: () => redirect('/products') }`
is a route with no component at all — a preview of loaders.

**Scroll restoration.** Real page loads reset scroll and restore it on
back/forward; SPAs do neither by default. `<ScrollRestoration />` in the
layout, once, fixes both.

### Outlet context: state owned by the layout

The wishlist belongs to the *app*, not the products page — it should survive
navigating to About and back. So it lives in the layout, and `<Outlet
context>` hands it to whichever page is rendered:

```tsx
export interface RootOutletContext {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
}

// in RootLayout — the state, then:
const outletContext: RootOutletContext = { wishlist, toggleWishlist };
<Outlet context={outletContext} />

// in any page beneath it
const { wishlist, toggleWishlist } = useOutletContext<RootOutletContext>();
```

The generic is the contract: the layout exports the type, the page imports it,
and renaming a field breaks both sides at compile time.

Outlet context is the lightest tool for "a handful of values the layout owns,
read by some pages" — lighter than React Context and scoped to the subtree.
Beyond a handful (an auth user, a theme, a cart with reducers) you are into
Context ([Module 9 §14](../09-reducers-and-context/#14-reducer--context-the-standard-pattern))
or a store. The signal to upgrade: a page reaching for something the layout
does not own but is merely passing through.

📖 [reactrouter.com — Routing: Nested Routes](https://reactrouter.com/start/data/routing#nested-routes)

**→ In the demos:** Demo 9, Lab 1 (layout, index redirect, 404 inside the layout) and Lab 2 (Outlet context).

---

## 5. Links

**Never use `<a href>` inside an SPA.** It triggers a full page load: every
piece of state is gone and the router starts from scratch. `<Link to>`
intercepts the click and navigates in place.

```tsx
<Link to={`/products/${product.id}`}>{product.title}</Link>

<NavLink
  to="/products"
  end
  className={({ isActive, isPending }) =>
    [isActive && 'active', isPending && 'opacity-50'].filter(Boolean).join(' ')
  }
>
  Products
</NavLink>
```

`<NavLink>` is a `Link` that knows whether it is *active*. **`end`** means
"active only on an exact match" — without it `/products` stays highlighted on
`/products/42`, because it is a prefix. **`isPending`** is true while the
clicked route's loaders run ([§10](#10-pending-ui)) — the lightest pending
indicator there is.

### With a component library

Any React Bootstrap component that renders an anchor takes `as`:

```tsx
<Navbar.Brand as={Link} to="/">ShopScope</Navbar.Brand>
<Nav.Link as={NavLink} to="/products" end>Products</Nav.Link>
```

But `<Button as={Link} to="/products">` is a **type error**: `Button`'s `as`
cannot see the router `Link`'s props, so `to` is "not assignable". The idiom
is the other way round — a `Link` wearing the button's classes:

```tsx
<Link to="/products" className="btn btn-outline-secondary">Back to products</Link>
```

A useful 404 names the path it could not find — `useLocation().pathname` —
and links home the same way.

📖 [reactrouter.com — `<NavLink>`](https://reactrouter.com/api/components/NavLink)

**→ In the demos:** Demo 9, Lab 2.

---

## 6. Dynamic segments

`:productId` in a path is a **param**. `path: 'products/:productId'` matches
`/products/42` and captures `{ productId: '42' }`.

```tsx
{ path: 'products', Component: ProductsPage },
{ path: 'products/:productId', Component: ProductDetailPage },
```

```tsx
export function ProductDetailPage() {
  const { productId = '' } = useParams<{ productId: string }>();
  // …
}
```

**Params are always strings.** `'42'`, never `42`. `product.id === productId`
is `false` for `1 === '1'`. Passing the string into a URL is fine; comparing
or calculating with it needs `Number(productId)` first.

**Typing them.** The generic names the param, but TypeScript still says
`string | undefined` — the router cannot prove the URL had it. The default
`= ''` settles it and fails soft if the route is ever renamed; a `!` would
fail loud.

**Ranking is by specificity, not order.** `/products/new` beats
`/products/:productId` even if declared after it: a static segment outranks a
dynamic one, which outranks `*`.

**Siblings or nested?** `products/:productId` *inside* `products` would render
the detail within the list page's `<Outlet>` — a master–detail layout, the
email-client shape. When the detail should *replace* the list, make them
siblings. **Nest for shared UI; keep siblings for separate screens.**

**Links, not click handlers.** A detail that opens from a click handler is a
drawer. A detail that opens from a `<Link>` is a page: shareable,
bookmarkable, new-tab-able, and something analytics, error reports and
support tickets can point at. "The detail should be a route" is one of the
highest-leverage decisions in an app.

📖 [reactrouter.com — Routing: Dynamic Segments](https://reactrouter.com/start/data/routing#dynamic-segments)

**→ In the demos:** Demo 9, Lab 3.

---

## 7. The URL as state

Search, sort, category, page. Hold them in `useState` and a refresh loses
them, Back does not undo them, and nobody can be sent "cheap laptops, page 2".

**Filters belong in the query string.** `useSearchParams` works like
`useState`, except the value lives in the URL:

```ts
const [searchParams, setSearchParams] = useSearchParams();
searchParams.get('q');                        // string | null — always text
setSearchParams({ q: 'phone', page: '2' });   // writes ?q=phone&page=2
```

### The two traps

**Setting replaces everything.** `setSearchParams({ page: '2' })` deletes `q`
and `category`. Use the updater form — copy, mutate the copy, return it:

```ts
setSearchParams((previous) => {
  const next = new URLSearchParams(previous);
  next.set('page', '2');
  return next;
});
```

**Every write is a history entry.** Type "phone" and Back needs five presses
to escape. Pass `{ replace: true }` for high-frequency updates. The rule:
**filters replace, navigation pushes.**

### One hook owns the contract

Everything about how the address bar and the app agree on names, defaults and
encoding belongs in one file:

```ts
// src/hooks/useProductFilters.ts
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
      sort: (searchParams.get('sort') ?? '') as SortKey,     // the URL is untyped text
      category: searchParams.get('category') ?? 'all',
      page: Number.isFinite(page) && page > 0 ? page - 1 : 0,
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (patch: Partial<ProductFilters>, { replace = true }: { replace?: boolean } = {}) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        const write = (key: string, value: string | number | undefined, emptyValue?: string | number) => {
          if (value === undefined) return;
          if (value === '' || value === emptyValue) next.delete(key);   // clean URLs
          else next.set(key, String(value));
        };
        write('q', patch.query);
        write('sort', patch.sort);
        write('category', patch.category, 'all');
        if (patch.page !== undefined) write('page', patch.page + 1, 1);
        else next.delete('page');          // any other change invalidates the page
        return next;
      }, { replace });
    },
    [setSearchParams],
  );

  return { filters, updateFilters };
}
```

Three things this hook owns so nothing else has to: the **names and
defaults**, **clean URLs** (empty values are removed — never `?q=&category=all`),
and the **page-reset rule**. Paging opts out of `replace`:
`updateFilters({ page }, { replace: false })`.

### Never mirror the URL in `useState`

```tsx
const [query, setQuery] = useState(searchParams.get('q') ?? '');   // ✗ two sources of truth
const query = searchParams.get('q') ?? '';                          // ✓ the URL is the state
```

The one exception is a *draft* deliberately ahead of the URL — a debounced
search box ([§9](#9-loaders-data-before-render) shows the shape).

### What belongs in the URL

| Put it in the URL | Keep it in memory |
|---|---|
| Filters, sort, page, search query | Hover and focus state |
| Which product is open, which tab is selected | A half-typed form field |
| Which modal is open (`?edit=42`) | An open dropdown, animation progress |

The test: *would a user want to share this, bookmark it, or undo it with
Back?* Then it is URL state.

📖 [reactrouter.com — `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)

**→ In the demos:** Demo 9, Lab 4.

---

## 8. Programmatic navigation

Most navigation should be a `<Link>` — a real anchor that works with
middle-click, the keyboard and crawlers. `useNavigate` is for navigation
caused by something other than a click on a link: after a save, a timeout, a
keyboard shortcut.

```tsx
const navigate = useNavigate();

navigate('/products');                      // push — a new history entry
navigate('/products', { replace: true });   // replace — overwrite the current entry
navigate(-1);                               // back, like the browser button
navigate(`/products/${saved.id}`, { state: { from: 'create' } });   // carry data without a param
```

**Replace vs push.** Push when Back should return here. Replace when the
current URL was transitional: a login page after success, a finished checkout
step, a redirect from `/`. A login page left in history means Back takes a
signed-in user to a form that bounces them straight back.

**`navigate(-1)` and the bookmark problem.** A back link that calls
`navigate(-1)` preserves the filters the user came from — unless they arrived
from a bookmark, in which case `-1` is some other site. `<Link to="/products">`
is predictable; `navigate(-1)` is nicer when there *is* a previous page.

**Outside a component** there is no hook. Loaders and actions `throw` or
`return` a `redirect()` instead — after a mutation ([§11](#11-actions-and-form))
and in guards ([§13](#13-protected-routes-and-middleware)). `<Navigate to
replace />` is the declarative form; it runs during render, which is why it
is the weakest guard.

### Redirect with intent

A guard that bounces to `/login` should remember where the user was going:

```ts
// in the guard
throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);

// in the login action, after success
return redirect(safeRedirect(formData.get('redirectTo')));

/** Only same-origin paths. Anything else is an open-redirect attempt. */
function safeRedirect(target: unknown, fallback = '/account'): string {
  if (typeof target !== 'string' || !target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}
```

Without it, `/login?redirectTo=https://evil.example` sends a freshly signed-in
user off your site. The value came from the URL; treat it as hostile.

📖 [reactrouter.com — `useNavigate`](https://reactrouter.com/api/hooks/useNavigate)

**→ In the demos:** Demo 9, Lab 3 (the back-link challenge); Demo 11, Lab 3 (`redirectTo` and `safeRedirect`).

---

## 9. Loaders: data before render

Every fetch in a `useEffect` app follows the same order: **render, then
effect, then fetch, then render again**. On a slow connection the user watches
all of it — empty shell, skeleton, content — and the request did not even
start until the second render.

A loader inverts it. The router runs it *when the link is clicked* and renders
the component once the data is there:

```tsx
export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';          // string | undefined — the route guarantees it, TS can't
  return getProduct(productId, { signal: request.signal });
}

export function ProductDetailPage() {
  const product = useLoaderData<typeof productDetailLoader>();   // Product, on the FIRST render
  return <h1>{product.title}</h1>;
}

// router.tsx
{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader }
```

No `loading`, no `error`, no `useEffect`, no fetch hook. The component lost
half its lines, all ceremony.

### What a loader receives

```ts
async function loader({ request, params, context }: LoaderFunctionArgs) {
  request   // a real Request: request.url has the query string; request.signal aborts on navigation
  params    // Record<string, string | undefined> — the same strings useParams gives you
  context   // whatever middleware put there (§13)
}
```

**`request.signal` is the detail that matters most.** The router aborts it
when the user navigates away mid-load. Forward it to the service and stale
requests cancel themselves — the `AbortController` plumbing from
[Module 12 §11](../12-effects/#11-data-fetching-in-an-effect), handled by the
framework.

**The rules.** Loaders run outside React — no hooks; read the URL from
`request.url`. Return data, or throw a `redirect()`, a `data()` response or
an `Error` ([§14](#14-when-a-route-fails)). All matched loaders run **in
parallel**: a layout that loads the user and a child that loads their orders
is a waterfall with effects and one round trip with loaders.

**The type flows from the return.** `useLoaderData<typeof loader>()` takes the
*loader's* type. The shape is written in exactly one place — the `return` —
and every consumer follows it. The same trick works for
`useActionData<typeof action>()` and `useFetcher<typeof action>()`.

### Reading the URL in a loader

```ts
export async function productsLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const page = Math.max(0, Number(url.searchParams.get('page') ?? '1') - 1);

  // Both start at the same instant. Categories are optional — their failure must not sink the page.
  const [productsResult, categoriesResult] = await Promise.allSettled([
    listProducts({ q, page, limit: PAGE_SIZE, signal: request.signal }),
    listCategories({ signal: request.signal }),
  ]);
  if (productsResult.status === 'rejected') throw productsResult.reason;
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  return { result: productsResult.value, categories };
}
```

`useProductFilters` ([§7](#7-the-url-as-state)) stays for *writing* params; the
loader owns *reading* them. Same contract, two sides.

### Debounce the write, and adopt the URL

With a loader, a URL change *is* a fetch, so the search box can no longer
write the URL per keystroke: the write must be debounced, which means a local
draft again. And if the URL's `q` changes from *outside* — Back, a shared link
— the input must adopt it. That is "adjust state when a prop changes", done
during render ([Module 12 §9](../12-effects/#9-you-might-not-need-an-effect)),
not in an effect:

```tsx
const [queryDraft, setQueryDraft] = useState(filters.query);
const commitQuery = useDebouncedCallback((query: string) => updateFilters({ query }), 400);

const [seenQuery, setSeenQuery] = useState(filters.query);
if (filters.query !== seenQuery) {          // the URL changed under us
  setSeenQuery(filters.query);
  setQueryDraft(filters.query);
}
```

### Parents, and revalidation

`useLoaderData` gives *this* route's data; for an ancestor's, give the route
an `id` and call `useRouteLoaderData('root')`. After any action completes
([§11](#11-actions-and-form)) the router re-runs **every loader on the page** —
that is what makes "the list refreshes itself after a save" automatic.
`useRevalidator()` triggers the same thing by hand.

### Loaders vs effects, honestly

| | `useEffect` + a fetch hook | Loader |
|---|---|---|
| Fetch starts | after render | on click, before render |
| Renders to show data | 2+ | 1 |
| Nested routes | waterfall | parallel |
| Cancellation | you wire it | `request.signal` |
| Errors | state in every component | throw → route `ErrorBoundary` |
| After a mutation | manual `reload()` | automatic revalidation |
| Caching | none | **none — Back refetches** |

That last row is the honest one. Loaders fetch; they do not cache. Open a
product, go back, open it again: two identical requests. The fix is a query
library *beside* the router — `queryClient.ensureQueryData` in the loader,
`useQuery` in the page — and that is [Module 13 §8](../13-data-fetching-and-custom-hooks/#8-tanstack-query).

📖 [reactrouter.com — Data Loading](https://reactrouter.com/start/data/data-loading)

**→ In the demos:** Demo 10, Lab 1.

---

## 10. Pending UI

Between clicking a link and the new page appearing, the loaders are running
and, by default, **nothing visible happens** — the old page stays on screen.
On Slow 3G the app looks frozen.

`useNavigation()` reports what the router is doing:

```ts
const navigation = useNavigation();
navigation.state      // 'idle' | 'loading' | 'submitting' — a union, so a typo is a compile error
navigation.location   // where we are going (while not idle)
navigation.formData   // what was submitted (while submitting)
```

Put it in the **layout**, once, and every page gets pending feedback:

```tsx
const busy = navigation.state !== 'idle';
// …
<div style={{ height: 3 }} aria-hidden={!busy}>       {/* fixed-height slot: no layout jump */}
  {busy && <ProgressBar now={100} animated striped style={{ height: 3 }} aria-label="Loading" />}
</div>
<div className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s' }}>
  <Outlet />                                          {/* the OLD page stays, dimmed, until the new one is ready */}
</div>
```

Pending UI in each page means twelve copies, and the page you forget has none.

**The first load is different.** There is no previous page to keep on screen;
the router runs the root loaders against a blank window. `HydrateFallback` on
the root route is what to show *then* — and only then:

```tsx
{ path: '/', Component: RootLayout, HydrateFallback: AppBootSplash, children: [ … ] }
```

It is not a loading state. It renders once, on boot; every later navigation
keeps the old page visible, which is usually what you want.

📖 [reactrouter.com — Pending UI](https://reactrouter.com/start/data/pending-ui)

**→ In the demos:** Demo 10, Lab 2.

---

## 11. Actions and `<Form>`

**Loaders read; actions write.** A route's `action` receives a form
submission, does the mutation, and the router re-runs every loader on the
page. The list refreshes itself — no `setResult`, no merge, no "close on
success" effect.

```tsx
{ path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction }
```

```tsx
import { Form as RouterForm } from 'react-router';   // react-bootstrap also exports a Form — alias one

<RouterForm method="post" action={location.pathname + location.search} replace>
  <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
  {editing && <input type="hidden" name="id" value={editing.id} />}
  <TextField name="title" defaultValue={values.title ?? editing?.title ?? ''} error={errors.title} />
  <NumberField name="price" defaultValue={values.price ?? editing?.price ?? ''} error={errors.price} />
  <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
</RouterForm>
```

Three things to notice. **Uncontrolled inputs:** `name` + `defaultValue`, no
`value`/`onChange`; the DOM holds the state until submit
([Module 10 §4](../10-forms/#4-uncontrolled-inputs-and-formdata)) because the
action owns the lifecycle now. **A hidden `intent`:** one route action handles
create, update and delete with a `switch`. **`action={pathname + search}`:**
post to *this* URL, filters and all, so the redirect can land back on exactly
this view.

### The action

```ts
export interface ProductFormActionData {
  errors?: Partial<Record<keyof ProductDraft | 'form', string>>;
  values?: Partial<Record<keyof ProductDraft, string>>;
}

export async function productsAction({ request }: ActionFunctionArgs): Promise<ProductFormActionData | Response> {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const text = (key: string) => String(formData.get(key) ?? '');   // FormData gives string | File | null

  if (intent === 'create' || intent === 'update') {
    const values = { title: text('title').trim(), price: text('price'), category: text('category'), stock: text('stock') };
    const errors: ProductFormActionData['errors'] = {};
    if (values.title.length < 2) errors.title = 'Give it a name of at least 2 characters.';
    if (!(Number(values.price) > 0)) errors.price = 'Price must be more than zero.';
    if (Object.keys(errors).length > 0) return { errors, values };          // RETURN — the form stays open

    const payload: ProductDraft = { ...values, price: Number(values.price), stock: Number(values.stock) };
    const saved = intent === 'update' ? await updateProduct(text('id'), payload) : await createProduct(payload);

    const url = new URL(request.url);
    url.searchParams.delete('new');
    url.searchParams.delete('edit');                                         // closes the modal — it is URL state
    url.searchParams.set('flash', `“${saved.title}” saved.`);
    return redirect(url.pathname + url.search);                              // success → POST/Redirect/GET
  }

  throw data({ message: `Unknown intent: ${String(intent)}` }, { status: 400 });   // THROW — a bug, not input
}
```

**Return for expected failures, throw for unexpected ones.** Validation is
expected: `return { errors, values }`, the component reads it with
`useActionData()`, the form stays open and repopulates. A 500 or an unknown
intent is unexpected: `throw`, and the error boundary takes over. Throw a
validation error and the boundary replaces the whole page, form and all.

The return type says it: `Promise<ProductFormActionData | Response>`. A
rejected submit comes back as data; a successful one as a redirect.
`useActionData<typeof productsAction>()` sees only the data half — the router
consumes the `Response` before it reaches a component.

**POST/Redirect/GET.** `return redirect(url)` means a browser refresh does
not re-submit and the URL stays honest. Stripping `?new` / `?edit` from the
target closes the modal, because the modal is URL state ([§7](#7-the-url-as-state)):
`?new=1` opens create, `?edit=42` opens edit, and the open form survives a
refresh.

```tsx
const actionData = useActionData<typeof productsAction>();
const submitting = useNavigation().state === 'submitting';
const editing = result.products.find((p) => String(p.id) === searchParams.get('edit')) ?? null;
const formOpen = searchParams.has('new') || editing !== null;
```

Count what is gone from the old form: five `useState`s, `saving`, `error`, a
`try/catch`, a parent `handleSave`. The form is markup. This is the shape
mutations take in Framework Mode, in Remix and — with different spelling — in
Next.js Server Actions and React 19's own `<form action>`
([Module 10 §11](../10-forms/#11-react-19-form-actions)). Learn it once and
you will recognise it everywhere.

📖 [reactrouter.com — Actions](https://reactrouter.com/start/data/actions)

**→ In the demos:** Demo 10, Lab 3.

---

## 12. Fetchers

Delete is a mutation too — but it should not navigate. A `<Form>` pushes
history and redirects; for a row-level mutation you want the request, the
pending state and the revalidation while staying exactly where you are.

**`useFetcher()` is a submission that does not navigate.**

| API | Does |
|---|---|
| `fetcher.submit(data, { method })` | submit to the route action, no navigation |
| `fetcher.Form` | a form that does the same |
| `fetcher.state` | `'idle'` / `'submitting'` / `'loading'` (revalidating) |
| `fetcher.data` | whatever the action returned |
| `fetcher.formData` | the in-flight submission — the key to "which row is busy" |

```tsx
const fetcher = useFetcher<typeof productsAction>();
const deletingId = fetcher.formData?.get('id')?.toString() ?? null;

function confirmDelete(product: Product) {
  fetcher.submit({ intent: 'delete', id: product.id }, { method: 'post' });
}
// …
<ProductGrid products={products} busyId={deletingId} />
```

The action's delete branch returns data (`{ ok: true, deleted: title }`), not
a redirect — a fetcher's result comes back as `fetcher.data`, not as a
navigation. When one action returns several shapes, narrow before reading:
`fetcher.data && 'ok' in fetcher.data`.

Each fetcher is independent. One per page is enough when one delete happens
at a time; one per row gives per-row optimistic UI — render the list *without*
the row while `deletingId` matches, and revalidation makes it true or puts it
back.

```
Does the user end up somewhere else afterwards?   → <Form> + redirect
Should the page stay put and just update?         → useFetcher
```

📖 [reactrouter.com — `useFetcher`](https://reactrouter.com/api/hooks/useFetcher)

**→ In the demos:** Demo 10, Lab 4; Demo 14, Lab 1 (optimistic UI).

---

## 13. Protected routes and middleware

`/account` and everything under it should require a signed-in user. There are
three places to enforce that, and they are not equivalent.

| | Runs | Loaders already ran? | Flashes? | Covers new child routes? |
|---|---|---|---|---|
| **A — guard component** (`<Navigate>` in render) | during render | yes | yes | only if wrapped |
| **B — loader guard** (`throw redirect()` per loader) | before render | no, for that route | no | only if you remember |
| **C — middleware** | before *all* loaders and actions beneath | no | no | **yes — by position** |

**A** is the v6-era way and the weakest: the protected route's loaders have
already fired authenticated requests you knew would 401. **B** is better, and
the one you forget is the hole. **C** is the v8 answer.

```ts
import { createContext, redirect, type MiddlewareFunction } from 'react-router';

/** A typed KEY for middleware context. React Router's createContext, not React's. */
export const userContext = createContext<User | null>(null);

export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  if (!tokenStore.isAuthenticated()) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }
  const user = tokenStore.getUser() ?? (await getMe({ signal: request.signal }));
  context.set(userContext, user);      // one /auth/me per navigation, shared with every loader below
};
```

```ts
{
  path: 'account',
  middleware: [authMiddleware],        // ← protects EVERYTHING beneath, including routes added next year
  Component: AccountLayout,
  loader: accountLoader,               // reads context.get(userContext)
  children: [
    { index: true, Component: ProfilePage, loader: profileLoader },
    { path: 'team', Component: TeamPage, loader: teamLoader, middleware: [requireRole('admin')] },
  ],
}
```

Middleware runs parent → child before any loader or action in the subtree;
each can stop the navigation by throwing a `redirect()` or a `data()`
response. What it learns it shares through `context` — `context.get(userContext)`
in any loader below is typed `User | null`, no casts. The full signature has
a second argument, `next`, for middleware that must also run *after* the
loaders (timing, logging): `await next()` in the middle, omit it for a guard.

> **Two `createContext`s.** React's is a provider for components. React
> Router's is a typed key for middleware context. Same name, different import;
> the wrong one makes `context.set` throw.

**Three things middleware is not.** It is not the server — hiding a button is
UX, middleware is a client-side lock, only the API can refuse the request. It
is not where tokens live — storage, refresh queues and the `httpOnly`-cookie
trade-off are Demo 11 and [Module 20 §7](../20-production/). And it is not
lazy — a guard that must be downloaded before it can run is a guard with a
gap ([§15](#15-code-splitting-by-route)).

📖 [reactrouter.com — Middleware](https://reactrouter.com/how-to/middleware)

**→ In the demos:** Demo 11, Lab 4 (the three ways, `authMiddleware`, `requireRole`) and Lab 5 (roles).

---

## 14. When a route fails

Throw from a loader, an action or a render, and the nearest route
`ErrorBoundary` renders in place of that route — everything above it stays on
screen:

```tsx
{ path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader, ErrorBoundary: ProductErrorBoundary }
```

Make a 404 a first-class error by throwing a response with a status:

```ts
try {
  return await getProduct(productId, { signal: request.signal });
} catch (error) {
  if (error instanceof ApiError && error.isNotFound) {
    throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
  }
  throw error;
}
```

In the boundary, `useRouteError()` returns `unknown` — the honest type — and
`isRouteErrorResponse` narrows it. The three shapes, the root safety net and
where boundaries belong are developed in [Module 16 §7](../16-advanced-patterns/).
The routing fact to keep: **a failure has a place**, scoped to the part of
the screen that broke, with the rest of the app still usable.

📖 [reactrouter.com — Error Boundaries](https://reactrouter.com/how-to/error-boundary)

**→ In the demos:** Demo 10, Lab 5.

---

## 15. Code splitting by route

Every route's code is in the initial bundle by default. The account layout,
the admin table, the team directory — downloaded by every visitor, run by
almost none.

**`React.lazy`** is the component-level tool: `lazy(() => import('./AdminPanel'))`
returns a component that loads its module on first render and suspends until
it arrives; the nearest `<Suspense fallback>` shows meanwhile. Right for a
heavy widget inside a page — a chart library, a rich editor.

**Route `lazy`** is the routing-level tool, and for a route it is better.
`path` stays eager (the router needs it to match); the code loads when the
route is first matched — and the router loads the module and runs the loader
**in parallel**, so lazy routes do not add a waterfall the way `React.lazy`
plus a fetch-in-effect would:

```tsx
{
  path: 'about',
  lazy: async () => {
    const { AboutPage } = await import('./routes/AboutPage');
    return { Component: AboutPage };          // type-checked against the route's shape
  },
},
{
  path: 'account',
  middleware: [authMiddleware],               // EAGER — imported at the top of router.tsx
  lazy: async () => {
    const { AccountLayout, accountLoader } = await import('./routes/account/AccountLayout');
    return { Component: AccountLayout, loader: accountLoader };
  },
  children: [ … ],
},
```

| Eager (needed to match) | Lazy (needed to render) |
|---|---|
| `path`, `index`, `id`, `children`, `caseSensitive`, **`middleware`** | `Component`, `loader`, `action`, `ErrorBoundary`, `HydrateFallback`, `shouldRevalidate`, `handle` |

Destructure the exports and return them explicitly — a bare
`lazy: () => import('./routes/AboutPage')` would need the module's *default
export* to be the route object. And delete the top-level import of anything
you made lazy; if `router.tsx` still imports it, the bundler still includes it.

**Prove it.** `npm run build` lists one chunk per lazy route; `npm run
preview` with the Network tab filtered to JS shows none of them downloading on
`/products`. A split you cannot see in the build output did not happen
([Module 15](../15-performance/) covers the analyser; [Module 20](../20-production/)
failing CI on a budget).

📖 [react.dev — `lazy`](https://react.dev/reference/react/lazy) ·
[reactrouter.com — Lazy Route Discovery](https://reactrouter.com/how-to/lazy-route-discovery)

**→ In the demos:** Demo 14, Lab 4.

---

## 16. Deployment: the SPA fallback

A routed SPA has one HTML file. Every route — `/products/42`, `/about` — is
served by that same `index.html`, after which the router reads the URL.

In development that just works: Vite serves `index.html` for every path. In
production a static host looks for a file at `/products/42`, finds none, and
returns a **real 404**. The symptom is specific: links work, **refresh
breaks**. Every host spells the fix differently:

| Host | Rewrite |
|---|---|
| Netlify | `public/_redirects`: `/*  /index.html  200` |
| Vercel | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| nginx | `location / { try_files $uri /index.html; }` |
| GitHub Pages | no rewrites — use `createHashRouter` instead |

Vite copies `public/` into `dist/` verbatim, so the Netlify file ships with
the build. `npm run preview` serves `dist/` *with* a fallback, like a real
host — which is why the bug never shows locally and always shows in the first
deployment. `createHashRouter` puts the route after a `#` (`/#/products/42`),
which the server never sees: works anywhere, costs you clean URLs.

📖 [reactrouter.com — `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)

**→ In the demos:** Demo 14, Lab 5; Module 20 §2 for the rest of the deployment story.

---

## 17. Application architecture

The route tree is the first file a new developer opens. Everything else about
a codebase's layout should make the second file obvious.

### Feature folders vs type folders

```
# by type — every tutorial                  # by feature — what scales
src/                                        src/
  components/   (90 files)                    features/
  hooks/        (30 files)                      catalog/   ProductsPage.tsx, ProductCard.tsx, useProductFilters.ts, products.service.ts
  pages/                                        account/   AccountLayout.tsx, ProfilePage.tsx, middleware.ts
  utils/                                        cart/      CartDrawer.tsx, cart.store.ts
  types/                                      components/ui/   Button, Field, ConfirmDialog, Skeletons
                                              api/             client.ts, endpoints.ts, interceptors/
                                              lib/             format.ts, validation.ts, ApiError.ts
                                              router.tsx
```

By type works until roughly twenty components. Then a change to "wishlist"
touches four folders, and nobody can say which of the ninety components
belong to the catalogue. By feature, the folder *is* the feature: everything a
change touches sits together, and deleting the feature is `rm -rf`.

The honest guidance: **small app, one team, under ~20 screens** — by type is
fine, and the ShopScope demos use it because every lab touches two or three
folders at most. **Beyond that** — by feature, with `components/ui` for the
genuinely generic pieces and `lib/` for pure helpers. **Either way** — never
nest more than three levels; a path you cannot remember is a path you will
duplicate.

### Where the router lives

One `router.tsx` at the top of `src/`. It is a map, not a program: paths
pointing at files named after them, no logic. **Loaders and actions live next
to the page they serve**, exported from the same file:

```ts
import { ProductsPage, productsAction, productsLoader } from './routes/ProductsPage';
```

A page's data requirements then sit beside the component that renders them,
and `useLoaderData<typeof productsLoader>()` types itself from twelve lines
above. A feature can export its own subtree (`accountRoutes`) for the root
`router.tsx` to splice in — a feature folder with a route file is most of what
Framework Mode gives you, by hand.

### The layers, and the direction they point

```
routes/      pages, layouts, loaders, actions, middleware
   ↓
components/  presentational; props in, events out; no fetching
   ↓
hooks/       stateful logic shared between components
   ↓
api/         services, client, endpoints, interceptors — the only code that knows about HTTP
   ↓
lib/, types  pure functions and the types the API returns
```

Dependencies point **down**. A component never imports a route; the API layer
never imports React. Enforce it — ESLint's `import/no-restricted-paths` or
`eslint-plugin-boundaries` fails the build on `api/client.ts` importing
`useNavigate`. The rule earns a plugin because the one time an interceptor
needs to say "the session died", the temptation to `navigate('/login')` from
the API layer is strong, and the honest answer is a DOM event the router
listens for.

Loaders call *services*, never `fetch` or `axios` directly. A service knows
the endpoint, the envelope and the error normalisation; a loader knows which
service to call for this URL. That split is what let the demos move from
effects to loaders without touching a single service
([Module 13 §13](../13-data-fetching-and-custom-hooks/#13-the-api-layer)).

### Types, aliases, barrels

**Where types live.** Types the API returns (`Product`,
`ProductListResponse`) live with the API layer, because the server owns their
shape. Types a component owns (`ProductCardProps`) live in the component file.
Types shared across a boundary — `RootOutletContext`, `ProductFormActionData`
— are exported from the side that *produces* the value.

**Path aliases.** `import { api } from '@/api/client'` instead of
`'../../../api/client'`. `tsconfig.json` gets `"paths": { "@/*": ["src/*"] }`
and `vite.config.ts` gets the matching `resolve.alias`; both must agree, or
TypeScript is happy and Vite is not. Set it up in the first hour.

**Barrel files.** `components/fields/index.ts` re-exporting the fields gives
one import path for a family — the right call for a small `ui/` folder. The
costs: importing the barrel loads *every* module behind it in dev servers and
test runners; circular imports become easy to create and hard to see; twenty
tabs called "index". Rule: **one barrel per public surface, never one per
folder.**

### What a new hire should find in five seconds

`router.tsx` (what the pages are) → the page a route points at (what it loads
and renders) → the service its loader calls (where the data comes from) →
`components/ui` (what is reusable) → one `ARCHITECTURE.md` or ADR saying *why*
the folders are shaped this way. If any step takes longer, the architecture
is already costing you.

📖 [react.dev — Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)

**→ In the demos:** Demo 6, Lab 2 (path aliases, the endpoint registry); Demo 23 (the feature-folder refactor and ADR).

---

## 18. Where every kind of state lives

Routing changes the answer to "where does this state go?". The complete
table, now that the router owns some of it:

| State | Lives in | Example |
|---|---|---|
| What the user is looking at | **the URL** | filters, page, open product, open modal |
| Server data for this page | **a loader** | the product, the categories |
| Server data cached across pages | a query library ([Module 13](../13-data-fetching-and-custom-hooks/)) | the same product, revisited |
| Owned by a layout, read by some pages | **Outlet context** | the wishlist |
| Owned by the app, read everywhere | Context or a store ([Module 9](../09-reducers-and-context/)) | the user, the theme, the cart |
| A form in progress | the DOM (uncontrolled) or the form library ([Module 10](../10-forms/)) | the product draft |
| Transient, local to one component | `useState` | hover, density toggle, a dropdown |

The decision runs top to bottom. Most state that was `useState` in a
single-screen app moves *up* this table, and what is left in `useState` is
genuinely local.

---

## 19. Self-check

1. Name the four user-visible problems of an app whose "current view" lives
   in `useState`, and what they have in common.
2. Give the three React Router modes, one sentence each, and the question
   that chooses between them. Write the two v8 import lines.
3. Why must the router be created at module scope? What is wrong with
   `Component: <ProductsPage />`?
4. Explain how `<Outlet>` lets a navbar persist, and why state in the layout
   survives navigation. Where does `'*'` go so a 404 keeps the navbar?
5. What is Outlet context for, and what is the signal you have outgrown it?
6. Why is `<a href>` wrong in an SPA? What does `end` change on a `NavLink`?
   Why is `<Button as={Link} to>` a type error, and what is the idiom?
7. `useParams()` on `/products/42` — what type is `productId`, and why does
   `product.id === productId` fail? Does route order matter for
   `/products/new` vs `/products/:id`?
8. When should a detail route be nested under the list, and when a sibling?
9. Name the two `useSearchParams` traps and their fixes. State "filters
   replace, navigation pushes" and justify it.
10. Give the test for "does this belong in the URL?" and sort: sort order ·
    hover state · open modal · a half-typed field · selected tab.
11. `navigate(-1)` vs `<Link to="/products">` on a back link — the trade-off?
    What is an open redirect, and what two checks does `safeRedirect` make?
12. What does a loader receive? Why does `request.signal` matter? Why do
    nested loaders not waterfall when nested effects do?
13. `useLoaderData<typeof loader>()` — what does the generic take, and why is
    that better than a data type?
14. With a loader, why must the search box's URL write be debounced, and why
    does the input need the `seenQuery` compare-and-set rather than an effect?
15. What is revalidation, what triggers it, and what is the one thing loaders
    do not do that a query library does?
16. The three values of `navigation.state`; where pending UI belongs and why;
    when `HydrateFallback` renders and when it does not.
17. "Return for expected, throw for unexpected" — apply it to an empty title,
    a 500, an unknown `intent`. Why does the form post to `pathname + search`?
18. What does POST/Redirect/GET prevent, and how does the redirect also close
    the modal?
19. When do you use a fetcher instead of `<Form>`? What does
    `fetcher.formData` give you?
20. Compare the three ways to protect a route: when each runs, whether loaders
    already ran, whether a new child route is covered. Why must middleware stay
    eager? Which `createContext` does it use?
21. `React.lazy` vs a route's `lazy`: the difference, and which route keys
    cannot be lazy. How do you *prove* a route was split?
22. Describe the refresh-404 bug: why dev never shows it, and the fix for the
    host you deploy to.
23. Feature folders vs type folders — when does each win? Where do loaders and
    actions live, and why? Draw the dependency direction and name the import
    the linter should reject.
24. One argument for and one against barrel files, and the rule that
    reconciles them.

### Practical

1. Add routes for home, product list, product detail, cart and a 404 — the 404
   inside the layout — with an index redirect and `<ScrollRestoration>`. Move
   `'*'` out of `children` and watch the navbar vanish; put it back.
2. Move every filter, sort and page value from `useState` into search params
   through one `useProductFilters` hook. Verify the URL round-trips in a new
   tab, typing does not fill history, and Back steps through pages but not
   keystrokes.
3. Replace the detail page's fetch-in-effect with a loader that forwards
   `request.signal`. On Slow 3G confirm the request starts on the click, the
   old page stays visible, and Back is instant. Add a progress bar with
   `useNavigation` and a boot splash with `HydrateFallback`.
4. Turn the product form into a router `<Form>` posting to an action that
   returns validation errors and redirects on success, with `?new=1` and
   `?edit=:id` driving the modal. Refresh with the modal open; it must stay.
   Then delete through a fetcher: the URL does not change, the row dims from
   `fetcher.formData`, the list revalidates.
5. Lazy-load the admin area with route `lazy`, keep its middleware eager, and
   prove the bundle shrank from the build output and the Network tab.
6. Add a role-protected `/admin` route whose middleware redirects to
   `/login?redirectTo=…`, and a login action that returns the user there — and
   rejects `redirectTo=https://example.com`.
7. Deploy to a static host without the rewrite, reproduce the refresh 404,
   then add the rewrite.
8. Reorganise a by-type `src/` into feature folders, add a path alias, and
   make the linter fail on `api/` importing from `react-router`.

---

## 20. References

Official React and React Router documentation only.

**React — routing in context**
- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [Creating a React App](https://react.dev/learn/creating-a-react-app) — routing in frameworks
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch) — routing when you own the stack
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) — route changes and component identity
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — adjusting state when the URL changes
- [`lazy`](https://react.dev/reference/react/lazy) · [`Suspense`](https://react.dev/reference/react/Suspense)

**React Router — start here**
- [Picking a Mode](https://reactrouter.com/start/modes)
- [Data Mode: Installation](https://reactrouter.com/start/data/installation) · [Routing](https://reactrouter.com/start/data/routing) · [Navigating](https://reactrouter.com/start/data/navigating)
- [Data Mode: Data Loading](https://reactrouter.com/start/data/data-loading) · [Actions](https://reactrouter.com/start/data/actions) · [Pending UI](https://reactrouter.com/start/data/pending-ui)
- [Data Mode: Custom Framework](https://reactrouter.com/start/data/custom) — what Framework Mode adds on top

**React Router — how-to**
- [Middleware](https://reactrouter.com/how-to/middleware)
- [Error Boundaries](https://reactrouter.com/how-to/error-boundary)
- [Lazy Route Discovery](https://reactrouter.com/how-to/lazy-route-discovery)
- [Upgrading from v7](https://reactrouter.com/upgrading/v7) — the `react-router-dom` removal

**React Router — reference**
- [`createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter) · [`<RouterProvider>`](https://reactrouter.com/api/data-routers/RouterProvider)
- [`<Link>`](https://reactrouter.com/api/components/Link) · [`<NavLink>`](https://reactrouter.com/api/components/NavLink) · [`<Outlet>`](https://reactrouter.com/api/components/Outlet) · [`<Form>`](https://reactrouter.com/api/components/Form) · [`<ScrollRestoration>`](https://reactrouter.com/api/components/ScrollRestoration)
- [`useParams`](https://reactrouter.com/api/hooks/useParams) · [`useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams) · [`useNavigate`](https://reactrouter.com/api/hooks/useNavigate) · [`useLocation`](https://reactrouter.com/api/hooks/useLocation) · [`useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)
- [`useLoaderData`](https://reactrouter.com/api/hooks/useLoaderData) · [`useRouteLoaderData`](https://reactrouter.com/api/hooks/useRouteLoaderData) · [`useActionData`](https://reactrouter.com/api/hooks/useActionData) · [`useNavigation`](https://reactrouter.com/api/hooks/useNavigation) · [`useFetcher`](https://reactrouter.com/api/hooks/useFetcher) · [`useRevalidator`](https://reactrouter.com/api/hooks/useRevalidator)
- [`redirect`](https://reactrouter.com/api/utils/redirect) · [`data`](https://reactrouter.com/api/utils/data) · [`createContext`](https://reactrouter.com/api/utils/createContext)

---

**Previous:** [Module 13 — Data Fetching & Custom Hooks](../13-data-fetching-and-custom-hooks/)
**Next:** [Module 15 — Performance](../15-performance/)
