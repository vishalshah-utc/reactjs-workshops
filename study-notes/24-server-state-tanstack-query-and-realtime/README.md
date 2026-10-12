# Module 24 — Server State: TanStack Query & Real-time Data

**Study notes** · ~4 hours

> **Goal.** [Module 13](../13-data-fetching-and-custom-hooks/) ended with a
> table of everything `useFetch` structurally cannot do. This module is the
> answer to that table: a cache, and the library that manages one for you.
> You will learn to treat server data as *a cache of somebody else's truth*,
> configure how stale it may be, keep it next to React Router's loaders rather
> than instead of them, write to it optimistically, page it forwards, and then
> keep it live — by polling, by push, and by subscribing to the browser itself.

**Prerequisites:** [Module 13](../13-data-fetching-and-custom-hooks/) in full,
especially [§6](../13-data-fetching-and-custom-hooks/#6-everything-usefetch-still-gets-wrong)
and [§7](../13-data-fetching-and-custom-hooks/#7-server-state-is-not-client-state).
[Module 12 §4](../12-effects/#4-cleanup) and [§14](../12-effects/#14-usesyncexternalstore).
Module 14 — Routing & Application Architecture (loaders and actions).
Module 21 — The API Layer (the `listProducts` / `getProduct` services every
query below calls).

**Versions.** `@tanstack/react-query` 5.103, `react-router` 8.3, `axios` 1.20,
React 19.3 — the demo starter's pins. TanStack Query 5 renamed several v4
names (`isLoading` → `isPending`, `cacheTime` → `gcTime`, `useErrorBoundary`
→ `throwOnError`); older examples you find will use the old ones.

---

## Contents

1. [Server state is a cache](#1-server-state-is-a-cache)
2. [`QueryClient` and the provider](#2-queryclient-and-the-provider)
3. [`useQuery`](#3-usequery)
4. [Query keys are a design problem](#4-query-keys-are-a-design-problem)
5. [`staleTime`, `gcTime` and the refetch triggers](#5-staletime-gctime-and-the-refetch-triggers)
6. [`status`, `fetchStatus` and the four UI states](#6-status-fetchstatus-and-the-four-ui-states)
7. [Dependent queries, `enabled` and `useQueries`](#7-dependent-queries-enabled-and-usequeries)
8. [`placeholderData` and `initialData`](#8-placeholderdata-and-initialdata)
9. [Mutations and invalidation](#9-mutations-and-invalidation)
10. [Optimistic updates: through the cache, or through `useOptimistic`](#10-optimistic-updates-through-the-cache-or-through-useoptimistic)
11. [Infinite queries and pagination](#11-infinite-queries-and-pagination)
12. [Queries beside loaders: `ensureQueryData` and prefetching](#12-queries-beside-loaders-ensurequerydata-and-prefetching)
13. [`useSuspenseQuery`](#13-usesuspensequery)
14. [Errors: `throwOnError` and boundaries](#14-errors-throwonerror-and-boundaries)
15. [Devtools](#15-devtools)
16. [Testing queries](#16-testing-queries)
17. [Real-time 1 — polling](#17-real-time-1--polling)
18. [Real-time 2 — push: SSE and WebSockets](#18-real-time-2--push-sse-and-websockets)
19. [`useSyncExternalStore` for an external ticker](#19-usesyncexternalstore-for-an-external-ticker)
20. [When real-time is not worth it](#20-when-real-time-is-not-worth-it)
21. [Self-check](#21-self-check)
22. [References](#22-references)

---

**Hands-on:** [Demo 19 — Server State with TanStack Query & Real-time Data](../../demos/19-tanstack-query-and-realtime/)
converts ShopScope's loaders and `useFetch` calls to a cache in seven labs:
the `QueryClient` and devtools, `ensureQueryData` inside the existing loaders,
mutations beside the router action, an optimistic delete, an endless grid,
polled stock, a mock `EventSource` price feed, and `useSyncExternalStore` for
online/offline. The code below is that demo's code, explained.

---

## 1. Server state is a cache

Module 13 §7 made the distinction: client state is a value you own; server
state is somebody else's truth that you hold a copy of. The consequence is
what matters here. **A copy of somebody else's truth is a cache**, and a cache
has questions a value never has:

| Question | A value (`useState`) | A cache |
|---|---|---|
| Do we already have this? | one copy, in one component | looked up by **key** |
| How old may it be? | never asked | **`staleTime`** |
| How long do we keep it once nobody is looking? | until unmount | **`gcTime`** |
| Who is showing it right now? | nobody knows | the **observers** of the key |
| Something changed — what is now wrong? | you work it out | **invalidate** by key prefix |
| Two readers at the same moment? | two requests | **one** request, one promise |

Every row of Module 13's "what `useFetch` cannot do" table is one of these
questions. A query library is not a fetching library — `axios` already
fetches. It is a cache with a React binding, and **a query is a key, a
function and a policy**: the key identifies the data, the function fetches
it, the policy says how long the answer counts.

The cost of getting this wrong is not slowness. It is *disagreement*: two
components with two copies of the same product, one of them stale. A cache is
a correctness tool first.

📖 [TanStack Query — Overview](https://tanstack.com/query/latest/docs/framework/react/overview) ·
[Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

---

## 2. `QueryClient` and the provider

One cache for the application, created once:

```ts
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { isRetryable } from './retry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // fresh for 30 s — no refetch on mount, focus or reconnect
      gcTime: 10 * 60_000,        // an UNUSED entry survives 10 min
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      refetchOnWindowFocus: true, // the default, spelled out
    },
    mutations: { retry: false },  // a POST that timed out may have succeeded
  },
});
```

```tsx
// src/main.tsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </ThemeProvider>
</QueryClientProvider>
```

Two decisions are hiding in there.

**The `retry` predicate reuses the app's existing policy.** Module 21's
`withRetry` already decides what deserves a second attempt (no response, 408,
429, 5xx). The client takes the same `isRetryable` so there is one definition
— and the services are *not* also wrapped in `withRetry`, because two retry
layers multiply: three attempts inside three is nine requests.

**The client is a module-scope singleton, not state inside the provider.** The
provider *publishes* it; it does not own it. A React Router loader is a plain
function with no component above it and no hooks, so the only way a loader
and a hook can share one cache is for both to `import` it
([§12](#12-queries-beside-loaders-ensurequerydata-and-prefetching)).

> **Correct for a client-only SPA; wrong under SSR.** ShopScope's module graph
> is evaluated once, in one tab, for one user. On a server, one Node process
> serves every request, and a module-scope cache would hand one customer's
> data to the next. Server-rendered apps create the client *per request* and
> pass it to loaders through the router's context. Same pattern; different
> lifetime; the lifetime is the security property.

📖 [`QueryClient`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient) ·
[`QueryClientProvider`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider)

**→ In the demos:** Demo 19, Lab 1 — `queryClient.ts`, the provider and the
devtools.

---

## 3. `useQuery`

The "own lifetime" request from Module 13 §5, as a query:

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query';

export function relatedQuery(product: Product, limit = 5) {
  return queryOptions({
    queryKey: productKeys.related(product.category, product.id),
    queryFn: ({ signal }) => listProducts({ category: product.category, limit, signal }),
    staleTime: 5 * 60_000,
    select: (response) => response.products.filter((p) => p.id !== product.id).slice(0, 4),
  });
}

export function RelatedProducts({ product }: { product: Product }) {
  const { data: related, isPending, error } = useQuery(relatedQuery(product));

  if (isPending) return <RowSkeleton />;
  if (error) return <ErrorNotice error={ApiError.from(error)} />;
  if (related.length === 0) return null;
  return <ProductRow products={related} />;
}
```

| Piece | Job |
|---|---|
| `queryKey` | identity — the cache entry this component observes |
| `queryFn` | how to fill it; receives an `AbortSignal` that fires when the last observer leaves |
| `staleTime` | the policy for this key, overriding the client default |
| `select` | shapes what *this* component sees; the cache still holds the full response |
| `queryOptions()` | welds key to function and carries the types, so a prefetch and a read cannot drift apart |

Three things to notice. `data` is `T | undefined` until the query has
succeeded — the type is honest about the first render. `error` is `unknown`,
because anything can be thrown; narrow it at the edge with `ApiError.from`
exactly as a `catch` block would. And the `signal` is TanStack's, not the
router's — pass it to the service and an abandoned request is actually
cancelled.

`select` re-runs on every render unless its reference is stable, so define an
expensive transform at module scope or in `useCallback`. Its result is
compared structurally: a component selecting one number out of 194 rows
re-renders only when *that* number changes.

📖 [Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries) ·
[`useQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) ·
[Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)

**→ In the demos:** Demo 19, Lab 1 — `RelatedProducts` and `ProductRowList`
converted from `useFetch`.

---

## 4. Query keys are a design problem

A key is an array, hashed **structurally**: `['products', { category: 'audio' }]`
equals any array with the same contents, regardless of object key order. Keys
are also matched **by prefix** — `['products']` matches every key that starts
with it. Those two facts turn keys into a hierarchy, and a hierarchy is
something you design once:

```ts
// src/api/queries.ts — the only place a key is written
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (options: ListProductsOptions) => [...productKeys.lists(), options] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...productKeys.details(), String(id)] as const,
  related: (category: string, id: number | string) => [...productKeys.all, 'related', category, String(id)] as const,
  infinite: (options: ListProductsOptions) => [...productKeys.all, 'infinite', options] as const,
  stock: () => [...productKeys.all, 'stock'] as const,
  categories: () => ['categories'] as const,
};
```

```
['products']                                  ← invalidate everything product-shaped
['products', 'list']                          ← every list page, every search
['products', 'list', { q: 'phone', page: 0 }] ← one page
['products', 'detail', '5']                   ← one product
```

`as const` keeps each level a literal tuple; `String(id)` makes `5` and `'5'`
the same entry, because a route param is always a string.

### What goes in a key

The **parameters of the request** — and nothing else.

```ts
// ✗ the whole product: the key changes whenever ANY field changes, including a live price
queryKey: ['related', product]

// ✗ the whole URL: ?edit=5 and ?flash=… become cache misses for the same list
queryKey: ['products', searchParams.toString()]

// ✓ exactly the filters that change the response
export function listOptionsFrom(searchParams: URLSearchParams): ListProductsOptions {
  const category = searchParams.get('category') ?? '';
  return {
    q: searchParams.get('q') ?? '',
    category: category === 'all' ? '' : category,   // two spellings of "no filter" → one entry
    ...parseSort((searchParams.get('sort') ?? '') as SortKey),
    page: Math.max(0, Number(searchParams.get('page') ?? '1') - 1),
    limit: env.pageSize,
  };
}
```

**Hand-written keys drift.** One file says `['product', id]`, another
`['products', id]`, and you have two entries, two requests and an
invalidation that misses one. The factory is the only reason
`invalidateQueries({ queryKey: productKeys.all })` can be trusted.

📖 [Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) ·
[Query functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)

---

## 5. `staleTime`, `gcTime` and the refetch triggers

An entry moves through four states:

```
fetching ──▶ fresh ──(staleTime elapses)──▶ stale
                                              │
   last observer unmounts ──▶ inactive ──(gcTime elapses)──▶ gone
```

| | Controls | Default | Measured from |
|---|---|---|---|
| **`staleTime`** | whether a refetch *may* happen | `0` | the last successful fetch |
| **`gcTime`** | how long an **inactive** entry is kept | 5 min | the last observer leaving |

Stale does not mean gone. A stale entry renders instantly from the cache and a
refetch runs *underneath* — that quiet correction is what makes a cached app
feel fast. Pick `staleTime` per query from how fast the data really changes:

| Data | Changes | `staleTime` |
|---|---|---|
| Category list | quarterly | `Infinity` |
| Product details | daily | 30 s (the client default) |
| "More in this category" | daily | 5 min |
| Stock levels | constantly | 10 s, and polled |

### The triggers

A refetch happens when one of these fires **and the entry is stale**:

| Trigger | Option | Default |
|---|---|---|
| A new observer mounts | `refetchOnMount` | `true` |
| The window regains focus | `refetchOnWindowFocus` | `true` |
| The network reconnects | `refetchOnReconnect` | `true` |
| A timer | `refetchInterval` | off |
| `invalidateQueries` | — | always; it marks the entry stale first |

With the default `staleTime: 0` all of them fire every time — safe and chatty.
Raising `staleTime` is the single highest-impact change most teams make; it
is why `Infinity` on the categories query turns "fetched on every keystroke"
into "fetched once per page load". The trigger that surprises people is
window focus: switch tabs, come back, and every stale query on screen
refetches. Right for a dashboard; for a form over a cached record, turn it off
on *that* query, not globally.

📖 [Caching](https://tanstack.com/query/latest/docs/framework/react/guides/caching) ·
[Window focus refetching](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching)

**→ In the demos:** Demo 19, Lab 1 — watch an entry go fresh → stale →
inactive → gone in the devtools.

---

## 6. `status`, `fetchStatus` and the four UI states

`useQuery` reports two independent axes, and conflating them is the commonest
rendering bug:

| `status` | Means | | `fetchStatus` | Means |
|---|---|---|---|---|
| `'pending'` | no data yet | | `'fetching'` | a request is in flight |
| `'error'` | the last attempt failed, no data | | `'paused'` | wants to fetch but is offline |
| `'success'` | there is data | | `'idle'` | nothing happening |

They combine. `success` + `fetching` is a background refetch — you have data
*and* a request. `pending` + `paused` is a first load with no network
(`networkMode: 'online'`, the default). The shortcuts:

```
isPending   = status === 'pending'
isError     = status === 'error'
isFetching  = fetchStatus === 'fetching'
isLoading   = isPending && isFetching        // the FIRST load, specifically
```

Which gives the four UI states from
[Module 8 §7](../08-state-structure/#7-choosing-the-state-structure-five-principles),
plus the one a hand-rolled hook could never show:

```tsx
const { data, isPending, isError, error, isFetching } = useQuery(productListQuery(searchParams));

if (isPending) return <GridSkeleton />;                              // 1. loading
if (isError) return <ErrorNotice error={ApiError.from(error)} />;    // 2. error
if (data.products.length === 0) return <EmptyState />;              // 3. empty — YOUR test, not the library's
return (
  <>
    {isFetching && <RefreshingBadge />}                               // 5. refreshing, over real data
    <ProductGrid products={data.products} />                          // 4. success
  </>
);
```

**Use `isPending` for skeletons, never `isFetching`.** A skeleton on
`isFetching` blanks the screen on every background refetch — the exact flicker
the cache exists to remove.

📖 [Background fetching indicators](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators) ·
[Network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)

---

## 7. Dependent queries, `enabled` and `useQueries`

A query that must wait for something — a user id, a selected row — is turned
off with `enabled`; its `status` stays `'pending'` with `fetchStatus: 'idle'`
until it is on. v5's `skipToken` is the typed form, so the function body
never sees an `undefined`:

```ts
import { skipToken } from '@tanstack/react-query';

const { data: user } = useQuery(currentUserQuery());

const { data: carts } = useQuery({
  queryKey: cartKeys.forUser(user?.id ?? 0),
  queryFn: user ? ({ signal }) => listCartsForUser(user.id, { signal }) : skipToken,
});
```

A dependent query is a **waterfall** by definition — the second request cannot
start until the first returns. Fine for two; a problem for five. Where the
server can answer both in one call, ask it to.

### `useQueries`

N queries whose count is only known at runtime — one detail per wishlisted id
— cannot be N `useQuery` calls (Rules of Hooks). `useQueries` takes an array
and runs them in parallel:

```ts
const saved = useWishlistStore((s) => s.ids);

const { products, isPending } = useQueries({
  queries: saved.map((id) => productQuery(id)),
  combine: (results) => ({
    products: results.flatMap((r) => (r.data ? [r.data] : [])),
    isPending: results.some((r) => r.isPending),
  }),
});
```

`combine` collapses the array into one structurally-shared value, so the
component re-renders only when the combined result changes. Each id is still
its own entry — open one of those products and the detail page finds it
already cached.

📖 [Dependent queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries) ·
[Parallel queries](https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries) ·
[`useQueries`](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries)

---

## 8. `placeholderData` and `initialData`

Two ways to show something before the fetch returns, with opposite semantics:

| | `placeholderData` | `initialData` |
|---|---|---|
| Written to the cache? | **no** — observer-level | **yes** — it *is* the entry |
| `status` while showing it | `'success'`, with `isPlaceholderData: true` | `'success'` |
| Treated as fresh? | never — a fetch always runs | yes, for `staleTime` from `initialDataUpdatedAt` |
| Use for | a shape to render into; the *previous* page while the next loads | data you already have and trust |

**`keepPreviousData`** is the pagination case. Click page 2 and, without it,
the key changes, the entry is new, and the grid becomes a skeleton for 200 ms:

```ts
import { keepPreviousData } from '@tanstack/react-query';

useQuery({ ...productListQuery(searchParams), placeholderData: keepPreviousData });
```

Page 1 stays on screen with `isPlaceholderData: true` until page 2 lands. Dim
the grid on it; do not hide it.

**`initialData` from a loader** is the demo's product page: the loader has
already blocked on the data, so the component seeds the entry and the type
narrows from `Product | undefined` to `Product`:

```ts
const loaded = useLoaderData<typeof productDetailLoader>();
const { data: product } = useQuery({ ...productQuery(productId), initialData: loaded });
```

Seed `initialData` from another entry (a list row for a detail page) only with
`initialDataUpdatedAt` set from that entry's `dataUpdatedAt` — otherwise a
thirty-second-old row counts as fetched *now* and is fresh for another thirty
seconds. And if the row lacks fields the page needs (`reviews`, `sku`),
`placeholderData` is the right tool, because it still fetches.

📖 [Placeholder query data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data) ·
[Initial query data](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data) ·
[Paginated queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)

---

## 9. Mutations and invalidation

A mutation is not a query. It has no key, is never cached and never runs on
its own. What it has is a **lifecycle**, and that is where cache maintenance
belongs:

```ts
// src/hooks/useProductMutations.ts
export function useDeleteProduct() {
  const queryClient = useQueryClient();   // the provided one — survives a test handing in a fresh client

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
    // The broadest prefix that is TRUE: list, detail, related and "show all" all hang off ['products'].
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
```

```tsx
const deleteProduct = useDeleteProduct();
const deletingId = deleteProduct.isPending ? String(deleteProduct.variables) : null;  // per-row pending

deleteProduct.mutate(id, {
  onSuccess: () => notify(pushToast(`“${title}” deleted.`)),
  onError: (error) => notify(pushToast(ApiError.from(error).message, 'danger')),
});
```

**What invalidation does.** `invalidateQueries` marks every matching entry
stale and **refetches the ones with observers right now**. Entries nobody is
watching are merely marked, and refetch when somebody next looks. You never
work out what to refetch — the library knows what is mounted, which is the
thing Module 13 §9 said a hand-rolled hook can never know. The per-screen
rules from the mutations demo (update the list in state, keep the server id,
remove the row, re-sort, refetch when unsure) become two: invalidate the
broadest key you can justify, and trust the server's response for anything
shown immediately.

| | |
|---|---|
| `mutate` vs `mutateAsync` | `mutate` returns `void` and never throws — errors go to `onError`. `mutateAsync` returns a promise you must `catch`. Prefer `mutate`. |
| Hook vs per-call callbacks | Per-call `onSuccess` does **not** run if the component unmounted mid-flight. Cache work in the hook; toasts in the call. |
| `invalidateQueries()` with no arguments | Matches every query in the cache. Occasionally right (after login); usually hiding a wrong key. |
| One argument to `mutationFn` | Two things go in one object — `mutate({ id, patch })` — and that type flows into `variables` and every callback. |
| Mutations do not retry | A POST that timed out may have succeeded. `mutations: { retry: false }`. |

### Forms still post to actions

Not every write is a mutation. A form with five fields, validation beside them,
a `redirect()` that closes the modal and a flash message is a router `<Form>`
+ action (Module 14). Rebuilding that on `useMutation` means re-implementing
`errors`, `values` and the redirect to gain one thing — which costs one line,
because the client is a module:

```ts
const saved = intent === 'update' ? await updateProduct(id, payload) : await createProduct(payload);
await queryClient.invalidateQueries({ queryKey: productKeys.all });   // the bridge — and AWAIT it
return redirect(`/products?flash=${encodeURIComponent(`“${saved.title}” saved`)}`);
```

Without the `await`, the redirect's loader reads the cache before the entries
are marked stale and you land on the data you just changed. **The rule: forms
post to actions; buttons call mutations; everything that reads goes through
the cache.**

📖 [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) ·
[Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) ·
[Invalidations from mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations) ·
[`useMutation`](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)

**→ In the demos:** Demo 19, Lab 3 — `useDeleteProduct`, and the one-line
bridge in `productsAction`.

---

## 10. Optimistic updates: through the cache, or through `useOptimistic`

Module 13 §10 showed the shape. Here is why each line is there, in the demo's
delete:

```ts
interface DeleteContext {
  snapshots: [readonly unknown[], ProductListResponse][];
}

useMutation({
  mutationFn: (id: number | string) => deleteProduct(id),

  onMutate: async (id) => {
    // 1. A refetch already in flight would land AFTER our edit and overwrite it.
    await queryClient.cancelQueries({ queryKey: productKeys.lists() });
    // 2. Snapshot — plural: page 1, page 2 and a search may all be cached.
    const snapshots = queryClient.getQueriesData<ProductListResponse>({ queryKey: productKeys.lists() });
    // 3. Apply the guess to every list entry, immutably.
    queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
      old ? { ...old, products: old.products.filter((p) => String(p.id) !== String(id)), total: old.total - 1 } : old,
    );
    // 4. Whatever onMutate returns arrives as `context` in onError and onSettled.
    return { snapshots: snapshots.filter((pair): pair is [readonly unknown[], ProductListResponse] => pair[1] !== undefined) };
  },

  onError: (_error, _id, context: DeleteContext | undefined) => {
    for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
  },

  onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
});
```

| Callback | Runs | One job |
|---|---|---|
| `onMutate` | before the request | cancel, snapshot, write the guess |
| `onError` | it failed | put the snapshot back |
| `onSettled` | either way | invalidate — the server has the last word |

Three traps, each a line above: skip `cancelQueries` and the row vanishes and
returns *with no error*, because an older refetch answered last; snapshot
*after* writing and you roll back to the thing you were undoing; and
`setQueryData(key, undefined)` **removes** the entry rather than restoring it,
which is what the type-guard filter prevents.

### Versus `useOptimistic`

React 19's `useOptimistic` ([Module 10 §12](../10-forms/#12-useoptimistic))
solves the same problem one level up, inside a transition or Action:

```tsx
const [optimisticProducts, removeOptimistically] = useOptimistic(
  products,
  (current, id: number) => current.filter((p) => p.id !== id),
);

function handleDelete(id: number) {
  startTransition(async () => {
    removeOptimistically(id);          // shown while the transition is pending
    await deleteProduct(id);           // throws → React discards the optimistic value
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  });
}
```

| | Through the cache (`onMutate`) | `useOptimistic` |
|---|---|---|
| Scope of the guess | every subscriber of every key you touch | this component's render |
| Rollback | you restore the snapshot | automatic |
| Needs | the cache to own the data | a pending Action or transition |
| Right when | several screens show the data | one list, one screen |

Be optimistic where intent is unambiguous and failure is rare and reversible —
deletes, toggles, likes. Be patient about creates, which need an id the server
has not issued yet. And make the failure visible: a row that silently comes
back is worse than one that never left.

📖 [Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) ·
[react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic)

**→ In the demos:** Demo 19, Lab 4 — the optimistic delete, beside Demo 14's
fetcher version for comparison.

---

## 11. Infinite queries and pagination

Pagination with a `Pager` is a `useQuery` whose key contains the page
([§8](#8-placeholderdata-and-initialdata) keeps the previous page on screen).
Infinite scrolling is a different data shape — **one entry holding an array
of pages**:

```ts
import { infiniteQueryOptions } from '@tanstack/react-query';

export function productsInfiniteQuery(searchParams: URLSearchParams) {
  const options = listOptionsFrom(searchParams);
  const limit = options.limit ?? env.pageSize;

  return infiniteQueryOptions({
    queryKey: productKeys.infinite({ ...options, page: 0 }),     // the pages ARE the data: no ?page= in the key
    queryFn: ({ pageParam, signal }) => listProducts({ ...options, page: pageParam / limit, signal }),
    initialPageParam: 0,                                         // skip=0
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.skip + lastPage.products.length;
      return loaded < lastPage.total ? loaded : undefined;       // undefined ⇒ hasNextPage === false
    },
  });
}
```

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
  useInfiniteQuery(productsInfiniteQuery(searchParams));

const sentinelRef = useRef<HTMLDivElement>(null);
const sentinelVisible = useIntersection(sentinelRef, { enabled: hasNextPage });

useEffect(() => {
  if (sentinelVisible && hasNextPage && !isFetchingNextPage) void fetchNextPage();
}, [sentinelVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

const products = data?.pages.flatMap((page) => page.products) ?? [];
```

`pageParam` is whatever you decide — a cursor, a page number, here DummyJSON's
`skip`. `getNextPageParam` returns the next one or **`undefined` to mean the
end**; `0` and `null` are *values*, and returning them gives a list that
fetches forever. `data.pages` is oldest-first, and because it is one entry,
leaving and coming back restores every page you had loaded.

The `!isFetchingNextPage` guard matters: the sentinel is still on screen while
the new page renders, so without it the effect fires again and you get four
identical requests. `IntersectionObserver` rather than a scroll listener,
because the browser tells you, off the main thread, only when the answer
changes; and a real "Load more" button stays, because a keyboard user never
scrolls anything into view.

Two costs to say out loud. A paged view and an endless view of the same list
are **two cache entries**, by design. And ten pages is 120 mounted cards —
Module 15 — Performance's virtualiser exists for this; `maxPages` caps how
many pages the entry keeps.

📖 [Infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) ·
[`useInfiniteQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery) ·
[MDN — `IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)

**→ In the demos:** Demo 19, Lab 5 — `EndlessGrid` and `useIntersection`.

---

## 12. Queries beside loaders: `ensureQueryData` and prefetching

Module 13 §12 said loaders remove the render-then-fetch waterfall. They do.
They also have **no memory**: a loader is a function the router calls before
every navigation, and the same product opened twice is fetched twice. The
tempting fix — delete the loader, `useQuery` in the page — throws away three
things the loader does: it blocks navigation until data exists, it throws to
the route's error boundary (the 404 page), and it runs in parallel with a lazy
route module.

**Loaders decide *when*; the cache decides *whether*.** The line where they
meet:

| Call | Returns | On a cache hit | On failure |
|---|---|---|---|
| `fetchQuery` | the data | fetches anyway if stale | throws |
| `ensureQueryData` | the data | **returns it, no request** | throws |
| `prefetchQuery` | `void` | returns immediately | **swallows** |

```ts
// src/routes/ProductDetailPage.tsx
export async function productDetailLoader({ params }: LoaderFunctionArgs) {
  const productId = params.productId ?? '';
  try {
    return await queryClient.ensureQueryData(productQuery(productId));
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      throw data({ message: `No product with id ${productId}.` }, { status: 404, statusText: 'Not Found' });
    }
    throw error;
  }
}

export function ProductDetailPage() {
  const loaded = useLoaderData<typeof productDetailLoader>();
  const { productId = '' } = useParams();
  const { data: product } = useQuery({ ...productQuery(productId), initialData: loaded });
  // …
}
```

Why the page still reads through `useQuery`: `useLoaderData` only changes when
the router navigates. `useQuery` **subscribes** the page to the cache, so an
invalidation after an edit, a rollback, or a price pushed in over a socket all
reach the screen with no further wiring.

Notice what is *not* forwarded: `request.signal`. The router aborts that on
navigation, and a query aborted by somebody else leaves a rejected entry for
the next visitor to inherit. The query's own signal already aborts when its
last observer leaves.

The list loader does the same with two `ensureQueryData` calls in one
`Promise.allSettled`; the categories one, at `staleTime: Infinity`, is a cache
hit on every navigation after the first. `ensureQueryData` also accepts
`revalidateIfStale: true` — return the cached value immediately *and* refetch
in the background if it is stale, so the loader stays instant and the data
still corrects itself.

**Prefetching on intent.** `prefetchQuery` is for data the route would *like*,
not data it needs — it never throws, so it cannot sink a navigation, which
also means it cannot report a failure:

```tsx
<Card onMouseEnter={() => queryClient.prefetchQuery(productQuery(product.id))}>
```

Hover a card for half a second and the detail page opens with no request at
all. This is the loader + query pattern every data router converges on: the
route sequences, the cache remembers.

📖 [Prefetching & router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching) ·
[React Router — Data loading](https://reactrouter.com/start/data/data-loading)

**→ In the demos:** Demo 19, Lab 2 — both loaders converted; the hover
prefetch is the challenge.

---

## 13. `useSuspenseQuery`

Module 13 §11 introduced `use` and Suspense: the loading state moves out of
the component into a boundary. `useSuspenseQuery` is the same query in that
model:

```tsx
function ProductReviews({ id }: { id: number }) {
  const { data: product } = useSuspenseQuery(productQuery(id));   // data: Product — never undefined
  return <ReviewList reviews={product.reviews ?? []} />;
}

<Suspense fallback={<ReviewsSkeleton />}>
  <ProductReviews id={product.id} />
</Suspense>
```

| | `useQuery` | `useSuspenseQuery` |
|---|---|---|
| `data` type | `T \| undefined` | `T` |
| Loading | `isPending` branch in the component | the nearest `<Suspense>` |
| Errors | `isError` branch | thrown to the nearest error boundary |
| `enabled`, `placeholderData` | available | **not** available — a suspending query cannot be "off" |

The trap is the **waterfall**: two `useSuspenseQuery` calls in one component
suspend one after the other, because the second line never runs until the
first resolves. Use `useSuspenseQueries` for parallel, or prefetch both in the
loader so neither suspends — the same discipline as Module 19 — Server
Components, where every `await` is a sequencing decision.

Under React Router the loader is usually the better boundary: it already
blocks, catches, and works with the cache. `useSuspenseQuery` earns its place
for data *below* the route — a tab, a panel — that should not block the page.

📖 [Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) ·
[`useSuspenseQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery) ·
[react.dev — `Suspense`](https://react.dev/reference/react/Suspense)

---

## 14. Errors: `throwOnError` and boundaries

By default a query's failure is a *value* — `isError`, `error` — rendered
inline. Sometimes it should be an *exception*, caught by an error boundary
(Module 16 — Advanced Patterns, Error Boundaries & Portals) so the whole
panel is replaced:

```tsx
useQuery({
  ...productQuery(id),
  throwOnError: (error) => ApiError.from(error).status >= 500,   // server faults → boundary; 404s → inline
});
```

The predicate form is the useful one: expected failures stay in the component,
where you can render a specific message; unexpected ones go up. A boundary
that can **retry** must reset the cache entry as well as its own state, or the
retry re-throws the cached error:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => (
      <ErrorNotice action={<Button onClick={resetErrorBoundary}>Try again</Button>} />
    )}>
      <ProductReviews id={id} />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

**Typing the error.** `error` is `unknown` on every query. Since the API layer
guarantees every rejection is an `ApiError`, you can tell TanStack Query so
once, globally — and then `error.isNotFound` type-checks without `ApiError.from`:

```ts
declare module '@tanstack/react-query' {
  interface Register { defaultError: ApiError }
}
```

Only do this if the interceptor really converts every failure. A lie in a type
declaration is worse than `unknown`.

📖 [`QueryErrorResetBoundary`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryErrorResetBoundary) ·
[TypeScript — registering a global error](https://tanstack.com/query/latest/docs/framework/react/typescript) ·
[react.dev — error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

## 15. Devtools

The devtools are the reason the cache is not magic. Mount them in development
only, lazily, so the production bundle never contains them:

```tsx
const Devtools = lazy(async () => {
  const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
  return { default: ReactQueryDevtools };
});

{import.meta.env.DEV && (
  <Suspense fallback={null}>
    <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
  </Suspense>
)}
```

`import.meta.env.DEV` is a compile-time constant, so in a build the condition
is `false`, the `import()` is unreachable, and the chunk is dropped.

| In the panel | Tells you |
|---|---|
| The key, as it really is | what to compare against your `invalidateQueries` argument when nothing refetches |
| Observers | how many components are subscribed; `0` means inactive and `gcTime` is counting |
| fresh / stale / fetching / inactive | which half of [§5](#5-staletime-gctime-and-the-refetch-triggers) the entry is in |
| **Invalidate** / **Reset** / **Remove** | reproduce a mutation's effect without a mutation |
| `dataUpdatedAt` | when the user was last told the truth |

The commonest "bug" the panel solves in seconds: a page shows a loading state
after a loader that was supposed to prevent it, because the loader's key and
the component's key differ by one character. Two entries side by side, and
the fix is `queryOptions()`.

📖 [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)

---

## 16. Testing queries

Three rules, each a line in a shared render helper:

```tsx
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, { client = createTestQueryClient(), route = '/' } = {}) {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return { user: userEvent.setup(), client, ...render(ui, { wrapper: Providers }) };
}
```

**A fresh client per test.** The §2 singleton would carry one test's cache
into the next. The hooks use `useQueryClient()`, so the client handed in
through the provider is the one they see — which is why the demo's hooks take
it from context rather than importing the singleton.

**`retry: false`.** With the client default of two retries, a test for the
error state waits through exponential backoff and times out. The default is
right for users and wrong for tests.

**`gcTime: 0`.** Nothing lingers between renders. (Under Jest the docs suggest
`Infinity` instead, so no timer outlives the test; under Vitest `0` is the
same hygiene.)

The network is MSW, as in Module 18 — Testing React Applications: a handler
per endpoint, overridden per test to drive the page through loading, results,
error and empty. Assert with `findBy*`, because a query resolves
asynchronously:

```tsx
test('shows the error state when the list fails', async () => {
  server.use(http.get('*/products', () => HttpResponse.json({ message: 'down' }, { status: 500 })));
  renderWithProviders(<ProductsPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/something broke/i);
});
```

Test the optimistic rollback the same way: fail the DELETE, assert the row is
gone and *comes back*. That is the one you cannot verify by watching.

📖 [Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)

---

## 17. Real-time 1 — polling

Everything so far refreshes because the user did something. Some data does
not wait: stock falls while the page is open. Polling is a timer the library
owns:

```ts
export function stockQuery() {
  return queryOptions({
    queryKey: productKeys.stock(),
    queryFn: ({ signal }) => listStock({ signal }),      // GET /products?limit=0&select=id,stock — ~4 kB
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,                  // the default; the line that makes polling defensible
  });
}
```

```tsx
export function LiveStockBadge({ productId }: { productId: number }) {
  const { data: stock, dataUpdatedAt } = useQuery({
    ...stockQuery(),
    select: (rows) => rows.find((row) => row.id === productId)?.stock,   // 194 rows in, one number out
  });

  if (stock === undefined) return null;
  return <Badge aria-live="polite">{stock} in stock · updated {formatTime(dataUpdatedAt)}</Badge>;
}
```

| What makes it affordable | Why |
|---|---|
| `refetchIntervalInBackground: false` | the timer stops while the tab is hidden; one catch-up runs on return |
| `staleTime` **shorter** than the interval | the timer fires on stale data; longer, and every tick is a no-op you will mistake for a bug |
| A small payload | `select=id,stock` is 4 kB; the full catalogue is 400 kB. Poll small things |
| `select` per consumer | the poll lands every 15 s; the badge re-renders only when *its* number changed |

The timer is shared: ten badges observe one entry and one interval.
`refetchInterval` also accepts a function of the query, which is how you poll
a job until it finishes — `(query) => query.state.data?.status === 'done' ?
false : 2_000`. And `dataUpdatedAt` is not decoration: live data nobody can
date is not believable.

📖 [`useQuery` — `refetchInterval`](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) ·
[MDN — `Document.visibilityState`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)

**→ In the demos:** Demo 19, Lab 6 A–B — `stockQuery` and `LiveStockBadge`.

---

## 18. Real-time 2 — push: SSE and WebSockets

Push when the server knows first and the news is rare. Two transports:

| | Server-Sent Events (`EventSource`) | WebSocket |
|---|---|---|
| Direction | server → client only | both ways |
| Protocol | plain HTTP, `text/event-stream` | its own, after an HTTP upgrade |
| Reconnection | **automatic**, with backoff and `Last-Event-ID` | yours to write |
| Message type | text | text or binary |
| Use for | tickers, notifications, progress | chat, collaborative editing, anything the client sends |

### SSE, into the cache

```ts
// src/hooks/usePriceTicker.ts
export type TickerStatus = 'off' | 'connecting' | 'live' | 'retrying';

export function usePriceTicker(): TickerStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TickerStatus>(import.meta.env.DEV ? 'connecting' : 'off');

  useEffect(() => {
    if (!import.meta.env.DEV) return;             // the mock endpoint only exists on the dev server

    const source = new EventSource('/__dev/prices');
    source.addEventListener('open', () => setStatus('live'));
    // 'error' fires on every drop. Do NOT close here — closing is how you turn reconnection OFF.
    source.addEventListener('error', () => setStatus(source.readyState === EventSource.CLOSED ? 'off' : 'retrying'));
    source.addEventListener('message', (event) => {
      const tick = parseTick(event.data);          // anything off a socket is unknown: parse, then narrow
      if (tick) applyPrice(tick);
    });

    function applyPrice(tick: PriceTick) {
      queryClient.setQueryData<Product>(productKeys.detail(tick.id), (old) => (old ? { ...old, price: tick.price } : old));
      queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
        old ? { ...old, products: old.products.map((p) => (p.id === tick.id ? { ...p, price: tick.price } : p)) : old,
      );
    }

    return () => source.close();                   // the cleanup IS the hook (Module 12 §4)
  }, [queryClient]);

  return status;
}
```

**A push writes to the cache; it does not invalidate it.** The message already
carries the value, so `setQueryData` puts it where the cache would have put
it and every observer re-renders. `invalidateQueries` on every message turns
a push feed into a request storm — push converted back into polling, with
extra steps. The updaters also return `old` when there is no entry: the
ticker **updates** prices it already knows and never becomes the only source
of one. When the socket drops you lose freshness, not data.

Without the cleanup, Strict Mode opens a second connection, every navigation
opens another, and the server runs out of sockets. Mount a hook that owns a
connection in **exactly one** component.

> The demo's feed is a mock: DummyJSON has no push channel, so a ~20-line Vite
> dev-server plugin serves `/__dev/prices` and emits `data: {"id":3,"price":42.5}\n\n`
> every three seconds. It mocks the *transport*, not the client — a real
> publisher would send the same JSON and `usePriceTicker` would not change.

### WebSocket

The same effect shape — `new WebSocket(url)`, an `onmessage` handler, `close()`
in the cleanup — with one addition: reconnection is yours. Keep an `attempt`
counter, re-`connect()` from `onclose` after `Math.min(30_000, 1_000 *
2 ** attempt)`, and a `closed` flag so the cleanup's own `close()` does not
trigger a reconnect.

Two designs for what goes over the wire. **Payloads** (`{ id, price }`) are
written with `setQueryData`, as above. **Notifications** (`{ entity:
'product', id }`) say only *what changed*, and the client calls
`invalidateQueries({ queryKey: productKeys.detail(id) })` — one targeted
refetch, through the normal `queryFn`, with the normal types. Notifications
cannot drift from the REST shape and are the better default when events are
rare.

📖 [MDN — `EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) ·
[MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) ·
[MDN — `WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) ·
[Updates from mutation responses](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses)

**→ In the demos:** Demo 19, Lab 6 C — the mock feed plugin and
`usePriceTicker`.

---

## 19. `useSyncExternalStore` for an external ticker

Module 12 §14 introduced the hook; here is where it earns its place.

### A value the browser owns

```ts
// src/hooks/useOnlineStatus.ts — all three at MODULE scope: a new function per render re-subscribes every render
function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}
const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

The `useState` + `useEffect` version has a real bug: the first render shows
the initial value, the effect runs after paint, and anything that changed in
between is on screen wrong for a frame — and under concurrent rendering two
components can disagree mid-render ("tearing"). `useSyncExternalStore` reads
the value *during* render and keeps every reader consistent. `navigator.onLine`
is a hint, not a health check: captive portals and a dead API are both
"online".

### A ticker that should not go through the cache

Some data changes faster than you want to cache it — a price feed at ten
messages a second, a cursor, a progress stream. Writing each tick with
`setQueryData` re-renders every observer of that key, including ones that do
not care. Demo 13's state table calls this **ephemeral** state, and its home
is an external store read through a selector:

```ts
// src/lib/tickerStore.ts
let ticks: Readonly<Record<number, PriceTick>> = {};   // replaced immutably — getSnapshot must return a stable reference
const listeners = new Set<() => void>();

export const tickerStore = {
  push(tick: PriceTick) {
    ticks = { ...ticks, [tick.id]: tick };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  getSnapshot: () => ticks,
};

export function useLatestPrice(id: number): number | undefined {
  // Select INSIDE the hook: React compares the result with Object.is, so this
  // component re-renders only when ITS product's tick changes.
  return useSyncExternalStore(tickerStore.subscribe, () => tickerStore.getSnapshot()[id]?.price);
}
```

The `EventSource` from §18 then calls `tickerStore.push(tick)` instead of
`setQueryData`, and a `PriceTag` calling `useLatestPrice(product.id)` shows
the live number over the cached one. This is how Zustand is built
([Module 9 §17](../09-reducers-and-context/#17-when-to-reach-for-a-library));
you are writing the twelve lines of it you need.

The one rule: **`getSnapshot` must return the same reference when nothing
changed.** Return a fresh object each call and React detects an infinite
update loop and throws. Replace the store's state immutably; select inside
the hook.

📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) ·
[MDN — `Navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

**→ In the demos:** Demo 19, Lab 6 D — `useOnlineStatus` and `ConnectionBadge`.

---

## 20. When real-time is not worth it

Most screens need none of §17–§19. With `refetchOnWindowFocus` and
`refetchOnReconnect` on, a stale list corrects itself the moment the user
comes back to it, and that is "live enough" for a catalogue, a profile, an
order history. Reach further only when being N seconds behind has a cost the
user would notice.

| | Nothing extra | Poll | Push (SSE / WS) | `useSyncExternalStore` |
|---|---|---|---|---|
| Who starts it | the user (focus, navigation, mutation) | the client, on a timer | the server | nobody — you read a value |
| Latency | until the next interaction | up to the interval | immediate | immediate |
| Cost when nothing changes | nothing | a request per interval, per tab | one idle connection per tab | nothing |
| Server work | none | an endpoint | a publisher, connection limits, a proxy that allows long-lived HTTP | none |
| Use for | almost everything | stock, dashboards, job progress | prices, notifications, chat | browser APIs, high-frequency feeds |

Before adding a socket, ask: how many tabs will hold a connection open, what
the proxy does with a request that lasts an hour, what happens on reconnect,
and whether the data is really pushed or just polled server-side and relayed.
A WebSocket carrying one message a day is an open connection paid for every
second of that day; a 60-second poll of a 4 kB endpoint is cheaper and
simpler. **Start with the cache's defaults, measure how stale the user
actually sees, then add the smallest mechanism that closes the gap.**

### Where every kind of state lives

The decision table Demo 13 started, completed. Two questions, in order: does
somebody else own it, and must it survive this screen?

| Kind | Example in ShopScope | Lives in | Because |
|---|---|---|---|
| **URL** | `?q=`, `?category=`, `?page=`, `?view=` | `useSearchParams` | somebody may send the link; Back must undo it |
| **Server, needed to render a route** | the product page, page 1 of the list | a **loader** calling `ensureQueryData` | the route must not render without it |
| **Server, everything else** | related, categories, stock, prices | **TanStack Query** | you do not own it; it changes under you |
| **Global client** | wishlist, cart, theme | **Zustand** (persisted) | yours, and it outlives every page |
| **Form draft** | the product form | react-hook-form / an uncontrolled `<Form>` | invalid until submitted; nobody else may see it |
| **Local UI** | density, a pending delete, a disclosure | **`useState`** | one screen; dies with it |
| **Ephemeral** | a tick every 100 ms, a cursor | an external store via `useSyncExternalStore` | changes faster than you want to render |

Two rows are worth defending. The wishlist is *not* server state until there
is a `/wishlist` endpoint — nothing to be stale about, nothing to invalidate —
so it stays in Zustand. And `?view=endless` moved *into* the URL only once the
loader became a cache read: the cost that kept it out (a loader re-run meant a
request) disappeared, so the decision changed. These are trade-offs with
reasons attached; when a reason expires, revisit the decision.

---

## 21. Self-check

1. Finish the sentence: server state is a ______. Name the six questions a
   cache answers that a value does not.
2. "A query is a key, a function and a policy." Map each to `queryOptions()`.
3. Why is the `QueryClient` a module-scope singleton in ShopScope? Why would
   the same code be a security bug under SSR?
4. Why does the client's `retry` reuse `isRetryable`, and why must the
   services then *not* also use `withRetry`?
5. Give the key for: all product queries · every list page · one product.
   Which single `invalidateQueries` call matches all of them?
6. What should go in a key, and what should not? Give the two bad examples.
7. `staleTime` vs `gcTime`: what each measures, from when, the default of
   each, and a value for categories, a product, and stock.
8. List the five refetch triggers. Which one ignores `staleTime`?
9. Which `status` + `fetchStatus` combination is a background refetch? Which
   is a first load with no network? Why `isPending` for skeletons?
10. What does `enabled: false` do to `status`? What does `skipToken` add?
    When is `useQueries` the only option?
11. `placeholderData` vs `initialData`: which is written to the cache, which
    always fetches, and why `initialDataUpdatedAt` matters.
12. What exactly does `invalidateQueries` do to an entry with observers, and
    to one without?
13. Which writes stay on a router action, which become mutations, and what is
    the one-line bridge? Why must it be `await`ed?
14. Name the job of `onMutate`, `onError` and `onSettled`. Why is
    `cancelQueries` the first line, and what bug appears without it?
15. Optimistic through the cache vs `useOptimistic`: the scope and rollback of
    each, and a case for each.
16. What shape is `useInfiniteQuery`'s `data`? What must `getNextPageParam`
    return at the end, and what happens if it returns `0`?
17. `fetchQuery` vs `ensureQueryData` vs `prefetchQuery` — returns, cache hit,
    failure. Which belongs in a loader, which on hover?
18. Why does the product page read through `useQuery` even though the loader
    has the data? Why is `request.signal` no longer forwarded?
19. What can `useSuspenseQuery` not do that `useQuery` can? Describe the
    two-queries-one-component waterfall and its fix.
20. What does `throwOnError`'s predicate form let you do? Why does a retry
    button need `QueryErrorResetBoundary`?
21. Three settings on a test `QueryClient`, and the reason for each.
22. Four things that make polling affordable. What happens when
    `refetchInterval` is shorter than `staleTime`?
23. Why does a push write with `setQueryData` rather than `invalidateQueries`?
    When is a *notification* over the socket better than a payload?
24. Why must the `EventSource` not be closed in its `error` handler? What goes
    wrong without the effect's cleanup?
25. What does `useSyncExternalStore` fix that `useState` + `useEffect` cannot?
    What must `getSnapshot` guarantee, and why select inside the hook?
26. Walk the real-time table for: a product list · stock on a detail page · a
    chat · an upload progress bar · a price feed at 10 Hz.
27. Place each in the state table: `?view=` · the wishlist · a pending delete
    id · the category list · a form draft · a cursor position.

### Practical

1. Convert a `useFetch` component to `useQuery` with a key from a factory,
   set `staleTime` on purpose, and watch the entry go fresh → stale →
   inactive → gone in the devtools.
2. Put `ensureQueryData` into an existing loader and read it back with
   `useQuery` + `initialData`. Prove Back is instant with an empty network
   tab, then delete the loader and list what broke.
3. Write a mutation with `invalidateQueries`, then bridge a router action to
   the cache with one awaited line. Remove the `await` and reproduce the race.
4. Make the delete optimistic. Force the server to fail and watch the
   rollback; remove `cancelQueries` and reproduce the silent reappearance.
5. Build "load more" with `useInfiniteQuery` and an `IntersectionObserver`
   hook, with a real button for keyboard users.
6. Poll a small endpoint with the tab hidden and visible; confirm the timer
   stops. Then push the same field over `EventSource` into the cache, and
   finally into a module-scope store read with `useSyncExternalStore`. Write
   down which you would ship and why.
7. Write tests that drive the list page through loading, results, error and
   empty against MSW with a fresh client per test — and one that proves the
   optimistic rollback.

---

## 22. References

**React (react.dev)**
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`Suspense`](https://react.dev/reference/react/Suspense) · [`use`](https://react.dev/reference/react/use)
- [`useEffect`](https://react.dev/reference/react/useEffect)
- [Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [What are good alternatives to data fetching in Effects?](https://react.dev/learn/synchronizing-with-effects#what-are-good-alternatives-to-data-fetching-in-effects)

**TanStack Query — guides**
- [Overview](https://tanstack.com/query/latest/docs/framework/react/overview) · [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries) · [Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) · [Query functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions) · [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [Caching](https://tanstack.com/query/latest/docs/framework/react/guides/caching) · [Window focus refetching](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching) · [Network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) · [Background fetching indicators](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators)
- [Dependent queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries) · [Parallel queries](https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries)
- [Placeholder query data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data) · [Initial query data](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data)
- [Paginated queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries) · [Infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) · [Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) · [Invalidations from mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations) · [Updates from mutation responses](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses)
- [Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Prefetching & router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) · [Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [TypeScript](https://tanstack.com/query/latest/docs/framework/react/typescript) · [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)

**TanStack Query — reference**
- [`QueryClient`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient) · [`QueryClientProvider`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider)
- [`useQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) · [`useQueries`](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) · [`useSuspenseQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery)
- [`useMutation`](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation) · [`useInfiniteQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery)
- [`QueryErrorResetBoundary`](https://tanstack.com/query/latest/docs/framework/react/reference/QueryErrorResetBoundary)

**React Router**
- [Data loading](https://reactrouter.com/start/data/data-loading) · [Actions](https://reactrouter.com/start/data/actions)

**Browser APIs (MDN)**
- [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) · [Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
- [`Navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) · [`Document.visibilityState`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)

---

**Previous:** [Module 13 — Data Fetching & Custom Hooks](../13-data-fetching-and-custom-hooks/)
**Related:** Module 14 — Routing & Application Architecture · Module 21 — The API Layer
