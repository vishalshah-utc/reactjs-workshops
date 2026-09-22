# ShopScope — Demo 24b, finished

**This is the finished demo.** Every `TODO(lab-…)` from
[`../starter`](../starter) is done; there are no markers left in `src/`.

```bash
npm install
npm run dev              # http://localhost:5173
npm test                 # 12 tests, ~400 ms, no browser
npm run build && npm run preview
```

**Reading rather than building?** [`../WALKTHROUGH.md`](../WALKTHROUGH.md) tours
this code file by file and gives you a concept-to-observation table so you can
watch every idea happen in the browser. The
[demo guide](../README.md) is the seven-lab version.

## What is in here

ShopScope as Demo 14 left it, plus the **Inventory Console** — an admin-only
screen at `/account/inventory` built on Redux Toolkit, and then built a second
time on RTK Query at `/account/inventory/rtkq`.

**Install the Redux DevTools extension and sign in as `emilys` / `emilyspass`**
before you try any of this.

| Try | Where |
|---|---|
| Time-travel: do five things, then drag the slider back | Redux devtools, anywhere |
| A status machine that cannot contradict itself | `/account/inventory`, `src/store/inventory.ts` |
| A request deduped before it starts (`condition`) | Simulated latency → 2 s, click one page number three times |
| A request aborted mid-flight (`signal`) | Latency → 4 s, type, then type again |
| A stale response discarded (`requestId`) | Latency → 4 s, search, then click page 2 |
| Normalised `ids` + `entities`, and one row re-rendering | devtools **State** tab; React DevTools highlight-updates |
| An optimistic edit, and a rollback with the server's own message | edit a stock cell; point `updateProduct` at id `9999` to fail it |
| Bulk restock with bounded concurrency, partial failure and undo | select rows → **+10 stock to selected** |
| A persisted list with a real v1 → v2 migration | click product titles; `shopscope.inventory.recent` in Local Storage |
| One sign-out action resetting three slices — and leaving the Zustand cart alone | **Sign out**, with the devtools **Diff** tab open |
| RTK Query on the app's own axios client, with tags and invalidation | `/account/inventory/rtkq` |
| The same feature, 113 hand-written lines against 70 declared ones | `src/store/inventory.ts` next to `src/api/inventoryApi.ts` |

Everything Demo 14 shipped still works and is untouched: the catalogue, search,
filters and paging in the URL, the detail page and its scoped 404, sign-up, the
refresh queue, the dark theme, toasts, protected routes and roles, and the
**Zustand** cart and wishlist. Two state libraries, one app, on purpose.

> Reads are real. DummyJSON **simulates** writes: a `PATCH` returns a correct
> response — the whole merged product — and persists nothing, so a reload puts
> every number back. The mechanism is real; the durability is not.

## Where this sits

Demo 24b is a branch of the track, not a link in the chain: nothing follows it
and it writes no "next starter".

- [`../../24a-advanced-zustand`](../../24a-advanced-zustand) — the identical
  console, built in Zustand. Read the two `src/store/` directories side by side.
- [`../../24c-redux-observable-and-rxjs`](../../24c-redux-observable-and-rxjs) —
  takes *this* solution as its starter, replaces `src/store/listeners.ts` with
  RxJS epics, then adds a live WebSocket feed.

Node 22.22+.
