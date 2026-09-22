# Demo 24b — Walkthrough

**A reading companion to the finished solution.** The [guide](./README.md)
teaches by building, in seven labs with thirty markers. This teaches by reading
and watching: open `solution/`, follow along, and you should understand both the
code and the ideas without writing a line.

Roughly thirty minutes. Five parts:

1. [How to run it and what to install](#1-how-to-run-it)
2. [The five-minute version](#2-the-five-minute-version)
3. [The tour — every file, in dependency order](#3-the-tour)
4. [Concept → observation — watch each idea happen](#4-concept--observation)
5. [If you change X, Y breaks](#5-if-you-change-x-y-breaks)

---

## 1. How to run it

```bash
cd demos/24b-redux-toolkit/solution
npm install
npm run dev          # http://localhost:5173
```

**Install the Redux DevTools browser extension first.** Most of part 4 is
watched through it, not read.

- [Chrome Web Store](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/reduxdevtools/)

Then:

1. **Sign in as `emilys` / `emilyspass`.** The console is admin-only; any other
   account gets a 403 from the route middleware.
2. Go to **`/account/inventory`** — or **Account → Inventory** in the sidebar.
3. Open browser devtools and keep three tabs to hand: **Redux**, **Network**
   (filtered to Fetch/XHR) and **Console**.
4. At the bottom of the toolbar there is a **Simulated latency** select. It
   exists only in development, and it is how you make every race, spinner and
   rollback slow enough to watch. Most steps below say when to use it.

There is a second route, **`/account/inventory/rtkq`**, linked from the header
of the first. It is the *same screen built a second way* — that comparison is
the point of the demo, so open both.

> Reads hit the real DummyJSON API. **Writes are simulated**: a `PATCH` returns a
> correct response and persists nothing, so a reload puts every number back.
> Everything you watch is real; only the durability is not.

```bash
npm test             # 12 tests, ~400 ms, no browser
npm run build        # then `npm run preview` to see the devtools disappear
```

---

## 2. The five-minute version

If you read three files, read these, in this order.

**1. `src/store/filters.ts` — what a slice is.**
Six tiny reducers. They look like they mutate state (`state.q = action.payload`)
and they do not: Redux Toolkit runs every one of them inside Immer, so you are
editing a draft and a new object comes out. The file also generates its own
action creators from the function names — `searchChanged` exists because the
function is called `searchChanged`. That is the boilerplate that used to be
three files.

**2. `src/store/inventory.ts` — what async in a store costs.**
One `createAsyncThunk` and three `extraReducers` cases per thunk. A status
machine, a request id to discard stale answers, an abort signal, a normalised
`ids` + `entities` shape from `createEntityAdapter`, and memoised selectors.
About 110 lines of code, all of it correct, all of it something you would write
again for the next screen.

**3. `src/api/inventoryApi.ts` — what you get for deleting those 110 lines.**
The same fetching, declared rather than written, in about 70 — and with a cache,
request deduplication and tag-driven invalidation that the 110 lines never had.
It runs on `src/api/baseQuery.ts`, eleven lines that put RTK Query on top of the
app's existing axios client instead of replacing it.

Those three files are the argument of the whole demo: **a slice is cheap, async
in a slice is expensive, and RTK Query is what you buy instead.**

---

## 3. The tour

Every file the demo adds or changes, in the order one depends on the next.
Line numbers are from `solution/`.

### The two helpers, written for you

**`src/lib/errorInfo.ts`** (33 lines) — turns any thrown value into a plain
`{ message, status, code, requestId, isRetryable }`.
*The idea:* a Redux store may only hold data. `ApiError` is a class with a
prototype and a `cause` holding the original axios error; it cannot be cloned,
serialised or replayed.
*Stop on:* line 25, `toErrorInfo` — the one place the class becomes data. The
API layer keeps the class; the store keeps this.

**`src/lib/concurrency.ts`** (47 lines) — runs a task over a list, N at a time,
and reports every outcome.
*The idea:* `Promise.all` rejects on the first failure and throws away the
results that already succeeded; `allSettled` fires everything at once.
*Stop on:* line 33, the shared `cursor` — N workers pulling from one index, so a
slow item never stalls a batch.

### The store, bottom up

**`src/store/session.ts`** (17 lines) — one `createAction('session/signedOut')`.
*The idea:* an action owned by no slice, which several slices answer.
*Stop on:* the whole file. It is the alternative to a `resetEverything()`
function that has to know every slice that will ever exist.

**`src/store/filters.ts`** (~130 lines) — search, category, low-stock, sort,
page, and a dev-only latency.
*The idea:* `createSlice`, Immer, and one rule enforced in one place.
*Stop on:* `state.page = 0` repeated in every filter reducer. That is F3's rule
living where no caller can forget it. Also the `sortChanged` `prepare` callback
— two arguments in, one payload out.

**`src/store/extra.ts`** (18 lines) — `{ listProducts, updateProduct }`.
*The idea:* dependency injection with no framework. Thunks reach the API through
`thunkApi.extra`, so a test hands the store a different object.
*Stop on:* what is *not* imported here — no axios, no endpoints, no `ApiError`.

**`src/store/createAppAsyncThunk.ts`** (25 lines) — `createAsyncThunk.withTypes`.
*The idea:* type the thunk API once, not per thunk.
*Stop on:* `import type { RootState } from './index'` — a cycle on paper, erased
entirely at runtime by `verbatimModuleSyntax`.

**`src/store/inventory.ts`** (~360 lines) — the big one; read it in four passes.
*The idea:* everything async in a store, by hand.
*Stop on:* the adapter at line 23 (and the comment saying why it has **no**
`sortComparer`), `condition` at line 125, the `requestId` check at the top of
`fulfilled`, `upsertOne` in `saveStock.fulfilled` (PATCH returns the whole
merged product), and `selectVisibleIds` near the bottom — ids, not objects.

**`src/store/recent.ts`** (~110 lines) — the last eight products opened.
*The idea:* persistence with a version and a forward migration.
*Stop on:* `loadRecent` — it never throws, validates everything, and migrates
the v1 `{ recentlyViewed: [{ id, title }] }` shape by keeping the ids and
**dropping the cached titles**.

**`src/store/listeners.ts`** (~145 lines) — bulk restock, undo, persistence.
*The idea:* side effects belong in middleware, not reducers and not components.
*Stop on:* `listenerApi.cancelActiveListeners()` (that is `takeLatest` in one
line) and the contrast between `getState()` in the persistence listener and
`getOriginalState()` in the undo listener.

**`src/store/index.ts`** (~110 lines) — `configureStore`.
*The idea:* one store, one middleware chain, and every default made explicit.
*Stop on:* `.prepend(listenerMiddleware.middleware).concat(inventoryApi.middleware)`
— order matters in both directions — and `devTools: env.isDev && {…}`, which is
the one-line difference between a debugging tool and a security hole.

**`src/store/hooks.ts`** (23 lines) — `useAppSelector`, `useAppDispatch`.
*The idea:* type the hooks once so no selector ever needs an annotation.
*Stop on:* nothing. That is the point — three lines, imported everywhere.

### RTK Query

**`src/api/baseQuery.ts`** (51 lines) — axios as a `baseQuery`.
*The idea:* RTK Query sits **on top of** the API layer from Demos 5–8 rather
than replacing it, so the auth interceptor, the 401 refresh queue, the logger
and the single `ApiError` all still apply.
*Stop on:* `return { error: toErrorInfo(error) }` — never throw, and never store
a class.

**`src/api/inventoryApi.ts`** (~120 lines) — `createApi`.
*The idea:* declare endpoints; get the cache, the hooks, the dedupe and the tag
graph generated.
*Stop on:* `providesTags` (one tag per row plus `LIST`), `onQueryStarted` with
`patch.undo()`, and `invalidatesTags` naming the **one** row rather than `LIST`.

### The screen

**`src/routes/account/inventoryLoader.ts`** (24 lines) — the category list.
*The idea:* the one thing here that is still a route loader, on purpose.
Unchanging server state the toolbar cannot render without.

**`src/routes/account/InventoryPage.tsx`** (~135 lines) — the thunk version.
*Stop on:* the five-line effect that dispatches and returns `promise.abort()`,
and the four-branch status machine below it.

**`src/routes/account/InventoryQueryPage.tsx`** (~180 lines) — the RTK Query
version of the same screen.
*Stop on:* `useGetInventoryQuery(filters)` — one line replacing the thunk, the
status machine, the request id, the `condition` and the abort effect.

**`src/components/inventory/`** — `InventoryToolbar` (reads filters, dispatches
actions, owns a local debounced draft), `InventoryTable` (maps **ids**, one
subscription per row), `StockCell` (optimistic edit, per-row spinner and error),
`BulkBar` (dispatches one action, reads progress back) and `RecentlyInspected`
(the persisted strip).

### Changed, not added

- **`src/main.tsx`** — `<Provider store={store}>` wraps `<RouterProvider>`.
- **`src/router.tsx`** — two lazy admin routes with the categories loader.
- **`src/routes/RootLayout.tsx`** — sign-out dispatches `signedOut()` and
  `inventoryApi.util.resetApiState()`.
- **`src/components/ErrorNotice.tsx`** — its prop is now a structural
  `DisplayableError`, which both `ApiError` and the store's plain object satisfy.
- **`src/api/services/products.ts`** — `sortBy` widened to include `'stock'`,
  and a dev-only `delayMs` that appends DummyJSON's `?delay=`.
- **The Zustand cart and wishlist** — *unchanged*. Two state libraries, one app.

---

## 4. Concept → observation

The centre of this document. Every row is something you can watch happen.

Sign in as `emilys`, open `/account/inventory`, and keep the Redux, Network and
Console tabs open. Where a row says *latency*, use the **Simulated latency**
select at the bottom of the toolbar.

### The basics

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **Typed hooks** | `store/hooks.ts` | In `InventoryTable.tsx`, change `useAppSelector` to `useSelector` from `react-redux` and save | `tsc` fails: *`Property 'inventory' does not exist on type 'unknown'`*. The app still runs — that is the point: the type was the only thing protecting you |
| **The Provider** | `main.tsx` | Move `<Provider>` inside `<RouterProvider>` | *`could not find react-redux context value; please ensure the component is wrapped in a <Provider>`* |
| **Slice → action creator** | `store/filters.ts` | Type `lip` in the search box, wait | One action, **`filters/searchChanged`**, in the Redux log. Click it → **Action** tab shows `{ type: 'filters/searchChanged', payload: 'lip' }` |
| **Debounce vs the log** | `InventoryToolbar.tsx` | Type ten characters quickly | Still **one** action. The draft is local `useState`; only the committed value reaches the store |
| **The Immer illusion** | `store/filters.ts` | Click that action, open the **Diff** tab | Two changed keys: `filters.q` **and** `filters.page`. The reducer "mutated" `state.page = 0`, and a new state object came out |
| **A rule in one place** | `store/filters.ts` | Go to page 3, then change the category | Page snaps back to 1. No component code did that — every filter reducer sets `state.page = 0` |
| **`prepare` callback** | `store/filters.ts` | Change the sort | One `filters/sortChanged` whose payload is `{ sortBy, order }` — two arguments in, one payload out |

### The thunk lifecycle

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **Three actions per thunk** | `store/inventory.ts` | Reload the page | In order: **`inventory/load/pending`** → **`inventory/load/fulfilled`**. Set latency to 4 s and you can watch the gap |
| **`meta.requestId` / `meta.arg`** | `store/inventory.ts` | Click `inventory/load/pending` → **Action** → expand `meta` | `requestId` (a random string) and `arg` (the whole filters object). Those two fields are what the race guard is built on |
| **The status machine** | `store/inventory.ts` | Click through the log with the **State** tab open | `inventory.status` goes `idle` → `loading` → `ready`. Never two of them, because it is one string |
| **`condition` dedupes** | `store/inventory.ts` line 125 | Latency 2 s. Click the *same* page number in the pager three times fast | **One** `pending` in the log and **one** request in the Network tab. The other two dispatches were refused before they started |
| **`signal` aborts** | `store/inventory.ts` + `InventoryPage.tsx` | Latency 4 s. Type `lip`, then immediately type `sto` | Network tab: the first request goes red / **(cancelled)**. Redux log: `inventory/load/rejected` whose `meta.aborted` is `true` — and `status` stays `loading`, **not** `error` |
| **Latest-wins** | `store/inventory.ts`, `fulfilled` | Comment out the `if (state.currentRequestId !== action.meta.requestId) return;` line. Latency 4 s, search, then click page 2 | The table shows page 1 while the pager says page 2. Restore the line and the same sequence is correct |
| **`rejectWithValue` keeps the detail** | `store/inventory.ts` | Turn Wi-Fi off, reload | `status: 'error'`, and `inventory.error` in the **State** tab is a plain object with `message`, `status`, `code` — expand it, every value is a string or a number |
| **The serializability check** | `store/index.ts` | Change `rejectWithValue(toErrorInfo(error))` to `rejectWithValue(ApiError.from(error) as never)`, then break the network | **Two** console errors: *"A non-serializable value was detected in an action, in the path: `payload`"* and *"…in the state, in the path: `inventory.error`"*, the second naming `inventory/load/rejected` as the reducer to look at |
| **`extra` is injected** | `store/extra.ts` | Read `store/inventory.test.ts` lines 41–61 | A real store with a fake API, and no `vi.mock` anywhere |

### Normalisation and selectors

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **The normalised shape** | `store/inventory.ts` | **State** tab → expand `inventory` | `ids: [1, 2, 3, …]` and `entities: { 1: {…}, 2: {…} }`. There is no `products` array anywhere in the tree |
| **One row re-renders, not twelve** | `InventoryTable.tsx` | React DevTools → **Highlight updates when components render** → toggle one row's checkbox | **One row** flashes. Change `InventoryTable` to select `selectAll` and map objects, and twelve flash |
| **A memoised selector** | `store/inventory.ts` | In the browser console: `const s = store.getState(); selectVisibleIds(s) === selectVisibleIds(s)` | `true` — the same array reference. Replace it with an inline `state.inventory.ids.filter(…)` and the same expression is `false`, which is the re-render loop in one line |
| **Inputs decide recomputation** | `store/inventory.ts` | Put a `console.log` in `selectVisibleIds`' output function, then toggle a row's **selection** | Silence. Neither input changed, so the array is not rebuilt |
| **Selector factory** | `StockCell.tsx` | Read `useMemo(() => makeSelectRowState(), [])` | One selector instance per mounted row — the pattern that predates Reselect 5's `weakMapMemoize` |
| **Low stock is client-side** | `store/inventory.ts` | Tick **Low stock** with the Network tab open | The row count drops, the pager resets to page 1, **and a request goes out returning the same twelve rows**. DummyJSON has no stock predicate; the rule "any filter change refetches page one" is kept anyway, with no exceptions |
| **`sortComparer` would lie** | `store/inventory.ts` line 23 | Add `sortComparer: (a, b) => a.title.localeCompare(b.title)` to the adapter, then sort by "Stock, lowest first" | The request still asks for stock order; the table renders alphabetically, with no warning. Remove it |

### Optimistic writes — both implementations

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **Optimistic write (thunk)** | `store/inventory.ts`, `saveStock.pending` | Latency 2 s. Edit a row's stock, press Enter | The number changes **immediately**, a spinner appears, the PATCH is still in flight. Click `inventory/saveStock/pending` → **Diff**: `entities.N.stock` *and* `rows.N`, in one action |
| **Optimistic write (RTK Query)** | `api/inventoryApi.ts`, `onQueryStarted` | Same edit on `/account/inventory/rtkq` | Same instant change — but the **Diff** is inside `inventoryApi.queries[…].data`, because the cache is the state now |
| **The server has the last word** | `store/inventory.ts`, `saveStock.fulfilled` | Expand the `fulfilled` action's payload | The **whole merged product** comes back, not just `stock`. That is why the reducer uses `upsertOne(…{ ...entity, ...payload })` rather than picking one field out |
| **Rollback (thunk)** | `store/inventory.ts`, `saveStock.rejected` | Point `updateProduct` at `endpoints.products.update(9999)`. Latency 2 s. Edit a row | Number changes → two seconds pass (the delay applies to the error path too) → number **goes back**, and the cell shows *"Product with id '9999' not found"* — DummyJSON's own words |
| **Rollback (RTK Query)** | `api/inventoryApi.ts` | Same break, on the `/rtkq` page | Same snap-back, done by `patch.undo()`. And **no refetch follows**, because `invalidatesTags` returns `[]` when `error` is truthy |
| **Per-row state** | `store/inventory.ts` | Break one row (as above), edit a *different* row normally | Two independent spinners, two independent `rows` entries, one success and one failure side by side |
| **Derived values follow** | `store/inventory.ts` | Watch "… units on this page" in the header while you edit | It moves with the optimistic write and moves back with the rollback. Nobody wired it up; it is a `createSelector` over the same entities |
| **Time-travel a failure** | the whole design | With a rollback on screen, drag the devtools slider back to `saveStock/pending` | The optimistic value returns. Drag forward: it rolls back again. The bug is now a recording |

### Side effects

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **A listener fires** | `store/listeners.ts` | Select eight rows, press **+10 stock to selected** | `inventory/bulkRestockRequested`, then interleaved `saveStock/pending` and `saveStock/fulfilled`, then `inventory/bulkProgressed` ×8, then `inventory/bulkRestockFinished` |
| **Bounded concurrency** | `lib/concurrency.ts` | Latency 2 s, then count in-flight PATCHes in the Network tab | **Never more than four.** Change `BULK_CONCURRENCY` to 1 and watch them queue up single file |
| **It outlives the component** | `store/listeners.ts` | Start a bulk restock, navigate to **Account → Team**, come back | It finished. No component was mounted for most of it |
| **`takeLatest` cancellation** | `store/listeners.ts` | Latency 4 s. Start a restock, press the button again immediately | The first run stops — its remaining `saveStock` dispatches never appear — and only the second reports |
| **Honest partial failure** | `store/listeners.ts` | Break every row (point `updateProduct` at 9999) for half the selection | *"N of M rows restocked"* with the failures listed **by id and reason**. The successes stayed applied |
| **Undo is a real reverse** | `store/listeners.ts` | Press **Undo** after a restock | More PATCHes go out, four at a time. It is not a screen trick — the server was told, so it is told again |
| **`getOriginalState`** | `store/listeners.ts` | Change `getOriginalState()` to `getState()` in the undo listener | Undo silently does nothing: by then its own action has cleared `bulk`, and the snapshot it reads is gone |
| **Persistence is an effect** | `store/listeners.ts` | Click three product titles. Application → Local Storage | `shopscope.inventory.recent` = `{"version":2,"ids":[3,2,1]}`. No reducer wrote that; the listener did, after the reducers ran |
| **Hydration without a flash** | `store/index.ts` | Reload | The strip is already there on the first paint. `preloadedState: { recent: loadRecent() }` ran before React did |
| **A real migration** | `store/recent.ts` | `localStorage.setItem('shopscope.inventory.recent', JSON.stringify({ recentlyViewed: [{ id: 5, title: 'A name from 2023' }] }))`, then reload | Console: *`[recent] migrating v1 (recentlyViewed) → v2 (ids only)`*. The strip shows the product's **current** title, not the stale one. Storage is rewritten in the v2 shape on the next save |
| **Never throw on bad storage** | `store/recent.ts` | Set the same key to `'not json at all'` and reload | Empty strip, one warning, no crash |
| **One action, several slices** | `store/session.ts` | Sign out with the **Diff** tab open | A single `session/signedOut`, and `filters`, `inventory` and `recent` all reset in it. Then open the cart: **your items are still there**, because the cart is Zustand and nobody told it anything |

### RTK Query

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **The cache is Redux state** | `store/index.ts` | Open `/account/inventory/rtkq`, then the **State** tab | A fourth top-level key, `inventoryApi`, containing `queries`, `mutations`, `provided` and `subscriptions` |
| **The argument is the key** | `api/inventoryApi.ts` | Type `lip`, then clear the search | Two entries under `inventoryApi.queries`, one per filter combination — and clearing the search fires **no request**, because that entry is still cached |
| **Cache hit vs miss** | `api/inventoryApi.ts` | Navigate away and back within two minutes | Instant, no request. Wait past `keepUnusedDataFor: 120` and it fetches again |
| **`isFetching` vs `isLoading`** | `InventoryQueryPage.tsx` | Change a filter on a page that already has rows | The table stays on screen, dimmed, with a "refreshing" badge — rather than collapsing into a skeleton |
| **Tag invalidation** | `api/inventoryApi.ts` | Edit a row's stock on the `/rtkq` page, Network tab open | `PATCH`, then a `GET` right behind it. That GET is `invalidatesTags` marking `Product:{id}` stale and the watched entry refetching — and because DummyJSON does not persist writes, it puts the old number back. **That revert is the proof the invalidation fired** |
| **Invalidate the row, not the list** | `api/inventoryApi.ts` | Change `invalidatesTags` to `[{ type: 'Product', id: 'LIST' }]`, then edit a row | Every cached page of every filter combination refetches to correct one number |
| **Your `baseQuery`, not theirs** | `api/baseQuery.ts` | Watch the Console while the `/rtkq` page loads | The Demo 6 request-id and timing log lines appear for RTK Query's requests exactly as for every other request. The token is attached by the Demo 11 interceptor, and the 401 refresh queue still runs |
| **`setupListeners`** | `store/index.ts` | Switch to another browser tab and back | One refetch. Comment out `setupListeners(store.dispatch)` and it stops |
| **Same feature, fewer lines** | both files | Read `store/inventory.ts` and `api/inventoryApi.ts` side by side | 113 lines of hand-written fetching against 70 declared ones — and the 70 also have a cache, dedupe and invalidation |

### The devtools themselves

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **Time-travel** | free, from the two rules | Do four or five things, then drag the slider back | The whole app rewinds — filters, stock numbers, selection, the RTK Query cache. Nothing in the app was written to support this |
| **Trace** | `store/index.ts` | Dispatch anything, open the **Trace** tab | The component that dispatched it, by name. Set `trace: false` and the tab goes empty |
| **Off in production** | `store/index.ts` | `npm run build && npm run preview` | The Redux tab says *"No store found"*. `devTools: env.isDev && {…}` is `false` in a build |
| **The immutability check** | `store/index.ts` | Add `const ids = useAppSelector(selectProductIds); ids.sort();` to `InventoryTable` | *"A state mutation was detected between dispatches, in the path 'inventory.ids'"* — thrown, not warned |

---

## 5. If you change X, Y breaks

The fastest way to convince yourself a concept is load-bearing is to break it.
Each of these is one line. Undo each before the next.

| Change this | …and this breaks | Why it matters |
|---|---|---|
| Remove `state.page = 0` from `categoryChanged` (`filters.ts`) | Filter from page 3 and you get an empty table — page 3 of a 12-row result | The rule has to live in the reducer, because every caller would forget it |
| Make `filtersCleared` both assign to `state` *and* `return initialState` | *`[Immer] An immer producer returned a new value *and* modified its draft`* | The draft contract, enforced at runtime |
| Delete the `condition` option (`inventory.ts`) | Three identical requests for three fast clicks | Dedupe is not free; it is three lines |
| Delete the `requestId` check in `fulfilled` | The table and the pager disagree after a slow-then-fast sequence | `abort()` alone cannot catch a response already on the wire |
| Delete `if (action.meta.aborted) return;` | A red error box every time you type quickly | An abort is the user's intention, not a failure |
| Delete the `addMatcher` clearing `pendingKey` | The second search never fires; the page freezes on the first result | `condition` needs someone to reset it |
| Store `ApiError.from(error)` instead of `toErrorInfo(error)` | Two console errors, and time-travel through that action stops working | Serialisability is what makes the recording possible |
| Return objects instead of ids from `selectVisibleIds` | Twelve rows re-render for one edit | Normalisation only pays off if the components use it |
| Replace `createSelector` with an inline `.filter()` | The component re-renders after every action in the app, for ever | `useSelector` compares by reference |
| Give the entity adapter a `sortComparer` | The server's sort is silently discarded | Two authorities on order is one too many |
| Use `updateOne(… { stock })` instead of `upsertOne(…payload)` in `saveStock.fulfilled` | Nothing, today — and a silent bug the day the server changes another field | PATCH returns the whole merged product |
| Remove `listenerApi.cancelActiveListeners()` | Two bulk runs interleave; the progress bar goes past 100% | `takeLatest` is not decoration |
| Swap `getOriginalState()` for `getState()` in the undo listener | Undo does nothing, silently | Listeners run *after* the reducers |
| Replace `mapWithConcurrency` with `Promise.all` | Twelve simultaneous PATCHes, and one 404 loses all the other results | Bulk means bounded and honest |
| Remove `preloadedState` from `configureStore` | The recent strip is empty until something re-saves it | Hydration is a store concern, not an effect |
| Move `<Provider>` inside `<RouterProvider>` | *"could not find react-redux context value"* on every page | The provider has to be above everything that selects |
| Drop `.concat(inventoryApi.middleware)` | The `/rtkq` page renders and never fetches | The generated middleware is what runs the queries |
| Change the `filters` argument passed to `updateQueryData` | The optimistic update silently does nothing | It addresses a cache entry by its exact argument |
| Set `devTools: true` unconditionally | Your entire store is readable and writable by any script on the page in production | One line, one security review finding |

---

## Where next

- The **[guide](./README.md)** builds all of this in seven labs, and ends with a
  straight recommendation on Redux Toolkit versus Zustand.
- **[Demo 24a](../24a-advanced-zustand/)** is the identical console in Zustand.
  Read the two `src/store/` directories side by side.
- **[Demo 24c](../24c-redux-observable-and-rxjs/)** takes this solution and
  replaces `src/store/listeners.ts` with RxJS epics, then adds a live feed.
