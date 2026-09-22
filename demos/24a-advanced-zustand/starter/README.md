# ShopScope — Demo 24a starter (Advanced Zustand)

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).** If you would rather
read the finished code than build it, [WALKTHROUGH.md](../WALKTHROUGH.md) tours
`solution/` and tells you what to click to watch each concept happen.

## Where you are starting from

**Demo 14, finished** — the shipped ShopScope: React Router 8 in data mode, an
axios layer with one `ApiError`, an auth interceptor with a refresh queue,
validated env, protected routes and roles, optimistic delete through a fetcher,
retries, lazy routes, and the two Zustand stores from Demo 13
(`src/store/cart.ts`, `src/store/wishlist.ts`).

Between them those two stores are 103 lines and hold no async at all. Today you
build the screen they have no answer for.

**Already here, so you only write the interesting part:**

- `/account/inventory` is wired in `src/router.tsx` behind
  `requireRole('admin')`, lazily loaded, with the **Inventory** link already in
  the account sidebar.
- `src/components/inventory/InventoryFilters.tsx` — the toolbar: debounced
  search, category, sort, order, a low-stock switch, and a dev-only **Simulated
  latency** control that makes Lab 2's race reproducible.
- `src/components/inventory/RecentlyInspected.tsx` — the persisted strip.
- `src/store/inventory/types.ts` — every slice interface, the `InventoryStore`
  intersection, and `LOW_STOCK`. The feature, described in types.
- `listProducts()` in `src/api/services/products.ts` has grown
  `sortBy: 'title' | 'stock'` and a dev-only `delayMs` that appends DummyJSON's
  `?delay=`.
- Vitest is configured (`vitest.config.ts`); both test files exist with their
  cases as `it.todo`, so `npm test` is green from the start.

The store itself is **inert**: every slice creator returns its initial state and
no-op actions, so the app runs and `/account/inventory` renders an empty table
with a notice saying so.

New dependency: **`immer@11.1.18`**, for the Zustand immer middleware. Nothing
else.

## What you build

Search for `TODO(lab-` — twenty-two markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/store/inventory/types.ts` — `InventoryMutators` + `SliceOf<T>`: the mutator tuple every slice needs |
| `lab-1.2` | `src/store/inventory/filtersSlice.ts` — the first slice, with named devtools actions |
| `lab-1.3` | `src/store/inventory/index.ts` — `devtools(persist(immer(subscribeWithSelector(…))))` |
| `lab-2.1` | `src/store/inventory/catalogueSlice.ts` — the status machine, `goToPage`, `retry` |
| `lab-2.2` | `src/store/inventory/catalogueSlice.ts` — `fetchPage`: `AbortController` + a monotonic request id |
| `lab-2.3` | `src/store/inventory/filtersSlice.ts` — a filter change always refetches page 0 |
| `lab-2.4` | `src/routes/account/InventoryPage.tsx` — skeleton / error / empty / table, driven by `status` |
| `lab-3.1` | `src/store/inventory/catalogueSlice.ts` — `upsertProduct` and `patchStock` through immer drafts |
| `lab-3.2` | `src/store/inventory/selectors.ts` — selector factories, a shared idle constant, a memoised visible list |
| `lab-3.3` | `src/components/inventory/InventoryTable.tsx` — one row, one subscription, `useShallow` |
| `lab-3.4` | `src/store/inventory/inventory.test.ts` — the store under test, with no React |
| `lab-4.1` | `src/store/inventory/editSlice.ts` — optimistic `commitStock` with snapshot and rollback |
| `lab-4.2` | `src/components/inventory/StockCell.tsx` — the inline editor, pending and per-row error |
| `lab-4.3` | `src/store/inventory/inventory.test.ts` — the rollback test |
| `lab-5.1` | `src/lib/concurrency.ts` — `mapWithConcurrency`, four at a time, every outcome reported |
| `lab-5.2` | `src/store/inventory/bulkSlice.ts` — selection, one snapshot, partial failure, undo |
| `lab-5.3` | `src/components/inventory/BulkBar.tsx` — the bar and the honest report |
| `lab-6.1` | `src/store/inventory/recentSlice.ts`, `src/store/inventory/index.ts` — the recent list, and the transient subscription |
| `lab-6.2` | `src/store/inventory/index.ts` — `persist`: `partialize`, `version`, `migrate`, `merge`, `onRehydrateStorage` |
| `lab-6.3` | `src/store/registry.ts`, `src/store/inventory/index.ts` — the reset registry, and why `replace` stays `false` |
| `lab-6.4` | `src/routes/RootLayout.tsx` — sign-out clears user-scoped state |
| `lab-6.5` | `src/store/inventory/persist.test.ts` — the migration test, through `persist.rehydrate()` |

## Finished version

[`../solution`](../solution) — everything done, no markers. Demo 24a is not a
chain link: nothing follows it, and the companion is
[`../../24b-redux-toolkit/`](../../24b-redux-toolkit/), which builds the same
screen in Redux Toolkit.

## Before you start

Install the **Redux DevTools** browser extension — Zustand's `devtools`
middleware speaks the same protocol, and from Lab 1 C every change to the
inventory store appears in it by name, with working time travel.

Sign in as `emilys` / `emilyspass` (admin). `/account/inventory` is behind
`requireRole('admin')`.

Reads against DummyJSON are real; **writes are simulated** — a `PATCH` returns a
correct response and persists nothing. `PATCH /products/9999` really does answer
`404 { "message": "Product with id '9999' not found" }`, which is how Lab 4
forces a rollback.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build · npm run preview · npm test · npm run test:watch
```

Node 22.22+.
