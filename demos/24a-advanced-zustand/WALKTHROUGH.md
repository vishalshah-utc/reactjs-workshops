# Demo 24a — Walkthrough of the finished solution

The [guide](./README.md) teaches by building: six labs, twenty-two markers.
This file teaches by reading. Open `solution/`, follow along, and you should
understand both the code and the ideas without doing a single lab.

It is deliberately short. It points at files and lines rather than repeating
them — the code is commented, and the comments say *why*.

---

## 1. Run it and watch it

```bash
cd demos/24a-advanced-zustand/solution
npm install
npm run dev
```

Then:

1. Open http://localhost:5173 and sign in as **`emilys` / `emilyspass`**. That
   is DummyJSON's admin account.
2. Go to **Account → Inventory** (`/account/inventory`). The route is behind
   `requireRole('admin')`, so a moderator or a signed-out visitor gets a 403.
3. Install the **Redux DevTools** browser extension if you have not. Zustand's
   `devtools` middleware speaks the same protocol, and you will use it on every
   row of the table in part 4.
4. Open browser DevTools: **Network** (filter *Fetch/XHR*, tick *Disable
   cache*), **Console**, and **Application → Local storage**.

Also useful:

```bash
npm test          # 11 store tests, no React, under a second
npm run build     # the InventoryPage chunk is ~9.8 kB gzip
```

Two things about the backend, so nothing surprises you. DummyJSON's **reads are
real**; its **writes are simulated** — a `PATCH` returns a correct, complete
product and stores nothing, so an edited figure is gone after a reload.
`PATCH /products/9999` genuinely returns
`404 { "message": "Product with id '9999' not found" }`, which is what the
rollback demo uses.

---

## 2. The five-minute version

Three files, in this order. One idea each.

**`src/store/inventory/types.ts`** — the feature, described in types. Five slice
interfaces, one `InventoryStore` intersection, and at line 114 the thing that
matters most: `InventoryMutators`, a tuple naming every middleware applied above
a slice. **Idea: a slice's type has to know what wraps it, or `set` stops
compiling.**

**`src/store/inventory/catalogueSlice.ts`** — the only file that talks to the
network. Line 40 bumps a request id, line 44 aborts the previous request, line
78 refuses to write if a newer request has started. **Idea: cancelling a request
saves bandwidth; the request id is what saves correctness.**

**`src/store/inventory/index.ts`** — line 44 onwards:
`devtools(persist(immer(subscribeWithSelector(…))))`, then the persist options,
then the reset registration. **Idea: the middleware order is the order an update
travels through, and every layer has to be declared in the type from file one.**

If you have ten minutes, add **`selectors.ts`** (line 43: memoisation in eleven
lines) and **`editSlice.ts`** (line 22: snapshot before you destroy).

---

## 3. The tour — every file, in dependency order

### The store

**`src/store/inventory/types.ts`** (124 lines)
Every interface the console uses, and nothing else. `LoadStatus` is a union of
four, so "loading" and "error" cannot both be true. `RowState` is per row, not
per page. `InventoryStore` is the intersection of the five slices, which is why
`get()` in any slice sees all of them.
*Stop on line 114.* `InventoryMutators` lists `devtools`, `persist`, `immer`,
`subscribeWithSelector` in the order they are applied. Reorder it and nothing
compiles, with an error about `set` that never mentions middleware.

**`src/store/inventory/filtersSlice.ts`** (65 lines)
Search text, category, sort, order, low-stock, plus a dev-only latency knob.
Nothing asynchronous.
*Stop on the last line of `setFilter`:* `void get().fetchPage(0)`. A filter
change always restarts at page one — page 3 of "phone" is not page 3 of
"phones". One rule, no exceptions.

**`src/store/inventory/catalogueSlice.ts`** (144 lines)
The status machine, the fetch, and the normalised shape (`ids` for order,
`entities` for truth).
*Stop on line 12:* `let inFlight: AbortController | null = null` — outside the
store, because nothing renders from it and immer would only have to freeze it.
*And on line 78:* `if (get().requestId !== requestId) return;` — the one line
that makes overlapping requests safe.

**`src/store/inventory/editSlice.ts`** (72 lines)
One action, `commitStock`, in four beats: snapshot, optimistic write, request,
rollback-or-confirm.
*Stop on line 22:* `const previous = get().entities[id]?.stock` — taken *before*
the write. Move it two lines down and rollback silently becomes a no-op.

**`src/lib/concurrency.ts`** (36 lines)
`mapWithConcurrency(items, limit, worker)` — `limit` workers pulling from one
shared cursor, every outcome reported, results written back at their input
index.
*Stop on the `try`/`catch` inside `run()`.* That is what `Promise.allSettled`
would give you — but `allSettled` still starts everything at once, which is the
half this helper exists for.

**`src/store/inventory/bulkSlice.ts`** (140 lines)
Selection, the bulk write, the report, undo.
*Stop on line 61.* One snapshot, taken before anything is sent, is the whole of
undo. Unlike Lab 4's snapshot it lives in state, because it has to outlive the
call.

**`src/store/inventory/recentSlice.ts`** (38 lines)
The last eight inspected product **ids**. Not products: an id cannot go stale,
and the titles are looked up at render time.

**`src/store/inventory/selectors.ts`** (62 lines)
Atomic selectors, three selector factories, and the derived list.
*Stop on line 20:* `IDLE_ROW`, a shared constant. `?? { pending: false, error:
null }` would allocate on every call for every idle row, and then every store
change anywhere would look like a change to that row.
*And on line 46:* `selectVisibleIds` — `reselect` in eleven lines. It works only
because immer gives `entities` a new reference when, and only when, something in
it changed.

**`src/store/registry.ts`** (25 lines)
A `Set` of reset functions, and one call that runs them. Stores register
themselves at import time, so a layout component never has to know how many
there are.

**`src/store/inventory/index.ts`** (137 lines)
Where it all comes together: the middleware stack (line 44), the `persist`
options (70–108), the reset registration (118), and the transient subscription
(133).
*Stop on line 119.* `setState(next, false)` — the `false` is `replace`. `true`
would replace the whole state object, and the actions live in it.

### The screen

**`src/routes/account/InventoryPage.tsx`** (106 lines)
The page, plus a tiny loader that fetches the category list. The loader still
exists on purpose: categories are server state that never changes, and the
products are the store's *as an experiment*.
*Stop on the effect.* It reads `useInventoryStore.getState().status`
non-reactively, so the effect does not re-run on every transition it causes —
and only fetches when `status === 'idle'`, because the store outlives the route.

**`src/components/inventory/InventoryTable.tsx`** (81 lines)
The table subscribes to one thing: the list of ids. `InventoryRow` subscribes to
its own product and its own selection flag.
*Stop on the `useShallow` call.* An object selector builds a new object every
call; `useShallow` compares its keys instead. Two separate selectors would do
the same job with no import — it is here so you have seen it.

**`src/components/inventory/StockCell.tsx`** (88 lines)
The inline editor, the spinner, and the per-row error.
*Stop on `const [editing, setEditing] = useState<number | null>(null)`.* One
piece of state, not two, so "editing" and "the draft" cannot disagree and no
effect is needed to sync them.

**`src/components/inventory/BulkBar.tsx`** · **`InventoryFilters.tsx`** ·
**`RecentlyInspected.tsx`**
The bar with the honest report; the toolbar, where the debounce lives (not in
the store — it is a property of one input box); and the persisted strip.

### Changed from Demo 14

- `src/router.tsx` — the admin-only, lazily loaded `/account/inventory` route.
- `src/routes/account/AccountLayout.tsx` — the **Inventory** nav link.
- `src/routes/RootLayout.tsx` — `resetUserScopedStores()` in `handleSignOut`.
- `src/api/services/products.ts` — `sortBy` widened to `title` / `stock`, and a
  dev-only `delayMs` that appends DummyJSON's `?delay=`.

### Tests

- `src/store/inventory/inventory.test.ts` — eight tests, including the race
  (driven by promises resolved by hand) and the rollback.
- `src/store/inventory/persist.test.ts` — three, through
  `useInventoryStore.persist.rehydrate()`.

Neither file imports React. A Zustand store is a plain object; the hook is only
the binding.

---

## 4. Watch each concept happen

Every row is reproducible. Sign in as `emilys` / `emilyspass`, open
`/account/inventory`, and keep Redux DevTools and the Network panel open.

| Concept | Lives in | Do this | You should see |
|---|---|---|---|
| **Slices are one store** | `index.ts:47`, `filtersSlice.ts` | Console: `useInventoryStore.getState()` | One object with keys from all five slices — `filters`, `entities`, `rows`, `selected`, `recent` — and every action alongside them. `setFilter` can call `fetchPage` because they share one `get`. |
| **Middleware order** | `index.ts:44–48` | Redux DevTools → instance **ShopScope · inventory** → change **Sort by** → open the **Diff** tab | Exactly one changed key, `filters.sortBy`. If `immer` were missing you would see the whole `filters` object replaced; if `devtools` were nested below `persist`, rehydration would not appear in the list at all. |
| **Named actions** | every `set`'s 3rd argument | Toggle **Low stock only**, then **Order** | Two entries named `inventory/setFilter:lowStockOnly` and `inventory/setFilter:order` — not `anonymous`. |
| **Time travel** | `devtools` + `replace: false` | Click an earlier entry in the DevTools list, then press **Jump** | The table snaps back to that state, and forward again when you click the last entry. |
| **Status machine** | `catalogueSlice.ts:60–100` | Hard-reload the page with the Network panel on **Slow 3G** | Skeleton → rows. Console: `useInventoryStore.getState().status` returns `'loading'` then `'ready'`. It is never both, because it is one string. |
| **Error state + retry** | `InventoryPage.tsx`, `ErrorNotice` | Network → **Offline**, then change the category | `status` becomes `'error'`, a red notice says *"Can't reach the server…"* with a **Retry** button. Go back online, click Retry, the table returns. |
| **`?delay=` makes latency visible** | `products.ts` `delayMs` | Set **Simulated latency** to `2000 ms` (dev-only control, right of the filters) and search for anything | The request URL now carries `&delay=2000`, and the skeleton stays up for two seconds. |
| **Cancellation** | `catalogueSlice.ts:12, 44` | Latency `4000 ms`, then change the category twice quickly | The first request shows **(cancelled)** in the Network panel. No error notice appears — `signal.aborted` returns before the `catch` writes anything. |
| **Request id discards a stale response** | `catalogueSlice.ts:78` | Latency `4000 ms` → type `phone` → set latency back to **none** → type `s` so the box reads `phones` | Network: `q=phone&delay=4000` pending, `q=phones` 200 in ~140 ms, then `q=phone` cancelled. The table shows **phones** results and *stays* showing them. Comment out line 78 and it flips back to `phone` four seconds later. |
| **StrictMode double-fetch** | React, in dev only | Hard-reload and look at the first two requests | Two identical requests, the first **cancelled**. That is the abort working, not a bug — it does not happen in `npm run build`. |
| **Normalised shape** | `catalogueSlice.ts:86–89` | Console: `useInventoryStore.getState().ids` then `.entities` | `ids` is 12 numbers in the server's sort order; `entities` is an object keyed by id. Click **Next**, then back, and `Object.keys(entities).length` is 24 — entities accumulate, `ids` is the window. |
| **immer + structural sharing** | `catalogueSlice.ts:120–135` | Edit one stock number, then open that entry's **Diff** in Redux DevTools | Only the one entity appears in the diff. Untouched objects keep their reference, which is what makes the memoised selector work. |
| **Selector memoisation** | `selectors.ts:46` | Console: `const s = useInventoryStore.getState(); selectVisibleIds(s) === selectVisibleIds(s)` | `true`. Replace the body with `state.ids.filter(…)` and React logs *"The result of getSnapshot should be cached to avoid an infinite loop"*, then usually *"Maximum update depth exceeded"*. |
| **Per-row subscriptions** | `InventoryTable.tsx`, `StockCell.tsx` | React DevTools → **Highlight updates while components render** → edit one row's stock | Only that row flashes. Subscribe the table to `entities` instead of each row to `entities[id]` and all twelve flash. |
| **Optimistic write** | `editSlice.ts:27–38` | Network → **Slow 3G**, click a stock number, type a new one, press **Enter** | The number changes **immediately**, a spinner sits next to it, and the `PATCH` is still pending in the Network panel. DevTools list: `inventory/editPending:1` → `inventory/patchStock:1` → `inventory/editFulfilled:1`. |
| **Rollback on rejection** | `editSlice.ts:51–58` | Right-click the last `PATCH` in the Network panel → **Block request URL**, then edit that row again | The new number appears, then reverts to the old one, and *that row alone* shows a red message with a **dismiss** link. No page-level banner; no other row changes. |
| **The real 404** | `ApiError.from` | Temporarily call `commitStock(9999, 5)` from the console | The row shows `Product with id '9999' not found` — DummyJSON's own message, because `ApiError.from` prefers the backend's over ours. |
| **Writes are simulated** | DummyJSON | Edit a stock figure successfully, then reload | The old figure is back. The response was real; the persistence was not. |
| **Limited concurrency** | `concurrency.ts`, `bulkSlice.ts:84` | Network → **Slow 3G** → **Select page** → **+10 stock to selected** | The waterfall shows four overlapping requests, then the next four, then the next four. Change `CONCURRENCY` to 12 and it becomes one solid block of twelve. |
| **One `set`, one render** | `bulkSlice.ts:68–82` | Same click, with **Highlight updates** on | All twelve numbers change in a single paint, and DevTools shows one entry, `inventory/bulkPending:12`. |
| **Partial failure, honestly** | `bulkSlice.ts:88–112` | Block one product's `PATCH` URL, then run the bulk again | An amber alert: *"11 of 12 updated · 1 rolled back"*, with the failing id and its reason listed. That row's number reverts; the other eleven keep theirs. |
| **Undo from a snapshot** | `bulkSlice.ts:116–128` | Click **Undo** | Every number returns to its pre-bulk value — including the eleven that succeeded — and **no requests are sent**. DevTools shows one `inventory/undoBulk` whose diff contains twelve entities. |
| **`partialize`** | `index.ts:70` | Application → Local storage → `shopscope.inventory` | `{"state":{"recent":{"ids":[…]}},"version":2}`. Search it for a product title or for `entities`: neither is there. |
| **Persistence** | `recentSlice.ts` | Open three products from the table, then reload | The **Recently inspected** strip survives; the table is empty and re-fetches. Open one of the three again — it moves to the front, no duplicate. |
| **Migration** | `index.ts:78` | Console: `localStorage.setItem('shopscope.inventory', JSON.stringify({version:1,state:{recentlyViewed:[{id:4,title:'old'},{id:9,title:'older'}]}})); location.reload()` | The strip comes back with two entries, the console logs `[inventory] migrated persisted state v1 → v2 (2 ids)`, and the stored value has been rewritten as version 2. |
| **Corrupted storage** | `index.ts:103` | Console: `localStorage.setItem('shopscope.inventory','{ not json'); location.reload()` | The app starts normally, the strip is empty, and the console logs `[inventory] rehydration failed — starting empty`. Nothing throws. |
| **Transient subscription** | `index.ts:133` | Open a product from the table (dev mode, `VITE_LOG_LEVEL=debug`) | The console logs `[inventory] recently inspected: 12, 3, 7`. That comes from `subscribe(selector, listener)` — outside React, no component subscribed, no render caused. |
| **Cross-slice reset** | `registry.ts`, `index.ts:118`, `RootLayout.tsx` | Load products, select three rows, open two products, add something to the cart, then **Sign out** and sign back in | The table re-fetches from page 1, nothing is selected, the strip is empty — and **the cart still has your items**, because it is deliberately not registered. |
| **Store outlives the route** | `InventoryPage.tsx` effect | Open a product from the table, then press **Back** | No request. The store is a module singleton and still holds the page. |
| **Testing without React** | `inventory.test.ts` | `npm test` | 11 passing tests in about 300 ms. Nothing renders; every test calls `getState()` and actions directly. |

---

## 5. If you change X, Y breaks

The fastest way to convince yourself a concept is real is to remove it. Each of
these is one edit; undo it afterwards.

**Delete `InventoryMutators` from `types.ts` and go back to
`StateCreator<InventoryStore, [], [], T>`.**
`npm run typecheck` fails on nearly every `set` in the store, with two errors
that never mention middleware: *"Argument of type '(state: WritableDraft<…>) =>
void' is not assignable…"* (immer is missing) and *"Expected 1-2 arguments, but
got 3"* (devtools is missing). This is the Zustand TypeScript complaint, in one
edit.

**Reorder the stack in `index.ts` — put `immer` outside `persist`.**
The types stop matching the tuple, and at runtime `persist` is handed a draft
proxy to serialise.

**Change `false` to `true` in the `setState` call at `index.ts:119`.**
Sign out, then click anything on the inventory page:
`state.fetchPage is not a function`. The second argument is `replace`, and your
actions live in the state object.

**Comment out `if (get().requestId !== requestId) return;` (`catalogueSlice.ts:78`).**
Run the race from part 4. Four seconds after you finish typing `phones`, the
table fills with results for `phone`. The abort did not save you: the response
had already arrived.

**Comment out `inFlight?.abort()` (line 44) but keep the id check.**
The table stays correct — but every superseded request runs to completion in the
Network panel. That is the split: the id is correctness, the abort is bandwidth.

**Move `const previous = …` (`editSlice.ts:22`) below `patchStock`.**
Block a `PATCH` and edit a row. The rollback "succeeds" and the wrong number
stays on screen, because you snapshotted the value you had just written.

**Replace `IDLE_ROW` (`selectors.ts:20`) with an inline object literal.**
Turn on **Highlight updates while components render** and change any filter:
every row flashes, for ever, because each row's selector returns a new object on
every call.

**Replace the body of `selectVisibleIds` with `state.ids.filter(…)`.**
The console fills with *"The result of getSnapshot should be cached to avoid an
infinite loop"*, and the page usually dies with *"Maximum update depth
exceeded"*. This is the single most common Zustand bug and it is not Zustand's:
it is what any unstable `useSyncExternalStore` snapshot does.

**Change `CONCURRENCY` in `bulkSlice.ts` from `4` to `194` and select every
row.** The Network waterfall becomes one block, and a real API answers `429`.

**Bump `version` in `index.ts` to `3` without touching `migrate`.**
Reload twice. The recently-inspected list empties silently — which is exactly
what happens to your users after a deploy when a version bump ships without a
migration.

**Register the cart store in `registry.ts`.**
Sign out: the basket empties. That is the decision the registry exists to make
explicit — "user-scoped" is a choice, not a default.

---

## Where to go next

- [README.md](./README.md) — the full guide, if you now want to build it
- [Demo 13](../13-client-state-with-zustand/) — the Zustand basics this builds
  on, plus *Groundwork* and *The landscape*
- [Demo 19](../19-tanstack-query-and-realtime/) — the cache this store
  deliberately is not
- [Demo 24b](../24b-redux-toolkit/) — the same screen in Redux Toolkit
- [Demo 24c](../24c-redux-observable/) — side effects as RxJS streams
