# Demo 19 — Server State with TanStack Query & Real-time Data

**Demo guide** · ~130 minutes · loaders fetch; they do not remember — so put a cache underneath them

---

## Where you are starting from

The starter is **Demo 18, finished**: a profiled and repaired product grid, a
dev-only Slow mode, `RenderProfiler` on three subtrees, state pushed down and
content passed as `children`, `useDeferredValue` on the quick filter,
`useTransition` on the density toggle and the tabs, 194 products virtualised,
a bundle treemap and a budget that fails the build — and the React Compiler on,
writing the memoisation you deleted.

Every one of those fixed a render. Not one of them touched a request. The app
still asks the server for the same product twice in five seconds, re-fetches
the category list on every keystroke, and throws away all 194 products the
moment you close a disclosure. React Router's loaders put the fetch in the
right place; they have no memory at all.

New stubs: `src/lib/queryClient.ts`, `src/api/queries.ts`,
`src/hooks/useProductMutations.ts`, `useIntersection.ts`, `useOnlineStatus.ts`,
`usePriceTicker.ts`, `src/components/EndlessGrid.tsx`, `LiveStockBadge.tsx`,
`ConnectionBadge.tsx`. Already there so you only write the interesting part:
`listStock()` in `src/api/services/products.ts`, `formatTime()` in
`src/lib/format.ts`, and the `StockLevel` / `PriceTick` types.

New dependencies: **`@tanstack/react-query@5.103.1`** and
**`@tanstack/react-query-devtools@5.103.1`** — both in `package.json` since
Demo 15's Part 6 set, already installed, imported for the first time today.

## What you ship today

A **cache** with a visible inspector: one `QueryClient` at module scope, the
devtools mounted in development only, and the two "own lifetime" requests from
Demo 17 converted to `useQuery` in ten lines each. **Loaders that prefetch**:
`ensureQueryData` in the product loader and the list loader, `useQuery` in the
pages, and a Back button that renders instantly with an empty network tab.
**Mutations with invalidation** replacing the five hand-rolled rules from
Demo 8 — and an honest decision about which writes stay on the router's
`<Form>` and action. An **optimistic delete** written the TanStack way:
`onMutate` snapshot, `onError` rollback, `onSettled` invalidate, next to the
fetcher version from Demo 14 for comparison. **"Load more"** through
`useInfiniteQuery` and an `IntersectionObserver` hook. **Live data** three ways:
polling that stops when the tab is hidden, a `EventSource` price feed pushing
straight into the cache, and `useSyncExternalStore` over the browser's own
online/offline events. And a **decision table** that finishes the one Demo 13
started.

By the end you will be able to answer, without hesitating:

- What "server state" is, and why `useState` + `useEffect` is the wrong tool for it
- What a query key is, what `staleTime` and `gcTime` each control, and which one you reach for first
- Where the `QueryClient` has to live for a router loader to reach it — and why that answer changes under SSR
- What `ensureQueryData` does that `prefetchQuery` does not, and when a loader should still exist at all
- Which writes belong to a router action and which to `useMutation`, and what the rule is
- The exact order of `onMutate` → `onError` → `onSettled`, and why `cancelQueries` is the first line of the first one
- What `getNextPageParam` returns at the end of the list, and what shape an infinite query's `data` has
- When to poll, when to push, and what `useSyncExternalStore` is for

> **A cache is a correctness problem, not a performance trick.** Every lab
> today is about who is allowed to say what the truth is, and when.
> 📖 [study-notes 13](../../study-notes/13-data-fetching/) is today's theory.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/19-tanstack-query-and-realtime/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/19-tanstack-query-and-realtime/starter && npm install && npm run dev`.

Open DevTools → **Network**, tick **Disable cache**, and filter to **Fetch/XHR**.
You will spend more time in that panel today than in the editor. Sign in as
`emilys` / `emilyspass` (admin) so the grid has its edit and delete buttons —
Lab 3 needs them.

---

## The cold open

Open `/products`. Clear the network log. Click the first product.

One request: `GET /products/1`. Good — that is `productDetailLoader` doing
exactly what Demo 10 taught it to.

Now press **Back**, and click the same product again.

```
GET /products/1     ← the first click
GET /products/1     ← Back, then the same click. Identical. 200. 140 ms.
```

Two requests, same URL, same response, seconds apart. Do it a third time and
you get a third. Nothing is broken; this is what a loader *is*. A loader is a
function the router calls before rendering a route, and it has no memory
between calls, no idea that it ran two seconds ago, and no way to find out.

Watch the rest of the log while you do it:

- Type `phone` in the search box. Every committed keystroke re-runs
  `productsLoader`, and `productsLoader` fetches **the category list** each
  time — a list that has not changed since 2023.
- Open "Show all 194", close it, open it again. `ProductRowList` uses
  `useFetch`, whose whole lifetime is the component's, so that is two requests
  for two hundred kilobytes of identical JSON.
- Open a product, then another in the same category. "More in this category"
  fetches the same five products twice.

Now say what is actually wrong. It is not that the requests are slow — they are
not. It is that **the app has no idea what it already knows.** Every component
is an island, every loader starts from zero, and the only place any of this
data exists is inside whichever component happens to be mounted.

That is the definition of the problem TanStack Query solves, and the reason its
name for it is useful: **server state**. It is not your state. You did not
create it, you cannot be sure it is still true, and somebody else can change it
while you are looking at it. State you own — a drawer being open, a wishlist,
a form draft — is a completely different thing, and it is already handled
(Demos 12, 13, 4). Today is about the other kind.

| | Client state | Server state |
|---|---|---|
| Who owns it | you | somebody else's database |
| Is it current? | always | unknowable — only "as of when" |
| Who else has a copy | nobody | every other tab and user |
| How you change it | set it | ask, and find out |
| Right tool | `useState`, Zustand, react-hook-form | **a cache** |

Seven labs. By the end of Lab 2 the two identical requests in the cold open
become one.

---

## Lab 1 — Server state is not client state (20 min)

### Problem

`useFetch` (Demo 17 Lab 6) is a good hook. It starts a request, aborts it on
unmount, and reports four states through a reducer. It has exactly one flaw,
and it is not a bug: **its memory is the component's lifetime.** Unmount the
component and the data is gone. Mount two of them and you get two requests.

You could fix that. You would add a module-level `Map` keyed by the request,
then a way to say how long an entry stays good, then a way to throw old entries
away, then a way for two components mounting at once to share one in-flight
promise, then a way to tell every watcher that an entry changed. At which point
you have written a cache, badly, in your own codebase, with no tests.

### Concept

**A query is a key, a function, and a policy.** The key identifies the data,
the function fetches it, and the policy says how long the answer counts. That
is the whole model, and everything else in this guide is a consequence of it.

**`staleTime` is the number that matters.** It is how long data counts as
*fresh*. Fresh data is never re-fetched — not when a second component mounts,
not on window focus, not on reconnect. The default is `0`, which means
"everything is stale the instant it arrives", which is safe and chatty. Pick it
per query, from how fast the data really changes:

| Data | Changes | `staleTime` |
|---|---|---|
| The category list | quarterly | `Infinity` |
| A product's details | daily | 30 s (the client default) |
| "More in this category" | daily | 5 min |
| Stock levels | constantly | 10 s, and polled |

**`gcTime` is a different number and people mix them up.** `staleTime` is about
*this* data; `gcTime` is about *unused* data. When the last component watching a
key unmounts, the entry is not deleted — a timer starts, and `gcTime` is that
timer. Until it fires, coming back to that screen renders instantly from the
cache while a background refetch runs. Stale does not mean gone, and a stale
render followed by a quiet correction is what makes a cached app feel fast.

**Dedupe is free and you should check that it is real.** Two components asking
for the same key at the same moment get one request and one promise. That is
not an optimisation you enable; it is what a key means.

**And TypeScript says:** `error` from a query is `unknown`, deliberately —
anything can be thrown. Narrow it at the boundary the way a `catch` block does:
`ApiError.from(error)` is already that function (Demo 6), and `ErrorNotice`
already takes its output.

### Steps

**A. `src/lib/queryClient.ts` — `TODO(lab-1.1)`**

```ts
import { QueryClient } from '@tanstack/react-query';
import { isRetryable } from './retry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // fresh for 30 s: no refetch on mount, focus or reconnect
      gcTime: 10 * 60_000,      // an UNUSED entry survives 10 min — that is what makes Back instant
      // ONE retry layer per request. withRetry (Demo 14) still owns everything
      // outside the cache; inside it, this does the job — and reuses the same
      // predicate, so "what is worth retrying" is still defined in one place.
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      refetchOnWindowFocus: true,
    },
    // Writes are NOT idempotent. A POST that timed out may have succeeded.
    mutations: { retry: false },
  },
});
```

The `retry` line is the one to read twice. `withRetry` already encodes this
app's policy — no response, 408, 429 or 5xx is worth another go; a 400 never is
— and the wrong move here would be to keep wrapping `queryFn`s in `withRetry`
*as well*. Two retry layers multiply: three attempts inside three attempts is
nine requests and a navigation that hangs for half a minute.

**B. `src/main.tsx` — `TODO(lab-1.2)`**

```tsx
const Devtools = lazy(async () => {
  const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
  return { default: ReactQueryDevtools };
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The provider does NOT own the client — it publishes the module-scope one. */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
);
```

`import.meta.env.DEV` is a compile-time constant (Demo 18 Lab 1 used the same
trick for `RenderProfiler`), so in a build the condition is `false`, the dynamic
`import()` is unreachable, and Rollup drops the devtools chunk entirely. Fifty
kilobytes that never ship.

**C. `src/api/queries.ts` — `TODO(lab-1.3)`**

```ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (options: ListProductsOptions) => [...productKeys.lists(), options] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...productKeys.details(), String(id)] as const,
  related: (category: string, id: number | string) => [...productKeys.all, 'related', category, String(id)] as const,
  everything: () => [...productKeys.all, 'everything'] as const,
  // …stock() and categories() arrive in Labs 6 and 2…
};

/** "More in this category" — its own key, because it is its own request. */
export function relatedQuery(product: Product, limit = 5) {
  return queryOptions({
    queryKey: productKeys.related(product.category, product.id),
    // The signal is TanStack Query's, not the router's: it aborts when the last
    // observer of this key goes away. Every service already takes one.
    queryFn: ({ signal }) => listProducts({ category: product.category, limit, signal }),
    staleTime: 5 * 60_000,
    // `select` shapes what THIS component sees. The cache still holds all five.
    select: (response) => response.products.filter((p) => p.id !== product.id).slice(0, 4),
  });
}

export function everythingQuery() {
  return queryOptions({
    queryKey: productKeys.everything(),
    queryFn: ({ signal }) => listProducts({ limit: 0, signal }),
    staleTime: 5 * 60_000,
  });
}
```

The hierarchy is not decoration. `['products', 'list', {…}]` starts with
`['products']`, so `invalidateQueries({ queryKey: productKeys.all })` in Lab 3
matches every product query in one call — lists, details, related, all of them.
Keys are compared structurally and by prefix, which is why the order of the
segments is a design decision.

**D. `src/components/RelatedProducts.tsx` — `TODO(lab-1.4)`**

```tsx
export function RelatedProducts({ product }: RelatedProductsProps) {
  const { data: related, isPending, error } = useQuery(relatedQuery(product));

  if (related && related.length === 0) return null;
  // …unchanged JSX, with `error &&` and `related && !isPending` where the four statuses were…
```

Three lines of state machine replaced by one hook call, and the filtering moved
into `select` where it belongs. **E. `ProductRowList` — `TODO(lab-1.5)`** is the
same conversion: `useQuery(everythingQuery())`, `data?.products ?? []`,
`isPending` for the spinner, `ApiError.from(error)` for the notice.

**F. The budget.** Adding a dependency to the entry chunk is exactly what
`npm run check:bundle` exists to catch, so run it:

```bash
npm run build && npm run check:bundle
#   ✗    665.5 kB  index-….js       ← was 619.6 kB. Over the 680 kB budget? Not yet — close.
```

`@tanstack/react-query` costs 45.9 kB raw. Move `DEFAULT_MAX_KB` in
`scripts/check-bundle-size.mjs` from 680 to **700** and write down in the
comment *what you bought* — a budget you raise whenever it fails is not a
budget. The devtools add nothing: they are in their own chunk and the
production build never reaches the import.

### Verify

1. `npm run dev`, open a product. The devtools flower is bottom-left — click it.
2. You see one entry: `["products","related","beauty","1"]`, green (**fresh**).
3. Watch the clock. After five minutes it turns yellow (**stale**) — and still
   nothing is re-fetched, because nothing asked.
4. Press Back and open the same product again with the Network tab open. The
   related request does **not** run. The detail request still does — that is
   Lab 2.
5. Open "Show all 194", close it, open it again. One request, not two. Close it
   and wait: the devtools show the entry going **inactive**, and after ten
   minutes it disappears. That is `gcTime`.
6. In the devtools, click the entry and press **Invalidate**. The request runs
   again, the UI never flickers, and the new data swaps in. That is a background
   refetch — the thing the four-state machine could not do.

### Watch out

- **`queryKey: ['related', product]`.** An object in a key is fine — keys are
  hashed structurally — but a whole `Product` means a key that changes whenever
  any field does, including the price the ticker pushes in Lab 6. Keys name the
  *request*, so put the request's parameters in them and nothing else.
- **`staleTime: 0` everywhere, then surprise at the traffic.** With the default
  of 0, every mount of every component re-fetches in the background. It is not
  wrong, it is a decision — make it on purpose, per query.
- **Forgetting the `signal`.** Every service in `src/api/services` already takes
  one. Drop it and an abandoned request keeps running and still resolves —
  harmless here, expensive on a slow connection and a long list.
- **`isPending` vs `isLoading` vs `isFetching`.** `isPending` means "no data
  yet". `isFetching` means "a request is in flight" — true during a *background*
  refetch, when you already have data and must not show a spinner over it.
  `isLoading` is `isPending && isFetching`. Use `isPending` for skeletons.

### In the real world

The version of this argument you will actually have on a team is "do we need
another dependency?", and the answer is in Lab 1 F: 46 kB, measured. What you
buy is the five features in the first paragraph of this lab — dedupe, freshness,
garbage collection, background refetch, invalidation — each of which someone
would otherwise implement at 2am, in one feature's directory, without tests.
The reason to reach for it early is that the cache changes how you *design*
screens; retro-fitting it, as we are doing here, is the harder order.

---

## Lab 2 — Queries alongside loaders (25 min)

### Problem

The cold open's two identical requests are still there. `RelatedProducts` is
cached; the product itself is not, because it is fetched in a loader, and a
loader is a plain async function that runs on every navigation.

So delete the loader and use `useQuery` in the page? No. The loader is doing
three things you would have to rebuild: it **blocks the navigation** until the
data is there (so there is no flash of a skeleton on a fast connection), it
**throws to the route's `ErrorBoundary`** — including the 404 → "no such
product" page you wrote in Demo 10 — and it **runs in parallel with the lazy
route module**, so code-splitting costs no waterfall.

The answer is that both are right, doing different jobs.

### Concept

**Loaders decide *when*; the cache decides *whether*.** A loader's job is
sequencing — do not render this route until the data is here. A cache's job is
memory — do not ask again if we already know. `ensureQueryData` is the one line
where they meet: *give me this data*, resolving from the cache when it can and
fetching when it cannot.

| Call | Returns | On a cache hit | On failure |
|---|---|---|---|
| `fetchQuery` | the data | fetches anyway | throws |
| `ensureQueryData` | the data | **returns it, no request** | throws |
| `prefetchQuery` | `void` | returns immediately | swallows |

`ensureQueryData` for data the route needs; `prefetchQuery` for data it would
*like* — it never throws, so it cannot sink a navigation, which also means it
cannot tell you anything went wrong.

**Where the client lives is the interesting question.** A loader has no
component above it and no hooks available, so `useQueryClient()` is not an
option. The client has to be a module-scope singleton that both the loader and
the hooks import — which is what `lib/queryClient.ts` already is.

**Why that is safe here and wrong elsewhere.** ShopScope is a client-only SPA:
the module graph is evaluated once, in one browser tab, for one user. A
module-scope cache is that user's cache and nobody else's. Under server
rendering — Next.js, or React Router in framework mode — one Node process
serves every request, so a module-scope cache would hand one customer's basket
to the next visitor. That is why every SSR guide creates the client *per
request* (or in a `useState` initialiser, which is per browser tab) and passes
it to loaders through the router's context. The pattern is the same; the
lifetime is not, and the lifetime is the security property.

**The page still reads through a hook, and that is the point.** If the loader
fetched and the component used `useLoaderData`, the page would only ever change
when the router navigated. Reading with `useQuery` subscribes it to the cache
instead, so an invalidation after an edit (Lab 3), a rollback (Lab 4) or a price
pushed in over a socket (Lab 6) all reach the screen with no further wiring.

**And TypeScript says:** `useQuery(...).data` is `T | undefined`, because a
query may not have run yet. Pass `initialData` and the type narrows to `T` —
which is exactly true here, since the loader blocked on it. That is how the page
keeps its "no loading branch" shape from Demo 10.

### Steps

**A. `src/api/queries.ts` — `TODO(lab-2.1)`**

```ts
export function productQuery(id: number | string) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, { signal }),
  });
}
```

`queryOptions()` is not sugar. It welds the key to the function that fills it,
so the loader that prefetches and the component that reads cannot drift apart —
the single most common cause of "why is it fetching twice" — and it carries the
types, so neither call site needs an annotation.

**B. `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.2)`**

```tsx
export async function productDetailLoader({ params }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';
  try {
    return await queryClient.ensureQueryData(productQuery(productId));
  } catch (error) {
    // Unchanged: a 404 is still a thrown Response for ProductErrorBoundary.
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error;
  }
}

export function ProductDetailPage() {
  const loaded = useLoaderData<typeof productDetailLoader>();
  const { productId = '' } = useParams();

  // The loader blocked on this, so the cache is warm and this read is synchronous.
  // `initialData` says so to TypeScript: `product` is a Product, never undefined.
  const { data: product } = useQuery({ ...productQuery(productId), initialData: loaded });
  // …unchanged…
```

Notice what came *out*: `request.signal`. The loader used to forward it so the
router could abort a fetch when the user navigated away. It must not any more —
the query owns this request, and a loader aborting it mid-flight would leave a
rejected entry in the cache for the next visitor to inherit. The query's own
`signal` already aborts when the last observer goes.

**C. `src/api/queries.ts` + `src/routes/ProductsPage.tsx` — `TODO(lab-2.3)`**

The list loader has the same treatment, plus the categories — the request the
cold open caught being made on every keystroke.

```ts
/** The filters that identify a page — and NOTHING else the URL happens to carry. */
export function listOptionsFrom(searchParams: URLSearchParams): ListProductsOptions {
  const { sortBy, order } = parseSort((searchParams.get('sort') ?? '') as SortKey);
  const category = searchParams.get('category') ?? '';
  return {
    q: searchParams.get('q') ?? '',
    category: category === 'all' ? '' : category, // 'all' is the strip's word for "no filter"
    sortBy,
    order,
    page: Math.max(0, Number(searchParams.get('page') ?? '1') - 1),
    limit: env.pageSize,
  };
}

export function productListQuery(searchParams: URLSearchParams) {
  const options = listOptionsFrom(searchParams);
  return queryOptions({ queryKey: productKeys.list(options), queryFn: ({ signal }) => listProducts({ ...options, signal }) });
}

export function categoriesQuery() {
  return queryOptions({
    queryKey: productKeys.categories(),
    queryFn: ({ signal }) => listCategories({ signal }),
    staleTime: Infinity,   // fetched once per page load, and then never again
    select: (categories): CategoryOption[] => categories.map((c) => ({ id: c.slug, name: c.name })),
  });
}
```

```ts
export async function productsLoader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);

  const [listResult] = await Promise.allSettled([
    queryClient.ensureQueryData(productListQuery(searchParams)),
    queryClient.ensureQueryData(categoriesQuery()),   // staleTime: Infinity → a hit, every time after the first
  ]);

  if (listResult.status === 'rejected') throw listResult.reason; // → the route ErrorBoundary
  return listResult.value;
}
```

`withRetry` is gone from this loader, and it has to be: the client's `retry`
option already retries this query with the same predicate. Keeping both would
give you 3 × 2 attempts behind one navigation.

The line that pays for the lab is `listOptionsFrom`. The key is built from the
*filters*, not the URL — so `?edit=5` opens the modal without being a cache
miss, `?flash=…` does not create an entry that is thrown away a render later,
and `?category=all` and no category at all are one entry, not two.

**D. `src/routes/ProductsPage.tsx` — `TODO(lab-2.4)`**

```tsx
const loaded = useLoaderData<typeof productsLoader>();
const [searchParams, setSearchParams] = useSearchParams();

const { data: result } = useQuery({ ...productListQuery(searchParams), initialData: loaded });
// No loader data at all for these: the loader filled the cache, this reads it.
const { data: categories = [] } = useQuery(categoriesQuery());
```

The loader's return shape got smaller — it no longer carries `categories` —
because the component no longer needs to be *handed* them. That is the shape
change worth noticing: with a cache, a loader's job is to make sure data exists,
not to deliver it.

### Verify

1. Clear the Network tab. Click a product. One `GET /products/1`.
2. Back, and click it again. **No request.** The page renders immediately with
   the data still in the cache. That is the cold open, fixed.
3. Open the devtools panel while you do it — the `["products","detail","1"]`
   entry goes from fresh to inactive and back to active, with no fetch.
4. Wait 30 seconds (the `staleTime`), then Back and forward again. Now you get a
   request — and watch the screen while it runs: **nothing flickers.** The stale
   data renders, the fetch happens underneath, the new data swaps in.
5. Type in the search box with the Network tab open. `GET /products/search?q=…`
   on each committed keystroke, and **no** `GET /products/categories` after the
   first. That is `staleTime: Infinity`.
6. Open the React DevTools **Profiler**, record, and press Back then forward on
   a cached product. `RenderProfiler` logs one commit for the page. A cache hit
   costs a render, not a request — and step 4's background refetch costs a
   second commit only when the data actually differs.

### Watch out

- **`useQuery` in the page with a key the loader never prefetched.** You get a
  loading state on a page that was supposed to have none, because the two keys
  disagree by one character. This is precisely what `queryOptions()` prevents —
  never write the key twice.
- **`prefetchQuery` where you needed `ensureQueryData`.** `prefetchQuery`
  swallows errors and returns `void`, so a failed fetch becomes a page that
  renders with `undefined` instead of one that shows your error boundary.
- **Forwarding `request.signal` into `ensureQueryData`.** The router aborts that
  signal on navigation; the cache then stores a rejected query, and the next
  visit to that product shows an error for data that was never actually broken.
- **`initialData` from something that is not the same data.** It seeds the
  cache entry for that key. Seed it with the wrong shape and every other reader
  of that key gets it too.
- **"Why is the loader still here?"** Delete it and find out: the detail page
  renders before the data arrives, the 404 boundary never fires, and the lazy
  account routes go back to a waterfall. The loader sequences; the cache
  remembers.

### Challenge (2 min)

Add `queryClient.prefetchQuery(productQuery(product.id))` to `ProductCard`'s
`onMouseEnter`. Hover a card for half a second and the detail page opens with no
request at all. Note that `prefetchQuery` — not `ensureQueryData` — is right
here: a hover that fails must do nothing at all.

### In the real world

This is the pattern every data-router application converges on, under several
names ("loader + query", "prefetch in the loader", "router-driven hydration").
Frameworks formalise it: Next.js prefetches on the server and passes a
dehydrated cache to the client; Remix and React Router in framework mode hand
the loader a per-request context. The two things that never change are that the
route decides *when* to block, and the cache decides *whether* to fetch.

---

## Lab 3 — Mutations and invalidation (25 min)

### Problem

Reads are cached now. Writes are not, and there are two of them in this app
doing the same job by different means: `productsAction` handles create, update
*and* delete through an `intent` field, and the delete arrives by `useFetcher`
so it does not navigate.

That worked when the list lived in the loader. It does not now. The cache holds
the list, the detail entry, "more in this category" and "show all"; the router
knows about none of them. Edit a product's title and the list revalidates —
while the detail page keeps showing the old title until its `staleTime` expires.

You have to pick. An app where some writes tell the router and others tell the
cache, chosen by whoever wrote the feature, is the worst of both.

### Concept

**The rule this app adopts today: forms post to actions; buttons call
mutations; everything that reads goes through the cache.**

It is worth being precise about why, because "use `useMutation` for everything"
is the common advice and it is wrong here.

| | Router `<Form>` + action | `useMutation` |
|---|---|---|
| Shape | a form submission | a function call |
| Field-level errors | returned, rendered next to the field | yours to wire up |
| After it succeeds | `redirect()` — closes the modal, carries `?flash=` | you decide |
| Without JavaScript | still works | nothing happens |
| Pending UI | `useNavigation()` / `fetcher.state` | `isPending` |
| Knows about the cache | **no** | yes |
| Per-item state ("which row is deleting") | via `fetcher.formData`, one fetcher per item | `variables` |

The product form is a *form*: five fields, validation that belongs next to
them, a redirect that closes the modal and a flash message that survives it.
`useMutation` has no opinion about any of that — it is a function caller with a
lifecycle. Rebuilding Demo 10's action on top of it would mean re-implementing
`errors`, `values`, focus-the-first-invalid-field and the redirect, to gain one
thing: the ability to invalidate the cache.

And that one thing costs a single line, because the client is a module:

```ts
await queryClient.invalidateQueries({ queryKey: productKeys.all });
```

An action is a plain function — no hooks, no context, nothing to thread. It can
`import { queryClient }` like anything else. **That is the payoff of Lab 2's
module-scope decision**, and it is the piece most teams miss.

The delete is not a form. It is a button in a card, with no fields and nothing
to validate, that needs per-row pending state and — from Lab 4 — an optimistic
edit and a rollback. That is a mutation.

**Invalidation replaces Demo 8's rules.** Demo 8 Lab 2 wrote five: update the
list in state, keep the created item's server id, remove the deleted row,
re-sort if the sort key changed, and refetch when you were not sure. Two
replace them:

1. `invalidateQueries` with the broadest key you can justify.
2. Trust the server's response for anything you display immediately.

`invalidateQueries` marks matching entries stale and refetches the ones being
watched *right now*. The ones nobody is watching are simply marked, and refetch
when somebody looks. You almost never need to be cleverer than the prefix.

**And TypeScript says:** `mutationFn` takes exactly one argument. When a
mutation needs two things, they go in one object — `mutate({ id, patch })` —
and that object's type is what `variables`, `onMutate` and the rest are typed
from, all the way through.

### Steps

**A. `src/hooks/useProductMutations.ts` — `TODO(lab-3.1)`**

```ts
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
    // The broadest key that is true: the list, the detail entry, "more in this
    // category" and "show all" all hang off ['products'].
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
```

`useQueryClient()` rather than the imported singleton, inside a hook: it is the
same object here, and it is the version that survives a test wrapper handing the
tree a fresh client (Demo 20 will thank you).

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-3.2)`**

```tsx
const deleteProduct = useDeleteProduct();

// `variables` is what the last mutate() was called with. One mutation object per
// component, so this is "the delete in flight" — exactly what the card needs.
const deletingId = deleteProduct.isPending ? String(deleteProduct.variables) : null;

function confirmDelete() {
  if (!pendingDelete) return;
  const { id, title } = pendingDelete;
  // mutate() never throws — that is the point of it. The per-call callbacks run
  // AFTER the hook's own and are for what THIS component wants to say.
  deleteProduct.mutate(id, {
    onSuccess: () => notify(pushToast(`“${title}” deleted — the cache dropped it, then refetched.`)),
    onError: (error) => notify(pushToast(ApiError.from(error).message, 'danger')),
  });
  setPendingDelete(null);
}
```

Deleted along with the fetcher: the `useEffect` that watched `fetcher.state` to
fire a toast, and the `DeleteActionData` type. A mutation *has* a completion
callback, so you no longer need an effect to notice that something completed —
which is one of the better arguments in the whole library.

**C. `src/routes/ProductsPage.tsx`, `productsAction` — `TODO(lab-3.3)`**

Delete the `intent === 'delete'` branch, and add one line to the success path:

```ts
const saved = intent === 'update' ? await updateProduct(text('id'), payload) : await createProduct(payload);
// THE BRIDGE. An action has no hooks — but queryClient is a module, so it can
// simply be imported. Without this the router revalidates its loaders and the
// detail page keeps the old title.
await queryClient.invalidateQueries({ queryKey: productKeys.all });
return done(`“${saved.title}” ${intent === 'update' ? 'updated' : 'created'} (server id ${saved.id}).`);
```

`await` it. The redirect that follows re-runs `productsLoader`, whose
`ensureQueryData` is a cache read — and if the entries are not yet marked stale
when that happens, you redirect straight back to the data you just changed.

### Verify

1. Sign in as `emilys` / `emilyspass`. Delete a product; watch the devtools:
   every `products` entry turns yellow (**invalidated**), and the ones on screen
   immediately re-fetch.
2. The toast still fires. There is no effect behind it any more — set a
   breakpoint in `onSuccess` to prove it.
3. Delete a product while "Show all 194" is open. Both lists refetch, because
   both keys start with `['products']`.
4. Edit a product's title and save. The list updates (the router revalidated)
   **and** the detail page shows the new title when you open it — that is the
   one line in step C. Comment it out and watch the old title come back.
5. Open the Network tab during an edit: you will see the PATCH, then the list
   refetch. DummyJSON simulates writes, so the title reverts on the refetch.
   The mechanism is real; the persistence is not, and the toast says so.

### Watch out

- **`invalidateQueries()` with no arguments.** It matches *every* query in the
  cache, including ones on other screens. It is occasionally right — after a
  login, say — and usually a thermonuclear option that hides a key you got
  wrong.
- **Invalidating a key that does not exist.** No error, no warning, nothing
  refetches, and you debug the mutation for twenty minutes. Check the key
  against the devtools panel, which lists every key that actually exists.
- **Forgetting `await` in the action.** `invalidateQueries` returns a promise.
  Without the `await`, the redirect races the invalidation and wins about half
  the time, which is the worst kind of bug to reproduce.
- **`mutate` vs `mutateAsync`.** `mutate` returns `void` and never throws —
  errors land in `onError` and in `mutation.error`. `mutateAsync` returns a
  promise you must `catch`, or you get an unhandled rejection. Reach for
  `mutate` unless you genuinely need to `await` the result.
- **Doing cache work in the component's `onSuccess`.** Per-call callbacks do not
  run if the component unmounted — navigate away mid-flight and your
  invalidation never happens. Cache maintenance goes in the hook; user-facing
  messages go in the call.

### In the real world

The "which writes are forms" question comes up on every team that adopts a data
router and a query library together, and the answer above — forms to actions,
buttons to mutations, one bridging line — is the one that survives code review.
The bridge is also where the bugs live: a mutation that forgets to invalidate
produces a UI that is right until you reload, which is the class of bug that
reaches production because everyone's local tab happened to be fresh.

---

## Lab 4 — Optimistic, the TanStack way (15 min)

### Problem

The delete you just wrote is honest and slow. Click **Delete**, and the card
sits there for 300 ms while DummyJSON thinks about it, then vanishes. Demo 14
already solved that once — with a fetcher:

```tsx
// Demo 14 Lab 1, deleted in Lab 3 above:
const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;
```

One line, no snapshot, no rollback. When the action fails the fetcher goes idle,
`fetcher.formData` clears and the product is simply rendered again. It is the
most elegant optimistic update in this entire course, and it works because the
router owns both the pending state and the data.

It does not work now. The data is in the cache, and `result` comes from
`useQuery` — so the filter is a lie the component tells itself over data
somebody else owns. And it only covers the *visible* list: the detail page, the
virtual list and the infinite pages all still show the product.

### Concept

**Optimistic means editing the cache, not the render.** The three callbacks, in
order, and each one has exactly one job:

| | Runs | Job |
|---|---|---|
| `onMutate` | before the request | cancel in-flight refetches, snapshot, write the optimistic value |
| `onError` | the request failed | put the snapshot back |
| `onSettled` | either way | invalidate — let the server have the last word |

**`cancelQueries` is the first line and it is not optional.** A background
refetch that started before you clicked will land *after* your optimistic edit
and overwrite it with the old list. You will see the row vanish and come back,
and you will blame the rollback.

**Whatever `onMutate` returns is the context.** It arrives as the third argument
of `onError` and `onSettled`. Snapshot with `getQueriesData` — plural, because
there may be several cached list pages — and restore with `setQueryData` per
key.

**`onSettled` runs even after a successful rollback**, and that is deliberate.
A rollback restores what you *believed* before the request; only the server
knows what is true after it.

Side by side with Demo 14:

| | Fetcher optimistic UI (Demo 14) | `onMutate` (today) |
|---|---|---|
| Where the truth lives | the loader's data + `fetcher.formData` | the cache |
| The optimistic edit | a `.filter()` in render | a write into the cache |
| Rollback | automatic — the fetcher goes idle | `onError` restores the snapshot |
| Covers other screens | no — only this component's render | yes, every key you touch |
| Concurrent mutations | one fetcher per item | one mutation, `variables` per call |
| Lines of code | 1 | ~15 |
| Right when | the router owns the data and one screen shows it | the cache owns the data |

The fetcher version is not obsolete — `CartDrawer`'s checkout still uses one,
because the router still owns that. Use the tool that owns the data.

### Steps

**A. `src/hooks/useProductMutations.ts` — `TODO(lab-4.1)`**

```ts
interface DeleteContext {
  /** Every list entry we touched, as it was. */
  snapshots: [readonly unknown[], ProductListResponse][];
}

return useMutation({
  mutationFn: (id: number | string) => deleteProduct(id),

  onMutate: async (id) => {
    // 1. Stop anything already in flight — it would land on top of our edit.
    await queryClient.cancelQueries({ queryKey: productKeys.lists() });

    // 2. Snapshot. Plural: page 1, page 2 and a search may all be cached.
    const snapshots = queryClient.getQueriesData<ProductListResponse>({ queryKey: productKeys.lists() });

    // 3. Write the optimistic value into every one of them.
    queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
      old ? { ...old, products: old.products.filter((p) => String(p.id) !== String(id)), total: Math.max(0, old.total - 1) } : old,
    );

    // 4. Hand the snapshots on. getQueriesData returns [key, data | undefined][] —
    //    drop the entries that had no data, so onError only restores real ones.
    return { snapshots: snapshots.filter((pair): pair is [readonly unknown[], ProductListResponse] => pair[1] !== undefined) };
  },

  onError: (_error, _id, context: DeleteContext | undefined) => {
    for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
  },

  onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
});
```

The `pair is [readonly unknown[], ProductListResponse]` predicate is a **type
guard in a filter** — the idiom for narrowing an array by removing the
`undefined`s. Without it, `context.snapshots` would still be typed as possibly
holding `undefined` data, and `setQueryData(key, undefined)` *deletes* the entry
rather than restoring it.

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-4.2)`**

Delete the two lines you kept from Demo 14:

```diff
- const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;
+ const products = result.products;
```

The card disappears before the request finishes, and the component knows nothing
about it. It renders what the cache says, which is the whole point.

### Verify

1. Delete a product. The card vanishes **instantly**, and the total in the
   header drops by one.
2. Devtools open, throttle the network to Slow 3G and delete again: you can
   watch the cached list change before the DELETE completes.
3. Force the failure. In `src/api/services/products.ts`, temporarily point
   `deleteProduct` at a bad path (`/productz/${id}`). Delete a card: it
   disappears, and about 300 ms later it comes back, with a red toast. That is
   `onError`, and you wrote the rollback in five lines. Put the path back.
4. Open "Show all 194" and delete from the paged grid. The virtual list refetches
   too — `onSettled` invalidated `['products']`, not just the one page.
5. Do it twice quickly on two different cards. Both vanish; both mutations carry
   their own `variables`; `onSettled` fires twice and the second invalidation is
   deduped for you.

### Watch out

- **No `cancelQueries`.** The classic bug: the row vanishes and reappears
  *without* an error, because a refetch that was already running answered last.
- **Snapshotting after writing.** `getQueriesData` then `setQueriesData` — that
  order. Reverse them and you snapshot the optimistic value and "roll back" to
  the thing you were trying to undo.
- **`setQueryData(key, undefined)`.** Removes the entry rather than restoring
  it. That is why the filter with the type guard is there.
- **Optimism about creates.** A created row has no id until the server answers,
  so an optimistic create needs a temporary id and a reconciliation — which is
  exactly the complexity `useMutation` + invalidation avoids for the product
  form. Be optimistic about deletes and toggles; be patient about creates.
- **Mutating the cached object.** `old.products.splice(...)` edits the object
  React is rendering. Every updater here returns a new object; keep it that way
  or nothing re-renders and your snapshot is the same object as the edit.

### In the real world

The rule teams settle on is: be optimistic where the user's intent is
unambiguous and the failure is rare and reversible — likes, saves, toggles,
deletes with an undo. Be patient where the server decides something you cannot
predict, such as an id, a price, stock, or anything another user could have
taken first. And when you are optimistic, make the failure *visible*: a row that
silently comes back is worse than one that never left.

---

## Lab 5 — Infinite queries (15 min)

### Problem

The `Pager` is right for a catalogue you search: page 7 is a URL you can send,
the back button works, and nobody loses their place. It is wrong for browsing,
where the product is a feed and the gesture is a scroll.

Doing that with what you have means accumulating pages in state, remembering the
skip, keeping the "is there more" flag in step with it, and throwing the lot away
on unmount. `useInfiniteQuery` is the same query with a different data shape.

### Concept

**One cache entry, an array of pages.** `data.pages` is
`ProductListResponse[]`, oldest first, alongside `data.pageParams`. That shape is
why leaving this view and coming back restores *everything you had loaded* —
because it was never split into separate entries that could be collected
separately.

**`pageParam` is whatever you decide it is.** A cursor, a page number, a
timestamp — here a `skip`, because that is what DummyJSON takes.
`initialPageParam` is where you start; `getNextPageParam(lastPage)` returns the
next one, or **`undefined` to mean "that was the last page"**. That `undefined`
is what `hasNextPage` reports, and forgetting it gives you a list that fetches
forever.

**The sentinel, not the scroll handler.** A `scroll` listener runs on every
frame, calls `getBoundingClientRect()` (a layout flush) and needs its own
throttle. `IntersectionObserver` is the browser telling *you*, off the main
thread, only when the answer changes. `rootMargin: '200px'` starts the next page
while the sentinel is still a screen below the fold, so the user never sees the
spinner.

**And accessibility says:** a keyboard or screen-reader user never "scrolls
something into view". The button is not a fallback — it is the real control, and
the observer is the shortcut for people using a mouse.

### Steps

**A. `src/api/queries.ts` — `TODO(lab-5.1)`**

```ts
export function productsInfiniteQuery(searchParams: URLSearchParams) {
  const options = listOptionsFrom(searchParams);
  const limit = options.limit ?? env.pageSize;

  return infiniteQueryOptions({
    // The URL's ?page= must NOT be in this key — the pages are the data here.
    queryKey: productKeys.infinite({ ...options, page: 0 }),
    queryFn: ({ pageParam, signal }) => listProducts({ ...options, page: pageParam / limit, signal }),
    initialPageParam: 0,                       // skip=0
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.skip + lastPage.products.length;
      return loaded < lastPage.total ? loaded : undefined;   // undefined ⇒ hasNextPage === false
    },
  });
}
```

**B. `src/hooks/useIntersection.ts` — `TODO(lab-5.2)`**

```ts
export function useIntersection(ref: RefObject<Element | null>, { rootMargin = '200px', enabled = true }: UseIntersectionOptions = {}): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    // An observer that outlives its node keeps the node alive — a leak you cannot see.
    return () => observer.disconnect();
  }, [ref, rootMargin, enabled]);

  return isIntersecting;
}
```

The ref is `RefObject<Element | null>` because React fills refs *after* the
render that created them. The effect is the first place the node exists, which
is exactly where the observer belongs (Demo 15's rule, unchanged).

**C. `src/components/EndlessGrid.tsx` — `TODO(lab-5.3)`**

```tsx
const [searchParams] = useSearchParams();
const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery(productsInfiniteQuery(searchParams));

const sentinelRef = useRef<HTMLDivElement>(null);
const sentinelVisible = useIntersection(sentinelRef, { enabled: hasNextPage });

useEffect(() => {
  // isFetchingNextPage is the guard that matters: the sentinel stays visible while
  // the new page renders, and without this you fire four requests in a row.
  if (sentinelVisible && hasNextPage && !isFetchingNextPage) void fetchNextPage();
}, [sentinelVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

// The one place an infinite query costs you something a plain list does not.
const products = data?.pages.flatMap((page) => page.products) ?? [];
```

**D. `src/routes/ProductsPage.tsx` — `TODO(lab-5.4)`** adds a Pages ⇄ Endless
button and swaps `<ProductGrid> + <Pager>` for `<EndlessGrid>` when it is on.
The `<RenderProfiler id="grid">` wrapper stays outside the branch, so both views
are measured by the same instrument.

### Verify

1. Switch to **Endless** and scroll. Pages arrive before you reach the bottom —
   that is `rootMargin`.
2. Network tab: `skip=0`, `skip=12`, `skip=24`… one request per page, never two
   for the same skip.
3. Devtools: **one** entry, `["products","infinite",{…}]`, whose data has a
   `pages` array that grows. Not sixteen entries.
4. Load five pages, open a product, come back. All five pages are still there.
5. Scroll to the very end (194 products). The button is replaced by "All 194
   products loaded" and the observer stops — `getNextPageParam` returned
   `undefined`.
6. Tab to the bottom of the list with the keyboard: the **Load more** button is
   focusable and works. That is the accessible path, not a fallback.

### Watch out

- **`getNextPageParam` returning `0`.** `0` is a valid page param, not "no more"
  — only `undefined` ends the list. Returning `null` does not work either.
- **No `isFetchingNextPage` guard.** The sentinel is still on screen while the
  next page renders, so the effect fires again, and again. Four requests, four
  duplicate pages.
- **`?page=` in the infinite key.** The pages *are* the data; put the URL's page
  in the key and every "load more" starts a new cache entry.
- **Two entries for the same products.** The paged view and the endless view
  hold separate cache entries by design — different shapes, different keys. That
  is a real cost of `useInfiniteQuery` and the reason not to offer both views
  unless the product genuinely wants both.
- **Infinite lists and the DOM.** Ten pages is 120 cards, all mounted. Demo 18's
  virtualiser exists for exactly this; `ProductRowList` shows the combination
  you would reach for at a thousand rows.

### In the real world

The two questions to ask before building one: can the user get back to what they
found (usually not — infinite lists and deep links are enemies), and what does
the footer do (nothing; it is unreachable). Search results and admin tables want
pages and a URL. Feeds want this. Offering both, as ShopScope now does, is
honest but it is two code paths and two cache entries — pick one unless somebody
can say why both.

---

## Lab 6 — Keeping data fresh: polling, SSE, `useSyncExternalStore` (20 min)

### Problem

Everything so far refreshes because *the user did something*: navigated,
mutated, came back to the tab. Some data does not wait for that. Stock falls
while a page is open. A price changes. The network drops.

There are exactly three ways to find out, and they are not interchangeable.

### Concept

**Poll when you can tolerate being N seconds behind and the request is cheap.**
`refetchInterval: 15_000` is a timer TanStack owns — it respects `staleTime`,
pauses while a refetch is in flight, and survives re-renders. The number that
makes it defensible is the *other* one: `refetchIntervalInBackground: false`
(the default, worth spelling out) stops the timer while the tab is hidden. A
laptop with forty open tabs polling every fifteen seconds is a flat battery and
a bill. When the tab comes back, one catch-up refetch runs and the timer
resumes.

The other half of affordable polling is payload. `listStock()` asks for
`select=id,stock` — 194 rows, about 4 kB — instead of the full catalogue at
400 kB. Poll small things.

**Push when the server knows first and the news is rare.** `EventSource` is
Server-Sent Events: one long-lived HTTP GET, `Content-Type: text/event-stream`,
messages separated by blank lines, automatic reconnection with a backoff. It is
one-way — the client cannot send — which is why it is simpler than a WebSocket
and enough for a ticker.

> ⚠️ **DummyJSON has no push channel, so this feed is a mock.** Lab 6 C ships a
> ~20-line Vite dev-server plugin that serves `/__dev/prices` and emits a random
> `{ id, price }` every three seconds. It is a mock of the *transport*, not of
> the client: the hook you write is what you would ship. A real feed would send
> the same JSON from whatever publishes price changes — a broker, a database
> trigger, a service's outbox — and not one character of `usePriceTicker`
> changes. `apply: 'serve'` keeps the plugin out of every build, so in
> `npm run preview` and in production the endpoint 404s, `EventSource` reports
> an error, and the badge disappears. That is the degradation you want, and it
> is the reason the ticker never became the only source of a price.

**A push writes to the cache; it does not invalidate it.** `invalidateQueries`
on every message would turn a push feed into a request storm — the exact thing
push exists to avoid. The message already carries the new value, so
`setQueryData` puts it where the cache would have put it and every watcher
re-renders.

**Subscribe to the browser with `useSyncExternalStore`.** For online/offline,
`useState` + `useEffect` has a real bug: the first render shows the initial
value, the effect runs after paint, and anything that changed in between is on
screen wrong for a frame. `useSyncExternalStore(subscribe, getSnapshot)` reads
the external value *during* render and stays correct when a render is
interrupted and resumed. It is the hook Zustand is built on (Demo 13), and the
right tool for `matchMedia`, `document.hidden` and cross-tab `localStorage` too.

| | Poll | Push (SSE) | `useSyncExternalStore` |
|---|---|---|---|
| Who starts it | the client, on a timer | the server | neither — you read a value |
| Latency | up to the interval | immediate | immediate |
| Cost when nothing changes | a request per interval | one idle connection | nothing |
| Fails by | being N seconds stale | disconnecting | not applicable |
| Use for | stock, dashboards | prices, notifications | browser APIs |

### Steps

**A. `src/api/queries.ts` — `TODO(lab-6.1)`**

```ts
export function stockQuery() {
  return queryOptions({
    queryKey: productKeys.stock(),
    queryFn: ({ signal }) => listStock({ signal }),   // already written for you: select=id,stock
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,  // the line that makes polling defensible
  });
}
```

**B. `src/components/LiveStockBadge.tsx` — `TODO(lab-6.2)`**

```tsx
const { data: stock, isFetching, dataUpdatedAt } = useQuery({
  ...stockQuery(),
  // 194 rows in, one number out — and TanStack compares the SELECTED value, so this
  // component re-renders only when ITS product's stock changes. Demo 18, applied to a cache.
  select: (rows) => rows.find((row) => row.id === productId)?.stock,
});

if (stock === undefined) return null;
// aria-live="polite": the number changes without anybody clicking, so say so.
// dataUpdatedAt: live data nobody can date is not believable.
```

**C. `vite.config.ts` + `src/hooks/usePriceTicker.ts` — `TODO(lab-6.3)`**

```ts
function mockPriceFeed(): Plugin {
  return {
    name: 'shopscope:mock-price-feed',
    apply: 'serve',                       // the dev server only — never in a build
    configureServer(server) {
      server.middlewares.use('/__dev/prices', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        const timer = setInterval(() => {
          const id = 1 + Math.floor(Math.random() * 12);
          const price = Math.round((5 + Math.random() * 200) * 100) / 100;
          res.write(`data: ${JSON.stringify({ id, price })}\n\n`);   // the wire format IS the spec
        }, 3000);
        res.on('close', () => clearInterval(timer));   // source.close() in React lands here
      });
    },
  };
}
```

```ts
export function usePriceTicker(): TickerStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TickerStatus>(import.meta.env.DEV ? 'connecting' : 'off');

  useEffect(() => {
    if (!import.meta.env.DEV) return;      // compile-time constant → the body is stripped from the build

    const source = new EventSource('/__dev/prices');
    source.addEventListener('open', () => setStatus('live'));
    // EventSource reconnects by itself; 'error' fires each time it drops.
    // Do NOT close it here — closing is how you turn the reconnection off.
    source.addEventListener('error', () => setStatus(source.readyState === EventSource.CLOSED ? 'off' : 'retrying'));

    source.addEventListener('message', (event) => {
      const tick = parseTick(event.data);   // anything off a socket is unknown: parse, then narrow
      if (tick) applyPrice(tick);
    });

    function applyPrice(tick: PriceTick) {
      queryClient.setQueryData<Product>(productKeys.detail(tick.id), (old) => (old ? { ...old, price: tick.price } : old));
      queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
        old ? { ...old, products: old.products.map((p) => (p.id === tick.id ? { ...p, price: tick.price } : p)) } : old,
      );
    }

    // The cleanup IS the lab: without it StrictMode opens a second connection,
    // every navigation opens another, and the server runs out of sockets.
    return () => source.close();
  }, [queryClient]);

  return status;
}
```

`addEventListener('message', …)` uses the *default* event name. A server may
name its events (`event: price`), but TypeScript's `EventSourceEventMap` only
knows `'message'`, `'open'` and `'error'`, so a named listener costs you a cast
to get `MessageEvent` back. Unnamed is not a shortcut here; it is the typed
path.

**D. `src/hooks/useOnlineStatus.ts` + `src/components/ConnectionBadge.tsx` —
`TODO(lab-6.4)`**

```ts
// Module scope, both of them: a new function per render re-subscribes every render.
function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}
const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;     // no navigator on a server — assume online

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

`ConnectionBadge` renders both, offline winning, and is the **only** caller of
`usePriceTicker` — a second one opens a second connection.

### Verify

1. Open a product. The live badge appears with a timestamp; every fifteen
   seconds the Network tab shows one ~4 kB `GET /products?select=id,stock`.
2. Switch to another browser tab for a minute, then come back. The requests
   **stop** while you are away and one catch-up runs on return. That is
   `refetchIntervalInBackground: false`.
3. The header shows a green **Live prices** badge, and product prices on page 1
   change every few seconds. Watch a card's price and the devtools entry change
   together with no request in the Network tab — that is `setQueryData`.
4. Network tab → **Offline**. The badge flips to a yellow "Offline" within a
   frame. Back online, and TanStack refetches the active queries by itself
   (`refetchOnReconnect`, on by default).
5. Delete the `return () => source.close()` line, save, and navigate between
   products five times. Five open `/__dev/prices` connections in the Network
   tab, all still streaming. Put it back.
6. `npm run build && npm run preview`. No badge, no ticker, no `/__dev/prices`
   request. The polling still works, because polling is not a mock.

### Watch out

- **`refetchInterval` shorter than `staleTime`.** The timer fires, the data is
  still fresh, nothing happens, and you conclude that polling is broken. Keep
  `staleTime` below the interval.
- **Closing the source in the `error` handler.** `EventSource` reconnects by
  itself; closing it is how you *stop* that, permanently, on the first hiccup.
- **`invalidateQueries` on every message.** A request per tick — push turned
  back into polling, with extra steps.
- **A second `usePriceTicker()` anywhere.** Two components, two connections, two
  sets of writes. Hooks that own a connection belong in exactly one place, and
  the comment in `ConnectionBadge` says so.
- **Trusting `navigator.onLine`.** It is false only when the OS says there is no
  network. Captive portals, a dead API and aeroplane Wi-Fi are all "online".
  It is a hint, never a health check.
- **A push that is the only source of truth.** This ticker writes prices into
  entries that already exist and never creates one. When the socket drops you
  lose freshness, not data — which is why the poll and the query underneath it
  both stay.

---

## Lab 7 — Where every kind of state lives (10 min)

### Problem

Demo 13 drew a table with five rows and one honest gap: "Server — loaders,
revalidated by actions". That row has grown a cache, a mutation lifecycle, a
poll and a socket. Nine files added since Lab 1 need a rule that says where the
next piece of state goes, before somebody puts a filter in a Zustand store.

### Concept

**Ask two questions in this order: does somebody else own it, and does it need
to survive this screen?**

| Kind | Example in ShopScope | Lives in | Because |
|---|---|---|---|
| **URL** | `?q=`, `?category=`, `?page=`, `?sort=`, `?edit=`, `?view=` | `useSearchParams` / `useProductFilters` | somebody may send the link, and Back must undo it |
| **Server, needed to render a route** | the product page, page 1 of the catalogue | a **loader** calling `ensureQueryData` | the route must not render without it |
| **Server, everything else** | related products, all 194, categories, stock, prices | **TanStack Query** | you do not own it; it can change under you |
| **Global client** | wishlist, cart, theme | **Zustand** (persisted) | yours, and it outlives every page |
| **Form draft** | the sign-up form, the product form | **react-hook-form** / uncontrolled `<Form>` | it is invalid until it is submitted; nobody else may see it |
| **Local UI** | grid density, Slow mode, a pending delete, a disclosure | **`useState`** | one screen, dies with it, nobody sends a link to it |

Two rows are worth arguing about, because both changed today.

**The wishlist is not server state, and putting it in the cache would be
wrong.** There is no endpoint. It is the user's, it lives in `localStorage`, and
nobody else can change it — so there is nothing to be stale about, nothing to
invalidate, and no optimism required. When ShopScope grows a `/wishlist`
endpoint, the array moves into a query and Zustand keeps only the drawer's
open/closed flag. *Where the data is authoritative decides the tool.*

**`?view=` moved into the URL, and the reason is a cost that disappeared.**
Demo 18 kept view preferences out of the query string with a specific argument:
React Router re-runs the route's loader on any search-param change, so
`?density=compact` would put a network request behind a purely visual switch.
That is no longer true — after Lab 2 the loader's `ensureQueryData` finds the
page in the cache and returns it synchronously. The cost that made the decision
went away, so the decision changes, and `?view=endless` is now a link somebody
can send. `density` stayed local, because nobody sends a link to a density.

That is the actual skill: these are not rules, they are trade-offs with reasons
attached, and when a reason expires you revisit the decision.

### Steps

**`src/routes/ProductsPage.tsx` — `TODO(lab-7.1)`**

```tsx
// Not useState: this is a view somebody can send. `?view=endless`.
const view = searchParams.get('view') === 'endless' ? 'endless' : 'pages';
// …and the toggle from Lab 5 D writes it with the existing setParam helper:
onClick={() => setParam('view', view === 'endless' ? null : 'endless')}
```

`listOptionsFrom` ignores `view`, so flipping it does not change the list's
query key — the loader re-runs, reads the cache and returns in under a
millisecond.

### Verify

1. Switch to Endless, copy the URL, open it in a new tab. It opens in Endless.
2. Press Back. It returns to Pages, because it is a history entry.
3. Network tab while you toggle: **no requests**. The loader ran both times.
4. Toggle density instead. The URL does not change, and a reload puts it back to
   comfortable — which is right, and the table says why.

### In the real world

Print the table. The two failure modes it prevents are the expensive ones:
server data copied into a store, where it goes stale silently and two screens
disagree; and UI state pushed into the URL, where every hover produces a history
entry. When somebody on your team asks "should this be in the store?", the
useful answer is the first question in the Concept — *who owns it?*

---

## Wrap-up — what you can now do

- [x] Tell server state from client state, and say why `useState` + `useEffect` is the wrong shape for the first one
- [x] Configure a `QueryClient` — `staleTime`, `gcTime`, a `retry` predicate that reuses an existing policy — and say what each one controls
- [x] Build a hierarchical key factory and use `queryOptions()` so a prefetch and a read cannot drift apart
- [x] Prefetch in a loader with `ensureQueryData` and read it back with `useQuery`, and explain where the client must live and why SSR changes that
- [x] Choose between a router action and `useMutation` from the shape of the interaction, and bridge the two with one invalidation
- [x] Write an optimistic mutation the TanStack way — `cancelQueries`, snapshot, rollback, `onSettled` — and say when a fetcher is still the better tool
- [x] Page a list forwards with `useInfiniteQuery`, an `IntersectionObserver` hook and a real button
- [x] Poll without draining a battery, push into the cache over `EventSource`, and subscribe to a browser API with `useSyncExternalStore`
- [x] Place any new piece of state in the right home, and revisit the decision when the reason behind it expires

**The server-state policy** — what to reach for, and where each one is in the
finished app:

| Question | Answer | In ShopScope today |
|---|---|---|
| "Do we already know this?" | a **query key** | `productKeys`, in `src/api/queries.ts` |
| "How current must it be?" | **`staleTime`** | `Infinity` for categories, 30 s default, 10 s for stock |
| "Must this route wait for it?" | a **loader** + `ensureQueryData` | `productsLoader`, `productDetailLoader` |
| "Can this route render without it?" | `useQuery` in the component | `RelatedProducts`, `ProductRowList`, `LiveStockBadge` |
| "It is a form" | a router **action**, plus one `invalidateQueries` | `productsAction` |
| "It is a button" | **`useMutation`** | `useDeleteProduct` |
| "It must feel instant" | **`onMutate`** + rollback | the delete, since Lab 4 |
| "There is more below" | **`useInfiniteQuery`** | `EndlessGrid` |
| "It changes while we watch" | **`refetchInterval`**, paused when hidden | `LiveStockBadge` |
| "The server knows first" | **`EventSource`** + `setQueryData` | `usePriceTicker` (a mock feed) |
| "The browser knows" | **`useSyncExternalStore`** | `useOnlineStatus` |
| "It is ours" | the URL, Zustand, react-hook-form, `useState` | Lab 7's table |

## Next demo

**Demo 20 — Testing React Applications.** Rename `onAdd` to `onAddToCart` in
`ProductCard`: `npm run typecheck` passes and the button does nothing. Types
caught the shape; nothing caught the behaviour. Demo 20 wires Vitest, Testing
Library and MSW into this project and points them at the riskiest code in it —
which, after today, is a cache: the optimistic rollback you cannot see fail, the
refresh queue under six concurrent 401s, and a products page driven through
loading, results, error and empty by handlers rather than `fetch` mocks.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `No QueryClient set, use QueryClientProvider to set one` | A hook rendered outside the provider. In `main.tsx` the provider must wrap `<RouterProvider>`, not sit beside it. A loader is fine — it imports the client directly. |
| The devtools flower never appears | It is behind `import.meta.env.DEV`. You are on `npm run preview` or a build, where it is deliberately removed. |
| A request fires twice on every mount, in dev only | StrictMode mounts, unmounts and remounts. The second render is served from the cache unless `staleTime` is `0` — which is the default until Lab 1 A. |
| The page shows a loading state even though the loader ran | The loader's key and the component's key differ. Use `queryOptions()` in both, and compare them in the devtools panel. |
| `Property 'products' does not exist on type 'ProductListResponse \| undefined'` | `useQuery().data` is `T \| undefined`. Pass `initialData` (Lab 2) or narrow it. |
| Back is still a request | The entry's `gcTime` expired (default 5 min, 10 here), or you are looking at a key with `staleTime: 0`. |
| A mutation succeeds but the list does not change | `invalidateQueries` was called with a key nothing matches. Check it against the devtools' list — the prefix has to be a real prefix. |
| The redirect after an edit shows the old data | `invalidateQueries` was not `await`ed in the action, so the redirect's loader read the cache first. |
| The deleted row flashes back, with no error | `onMutate` did not `await queryClient.cancelQueries(...)`. A refetch already in flight answered last. |
| The rollback deletes the row instead of restoring it | A snapshot whose data was `undefined` was passed to `setQueryData`, which removes the entry. Filter the `getQueriesData` pairs first. |
| `useInfiniteQuery` fetches for ever | `getNextPageParam` returned `0` or `null` for the end of the list. Only `undefined` stops it. |
| Four identical "load more" requests in a row | The effect is missing the `!isFetchingNextPage` guard; the sentinel is still on screen while the new page renders. |
| The stock badge never updates | `refetchInterval` is shorter than `staleTime`, so the timer fires on data that is still fresh. |
| Polling continues in a background tab | `refetchIntervalInBackground` was set to `true`. The default is `false` — leave it. |
| `GET /__dev/prices 404` after `npm run preview` | Correct. `apply: 'serve'` keeps the mock plugin out of every build; the ticker reports `off` and renders nothing. |
| A new `/__dev/prices` connection on every navigation | The effect's cleanup is missing. `return () => source.close()`. |
| `Property 'data' does not exist on type 'Event'` | `addEventListener('price', …)` — a custom event name gives you `Event`, not `MessageEvent`. Use the default `'message'`, or cast. |
| `npm run check:bundle` fails after Lab 1 | Expected: react-query added 45.9 kB. Move `DEFAULT_MAX_KB` to 700 and write down what you bought. |
| `[config] Missing required env var VITE_API_BASE_URL` in a test run | Vitest does not load `.env.development` by default. Demo 20 sets it in the test config. |
