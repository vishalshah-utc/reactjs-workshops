# ShopScope — Demo 24b starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**
Prefer to read the finished code rather than build it? [`../WALKTHROUGH.md`](../WALKTHROUGH.md).

## Where you are starting from

**ShopScope as Demo 14 left it** — the finished SPA, marker-free: auth with a
refresh queue, React Router 8 data mode, a layered axios API module with one
`ApiError`, validated env, `requireRole('admin')` middleware, lazy routes, an
optimistic delete, and **two Zustand stores** holding the cart and the wishlist.

Those two stay. Nothing today deletes them, and the guide makes the point that
two state libraries can live in one app — which is what a real migration looks
like for the eighteen months it takes.

What is missing is the **Inventory Console** at `/account/inventory`: an
admin-only screen, deliberately *not* built on route loaders, so the store has
to own the async and you can see what that costs.

**Already written, so you only write the interesting part:**

- `src/lib/errorInfo.ts` — `ApiErrorInfo` and `toErrorInfo()`, the serialisable
  projection of `ApiError` that Lab 2 needs.
- `src/lib/concurrency.ts` — `mapWithConcurrency()`, bounded parallelism with a
  result per item, for Lab 5.
- `src/store/session.ts` — the one-line `createAction('session/signedOut')`.
- `src/routes/account/inventoryLoader.ts` — the category list, still a route
  loader, on purpose.
- `src/components/ErrorNotice.tsx` — its prop widened to a structural
  `DisplayableError`, so the class *and* the store's plain object both satisfy it.
- `src/api/services/products.ts` — `sortBy` widened to include `'stock'`
  (DummyJSON sorts on it), and a dev-only `delayMs` that appends `?delay=`.
- The toolbar's **Simulated latency** select (none / 2 s / 4 s), behind
  `import.meta.env.DEV`. Every "now make it slow" step in the guide uses it.

**New dependencies:** `@reduxjs/toolkit@2.12.0` and `react-redux@9.3.0`, plus
`vitest@5.0.1` and `jsdom@30.1.0` for Lab 7. `zustand@5.0.15` stays.

## What you build

Search for `TODO(lab-` — **thirty markers**.

| Marker | File | What |
|---|---|---|
| `lab-1.1` | `src/store/filters.ts` | `createSlice` — reducers, a `prepare` callback, slice selectors |
| `lab-1.2` | `src/store/index.ts` | `configureStore`, `RootState`, `AppDispatch` |
| `lab-1.3` | `src/store/hooks.ts` | typed `useAppSelector` / `useAppDispatch` / `useAppStore` |
| `lab-1.4` | `src/main.tsx` | `<Provider store={store}>`, above the router |
| `lab-1.5` | `src/components/inventory/InventoryToolbar.tsx` | read with a selector, write with an action, debounce the draft |
| `lab-2.1` | `src/store/extra.ts`, `src/store/createAppAsyncThunk.ts` | the `extra` argument and the pre-typed thunk creator |
| `lab-2.2` | `src/store/inventory.ts` | `loadInventory` — `signal`, `rejectWithValue`, `condition` |
| `lab-2.3` | `src/store/inventory.ts` | `extraReducers` — the status machine, latest-wins, `isAnyOf` |
| `lab-2.4` | `src/store/index.ts` | `thunk.extraArgument`, and the serializability check |
| `lab-2.5` | `src/routes/account/InventoryPage.tsx` | dispatch on filter change, abort on cleanup |
| `lab-3.1` | `src/store/inventory.ts` | `createEntityAdapter` and the normalised initial state |
| `lab-3.2` | `src/store/inventory.ts` | `createSelector`, derived values, selector factories |
| `lab-3.3` | `src/components/inventory/InventoryTable.tsx` | ids in, one subscription per row |
| `lab-3.4` | `src/routes/account/InventoryPage.tsx` | the four branches of the status machine |
| `lab-4.1` | `src/store/inventory.ts` | `saveStock` |
| `lab-4.2` | `src/store/inventory.ts` | optimistic write, confirm with the server's whole answer, roll back |
| `lab-4.3` | `src/components/inventory/StockCell.tsx` | the cell: per-row spinner, per-row error |
| `lab-5.1` | `src/store/recent.ts` | the slice, the version, and the v1 → v2 migration |
| `lab-5.2` | `src/store/listeners.ts` | bulk restock — `cancelActiveListeners`, `fork`, concurrency, partial failure |
| `lab-5.3` | `src/store/listeners.ts` | undo, and the persistence listener |
| `lab-5.4` | `src/store/inventory.ts`, `src/store/recent.ts`, `src/routes/RootLayout.tsx` | one action, several slices |
| `lab-5.5` | `src/components/inventory/BulkBar.tsx` | select, restock, progress, honest failures, undo |
| `lab-5.6` | `src/components/inventory/RecentlyInspected.tsx` | the persisted strip |
| `lab-6.1` | `src/api/baseQuery.ts` | a custom `baseQuery` over the existing axios client |
| `lab-6.2` | `src/api/inventoryApi.ts` | `createApi` — endpoints, `transformResponse`, `providesTags` |
| `lab-6.3` | `src/api/inventoryApi.ts` | `onQueryStarted` optimistic update, and `invalidatesTags` |
| `lab-6.4` | `src/store/index.ts` | the api reducer, its middleware, `setupListeners` |
| `lab-6.5` | `src/routes/account/InventoryQueryPage.tsx` | the generated hooks, and `selectFromResult` |
| `lab-7.1` | `src/store/index.ts` | the `devTools` options — and `false` in production |
| `lab-7.2` | `src/store/inventory.test.ts` | reducers, thunks and selectors, with no React |

## Finished version

[`../solution`](../solution) — everything above, done, with no markers.

This demo is **not** a link in the chain: nothing follows it, and it writes no
"next starter". Its companions are [`../../24a-advanced-zustand`](../../24a-advanced-zustand)
(the same console in Zustand) and
[`../../24c-redux-observable-and-rxjs`](../../24c-redux-observable-and-rxjs),
which takes the solution as *its* starter.

## Before you start

Install the **Redux DevTools** browser extension. Half of this demo is watched
rather than read. Then sign in as `emilys` / `emilyspass` — the console is
admin-only.

Reads are real. DummyJSON **simulates** writes: a `PATCH` returns a correct
response and persists nothing.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build · npm run preview · npm test
```

Node 22.22+.
