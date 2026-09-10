# Session 4 — Routing & Application Architecture

**Participant guide** · 2 hours · you will ship a real multi-page storefront

---

## What you ship today

A storefront with actual URLs. A product page you can bookmark. A filtered
listing you can send to a colleague and have them see exactly what you see. A
404 that says so. An architecture that survives the next six sessions.

By the end you will be able to answer, without hesitating:

- Why a layout route exists, and what `<Outlet />` does
- Why `<Link>` and `<a href>` are not interchangeable in a React app
- Why filter state belongs in the URL and density does not
- When to `push` a history entry and when to `replace` it
- What `errorElement` catches, and what it does not
- Why `components/` stopped scaling, and what to do about it

---

## Before the session (15 minutes, please do this at home)

1. **Open the starter and let it install.** Click this, then leave the tab open:

   ```
   https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/sessions/04-routing-and-architecture/starter
   ```

   > ⚠️ **Click that link once, then bookmark the tab.** Every click of a
   > `/fork/` link gives you a **brand-new copy of the starter** — not the work
   > you did earlier. Once it loads, the address bar becomes
   > `stackblitz.com/edit/…`; **that** is your project.

2. **Read [CHEATSHEET.md](./CHEATSHEET.md).** One page. Skim it.

3. **Skim [`starter/src/ARCHITECTURE.md`](./starter/src/ARCHITECTURE.md).** It
   is the map of the codebase and the subject of Lab 4.

### Prefer to work locally?

```bash
git clone https://github.com/vishalshah-utc/reactjs-workshops.git
cd reactjs-workshops/sessions/04-routing-and-architecture/starter
npm install
npm run dev          # http://localhost:5173 — API and web together
```

Node 20.19+ or 22.12+.

### Where you are starting from

The starter is **Session 3, finished**. Every TODO from last session is
resolved: `useDebounce` clears its timer, `useProducts` aborts in-flight
requests and distinguishes empty from error, `useLocalStorage` persists the
cart, `useOnlineStatus` subscribes and cleans up.

If you did not finish Session 3, you have lost nothing — start here.

---

## The cold open

Before you write anything, try this. It takes ninety seconds and it is the
whole reason this session exists.

1. Run the app. Filter to a category. Sort by price, low to high. Type
   something in the search box.
2. Now **send a colleague what you are looking at.**

You cannot. The address bar says `/`, exactly as it did before you touched
anything.

3. Now **reload the page.**

Everything resets. The category, the sort, the search — gone.

4. Press the **back button.**

You leave the site entirely.

None of that is a missing feature. It is a consequence of a decision made in
Session 1 and never revisited: the app stores what the user is looking at in
`useState`, and `useState` lives in memory, which the address bar knows nothing
about.

Today you move it.

---

## How this guide works

Every lab has the same shape:

| | |
|---|---|
| **Problem** | What actually hurts, concretely |
| **Concept** | The idea that fixes it, explained plainly |
| **Steps** | What to type, in order, with the file named |
| **Verify** | The specific thing you should see |

Every lab marker in the starter maps to a step here. To see what is left:

```bash
grep -rn "TODO(lab" src/
```

---

# Lab 1 — Routes, layouts and links (30 min)

## Problem

`App.tsx` had a `view` state variable and a toggle button. It worked, and it
could never do the four things in the cold open. There is no URL to share
because there is no router deciding anything from the URL.

## Concept

A router maps **URL → component**. You declare the mapping once, and from then
on the address bar is an input to your app rather than decoration.

React Router's model has three pieces you need today:

**`createBrowserRouter`** takes an array of route objects and returns a router.
It uses the browser History API, so navigation changes the URL without a
document request.

**Layout routes.** A route with `children` renders its own element, and
wherever that element puts an `<Outlet />`, the matched child renders inside
it:

```
/                     → RootLayout + CatalogPage
/products/keyboard-x  → RootLayout + ProductDetailPage
```

The header and footer render **once** and do not unmount between pages. That
is why the cart badge does not flicker on navigation and why state in the
layout survives.

**`index: true`** marks the child that renders when the parent's path matches
exactly. It is how `/` gets content without the layout needing a path of its
own — and a layout with children but no index route renders a blank middle at
its own URL, which is the most common first-day confusion.

## Steps

### A. Look at what is already there

Open `src/router.tsx`. The layout route is declared with its element and an
`errorElement`, and `children` is empty.

Open `src/routes/RootLayout.tsx`. Read the comment above `<Outlet />` — it
explains why the cart lives here and not in a page. This is "lift state up"
applied to routing: the closest common ancestor of every page that touches the
cart is the layout.

### B. Mount the router — `TODO(lab-1.1)` in `src/main.tsx`

Add the two imports and swap the placeholder for `<RouterProvider router={router} />`.

Note the import path: **`react-router/dom`**, not `react-router`. The DOM entry
point knows about the browser History API. Everything else — `Link`,
`useParams`, `createBrowserRouter` — comes from bare `react-router`.

**Verify:** the header and footer render, with an empty middle. That is
correct: the router has no child routes yet.

### C. Add the index route — `TODO(lab-1.2)` in `src/router.tsx`

```jsx
import { CatalogPage } from '@/routes/CatalogPage';

children: [
  { index: true, element: <CatalogPage /> },
],
```

**Verify:** the product grid is back, and everything from Session 3 works.

> **Try this for ten seconds.** Delete `index: true` and give the route
> `path: ''` instead. It still works. Now delete the route entirely and reload
> `/` — the layout renders with nothing inside and **no error and no warning**.
> A blank middle with a working header is what a missing index route looks
> like, and it is worth recognising on sight.

### D. Make the nav real — `TODO(lab-1.3)` in `src/components/SiteHeader.tsx`

Three anchors to change: the logo, the mobile sheet links, the desktop nav.

For the logo, `<Link to="/">`. For the nav items, `<NavLink>`:

```jsx
<NavLink
  to={link.to}
  end={link.end}
  className={({ isActive }) =>
    cn('rounded-md px-3 py-2 text-sm font-medium transition-colors',
       isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
  }
>
  {link.label}
</NavLink>
```

`cn` is already imported in that file's neighbours — add
`import { cn } from '@/lib/utils';` if it is missing.

Two details that matter:

- **`end` on the `/` link.** Without it, NavLink treats `/` as active for
  *every* route, because every path starts with it. Watch it happen: navigate
  to `/cart` before you add `end` and see Storefront still highlighted.
- **NavLink sets `aria-current="page"` for you.** That is the real reason to
  use it rather than reading the location and comparing strings — you get the
  accessibility for free.

## Verify

Open the **network tab** and click a nav link.

- With `<a href>`: a full document request. The whole bundle re-downloads and
  the app re-mounts.
- With `<Link>`: **nothing.** No request at all. The router swaps the matched
  route in place.

That difference — roughly a second of blank screen on every navigation — is
the entire argument for client-side routing. Add something to your cart first
and watch it survive with `Link` and vanish with `a`.

---

# Lab 2 — Params, 404s and route errors (30 min)

## Problem

Every product in the grid is a dead end. There is no product page, so there is
nothing to link to and nothing to share. And a typo'd URL currently renders
the layout with an empty middle — indistinguishable from a broken site.

## Concept

**Dynamic segments.** `products/:slug` is one route definition that serves
five thousand products. `:slug` matches any single path segment and hands the
value to the component through `useParams()`.

**Splat routes.** `path: '*'` matches anything no other route claimed. React
Router ranks by specificity rather than array order, so it is safe anywhere —
but put it last, because that is where readers look for it.

**`errorElement`.** Anything thrown while rendering a route or its children
lands here instead of taking the entire React tree down with it. Without one, a
single thrown error unmounts *everything* — the user gets a white page with no
header and no way out.

## Steps

### A. Add the detail route — `TODO(lab-2.1)` in `src/router.tsx`

```jsx
{ path: 'products/:slug', element: <ProductDetailPage /> },
```

Note there is no leading slash. Child paths are **relative to the parent**, so
`products/:slug` under `/` resolves to `/products/:slug`. An absolute path
works too but stops being portable the moment the parent moves.

### B. Add cart and 404 — `TODO(lab-2.2)` in `src/router.tsx`

```jsx
{ path: 'cart', element: <CartPage /> },
{ path: '*', element: <NotFound /> },
```

### C. Read the slug — `TODO(lab-2.4)` in `src/routes/ProductDetailPage.tsx`

The page currently hard-codes `slug`, so every product URL shows the same
thing. Replace it:

```jsx
import { useParams } from 'react-router';
const { slug } = useParams();
```

`slug` is typed `string | undefined` — the router cannot promise at compile
time that this component only renders under a route that has a `:slug`.
`useProduct` already handles `undefined` by not fetching, so no guard is
needed. Resist adding a `!`: the type is telling you something true.

Now make the cards link. In `src/components/ProductCard.tsx`, wrap the product
name (or the image) in a `<Link to={`/products/${product.slug}`}>`.

> **Careful:** the card already has an "Add to cart" button inside it. If you
> wrap the *whole card* in a Link, clicking Add also navigates. That is
> Session 7's `event.stopPropagation()` lesson arriving early — for now, link
> the title and the image, not the whole card.

### D. Show the real error — `TODO(lab-2.3)` in `src/routes/RouteError.tsx`

```jsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

const error = useRouteError();

let detail = 'This page hit an error it could not recover from.';
if (isRouteErrorResponse(error)) {
  detail = `${error.status} ${error.statusText}`;
} else if (import.meta.env.DEV && error instanceof Error) {
  detail = error.message;
}
```

The `import.meta.env.DEV` guard is not ceremony. A stack trace on a customer's
screen is an information leak and tells them nothing they can act on.

## Verify

1. Click a product. The URL becomes `/products/something`, and the page shows
   that product.
2. **Reload it.** Still that product — the URL is the source of truth.
3. **Copy the URL into a private window.** Same product. That is the thing you
   could not do at the start of the session.
4. Visit `/products/does-not-exist`. You get "We could not find that product",
   not an error page — a 404 from the API is a *correct answer to a wrong
   question*, and `ProductDetailPage` already special-cases it.
5. Visit `/nonsense`. You get the 404 page, with the header still there.
6. **Force a render error.** Temporarily add `throw new Error('boom')` at the
   top of `CatalogPage`. You should see the error page **with the header and
   footer intact** — that is why `errorElement` is on the layout's children and
   not at the very top. Remove the throw.

---

# Lab 3 — The URL is state (40 min)

**This is the session's big idea. If you only remember one thing, remember
this lab.**

## Problem

Return to the cold open. Filter, sort, search — then reload, or try to share.

The filters live in `useState`. That is component memory: private, temporary,
invisible to the address bar, destroyed on reload.

But filters are not private state. They describe **what the user is looking
at**. That is exactly what a URL is for.

## Concept

`useSearchParams` is a state hook whose storage happens to be the address bar:

```jsx
const [searchParams, setSearchParams] = useSearchParams();
```

It behaves like `useState` — read a value, call a setter, component
re-renders — except the value lives in the URL. Which means it is
**bookmarkable, shareable, refreshable, and walkable with the back button**,
for free.

Three things follow, and each is a step below.

**Derive, do not duplicate.** Once the URL holds the filters, `filters` is
*computed* from `searchParams`, not stored alongside it. One source of truth,
so the address bar and the grid cannot disagree. This is the same rule as any
other derived state — the URL just happens to be the store.

**The URL is untrusted input.** Users hand-edit it, bookmarks go stale, and
crawlers try `?sort=` with garbage. Your parser must return a valid filter
object no matter what it is given.

**`replace` vs `push`.** Every `setSearchParams` call adds a history entry by
default. Type "laptop" in the search box and that is six entries — the user
presses Back six times to escape. `{ replace: true }` overwrites the current
entry instead.

## Steps

### A. Decide what belongs in the URL

Look at `CatalogPage`'s state and sort it into two piles:

| In the URL | Stays local |
|---|---|
| `search` | `density` |
| `categoryId` | |
| `sort` | |
| `inStockOnly` | |
| `onSaleOnly` | |

Why is `density` different? Nobody wants to share a link to "the compact
view". It is a display preference, not a description of what is being looked
at. **Not everything belongs in the URL**, and being able to say why is the
point of this step.

### B. Write the translation layer — `TODO(lab-3.2)` in `src/lib/filters.ts`

Two functions, both sketched in the file's comments.

`parseFilters(params)` — URL in, valid `ProductFilters` out. The important
line is `sort`:

```ts
sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : defaultFilters.sort,
```

Compare it to what people write first:

```ts
sort: params.get('sort') as SortKey,     // ✗
```

That compiles, and it is a lie. TypeScript now believes the value is one of
five strings while the actual value is whatever was in the address bar. Every
`switch` downstream silently falls through its default. **A cast at a system
boundary is how untyped data gets laundered into "typed" data.** Validate
instead.

`filtersToSearchParams(filters)` — filters in, URL out. **Omit defaults:**

```
/?q=&category=all&sort=featured&inStock=false&onSale=false     ✗
/?q=laptop&sort=price-asc                                       ✓
```

Not only cosmetic. A URL encoding defaults changes whenever a default changes,
so every old bookmark starts carrying a value the app no longer means. Absent
means "whatever the default is today".

### C. Swap the state — `TODO(lab-3.1)` in `src/routes/CatalogPage.tsx`

```jsx
const [searchParams, setSearchParams] = useSearchParams();
const filters = parseFilters(searchParams);

function handleFilterChange(patch: Partial<ProductFilters>) {
  setSearchParams(filtersToSearchParams({ ...filters, ...patch }), { replace: true });
}
```

Update `handleResetFilters` the same way. The `useState` line goes.

Notice what did **not** change: `ProductToolbar`, `CategoryStrip` and
`ProductBoard` are untouched. They take `filters` and call `onChange`, and
they neither know nor care where the value is stored. That is what a clean
props boundary buys you — you just changed the storage layer of a whole screen
without opening three of its four components.

### D. Feel the difference between replace and push

Set `replace: true`. Type "laptop" slowly, then press Back once. You go back
to wherever you came from.

Now remove `replace`. Type "laptop" again and press Back. Six presses to
escape.

Now the judgement call: try `replace: true` for the search box but plain push
for the category buttons.

```jsx
function handleFilterChange(patch: Partial<ProductFilters>, options = { replace: true }) {
  setSearchParams(filtersToSearchParams({ ...filters, ...patch }), options);
}
```

The rule that falls out: **replace for continuous edits** (typing, dragging a
slider), **push for discrete choices** (picking a category, changing the
sort) — because those are decisions a user may reasonably want to undo.

## Verify

The cold open, again — and this time it all works:

1. Filter to a category, sort by price, search for something.
2. **Look at the address bar.** `/?q=laptop&category=electronics&sort=price-asc`
3. **Reload.** Everything is still there.
4. **Copy the URL into a private window.** Identical screen.
5. **Press Back.** You walk backwards through your filter choices.
6. **Hand-edit the URL** to `?sort=cheapest` and reload. It falls back to
   Featured rather than breaking — that is step B's validation earning its
   keep.
7. Clear all filters. The URL goes back to a clean `/`.

Send the URL from step 4 to the person next to you. That is the session, in
one action.

---

# Lab 4 — Architecture and code splitting (20 min)

## Problem

Open `src/components/`. Twenty files, flat, with nothing to say whether
`ProductToolbar` belongs to the catalogue or the back-office. `hooks/` mixes
`useDebounce` (generic) with `useProducts` (catalogue-only).

Nobody can answer "what would I delete if we dropped the cart?" from this
layout. And it gets worse every session.

## Concept

**Group by feature, not by file type.** A `components/` folder holding two
hundred files tells you nothing about the app. `features/cart/` tells you where
the cart is, and makes it obvious when the cart starts reaching into the
catalogue's internals.

**Point dependencies one way.** `routes/` → `features/` → `components/`,
`hooks/`, `lib/`. The moment a shared `Button` imports from `features/cart/`,
"shared" has stopped being true.

**Code-split at the route.** Most visitors never open an admin screen. Every
byte of it in the main bundle is a byte every customer downloads and never
runs.

## Steps

### A. Move the files — `TODO(lab-4.2)` in `src/ARCHITECTURE.md`

The target tree is in that file. Move them, then let the compiler find the
breakage:

```bash
npm run typecheck
```

Most imports do not change at all — `@/lib/api` is the same string wherever
the importing file lives. That is the payoff for having used the `@/` alias
since Session 1.

**The test for `components/` vs `features/`:** could this component appear in a
completely different product? `<EmptyState>` could. `<ProductToolbar>` could
not.

### B. Enforce the boundary

A layout is a convention until a tool enforces it. Add the
`no-restricted-imports` block from `ARCHITECTURE.md` to `eslint.config.js`.

Then prove it works: add a deliberately bad import to
`components/EmptyState.tsx`, run `npm run lint`, watch it fail, delete it.

### C. Split the back-office — `TODO(lab-4.1)` in `src/router.tsx`

```jsx
import { lazy, Suspense } from 'react';
import { RouteFallback } from '@/components/RouteFallback';

const BackOfficePage = lazy(() => import('@/routes/BackOfficePage'));

{
  path: 'backoffice',
  element: (
    <Suspense fallback={<RouteFallback />}>
      <BackOfficePage />
    </Suspense>
  ),
},
```

The `<Suspense>` boundary is not optional — without one React throws the moment
the lazy component suspends. And `BackOfficePage` is a **default** export
because that is what `lazy` expects.

## Verify

```bash
npm run build
```

You should see a separate chunk:

```
dist/assets/BackOfficePage-CSGEsIzb.js    0.91 kB
dist/assets/index-CyRgo-h5.js           454.49 kB
```

Then run the dev server, open the **network tab**, and click Back-office. A
chunk arrives that was not there before. Nobody who never visits the
back-office ever downloads it.

---

## What you built

- Real URLs, with a layout that does not re-mount between pages
- A product page you can bookmark and share
- Filter state in the URL — shareable, refreshable, back-button-correct
- A 404 and a route error boundary that keep the header alive
- A feature-sliced architecture with a lint rule enforcing it
- A route-level code split

## What is still wrong (and which session fixes it)

| Problem | Fixed in |
|---|---|
| Every navigation refetches from scratch — no cache | Session 5 (TanStack Query) |
| The back-office is public | Session 6 (auth & RBAC) |
| The cart page is a stub | Session 7 (forms & checkout) |
| Outlet context will not scale past a few values | Session 8 (global state) |
| Nothing is tested | Session 10 |

## Homework

[HOMEWORK.md](./HOMEWORK.md) — breadcrumbs from the category tree, and
prefetch-on-hover.

## Self-study

- Error boundary patterns: route-level vs app-level, and where to put them
- `useNavigate` and programmatic redirects — you will need it in Session 6
- Scroll restoration: what React Router does automatically and what it does not
