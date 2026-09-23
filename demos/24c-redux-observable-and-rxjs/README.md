# Demo 24c — Redux-Observable, RxJS and a WebSocket Stream

**Demo guide** · ~195 minutes · the same effects as streams, and then the thing streams are for

> 📖 New here? [`WALKTHROUGH.md`](./WALKTHROUGH.md) reads the finished solution
> instead of building it. Open that if you want the concepts in forty minutes
> without doing the labs.

---

## Where you are starting from

The starter is **Demo 24b finished**: ShopScope with the Inventory Console at
`/account/inventory`, built on Redux Toolkit. A `createAsyncThunk` with a
status machine, a request id and an `AbortController`. A `createEntityAdapter`
and memoised selectors. An optimistic inline edit with a rollback.
`createListenerMiddleware` running a bulk restock with bounded concurrency, an
undo and a persistence effect. And the same fetching rebuilt a second time in
RTK Query at `/account/inventory/rtkq`, on a custom `baseQuery` over the app's
own axios client.

All of that still works. Nothing in this demo deletes a reducer, a selector or
a component's rendering logic. **Only the layer that decides *when* to talk to
the network is being replaced** — first like for like, so the comparison is
fair, and then extended to do something the old layer could not do at all.

New, stubbed, waiting for you: `src/store/epics/` (`index.ts`, `types.ts`,
`deps.ts`, `inventory.ts`, `bulk.ts`, `persist.ts`, `feed.ts`),
`src/store/feed.ts`, `src/lib/fromAbortable.ts` and
`src/components/inventory/FeedBar.tsx`.

Deleted before you arrived, because they are the thing being replaced:
`src/store/listeners.ts`, `src/store/extra.ts` and
`src/store/createAppAsyncThunk.ts`. `src/lib/concurrency.ts` is gone too. Keep
the list; Lab 4 counts it.

Already written, so you only write the interesting part:

- **`vite/mockStockFeed.ts`** — the mock WebSocket server, sixty lines, as a
  Vite dev-server plugin. DummyJSON has no push channel of any kind, so the
  feed is served by the dev server you are already running. Read it in Lab 5;
  you do not have to write it.
- **`src/lib/feedProtocol.ts`** — the wire protocol, imported by both ends, so
  a change to a message shape is a compile error rather than a runtime
  mismatch.
- **`src/store/rootReducer.ts`** — the slice map, extracted. Lab 1 explains the
  compiler error that forced it.
- **`src/store/epics/types.ts`** — the typed `AppEpic`, and a long comment
  about `ofType` that is worth reading before Lab 2.
- The `feed-flash` keyframes in `src/index.css`, including a
  `prefers-reduced-motion` branch.

**New dependencies:** `rxjs@7.8.2` and `redux-observable@3.0.0-rc.3` as
dependencies, `ws@8.21.3` and `@types/ws@8.18.1` as dev dependencies for the
mock server, and `@types/node@22.20.3` so `tsconfig.node.json` can typecheck
it. Everything Demo 24b had stays, including `zustand@5.0.15`, `@reduxjs/toolkit@2.12.0`
and the RTK Query cache.

> **That `-rc.3` is not a typo, and it is a real decision.** The last stable
> `redux-observable` is **2.0.0, published in June 2021**, and it peers on
> `redux >=4 <5`. Redux Toolkit 2 ships Redux 5. The only release that peers on
> `redux >=5 <6` is **3.0.0-rc.3**, a release candidate — which is, oddly, what
> npm's `latest` tag points at. All of that was read from the npm registry
> while writing this guide, not remembered. The closing section weighs it
> properly; it belongs beside the technical merits, not under them.

## What you ship today

**Half one: the same features, expressed as streams.** Every effect Demo 24b
wrote as a thunk or a listener, rewritten as an epic, feature for feature, with
the line count published at the end of Lab 4. You will delete a hand-rolled
request id, a hand-rolled debounce hook, a hand-rolled bounded-concurrency
helper and a hand-rolled cancellation protocol, and replace each with one
operator. You will also add sixty-eight lines of wiring you did not have
before, and the guide says so out loud.

**Half two: a live feed, which the thunk version could not have done.** A
persistent WebSocket streaming stock and price changes for the products on
screen — opened when the console mounts, closed by `takeUntil`, reconnecting
with exponential backoff, coalescing bursts with `bufferTime`, multiplexing its
subscription as the visible set changes, pausable with one operator, and
landing in the entity adapter from Demo 24b with a visible highlight so you can
watch messages arrive.

Then marble tests for the epics with `TestScheduler`, and a four-way
comparison — thunks, listener middleware, epics, RTK Query — that does not
recommend epics for ordinary data loading, because they are not the best tool
for it.

By the end you will be able to answer, without hesitating:

- What an epic is, in one sentence, and why it must never emit the action it listened for
- Why `from(promise)` compiles, passes every test, and does not cancel anything
- Which of `switchMap`, `mergeMap`, `concatMap` and `exhaustMap` a given effect needs, and what each one breaks
- Why `takeUntil` at the top level of an epic kills that epic for the lifetime of the store
- Where `retry({ delay })` beats a `for` loop, and where a hand-written backoff is still right
- What a `WebSocketSubject` gives you that `new WebSocket()` does not
- What to do about the messages you missed while you were disconnected
- How to read and write a marble diagram, and what `expectSubscriptions` proves that `expectObservable` cannot
- When epics are the right answer — and why, for plain data loading, RTK Query beats them

> **The point of today is not "RxJS is better".** It is that streams are a
> different *shape* of problem from requests, and that a library built for
> streams wins decisively on streams and loses politely on requests. The last
> section says which is which.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24c-redux-observable-and-rxjs/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/24c-redux-observable-and-rxjs/starter && npm install && npm run dev`.

You need the **Redux DevTools** browser extension again — it is still where
half of this is watched — and this time you also need the **Network** tab's
**WS** filter, which is a tab most people have never opened. Chrome and Firefox
both show a WebSocket connection there with a **Messages** panel listing every
frame in and out, with timestamps. That panel is the whole of Lab 6's Verify.

Sign in as **`emilys` / `emilyspass`** and open `/account/inventory`.

When the dev server starts it prints one extra line:

```
  ➜  mock stock feed:  ws://localhost:5173/__dev/feed
```

That is the mock. It exists on `npm run dev` and nowhere else.

---

## The cold open

Do this on the **finished** app. Open
`demos/24c-redux-observable-and-rxjs/solution`, run it, sign in as `emilys`,
go to `/account/inventory`, and then do nothing at all for thirty seconds.

Numbers start moving on their own. Rows flash green and red as their stock
changes underneath you. The header's "units on this page" total drifts. The
badge above the table says **Live**, and a counter next to it climbs.

Now three things, in order.

**1. Open the Network tab and switch the filter to WS.** There is exactly one
connection, to `/__dev/feed`. Click it, open **Messages**, and you can read the
conversation: one `subscribe` frame going out with the twelve product ids on
screen, and a `tick` frame coming back roughly once a second.

**2. Change a filter — tick "Low stock".** In the Messages panel a *new*
`subscribe` frame goes out with a shorter list of ids. Nobody wrote an effect to
do that. The outbound half of the feed epic is four operators over `state$`, and
the visible ids are a memoised selector you already had.

**3. Now kill the mock server.** In the terminal running `npm run dev`, press
`Ctrl-C`. Watch the badge: **Live** → **Reconnecting…**. Watch the Network WS
tab: a new connection attempt, then another, then another, at 0.5 s, 1 s, 2 s,
4 s, 8 s. Start the server again with `npm run dev` and within one backoff
window the badge goes back to **Live**, the ticks resume — and a `GET /products`
appears in the Fetch/XHR tab, because a feed sends deltas and the ones you
missed are gone for ever.

Count what you did not write. No `addEventListener('message')`. No
`removeEventListener`. No `onclose` handler. No reconnect timer. No attempt
counter. No `useEffect` cleanup. No "am I still mounted?" guard.

Here is the entire connection:

```ts
const socket$ = deps.openFeed();

const inbound$ = socket$.pipe(
  tap(() => status$.next('live')),
  retry({ delay: (_e, n) => timer(Math.min(30_000, 500 * 2 ** (n - 1))),
          resetOnSuccess: true }),
  filter(isFeedServerMessage),
  filter(() => !selectFeedPaused(state$.value)),
  bufferTime(250),
  map(coalesce),
);

return merge(inbound$, outbound$, resync$, status$.pipe(map(feedStatusChanged)))
  .pipe(takeUntil(action$.pipe(filter(consoleClosed.match))));
```

Subscribing opens the socket. Unsubscribing closes it. `takeUntil` is the
unmount. `retry` is the reconnect. There is no lifecycle to manage because the
lifecycle *is* the subscription.

Now go back to `/account/inventory/rtkq` — the RTK Query page from Demo 24b,
still there, still working — and ask the other half of today's question: *for
loading a page of products, would an epic have been better than that?*

It would not. That is the second half of this guide's argument, and the
comparison at the end says it plainly.

---

## Lab 1 — The epic middleware, wired beside what you have (25 min)

### Problem

You have a working store. You want a second side-effect layer in it without
breaking the first, because a migration you cannot do one feature at a time is
a rewrite, and nobody signs off a rewrite.

So the question for this lab is narrow: what is the smallest change to
`configureStore` that makes epics possible, and what does the compiler do to
you on the way?

### Concept

**An epic is a function from a stream of actions to a stream of actions.**

```ts
type Epic = (action$, state$, dependencies) => Observable<Action>;
```

Every action that reaches the reducers is pushed into `action$`. Everything an
epic emits is dispatched. That is the whole contract, and two consequences
follow from it immediately.

**An epic must never emit the action it listened for.** That is a dispatch
loop with no brake. Measured, in a test rigged with a counter that threw at
six: six synchronous dispatches before the guard fired. In a browser it locks
the tab. When an epic is a pure sink — a persistence effect, a logger — end it
with `ignoreElements()`.

**An error that escapes an epic ends that subscription for ever.** An epic is
one subscription created once, for the life of the store. Also measured: with
two epics combined and an error thrown in the first, the second stopped ticking
immediately and never recovered. The UI keeps rendering, so it presents as a
mysterious hang rather than a crash. Lab 2 puts a `catchError` inside each
epic; this lab puts one round the root as a net.

**Where the middleware goes in the chain, and why it is not where the listener
middleware went.**

```text
  dispatch(action)
        │
        ▼
  ┌───────────────────────────────────────────────────────────┐
  │  1. redux-thunk        a function? call it. an object?    │
  │                        pass it on.                        │
  ├───────────────────────────────────────────────────────────┤
  │  2. serializable /     development only, stripped from a  │
  │     immutable checks   build                              │
  ├───────────────────────────────────────────────────────────┤
  │  3. epicMiddleware     .concat(...)  ── passes the action │
  │                        straight on, THEN pushes it into   │
  │                        action$ once the reducers are done │
  ├───────────────────────────────────────────────────────────┤
  │  4. inventoryApi       RTK Query's own middleware         │
  └───────────────────────────┬───────────────────────────────┘
                              ▼
                      reducer(state, action)
                              │
                              ▼  new state, then…
                    state$.value updated
                    action$.next(action)
                              │
                              ▼
                    epics react  ──► dispatch(...)  ──► back to the top
```
*Figure 1 — the epic middleware's position. It forwards first and publishes
second, which is why `state$.value` inside an epic is always the state AFTER
the action that woke it.*

Demo 24b **prepended** the listener middleware so a listener could see an
action before a thunk dispatched from it ran. The epic middleware must be
**concatenated**. This was tested rather than assumed: log every value
`action$` emits and then dispatch a thunk.

```text
  .concat(epicMiddleware)    action$ saw:  ["inventory/loaded"]
  .prepend(epicMiddleware)   action$ saw:  ["inventory/loaded", <function>]
```

With `prepend` the epic sits upstream of `redux-thunk`, so it is handed the raw
thunk *function* — which is not an action, will not match any filter, and will
sit in your `action$` looking like nothing at all. `concat`.

**`run()` goes after the store, and getting it wrong does not throw.** Also
tested. Call `epicMiddleware.run(rootEpic)` before `configureStore` and
redux-observable 3.0.0-rc.3 prints:

```
redux-observable | WARNING: epicMiddleware.run(rootEpic) called before the
middleware has been setup by redux. Provide the epicMiddleware instance to
createStore() first.
```

…and then every epic is silently inert for the life of the application. A
warning in a noisy console plus an app where nothing loads is worse than an
exception. Recognise it on sight.

**`from(promise)` does not cancel, and this is the trap of the whole demo.**

RxJS will happily wrap a promise, and the result looks like an Observable in
every way that matters until you unsubscribe from it. A promise has no
cancellation channel: unsubscribing stops you *hearing* the answer and does
nothing to the request. So `switchMap` over `from(fetch(...))` gives you
latest-wins in the store and leaves every superseded request running on the
wire — which is exactly the bug you adopted RxJS to fix.

Measured, over five overlapping requests with a real `AbortController` on the
other side:

```text
  from(promise)     requests started = 5    aborted = 0
  fromAbortable     requests started = 5    aborted = 4
```

An Observable, unlike a promise, hands you a **teardown function**:

```ts
return new Observable<T>((subscriber) => {
  const controller = new AbortController();
  run(controller.signal).then(
    (value) => { subscriber.next(value); subscriber.complete(); },
    (error) => { if (!controller.signal.aborted) subscriber.error(error); },
  );
  return () => controller.abort();          // ← runs on unsubscribe
});
```

**`dependencies` is `extraArgument` with a new name.**
`createEpicMiddleware({ dependencies })` hands one object to every epic as its
third argument, for exactly the reasons Demo 24b's `extra` existed: the API
layer is declared once, and a test hands the epics a different object without
`vi.mock`. What changes is the *shape* — a thunk awaited a promise, an epic
composes an Observable — so the conversion happens once, at that boundary.

**And TypeScript says something you should read before you write an epic.**
`src/store/epics/types.ts` is given to you, and its comment is the lab:

```ts
export type AppEpic = Epic<UnknownAction, UnknownAction, RootState, EpicDeps>;
```

`Input` is `UnknownAction` because `action$` genuinely carries every action in
the app — yours, RTK Query's internals, and whatever a future library adds.
The consequence bites immediately:

```ts
action$.pipe(ofType('inventory/loaded'), map((a) => a.payload))
//                                                    ^^^^^^^
// error TS2339: Property 'payload' does not exist on type 'never'.
```

That error was provoked, not imagined. `ofType<Input, Type, Output =
Extract<Input, Action<Type>>>` narrows by extracting from the input union, and
`Extract<UnknownAction, Action<'x'>>` is `never` because `UnknownAction['type']`
is `string`, not `'x'`. `ofType` only narrows usefully when `Input` is a
hand-maintained union of every action in your app — which is exactly the file
that rots.

Redux Toolkit already solved this. Every action creator carries a `.match` type
guard, and RxJS's `filter` narrows on a type guard:

```ts
action$.pipe(filter(inventoryLoaded.match), map((a) => a.payload.total))
//                                                              ^^^^^ number
```

So: recognise `ofType`, because every redux-observable tutorial and every
pre-RTK codebase uses it. Write `filter(creator.match)` and
`filter(isAnyOf(a, b))`.

**One more compiler error, which forced a new file.** Typed middleware needs
`RootState`; the store's type needs the middleware; `RootState` was
`ReturnType<typeof store.getState>`. Provoked:

```
error TS2456: Type alias 'RootState' circularly references itself.
```

The fix is `src/store/rootReducer.ts`: define the state with
`combineReducers` so it depends only on the slices. `RootState` means exactly
what it meant before and every other file imports it from `src/store`
unchanged. It is the standard answer whenever typed middleware meets an
inferred root state, and it costs one file.

### Steps

**A. `src/lib/fromAbortable.ts` — `TODO(lab-1.1)`**

The stub ships the `from(promise)` version so you can watch it fail. Replace
it with the Observable above.

**B. `src/store/epics/deps.ts` — `TODO(lab-1.2)`**

```ts
export const epicDeps: EpicDeps = {
  listProducts: (options) => fromAbortable((signal) => listProducts({ ...options, signal })),
  updateProduct: (id, patch, delayMs) =>
    fromAbortable((signal) => updateProduct(id, patch, { signal, delayMs })),
  openFeed: () => { /* Lab 5 */ },
};
```

Note what is *not* imported: axios, `endpoints`, `ApiError`. The epics talk to
`api/services`, which is the boundary Demos 5–8 built — the same boundary the
thunks used.

**C. `src/store/epics/index.ts` — `TODO(lab-1.3)`**

```ts
export const rootEpic = combineEpics<UnknownAction, UnknownAction, RootState, EpicDeps>(
  loadEpic, saveStockEpic, bulkRestockEpic, bulkUndoEpic, persistRecentEpic,
  feedEpic, flashClearEpic, feedLogEpic,
);

const resilientRootEpic: AppEpic = (action$, state$, deps) =>
  rootEpic(action$, state$, deps).pipe(
    catchError((error, source) => {
      logger.error('[epics] an epic threw and was restarted', error);
      return source;                 // resubscribe: the net, not the design
    }),
  );
```

Add epics to that list as you write them. `combineEpics` is `combineReducers`
for effects: same three arguments to each, outputs merged, order irrelevant,
and the only way they can talk to each other is through the action stream —
which is the right constraint.

**D. `src/store/index.ts` — `TODO(lab-1.4)`**

```ts
    .concat(epicMiddleware)          // AFTER the thunk middleware. Not prepend.
    .concat(inventoryApi.middleware),
```

and, below the store:

```ts
runEpics();                          // AFTER configureStore. Never before.
```

`thunk` stays on, deliberately. RTK Query is built on thunks, so turning them
off would break the cache — and more usefully, thunks and epics coexist. An app
can adopt epics for its streams and leave a one-shot thunk where it is.

**E. `src/routes/account/InventoryPage.tsx` — `TODO(lab-1.5)`**

```tsx
useEffect(() => {
  dispatch(consoleOpened());
  return () => { dispatch(consoleClosed()); };
}, [dispatch]);
```

The effect did not disappear. It stopped knowing anything: no filters in the
dependency array, no promise, no `.abort()`, no idea a request exists.

### Verify

1. `npm run dev`, sign in as `emilys`, open `/account/inventory`. The page is
   empty and says nothing is loading — correct: no epic loads anything yet.
2. The Redux log shows `inventory/consoleOpened` when you arrive and
   `inventory/consoleClosed` when you navigate away. Those two actions are the
   entire lifecycle contract for the rest of the demo.
3. **Break the order on purpose.** Move `runEpics()` above `configureStore`.
   Reload. No exception; one console warning, quoted above; and nothing works
   for the rest of the session. Put it back.
4. **Break it the other way.** Change `.concat(epicMiddleware)` to
   `.prepend(...)`, add `tap(console.log)` as the first operator of a
   throwaway epic, and dispatch something on the products page (which uses a
   route action, and therefore a thunk under the hood). You will see a raw
   function in the log. Put it back.
5. In `src/store/epics/types.ts`, change one epic to use
   `ofType('inventory/loaded')` and then read `action.payload`. `tsc` says
   *"Property 'payload' does not exist on type 'never'"*. Change it to
   `filter(inventoryLoaded.match)` and the payload types itself.

### Watch out

- **`from(promise)`.** It compiles, it passes the marble tests in Lab 7, and it
  leaves cancelled requests running. If cancellation matters — and `switchMap`
  is a promise that it does — the source must own a teardown.
- **`prepend` instead of `concat`.** Your `action$` fills with thunk functions
  and none of your filters match. See the measurement above.
- **`run()` before the store.** A warning, not an error, and then silence.
- **An epic with no `ignoreElements()` that emits what it listened for.** A
  locked tab, immediately.
- **No `catchError` anywhere.** One bad property access and your entire
  application stops doing anything asynchronous, with no error boundary to
  catch it, because the failure is in a subscription and not in a render.
- **Defining `RootState` from the store when middleware is typed against it.**
  `TS2456`, and the fix is a `combineReducers` file, not a cast.

### Challenge (2 min)

Add a two-line epic that logs every action type to the console with
`tap` + `ignoreElements()`, put it in `rootEpic`, and watch the order in which
RTK Query's internal actions and yours arrive. Then delete the
`ignoreElements()` and see how fast your tab stops responding. (Have the tab
close ready.)

### In the real world

The migration story is the reason this lab exists in this shape. You do not
replace a side-effect layer in one commit; you add a second one, move a
feature, ship, and repeat. Demo 24b's listener middleware could have stayed in
this store alongside the epics for as long as it took — the store takes as many
middlewares as you give it. It was deleted here only because comparing the two
is the point of the demo.

### Further reading

- [Setting up the middleware](https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware) — `createEpicMiddleware`, `run`, and where it goes in the chain
- [Epics](https://redux-observable.js.org/docs/basics/Epics) — the definition, and why an epic must not emit what it received
- [Injecting dependencies into epics](https://redux-observable.js.org/docs/recipes/InjectingDependenciesIntoEpics) — the `dependencies` option, and testing with it
- [`combineEpics`](https://redux-observable.js.org/docs/api/combineEpics) — the API page
- [RxJS: `Observable`](https://rxjs.dev/api/index/class/Observable) — the constructor, the subscriber, and the teardown function
- [RTK: `getDefaultMiddleware`](https://redux-toolkit.js.org/api/getDefaultMiddleware) — `prepend` vs `concat`, and why the tuple type matters

---

## Lab 2 — The load, as a stream (40 min)

### Problem

Demo 24b's load worked, and it cost this:

- a `createAsyncThunk` with a `condition` guard;
- `currentRequestId` and `pendingKey` in the slice state;
- a `filtersKey()` function to compute a request's identity;
- a `requestId` comparison at the top of `fulfilled` **and** of `rejected`;
- an `if (action.meta.aborted) return;` branch;
- an `addMatcher` to clear `pendingKey` afterwards;
- a five-line `useEffect` that dispatched and returned `promise.abort()`;
- a 33-line `useDebouncedCallback` hook, a local draft in the toolbar and an
  adjust-during-render block to reconcile the two.

Every one of those lines is correct. Together they say one sentence: **only the
newest request may write, and do not ask until the user stops typing.**

RxJS has that sentence.

### Concept

**The four flattening operators, on one identical input.**

This is the diagram to memorise. The outer stream emits three values; each one
starts an inner Observable that takes 30 ms and then emits a result and
completes. The only difference between the four rows is which operator flattens
them.

```text
  outer$        --a-----b--c--------------------------
  inner (any)   ---------------A|      (30ms, then one value)

  switchMap     --[a....X       a is CANCELLED at b
                        [b..X   b is CANCELLED at c
                           [c......C]
                out       ------------------C---------
                "latest wins; the losers are unsubscribed"

  mergeMap      --[a......A]
                        [b......B]
                           [c......C]
                out       --------A---B---C-----------
                "all at once; order of arrival, not of asking"

  concatMap     --[a......A]
                           [b......B]
                                    [c......C]
                out       --------A--------B-------C--
                "one at a time; every one runs, in order"

  exhaustMap    --[a......A]
                        b and c are DROPPED while a runs
                out       --------A-------------------
                "first wins; everything during it is ignored"
```
*Figure 2 — the same three requests, four operators. Pick by answering: if a
second one starts while the first is running, what should happen to the first?*

Four answers, four operators:

| If a new one starts while the old is running… | Operator | Typical use |
|---|---|---|
| cancel the old one, it is obsolete | `switchMap` | search, filters, navigation |
| let both run, they are independent | `mergeMap` | per-row writes, fan-out |
| queue it behind the old one | `concatMap` | ordered writes, a log |
| ignore the new one until the old finishes | `exhaustMap` | a submit button, login |

Getting this wrong is the single most common RxJS bug, and it is silent.
`mergeMap` where you wanted `switchMap` is a race; `switchMap` where you wanted
`mergeMap` is a request that vanishes.

**The race, with `switchMap`, in detail.**

```text
 t0   user types "lip"     dispatch searchChanged
      └─ debounceTime 400ms starts
 t400 fires ───────────────► switchMap subscribes inner A
                             fromAbortable creates controller A
                             GET /products?q=lip          (slow, 2 s)

 t900 user clicks page 2   dispatch pageChanged
 t900                       switchMap UNSUBSCRIBES A
                             │  teardown runs
                             │  controllerA.abort()
                             │  axios cancels        ◄── RED in Network
                             └─ subscribes inner B
                             GET /products?skip=12        (fast, 200 ms)

 t1100                       B emits ──► inventoryLoaded(page 2)   ✔
 t2400                       A would have answered here.
                             Nothing is subscribed. Nothing happens.   ✔
```
*Figure 3 — `switchMap` cancels at the socket AND at the subscription, so a
stale answer has nowhere to land. This is `currentRequestId`, `pendingKey`,
`filtersKey`, `condition` and the `addMatcher`, all at once.*

Notice there is no state to discard a stale response with, because a stale
response is never delivered. Demo 24b needed the request-id check because
`abort()` cannot un-send a response already on the wire; `switchMap` does not
need it because it is not listening.

**`debounceTime` in the effect layer, not the component.** A debounce is a
statement about *when to ask the server*, which makes it an effect-layer
concern that happened to be living in a component because a component was the
only place with a timer. Moving it costs one operator and deletes the hook, the
draft and the reconciliation.

```text
  keystrokes   -l-i-p---s-------------------------
  debounceTime(400)
               ----------------------|400ms|------
  fires                              ------------X
```
*Figure 4 — `debounceTime` emits only after a quiet period. One request for
four keystrokes.*

Be honest about the trade: the store now records `filters/searchChanged` once
per character instead of once per pause. You moved the noise from the network
to the devtools log. That is the better place for it — the log is a development
tool, the network is the user's — but it is a trade.

And note the *selective* debounce. Only the search box needs it; a dropdown
should refetch at once. RxJS expresses that with `merge`:

```ts
merge(
  action$.pipe(filter(searchChanged.match), debounceTime(400)),
  action$.pipe(filter(isAnyOf(categoryChanged, sortChanged, pageChanged, …))),
)
```

Two streams, two policies, one output. That is the shape you cannot get from a
single `useEffect` with a dependency array.

**`retry({ count, delay })`, and why the callback returns an Observable.**

```text
  attempt 1   [====X]  fails at 10ms
              wait 400ms  ├──────────────┤
  attempt 2                [====X] fails
              wait 800ms          ├──────────────────────────┤
  attempt 3                                        [====X] fails
                                            give up ──► inventoryFailed
  t=0        10      410   420           1220  1230
```
*Figure 5 — `retry({ count: 2, delay })` with exponential backoff. Measured in
Lab 7's marble test, which asserts those exact frames.*

`src/lib/retry.ts` is the hand-written equivalent this replaces: forty lines
with a loop, an attempt counter, a retryability predicate, a jittered
`setTimeout` and an abort check. **It has not been deleted** — the public
catalogue's route loader still uses it, and a loader is not an epic. What has
been deleted is the need to write it again.

The `delay` callback returns an **Observable**, and `retry` waits for it to
emit. That is the part a `for` loop cannot do:

```ts
delay: (error, attempt) => timer(400 * 2 ** (attempt - 1))     // backoff
delay: () => fromEvent(window, 'online')                       // when the net returns
delay: () => race(timer(5000), retryPressed$)                  // …or sooner, if asked
```

Throwing from inside the callback is how you say "stop" — used here so a 404
does not get retried three times on its way to the same answer.

**Operator order is semantics.** `startWith(inventoryLoading())` goes *after*
`retry`, so the spinner appears once per user action rather than once per
attempt. Put it before and the status machine flickers through `loading` three
times. Lab 7 asserts the difference.

**`catchError` must return an Observable, never rethrow.** An error that
escapes the epic ends its subscription for ever (Lab 1). `of(inventoryFailed(…))`
turns the failure into an ordinary action and the stream carries on.

**`takeUntil` goes at the end of the INNER pipe, and this is the classic bug.**

```text
  WRONG — takeUntil at the top level of the epic

  action$  --open----close----open----open---------
  epic     --P--------|                              COMPLETED
  out      --P--------------------------------------
           one pong, then the epic is dead for ever

  RIGHT — an outer switchMap, takeUntil inside it

  action$  --open----close----open----open---------
  epic     --P--------|  (inner ends)
                          --P-------P
  out      --P-------------P-------P----------------
```
*Figure 6 — measured, not asserted: `open, close, open, open` produced ONE
action with top-level `takeUntil` and THREE with the outer `switchMap`.*

An epic is a single long-lived subscription. `takeUntil` completes the stream
it is applied to, and a completed Observable never emits again. Wrap the
session in `switchMap(() => …)` so `takeUntil` ends only the session.

### Steps

**A. `src/store/inventory.ts` — `TODO(lab-2.1)`**

```ts
.addCase(inventoryLoading, (state) => {
  state.status = 'loading';
  state.error = null;
})
.addCase(inventoryLoaded, (state, action) => {
  productsAdapter.setAll(state, action.payload.products);
  state.total = action.payload.total;
  state.page = action.payload.page;
  state.status = 'ready';
  state.error = null;
  state.rows = {};
  state.flashes = {};
})
.addCase(inventoryFailed, (state, action) => {
  state.status = 'error';
  state.error = action.payload;
})
```

Read them next to Demo 24b's. No `requestId` stamped on pending, no `requestId`
compared on fulfilled, none on rejected, no `pendingKey`, no `meta.aborted`
branch, no `addMatcher`. Three fields have already gone from
`InventoryExtraState`; the eleven lines that maintained them went with the
thunk.

**B. `src/store/epics/inventory.ts` — `TODO(lab-2.2)`**

```ts
export const loadEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    ofType(consoleOpened.type),          // safe here: the payload is never read
    switchMap(() =>                      // ← THE OUTER SWITCHMAP. Do not skip it.
      merge(
        action$.pipe(filter(searchChanged.match), debounceTime(SEARCH_DEBOUNCE_MS)),
        action$.pipe(filter(isAnyOf(categoryChanged, lowStockToggled, sortChanged,
                                    pageChanged, latencyChanged, filtersCleared,
                                    inventoryRetried))),
      ).pipe(
        startWith(null),                 // "the console just opened"
        map(() => selectFilters(state$.value)),
        switchMap((filters) => /* the request — step C */),
        takeUntil(action$.pipe(filter(consoleClosed.match))),   // step D
      ),
    ),
  );
```

Read the filters from `state$.value`, not from the action. By the time an epic
sees an action the reducers have handled it, so the filters are current and
`page = 0` has already been applied — this is the epic equivalent of the
listener middleware's `getState()`.

**C. `src/store/epics/inventory.ts` — `TODO(lab-2.3)`**

```ts
deps.listProducts({ q, category, sortBy, order, page, limit: PAGE_SIZE, delayMs }).pipe(
  map((response) => inventoryLoaded({ products: response.products, total: response.total, page })),
  retry({
    count: LOAD_RETRIES,
    delay: (error, attempt) => {
      if (!toErrorInfo(error).isRetryable) throw error;   // a 404 will not improve
      return timer(loadBackoffMs(attempt));               // an Observable, not a number
    },
  }),
  catchError((error) => of(inventoryFailed(toErrorInfo(error)))),
  startWith(inventoryLoading()),          // AFTER retry: one spinner per action
)
```

`toErrorInfo` is unchanged from Demo 24b — the store still holds plain,
serialisable data and the API layer still owns the `ApiError` class. Nothing
about that boundary moved.

**D. `src/store/epics/inventory.ts` — `TODO(lab-2.4)`** is the
`takeUntil(consoleClosed)` line, at the end of the **inner** pipe.

**E. `src/components/inventory/InventoryToolbar.tsx` — `TODO(lab-2.5)`**

```tsx
value={filters.q}
onChange={(event) => dispatch(searchChanged(event.target.value))}
```

Delete the local draft, the `useDebouncedCallback` call and the
adjust-during-render block. `src/hooks/useDebouncedCallback.ts` stays in the
project because `ProductsPage` still uses it; nothing in the console does.

### Verify

1. Reload `/account/inventory`. One `GET /products` in the Network tab, and the
   Redux log reads `inventory/consoleOpened` → `inventory/loading` →
   `inventory/loaded`.
2. **Watch the debounce.** Type `lipstick` with the Network tab open.
   **One** request, 400 ms after you stop. Now watch the Redux log: **eight**
   `filters/searchChanged` actions, one per character. That is the trade, on
   screen.
3. **Watch the cancellation.** Set **Simulated latency** to 4 s. Type `lip`,
   wait for the request to start, then click page 2. The first request goes
   **red / (cancelled)** in the Network tab and the table lands on page 2.
4. **Prove `fromAbortable` is doing that.** Revert `fromAbortable` to
   `from(run(new AbortController().signal))` and repeat step 3. The table is
   still correct — `switchMap` still discards the answer — but the first
   request now runs to completion in the Network tab instead of going red. That
   is the difference between cancelling a subscription and cancelling a
   request.
5. **Watch the retry.** Point `VITE_API_BASE_URL` at a dead host (or turn Wi-Fi
   off) and reload. Three requests go out, spaced roughly 0.4 s and 0.8 s
   apart, and only then does `inventory/failed` appear. **One**
   `inventory/loading` in the log, not three.
6. **Watch the non-retry.** In `src/api/services/products.ts`, point
   `listProducts` at `endpoints.products.detail(9999)`. One request, one
   failure, no retries, and `inventory.error.status` is `404` — the
   `throw error` inside the `delay` callback.
7. **Break `takeUntil`.** Move it out of the inner pipe to the top level of the
   epic. Load the console, navigate to **Account → Team**, come back. Nothing
   loads, ever again, with no error anywhere. Put it back and it works on every
   visit.
8. **Break the operator.** Change the inner `switchMap` to `mergeMap`, set
   latency to 4 s, search and then immediately page. The table shows one page
   while the pager says the other — Demo 24b's bug, reintroduced in one word.

### Watch out

- **`takeUntil` at the top level.** One visit, then silence. Measured above.
- **The missing outer `switchMap`.** Same symptom, same cause.
- **`mergeMap` for a list load.** The race is back and nothing warns you.
- **`startWith` before `retry`.** The spinner restarts on every attempt and the
  status machine flickers.
- **`catchError` that rethrows.** The epic dies and takes every other effect
  with it.
- **Reading the filters from the action instead of `state$.value`.** It works
  for `searchChanged` and silently fails for `consoleOpened`, which has no
  payload — and for `filtersCleared`, whose payload is not the new filters.
- **A `delay` callback that returns a number.** `retry({ delay: 400 })` is
  valid and means a flat 400 ms every time. If you meant backoff, return a
  `timer`.

### Challenge (2 min)

Change the `retry` delay callback to `() => fromEvent(window, 'online')`, turn
Wi-Fi off, reload, and watch the console sit in `loading` with no further
requests. Turn Wi-Fi on and the retry fires immediately. Now try to express
that in a `for` loop.

### In the real world

The version of this epic that ships in most codebases is smaller than the one
above, because most codebases do not debounce selectively and do not retry.
Both of those are the right defaults in a product and the wrong defaults in a
tutorial: a flat `debounceTime` on every filter makes a dropdown feel broken,
and a blanket retry turns one failing request into three. The operators make
both cheap enough to get right, which is a reason to reach for them and also a
reason to review them — an operator you added because it was one word is still
a behaviour somebody has to support.

### Further reading

- [RxJS: `switchMap`](https://rxjs.dev/api/operators/switchMap) — the marble diagram, and the note about inner subscriptions
- [RxJS: `mergeMap`](https://rxjs.dev/api/operators/mergeMap) — including the concurrency argument Lab 4 uses
- [RxJS: `debounceTime`](https://rxjs.dev/api/operators/debounceTime) — and `debounce`, its Observable-valued sibling
- [RxJS: `retry`](https://rxjs.dev/api/operators/retry) — `count`, `delay`, `resetOnSuccess`
- [RxJS: `takeUntil`](https://rxjs.dev/api/operators/takeUntil) — and why it completes rather than cancels
- [RxJS: `catchError`](https://rxjs.dev/api/operators/catchError) — returning an Observable, and the `(error, caught)` form
- [redux-observable: cancellation](https://redux-observable.js.org/docs/recipes/Cancellation) — the official `takeUntil` recipe

---

## Lab 3 — The per-row write, and choosing a flattening operator (20 min)

### Problem

The optimistic stock edit is the same feature it was in Demo 24b: type a
number, see it immediately, `PATCH /products/:id`, roll back with the server's
own message if it refuses.

The reducers do not change. The only decision in this lab is **which
flattening operator** the epic uses — and it is a decision that Demo 24b never
had to make, because a thunk dispatched per row was independent by
construction.

That is worth sitting with. RxJS turned an invisible default into an explicit
choice, which is more power and more rope.

### Concept

**Go back to Figure 2 and read it as a question about rows.**

Twelve rows on screen. The user edits row 3, then two seconds later edits row
8 while row 3 is still saving.

| Operator | What happens | Verdict |
|---|---|---|
| `switchMap` | row 3's PATCH is **cancelled**; no `stockSaveSucceeded` and no `stockSaveFailed` ever arrives for it, so `rows[3]` stays on `'saving'` for ever and its spinner never stops | wrong, and the failure is silent |
| `exhaustMap` | row 8's edit is **dropped** while row 3 saves; the user types a number and nothing happens | wrong |
| `concatMap` | row 8 waits for row 3; twelve edits become twelve sequential round trips | correct but pessimistic |
| `mergeMap` | both run | **right** |

Rows are independent, so their requests are. `mergeMap`.

**The honest caveat, which the guide is not going to skip.** Two fast edits to
the *same* row under `mergeMap` can land out of order, and the later response
wins by luck rather than by design. The precise fix is per-row latest-wins:

```ts
action$.pipe(
  filter(stockSaveRequested.match),
  groupBy((action) => action.payload.id),        // one stream per row
  mergeMap((rowActions$) =>                      // rows run in parallel…
    rowActions$.pipe(switchMap((action) => request(action))),   // …latest wins per row
  ),
)
```

`groupBy` + `switchMap` is a genuinely beautiful two-line answer to a problem
that is fiddly in every other model. It also needs one more action — a
"superseded" case — so a cancelled row does not sit on `'saving'`, and that is
three more lines in the reducer for a number a human types with their fingers.
The shipped code keeps `mergeMap`. Know the pattern; reach for it when the
writes come from something faster than a person.

**Optimistic still lives in the reducer, and that has not moved.**

```text
  t0  user presses Enter
      dispatch(stockSaveRequested({ id: 7, stock: 50 }))
          │
          ├──► REDUCER   rows[7] = { status:'saving', previousStock: 5 }
          │              updateOne(7, { stock: 50 })     ◄── UI SHOWS 50
          │
          └──► EPIC      mergeMap ─► PATCH /products/7
                              │
            ┌─────────────────┴──────────────────┐
            ▼ 200                                ▼ 404 / network
      stockSaveSucceeded({ id, product })   stockSaveFailed({ id, error })
        delete rows[7]                  updateOne(7, { stock: previous })
        upsertOne({...ent, ...product}) rows[7] = { status:'error', … }
        ◄── the SERVER's whole answer   ◄── back to 5, with a reason
```
*Figure 7 — the optimistic write and its rollback. One action fans out to a
reducer and an epic, and neither knows about the other.*

The reducer answers `stockSaveRequested` **and** the epic reacts to it. That
split is what makes Lab 4's bulk restock free: anything that emits
`stockSaveRequested` inherits the optimistic write, the rollback, the per-row
error and the request, without a second code path.

**`PATCH` returns the whole merged product.** Verified against the live API
while writing this guide, not assumed: `PATCH /products/3` with
`{"stock": 88}` comes back with id, title, price, rating, category, brand,
description and thumbnail — the lot. So `stockSaveSucceeded` merges the
response over the entity rather than picking `stock` out of it. And
`PATCH /products/9999` returns `404` with
`{"message":"Product with id '9999' not found"}`, which is the exact sentence
the rollback shows.

**`catchError` goes INSIDE the inner pipe.** Outside it, one row's 404 ends the
epic and no row ever saves again. Inside it, the failure becomes one row's
action and the epic carries on. This is the same rule as Lab 2 and it is worth
repeating because the placement is easy to get wrong when you are refactoring.

### Steps

**A. `src/store/epics/inventory.ts` — `TODO(lab-3.1)`**

```ts
export const saveStockEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(stockSaveRequested.match),
    mergeMap((action) => {
      const { id, stock } = action.payload;
      return deps.updateProduct(id, { stock }, selectFilters(state$.value).delayMs).pipe(
        map((product) => stockSaveSucceeded({ id, product })),
        catchError((error) => of(stockSaveFailed({ id, error: toErrorInfo(error) }))),
      );
    }),
  );
```

Eleven lines. Demo 24b's `saveStock` thunk was ten, so this one is not shorter
— and it should not be, because a single fire-and-forget request is exactly the
job `createAsyncThunk` was designed for. What it *is* is explicit about
concurrency where the thunk was silent.

**B. `src/store/inventory.ts` — `TODO(lab-3.2)`**

```ts
.addCase(stockSaveRequested, (state, action) => {
  const { id, stock } = action.payload;
  const current = state.entities[id];
  if (!current) return;
  state.rows[id] = { status: 'saving', previousStock: current.stock };
  productsAdapter.updateOne(state, { id, changes: { stock } });
})
.addCase(stockSaveSucceeded, (state, action) => {
  const { id, product } = action.payload;
  delete state.rows[id];
  productsAdapter.upsertOne(state, { ...state.entities[id], ...product });
})
.addCase(stockSaveFailed, (state, action) => {
  const { id, error } = action.payload;
  const previous = state.rows[id]?.previousStock;
  if (previous !== undefined) productsAdapter.updateOne(state, { id, changes: { stock: previous } });
  state.rows[id] = { status: 'error', error: error.message };
})
```

Line for line, this is Demo 24b's `saveStock.pending` / `.fulfilled` /
`.rejected`. Only the action names changed. Swapping the effect layer did not
change what the state *means*, which is the strongest evidence that the two
layers were separable in the first place.

**C. `src/components/inventory/StockCell.tsx` — `TODO(lab-3.3)`**

```tsx
dispatch(stockSaveRequested({ id, stock: next }));
```

No `void`, no promise, no `.unwrap()`, no `try`. Demo 24b needed `void
dispatch(...)` because a thunk returns a promise that the linter wants you to
acknowledge. A plain action returns the action.

### Verify

1. Set **Simulated latency** to 2 s. Edit a row's stock and press Enter. The
   number changes immediately, a spinner appears, the PATCH is in flight.
2. **Two rows at once.** Edit row 1, then row 3 within the two seconds. Two
   spinners, two independent requests in the Network tab, both complete.
3. **Break it with `switchMap`.** Change `mergeMap` to `switchMap` and repeat
   step 2. Row 1's request goes red, and **row 1's spinner never stops** —
   there is no terminal action to clear `rows[1]`. That is the failure mode the
   table warned about, and it is invisible in the code.
4. **Force the rollback.** In `src/api/services/products.ts`, point
   `updateProduct` at `endpoints.products.update(9999)`. Edit a row: the number
   changes, two seconds pass (the `?delay=` applies to the error path too), and
   it goes back with *"Product with id '9999' not found"* — DummyJSON's own
   words, carried by the error normaliser into `toErrorInfo`.
5. **Break the `catchError` placement.** Move it outside the `mergeMap`, so it
   wraps the whole epic, and repeat step 4. The rollback happens once, and then
   **no row ever saves again** — the epic caught the error and completed. The
   root `catchError` from Lab 1 resubscribes it, so check the console for
   `[epics] an epic threw and was restarted`. Put it back.
6. Watch the header while you edit. "… units on this page" moves with the
   optimistic write and back with the rollback, because it is a
   `createSelector` over the same entities and nobody wired it up.

### Watch out

- **`switchMap` for per-row writes.** A spinner that never stops, and no error
  anywhere.
- **`catchError` outside the inner pipe.** The epic completes on the first
  failure.
- **Forgetting that the reducer also answers `stockSaveRequested`.** If you
  make the epic dispatch a *different* action for the request, you lose the
  optimistic write and Lab 4's bulk reuse with it.
- **`updateOne(…, { stock })` in the success case.** It works today and hides a
  bug the day the server changes another field. PATCH returns everything;
  merge it.
- **Reading `previousStock` in the success case.** It has already been deleted,
  and rightly — the old value is only interesting on the failure path.

### Challenge (2 min)

Implement the `groupBy` + `switchMap` version. Set latency to 4 s, edit the
same row three times quickly, and watch two requests go red and only the last
one land. Then notice that the row is stuck on `'saving'`, and work out which
action you now need.

### In the real world

The rule that survives review: **be optimistic where the intent is unambiguous
and the failure is rare and reversible, and make the failure visible.** The
second half is the one teams skip. A number that quietly goes back is
indistinguishable from a bug, and it is reported as one.

### Further reading

- [RxJS: `mergeMap`](https://rxjs.dev/api/operators/mergeMap) — the operator, and its concurrency limit
- [RxJS: `concatMap`](https://rxjs.dev/api/operators/concatMap) — `mergeMap` with a concurrency of one
- [RxJS: `exhaustMap`](https://rxjs.dev/api/operators/exhaustMap) — the submit-button operator
- [RxJS: `groupBy`](https://rxjs.dev/api/operators/groupBy) — per-key streams, for the challenge
- [RTK: `createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) — `updateOne` and `upsertOne`, unchanged from Demo 24b

---

## Lab 4 — Bulk, undo, persistence — and the accounting (35 min)

### Problem

"Add 10 stock to the twelve selected rows" needs four things at once: bounded
concurrency, cancellation when the user presses the button again, an honest
per-row report of what failed and why, and an undo.

Demo 24b needed `src/lib/concurrency.ts` (49 lines: N workers over a shared
cursor, a `SettledResult` type, a per-item error normaliser),
`listenerApi.cancelActiveListeners()`, `listenerApi.fork(...)`,
`await task.result` and a three-way outcome check so a cancelled run could not
report.

Two operators replace all of it. And then, at the end of this lab, the bill.

### Concept

**`mergeMap`'s second argument is `mapWithConcurrency`.**

```ts
mergeMap(project, 4)      // at most four inner subscriptions at a time
```

That is the whole of the concurrency helper. Not a simplification of it — the
same semantics: workers pull the next item as soon as one finishes, so a slow
item never stalls the others, and every item produces a result.

**`switchMap` is `cancelActiveListeners()` plus the cancelled-run guard.**
Press the button twice and `switchMap` unsubscribes the first run: its
remaining rows are never requested, its per-row listeners go away, and —
crucially — it cannot report, because nothing downstream of it is subscribed.
Demo 24b needed two separate mechanisms for those two properties.

**The shape worth stealing: use `action$` as the completion signal.**

The bulk epic does not call the API at all. It emits `stockSaveRequested`,
which `saveStockEpic` already handles, and then listens to `action$` for that
row's terminal action.

```text
  bulkRestockRequested(10, [1,2,3,4,5,6])
        │
        ▼
  from([1,2,3,4,5,6])
        │
        └─ mergeMap(row, 4)  ─────── at most FOUR of these at once
              │
              ├─ merge(
              │    done$ : action$ ─filter(id)─ take(1) ─► bulkProgressed
              │    of(stockSaveRequested({ id, stock: +10 }))
              │  )
              │        ▲                         │
              │        └──────── saveStockEpic ──┘  the SAME epic an inline
              │                                      edit uses
              ▼
  concat(rows$, defer(() => of(bulkRestockFinished({ failed }))))
```
*Figure 8 — bulk is not a second code path. Every row gets the optimistic
write, the rollback and the per-row error it would have got from a hand edit.*

**`merge`, not `concat`, and the order matters.** `merge` subscribes to its
sources left to right, so `done$` is listening *before* the request action is
emitted. Written as `concat(of(request), done$)` it would subscribe afterwards
— fine against a real network, and it loses the race against a synchronous
fake in Lab 7's test. Subscribe first, then speak.

**`take(1)` per row.** Without it a row keeps listening for ever and the run
never finishes.

**`defer` gives each run its own state.** The `failures` array is created
inside `defer(() => …)`, so pressing the button twice does not share one array.
And yes, it is a mutable array inside a stream. The idiomatic version threads
it through a `scan` accumulator alongside the actions and is genuinely harder
to read for no behavioural gain. **Where the functional version is worse, write
the clear one and say so in a comment.**

**Undo, and the one thing redux-observable does not give you.** An epic sees
`state$.value` *after* the reducers have run, which is what the persistence
effect wants and what undo wants here too — `bulkUndoRequested` clears `bulk`
but deliberately leaves `snapshot` alone.

But if you ever *do* need the previous state, redux-observable has no
`getOriginalState()`. You build it:

```ts
const previous$ = state$.pipe(pairwise(), map(([before]) => before));
```

…which has to be subscribed *before* the action arrives, so in practice you
set it up at the top of the epic and `withLatestFrom` it. That is a real
ergonomic loss against `createListenerMiddleware`, and it belongs in the
comparison rather than being quietly omitted.

**Persistence is four lines and a warning.**

```ts
action$.pipe(
  filter(isAnyOf(inspected, recentCleared, signedOut)),
  map(() => state$.value.recent),
  tap(saveRecent),
  ignoreElements(),      // ← MANDATORY
)
```

`ignoreElements()` says "this epic is a sink": it passes completion and errors
through and swallows every value. Leave it off and the epic emits a
`RecentState` object, redux-observable dispatches it as an action, and you have
a non-serialisable object in your action log at best. Return `EMPTY` instead
and it compiles, completes immediately, and the `tap` never runs.

`tap` is where a side effect is allowed to live. `localStorage.setItem` inside
a `map` works and lies about what `map` is for.

### Steps

**A. `src/store/epics/bulk.ts` — `TODO(lab-4.1)`**

```ts
function bulkRow$(action$, id: number, nextStock: number, failures: Failure[]) {
  const done$ = action$.pipe(
    filter((a): a is ReturnType<typeof stockSaveSucceeded> | ReturnType<typeof stockSaveFailed> =>
      (stockSaveSucceeded.match(a) || stockSaveFailed.match(a)) && a.payload.id === id),
    take(1),
    tap((a) => { if (stockSaveFailed.match(a)) failures.push({ id, reason: a.payload.error.message }); }),
    map(() => bulkProgressed()),
  );
  return merge(done$, of(stockSaveRequested({ id, stock: nextStock })));
}

export const bulkRestockEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(bulkRestockRequested.match),
    switchMap((action) => {                     // takeLatest, free
      const { amount, ids } = action.payload;
      const entities = state$.value.inventory.entities;
      return defer(() => {
        const failures: Failure[] = [];
        const rows$ = from(ids).pipe(
          mergeMap((id) => {
            const current = entities[id];
            if (!current) return EMPTY;         // the stream's way of saying `return`
            return bulkRow$(action$, id, current.stock + amount, failures);
          }, BULK_CONCURRENCY),
        );
        return concat(rows$, defer(() => of(bulkRestockFinished({ failed: failures }))));
      });
    }),
  );
```

The hand-written type guard in `done$` is the price of narrowing a union of two
action creators on a payload field; `isAnyOf(a, b)` narrows the action but not
`a.payload.id`, so the predicate is spelled out. It is the one piece of this
file that is uglier than the listener version.

**B. `src/store/epics/bulk.ts` — `TODO(lab-4.2)`** is the same shape in
reverse: read `selectSnapshot(state$.value)`, run `bulkRow$` over
`Object.entries(snapshot)` at the same concurrency, then emit
`bulkSnapshotDropped()`. Undo is a real reverse operation — the server was
told, so it is told again — not a screen trick.

**C. `src/store/epics/persist.ts` — `TODO(lab-4.3)`** is the four lines above.

**D.** Add all three to `rootEpic` in `src/store/epics/index.ts`.

### Verify

1. Select eight rows, press **+10 stock to selected**. The progress bar fills
   and the Redux log interleaves `inventory/stockSaveRequested`,
   `inventory/stockSaveSucceeded` and `inventory/bulkProgressed`.
2. **Count the concurrency.** Set latency to 2 s first, then watch the Network
   tab: **never more than four PATCHes in flight**. Change
   `BULK_CONCURRENCY` to 1 and they queue single file. Delete the second
   argument to `mergeMap` entirely and all eight fire at once.
3. It outlives the component. Start a restock, navigate to **Account → Team**,
   come back — wait. It **stopped**, because `takeUntil(consoleClosed)`… no:
   the bulk epic has no `takeUntil`, so it finishes. Check the log. This is
   worth noticing: which effects survive a route change is now a per-epic
   decision you can see, rather than an implicit property of where the code
   lived.
4. **Watch the cancellation.** Latency 4 s, start a restock, press the button
   again immediately. The first run's remaining `stockSaveRequested` actions
   never appear, and only the second run emits `bulkRestockFinished`.
5. **Force a partial failure.** Point `updateProduct` at `9999` and select six
   rows. The alert reads "0 of 6 rows restocked" and lists all six **with
   DummyJSON's own message**. Point it back, break only the network mid-run,
   and the successes stay applied.
6. Press **Undo**. Reverse PATCHes go out four at a time and every number
   returns.
7. **Watch the persistence.** Click three product titles. In Application →
   Local Storage, `shopscope.inventory.recent` is `{"version":2,"ids":[3,2,1]}`.
   Reload: the strip is there on the first paint, from `preloadedState`.
8. **Break `ignoreElements()`.** Delete it. Click a product title. The Redux
   log fills with an action whose `type` is `undefined`, and the console
   complains. Put it back.

### The accounting

Here is the bill for half one, measured rather than estimated. Every number is
**executable lines** — blank lines and comments excluded, counted by script
over the two solutions.

| Feature | Demo 24b | Demo 24c | Δ |
|---|---|---|---|
| **Cancellation and the race** | | | |
| `loadInventory` thunk + `condition` | 25 | — | |
| `filtersKey` + `currentRequestId` + `pendingKey` | 6 | — | |
| `addMatcher` clearing `pendingKey` | 3 | — | |
| the load's reducer cases | 21 | 17 | |
| the page's dispatch/abort effect | 4 | 6 | |
| **Debouncing** | | | |
| `useDebouncedCallback` hook | 21 | — | |
| the toolbar's draft + reconciliation | 7 | — | |
| **The load epic** (all of the above, plus retry) | — | 53 | |
| **The per-row write** | | | |
| `saveStock` thunk | 10 | — | |
| `saveStockEpic` | — | 11 | |
| its reducer cases | 18 | 18 | |
| **Bulk, undo, persistence** | | | |
| `listeners.ts` (boilerplate + bulk + undo + persist) | 73 | — | |
| `lib/concurrency.ts` | 30 | — | |
| `epics/bulk.ts` + `epics/persist.ts` | — | 84 | |
| **Plain actions** (what `createAsyncThunk` generated free) | — | 11 | |
| **Wiring, paid once per application** | | | |
| `extra.ts` + `createAppAsyncThunk.ts` | 13 | — | |
| `epics/deps.ts` + `types.ts` + `index.ts` | — | 68 | |
| `lib/fromAbortable.ts` | — | 17 | |
| `store/rootReducer.ts` (the `TS2456` fix) | — | 14 | |
| **TOTAL** | **231** | **299** | **+68** |

**The epic version is sixty-eight lines longer.** That is the headline, and
any guide that tells you otherwise is counting the parts that suited it.

Now read the table again, because the total hides the shape.

**Almost all the growth is one-off wiring.** Ninety-nine lines of `deps`,
`types`, `rootEpic`, the error boundary, `fromAbortable` and `rootReducer`,
against thirteen for `extra.ts` and `createAppAsyncThunk.ts`. You pay that once
per application, not once per feature. Subtract it from both columns and the
*feature* code goes **218 → 200**.

**The things that genuinely disappeared:**

- the latest-wins machinery — 30 lines of state, key-building and comparisons
  — became one word, `switchMap`;
- the debounce — 28 lines across a hook, a draft and a render-time
  reconciliation — became one operator;
- `mapWithConcurrency` — 30 lines — became `mergeMap`'s second argument;
- `cancelActiveListeners()`, `fork`, `await task.result` and the
  cancelled-run guard — became `switchMap` again.

**The things that grew, and why:**

- **the load epic is 53 lines where the thunk was 25.** It is doing more
  (debounce, retry, lifecycle) and it is doing it in one place, but nobody
  should pretend it is shorter;
- **eleven lines of plain `createAction` calls** that `createAsyncThunk`
  generated for free. Three actions per async operation, hand-written;
- **the wiring**, above;
- **`epics/bulk.ts` at 72 lines against the listener's 47** — until you add the
  49-line concurrency helper the listener needed, at which point it is 72
  against 96.

And the fifth column nobody writes down: **the load epic is harder to read for
somebody who does not know RxJS, and easier to read for somebody who does.**
The thunk version is fifty lines of ordinary JavaScript spread across four
places. The epic is fifty lines of dense composition in one place. Which of
those your team finds cheaper is a fact about your team, and it is a legitimate
input to the decision.

### Watch out

- **`concat(of(request), done$)`.** Subscribes to the answer after asking the
  question. Use `merge`.
- **No `take(1)` in `done$`.** The run never completes.
- **`failures` outside the `defer`.** Two runs share one array and the second
  report includes the first run's failures.
- **`ignoreElements()` missing.** Garbage in the action log, or a locked tab if
  the epic also listens for what it emits.
- **`Promise.all`-thinking.** There is no `Promise.all` here and there does not
  need to be; the stream completes when every inner stream completes.
- **Expecting `getOriginalState()`.** It does not exist. `pairwise()` on
  `state$`, set up in advance.

### Challenge (2 min)

Give `bulkRestockEpic` a `takeUntil(action$.pipe(filter(consoleClosed.match)))`
and then start a restock and navigate away. Decide which behaviour you
actually want, and notice that the decision is now one line in one place
instead of a property of where the code happened to live.

### In the real world

The two questions to ask of any bulk operation are still "what happens when the
fifth one fails?" and "what does the user do about it?". A progress bar that
only knows how to reach 100% is a lie with a percentage on it. RxJS does not
answer either question for you — `mergeMap(project, 4)` gives you bounded
concurrency and nothing else. The per-row report, the failure list and the undo
are still design work, and they are still the part that takes the time.

### Further reading

- [RxJS: `mergeMap`](https://rxjs.dev/api/operators/mergeMap) — the `concurrent` parameter, which is the whole of this lab
- [RxJS: `defer`](https://rxjs.dev/api/index/function/defer) — a new Observable per subscription, and why the `failures` array needs it
- [RxJS: `concat`](https://rxjs.dev/api/index/function/concat) — sequential subscription, for the final report
- [RxJS: `merge`](https://rxjs.dev/api/index/function/merge) — concurrent subscription, left to right, which is why `done$` comes first
- [RxJS: `ignoreElements`](https://rxjs.dev/api/operators/ignoreElements) — the sink operator
- [RxJS: `tap`](https://rxjs.dev/api/operators/tap) — where a side effect is allowed to live
- [redux-observable: error handling](https://redux-observable.js.org/docs/recipes/ErrorHandling) — the official position on `catchError` placement

---

## Lab 5 — A WebSocket as an Observable (35 min)

### Problem

Everything so far was a *request*: you ask, you wait, you get one answer, it is
over. Thunks are good at requests. So are listeners. So, better than either, is
RTK Query.

A live feed is not a request. It is a value that arrives over and over for as
long as somebody is looking at the screen, and the questions it raises —
when does it open, when does it close, what happens when it drops, what do you
do with a burst, how do you tell the server what you care about — have no
answers in `createAsyncThunk` at all.

This is where the demo stops being a comparison and starts being the reason
the library exists.

### Concept

**DummyJSON has no WebSocket, so the feed is a mock, and here is exactly what
that means.** `vite/mockStockFeed.ts` is a Vite plugin with `apply: 'serve'`.
It borrows Vite's own HTTP server, upgrades any request to `/__dev/feed`, and
pushes a `tick` frame about once a second for whichever product ids the client
has subscribed to. It is the same technique Demo 19 used for its Server-Sent
Events price stream — different transport, because SSE is one-directional and
this demo needs to talk back.

It exists on `npm run dev` and nowhere else. `ws` is a devDependency and is
never bundled.

**What a real backend would send.** The protocol in `src/lib/feedProtocol.ts`
is deliberately the shape a real one has: a `subscribe` frame carrying the ids
the client is looking at, a `tick` frame carrying only what changed, and a
server timestamp on every message. A production version would add three
things:

- **a monotonic sequence number**, so a reconnecting client can ask for the
  gap instead of refetching everything;
- **authentication on connect** — a token in the first frame, or smuggled
  through `Sec-WebSocket-Protocol`, because browsers cannot set an
  `Authorization` header on a WebSocket;
- **a heartbeat**, so a connection silently dropped by a proxy is noticed
  rather than sitting there looking healthy.

**What happens in a production build.** There is no server at `/__dev/feed`,
the handshake fails, `WebSocketSubject` errors, and the epic's `retry` backs
off to its 30-second ceiling while the badge reads *"Live feed unavailable"*.
Every other feature — loading, editing, bulk, undo, persistence — is
untouched, because the feed is `merge`d into the epic's output rather than
gating it. That degradation is not luck; it is what `merge` buys you over a
single sequential effect.

**`webSocket()` is a Subject that happens to be a network connection.**

```ts
import { webSocket } from 'rxjs/webSocket';
const socket$ = webSocket<Message>({ url, deserializer });
```

| You do | It does |
|---|---|
| `socket$.subscribe(...)` | opens the connection |
| `socket$.next(msg)` | sends a frame (queued if not open yet) |
| unsubscribe | **closes** the connection |
| the server drops you | the Observable **errors** |
| the server closes cleanly (1000) | the Observable **completes** |

Read that table twice. Four lifecycle events that would be four
`addEventListener` calls and a `removeEventListener` for each, expressed as the
three things an Observable already does: next, error, complete.

That last row matters and is easy to miss: `retry` reacts to an **error**, not
a completion. A clean close needs `repeat({ delay })`. Our mock never closes
cleanly, so `retry` alone is honest here; a real backend may need both.

```text
  CONNECTION LIFECYCLE

  subscribe          open              server dies         retry(500ms)
      │                │                    │                   │
      ▼                ▼                    ▼                   ▼
  ────●════════════════●══tick══tick══tick══✗  · · · · · · · · ·●════tick══
      │                                     │                   │
   socket opens                      Observable ERRORS     new socket,
                                     (abnormal close)      new subscribe

                                     ────────────────────────────────►
  unsubscribe (takeUntil consoleClosed)
      │
      ▼
  ════✂  the socket CLOSES. No ws.close() anywhere in the code.
```
*Figure 9 — the whole lifecycle in the three Observable signals. The reconnect
is `retry`; the close is unsubscription; there is no cleanup to forget.*

**Created inside the `switchMap`, not at module scope.** Each visit to the
console gets its own subject. A module-scope socket would outlive the screen
and accumulate one per visit — which is exactly the leak a `useEffect` without
a cleanup produces, and the reason people are frightened of sockets.

**Validate at the boundary.** A socket hands you `unknown`. The server is on
your own machine today; in production it is a system you do not control, on a
version you did not deploy, and a malformed frame must be dropped rather than
kill the stream. `isFeedServerMessage` is a type guard and the epic filters
through it — the same rule `loadRecent` follows for `localStorage`.

The default deserialiser is `JSON.parse`, and it **throws the whole stream
away** on one bad frame. `deps.openFeed` overrides it to return something
harmless instead, and lets the guard reject it.

**Inbound messages become actions, and land in the entity adapter you already
have.** This is where Demo 24b's normalisation finally pays off visibly: a
tick touches two rows out of twelve, `updateOne` makes two new entity objects,
the other ten are the *same objects they were*, and exactly two rows re-render
— four times a second, indefinitely, without the page catching fire.

**One guard in the reducer, which is a product decision rather than an RxJS
one.** A row that is mid-save is skipped: the user's intention outranks the
server's opinion about a number they are in the middle of changing.

### Steps

**A. `src/store/epics/deps.ts` — `TODO(lab-5.1)`**

```ts
openFeed: () =>
  webSocket<FeedServerMessage | FeedClientMessage>({
    url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${FEED_PATH}`,
    deserializer: (event: MessageEvent<string>) => {
      try { return JSON.parse(event.data) as FeedServerMessage; }
      catch { return { type: 'malformed' } as unknown as FeedServerMessage; }
    },
  }),
```

Deriving the URL from `location` means it works on localhost, on a LAN IP
(`vite --host`) and in StackBlitz with no configuration.

**B. `src/store/epics/feed.ts` — `TODO(lab-5.2)`** — the skeleton. Get a tick
on screen before you touch Lab 6.

```ts
export const feedEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(consoleOpened.match),
    switchMap(() => {
      const socket$ = deps.openFeed();          // INSIDE: one per visit

      const inbound$ = socket$.pipe(
        filter(isFeedServerMessage),
        filter((message) => message.type === 'tick'),
        map((message) => feedTicked({ at: message.at, changes: message.changes })),
      );

      return inbound$.pipe(
        takeUntil(action$.pipe(filter(consoleClosed.match))),
        startWith(feedStatusChanged('connecting')),
      );
    }),
  );
```

**C. `src/store/feed.ts` — `TODO(lab-5.3)`** — the connection's own slice:
`status`, `paused`, `reconnects`, `messages`, `lastMessageAt`,
`subscribedIds`. Two slices answer `feed/ticked` — the entity data goes to
`inventory`, the connection bookkeeping stays here — which is Demo 24b's
`signedOut` pattern doing a second job.

Record `action.payload.at`, the **server's** clock. A reducer that calls
`Date.now()` is not a pure function: replay it during time-travel and you get a
different answer. Anything from outside belongs in the action.

**D. `src/store/inventory.ts` — `TODO(lab-5.4)`**

```ts
.addCase(feedTicked, (state, action) => {
  for (const tick of action.payload.changes) {
    const current = state.entities[tick.id];
    if (!current) continue;                 // not on this page
    if (state.rows[tick.id]) continue;      // mid-save: the user wins
    state.flashes[tick.id] = tick.stock >= current.stock ? 'up' : 'down';
    productsAdapter.updateOne(state, {
      id: tick.id,
      changes: tick.price === undefined ? { stock: tick.stock }
                                        : { stock: tick.stock, price: tick.price },
    });
  }
})
.addCase(feedFlashCleared, (state, action) => {
  for (const id of action.payload) delete state.flashes[id];
})
```

**E. `src/components/inventory/StockCell.tsx` — `TODO(lab-5.5)`**

```tsx
const selectFlash = useMemo(() => makeSelectFlash(), []);
const flash = useAppSelector((state) => selectFlash(state, id));
// …
className={flash ? `feed-flash feed-flash-${flash}` : undefined}
```

**F. `src/store/epics/feed.ts` — `TODO(lab-5.6)`**

```ts
export const flashClearEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(feedTicked.match),
    mergeMap((action) => {
      const ids = action.payload.changes.map((change) => change.id);
      if (ids.length === 0) return EMPTY;
      return of(feedFlashCleared(ids)).pipe(delay(FLASH_MS));
    }),
  );
```

`delay` inside `mergeMap` is "do this, then do that a moment later" with no
`setTimeout`, no handle to clear, and automatic cancellation when the console
closes. `mergeMap`, not `switchMap`: two ticks 300 ms apart must each clear
their own rows, and `switchMap` would cancel the first clear and leave those
rows glowing for ever. Lab 7 has a marble test for exactly that.

Add `feedEpic` and `flashClearEpic` to `rootEpic`.

### Verify

1. Open `/account/inventory` and wait. Numbers move on their own; rows flash
   green when stock rises and red when it falls.
2. **Network → WS.** One connection to `/__dev/feed`. Click it, open
   **Messages**: a `hello` frame, then `tick` frames about once a second.
   (Subscription frames arrive in Lab 6 — before that the server has nothing
   to send, so if the list is empty, that is why.)
3. In the Redux log, `feed/ticked` carries `{ at, changes: [...] }`. Click it,
   open **Diff**: two or three entries under `inventory.entities`, and the same
   ids under `inventory.flashes`. Then, 1.2 seconds later,
   `feed/flashCleared`.
4. **Watch the re-render count.** React DevTools → *Highlight updates when
   components render*. Only the changed rows flash. Now change
   `InventoryTable` to select `selectAll` and map objects instead of ids, and
   watch all twelve flash four times a second.
5. **Watch the close.** Navigate to **Account → Team**. In Network → WS the
   connection status goes to **Finished**. Come back and there is a new one.
   No `ws.close()` exists in the codebase.
6. **Break the cleanup.** Move `const socket$ = deps.openFeed()` outside the
   `switchMap`, to module scope. Navigate in and out of the console five
   times. One socket, shared, which happens to look fine — until you also
   remove `takeUntil` and find five live connections in the WS tab.
7. **Watch the mid-save guard.** Set latency to 4 s, edit a row, and while it
   saves watch that row: the feed does not touch it. Delete the
   `if (state.rows[tick.id]) continue;` line and try again — the number you
   typed is overwritten while you wait for it to save.
8. **Feed a malformed frame.** In `vite/mockStockFeed.ts`, make `send` emit
   `ws.send('not json')` once. Without the custom `deserializer` the whole
   stream dies; with it, one frame is dropped and the ticks continue.

### Watch out

- **A socket created at module scope.** It outlives the screen, and nothing
  tells you.
- **`new WebSocket()` inside an epic.** It works and it puts you back in charge
  of `onmessage`, `onclose`, `removeEventListener` and the reconnect. The whole
  point of `webSocket()` is that subscription *is* the lifecycle.
- **Trusting the frame.** `unknown` in, validated out.
- **The default `JSON.parse` deserialiser.** One malformed frame ends the
  stream.
- **`Date.now()` in a reducer.** Time-travel replays it and gets a different
  answer. Put the timestamp in the action.
- **Letting the feed win over an in-flight edit.** Correct by default in the
  code above; delete one line to see why it is there.
- **Assuming a clean close reconnects.** `retry` sees errors, not completions.

### Challenge (2 min)

In `vite/mockStockFeed.ts`, drop the interval from 900 ms to 50 ms. Watch the
Redux log and the page. Then read Lab 6's `bufferTime` section, which exists
entirely because of what you just saw.

### In the real world

The hard part of a live feed is never the socket; it is deciding what the UI
owes the user when the data is moving. A number that changes while you are
reading it is hostile. Most production feeds end up with some combination of
"flash the change", "pause while the pointer is over the row", "batch into a
visible refresh button", or "only apply changes to rows that are off screen" —
and every one of those is a `filter`, a `buffer` or a `windowToggle` away once
the feed is a stream. That is the actual argument for RxJS here: not that it
connects a socket, but that changing the policy afterwards is one operator
instead of one refactor.

### Further reading

- [RxJS: `webSocket`](https://rxjs.dev/api/webSocket/webSocket) — the factory, its config, and `deserializer`
- [RxJS: `WebSocketSubject`](https://rxjs.dev/api/webSocket/WebSocketSubject) — `multiplex`, and the subject semantics
- [MDN: the WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — the platform underneath
- [MDN: `WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) — ready states, close codes, and why you cannot set headers
- [MDN: writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) — the raw API this replaces
- [RxJS: `delay`](https://rxjs.dev/api/operators/delay) — the flash timer, with no `setTimeout`

---

## Lab 6 — Reconnection, back-pressure, multiplexing and pause (30 min)

### Problem

The feed works until something goes wrong with it, and four things will.

The server restarts and the socket dies. The catalogue gets busy and sends two
hundred messages a second. The user filters to three rows and the server keeps
sending twelve. The user wants it to stop for a minute so they can read the
screen.

Each of those is one operator. That density is the point of this lab, and it
is also its risk: four operators is four behaviours nobody can see in a code
review unless they know what the operators mean.

### Concept

**Reconnection is `retry({ delay })`, and the delay is an Observable.**

```ts
retry({
  delay: (_error, attempt) => {
    status$.next('reconnecting');
    return timer(Math.min(MAX_BACKOFF_MS, 500 * 2 ** (attempt - 1)));
  },
  resetOnSuccess: true,
})
```

No `count`: a live feed should keep trying for as long as the screen is open,
and `takeUntil` is what finally stops it. `resetOnSuccess` restarts the ladder
after a good connection, so an hour of uptime is not punished for a drop last
week. The ceiling matters — without it, `2 ** 20` milliseconds is eleven days.

**`status$` is a local Subject, because an operator callback cannot emit.**
The `delay` callback needs to tell the UI it is waiting, and there is no
channel for that from inside an operator. A `Subject` created in the
`switchMap` and merged into the output is the standard answer, and it stays
local so nothing outside the epic can push to it.

**Back-pressure is `bufferTime`.**

```text
  raw       -m-m--m-m-m--m-m-m-m-m--m-m-m-m-m-m-m--
  bufferTime(250)
            ----------[mmm]--------[mmmmm]-------[mmm]
  out       ----------  T  --------   T   -------  T
```
*Figure 10 — one action per 250 ms window instead of one per message, with
last-write-wins per product id inside the window.*

At most four actions a second, each carrying every change in that window. This
is the operator you cannot comfortably hand-roll: a `setTimeout` version owns
an array, a timer handle and a cleanup, and gets flush-on-unsubscribe wrong.

**Outbound multiplexing is `state$` + `distinctUntilChanged`.**

```ts
const outbound$ = state$.pipe(
  map(selectVisibleIds),
  distinctUntilChanged(sameIds),     // ← without this: four frames a second
  tap((ids) => socket$.next({ type: 'subscribe', ids })),
  map((ids) => feedSubscriptionChanged(ids)),
);
```

`state$` is an Observable, so "the visible set, whenever it changes" is a
stream like any other, and `selectVisibleIds` is the memoised selector Demo
24b already wrote. The comparator is doing real work: without it every action
in the app sends a frame, and the ticks themselves would each trigger one.

RxJS also ships `socket$.multiplex(subMsg, unsubMsg, filter)` for the other
shape of this problem — many subscribers, each with its own topic, each
sending its frames when it subscribes and unsubscribes. Here there is one
subscriber whose interest changes over time, so the diff is explicit.

**Pause is one operator, and the choice inside it is a product decision.**

```ts
filter(() => !selectFeedPaused(state$.value)),
```

This **drops** messages while paused, which is right for a price feed: a stale
number is worse than a missing one. `bufferToggle(resumed$, () => paused$)`
holds them and releases a burst on resume — right for a chat log, wrong for
stock. One operator either way; make the choice deliberately.

**And the question every stream has to answer: what about the gap?**

A feed sends **deltas**. While you were disconnected the world moved on and
nobody replayed it, so the numbers on screen are now wrong in a way no future
tick will correct. Four possible answers, three of them honest:

1. **refetch on reconnect** — one action, `inventoryRetried()`, gated on
   `reconnects > 0` so the first connection does not double-fetch. What we do.
2. **ask for the gap** — `{ type: 'resume', since: lastSeq }`, if the server
   keeps a sequence number. The right answer when the backend supports it, and
   the reason a real protocol has one.
3. **tell the user** — "data may be stale, refresh?" — when refetching is
   expensive.
4. **do nothing.** The one that ships, and the reason dashboards drift.

**One `catchError` of last resort, on the outside.** `retry` handles a socket
that drops. It does not help when the endpoint does not exist at all — a
production build, where there is no dev server. `catchError(() =>
of(feedStatusChanged('offline')))` turns that into a badge, and because the
feed is `merge`d rather than sequenced, nothing else on the page notices.

### Steps

**A. `src/store/epics/feed.ts` — `TODO(lab-6.1)`** — add `tap(() =>
status$.next('live'))` above the `retry`, the `retry` itself, and merge
`status$.pipe(distinctUntilChanged(), map(feedStatusChanged))` into the output.
`distinctUntilChanged` matters: without it every frame emits another `'live'`.

**B. `TODO(lab-6.2)`** — `bufferTime(TICK_BUFFER_MS)`, a
`filter(m => m.length > 0)`, and a `map` that coalesces with a `Map` keyed by
product id so two ticks for one product in 250 ms become one update.

**C. `TODO(lab-6.3)`** — `outbound$`, above.

**D. `TODO(lab-6.4)`** — the pause `filter`, `resync$`, and the outer
`catchError`. Then `merge(inbound$, outbound$, resync$, status$…)`.

**E. `src/components/inventory/FeedBar.tsx` — `TODO(lab-6.5)`** — the status
badge, the tick count, the subscribed-id count, the reconnect count and the
pause button. A stream you cannot see is a stream you cannot debug, and every
number on that bar is the output of exactly one operator.

### Verify

1. **Watch the reconnect.** With the console open, `Ctrl-C` the dev server.
   Badge: **Live** → **Reconnecting…**. In Network → WS, failed connection
   attempts at roughly 0.5 s, 1 s, 2 s, 4 s, 8 s. Restart `npm run dev`;
   within one window the badge is **Live** again and the reconnect counter
   reads 1.
2. **Watch the resync.** Immediately after that reconnect, the Fetch/XHR tab
   shows a `GET /products` and the Redux log shows `inventory/retried` →
   `inventory/loading` → `inventory/loaded`. Delete the
   `filter(() => state$.value.feed.reconnects > 0)` and reload: now the very
   first connection also refetches, doubling every page load.
3. **Watch the buffering.** Drop the mock's interval to 50 ms. Without
   `bufferTime` the Redux log is unreadable and the page stutters; with it,
   four `feed/ticked` actions a second, each with several changes in it.
4. **Watch the multiplexing.** Network → WS → Messages. Tick **Low stock**: a
   new `subscribe` frame goes out with fewer ids. Change the page: another.
   Now delete `distinctUntilChanged` and watch a `subscribe` frame go out four
   times a second.
5. **Watch the pause.** Press **Pause feed**. Ticks keep arriving in the WS
   Messages panel — the socket is still open, which is the point — and no
   `feed/ticked` actions appear in the Redux log. Resume, and the next tick
   lands. Nothing is replayed, deliberately.
6. **Watch the production degradation.** `npm run build && npm run preview`,
   sign in, open the console. Badge: **Live feed unavailable**. Everything
   else works. The Redux log shows `feed/statusChanged` with `'connecting'`
   then `'offline'`.
7. **Break the ceiling.** Remove `Math.min(MAX_BACKOFF_MS, …)`, kill the
   server, and leave it for a minute. The gaps grow without limit; by attempt
   fifteen you are waiting four hours.

### Watch out

- **`retry` with a `count`.** A feed that gives up after three attempts is a
  feed that is dead by lunchtime.
- **No backoff ceiling.** `2 ** attempt` is eleven days at twenty.
- **No `distinctUntilChanged` on the outbound stream.** A `subscribe` frame per
  action, which on a live feed means a frame per tick.
- **`status$` without `distinctUntilChanged`.** One `feedStatusChanged('live')`
  per frame, and a Redux log you cannot read.
- **Buffering a chat log with `bufferTime` and last-write-wins.** Coalescing is
  correct for a *current value* and destroys a *sequence of events*.
- **Forgetting the gap.** The feed reconnects, the badge says Live, and the
  numbers are quietly wrong.
- **`retry` for a clean close.** It only sees errors. `repeat({ delay })` is
  the other half.

### Challenge (2 min)

Swap the pause `filter` for
`bufferToggle(resumed$, () => paused$)` + `mergeMap((buffered) => from(buffered))`
and watch the burst land on resume. Then decide which one you would actually
ship for stock levels, and why.

### In the real world

Every one of these four is something teams discover in production rather than
design. The backoff is discovered when a deploy restarts every server and ten
thousand clients reconnect in the same second. The buffering is discovered
when a popular product goes viral. The multiplexing is discovered when the
bandwidth bill arrives. The pause is discovered when somebody tries to read the
screen. Getting them cheap enough to add early is the real argument for a
stream library — not elegance, but that the fix is one line and therefore
actually gets made.

### Further reading

- [RxJS: `retry`](https://rxjs.dev/api/operators/retry) — `delay` as a notifier, and `resetOnSuccess`
- [RxJS: `repeat`](https://rxjs.dev/api/operators/repeat) — the completion-side twin of `retry`
- [RxJS: `bufferTime`](https://rxjs.dev/api/operators/bufferTime) — windows, overlap, and max buffer size
- [RxJS: `distinctUntilChanged`](https://rxjs.dev/api/operators/distinctUntilChanged) — with a comparator
- [RxJS: `Subject`](https://rxjs.dev/api/index/class/Subject) — the local status channel
- [RxJS: `timer`](https://rxjs.dev/api/index/function/timer) — the backoff notifier
- [RxJS: subjects guide](https://rxjs.dev/guide/subject) — multicast, and why a `WebSocketSubject` is one

---

## Lab 7 — Marble testing with `TestScheduler` (25 min)

### Problem

Every claim in Labs 2 to 6 is about *time*. "Debounced to one request."
"Cancelled before it emitted." "Retried at 400 ms and 800 ms." "Cleared 1.2
seconds later."

You cannot assert any of that with `await` and a `setTimeout`, and a test that
waits two real seconds is a test nobody runs.

### Concept

**`TestScheduler.run()` replaces the clock.** Inside it, RxJS swaps its
schedulers for a virtual one: a 400 ms debounce, an 800 ms backoff and a
1.2-second delay all resolve instantly and deterministically.

**Reading a marble string — every character is one millisecond.**

```text
  'a'          a value at frame 0
  '-'          one empty frame
  ' 99ms '     ninety-nine empty frames (whitespace is ignored entirely,
               so the spaces are only for your eyes)
  '(ab)'       two values in the SAME frame
  '|'          the stream completes
  '#'          the stream errors
  '^'          subscription marble: subscribed here
  '!'          subscription marble: unsubscribed here
```

The arithmetic catches everybody once: a value consumes its frame. After `'a'`
at frame 0 the cursor is at frame 1, so `'a 99ms b'` puts `b` at frame **100**,
not 99. Every off-by-one in these tests is that rule.

**`expectSubscriptions` is the one that proves cancellation.**
`expectObservable` tells you what came out; only `expectSubscriptions` tells
you when the test *stopped asking*. For `switchMap` that is the entire claim:

```ts
expectSubscriptions(response$.subscriptions).toBe(['^ 49ms !', '50ms ^ 100ms !']);
//                                                  ^^^^^^^^^
//   the first request was unsubscribed at frame 50 — before it ever emitted
```

**Build the state with the real reducers.** A hand-written fake root state is
a test that keeps passing after you break the reducer:

```ts
const stateWith = (...actions) =>
  actions.reduce((s, a) => rootReducer(s, a), rootReducer(undefined, { type: '@@INIT' }));
const state$ = new StateObservable(NEVER, stateWith(inventoryLoaded({ … })));
```

`StateObservable` comes from `redux-observable`; `NEVER` is fine when the epic
only reads `state$.value`.

**Fake the dependencies with cold Observables.** `EpicDeps` exists for this:
`{ listProducts: () => cold('--r|', { r: PAGE }) }` and no `vi.mock` anywhere.

**Pin deliberate randomness.** `loadBackoffMs` has jitter on purpose, so the
test stubs it: `vi.spyOn(Math, 'random').mockReturnValue(0)`. It can only do
that because the randomness has a name — which is why the backoff is an
exported function rather than an expression inside the operator.

**Not everything should be a marble test.** The bulk epic's claim is about
*concurrency*, and the clearest way to assert "never more than four at once" is
to count open subscriptions with a fake that never answers until told. Two of
the eleven tests in the solution are written that way, on purpose.

### Steps

**A. `src/store/epics/epics.test.ts` — `TODO(lab-7.1)`**

```ts
it('CANCELS the in-flight request when a new filter arrives (switchMap)', () => {
  scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
    const action$ = hot<UnknownAction>('o 49ms c', { o: consoleOpened(), c: categoryChanged('beauty') });
    const response$ = cold('100ms r|', { r: PAGE });

    const out$ = loadEpic(action$, stateOf(stateWith()), noDeps({ listProducts: () => response$ }));

    expectSubscriptions(response$.subscriptions).toBe(['^ 49ms !', '50ms ^ 100ms !']);
    expectObservable(out$).toBe('l 49ms l 99ms d', { l: inventoryLoading(), d: inventoryLoaded({ … }) });
  });
});

it('retries twice with exponential backoff, then reports the failure', () => {
  scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
    const response$ = cold<ProductListResponse>('10ms #', {}, new Error('boom'));
    // attempt 1 at 0 (fails at 10) → wait 400 → attempt 2 at 410 → wait 800 → 1220
    expectSubscriptions(response$.subscriptions).toBe(['^ 9ms !', '410ms ^ 9ms !', '1220ms ^ 9ms !']);
    expectObservable(out$).toBe('l 1229ms f', { l: inventoryLoading(), f: inventoryFailed({ … }) });
  });
});
```

Note the absence of `|` in that last marble. The epic does **not** complete
when a request fails — it is still subscribed, still waiting for the next
filter change. An epic that completes is an epic that has stopped working.

Eleven tests in the solution, each pinning one claim this guide made:
the open-the-console load, the debounce, the `switchMap` cancellation, the
retry ladder, the *non*-retry of a 404, `takeUntil` and the restart,
`mergeMap`'s concurrency for two rows, per-row error isolation, the flash
timer, the bulk concurrency limit, and honest partial failure.

**B. `src/store/inventory.test.ts` — `TODO(lab-7.2)`** — the reducer tests.
Most are Demo 24b's with `loadInventory.fulfilled` rewritten as
`inventoryLoaded`, which is itself the finding: replacing the effect layer did
not invalidate a single assertion about what the state means.

Two are new and worth care: a `feed/ticked` must not overwrite a row that is
mid-save, and the feed slice must record `action.payload.at` rather than
calling `Date.now()`.

### Verify

1. `npm test` — **25 tests, well under a second**, no browser, no network, no clock.
2. **Break the debounce.** Change `debounceTime(400)` to `debounceTime(300)`.
   The marble test fails with the exact frame: *expected 800, received 700*.
3. **Break the operator.** Change the inner `switchMap` to `mergeMap`. The
   cancellation test fails on the subscription log — the first subscription now
   runs to completion instead of stopping at frame 50. No other test notices,
   which is why that test exists.
4. **Break the order.** Move `startWith(inventoryLoading())` above `retry`.
   The retry test fails with three `inventoryLoading` actions instead of one.
5. **Un-pin the randomness.** Remove the `Math.random` stub. The retry test
   fails intermittently, which is exactly why it is there.

### Watch out

- **Off-by-one frames.** A value consumes its frame; `'a 99ms b'` is frame 100.
- **Real time inside `run()`.** A `setTimeout` or a promise you created
  yourself is not on the virtual clock and will not resolve. Everything must
  come from RxJS.
- **`cold('#')` without a type argument.** TypeScript infers
  `ColdObservable<string>` from an empty values map and the dependency will not
  accept it. `cold<ProductListResponse>('10ms #', {}, error)`.
- **Asserting completion that does not happen.** A `|` in the expected marble
  for an epic fed by a `hot` stream will fail; the epic stays subscribed.
- **Marble-testing concurrency.** Possible, and much less readable than
  counting open subscriptions.

### Challenge (2 min)

Write the twelfth test: `flashClearEpic` under `switchMap` instead of
`mergeMap`. Assert that the first clear never arrives, then put `mergeMap`
back and watch it pass again.

### In the real world

Marble tests are the reason people who like RxJS *really* like RxJS. Timing
behaviour is normally the least testable thing in an application — the part
everyone verifies by hand, once, and then never again. Here it is a string
comparison that runs in nine milliseconds. That is a genuine advantage over
thunks and listeners, where testing "debounced to one call" means fake timers
and hope.

### Further reading

- [RxJS: marble testing](https://rxjs.dev/guide/testing/marble-testing) — the syntax, the rules, and `run()`
- [RxJS: `TestScheduler`](https://rxjs.dev/api/testing/TestScheduler) — the API, including `expectSubscriptions`
- [redux-observable: writing tests](https://redux-observable.js.org/docs/recipes/WritingTests) — testing epics with and without marbles
- [Redux: writing tests](https://redux.js.org/usage/writing-tests) — the reducer and selector half, unchanged

---

## Wrap-up — what you can now do

- [x] Explain what an epic is in one sentence, and why it must never emit the action it received
- [x] Wire `createEpicMiddleware` into an existing store with `.concat`, and say what `.prepend` does instead
- [x] Recognise the silent failures: `run()` too early, `takeUntil` at the top level, a missing `catchError`, a missing `ignoreElements`
- [x] Say why `from(promise)` does not cancel, and write the Observable that does
- [x] Choose between `switchMap`, `mergeMap`, `concatMap` and `exhaustMap` by asking one question, and name what each wrong answer breaks
- [x] Replace a hand-rolled request id, debounce hook, retry helper and concurrency helper with four operators — and say honestly what that cost
- [x] Open, read, write, close and reconnect a WebSocket with no event listeners and no cleanup function
- [x] Apply back-pressure with `bufferTime`, multiplex a subscription off `state$`, and pause a feed with one `filter`
- [x] Answer the gap question: what to do about the deltas you missed while disconnected
- [x] Write a marble test, read a subscription log, and prove a cancellation rather than assume it
- [x] Argue all four sides of thunks, listeners, epics and RTK Query, and pick with conditions attached

---

## Thunks, listeners, epics or RTK Query?

This is a four-way comparison, not a two-way one, and getting that wrong is
how a codebase ends up with epics fetching pages of products.

### The four approaches, side by side

```text
  THUNK                       LISTENER MIDDLEWARE
  ┌────────────────────┐      ┌────────────────────────┐
  │ dispatch(thunk)    │      │ dispatch(action)       │
  │   │                │      │   │                    │
  │   ▼                │      │   ▼ reducers run       │
  │ fn(dispatch,       │      │ matcher? ──► async fn  │
  │    getState, extra)│      │   listenerApi:         │
  │   │  await         │      │    getState / original │
  │   ▼                │      │    fork / cancel / take│
  │ pending/fulfilled/ │      │   │                    │
  │ rejected           │      │   ▼ dispatch(...)      │
  └────────────────────┘      └────────────────────────┘
   one request, three          "when X, do Y", with
   actions, no vocabulary      cancellation — plain
   for "again" or "still"      async/await

  EPIC                        RTK QUERY
  ┌────────────────────┐      ┌────────────────────────┐
  │ action$  ─────┐    │      │ useGetInventoryQuery(a)│
  │ state$   ──┐  │    │      │   │                    │
  │ deps     ─┐│  │    │      │   ▼  a is the CACHE KEY│
  │           ▼▼  ▼    │      │ hit+fresh → data       │
  │  merge / filter /  │      │ hit+stale → data+fetch │
  │  switchMap / retry │      │ miss      → baseQuery  │
  │  bufferTime / …    │      │   │                    │
  │           │        │      │   ▼ providesTags       │
  │           ▼        │      │ invalidatesTags ──► ↺  │
  │  Observable<Action>│      └────────────────────────┘
  └────────────────────┘       declarative cache,
   the whole timeline is       dedupe, subscriptions,
   a value you can compose     generated hooks
```
*Figure 11 — the same store, four ways to reach the network. The question is
never "which is best" but "what shape is this problem".*

### The scorecard

| | Thunk | Listener middleware | Epic | RTK Query |
|---|---|---|---|---|
| **Ships with RTK** | yes | yes | no (+12 kB gz) | yes |
| **New vocabulary** | none | small | large | medium |
| **One request** | ideal | fine | overkill | ideal |
| **Latest-wins** | request id + abort, by hand | `cancelActiveListeners` | `switchMap` | free (arg is the key) |
| **Debounce** | a hook, in a component | `listenerApi.delay` + cancel | `debounceTime` | not its job |
| **Retry with backoff** | hand-written | hand-written | `retry({ delay })` | `retryCondition` (fixed-ish) |
| **Bounded concurrency** | hand-written | hand-written | `mergeMap(fn, n)` | n/a |
| **Cancel on unmount** | `promise.abort()` in a cleanup | cancel on an action | `takeUntil` | automatic, on unsubscribe |
| **Caching** | none | none | **none** | the whole point |
| **Dedupe across components** | none | none | none | free |
| **A socket / a feed** | impossible | a `while` loop you write | **native** | `onCacheEntryAdded`, awkward |
| **Back-pressure** | n/a | hand-written | `bufferTime`, `throttle`, `audit` | n/a |
| **Combining two sources** | painful | painful | **trivial** | not its job |
| **Testing time** | fake timers | fake timers | **marble tests** | mostly unnecessary |
| **Reading it cold** | easy | easy | hard, until it is easy | easy |
| **Debugging it** | breakpoints work | breakpoints work | stack traces are RxJS's | devtools panel |
| **Failure mode** | unhandled rejection | a listener stops | **every effect stops** | a query errors |

### Where each one wins

**RTK Query wins ordinary data loading, and it is not close.** It already has
the cache, the deduplication, the subscription-based cancellation and the tag
graph that Labs 2 to 4 hand-built. Demo 24b measured it: 113 hand-written
lines against 70 declared ones, *and* the seventy had a cache. Building
`loadEpic` was worth doing here because comparing it teaches something — but
if the console's only requirement were "fetch a page of products", the honest
recommendation is the RTK Query page next door.

Say that out loud when you introduce epics to a team, or the demo quietly
recommends an over-engineered default.

**Epics win streams, and nothing else comes close.** A WebSocket, an
`EventSource`, `IntersectionObserver`, a drag gesture, geolocation, anything
with a `keydown`. The moment "a value that arrives repeatedly" is in the
requirement, everything else is writing an event-listener lifecycle by hand.
The feed epic itself is 108 executable lines — 239 with its slice, its status
bar and the shared protocol; the listener-middleware version would be a
`while (true)` loop, a
hand-rolled backoff, four `addEventListener` calls and a cleanup you can
forget.

**Epics also win multi-step orchestration.** "Wait for the next X, but no more
than five seconds, unless Y happens first." "Merge these three sources and
take the latest of each." "Retry when the network comes back." Those are
sentences in RxJS and paragraphs in anything else.

**The listener middleware wins "when X happens, do Y" for a team that does not
know RxJS.** Cancellation, forks and `take` with plain `async`/`await`, no new
mental model, and it is already installed. For the bulk restock in Lab 4, an
honest reviewer would call it a draw on the code and a win on the reading.

**Thunks win the one-shot request that is not worth a cache.** Sign out. Upload
a file. Post a form. `createAsyncThunk` is ten lines and everybody understands
them.

### The mixed stack, which is what you should actually ship

Nothing here is exclusive. A realistic ShopScope would be:

- **RTK Query** for every read and every write of server data;
- **epics** for the live feed and anything else stream-shaped;
- **a thunk or a listener** for the odd one-shot that does not fit either;
- **slices** for filters, selection, the undo snapshot and the recent list.

This solution still has all four in it, at once, and they do not fight.

### The bundle, measured

Built with the same Vite 8 config, minified, summing the gzipped size of every
emitted JS chunk — the same method Demos 24a and 24b used, so the numbers are
directly comparable.

| | raw | gzipped |
|---|---|---|
| `rxjs` + `redux-observable`, only the operators this demo imports | 49.0 kB | **12.0 kB** |
| Demo 24b — the whole app, RTK + RTK Query | 760.1 kB | **242.2 kB** |
| Demo 24c — the same app, plus epics and the feed | 796.4 kB | **252.2 kB** |
| **The delta, in this application** | **+36.3 kB** | **+10.0 kB** |

For context from the other two demos in this set: Zustand plus its middleware
was **+6.4 kB** gzipped, Redux Toolkit plus RTK Query **+26.5 kB**. Adding
RxJS and redux-observable is another **+10 kB** on top of that — about 40% more
than the RTK stack it sits beside, and roughly one large photograph.

RxJS tree-shakes properly, which is why 12 kB and not the 40-odd kB the whole
library would be: every operator is a separate named export and the bundler
keeps only what you import. Import from `'rxjs/operators'` (the deprecated
path) or from a barrel that re-exports everything and you lose that.

### The elephant: `3.0.0-rc.3`

This is a genuine consideration and it belongs beside the technical merits,
not in a footnote. Read from the npm registry while writing this guide:

| Version | Published | Peers on |
|---|---|---|
| `redux-observable@2.0.0` | **June 2021** | `redux >=4 <5` |
| `redux-observable@3.0.0-rc.3` | December 2025 | `redux >=5 <6`, `rxjs >=7 <8` |

Redux Toolkit 2 ships **Redux 5**. So the last *stable* release of
redux-observable is incompatible with the Redux that current RTK installs, and
the only compatible release is a **release candidate** — which, oddly, is what
npm's `latest` tag points at, so `npm i redux-observable` gives you the RC
whether you meant to or not.

What that means in practice:

- **It works.** It is a thin library — `combineEpics`, `createEpicMiddleware`,
  `ofType`, `StateObservable`, and that is the entire public surface. The
  declaration file is forty lines. There is not much room for it to be wrong,
  and everything in this demo runs on it.
- **`rc` is a statement about the release cadence, not about the code.** The
  gap between 2.0.0 and 3.0.0-rc.3 is four and a half years. That is a project
  in maintenance, not one in trouble — but it is also a project that may not
  ship a fix quickly if you need one.
- **You could skip the library.** redux-observable is roughly "subscribe a
  function to a Subject of actions and dispatch what it emits". Teams do
  write that themselves in thirty lines, and then they own it. Whether that is
  better than depending on an RC is a real argument with two sides.
- **Your organisation may simply forbid it.** Plenty of dependency policies
  reject a pre-release outright, and that ends the conversation regardless of
  the technical merits. Find out before you design around it.

Weigh it honestly. It does not make epics a bad idea; it makes *this
particular adapter* a decision that needs a sentence in your ADR rather than
none.

### The recommendation

**Do not adopt RxJS for data fetching.** If that is the requirement, the
answer is RTK Query (you already have it) or TanStack Query (if you are not on
Redux). Labs 2 to 4 exist to show you what the epic version looks like, and
the accounting at the end of Lab 4 shows it is sixty-eight lines longer.

**Do adopt it when you have streams.** A live feed, several sources that have
to be combined, a socket that has to reconnect, anything with back-pressure or
a gesture. The feed epic in Labs 5 and 6 is 108 executable lines — 239 with
its slice, its status bar and the shared protocol — for a feature the other
three approaches would each have made worse, and every future change to its
policy is one operator.

**And adopt it deliberately, with the whole team.** RxJS is the highest-ceiling
and highest-floor option in this comparison. One person who knows it writes
code four people cannot review, and the failure mode — one unhandled error
silently ending every effect in the application — punishes exactly the kind of
mistake a newcomer makes. Pair the adoption with the root `catchError` from
Lab 1, a rule that every inner request has its own `catchError`, and marble
tests, which is what Lab 7 was for.

> **See it from the other sides:**
> [Demo 24b — Redux Toolkit](../24b-redux-toolkit/) is where these effects came
> from, and its `/account/inventory/rtkq` page is still in this solution.
> [Demo 24a — Advanced Zustand](../24a-advanced-zustand/) builds the identical
> console with no Redux at all.
> [Demo 19 — TanStack Query and realtime](../19-tanstack-query-and-realtime/)
> solves the live-updates problem a fourth way, with a query cache and an
> SSE stream.

---

## Reference

Official sources only — the libraries' own documentation, the React docs and
MDN. Every link is to the exact page.

### redux-observable

- [Epics](https://redux-observable.js.org/docs/basics/Epics) — the definition, and the rule about not emitting what you received
- [Setting up the middleware](https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware) — `createEpicMiddleware`, `run`, and where it goes
- [`createEpicMiddleware`](https://redux-observable.js.org/docs/api/createEpicMiddleware) — options, including `dependencies`
- [`combineEpics`](https://redux-observable.js.org/docs/api/combineEpics) — merging epics into one
- [`EpicMiddleware`](https://redux-observable.js.org/docs/api/EpicMiddleware) — the `run` method
- [Cancellation](https://redux-observable.js.org/docs/recipes/Cancellation) — the `takeUntil` recipe this demo follows
- [Error handling](https://redux-observable.js.org/docs/recipes/ErrorHandling) — where `catchError` goes, and the root-level net
- [Injecting dependencies into epics](https://redux-observable.js.org/docs/recipes/InjectingDependenciesIntoEpics) — `dependencies`, and testing with them
- [Writing tests](https://redux-observable.js.org/docs/recipes/WritingTests) — with and without marbles
- [Adding new epics asynchronously](https://redux-observable.js.org/docs/recipes/AddingNewEpicsAsynchronously) — for code-split routes
- [Troubleshooting](https://redux-observable.js.org/docs/Troubleshooting) — the short official list
- [Migration notes](https://redux-observable.js.org/MIGRATION) — what changed between majors

> These paths have **no `.html` suffix**. `…/docs/basics/Epics.html` returns a
> 404; `…/docs/basics/Epics` is the page. Checked, both ways.

### RxJS — the operators this demo uses

- [`switchMap`](https://rxjs.dev/api/operators/switchMap) — latest wins, and the loser is unsubscribed
- [`mergeMap`](https://rxjs.dev/api/operators/mergeMap) — concurrent, with a concurrency limit
- [`concatMap`](https://rxjs.dev/api/operators/concatMap) — one at a time, in order
- [`exhaustMap`](https://rxjs.dev/api/operators/exhaustMap) — ignore everything until the current one finishes
- [`groupBy`](https://rxjs.dev/api/operators/groupBy) — per-key streams, for per-row latest-wins
- [`debounceTime`](https://rxjs.dev/api/operators/debounceTime) — the search box
- [`bufferTime`](https://rxjs.dev/api/operators/bufferTime) — back-pressure for the feed
- [`distinctUntilChanged`](https://rxjs.dev/api/operators/distinctUntilChanged) — with a comparator, for the outbound subscription
- [`retry`](https://rxjs.dev/api/operators/retry) — `count`, `delay` as a notifier, `resetOnSuccess`
- [`repeat`](https://rxjs.dev/api/operators/repeat) — the completion-side twin of `retry`
- [`catchError`](https://rxjs.dev/api/operators/catchError) — return an Observable; never rethrow from an epic
- [`takeUntil`](https://rxjs.dev/api/operators/takeUntil) — the unmount, and why it must not be at the top level
- [`startWith`](https://rxjs.dev/api/operators/startWith) — the spinner, placed after `retry`
- [`delay`](https://rxjs.dev/api/operators/delay) — the flash timer
- [`ignoreElements`](https://rxjs.dev/api/operators/ignoreElements) — the sink epic
- [`tap`](https://rxjs.dev/api/operators/tap) — where a side effect is allowed to live

### RxJS — creation, classes and guides

- [`merge`](https://rxjs.dev/api/index/function/merge) — subscribes left to right, which Lab 4 depends on
- [`concat`](https://rxjs.dev/api/index/function/concat) — sequential, for the bulk report
- [`defer`](https://rxjs.dev/api/index/function/defer) — a fresh Observable per subscription
- [`of`](https://rxjs.dev/api/index/function/of) — an action as a stream
- [`timer`](https://rxjs.dev/api/index/function/timer) — the backoff notifier
- [`Observable`](https://rxjs.dev/api/index/class/Observable) — the constructor and the teardown function behind `fromAbortable`
- [`Subject`](https://rxjs.dev/api/index/class/Subject) — the local status channel in the feed epic
- [`webSocket`](https://rxjs.dev/api/webSocket/webSocket) — the factory and its config
- [`WebSocketSubject`](https://rxjs.dev/api/webSocket/WebSocketSubject) — including `multiplex`
- [`TestScheduler`](https://rxjs.dev/api/testing/TestScheduler) — `run`, `expectObservable`, `expectSubscriptions`
- [Guide: Observable](https://rxjs.dev/guide/observable) — the four signals, and unsubscription
- [Guide: Operators](https://rxjs.dev/guide/operators) — pipeable operators, and the categories
- [Guide: Subject](https://rxjs.dev/guide/subject) — multicast, and why a socket is one
- [Guide: Scheduler](https://rxjs.dev/guide/scheduler) — what `TestScheduler` replaces
- [Guide: Marble testing](https://rxjs.dev/guide/testing/marble-testing) — the syntax, in full

### Redux Toolkit and Redux

- [`createAction`](https://redux-toolkit.js.org/api/createAction) — the plain actions that replaced the thunks, and `.match`
- [`createSlice`](https://redux-toolkit.js.org/api/createSlice) — `extraReducers`, unchanged from Demo 24b
- [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) — where the ticks land
- [`configureStore`](https://redux-toolkit.js.org/api/configureStore) — `middleware`, `preloadedState`, `devTools`
- [`getDefaultMiddleware`](https://redux-toolkit.js.org/api/getDefaultMiddleware) — `prepend` vs `concat`
- [Matching utilities](https://redux-toolkit.js.org/api/matching-utilities) — `isAnyOf`, used as an RxJS `filter` predicate
- [`combineSlices`](https://redux-toolkit.js.org/api/combineSlices) — the lazier alternative to the `rootReducer.ts` in this demo
- [`createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware) — what Lab 4 replaced, for the comparison
- [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) — what Lab 2 replaced
- [Usage with TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript) — `RootState`, and typing middleware
- [Redux: side-effect approaches](https://redux.js.org/usage/side-effects-approaches) — thunks, sagas, observables and listeners, compared officially
- [Redux: middleware](https://redux.js.org/understanding/history-and-design/middleware) — how the chain is composed, and why order matters
- [Redux style guide](https://redux.js.org/style-guide/) — including "do not put non-serialisable values in state"
- [Redux: writing tests](https://redux.js.org/usage/writing-tests) — the reducer and selector half

### RTK Query — the third leg of the comparison

- [Overview](https://redux-toolkit.js.org/rtk-query/overview) — what it generates, and what it deliberately does not
- [Customizing queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries) — the axios `baseQuery` this app still uses
- [Optimistic updates](https://redux-toolkit.js.org/rtk-query/usage/optimistic-updates) — `updateQueryData` and `patch.undo()`
- [Streaming updates](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates) — `onCacheEntryAdded`, RTK Query's own WebSocket story, for contrast

### React and the platform

- [React: `useEffect`](https://react.dev/reference/react/useEffect) — what Lab 1's four-line effect still is
- [React: synchronizing with effects](https://react.dev/learn/synchronizing-with-effects) — subscriptions, cleanup, and why the epic version has none
- [React: you might not need an effect](https://react.dev/learn/you-might-not-need-an-effect) — the adjust-during-render pattern in `StockCell`
- [MDN: the WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — the platform underneath `webSocket()`
- [MDN: `WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) — ready states, close codes, and the missing `Authorization` header
- [MDN: writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) — the raw API, for comparison
- [MDN: `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the teardown inside `fromAbortable`
- [MDN: `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — quota, private mode, and why every access is wrapped

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Nothing loads, and the console says `redux-observable \| WARNING: epicMiddleware.run(rootEpic) called before the middleware has been setup by redux` | `runEpics()` ran before `configureStore`. Move it below. It does not throw, so this warning is the only clue. |
| Nothing loads, no warning, no error | `.concat(epicMiddleware)` is missing from `configureStore`, or the epic is not in `rootEpic`. |
| `action$` contains functions rather than actions | The middleware was `prepend`ed, so it sits upstream of `redux-thunk`. Use `.concat`. |
| The console works on the first visit and never again | `takeUntil(consoleClosed)` is at the top level of the epic instead of inside the outer `switchMap`. A completed Observable never emits again. |
| One feature breaks and then **everything** asynchronous stops | An error escaped an epic. Look for `[epics] an epic threw and was restarted` from the root `catchError`, then find the inner request that has no `catchError` of its own. |
| The tab locks up the moment you click something | An epic is emitting the action it filtered for. Add `ignoreElements()`, or emit a different action. |
| `error TS2456: Type alias 'RootState' circularly references itself` | Typed middleware needs `RootState` and `RootState` came from the store. Define it with `combineReducers` in `rootReducer.ts`. |
| `Property 'payload' does not exist on type 'never'` after `ofType` | `ofType` narrows by `Extract` from the input union, and `Extract<UnknownAction, Action<'x'>>` is `never`. Use `filter(creator.match)`. |
| Requests are correctly ignored but still show as completed in the Network tab | `fromAbortable` is still the `from(promise)` stub. A promise has no cancellation channel. |
| The table and the pager disagree after a slow-then-fast sequence | The inner operator is `mergeMap`, not `switchMap`. |
| A row's spinner never stops | `saveStockEpic` uses `switchMap`, so a superseded row save was cancelled and no terminal action ever arrived. Use `mergeMap`. |
| A request fires per keystroke | `debounceTime` is missing, or the search stream was merged into the immediate branch by mistake. |
| The spinner flickers three times on a failing request | `startWith(inventoryLoading())` is above `retry` instead of below it. |
| A 404 is retried three times | The `delay` callback does not rethrow for a non-retryable error. `if (!toErrorInfo(error).isRetryable) throw error;` |
| The bulk progress bar never reaches the end | `take(1)` is missing from the per-row `done$`, so a row never completes. |
| Two bulk runs share a failure list | `failures` was created outside the `defer`. |
| The second bulk run reports the first one's results | Both are running: `switchMap` was replaced by `mergeMap`. |
| The feed badge stays on **connecting** and no ticks arrive | The dev server is not running, or you are looking at a production build — there is no `/__dev/feed` outside `npm run dev`. Check Network → WS. |
| One malformed frame and the feed dies for good | The default `JSON.parse` deserialiser threw. Override `deserializer` and validate with `isFeedServerMessage`. |
| A `subscribe` frame goes out several times a second | `distinctUntilChanged(sameIds)` is missing from the outbound stream. |
| The Redux log is full of `feed/statusChanged` | `distinctUntilChanged()` is missing from `status$`. |
| The socket reconnects for ever with no gaps growing | The backoff is a constant. Return `timer(500 * 2 ** (attempt - 1))`, and cap it. |
| The socket never reconnects, even though it dropped | The server closed **cleanly** (code 1000), which completes rather than errors. `retry` does not see completions; add `repeat({ delay })`. |
| Numbers are wrong after a reconnect and never correct themselves | The resync is missing. A feed sends deltas; the ones you missed are gone. Dispatch `inventoryRetried()` when the status returns to `'live'`. |
| The number you just typed is overwritten by the feed | The `if (state.rows[tick.id]) continue;` guard was removed from the `feedTicked` reducer. |
| Vite's hot reload stops working | The upgrade handler in `vite/mockStockFeed.ts` is destroying sockets it should ignore. Return early for any URL that is not `FEED_PATH`; do not call `socket.destroy()`. |
| A marble test is off by exactly one frame | A value consumes its frame. `'a 99ms b'` puts `b` at frame 100. |
| A marble test fails intermittently on the retry timings | `Math.random` is not stubbed, and `loadBackoffMs` has deliberate jitter. |
| `ColdObservable<string> is not assignable to Observable<ProductListResponse>` | `cold('#', {}, err)` infers from an empty values map. Pass the type: `cold<ProductListResponse>(…)`. |
| `PATCH` returns 200 and the number reverts on the next load | DummyJSON **simulates** writes. The mechanism is real; the durability is not. |
| `Product with id '9999' not found` on a row | Correct — DummyJSON's own message, and what Lab 3's rollback step asks you to provoke. |

---

## Where to go from here

This demo is a branch of the track, not a link in the chain: nothing follows
it and it writes no "next starter".

- **[Demo 24b — Redux Toolkit](../24b-redux-toolkit/)** is where this solution
  came from. Its `/account/inventory/rtkq` page is still here, still working,
  and still the right answer for plain data loading.
- **[Demo 24a — Advanced Zustand](../24a-advanced-zustand/)** builds the same
  Inventory Console with no Redux at all. Reading all three `src/store/`
  directories side by side is the fastest way to make this decision yours.
- **[Demo 19 — TanStack Query and realtime](../19-tanstack-query-and-realtime/)**
  answers the live-updates question a fourth way: a query cache plus a
  Server-Sent Events stream, with the same kind of mock server in the same
  place.
- **[`WALKTHROUGH.md`](./WALKTHROUGH.md)** tours this solution file by file and
  gives you a concept-to-observation table — which matters more here than
  usual, because a stream is invisible until you know where to look.
