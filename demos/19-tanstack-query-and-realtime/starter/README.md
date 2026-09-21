# ShopScope — Demo 19 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 18, finished** — ShopScope, measured and then fixed.

- **Measurement, kept.** `src/lib/slowMode.ts` is a dev instrument: the
  toolbar's "Slow mode" switch (behind `import.meta.env.DEV`) makes every
  `ProductCard` cost ~4.5 ms instead of ~0.05 ms.
  `src/components/RenderProfiler.tsx` wraps a subtree in React's `<Profiler>`
  and logs every commit through `src/config/logger.ts`; it is on the grid, the
  virtual list and the toast viewport. Both are permanent — Demo 19 uses them
  to prove that a cache hit costs no render.
- **Structure before memoisation.** The search draft lives in `ProductToolbar`.
  `ProductsSurface` owns the price-chart disclosure and receives the header
  actions, the toolbar and the grid as props.
- **Concurrent features.** `useDeferredValue` on the client-side quick filter,
  `useTransition` on the tab switch and the density toggle.
- **Lists and the bundle.** `ProductRowList` virtualises all 194 products.
  `npm run build:analyze` writes `dist/stats.html`; `npm run check:bundle`
  fails when any JavaScript asset goes over its budget.
- **The React Compiler is ON**, wired in `vite.config.ts` through a fifteen-line
  Vite plugin over `babel-plugin-react-compiler`. Do not hand-write `memo` /
  `useMemo` / `useCallback` today unless the Profiler asks you to.

And it still fetches everything twice. Open a product, press Back, open it
again: the loader runs a second time and the network tab shows two identical
requests. Every list request, every category request, every "more in this
category" request — each navigation starts from nothing, because **loaders
fetch and they do not remember**.

**Already here, so you only write the interesting part:** `listStock()` in
`src/api/services/products.ts` (the small `select=id,stock` request Lab 6
polls), `formatTime()` in `src/lib/format.ts`, and the `StockLevel` / `PriceTick`
types in `src/types.ts`. `<ConnectionBadge />` is already placed in
`SiteHeader` and `<LiveStockBadge />` on the detail page — both render `null`
until you fill them in.

New dependencies: **none today** — `@tanstack/react-query@5.103.1` and
`@tanstack/react-query-devtools@5.103.1` arrived with the Part 6 set in Demo 15
and are already installed. Today is the first time either is imported.

## What you build

Search for `TODO(lab-` — twenty-three markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/lib/queryClient.ts` — the module-scope client: `staleTime`, `gcTime`, `retry` over `isRetryable` |
| `lab-1.2` | `src/main.tsx` — `QueryClientProvider`, and the devtools lazily behind `import.meta.env.DEV` |
| `lab-1.3` | `src/api/queries.ts` — the key factory, `relatedQuery`, `everythingQuery` |
| `lab-1.4` | `src/components/RelatedProducts.tsx` — `useFetch` → `useQuery`, with the service's `signal` |
| `lab-1.5` | `src/components/ProductRowList.tsx` — the same conversion, and a disclosure that stops refetching |
| `lab-2.1` | `src/api/queries.ts` — `productQuery(id)` through `queryOptions()` |
| `lab-2.2` | `src/routes/ProductDetailPage.tsx` — `ensureQueryData` in the loader, `useQuery` in the page |
| `lab-2.3` | `src/api/queries.ts`, `src/routes/ProductsPage.tsx` — `productListQuery` + `categoriesQuery` in the loader; `withRetry` comes out |
| `lab-2.4` | `src/routes/ProductsPage.tsx` — the page reads the cache, not the loader's return value |
| `lab-3.1` | `src/hooks/useProductMutations.ts` — `useMutation` + `invalidateQueries` |
| `lab-3.2` | `src/routes/ProductsPage.tsx` — the delete fetcher becomes a mutation |
| `lab-3.3` | `src/routes/ProductsPage.tsx` — the action stays, and invalidates the cache itself |
| `lab-4.1` | `src/hooks/useProductMutations.ts` — `onMutate` snapshot → `onError` rollback → `onSettled` invalidate |
| `lab-4.2` | `src/routes/ProductsPage.tsx` — delete the hand-rolled optimistic filter |
| `lab-5.1` | `src/api/queries.ts` — `productsInfiniteQuery` and `getNextPageParam` |
| `lab-5.2` | `src/hooks/useIntersection.ts` — the `IntersectionObserver` hook |
| `lab-5.3` | `src/components/EndlessGrid.tsx` — `useInfiniteQuery`, a sentinel and a real button |
| `lab-5.4` | `src/routes/ProductsPage.tsx` — the Pages ⇄ Endless toggle |
| `lab-6.1` | `src/api/queries.ts` — `stockQuery`: `refetchInterval`, paused when the tab is hidden |
| `lab-6.2` | `src/components/LiveStockBadge.tsx` — the polled figure, and `select` as a performance tool |
| `lab-6.3` | `vite.config.ts`, `src/hooks/usePriceTicker.ts` — the **mock** SSE endpoint and `setQueryData` |
| `lab-6.4` | `src/hooks/useOnlineStatus.ts`, `src/components/ConnectionBadge.tsx` — `useSyncExternalStore` |
| `lab-7.1` | `src/routes/ProductsPage.tsx` — `?view=endless`, now that a loader re-run is a cache hit |

## Finished version

The next starter: [`../../20-testing/starter`](../../20-testing/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:analyze · npm run check:bundle · npm run preview · npm run lint · npm test
```

Node 22.22+.
