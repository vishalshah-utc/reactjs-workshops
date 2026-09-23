# ShopScope — Demo 24c starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**
Prefer to read the finished code rather than build it? [`../WALKTHROUGH.md`](../WALKTHROUGH.md).

## Where you are starting from

**Demo 24b finished** — the Inventory Console at `/account/inventory` built on
Redux Toolkit (a `createAsyncThunk` with a status machine, a request id and an
`AbortController`; a `createEntityAdapter`; an optimistic inline edit;
`createListenerMiddleware` running a bulk restock with bounded concurrency, an
undo and a persistence effect) **and** the same fetching rebuilt in RTK Query
at `/account/inventory/rtkq`.

All of that still works. Nothing today deletes a reducer, a selector or a
component's rendering logic. Only the layer that decides *when* to talk to the
network is being replaced — first like for like, then extended.

**Already deleted for you**, because they are the thing being replaced:
`src/store/listeners.ts`, `src/store/extra.ts`,
`src/store/createAppAsyncThunk.ts` and `src/lib/concurrency.ts`. The guide
counts them at the end of Lab 4.

**Already written, so you only write the interesting part:**

- `vite/mockStockFeed.ts` — the mock WebSocket server, as a Vite dev-server
  plugin with `apply: 'serve'`. DummyJSON has no push channel of any kind, so
  the feed comes from the dev server you are already running. Read it in Lab 5.
- `src/lib/feedProtocol.ts` — the wire protocol and its type guard, imported by
  both ends.
- `src/store/rootReducer.ts` — the slice map, extracted, because typed
  middleware needs `RootState` and `RootState` used to come from the store.
  Lab 1 quotes the compiler error.
- `src/store/epics/types.ts` — the typed `AppEpic`, and a long comment about
  why `ofType` cannot narrow. Read it before Lab 2.
- The `feed-flash` keyframes in `src/index.css`, with a
  `prefers-reduced-motion` branch.
- The toolbar's dev-only **Simulated latency** select, unchanged.

**New dependencies:** `rxjs@7.8.2` and `redux-observable@3.0.0-rc.3`, plus
`ws@8.21.3`, `@types/ws@8.18.1` and `@types/node@22.20.3` as dev dependencies
for the mock server. Everything Demo 24b had stays.

> `3.0.0-rc.3` is deliberate. The last stable `redux-observable` is 2.0.0 from
> June 2021 and it peers on `redux >=4 <5`; Redux Toolkit 2 ships Redux 5. The
> guide weighs that properly in its closing section.

## What you build

Search for `TODO(lab-` — **twenty-nine markers**.

| Marker | File | What |
|---|---|---|
| `lab-1.1` | `src/lib/fromAbortable.ts` | make the request actually cancellable |
| `lab-1.2` | `src/store/epics/deps.ts` | the two product services, as Observables |
| `lab-1.3` | `src/store/epics/index.ts` | `combineEpics`, and the root error boundary |
| `lab-1.4` | `src/store/index.ts` | `.concat(epicMiddleware)`, then `runEpics()` after the store |
| `lab-1.5` | `src/routes/account/InventoryPage.tsx` | `consoleOpened` / `consoleClosed`, and nothing else |
| `lab-2.1` | `src/store/inventory.ts` | the load's three cases — and the eleven lines that are gone |
| `lab-2.2` | `src/store/epics/inventory.ts` | `loadEpic`: the outer `switchMap`, `merge`, `startWith`, the inner `switchMap` |
| `lab-2.3` | `src/store/epics/inventory.ts` | `retry({ count, delay })`, `catchError`, and `startWith` placed after it |
| `lab-2.4` | `src/store/epics/inventory.ts` | `takeUntil(consoleClosed)`, at the end of the **inner** pipe |
| `lab-2.5` | `src/components/inventory/InventoryToolbar.tsx` | delete the debounce hook, the draft and the reconciliation |
| `lab-3.1` | `src/store/epics/inventory.ts` | `saveStockEpic` — and why `mergeMap` and not the other three |
| `lab-3.2` | `src/store/inventory.ts` | the three save cases: optimistic, confirm, roll back |
| `lab-3.3` | `src/components/inventory/StockCell.tsx` | dispatch a plain action, not a thunk |
| `lab-4.1` | `src/store/epics/bulk.ts` | bulk restock: `switchMap` + `mergeMap(fn, 4)`, using `action$` as the completion signal |
| `lab-4.2` | `src/store/epics/bulk.ts` | undo, the same shape in reverse |
| `lab-4.3` | `src/store/epics/persist.ts` | persistence, and the mandatory `ignoreElements()` |
| `lab-5.1` | `src/store/epics/deps.ts` | `openFeed` with `webSocket()` and a safe `deserializer` |
| `lab-5.2` | `src/store/epics/feed.ts` | the connection: `switchMap`, `inbound$`, `takeUntil` |
| `lab-5.3` | `src/store/feed.ts` | the feed slice — and the server's clock, not yours |
| `lab-5.4` | `src/store/inventory.ts` | ticks into the entity adapter, and the mid-save guard |
| `lab-5.5` | `src/components/inventory/StockCell.tsx` | the highlight |
| `lab-5.6` | `src/store/epics/feed.ts` | `flashClearEpic` — `delay` inside `mergeMap` |
| `lab-6.1` | `src/store/epics/feed.ts` | reconnection: `retry({ delay })`, backoff, and the status Subject |
| `lab-6.2` | `src/store/epics/feed.ts` | back-pressure with `bufferTime`, and coalescing |
| `lab-6.3` | `src/store/epics/feed.ts` | outbound multiplexing off `state$` |
| `lab-6.4` | `src/store/epics/feed.ts` | the pause `filter`, the resync, and the `catchError` of last resort |
| `lab-6.5` | `src/components/inventory/FeedBar.tsx` | the status bar |
| `lab-7.1` | `src/store/epics/epics.test.ts` | marble tests with `TestScheduler` |
| `lab-7.2` | `src/store/inventory.test.ts` | the reducer tests, mostly unchanged from Demo 24b |

## Finished version

[`../solution`](../solution) — everything above, done, with no markers.

This demo is **not** a link in the chain: nothing follows it, and it writes no
"next starter". Its companions are
[`../../24b-redux-toolkit`](../../24b-redux-toolkit) (its own starter),
[`../../24a-advanced-zustand`](../../24a-advanced-zustand) and
[`../../19-tanstack-query-and-realtime`](../../19-tanstack-query-and-realtime).

## Before you start

Install the **Redux DevTools** browser extension, and find your browser's
**Network → WS** filter — it has a **Messages** panel listing every WebSocket
frame in and out, and half of Labs 5 and 6 is watched there.

Sign in as `emilys` / `emilyspass`; the console is admin-only.

Reads are real. DummyJSON **simulates** writes: a `PATCH` returns a correct
response and persists nothing. **The live feed is a mock**, served by the Vite
dev server, and it exists on `npm run dev` and nowhere else.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build · npm run preview · npm test
```

Node 22.22+.
