# ShopScope — Demo 24a, finished (Advanced Zustand)

```bash
npm install
npm run dev
npm test
```

**This is the finished demo.** Every `TODO(lab-…)` from
[`../starter`](../starter) is done; there are no markers left in `src/`.

Read it alongside [WALKTHROUGH.md](../WALKTHROUGH.md), which tours these files
in dependency order and — for each concept — tells you exactly what to click in
the browser to watch it happen. The full teaching guide is
[`../README.md`](../README.md).

## What is new here, on top of Demo 14

The **Inventory Console** at `/account/inventory` — one admin screen whose data
is owned by a Zustand store instead of a router loader, on purpose.

```
src/store/inventory/
  types.ts           every slice interface, the InventoryStore intersection,
                     and InventoryMutators — the tuple that keeps `set` typed
  filtersSlice.ts    search, category, sort, order, low-stock; every change
                     refetches page 0
  catalogueSlice.ts  the status machine, fetchPage with AbortController and a
                     monotonic request id, and the normalised ids + entities
  editSlice.ts       optimistic commitStock, per-row pending/error, rollback
  bulkSlice.ts       selection, one snapshot, limited concurrency, partial
                     failure, undo
  recentSlice.ts     the last eight inspected ids — the only persisted slice
  selectors.ts       atomic selectors, selector factories, and a derived list
                     memoised in eleven lines
  index.ts           create()(devtools(persist(immer(subscribeWithSelector()))))
                     plus the persist options and the reset registration
  inventory.test.ts  eight store tests — no React, no render
  persist.test.ts    three persistence tests, through persist.rehydrate()

src/store/registry.ts              the reset registry sign-out calls
src/lib/concurrency.ts             mapWithConcurrency
src/components/inventory/          InventoryTable, StockCell, InventoryFilters,
                                   BulkBar, RecentlyInspected
src/routes/account/InventoryPage.tsx   the page, and its categories loader
```

Changed from Demo 14: `src/router.tsx` (the admin-only route),
`src/routes/account/AccountLayout.tsx` (the nav link), `src/routes/RootLayout.tsx`
(sign-out resets user-scoped stores), and `src/api/services/products.ts`
(`sortBy` widened to `title` / `stock`, plus a dev-only `delayMs`).

| Try | Where |
|---|---|
| Load a page through the store, with skeleton, error and empty states | `/account/inventory` as `emilys` / `emilyspass` |
| A race, discarded by request id | set **Simulated latency** to 4000 ms, search `phone`, set it back to none, type `s` |
| Optimistic edit and rollback | click a stock number, edit it; then block the `PATCH` in DevTools and edit again |
| Bulk restock, four requests at a time, with undo | **Select page** → **+10 stock to selected** on Slow 3G |
| Persistence and its migration | Application → Local storage → `shopscope.inventory` |
| Cross-slice reset | select rows, open products, **Sign out** — the cart survives, the console does not |
| Named actions and time travel | Redux DevTools → **ShopScope · inventory** |

Reads are real; DummyJSON **simulates writes**, so an edited stock figure does
not survive a reload. `PATCH /products/9999` genuinely returns
`404 { "message": "Product with id '9999' not found" }`.

New dependency over Demo 14: **`immer@11.1.18`** (plus `vitest` and `jsdom` for
the store tests).

Nothing follows this demo. Its companion is
[`../../24b-redux-toolkit/`](../../24b-redux-toolkit/) — the same screen, the
same API, Redux Toolkit.

Node 22.22+.
