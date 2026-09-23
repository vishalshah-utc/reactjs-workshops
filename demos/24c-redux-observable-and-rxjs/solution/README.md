# ShopScope — Demo 24c, finished

**This is the finished demo.** Every `TODO(lab-…)` from
[`../starter`](../starter) is done; there are no markers left in `src/`.

```bash
npm install
npm run dev              # http://localhost:5173
npm test                 # 25 tests, under a second, no browser and no clock
npm run build && npm run preview
```

**Reading rather than building?** [`../WALKTHROUGH.md`](../WALKTHROUGH.md)
tours this code file by file and gives you a concept-to-observation table —
which matters more here than usual, because a stream is invisible until you
know where to look. The [demo guide](../README.md) is the seven-lab version.

## What is in here

Demo 24b's Inventory Console, with its entire side-effect layer rewritten as
**RxJS epics** — and then extended with a **live WebSocket stock feed** that
the thunk version could not have done.

The RTK Query page at `/account/inventory/rtkq` is still here, untouched, on
purpose: the guide's closing argument is that for plain data loading, *that*
page is the better answer.

**Install the Redux DevTools extension, find your Network tab's WS filter, and
sign in as `emilys` / `emilyspass`** before you try any of this.

| Try | Where |
|---|---|
| Numbers moving on their own, with a green/red flash | `/account/inventory`, just watch |
| Every frame in and out, with timestamps | Network → **WS** → `/__dev/feed` → **Messages** |
| A request cancelled at the socket by `switchMap` | Latency 4 s, type, then page — it goes red |
| One request for eight keystrokes, and eight actions in the log | type `lipstick` with Network and Redux open |
| Three attempts at 0, 400 ms and 1200 ms, one spinner | turn Wi-Fi off and reload |
| A reconnect ladder at 0.5 s, 1 s, 2 s, 4 s, 8 s | `Ctrl-C` the dev server and watch the badge |
| A resync after that reconnect, because deltas are gone | Fetch/XHR, right after it goes **Live** |
| A `subscribe` frame following the visible rows | tick **Low stock**, watch WS → Messages |
| A pause that is one `filter` | **Pause feed** — frames keep arriving, actions stop |
| Bounded concurrency you can count | latency 2 s, select eight rows, **+10 stock** |
| Honest partial failure and a real undo | point `updateProduct` at `9999`, then **Undo** |
| A feed that cannot overwrite a row you are editing | latency 4 s, edit a row, watch it |
| Graceful degradation with no server | `npm run build && npm run preview` |
| Timing asserted in nine milliseconds | `npm test`, then read `src/store/epics/epics.test.ts` |
| The same feature, two effect layers, 231 lines against 299 | this `src/store/epics/` next to Demo 24b's `src/store/listeners.ts` |

Everything Demo 24b shipped still works and is untouched: the catalogue, the
detail page, sign-up, the refresh queue, the dark theme, toasts, protected
routes and roles, the RTK Query cache, and the **Zustand** cart and wishlist.
Four ways of reaching the network now live in one store — RTK Query, epics,
thunks (under RTK Query) and slices — and they do not fight.

> Reads are real. DummyJSON **simulates** writes: a `PATCH` returns the whole
> merged product and persists nothing, so a reload puts every number back.
> **The live feed is a mock** served by `vite/mockStockFeed.ts`, a Vite plugin
> with `apply: 'serve'` — DummyJSON has no WebSocket endpoint. In a production
> build the endpoint does not exist, the epic's `catchError` of last resort
> fires, and the badge reads *"Live feed unavailable"* while everything else
> carries on.

## Where this sits

Demo 24c is a branch of the track, not a link in the chain: nothing follows it
and it writes no "next starter".

- [`../../24b-redux-toolkit`](../../24b-redux-toolkit) — this demo's starter,
  and where the effects came from.
- [`../../24a-advanced-zustand`](../../24a-advanced-zustand) — the identical
  console with no Redux at all.
- [`../../19-tanstack-query-and-realtime`](../../19-tanstack-query-and-realtime)
  — live updates a fourth way, with a query cache and Server-Sent Events.

Node 22.22+.
