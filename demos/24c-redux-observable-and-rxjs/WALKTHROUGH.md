# Demo 24c — Walkthrough

**A reading companion to the finished solution.** The [guide](./README.md)
teaches by building, in seven labs with twenty-nine markers. This teaches by
reading and watching: open `solution/`, follow along, and you should
understand both the code and the ideas without writing a line.

Roughly forty minutes. Five parts:

1. [How to run it and what to install](#1-how-to-run-it)
2. [The five-minute version](#2-the-five-minute-version)
3. [The tour — every file, in dependency order](#3-the-tour)
4. [Concept → observation — watch each idea happen](#4-concept--observation)
5. [If you change X, Y breaks](#5-if-you-change-x-y-breaks)

---

## 1. How to run it

```bash
cd demos/24c-redux-observable-and-rxjs/solution
npm install
npm run dev          # http://localhost:5173
```

The dev server prints one extra line. It is the whole of half two:

```
  ➜  mock stock feed:  ws://localhost:5173/__dev/feed
```

**Install the Redux DevTools browser extension.** Then:

1. **Sign in as `emilys` / `emilyspass`.** The console is admin-only.
2. Go to **`/account/inventory`** — or **Account → Inventory** in the sidebar.
3. Open browser devtools and keep **four** tabs to hand this time: **Redux**,
   **Network** filtered to **Fetch/XHR**, **Network** filtered to **WS**, and
   **Console**.

**The WS tab is the one most people have never opened.** Click the
`/__dev/feed` connection and open its **Messages** panel: every frame in and
out, with a direction arrow and a timestamp. Half of part 4 below is read
there rather than in the Redux log.

4. The toolbar still has the dev-only **Simulated latency** select (none / 2 s
   / 4 s). Every "now make it slow" step uses it.

There is a second route, **`/account/inventory/rtkq`**, unchanged from Demo
24b. It is the same screen built on RTK Query, and it is still in here on
purpose: the guide's closing argument is that for plain data loading, *that*
page is the better answer.

> Reads hit the real DummyJSON API. **Writes are simulated**: a `PATCH`
> returns a correct response — the whole merged product — and persists
> nothing. **The live feed is a mock**, served by the Vite dev server from
> `vite/mockStockFeed.ts`; DummyJSON has no WebSocket. Everything you watch is
> real; the durability and the data source are not.

```bash
npm test             # 25 tests, under a second, no browser and no clock
npm run build && npm run preview   # the feed badge says "Live feed unavailable"
```

---

## 2. The five-minute version

If you read three files, read these, in this order.

**1. `src/store/epics/inventory.ts` — the like-for-like comparison.**
Two epics. `loadEpic` is Demo 24b's thunk, its `condition`, its request-id
bookkeeping, its abort effect and the toolbar's debounce hook, all at once. The
one word that does most of the work is `switchMap`. The one that does the rest
is `debounceTime`. Read the comment above the *outer* `switchMap` — leaving it
out is the classic redux-observable bug and the guide measured it.

**2. `src/lib/fromAbortable.ts` — seventeen lines of code, and without them the whole
demo is a lie.** `from(promise)` unsubscribing does not abort anything. An
Observable hands you a teardown function; that teardown is the
`AbortController`. Measured over five overlapping requests: `from(promise)`
aborts none, this aborts four.

**3. `src/store/epics/feed.ts` — the half a thunk could not do.** Open, read,
write, reconnect and close a WebSocket, with no `addEventListener`, no
`removeEventListener` and no cleanup function. Subscribing opens it,
unsubscribing closes it, `retry({ delay })` reconnects it, and `takeUntil` is
the unmount.

Those three files are the argument of the whole demo: **for a request, epics
are a lateral move; for a stream, they are the only sane option.**

---

## 3. The tour

Every file the demo adds or changes, in the order one depends on the next.
Line numbers are from `solution/`.

### The two new helpers

**`src/lib/fromAbortable.ts`** (47 lines) — a promise-returning function that
takes an `AbortSignal`, as an Observable that really cancels.
*The idea:* a promise has no cancellation channel; an Observable has a
teardown.
*Stop on:* the `return () => controller.abort();` at the end of the subscriber
— that single returned function is what makes `switchMap` reach the socket.

**`src/lib/feedProtocol.ts`** (56 lines) — the wire protocol, and
`isFeedServerMessage`.
*The idea:* one file imported by both ends, so a message-shape change is a
compile error rather than a runtime mismatch.
*Stop on:* the type guard. A socket hands you `unknown`, and in production the
other end is a system you do not control.

### The store, bottom up

**`src/store/rootReducer.ts`** (40 lines) — `combineReducers`, and `RootState`.
*The idea:* typed middleware needs `RootState`, and the store's type needs the
middleware, so `RootState` cannot come from the store.
*Stop on:* the comment quoting `TS2456: Type alias 'RootState' circularly
references itself`. That error is why this file exists.

**`src/store/inventory.ts`** (349 lines) — the same slice as Demo 24b, minus
three state fields and plus the feed.
*The idea:* the reducers did not change when the effect layer did.
*Stop on:* the block at line 77 listing `currentRequestId`, `pendingKey` and
`filtersKey` as **deleted**, and why `switchMap` made all three unnecessary.
Then the `feedTicked` case, and the one line that skips a row being saved.

**`src/store/feed.ts`** (86 lines) — the connection's own slice: status,
paused, reconnects, message count, subscribed ids.
*The idea:* the ticks land in the entity adapter; only the *connection* lives
here. Two slices, one action.
*Stop on:* `state.lastMessageAt = action.payload.at` — the **server's** clock,
carried in the action, because a reducer that calls `Date.now()` cannot be
replayed.

**`src/store/epics/types.ts`** (43 lines) — `AppEpic`, and a long comment.
*The idea:* `ofType` cannot narrow when the input is `UnknownAction`.
*Stop on:* the quoted error, *"Property 'payload' does not exist on type
'never'"*, and the one-line fix: `filter(creator.match)`.

**`src/store/epics/deps.ts`** (66 lines) — Demo 24b's `extra`, converted to
Observables.
*The idea:* dependency injection, unchanged in purpose, changed in shape.
*Stop on:* the custom `deserializer` in `openFeed`. The default is
`JSON.parse`, and it throws the whole stream away on one bad frame.

**`src/store/epics/inventory.ts`** (260 lines) — `loadEpic` and
`saveStockEpic`.
*The idea:* one operator per feature that used to be a paragraph.
*Stop on:* the outer `switchMap`, the inner `switchMap`, the `retry` whose
`delay` returns an Observable, and `startWith` placed **after** `retry`.

**`src/store/epics/bulk.ts`** (156 lines) — bulk restock and undo.
*The idea:* `mergeMap`'s second argument is the whole of
`mapWithConcurrency`, and `switchMap` is the whole of
`cancelActiveListeners()`.
*Stop on:* `merge(done$, of(stockSaveRequested(...)))` — `merge` subscribes
left to right, so the answer is being listened for before the question is
asked. Also the comment admitting the `failures` array is imperative on
purpose.

**`src/store/epics/persist.ts`** (34 lines) — the recent list, to disk.
*The idea:* an epic that emits nothing must say so.
*Stop on:* `ignoreElements()`. Without it this epic dispatches a
`RecentState` object as an action.

**`src/store/epics/feed.ts`** (270 lines) — the live feed.
*The idea:* a connection is a subscription.
*Stop on:* the `retry({ delay })` block, the local `status$` Subject (an
operator callback has no other way to emit), `bufferTime(250)`, the
`distinctUntilChanged(sameIds)` on the outbound stream, and the single
`filter` that is the pause button.

**`src/store/epics/index.ts`** (85 lines) — `combineEpics`, the middleware,
and the net.
*The idea:* an epic is one subscription for the life of the store, so one
escaped error stops every effect in the application.
*Stop on:* `catchError((error, source) => { log; return source; })` — a safety
net, and the comment saying it is not a design.

**`src/store/index.ts`** (103 lines) — `configureStore`.
*Stop on:* `.concat(epicMiddleware)` and the comment explaining why `.prepend`
would hand the epic raw thunk functions, and the `runEpics()` call below the
store with the exact warning you get if you move it above.

### The dev server

**`vite/mockStockFeed.ts`** (116 lines) — the mock, as a Vite plugin.
*The idea:* the dev server you are already running is the cheapest possible
backend for a channel the real API does not have. Same technique as Demo 19's
SSE price feed.
*Stop on:* the `upgrade` handler's early `return` for any URL that is not
`/__dev/feed` — Vite's own hot-reload socket is on the same server, and
destroying it is how you break HMR and blame React.

### The screen

**`src/routes/account/InventoryPage.tsx`** (138 lines).
*Stop on:* the four-line effect that dispatches `consoleOpened` and
`consoleClosed` and knows nothing else, quoted next to Demo 24b's five-line
dispatch-and-abort version in the comment above it.

**`src/components/inventory/FeedBar.tsx`** (67 lines) — status, ticks,
subscribed ids, reconnects, pause.
*The idea:* a stream you cannot see is a stream you cannot debug. Every number
on this bar is the output of exactly one operator.

**`src/components/inventory/InventoryToolbar.tsx`** — eight lines shorter. The
search box is an ordinary controlled input again, because the debounce moved
into the epic.

**`src/components/inventory/StockCell.tsx`** — dispatches a plain action
instead of a thunk, and reads `makeSelectFlash` for the highlight.

### Changed, not added

- **`src/index.css`** — the `feed-flash` keyframes, with a
  `prefers-reduced-motion` branch.
- **`vite.config.ts`**, **`tsconfig.node.json`** — the plugin, and `"node"` in
  the `types` array so it can be typechecked.
- **Deleted:** `src/store/listeners.ts`, `src/store/extra.ts`,
  `src/store/createAppAsyncThunk.ts`, `src/lib/concurrency.ts`.
- **Untouched:** `src/api/**` (including `baseQuery.ts` and `inventoryApi.ts`),
  the RTK Query page, `filters.ts`, `recent.ts`, `session.ts`, the Zustand cart
  and wishlist, and every component outside `components/inventory/`.

---

## 4. Concept → observation

The centre of this document, and it matters more here than in Demo 24b:
**streams are invisible.** Every row below is something you can watch happen.

Sign in as `emilys`, open `/account/inventory`, and keep the Redux, Network
(Fetch/XHR), Network (WS) and Console tabs open.

### The wiring

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **An epic is one subscription** | `epics/index.ts` | Add `map(() => { throw new Error('x'); })` to `persistRecentEpic`, then click a product title | The console logs *`[epics] an epic threw and was restarted`* — and **everything** async stopped for the moment before the root `catchError` resubscribed. Remove the root `catchError` and it never comes back |
| **`run()` after the store** | `store/index.ts` | Move `runEpics()` above `configureStore` | No exception. One console warning: *`redux-observable \| WARNING: epicMiddleware.run(rootEpic) called before the middleware has been setup by redux…`*, and then nothing loads, ever |
| **`concat`, not `prepend`** | `store/index.ts` | Change to `.prepend(epicMiddleware)`, add `tap(console.log)` to any epic, then use the products page | A raw **function** appears in the log. The epic is now upstream of `redux-thunk` |
| **`state$.value` is post-reducer** | `epics/inventory.ts` | Type `lip`, and watch which filters the request uses | `?q=lip&skip=0` — the `page = 0` rule the reducer applied has already happened |
| **`ofType` cannot narrow** | `epics/types.ts` | Change `filter(inventoryLoaded.match)` to `ofType('inventory/loaded')` and read `action.payload` | `tsc`: *`Property 'payload' does not exist on type 'never'`* |
| **The `RootState` cycle** | `store/rootReducer.ts` | Delete the file and put `RootState = ReturnType<typeof store.getState>` back in `index.ts` | *`error TS2456: Type alias 'RootState' circularly references itself`* |

### Cancellation, debouncing, retry

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **`switchMap` cancels** | `epics/inventory.ts` | Latency **4 s**. Type `lip`, wait for the request to start, then click page 2 | Network → Fetch/XHR: the first request goes **red / (cancelled)** and the table lands on page 2. No request id anywhere in the code |
| **…and `fromAbortable` is why** | `lib/fromAbortable.ts` | Replace the body with `return from(run(new AbortController().signal));` and repeat | The table is **still correct** — `switchMap` still discards the answer — but the first request now runs to completion instead of going red. That gap is the whole file |
| **`debounceTime` in the effect layer** | `epics/inventory.ts` | Type `lipstick` with both Network and Redux open | **One** request, 400 ms after you stop. **Eight** `filters/searchChanged` actions in the Redux log, one per character. That is the trade, on screen |
| **Selective debounce** | `epics/inventory.ts` | Change the category dropdown | The request goes out **immediately** — it is in the `merge`'s other branch, with no `debounceTime` |
| **`retry` with backoff** | `epics/inventory.ts` | Turn Wi-Fi off and reload the console | **Three** requests in the Network tab, roughly 0.4 s and 0.8 s apart, then one `inventory/failed`. And exactly **one** `inventory/loading` in the Redux log |
| **`startWith` after `retry`** | `epics/inventory.ts` | Move `startWith(inventoryLoading())` above the `retry`, repeat | **Three** `inventory/loading` actions and a flickering skeleton. Operator order is semantics |
| **A 404 is not retried** | `epics/inventory.ts` | Point `listProducts` at `endpoints.products.detail(9999)` | One request, no retries. The `delay` callback rethrows for a non-retryable status, which is how you say "stop" to `retry` |
| **`takeUntil` inside the outer `switchMap`** | `epics/inventory.ts` | Move it to the top level of the epic. Load the console, go to **Account → Team**, come back | Nothing loads. Ever again. No error anywhere. (Measured: `open, close, open, open` gives **one** action at the top level and **three** inside the switchMap) |

### The per-row write

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **`mergeMap`, not `switchMap`** | `epics/inventory.ts` | Latency 2 s. Edit row 1, then row 3 within the two seconds | Two spinners, two requests, both complete. Now change `mergeMap` to `switchMap`: row 1's request goes red and **row 1's spinner never stops**, because no terminal action arrives to clear `rows[1]` |
| **One action, two consumers** | `inventory.ts` + `epics/inventory.ts` | Click `inventory/stockSaveRequested` → **Diff** | `entities.N.stock` *and* `rows.N`, changed by the reducer — while the epic, independently, sent the PATCH. Neither knows about the other |
| **The server has the last word** | `inventory.ts` | Expand a `stockSaveSucceeded` payload | The **whole merged product**, not just `stock`. Verified against the live API |
| **Rollback** | `inventory.ts` | Point `updateProduct` at `9999`. Latency 2 s. Edit a row | Number changes → two seconds (the delay applies to the error path too) → back, with *"Product with id '9999' not found"* |
| **`catchError` placement** | `epics/inventory.ts` | Move the `catchError` outside the `mergeMap` and fail one row | The rollback happens once and **no row ever saves again**; the console shows the root `catchError` resubscribing |

### Bulk, undo, persistence

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **`mergeMap`'s concurrency** | `epics/bulk.ts` | Latency 2 s, select eight rows, **+10 stock to selected**, watch Network | **Never more than four** PATCHes in flight. Change `BULK_CONCURRENCY` to 1 and they queue single file; delete the second argument and all eight fire at once |
| **Bulk is not a second path** | `epics/bulk.ts` | Read the Redux log during a bulk run | `inventory/stockSaveRequested` ×8, interleaved with `stockSaveSucceeded` and `bulkProgressed` — the **same** actions an inline edit produces |
| **`switchMap` is `takeLatest`** | `epics/bulk.ts` | Latency 4 s. Start a restock, press the button again immediately | The first run's remaining requests never appear, and only the second emits `bulkRestockFinished` |
| **Honest partial failure** | `epics/bulk.ts` | Point `updateProduct` at `9999`, select six rows | *"0 of 6 rows restocked"*, each listed by id with DummyJSON's own message |
| **Undo is a real reverse** | `epics/bulk.ts` | Press **Undo** | More PATCHes, four at a time. The server was told, so it is told again |
| **`ignoreElements()`** | `epics/persist.ts` | Delete it, then click a product title | An action with `type: undefined` in the log, and a console complaint |
| **Persistence still works** | `epics/persist.ts` | Click three titles, open Application → Local Storage | `shopscope.inventory.recent` = `{"version":2,"ids":[3,2,1]}`. Reload: no flash of an empty strip, because `preloadedState` ran first |

### The live feed

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **A socket is a subscription** | `epics/feed.ts` | Open the console, then Network → **WS** | One connection to `/__dev/feed`, status **101 Switching Protocols**. Navigate to **Account → Team**: status goes to **Finished**. Come back: a new one. There is no `ws.close()` in the codebase |
| **Ticks arrive as actions** | `epics/feed.ts` | Watch the Redux log for ten seconds | `feed/ticked` roughly four times a second, each carrying `{ at, changes: [...] }`. Click one → **Diff**: two or three entries under `inventory.entities` |
| **The highlight** | `StockCell.tsx` | Just watch the table | Rows flash **green** when stock rises and **red** when it falls, then fade after 1.2 s. The fade is `feed/flashCleared`, dispatched by an epic with a `delay` — no `setTimeout` anywhere |
| **Normalisation pays off** | `InventoryTable.tsx` | React DevTools → *Highlight updates when components render* | Only the changed rows flash. Now make `InventoryTable` select `selectAll` and map objects: **all twelve** flash, four times a second |
| **Reconnect with backoff** | `epics/feed.ts` | `Ctrl-C` the dev server and watch the badge and the WS tab | **Live** → **Reconnecting…**, and failed connection attempts at roughly 0.5 s, 1 s, 2 s, 4 s, 8 s. Restart `npm run dev`: **Live** again, reconnect counter reads 1 |
| **The gap, and the resync** | `epics/feed.ts` | Immediately after that reconnect, look at Fetch/XHR | A `GET /products`, and `inventory/retried` in the Redux log. A feed sends deltas; the ones you missed are gone, so the page refetches |
| **…and only on a RE-connect** | `epics/feed.ts` | Delete `filter(() => state$.value.feed.reconnects > 0)` and reload | The very first connection now refetches too, doubling every page load |
| **`bufferTime`** | `epics/feed.ts` | In `vite/mockStockFeed.ts`, change `900` to `50` | Without `bufferTime` the log is unreadable and the page stutters. With it: still four `feed/ticked` a second, each carrying more changes |
| **Outbound multiplexing** | `epics/feed.ts` | Network → WS → **Messages**. Tick **Low stock** | A new **`subscribe`** frame goes out with fewer ids. Change the page: another. Nobody wrote an effect for this — it is four operators over `state$` |
| **`distinctUntilChanged`** | `epics/feed.ts` | Delete it from `outbound$` | A `subscribe` frame **four times a second**, one per tick |
| **Pause is one operator** | `epics/feed.ts` | Press **Pause feed**, watch both the WS Messages panel and the Redux log | Frames keep arriving on the socket — it is still open, which is the point — and **no** `feed/ticked` actions appear. Resume: the next tick lands, and nothing is replayed |
| **A row being saved is protected** | `inventory.ts` | Latency 4 s, edit a row, watch that row while it saves | The feed leaves it alone. Delete `if (state.rows[tick.id]) continue;` and the number you typed is overwritten while you wait |
| **A malformed frame** | `epics/deps.ts` | Make the mock send `ws.send('not json')` once | With the custom `deserializer`: one frame dropped, ticks continue. Remove it and the default `JSON.parse` kills the stream for good |
| **Graceful degradation** | `epics/feed.ts` | `npm run build && npm run preview`, then open the console | Badge: **Live feed unavailable**. The Redux log shows `connecting` then `offline`. Everything else on the page works, because the feed is `merge`d rather than sequenced |

### The tests

| Concept | Where it lives | Do this | You should see |
|---|---|---|---|
| **No clock** | `epics/epics.test.ts` | `npm test` | 25 tests in well under a second — including a 400 ms debounce, an 800 ms backoff and a 1.2 s delay |
| **`expectSubscriptions` proves cancellation** | `epics/epics.test.ts` | Read the `switchMap` test | `['^ 49ms !', '50ms ^ 100ms !']` — the first request was **unsubscribed at frame 50**, before it ever emitted. `expectObservable` alone could not tell you that |
| **A broken operator is caught** | `epics/epics.test.ts` | Change the inner `switchMap` to `mergeMap` | The cancellation test fails on the subscription log. **No other test notices** — which is why that one exists |
| **Off-by-one frames** | `epics/epics.test.ts` | Change `'l 49ms l 99ms d'` to `'l 49ms l 100ms d'` | *expected 151, received 150*. A value consumes its frame |

---

## 5. If you change X, Y breaks

The fastest way to convince yourself a concept is load-bearing is to break it.
Each of these is one line. Undo each before the next.

| Change this | …and this breaks | Why it matters |
|---|---|---|
| `fromAbortable` → `from(run(...))` | Cancelled requests keep running on the wire; the UI looks fine | A promise has no cancellation channel. Measured: 0 of 5 aborted, against 4 of 5 |
| Move `takeUntil` to the top level of `loadEpic` | The console works once, then never again, silently | An epic is one subscription; `takeUntil` completes it, and completed Observables do not restart |
| Delete the outer `switchMap` | Same symptom, same cause | The outer `switchMap` is what makes `takeUntil` end a *session* rather than the epic |
| Inner `switchMap` → `mergeMap` in `loadEpic` | The table and the pager disagree after slow-then-fast | Demo 24b's race, reintroduced in one word |
| `mergeMap` → `switchMap` in `saveStockEpic` | A row's spinner never stops | A cancelled inner stream emits no terminal action, so `rows[id]` is never cleared |
| Move `catchError` outside the inner pipe | One failure and no row ever saves again | An error that reaches the epic's own pipe completes it |
| Delete the root `catchError` in `epics/index.ts` | One bad property access anywhere stops **every** effect in the app | Measured: with two epics and an error in the first, the second stopped and never recovered |
| Delete `ignoreElements()` from `persistRecentEpic` | Junk in the action log; a locked tab if the epic also listens for what it emits | An epic dispatches everything it emits |
| `.concat(epicMiddleware)` → `.prepend(...)` | `action$` fills with thunk functions and no filter matches | The epic would sit upstream of `redux-thunk` |
| Move `runEpics()` above `configureStore` | Nothing works, with one console warning and no error | It is a warning, not a throw — the worst of both |
| `startWith(inventoryLoading())` above `retry` | The skeleton flickers three times on a failing load | Operator order is semantics |
| Remove the `throw error` from the retry `delay` | A 404 is requested three times | Rethrowing from the notifier is how you stop retrying |
| Delete `mergeMap`'s second argument in `bulk.ts` | Eight simultaneous PATCHes | The concurrency limit *is* the second argument |
| `merge(done$, of(request))` → `concat(of(request), done$)` | The bulk run hangs under a synchronous fake | `merge` subscribes left to right; listen before you speak |
| Move `failures` outside the `defer` | The second bulk run reports the first one's failures | `defer` gives each subscription its own closure |
| Create `socket$` outside the `switchMap` | One socket per tab that outlives the screen — and with `takeUntil` also removed, one per visit | Subscription *is* the lifecycle |
| Delete `distinctUntilChanged(sameIds)` | A `subscribe` frame four times a second | Every action re-emits the visible ids |
| Delete `resetOnSuccess: true` | A connection that drops once an hour ends up waiting thirty seconds every time | The backoff ladder never resets |
| Remove `Math.min(MAX_BACKOFF_MS, …)` | By attempt twenty you are waiting eleven days | `2 ** n` has no manners |
| Delete the resync `filter` on `reconnects > 0` | Every page load fetches twice | The first connection is not a re-connection |
| Delete `if (state.rows[tick.id]) continue;` | The feed overwrites a number the user is in the middle of saving | The user's intention outranks the server's opinion |
| Use `Date.now()` in the feed reducer | Time-travel through a tick gives a different answer each time | A reducer must be a pure function |
| Destroy non-matching sockets in `mockStockFeed.ts` | Vite's hot reload stops working | Vite's HMR socket is on the same server |

---

## Where next

- The **[guide](./README.md)** builds all of this in seven labs, publishes the
  lines-deleted-versus-added accounting at the end of Lab 4, and ends with a
  four-way comparison that does **not** recommend epics for data fetching.
- **[Demo 24b](../24b-redux-toolkit/)** is where this solution came from, and
  its RTK Query page is still in here.
- **[Demo 24a](../24a-advanced-zustand/)** is the identical console in Zustand.
- **[Demo 19](../19-tanstack-query-and-realtime/)** solves live updates a
  fourth way, with a query cache and a Server-Sent Events stream.
