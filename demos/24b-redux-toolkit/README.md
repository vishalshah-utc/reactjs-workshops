# Demo 24b — Redux Toolkit

**Demo guide** · ~180 minutes · a store you can rewind — and the price of the ticket

> 📖 New here? [`WALKTHROUGH.md`](./WALKTHROUGH.md) reads the finished solution
> instead of building it. Open that if you want the concepts in thirty minutes
> without doing the labs.

---

## Where you are starting from

The starter is **ShopScope as Demo 14 left it**: a routed, authenticated
product explorer with a layered axios API module, one `ApiError`, a refresh
queue, React Router 8 data mode with loaders and actions, `requireRole('admin')`
middleware, validated env, lazy routes — and two **Zustand** stores holding the
cart and the wishlist.

Those two stores are still there, and they stay there. Nothing in this demo
deletes them. That is the first honest point of the day: **two state libraries
can live in one app**, which is what a real migration looks like for the
eighteen months it takes.

New, empty, waiting for you: `src/store/` (`index.ts`, `hooks.ts`, `filters.ts`,
`inventory.ts`, `recent.ts`, `listeners.ts`, `extra.ts`,
`createAppAsyncThunk.ts`, `session.ts`), `src/api/baseQuery.ts`,
`src/api/inventoryApi.ts`, `src/components/inventory/*` and two routes under
`/account/inventory`. Already written so you only write the interesting part:
`src/lib/errorInfo.ts` (the serialisable error you will need in Lab 2),
`src/lib/concurrency.ts` (bounded parallelism for Lab 5), `session.ts`'s
one-line `createAction`, and `routes/account/inventoryLoader.ts`.

Two things were also added to the base app for you, with no marker on either:
`listProducts`' `sortBy` union now includes `'stock'` (DummyJSON sorts on it —
verified), and every product service takes a dev-only `delayMs` that appends
DummyJSON's `?delay=`. That second one is an **instrument**: the toolbar has a
"Simulated latency" select, behind `import.meta.env.DEV`, offering none, 2 s and
4 s. Every "now make it slow" step in this guide uses it rather than asking you
to edit a URL.

New dependencies: **`@reduxjs/toolkit@2.12.0`** and **`react-redux@9.3.0`**,
both already in `package.json`, both imported for the first time today.
`zustand@5.0.15` is still there, untouched.

> This demo assumes **no Redux knowledge at all**. If you have some, it is
> probably the 2016 kind — `connect`, `mapStateToProps`, action-type constants,
> switch statements, sagas. None of that appears here except as "what you will
> see in older code", clearly labelled.

## What you ship today

The **Inventory Console**: an admin-only screen at `/account/inventory` that is
deliberately *not* built on route loaders, so the store has to own the async and
you get to see exactly what that costs and what it buys.

- A **status machine** that cannot contradict itself, driven by one
  `createAsyncThunk` — `pending` / `fulfilled` / `rejected`, `rejectWithValue`
  carrying a serialisable `ApiError`, `condition` refusing a duplicate request,
  `signal` aborting a superseded one.
- **Normalised entities** through `createEntityAdapter`, and memoised
  `createSelector` selectors that rebuild the visible list — including selector
  factories for per-row state.
- **Optimistic inline stock editing** with a real rollback and per-row error
  state, never one global flag.
- **Bulk restock with undo**, run by `createListenerMiddleware` — `takeLatest`
  cancellation, forked tasks, bounded concurrency, honest partial failure.
- **A "recently inspected" list**, persisted with an explicit **version and
  migration** from an older shape.
- **One sign-out action**, handled by several slices, leaving the Zustand cart
  and wishlist alone.
- Then the same fetching **rebuilt in RTK Query** on a custom `baseQuery` that
  wraps your existing axios client — tags, invalidation, `onQueryStarted`
  optimistic updates — and a line count of what that replaced.
- And the **Redux DevTools**: named actions, a state tree you can browse, and
  working time-travel.

By the end you will be able to answer, without hesitating:

- Why `createSlice` lets you write `state.q = value` and that is not a mutation
- What `rejectWithValue` gives you that `throw` does not
- What `condition` runs before, and what `signal` aborts
- Why `ids` + `entities` re-renders one row instead of twelve
- Why an inline `useSelector((s) => s.x.filter(…))` re-renders for ever, and the two ways to fix it
- Where a side effect goes, and why it is not a reducer and not a component
- What the serializability check catches, what the real warning says, and why `ignoredPaths` is usually the wrong fix
- What RTK Query generates for you, what a custom `baseQuery` is, and when to reach for a thunk anyway
- Whether your next project should use Redux Toolkit or Zustand, and what the answer depends on

> **The point of today is not "Redux is good".** It is that a central store
> with a serialisable action log buys you a specific, expensive thing —
> a recording of everything that happened — and you should know what it costs.
> 📖 Demo 13's [Groundwork and The landscape](../13-client-state-with-zustand/)
> sections cover state theory and the wider library field; this guide does not
> repeat them and stays on Redux Toolkit versus Zustand.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24b-redux-toolkit/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/24b-redux-toolkit/starter && npm install && npm run dev`.

**Install the Redux DevTools browser extension** before you start. Half of this
demo is watched rather than read, and the extension is where you watch it:
[Chrome Web Store](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
· [Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/reduxdevtools/)
· [source and docs](https://github.com/reduxjs/redux-devtools).

Then sign in as **`emilys` / `emilyspass`** — the console is admin-only, guarded
by the `requireRole('admin')` middleware you wrote in Demo 11 — and open
DevTools → **Network**, filtered to **Fetch/XHR**.

---

## The cold open

Do this on the **finished** app, not the starter. Open
`demos/24b-redux-toolkit/solution`, run it, sign in as `emilys`, and go to
`/account/inventory`.

Now open the **Redux** tab in your browser devtools — a tab that did not exist
before today — and do four ordinary things:

1. Type `lip` in the search box.
2. Tick **Low stock**.
3. Change a row's stock from `5` to `50` and press Enter.
4. Select three rows and press **+10 stock to selected**.

Look at the left-hand column:

```
filters/searchChanged
inventory/load/pending
inventory/load/fulfilled
filters/lowStockToggled
inventory/load/pending
inventory/load/fulfilled
inventory/saveStock/pending
inventory/saveStock/fulfilled
inventory/bulkRestockRequested
inventory/saveStock/pending
inventory/saveStock/pending
inventory/saveStock/pending
inventory/bulkProgressed
…
```

Every one of those is a plain object. Click any of them and you see its payload.
Click the **Diff** tab and you see exactly which keys of the state that action
changed. Now drag the slider at the bottom backwards.

**The application goes back in time.** The stock returns to 5. The low-stock
filter comes off. The search box empties. Drag forwards and it all happens
again, in order, deterministically.

Nothing in the app was written to support this. There is no undo stack, no
history array, no snapshot code. It is a free consequence of two rules that the
whole of Redux is built on:

- **every change is described by a serialisable object**, and
- **state is replaced, never edited**.

So now ask the question this demo exists to ask: *what would it take to get that
from the cart store you already have?*

Your Zustand cart store (Demo 13) is a good store. It is twenty lines, it has no
provider, and its `add()` is a function that calls `set()`. To get the log above
out of it you would need every `set()` to be described by a name and a payload
before it happened, a middleware position to observe them from, a way to replay
them into a fresh state, and a guarantee that nothing anywhere edits state in
place. Zustand can do some of that — its `devtools` middleware, and Demo 24a
spends a lab on it — but you have to opt in at every call site, and anything you
forget is simply missing from the recording.

Redux makes it impossible to forget, by making the action the only way in.

| | A plain store (Zustand) | Redux Toolkit |
|---|---|---|
| How state changes | you call a function that calls `set` | you **dispatch a description**, a reducer answers it |
| What a change is | a closure | a serialisable object |
| Who can observe it | whoever subscribed | every middleware, before and after |
| Rewinding | you build it | it is already there |
| Cost | nothing | this guide |

That last row is the honest one. Seven labs. The last section of this guide is a
straight recommendation about which one to use, and it does not say "Redux".

---

## Lab 1 — The store, typed, and your first slice (20 min)

### Problem

The Inventory Console needs filters: search text, a category, a "low stock only"
switch, a sort and a page. Five values that a toolbar writes, a data loader
reads, a table reads, and a pager reads.

`useState` in the page is the obvious answer, and it is wrong here for a reason
worth naming: **the async that reads these filters is not going to live in the
page.** By Lab 5 a background listener will need them, and a listener has no
component and no hooks. State that non-React code has to read has to live
somewhere non-React code can reach.

### Concept

**A store is three things: a state object, a reducer, and a dispatch.**

```text
  ┌────────────┐   dispatch(action)   ┌──────────────────────────┐
  │ component  │ ───────────────────► │   middleware chain       │
  │            │                      │  listener → thunk → api  │
  └────────────┘                      └────────────┬─────────────┘
        ▲                                          │ action
        │ re-render                                ▼
        │ (only if the           ┌───────────────────────────────┐
        │  selected value        │  reducer(state, action)       │
        │  changed)              │  = combineReducers over the   │
        │                        │    slice map                  │
   ┌────┴───────────┐            └───────────────┬───────────────┘
   │ useAppSelector │                            │ NEW state object
   │  (subscribed)  │ ◄──────── notify ──────────┘
   └────────────────┘
```
*Figure 1 — one dispatch, one pass through the middleware chain, one new state
object, and only the subscribers whose selected value changed re-render.*

The middleware chain is the part that is specific to Redux and the part that
pays for the whole architecture. An action is an ordinary object that travels
through a queue of functions before it reaches the reducer, and each of those
functions can read it, log it, delay it, replace it or swallow it. The devtools,
the thunk support, the serializability check and Lab 5's listeners are all just
middleware.

**`configureStore` is the modern entry point and it has already made five
decisions for you.** In 2016 you wrote `createStore(combineReducers({…}),
applyMiddleware(thunk, logger), composeWithDevTools())` and got it wrong.
`configureStore` combines the slice map, installs `redux-thunk`, installs the
development-only immutability and serializability checks, and connects the
devtools. You will see `createStore` in older code; it is deprecated, and the
official advice is to use `configureStore`.

**`createSlice` writes your action creators for you.** Give it a name, an
initial state and a bag of functions, and each function's *name* becomes an
action type:

```ts
createSlice({ name: 'filters', reducers: { searchChanged(state, action) {…} } })
// →  action creator:  searchChanged('lip')
// →  action:          { type: 'filters/searchChanged', payload: 'lip' }
```

No constants file, no switch statement, no `ACTION_TYPES.SEARCH_CHANGED`
misspelled in one of two places. If you meet a codebase with all three, that is
what `createSlice` replaced.

**The Immer illusion.** Inside a case reducer you write `state.q = 'lip'` and
`state.page = 0`, which looks exactly like the mutation Redux forbids. It is
not. `createSlice` runs every case inside Immer's `produce`: `state` is a
*draft*, a Proxy that records what you touched, and Immer returns a brand-new
object in which only the changed branches are new and everything else is the
same object it was. That is why the reference check in `useSelector` still
works — and why the whole subtree you did not touch does not re-render.

Two rules keep the illusion safe:

- **Either edit the draft, or return a new value — never both.** `filtersCleared`
  returns `initialState`; it must not also assign to `state`.
- **Never edit the draft asynchronously.** The draft is finalised when the case
  returns; a `setTimeout` that touches it later throws.

**A `prepare` callback is where the impure part goes.** `sortChanged(sortBy,
order)` takes two arguments and produces one payload. Generating an id, stamping
a time, normalising an input — anything that is not a pure function of the
current state belongs in `prepare`, so the reducer stays a pure function you can
test by calling it.

**And TypeScript says:** annotate the action, not the state.
`(state, action: PayloadAction<string>)` is the whole idiom; `state` is inferred
from `initialState` and never needs a type.

### Steps

**A. `src/store/filters.ts` — `TODO(lab-1.1)`**

```ts
const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // F3: any filter change resets to page 1. Putting that rule in the reducer
    // rather than in the component means no caller can forget it.
    searchChanged(state, action: PayloadAction<string>) {
      state.q = action.payload;
      state.page = 0;
    },
    categoryChanged(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 0;
    },
    lowStockToggled(state) {
      state.lowStockOnly = !state.lowStockOnly;
      state.page = 0;
    },
    // Two arguments in, one payload out.
    sortChanged: {
      reducer(state, action: PayloadAction<{ sortBy: SortKey; order: SortOrder }>) {
        state.sortBy = action.payload.sortBy;
        state.order = action.payload.order;
        state.page = 0;
      },
      prepare(sortBy: SortKey, order: SortOrder = 'asc') {
        return { payload: { sortBy, order } };
      },
    },
    pageChanged(state, action: PayloadAction<number>) {
      state.page = Math.max(0, action.payload);
    },
    // Returning a value REPLACES the state. Do this OR edit the draft, never both.
    filtersCleared: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(signedOut, () => initialState);   // Lab 5 explains this line
  },
  selectors: {
    selectFilters: (state) => state,
    selectPage: (state) => state.page,
    selectLowStockOnly: (state) => state.lowStockOnly,
  },
});
```

The `selectors` block is newer than most tutorials. Selectors declared there are
written against the *slice's* state, and `filtersSlice.selectors` exposes them
against the *root* state — so this file never has to know it is mounted at
`state.filters`. Move the slice and nothing below it changes.

**B. `src/store/index.ts` — `TODO(lab-1.2)`**

```ts
export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    inventory: inventoryReducer,
    recent: recentReducer,
  },
});

// DERIVED, never declared by hand: add a slice and RootState grows a key.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
```

Those last three lines are the single most important piece of Redux TypeScript
and the one people hand-write and regret. `RootState` is *inferred from the
store*, so a slice you add appears automatically and a selector that reads a
slice you deleted stops compiling.

**C. `src/store/hooks.ts` — `TODO(lab-1.3)`**

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

Write these once and import *these* everywhere. Plain `useSelector` types its
state as `unknown`, so every selector needs an annotation and a typo compiles;
plain `useDispatch` returns a `Dispatch` that does not accept a thunk, so
`dispatch(loadInventory(filters))` in Lab 2 would be a type error and the usual
workaround is a cast that hides real ones.

`withTypes` is the React Redux 9 form. You will still see
`export const useAppDispatch: () => AppDispatch = useDispatch` in most
codebases; it does the same thing with more punctuation.

**D. `src/main.tsx` — `TODO(lab-1.4)`**

```tsx
<Provider store={store}>
  <ThemeProvider>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </ThemeProvider>
</Provider>
```

The `Provider` does not *own* the store — the store is a module-scope singleton,
created by `configureStore` when `src/store/index.ts` is first imported. The
provider only publishes it through context so `useSelector` can find it. It has
to wrap `RouterProvider`, because every page that reads the store lives inside
the router.

`ThemeProvider` and `ToastProvider` stay exactly where they are. A theme and a
toast list are what Context is *for*: few writers, rare changes, no need for
selectors, no need for a recording.

**E. `src/components/inventory/InventoryToolbar.tsx` — `TODO(lab-1.5)`**

```tsx
const dispatch = useAppDispatch();
const filters = useAppSelector(selectFilters);

// The draft is LOCAL. An action per keystroke would flood the devtools log
// and re-render every subscriber; debouncing into the store keeps both honest.
const [draft, setDraft] = useState(filters.q);
const commit = useDebouncedCallback((value: string) => dispatch(searchChanged(value)), 400);
```

and, when the store's `q` changes underneath you (Reset, sign-out):

```tsx
// Adjusted DURING the render, not in an effect. React throws this render away
// and re-runs it immediately, so the stale value is never painted — which is
// what the `set-state-in-effect` lint rule is telling you.
const [lastCommitted, setLastCommitted] = useState(filters.q);
if (filters.q !== lastCommitted) {
  setLastCommitted(filters.q);
  setDraft(filters.q);
}
```

### Verify

1. `npm run dev`, sign in as `emilys`, open `/account/inventory`.
2. Open the **Redux** devtools tab. The **State** panel shows three keys:
   `filters`, `inventory`, `recent`. The inventory list is still empty — that is
   Lab 2.
3. Type in the search box. After 400 ms **one** `filters/searchChanged` action
   appears. Type ten characters quickly and you still get one.
4. Click it and open **Action**: `{ type: 'filters/searchChanged', payload: 'lip' }`.
   Open **Diff**: `filters.q` changed, and so did `filters.page`. That second
   change is the rule you put in the reducer.
5. Set the page to 3 with the pager, then change the category. Page goes back to
   0, and you did not write a line of component code to make that happen.
6. Change the sort. One action, one payload with two fields — the `prepare`
   callback.
7. In `filters.ts`, temporarily make `filtersCleared` do *both*: `state.q = ''`
   **and** `return initialState`. Click Reset. You get
   `Error: [Immer] An immer producer returned a new value *and* modified its
   draft.` Put it back.

### Watch out

- **Two sources of truth for the search box.** The draft is local *and* the
  store has `q`. That is correct — a draft is not a filter until it is
  committed — but it means you must reconcile when the store changes underneath.
  The "adjust during render" block is that reconciliation.
- **`state = something` inside a case reducer.** Assigning to the parameter
  replaces a local variable and does nothing at all. Assign to `state.x`, or
  `return` a new value.
- **An action per keystroke.** It works. It also gives you a devtools log you
  cannot read and a re-render of every subscriber on every character. Debounce
  into the store; keep the draft local.
- **Importing `useSelector` directly** in one file out of twenty. Everything
  compiles, that one file is untyped, and you find out in six months.
- **Putting the whole store behind one slice.** `reducer: { app: appReducer }`
  compiles and throws away the only thing the slice map is for.

### In the real world

The argument you will actually have is "do we need a store at all for five
filter values?", and for five filter values the answer is often no — the URL is
better, as Demo 7 showed and Demo 19's Lab 7 table argued. What tips it here is
the *next* requirement: a background listener has to read these values, and a
listener is not a component. The moment non-React code needs state, a store
stops being a preference and becomes the mechanism.

### Further reading

- [`configureStore`](https://redux-toolkit.js.org/api/configureStore) — the full option list, including `preloadedState` and `devTools`
- [`createSlice`](https://redux-toolkit.js.org/api/createSlice) — reducers, `prepare`, `extraReducers`, `selectors`
- [Writing reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) — the draft rules, in detail, with the exact errors
- [Usage with TypeScript](https://react-redux.js.org/using-react-redux/usage-with-typescript) — the typed-hooks pattern, from React Redux itself
- [Redux Essentials, part 1](https://redux.js.org/tutorials/essentials/part-1-overview-concepts) — the official ground-up introduction

---

## Lab 2 — `createAsyncThunk`: async that lives in the store (25 min)

### Problem

A reducer is a pure function. It cannot fetch, and it must not: a function that
returns a different answer on Tuesday cannot be replayed, and replaying is the
whole point.

So the request has to happen somewhere else, and that somewhere has to be able
to dispatch. That is what a **thunk** is — a function you dispatch instead of an
object, which the thunk middleware calls with `dispatch` and `getState` rather
than passing to the reducer. `createAsyncThunk` is a thunk that also dispatches
three actions for you, and those three actions are the state machine.

### Concept

**The lifecycle is three actions and you handle them in `extraReducers`.**

```text
  dispatch(loadInventory(filters))
        │
        ├─► condition(filters, { getState })  ── false ──► nothing at all
        │                                                  (no pending,
        │                                                   no spinner)
        ▼ true
  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐
  │ idle         │───►│ loading      │───►│ ready                 │
  │              │    │ pending      │    │ fulfilled → setAll()  │
  └──────────────┘    └──────┬───────┘    └───────────────────────┘
                             │
                             ├──────────►┌───────────────────────┐
                             │  rejected │ error                 │
                             │           │ action.payload =      │
                             │           │ the ApiErrorInfo      │
                             │           └───────────────────────┘
                             │
                             └──►  promise.abort()  ──► rejected, with
                                                    meta.aborted = true.
                                                    NOT an error state:
                                                    the user moved on.
```
*Figure 2 — the async lifecycle. `condition` guards the entrance; `abort` leaves
by the same door as a failure but must not be treated as one.*

**`rejectWithValue` is the difference between a message and an error.** If your
payload creator throws, RTK puts a *stringified* copy on `action.error` —
`{ name, message, stack }` and nothing else. Your `ApiError`'s `status`, `code`
and `requestId` are gone, so the reducer cannot tell a 404 from a timeout.
`return rejectWithValue(x)` puts `x` on `action.payload`, typed, intact.

**And the thing you pass it must be plain data.** This is where the default
middleware earns its place. Put the `ApiError` instance in the store and the
console says, exactly:

```
A non-serializable value was detected in an action, in the path: `payload`. Value: ApiError …
Take a look at the logic that dispatched this action:  {type: 'inventory/load/rejected', …}
(See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants)
(To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)

A non-serializable value was detected in the state, in the path: `inventory.error`. Value: ApiError …
Take a look at the reducer(s) handling this action type: inventory/load/rejected.
(See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)
```

Two warnings: one for the action, one for the state that action produced. The
check is *right*, and it is telling you something real — an `ApiError` is a
class instance with a prototype and a `cause` that holds the original axios
error, which holds the request, the response and a socket. The devtools cannot
serialise it, time-travel cannot restore it, and a persistence layer would choke
on it.

**The wrong fix** is to add the path to `ignoredPaths`:

```ts
// Don't. This silences the smoke alarm.
serializableCheck: { ignoredPaths: ['inventory.error'] }
```

**The right fix** is to store data. `src/lib/errorInfo.ts` is already written:

```ts
export interface ApiErrorInfo {
  message: string; status: number; code: string; requestId?: string; isRetryable: boolean;
}
export function toErrorInfo(error: unknown): ApiErrorInfo { /* ApiError.from(error), five fields */ }
```

Five fields — which is, not coincidentally, exactly what `ErrorNotice` renders.
The component never needed the class, only its public surface, and its prop type
has already been widened to a structural `DisplayableError` that both the class
and the plain object satisfy. **The API layer keeps the class; the store keeps
data.** That boundary is the lesson.

**`extra` is dependency injection with no framework.** `configureStore` takes
`thunk: { extraArgument: extra }`, and every thunk then gets `thunkApi.extra`.
A thunk could import `listProducts` directly and in a small app that is fine;
passing it in means a test hands the store a fake without `vi.mock` touching the
module graph (Lab 7), and the dependency is declared in one place.

**`condition` runs before `pending` and can cancel the whole thing.** Return
`false` and *nothing* is dispatched — no pending, no spinner, no fulfilled. That
is the dedupe. It is not a cache: a second request for the same filters a minute
later runs normally, because by then nothing is in flight.

**`signal` is the abort.** The thunk gets an `AbortSignal`; forward it to the
service, which has taken one since Demo 5. `dispatch(thunk(arg))` returns a
promise with an `.abort()` method, so the component's effect cleanup can cancel
the request the moment the filters change.

**Now the race, which is the part everyone gets wrong.**

```text
 t0   user types "lip"          ──► request A (page 1, slow, 2 s)
 t1   user clicks page 2        ──► request B (page 2, fast, 200 ms)
 t2                                 ◄── B answers.  setAll(page 2)     ✔
 t3                                 ◄── A answers.  setAll(page 1)     ✘
                                         the screen now shows page 1
                                         while the pager says page 2

 WITH the two guards:

 t0   dispatch A   pending: currentRequestId = "A", pendingKey = "lip|…|0"
 t1   dispatch B   ├─ cleanup calls A.abort()  → signal aborts axios
                   └─ pending: currentRequestId = "B"
 t2   B fulfilled  meta.requestId === currentRequestId ──► accepted
 t3   A fulfilled  meta.requestId !== currentRequestId ──► DISCARDED
      (or A never answers at all, because the abort got there first)
```
*Figure 3 — the stale-response race. `abort()` stops most of them; the
`requestId` check catches the one that was already on the wire.*

You need **both**. `abort()` cannot un-send a response that has already left the
server, and a request that resolved a millisecond before the abort still
dispatches its `fulfilled`. The `requestId` comparison in the reducer is the
backstop, and it is three lines.

**And TypeScript says:** `createAsyncThunk.withTypes<{…}>()` once, in
`createAppAsyncThunk.ts`, fixes `state`, `dispatch`, `extra` and `rejectValue`
for every thunk in the app. Without it each thunk repeats a four-line generic
argument, and the first one somebody forgets degrades silently to `unknown`.

### Steps

**A. `src/store/extra.ts` + `src/store/createAppAsyncThunk.ts` — `TODO(lab-2.1)`**

```ts
// extra.ts — the API layer, declared once.
export const extra = { listProducts, updateProduct };
export type ThunkExtra = typeof extra;

// createAppAsyncThunk.ts
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  extra: ThunkExtra;
  rejectValue: ApiErrorInfo;
}>();
```

`import type { RootState } from './index'` is a cycle on paper — `index.ts`
imports the slices, the slices import this. It is not a cycle at runtime:
`verbatimModuleSyntax` erases a type-only import completely, so the emitted
JavaScript imports nothing from `./index` at all.

**B. `src/store/inventory.ts` — `TODO(lab-2.2)`**

```ts
export const loadInventory = createAppAsyncThunk<LoadResult, FiltersState>(
  'inventory/load',
  async (filters, { extra, signal, rejectWithValue }) => {
    try {
      const response = await extra.listProducts({
        q: filters.q,
        category: filters.category,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page,
        limit: PAGE_SIZE,
        signal,                     // the thunk's own AbortSignal → axios
      });
      return { products: response.products, total: response.total };
    } catch (error) {
      // NOT `throw`: that gives you action.error, a stringified copy with no
      // status and no code — and the class instance would trip the
      // serializability check on the way past.
      return rejectWithValue(toErrorInfo(error));
    }
  },
  {
    // Runs BEFORE pending. False ⇒ nothing is dispatched at all.
    condition: (filters, { getState }) =>
      getState().inventory.pendingKey !== filtersKey(filters),
  },
);
```

The argument is the whole `FiltersState` object rather than nothing, and that is
deliberate: it becomes `action.meta.arg` on all three lifecycle actions, so the
reducer can read the filters a request was *for* without reaching back into the
store. `filtersKey(filters)` — a six-field template string, including `delayMs` — is
that request's identity.

**C. `src/store/inventory.ts` — `TODO(lab-2.3)`**

```ts
extraReducers: (builder) => {
  builder
    .addCase(loadInventory.pending, (state, action) => {
      state.status = 'loading';
      state.error = null;
      state.currentRequestId = action.meta.requestId;   // free, on every lifecycle action
      state.pendingKey = filtersKey(action.meta.arg);
    })
    .addCase(loadInventory.fulfilled, (state, action) => {
      // LATEST WINS. A slow page-1 answer arriving after a fast page-2 answer
      // has a requestId nobody is waiting for any more.
      if (state.currentRequestId !== action.meta.requestId) return;
      productsAdapter.setAll(state, action.payload.products);   // Lab 3
      state.total = action.payload.total;
      state.page = action.meta.arg.page;
      state.status = 'ready';
      state.rows = {};
    })
    .addCase(loadInventory.rejected, (state, action) => {
      if (state.currentRequestId !== action.meta.requestId) return;
      if (action.meta.aborted) return;        // the user changed filters; not a failure
      state.status = 'error';
      state.error = action.payload ?? { /* …a fallback ApiErrorInfo… */ };
    })
    // A MATCHER runs after the cases, for every action it matches. One rule —
    // "the in-flight key is only meaningful while a request is in flight" —
    // written once instead of in three places.
    .addMatcher(isAnyOf(loadInventory.fulfilled, loadInventory.rejected), (state, action) => {
      if (state.currentRequestId === action.meta.requestId) state.pendingKey = null;
    });
}
```

`isAnyOf` is one of RTK's **matching utilities**: it builds a type guard, so
`action` is still narrowed inside the matcher. `isPending`, `isRejected`,
`isRejectedWithValue` and `isAsyncThunkAction` are the others, and they are how
you write "show a spinner for *any* pending request" in one place.

**D. `src/store/index.ts` — `TODO(lab-2.4)`**

```ts
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    thunk: { extraArgument: extra },
    serializableCheck: { /* see Lab 6 for the one legitimate ignore */ },
    immutableCheck: true,
  }),
```

Both checks are **development only** — `getDefaultMiddleware` omits them from a
production build entirely, so they cost nothing where it matters and catch
everything where you are looking.

**E. `src/routes/account/InventoryPage.tsx` — `TODO(lab-2.5)`**

```tsx
const filters = useAppSelector(selectFilters);

useEffect(() => {
  const promise = dispatch(loadInventory(filters));
  return () => promise.abort();
}, [dispatch, filters]);
```

Five lines, and both halves of the race are in them. `filters` is the slice's
state object, so its identity changes only when a filter actually changes — this
effect runs once per filter change, not once per render. The cleanup's
`.abort()` aborts the thunk, which aborts the signal, which aborts the axios
request.

> **One thing on this page is still a route loader, on purpose.**
> `routes/account/inventoryLoader.ts` fetches the category list, and the route
> blocks on it. That is not an inconsistency — it is the control in the
> experiment. The categories are unchanging server state that the toolbar cannot
> render without, so a loader is exactly right and the store has nothing to add.
> The *products* go through the store precisely so you can see what owning the
> async costs, next to something that does not. Demo 24a draws the same line in
> the same place.

### Verify

1. Reload `/account/inventory`. The Redux log shows
   `inventory/load/pending` then `inventory/load/fulfilled`, and the Network tab
   shows one `GET /products?limit=12&…`.
2. Click the **pending** action and look at **Action → meta**: there is a
   `requestId` (a random string) and an `arg` (your filters). Those two fields
   are what the whole lab is built on.
3. **Watch `condition` work.** Set **Simulated latency** to 2 s, then click the
   same page number in the pager three times quickly. **One** `pending`, one
   request. Without `condition` you would get three.
4. **Watch the abort.** Still at 2 s, type `lip`, and before it finishes type
   `sto`. The Network tab shows the first request go **red / (cancelled)**, and
   the Redux log shows `inventory/load/rejected` whose `meta.aborted` is `true`
   — with `status` still `loading`, not `error`. That is the
   `if (action.meta.aborted) return;` line.
5. **Watch latest-wins.** Comment out the `requestId` check in `fulfilled`.
   Set latency to 4 s, search, then immediately click page 2 (the second
   request is the one already in the cache-less store, so it answers first). The
   slower page-1 response lands last and the table shows page 1 while the pager
   says page 2. Put the check back and the same sequence is correct.
6. **Provoke the serializability warning.** Change `rejectWithValue(toErrorInfo(error))`
   to `rejectWithValue(ApiError.from(error) as never)`, then break the request
   (turn Wi-Fi off, or point `VITE_API_BASE_URL` at a dead host). The console
   prints the two warnings quoted above, naming `payload` and `inventory.error`.
   Put it back and they stop.
7. Kill the network entirely and reload. `status` is `error`, `inventory.error`
   is a plain object in the devtools State panel — expand it, every field is a
   string or a number — and the page shows `ErrorNotice` with a Retry button.

### Watch out

- **`throw` instead of `rejectWithValue`.** Your reducer gets
  `action.error.message` and nothing else, so "not found" and "network is down"
  become the same branch.
- **Forwarding the wrong signal.** Use the thunk's `signal`, not one you made.
  A controller you create in the component aborts on unmount; the thunk's aborts
  when the thunk is aborted, which is what `promise.abort()` does.
- **Treating an abort as an error.** Change a filter quickly and the user sees a
  red box for a request they cancelled themselves. `action.meta.aborted` exists
  precisely for this.
- **`condition` returning `false` forever.** If `pendingKey` is never cleared,
  the second request for those filters never runs and the page is stuck. That is
  what the `addMatcher` is for; delete it and watch.
- **`getState()` after an `await`.** The state you read before an await is not
  the state after it. Read late, or take what you need as the thunk's argument —
  which is why `loadInventory` takes the filters rather than fetching them.
- **A thunk per component.** `createAsyncThunk` gives you one thunk with one
  name in the log. Creating it inside a component creates a new one per render,
  with a new type string, and the devtools log becomes noise.

### In the real world

The shape in this lab — status machine, request id, abort, serialisable error —
is what every team writes once, badly, before they write it once, well. The
version above is the well one, and it is about forty lines. Keep the number in
your head: Lab 6 replaces all forty with a hook, and the honest comparison at
the end of this guide depends on knowing exactly what the forty lines were.

### Further reading

- [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) — the full `thunkApi`, `condition`, `dispatchConditionRejection`, `idGenerator`
- [Matching utilities](https://redux-toolkit.js.org/api/matching-utilities) — `isAnyOf`, `isPending`, `isRejectedWithValue` and friends
- [The serializability middleware](https://redux-toolkit.js.org/api/serializabilityMiddleware) — every option, and what each ignore list really does
- [Redux Essentials, part 5 — async logic](https://redux.js.org/tutorials/essentials/part-5-async-logic) — the same lifecycle, from the official tutorial
- [MDN: `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the platform API underneath `signal`

---

## Lab 3 — `createEntityAdapter` and selectors that do not lie (30 min)

### Problem

You have twelve products in an array. Edit row seven's stock and the array is a
new array, so every component reading it re-renders — all twelve rows, for one
number.

And finding row seven means `products.find((p) => p.id === id)`, which is a
linear scan you will write in nine places and get subtly wrong in one.

### Concept

**Normalisation is an index, and that is all it is.**

```text
  NESTED (what the server sent)      NORMALISED (what the store keeps)

  products: [                        ids: [1, 2, 3]
    { id: 1, title: 'Serum',  … },   entities: {
    { id: 2, title: 'Powder', … },     1: { id: 1, title: 'Serum',  … },
    { id: 3, title: 'Gel',    … },     2: { id: 2, title: 'Powder', … },
  ]                                    3: { id: 3, title: 'Gel',    … },
                                     }

  find by id      O(n)               entities[id]            O(1)
  update one      new array,         new entities object,
                  every reader       ONLY that row's reader
                  re-renders         re-renders
  order           implicit           explicit, in `ids`
  duplicate id    possible           impossible
```
*Figure 4 — the same twelve products, indexed. `ids` keeps the server's order;
`entities` makes every row independently addressable.*

The re-render column is the one that matters. `entities[7]` is a new object
after an edit; `entities[1]` through `entities[6]` are the *same objects they
were*, so a component selecting `entities[1]` sees no change and does not
re-render. That is not an optimisation you enable — it is what indexing buys.

**`createEntityAdapter` is that pattern, pre-written.** It gives you
`getInitialState()`, the CRUD reducers (`setAll`, `addOne`, `upsertMany`,
`updateOne`, `removeOne`, `removeAll` and the rest) and `getSelectors()`.

**Think before you add a `sortComparer`.** A comparer makes the adapter the
authority on order, which here would quietly throw away the server's `sortBy` —
you would ask for "price, lowest first", get it, and render it alphabetically.
This adapter has none. Reach for one when the *client* owns the order:

```ts
createEntityAdapter<Product, number>({
  selectId: (p) => p.id,
  sortComparer: (a, b) => a.title.localeCompare(b.title),   // client owns order
});
```

**`createSelector` is memoisation, and you need it for a specific reason.**
`useSelector` re-runs your selector after every dispatch and compares the result
by reference. A selector that builds something new every call — `.filter()`,
`.map()`, `{ …x }`, `[a, b]` — fails that comparison every time, so the
component re-renders after every action in the app, including ones about other
slices. It is not a slow render; it is an infinite one, and the symptom people
report is "my app is hanging".

```ts
export const selectVisibleIds = createSelector(
  [adapterSelectors.selectAll, selectLowStockOnly],
  (products, lowStockOnly) =>
    (lowStockOnly ? products.filter((p) => p.stock < LOW_STOCK) : products).map((p) => p.id),
);
```

The inputs are cheap and reference-stable; the expensive part runs only when one
of them actually changes.

**Return ids, not objects.** The table maps over ids and each row selects its
own entity. That is the difference between "one row re-renders" and "twelve do",
and it is a one-line decision in the selector.

**A selector factory is for per-row state.** The classic problem: `createSelector`
traditionally had a cache of size one, so twelve rows calling one shared selector
with twelve different ids evicted each other and nothing was memoised. A factory
gives each row its own instance:

```ts
export const makeSelectRowState = () =>
  createSelector(
    [(state: RootState) => state.inventory.rows, (_state: RootState, id: number) => id],
    (rows, id) => rows[id],
  );

// in the row:
const selectRowState = useMemo(() => makeSelectRowState(), []);
const rowState = useAppSelector((state) => selectRowState(state, id));
```

**An honest footnote:** Reselect 5, which RTK 2 ships, defaults to
`weakMapMemoize`, whose cache is keyed by the arguments — so a single shared
selector would in fact work here. The factory is still the pattern to recognise,
because you will meet it in every codebase written before 2024 and it is still
what you want when the extra argument is an object rather than a number.

**And TypeScript says:** `adapter.getSelectors((state: RootState) => state.inventory)`
binds the adapter's selectors to where the slice is mounted, once. After that
`selectProductById(state, id)` takes a `RootState` and returns
`Product | undefined` — the `undefined` is real and the compiler makes you deal
with it.

### Steps

**A. `src/store/inventory.ts` — `TODO(lab-3.1)`**

```ts
const productsAdapter = createEntityAdapter<Product, number>({
  selectId: (product) => product.id,
  // no sortComparer: the SERVER owns the order here
});

const initialState = productsAdapter.getInitialState<InventoryExtraState>({
  status: 'idle', error: null, total: 0, page: 0,
  currentRequestId: null, pendingKey: null,
  rows: {}, selectedIds: [], snapshot: null, bulk: IDLE_BULK,
});
```

`getInitialState(extra)` merges your fields with the adapter's `ids` and
`entities`, and the resulting type is `EntityState<Product, number> &
InventoryExtraState`. One slice, one state object, no nesting.

Lab 2's `fulfilled` case already calls `productsAdapter.setAll(state, action.payload.products)`
— `setAll` replaces both halves atomically, which is exactly right for "here is
a fresh page".

**B. `src/store/inventory.ts` — `TODO(lab-3.2)`**

```ts
const adapterSelectors = productsAdapter.getSelectors((state: RootState) => state.inventory);

export const selectProductIds = adapterSelectors.selectIds;
export const selectProductById = adapterSelectors.selectById;

export const selectVisibleIds = createSelector(/* …as above… */);
export const selectVisibleCount = createSelector([selectVisibleIds], (ids) => ids.length);
export const selectPageCount = createSelector([selectInventoryTotal], (t) => Math.ceil(t / PAGE_SIZE));
export const selectUnitsOnPage = createSelector([adapterSelectors.selectAll],
  (products) => products.reduce((sum, p) => sum + p.stock, 0));

export const makeSelectRowState = () => createSelector(/* …the factory… */);
export const makeSelectIsSelected = () => createSelector(/* …the factory… */);
```

Note what `selectUnitsOnPage` is: a **derived value**, computed on read, not
stored. Storing it would be two sources of truth, and the second one goes stale
the first time somebody forgets to update it. Derive; never duplicate.

> **Low stock is a client-side narrowing, and this is the place to say so
> plainly.** DummyJSON has **no server-side predicate for stock** — there is no
> `?stock_lt=20`, and that was checked, not guessed. So `selectVisibleIds` does
> the filtering, over the page that is already loaded.
>
> The switch is still part of `FiltersState`, so toggling it still resets to
> page 0 and still refetches, exactly like every other filter — the rule "any
> filter change refetches page one" holds with no exceptions, which is worth
> more than the one request it saves. The refetch returns the same twelve rows,
> and that is the honest cost of the rule.
>
> Against an API that *could* filter server-side, `lowStockOnly` would move into
> the request and this selector would shrink to a `map`. Demo 24a hits the same
> wall and does the same thing, so the two consoles behave identically.

**C. `src/components/inventory/InventoryTable.tsx` — `TODO(lab-3.3)`**

```tsx
export function InventoryTable() {
  const visibleIds = useAppSelector(selectVisibleIds);
  // …header…
  {visibleIds.map((id) => <InventoryRow key={id} id={id} />)}
}

function InventoryRow({ id }: { id: number }) {
  const product = useAppSelector((state) => selectProductById(state, id));
  const selectIsSelected = useMemo(() => makeSelectIsSelected(), []);
  const isSelected = useAppSelector((state) => selectIsSelected(state, id));
  if (!product) return null;
  // …one row, subscribed to exactly this product and this flag…
}
```

The title link dispatches `inspected(id)` — that is what F6 records, and Lab 5
persists it.

**D. `src/routes/account/InventoryPage.tsx` — `TODO(lab-3.4)`**

```tsx
{status === 'loading' && <RowSkeletons />}
{status === 'error'   && <ErrorNotice error={error} onRetry={() => dispatch(loadInventory(filters))} />}
{status === 'ready' && visibleCount === 0 && <EmptyState />}
{status === 'ready' && visibleCount > 0   && <InventoryTable />}
```

Four branches over one value. Compare that with the four booleans this replaced
— `isLoading`, `isError`, `isEmpty`, `hasData` — which have sixteen
combinations, twelve of which are nonsense, and at least one of which you have
shipped.

### Verify

1. Load the console. In the Redux **State** panel, expand `inventory`. You see
   `ids: [1, 2, 3, …]` and `entities: { 1: {…}, 2: {…} }` — not a `products`
   array.
2. Install React DevTools and turn on **Highlight updates when components
   render**. Edit one row's stock (Lab 4 makes this work; for now click a row's
   checkbox). **One row flashes.** Now change `InventoryTable` to select
   `selectAll` and map objects, and do it again: twelve rows flash.
3. **Prove the memoisation.** In the console, run
   `const s = store.getState(); selectVisibleIds(s) === selectVisibleIds(s)` —
   `true`. Replace `selectVisibleIds` with a plain
   `(state) => state.inventory.ids.filter(…)` and the same expression is
   `false`, which is the re-render loop in one line.
4. Tick **Low stock**. The row count drops, the pager goes back to page 1, and
   the Network tab shows a refetch of the same twelve rows — the cost the
   Concept section named, paid on purpose so the rule has no exceptions.
5. Toggle a row's selection. `selectVisibleIds` does **not** recompute: put a
   `console.log` in its output function and watch it stay silent, because
   neither of its inputs changed.
6. Sort by "Stock, lowest first". The rows come back in the server's order and
   stay in it. Now add `sortComparer: (a, b) => a.title.localeCompare(b.title)`
   to the adapter and do it again: the request still asks for stock order, the
   table renders alphabetically, and nothing warns you. Remove it.

### Watch out

- **An inline selector that builds something.**
  `useSelector((s) => s.inventory.ids.filter(…))` or
  `useSelector((s) => ({ a: s.a, b: s.b }))`. New reference every call, re-render
  after every action in the app. Either use `createSelector`, or pass
  `shallowEqual` as `useSelector`'s second argument, or select the two values
  separately.
- **A `sortComparer` fighting the server.** Covered above, and worth repeating
  because the symptom is "the sort is broken" and the cause is two hundred lines
  away.
- **Storing derived values.** `state.unitsOnPage` looks harmless until the day
  one of the six places that change stock forgets to update it.
- **Selectors that take the slice, not the root.** Mixing
  `(state: InventoryState)` and `(state: RootState)` selectors in one file
  compiles until you compose them. Pick root-state selectors and bind the
  adapter's once.
- **`entities[id]!`.** The non-null assertion on a lookup that can genuinely
  miss — a row that was just deleted, an id from a stale URL. `selectById`
  returns `Product | undefined` for a reason.

### In the real world

Normalisation is the least glamorous idea in this guide and the one that
survives longest. It is also the one place Redux's age shows in a good way: the
official guidance on normalised state shape predates every library in this
course, and `createEntityAdapter` is that guidance, packaged. The rule teams end
up with is simple — *if two screens can show the same record, index it*.

### Further reading

- [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) — every CRUD method and what `getSelectors` returns
- [Normalizing state shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape) — the original argument, with the nested-comments example
- [Deriving data with selectors](https://redux.js.org/usage/deriving-data-selectors) — when to memoise, when not to, and the "one selector, one cache entry" trap
- [`createSelector` in Reselect](https://reselect.js.org/api/createSelector) — `weakMapMemoize`, `argsMemoize`, and the size-one cache this replaced
- [RTK's `createSelector` re-export](https://redux-toolkit.js.org/api/createSelector) — why you import it from RTK rather than adding a dependency

---

## Lab 4 — Optimistic inline edit, with a rollback that works (25 min)

### Problem

Click into a stock cell, type `50`, press Enter. The cell freezes for 300 ms
while DummyJSON thinks about it, then updates. Do that for twelve rows and the
screen is a series of small stalls.

The fix is obvious — show the new number immediately — and the trap is equally
obvious once you have shipped it: when the server says no, the UI is now lying,
and you have no idea what it was lying about.

### Concept

**Optimistic means you write the answer before you have it, and you keep the
question.**

```text
  t0  user types 50, presses Enter
      dispatch(saveStock({ id: 7, stock: 50 }))
          │
          ▼
  t0  saveStock/pending     rows[7] = { status:'saving', previousStock: 5 }
                            updateOne(7, { stock: 50 })   ◄── UI SHOWS 50
          │
          │  PATCH /products/7  { stock: 50 }
          │
    ┌─────┴──────────────────────────┬───────────────────────────────┐
    ▼ 200                            ▼ 404 / network / timeout
  t1  saveStock/fulfilled          t1  saveStock/rejected
      delete rows[7]                  updateOne(7, { stock: previous })
      updateOne(7, {                   rows[7] = { status:'error',
        stock: payload.stock })                    error: payload.message }
      ◄── the SERVER's number          ◄── UI IS BACK TO 5, with a reason
```
*Figure 5 — the optimistic write and its rollback. `previousStock` is recorded
in `pending` because that is the last moment the old value is knowable.*

**Three reducers, three jobs, and none of them in a component.** `pending`
records what it is about to destroy and destroys it. `fulfilled` throws away the
record and takes **the server's whole answer**. `rejected` restores and explains.

That middle one is worth a line of its own, because it was checked rather than
assumed: `PATCH /products/3` with `{"stock": 88}` comes back with the *whole
merged product* — id, title, price, rating, category, the lot — not just the
field you sent. So the reducer merges the response over the entity instead of
picking `stock` out of it. If the server clamped the value, renamed the row or
bumped a rating while it was at it, that is where you find out. (`POST
/products/add` is the opposite: it only echoes what you sent. The two verbs do
not behave the same way, whatever the create helper's comment says.)

**Per-row state, never one global flag.** `state.rows` is a
`Record<number, RowState>` with an entry only for rows that are saving or have
failed. One `isSaving: boolean` for the whole table would disable every cell
while one of them saves, and would have nowhere to put the message.

**Where the optimistic write must NOT live: the component.** A local
`const [displayed, setDisplayed] = useState(stock)` looks simpler and is wrong
for the same reason it was wrong in Demo 19 Lab 4: the row is not the only thing
that shows this number. The header's "units on this page" total is derived from
the same entities, and the bulk bar's snapshot reads them. Write into the store
and every reader is correct for free.

**`action.meta.arg` is how `pending` knows what it is doing.** The payload
creator has not run yet, so there is no payload — but `meta.arg` is exactly what
the thunk was dispatched with, on all three lifecycle actions. That is where
`{ id, stock }` comes from in `pending` and in `rejected`.

**A note on DummyJSON, verified with real requests rather than assumed.**

- `PATCH /products/3` with `{"stock": 88}` returns `200` and the **whole merged
  product** — and persists nothing, so a reload shows the original.
- `PATCH /products/9999` returns `404` with
  `{"message":"Product with id '9999' not found"}`. The error normaliser prefers
  the server's message over the generic one, so **that exact sentence** is what
  lands in `rows[id].error`.
- `?delay=` works on PATCH as well as GET, and it delays the **error** path too
  — a 404 still arrives after the wait, which is what makes a slow rollback
  watchable.

The Verify steps below use all three.

### Steps

**A. `src/store/inventory.ts` — `TODO(lab-4.1)`**

```ts
export const saveStock = createAppAsyncThunk<Product, { id: number; stock: number }>(
  'inventory/saveStock',
  async ({ id, stock }, { extra, signal, rejectWithValue }) => {
    try {
      return await extra.updateProduct(id, { stock }, { signal });
    } catch (error) {
      return rejectWithValue(toErrorInfo(error));
    }
  },
);
```

No `condition` here, deliberately. Two edits to the same row in quick succession
are two real intentions, and the second should win — which it does, because both
run and the later `fulfilled` lands later.

**B. `src/store/inventory.ts` — `TODO(lab-4.2)`**

```ts
.addCase(saveStock.pending, (state, action) => {
  const { id, stock } = action.meta.arg;
  const current = state.entities[id];
  if (!current) return;                       // the row went away; nothing to be optimistic about
  state.rows[id] = { status: 'saving', previousStock: current.stock };
  productsAdapter.updateOne(state, { id, changes: { stock } });   // the UI changes NOW
})
.addCase(saveStock.fulfilled, (state, action) => {
  const { id } = action.meta.arg;
  delete state.rows[id];
  // The server had the last word, and it said a lot: PATCH returns the WHOLE
  // merged product. Merge it over the entity rather than picking `stock` out.
  productsAdapter.upsertOne(state, { ...state.entities[id], ...action.payload });
})
.addCase(saveStock.rejected, (state, action) => {
  const { id } = action.meta.arg;
  const previous = state.rows[id]?.previousStock;
  if (previous !== undefined) productsAdapter.updateOne(state, { id, changes: { stock: previous } });
  state.rows[id] = { status: 'error', error: action.payload?.message ?? 'Could not save that change.' };
})
```

`delete state.rows[id]` is a mutation on a draft, which Immer handles like any
other. Outside a case reducer it would be the bug the immutability check throws
on.

**C. `src/components/inventory/StockCell.tsx` — `TODO(lab-4.3)`**

```tsx
const selectRowState = useMemo(() => makeSelectRowState(), []);
const rowState = useAppSelector((state) => selectRowState(state, id));
const stock = useAppSelector((state) => selectProductById(state, id)?.stock ?? 0);

function commit() {
  setEditing(false);
  const next = Number(draft);
  if (!Number.isFinite(next) || next < 0) { setDraft(String(stock)); return; }
  if (next === stock) return;                       // nothing to say
  if (rowState?.status === 'error') dispatch(rowErrorDismissed(id));
  void dispatch(saveStock({ id, stock: next }));    // fire and forget
}
```

`void dispatch(...)` and no `await`, no `.unwrap()`, no `try`. The component's
whole job is to say what the user wants; the reducers own what happens next.
That is the shape that makes Lab 5's bulk restock free — it dispatches the same
thunk twelve times and inherits all of this.

The cell follows the store when it is not being edited, adjusted during the
render rather than in an effect:

```tsx
const [lastStock, setLastStock] = useState(stock);
if (stock !== lastStock) {
  setLastStock(stock);
  if (!editing) setDraft(String(stock));
}
```

### Verify

1. Set **Simulated latency** to 2 s. Edit a row's stock and press Enter. The
   number changes **immediately**, a small spinner appears next to it, and the
   PATCH is still in flight in the Network tab.
2. In the Redux log, `inventory/saveStock/pending` → **Diff** shows two changes:
   `inventory.entities.7.stock` and `inventory.rows.7`. One action, both halves.
3. **Force the rollback.** In `src/api/services/products.ts`, temporarily change
   `updateProduct` to send to `endpoints.products.update(9999)`. Edit a row: the
   number changes, then — after the two seconds, because the delay applies to
   the error path too — it **goes back**, and the cell shows *"Product with id
   '9999' not found"*: DummyJSON's own words, carried by the error normaliser
   into `rejectWithValue`. Put it back.
4. Edit two different rows quickly. Two independent spinners, two independent
   `rows` entries. Break one of them (step 3) and the other still succeeds —
   that is what per-row state is for.
5. Watch the header while you edit. "… units on this page" changes with the
   optimistic write and changes back with the rollback, because it is derived
   from the same entities and nobody wired it up.
6. **Time-travel the failure.** With a rollback on screen, drag the devtools
   slider back to `saveStock/pending`. The row shows the optimistic value again.
   Drag forward and it rolls back again. The failure is now a recording you can
   replay as often as you like, which is the thing the cold open promised.
7. Set latency to 4 s and edit a row while watching the Redux log live. You can
   read `pending` → (four seconds) → `fulfilled` as it happens, and expand the
   `fulfilled` payload to see the whole product come back, not just the stock.

### Watch out

- **Reading `previousStock` in `fulfilled`.** By then you have deleted it — and
  should have. The old value is only interesting on the failure path.
- **Optimistic creates.** A created row has no id until the server answers, so
  it needs a temporary id and a reconciliation. Be optimistic about edits,
  toggles and deletes; be patient about creates.
- **Silent rollbacks.** A number that quietly goes back is worse than one that
  never moved, because the user believes the first thing they saw. The row keeps
  its message until it is dismissed, on purpose.
- **`.unwrap()` in the component "just to know".** It turns a rejected thunk
  into a thrown promise you now have to catch, and an uncaught one is a console
  error on a path the reducers already handled. Use it when you genuinely need
  to sequence something after success — Lab 5 does.
- **An `isSaving` boolean.** The moment there are two rows, it is wrong.

### In the real world

The rule teams settle on is: be optimistic where the user's intent is
unambiguous and the failure is rare and reversible, and make the failure
*visible* when it happens. The second half is the one that gets skipped. A
rollback with no message is indistinguishable from a bug, and it will be
reported as one.

### Further reading

- [`createAsyncThunk` — `meta.arg` and the lifecycle actions](https://redux-toolkit.js.org/api/createAsyncThunk) — what is on each of the three actions
- [Writing reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) — `delete`, array edits, and the "both" error
- [The immutability middleware](https://redux-toolkit.js.org/api/immutabilityMiddleware) — what a mutation outside a reducer actually throws
- [Immer: `produce`](https://immerjs.github.io/immer/produce) — the draft mechanism under `createSlice`

---

## Lab 5 — `createListenerMiddleware`: where side effects live (30 min)

### Problem

"Add 10 stock to the twelve selected rows" is not a reducer — it is twelve HTTP
requests. It is not a component either: the user should be able to navigate away
while it runs and come back to find it finished.

It also needs things a thunk is awkward at. It must not fire twelve requests at
once. It must be cancellable when the user presses the button again. It must
report which rows failed and why, rather than dying on the first 404. And when
it is done, "Undo" must exist.

And separately: the "recently inspected" list has to reach `localStorage` every
time it changes, without a single component knowing that.

### Concept

**A listener is a function that runs when an action is dispatched.** You give it
a predicate — an action creator, a matcher, or an arbitrary function — and an
async effect, and the middleware calls the effect *after* the reducers have run.

That last detail is the one to hold on to:

| | Reads | Use for |
|---|---|---|
| `listenerApi.getState()` | the state **after** the reducers ran | "what is true now" — persistence |
| `listenerApi.getOriginalState()` | the state **before** | "what was true when this action arrived" — undo |

Getting those the wrong way round is the most common listener bug, and it is
silent.

**This is the third of three ways to do side effects in Redux, and the current
recommendation.**

| | What it is | Status |
|---|---|---|
| **Thunks** | a function you dispatch, with `dispatch` and `getState` | built in; right for "do this now" |
| **Listener middleware** | react to actions, cancellable, forkable | built in; right for "when X happens, do Y" |
| **Sagas** (`redux-saga`) | generators and an effects DSL (`takeLatest`, `call`, `put`) | still maintained, still everywhere in older code; no longer the default advice |
| **Observables** (`redux-observable`) | RxJS epics: a stream of actions in, a stream of actions out | its own demo — [24c](../24c-redux-observable-and-rxjs/) rebuilds today's effects as epics and then adds a WebSocket feed |

The listener middleware was introduced specifically to cover the ninety per cent
of saga use-cases that did not need generators. It gives you `takeLatest`-style
cancellation, forked child tasks, `condition`/`take` for waiting on future
actions, and debouncing — with plain `async`/`await`.

Worth being straight about the trade: RxJS is genuinely better than any of these
at *streams* — merging two sources, buffering, back-pressure, retry with
backoff, a socket that reconnects. That is exactly why Demo 24c exists and why
today's effects live in one file, `src/store/listeners.ts`, with nothing else
importing them. Swapping that file for epics should be a clean operation.

**`cancelActiveListeners()` is `takeLatest` in one line.** Call it at the top of
an effect and every earlier run of *this* listener is cancelled: its `await`s
reject with a `TaskAbortError` and its forked children stop.

**`fork` makes work a child task.** `listenerApi.fork(async () => …)` returns a
task whose `.result` you can await, and cancelling the listener cancels the
fork. The result is a discriminated union — `{ status: 'ok', value }`,
`{ status: 'cancelled' }` or `{ status: 'rejected', error }` — so a cancelled
run is something you handle rather than something that throws.

**Bounded concurrency is not optional.** Twelve simultaneous PATCHes will get
you rate-limited by a real API and will saturate the connection pool on a bad
network. `src/lib/concurrency.ts` runs N workers over one shared cursor and
returns one result per item, successes and failures alike — `Promise.all` would
throw away the eleven that worked, and `Promise.allSettled` would fire all
twelve at once.

**The bulk operation reuses `saveStock`, and that is the design.** Each item
dispatches the same thunk an inline edit does, so every row gets the same
optimistic write, the same rollback and the same per-row error, for free. Bulk
is not a second code path.

**Persistence is a side effect, so it is a listener.** Not a reducer — a reducer
that writes to `localStorage` is not a pure function and cannot be replayed. Not
a `useEffect` — the state changes whether or not the component is mounted.

```text
   dispatch(inspected(7))
         │
         ▼
   [ listener middleware ]───► reducer: recent.ids = [7, …]
         │                              (pure, replayable)
         │  after the reducers
         ▼
   matcher: isAnyOf(inspected, recentCleared, signedOut)
         │
         ▼
   saveRecent(getState().recent)  ──► localStorage
                                       { "version": 2, "ids": [7, …] }
```
*Figure 6 — persistence as an effect. The reducer stays pure; the disk write
happens afterwards, once, for three different actions.*

**Versioning is what makes persisted state survivable.** What is on disk was
written by a build you no longer ship. Three rules:

1. **Never trust it.** Parse, then validate. It is a string another tab, an
   older build, or a user with devtools open may have written.
2. **Never throw.** A corrupt entry means "no history", not a white screen.
3. **Migrate forwards only.** Recognise the old shape, convert it, move on —
   and when the right migration is "delete it", say so in the code.

Here, v1 was `{ recentlyViewed: [{ id, title }] }` — no version field, and it
cached the **title**. That second part is the mistake that made v2 necessary: a
title belongs to the catalogue, it changes without telling you, and a persisted
copy shows a name that was edited three weeks ago. v2 is
`{ version: 2, ids: [...] }` — ids and nothing else, capped at eight.

**Hydration goes in `preloadedState`, not an effect.** `configureStore` takes it,
it runs once before the first render, and there is no flash of an empty list and
no rehydrate effect to forget.

**One action, several slices.** `signedOut` is a `createAction` with no payload,
owned by no slice. `filters`, `inventory` and `recent` each handle it in their
own `extraReducers` and reset themselves; the Zustand cart and wishlist never
hear about it, which is correct, because a cart is not user-scoped in this app.
That is the shape that replaces a `resetEverything()` function which has to know
about every slice that will ever exist.

### Steps

**A. `src/store/recent.ts` — `TODO(lab-5.1)`**

```ts
export function loadRecent(): RecentState {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return initialState;
    const parsed: unknown = JSON.parse(raw);

    // v1 → v2. No version field, and an array of objects that cached the title.
    // Keep the ids, drop the titles, let the next save rewrite the entry.
    const v1 = parsed as Partial<PersistedV1>;
    if (Array.isArray(v1?.recentlyViewed)) {
      logger.info('[recent] migrating v1 (recentlyViewed) → v2 (ids only)');
      return {
        ids: v1.recentlyViewed
          .map((entry) => entry?.id)
          .filter((id): id is number => typeof id === 'number')
          .slice(0, MAX_RECENT),
      };
    }

    const candidate = parsed as Partial<PersistedV2>;
    if (candidate?.version === RECENT_VERSION && Array.isArray(candidate.ids)) {
      return { ids: candidate.ids.filter((id): id is number => typeof id === 'number').slice(0, MAX_RECENT) };
    }

    // A version from the future, or something else entirely. Start over.
    logger.warn(`[recent] unknown persisted shape (version ${String(candidate?.version)}) — discarding`);
    return initialState;
  } catch (error) {
    logger.warn('[recent] could not read localStorage', error);
    return initialState;
  }
}
```

and the reducer, where the rule lives once:

```ts
inspected(state, action: PayloadAction<number>) {
  const id = action.payload;
  state.ids = [id, ...state.ids.filter((existing) => existing !== id)].slice(0, MAX_RECENT);
},
```

**B. `src/store/listeners.ts` — `TODO(lab-5.2)`**

```ts
startAppListening({
  actionCreator: bulkRestockRequested,
  effect: async (action, listenerApi) => {
    const { amount, ids } = action.payload;

    // takeLatest, in one line.
    listenerApi.cancelActiveListeners();

    const entities = listenerApi.getState().inventory.entities;

    const task = listenerApi.fork(async () => {
      const results = await mapWithConcurrency(ids, BULK_CONCURRENCY, async (id) => {
        const current = entities[id];
        if (!current) return;
        // .unwrap() turns a rejected thunk into a throw, which is what the
        // concurrency helper needs in order to count a failure.
        await listenerApi.dispatch(saveStock({ id, stock: current.stock + amount })).unwrap();
        listenerApi.dispatch(bulkProgressed());
      }, (error) => toErrorInfo(error).message);

      return results.filter((r) => !r.ok).map((r) => ({ id: r.item, reason: r.reason ?? 'Unknown error' }));
    });

    const outcome = await task.result;
    // A cancelled run must not report: the run that cancelled it will.
    if (outcome.status !== 'ok') return;

    listenerApi.dispatch(bulkRestockFinished({ failed: outcome.value }));
  },
});
```

The reducer for `bulkRestockRequested` takes the **snapshot** and nothing else —
`Object.fromEntries(ids.map((id) => [id, state.entities[id]?.stock ?? 0]))` —
and sets `bulk` to running. The twelve requests are not its business.

**C. `src/store/listeners.ts` — `TODO(lab-5.3)`**

```ts
startAppListening({
  actionCreator: bulkUndoRequested,
  effect: async (_action, listenerApi) => {
    // getOriginalState: the snapshot as it was BEFORE this action cleared `bulk`.
    const snapshot = selectSnapshot(listenerApi.getOriginalState());
    if (!snapshot) return;

    // Undo is not "put the old numbers back on screen" — the server was told.
    // It is the reverse operation, sent the same way, through the same thunk.
    await mapWithConcurrency(
      Object.entries(snapshot).map(([id, stock]) => ({ id: Number(id), stock })),
      BULK_CONCURRENCY,
      async ({ id, stock }) => { await listenerApi.dispatch(saveStock({ id, stock })).unwrap(); },
      (error) => toErrorInfo(error).message,
    );

    listenerApi.dispatch(bulkSnapshotDropped());
  },
});

startAppListening({
  matcher: isAnyOf(inspected, recentCleared, signedOut),
  effect: (_action, listenerApi) => saveRecent(listenerApi.getState().recent),
});
```

Then wire it in `src/store/index.ts`:

```ts
preloadedState: { recent: loadRecent() },
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({ /* … */ }).prepend(listenerMiddleware.middleware),
```

`prepend`, not `concat`. The listener middleware goes **before** the thunk
middleware so it sees an action before a thunk dispatched in response to it can
run. Both return a new typed tuple — never build the middleware array by hand,
or you lose the dispatch types.

**D. `src/store/inventory.ts` + `src/routes/RootLayout.tsx` — `TODO(lab-5.4)`**

```ts
// inventory.ts, recent.ts, filters.ts — each, in its own extraReducers:
builder.addCase(signedOut, () => initialState);
```

```tsx
// RootLayout.tsx
function handleSignOut() {
  logout();
  dispatch(signedOut());                          // one action, three slices
  dispatch(inventoryApi.util.resetApiState());    // Lab 6's cache: separate state, separate reset
  navigate('/products');
}
```

**E. `src/components/inventory/BulkBar.tsx` — `TODO(lab-5.5)`** dispatches
`bulkRestockRequested(10, selectedIds)` and renders `bulk.done / bulk.total`,
the failure list with reasons, and an Undo button whenever `selectHasSnapshot`
is true. **F. `RecentlyInspected.tsx` — `TODO(lab-5.6)`** renders the persisted
ids, pairing each with a title only when that product happens to be on the
current page — the ids are ours to keep, the titles are the catalogue's.

### Verify

1. Select eight rows, press **+10 stock to selected**. The progress bar fills,
   and the Redux log shows `bulkRestockRequested`, then interleaved
   `saveStock/pending` and `saveStock/fulfilled` — **at most four pending at a
   time**. Set latency to 2 s first and you can count them in the Network tab:
   never more than four in flight.
2. Navigate to `/account/team` while it runs, then back. It finished. No
   component was mounted for most of it.
3. **Watch the cancellation.** Set latency to 4 s, start a bulk restock, and
   press the button again immediately. The first run stops — its remaining
   `saveStock` dispatches never happen — and only the second one reports.
4. **Force a partial failure.** Point `updateProduct` at id `9999` for every
   third row (or simply break the network mid-run). The alert says "9 of 12 rows
   restocked" and lists the three failures **with DummyJSON's own message**. The
   nine that worked stayed worked.
5. Press **Undo**. The reverse PATCHes go out, four at a time, and every number
   returns to what it was. This is a real reverse operation, not a screen trick.
6. **Watch the persistence.** Click three product titles. In Application →
   Local Storage, `shopscope.inventory.recent` is
   `{"version":2,"ids":[3,2,1]}`. Reload: the strip is still there, and there is
   no flash of an empty list, because `preloadedState` ran before the first
   render.
7. **Run the migration.** In the console, write a v1 entry:
   ```js
   localStorage.setItem('shopscope.inventory.recent',
     JSON.stringify({ recentlyViewed: [{ id: 5, title: 'A name from 2023' }, { id: 6 }] }));
   ```
   Reload. The strip shows two items, the console logs
   `[recent] migrating v1 (recentlyViewed) → v2 (ids only)`, and the stale title
   is **gone** — the badge shows the catalogue's current title, or `#5` if that
   product is not on the page. Open storage again: the first save has rewritten
   the entry in the v2 shape.
8. Now set it to `'{"version":99,"ids":[1]}'` and reload. Empty strip, one
   warning, no crash. Set it to `'not json at all'` and reload. Same.
9. **Sign out.** One `session/signedOut` in the log; the **Diff** shows
   `filters`, `inventory` and `recent` all reset in a single action. Open the
   cart: your items are still in it, because the cart is Zustand and nobody told
   it anything.

### Watch out

- **`getState()` where you needed `getOriginalState()`.** The undo listener
  reads a snapshot that its own action has just cleared. Swap them and Undo
  silently does nothing.
- **A reducer that writes to `localStorage`.** It compiles, it works, and it
  makes your reducer impure — so time-travel now writes to disk, and replaying
  the log has side effects.
- **Forgetting `cancelActiveListeners()`.** Two runs interleave, the progress
  counter goes past the total, and the second `bulkRestockFinished` overwrites
  the first one's failures.
- **Reporting from a cancelled run.** `task.result.status` is there for exactly
  this. Ignore it and the cancelled run announces results the user is no longer
  looking at.
- **`Promise.all` over the ids.** One 404 and you lose every other result,
  including the successes you have already applied optimistically.
- **`concat` instead of `prepend` for the listener middleware.** It still works
  for most cases, and then one day a listener does not see an action a thunk
  dispatched, and you spend an afternoon on it.
- **Persisting somebody else's data.** The recent list stores ids, not titles.
  Cache a title and you will show a name that was changed three weeks ago.

### In the real world

The two questions to ask of any bulk operation are "what happens when the fifth
one fails?" and "what does the user do about it?". A progress bar that only
knows how to reach 100% is a lie with a percentage on it. The version here —
bounded concurrency, per-item results, named failures, a real undo — is about
sixty lines and is the minimum that survives contact with a flaky network.

### Further reading

- [`createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware) — `fork`, `take`, `condition`, `delay`, `cancelActiveListeners`, and the saga comparison table
- [`getDefaultMiddleware`](https://redux-toolkit.js.org/api/getDefaultMiddleware) — `prepend` vs `concat`, and why the tuple type matters
- [Side-effect approaches](https://redux.js.org/usage/side-effects-approaches) — thunks, sagas, observables and listeners, compared officially
- [`createAction`](https://redux-toolkit.js.org/api/createAction) — the one-line action with `.match()`, for cross-slice coordination
- [MDN: `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — quota, private mode, and why every access is wrapped

---

## Lab 6 — RTK Query, on the axios client you already have (30 min)

### Problem

Look back at what Labs 2 to 4 cost. A thunk. A status enum. A `requestId`. A
`pendingKey`. Three `extraReducers` cases for the load and three for the save.
An entity adapter. An effect that dispatches and aborts.

**108 lines of code** in `src/store/inventory.ts`, plus a five-line effect in
the page. Every one of them correct, every one of them tested, and every one of
them something you will write again for the next screen.

And for all that, the console still has no cache. Leave `/account/inventory`,
come back, and it fetches page one from scratch — because the reducer's
`setAll` is the only memory it has, and sign-out wipes it.

### Concept

**RTK Query is a cache with a code generator attached.** You describe endpoints;
it generates the reducer, the middleware, one hook per endpoint, the cache keyed
by the endpoint argument, request deduplication across components, abort
signals, the loading flags, the tag graph and the devtools entries.

```text
  useGetInventoryQuery(filters)
        │
        │ the ARGUMENT is the cache key
        ▼
  ┌──────────────────────────────────────────────┐
  │  cache entry  'getInventory({q:"lip",page:0})'│
  ├──────────────────────────────────────────────┤
  │  HIT  + fresh   ──► return data, no request  │
  │  HIT  + stale   ──► return data AND refetch  │
  │  MISS           ──► subscribe, then ▼        │
  └───────────────────────────┬──────────────────┘
                              ▼
                     ┌──────────────────┐
                     │  baseQuery(args) │  ◄── YOURS: axios + interceptors
                     └────────┬─────────┘
                              │ { data } | { error }
                              ▼
              providesTags → [Product:1, Product:2, …, Product:LIST]
                              │
   setStock({id:7}) ─ invalidatesTags [Product:7] ─┘
                              │
                              ▼
        every entry providing Product:7 is marked stale;
        the ones being WATCHED refetch now, the rest when somebody looks
```
*Figure 7 — the RTK Query cache. The argument identifies the entry; tags
describe what is in it; invalidation is how a write reaches a read.*

**The custom `baseQuery` is the whole point of this lab.** Every RTK Query
tutorial starts with `fetchBaseQuery`, and adopting it here would mean throwing
away — for the inventory endpoints only, so the app would then have *two* ways
of talking to the same server — the auth interceptor that attaches the token,
the refresh interceptor and its 401 queue from Demo 11, the request-id and
timing logger, the error normaliser and with it the single `ApiError` type, and
the timeout and validated base URL behind them.

None of that is necessary. A `baseQuery` is just a function: args in,
`{ data }` or `{ error }` out.

```ts
export const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiErrorInfo> =
  async ({ url, method = 'GET', params, data }, { signal }) => {
    try {
      const response = await api.request({ url, method, params, data, signal });
      return { data: response.data };
    } catch (error) {
      return { error: toErrorInfo(error) };
    }
  };
```

Eleven lines, written once, and every endpoint in the app's future goes through
the layer Demos 5 to 8 built. Two rules it must obey: **never throw** — a
rejection here is an unhandled error inside the middleware, not a rejected query
— and **the error must be serialisable**, because it lands in the store exactly
like a thunk's `rejectWithValue`.

**Tags are how a write reaches a read.** `providesTags` says what a cache entry
contains; `invalidatesTags` says what a mutation changed. One tag per row plus a
`LIST` tag is the standard shape, and it lets a single-row update refetch only
the entries that actually contain that row.

**`onQueryStarted` is the optimistic update, and its rollback is exact.**
`updateQueryData` returns a patch object with an `undo()` — Immer produced the
patch, so reversing it restores precisely what changed rather than restoring a
whole snapshot over the top of whatever else has happened since.

**Where RTK Query charges you.** The mutation argument carries `filters`, purely
so `updateQueryData` knows which cache entry to edit. That is the tax on an
optimistic update against a parameterised list, and it is worth knowing before
you design your arguments.

### Steps

**A. `src/api/baseQuery.ts` — `TODO(lab-6.1)`** is the function above.

**B. `src/api/inventoryApi.ts` — `TODO(lab-6.2)`**

```ts
export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Product'],          // declaring the vocabulary makes a typo a compile error
  keepUnusedDataFor: 120,         // TanStack Query's staleTime, in SECONDS
  endpoints: (build) => ({
    getInventory: build.query<InventoryPage, FiltersState>({
      query: (filters) => ({ url, params }),                    // …the same URL logic as Lab 2
      transformResponse: (r: ProductListResponse) => ({ products: r.products, total: r.total }),
      providesTags: (result) =>
        result
          ? [...result.products.map((p) => ({ type: 'Product' as const, id: p.id })),
             { type: 'Product' as const, id: 'LIST' }]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),
```

**C. `src/api/inventoryApi.ts` — `TODO(lab-6.3)`**

```ts
    setStock: build.mutation<Product, { id: number; stock: number; filters: FiltersState }>({
      query: ({ id, stock }) => ({ url: endpoints.products.update(id), method: 'PATCH', data: { stock } }),

      async onQueryStarted({ id, stock, filters }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          inventoryApi.util.updateQueryData('getInventory', filters, (draft) => {
            const row = draft.products.find((product) => product.id === id);
            if (row) row.stock = stock;          // a draft, so this is Immer again
          }),
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },

      // The ONE row. 'LIST' would refetch every page of every filter
      // combination in the cache to correct one number.
      invalidatesTags: (_result, error, { id }) => (error ? [] : [{ type: 'Product', id }]),
    }),
  }),
});

export const { useGetInventoryQuery, useSetStockMutation } = inventoryApi;
```

**D. `src/store/index.ts` — `TODO(lab-6.4)`**

```ts
reducer: { /* … */ [inventoryApi.reducerPath]: inventoryApi.reducer },
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      // RTK Query's internal actions carry a promise-shaped meta that is
      // intentionally exempt. This is the ONE ignore list that is not a smell.
      ignoredActions: ['inventoryApi/executeQuery/pending'],
    },
  })
    .prepend(listenerMiddleware.middleware)
    .concat(inventoryApi.middleware),

setupListeners(store.dispatch);   // gives refetchOnFocus / refetchOnReconnect something to listen to
```

The cache **is** Redux state. It has a `reducerPath`, it appears in the devtools
State panel, and time-travel includes it — which is why the cold open's slider
also rewinds the RTK Query page.

**E. `src/routes/account/InventoryQueryPage.tsx` — `TODO(lab-6.5)`**

```tsx
const { data, error, isLoading, isFetching, refetch } = useGetInventoryQuery(filters);
```

One line for F1 and F3 together. The argument is the cache key, so changing a
filter is a *different entry* and there is nothing to race. `isFetching` (a
request is in flight) versus `isLoading` (and we have nothing to show) is the
distinction that lets the table stay on screen, dimmed, rather than collapsing
into a skeleton on every keystroke.

The toolbar and the pager are reused unchanged — the filters slice is still the
filters slice, and RTK Query does not want to own your UI state.

**Now count.**

| | Thunk (Labs 2–4) | RTK Query (Lab 6) |
|---|---|---|
| The thunks | 34 lines | — |
| `extraReducers` | 47 lines | — |
| Entity adapter + state fields | 27 lines | — |
| The page's dispatch/abort effect | 5 lines | — |
| `baseQuery` (once, for the whole app) | — | 11 lines |
| The two endpoints | — | 59 lines |
| **Total** | **113** | **70** |
| Caching between visits | none | yes |
| Dedupe across components | one guard you wrote | free |
| Tag-driven refetch | none | yes |

**113 → 70**, and the seventy lines do more. That is the honest number, and it
is the answer to "should I have used RTK Query from the start".

### Verify

1. Open `/account/inventory/rtkq`. In the Redux **State** panel there is a
   fourth key, `inventoryApi`, with `queries`, `mutations`, `provided` and
   `subscriptions` inside it.
2. Type `lip`. The log shows `inventoryApi/executeQuery/pending` then
   `/fulfilled` — and `state.inventoryApi.queries` now has **two** entries, one
   per filter combination.
3. Clear the search. **No request.** The original entry is still cached and
   still fresh. Go back and forward between the two pages: instant, both ways.
4. **Watch the dedupe.** The toolbar and the table both live under the same
   query. Open the Network tab and mash the same filter: one request, however
   many components are reading.
5. **Watch the optimistic update and the tag.** Edit a row's stock. The number
   changes immediately (`onQueryStarted`), the PATCH goes out, and then a
   `GET /products…` follows it — that is `invalidatesTags` marking
   `Product:{id}` stale and the watched entry refetching. DummyJSON does not
   persist writes, so the refetch puts the old number back. **That is correct
   behaviour on a fake backend**, and it is the clearest possible proof that the
   invalidation really fired.
6. **Watch the rollback.** Point `endpoints.products.update` at `9999`. Edit a
   row: it changes, then snaps back, and `invalidatesTags` returns `[]` because
   `error` was truthy — so no pointless refetch follows a failure.
7. **Prove the baseQuery is yours.** In `src/api/interceptors/logging.ts`, the
   request-id log line fires for RTK Query's requests exactly as it does for
   every other request in the app. Sign out in another tab so the token dies,
   then act: the Demo 11 refresh queue runs, transparently, under RTK Query.
8. Switch to another browser tab and back. One refetch — that is
   `setupListeners` plus `refetchOnFocus`. Comment out `setupListeners` and it
   stops.

### Watch out

- **`fetchBaseQuery` by reflex.** It is a good default for a greenfield app with
  no API layer. In an app that has one, it is a second HTTP stack with different
  auth, different errors and different logging.
- **A `baseQuery` that throws.** Catch everything. An unhandled rejection inside
  the middleware does not become a rejected query; it becomes a broken store.
- **An unstable query argument.** `useGetInventoryQuery({ ...filters })` builds a
  new object every render. RTK Query serialises the argument to build the key, so
  it survives that — but `useGetInventoryQuery(filters.map(…))` producing new
  *contents* each render is a new cache entry each render.
- **Invalidating `'LIST'` after every write.** Every page of every filter
  combination refetches to correct one number. Invalidate the row.
- **Forgetting `.concat(inventoryApi.middleware)`.** The hooks render, nothing
  ever fetches, and RTK prints a warning you will scroll past.
- **Believing the cache replaces the store.** It holds server data. Your filters,
  your selection, your undo snapshot and your recent list are still yours, still
  in slices, and RTK Query has no opinion about them.

### In the real world

The decision is not "RTK Query or thunks" — it is "which of these two kinds of
state is this?". Server data, which you did not create and cannot be sure is
still true, belongs in a cache; RTK Query and TanStack Query are the same idea
with different spellings. Everything else belongs in a slice. The trap teams
fall into is putting server data in a slice because that is where the store is,
and then hand-writing the cache one requirement at a time — which is, precisely,
Labs 2 to 4.

### RTK Query or TanStack Query?

You met TanStack Query in Demo 19 doing this job. They solve the same problem
and the differences are real but narrow.

| | RTK Query | TanStack Query (Demo 19) |
|---|---|---|
| Ships with | Redux Toolkit — no new dependency if you have RTK | its own package (~46 kB raw) |
| Where the cache lives | in your Redux store, in the devtools, in time-travel | its own store, its own devtools panel |
| Defining endpoints | declared up front in `createApi` | a `queryFn` anywhere, any time |
| Invalidation | **tags** — declarative, typed against `tagTypes` | **query keys** — prefix matching, structural |
| Optimistic updates | `onQueryStarted` + `patch.undo()` | `onMutate` snapshot + `onError` restore |
| Infinite lists | `infiniteQueryOptions` (newer, less mature) | `useInfiniteQuery` (mature) |
| Outside React | yes, it is Redux | yes, via the `QueryClient` |
| Learning curve | needs Redux | needs nothing else |

The rule that survives review: **if the app already uses Redux Toolkit, use RTK
Query** — it is free, it is in the same devtools, and one cache is better than
two. If the app does not use Redux, do not adopt Redux in order to get RTK
Query; use TanStack Query. The two caches in one app is the only genuinely wrong
answer.

### Further reading

- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview) — what it generates, and the "why not just use…" section
- [`createApi`](https://redux-toolkit.js.org/rtk-query/api/createApi) — every endpoint option, including `transformResponse`, `serializeQueryArgs` and `merge`
- [Customizing queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries) — the official custom-`baseQuery` recipe, with the axios example
- [Optimistic updates](https://redux-toolkit.js.org/rtk-query/usage/optimistic-updates) — `updateQueryData`, `patch.undo()`, and pessimistic updates too
- [Automated re-fetching with tags](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching) — `providesTags` / `invalidatesTags` and the LIST-tag pattern
- [`setupListeners`](https://redux-toolkit.js.org/rtk-query/api/setupListeners) — `refetchOnFocus` and `refetchOnReconnect`

---

## Lab 7 — DevTools, the safety nets, and tests (15 min)

### Problem

The cold open worked because the devtools were connected. Ship that connection
to production and you have published a read/write channel into your application
state that any script on the page can find.

And the two middleware checks that have been quietly protecting you all day —
you have seen one of them fire, but you do not yet know what the other one
catches or what it costs.

### Concept

**`devTools` is a configuration object, and `false` in production is not
paranoia.** The extension communicates through a global hook; anything on the
page can use it to read your entire store — tokens, user details, cart — and to
dispatch actions into it.

```ts
devTools: env.isDev && {
  name: `ShopScope · ${env.mode}`,
  trace: true,        // capture a stack per action → "Trace" tab shows WHERE it was dispatched
  traceLimit: 20,
},
```

`trace` is the underused one. It captures a stack trace for every action, so the
devtools can tell you which component dispatched it — invaluable when an action
appears in the log and you have no idea who sent it. It costs a stack capture
per dispatch, so it is a development luxury only.

**The immutability check catches what Immer cannot.** Immer protects reducers.
It does nothing about a component that does
`const rows = useAppSelector(selectAllRows); rows.sort()` — `sort` is in-place,
the array belongs to the store, and now the store has changed without an action.
The check walks the state tree before and after every dispatch and throws:

```
A state mutation was detected between dispatches, in the path 'inventory.ids'.
This may cause incorrect behavior.
(https://redux.js.org/style-guide/style-guide#do-not-mutate-state)
```

"Between dispatches" means *your code did it outside a reducer*. The other
variant, "inside a dispatch", means a reducer mutated something it was not given
as a draft.

**Both checks are development-only and both are O(size of state).** On a store
with tens of thousands of entities they become the slowest thing in the app, and
RTK will warn you when a check takes longer than 32 ms. The fix is not to
disable them globally but to narrow them — `ignoredPaths` on the one enormous
slice — and to keep enormous slices rare.

**Testing: the payoff of every design decision in this guide.**

- A reducer is `(state, action) => state`. Call it. No store, no React.
- A selector is a function of state. Call it.
- A thunk reaches the API through `extra`, so a **real store with a fake
  `extraArgument`** is the entire harness — no `vi.mock`, no module-graph
  surgery, no network.

```ts
function makeStore(extra: ThunkExtra) {
  return configureStore({
    reducer: { filters, inventory, recent, [inventoryApi.reducerPath]: inventoryApi.reducer },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: extra } }),
  });
}
```

The reducer map has to match the real one, and that is a feature: the thunks are
typed against `RootState`, so a test store missing a slice will not accept them.
TypeScript catching a test that does not test the real app.

### Steps

**A. `src/store/index.ts` — `TODO(lab-7.1)`** is the `devTools` block above.

**B. `src/store/inventory.test.ts` — `TODO(lab-7.2)`**

Ten tests, and each one pins a claim this guide has made:

```ts
it('refuses a second identical request while one is in flight (condition)', async () => {
  const extra = okApi();
  const store = makeStore(extra);
  const filters = store.getState().filters;

  const first = store.dispatch(loadInventory(filters));
  const second = store.dispatch(loadInventory(filters));
  await Promise.all([first, second]);

  expect(extra.listProducts).toHaveBeenCalledTimes(1);
});

it('keeps the ApiError out of the store and the message in it', async () => {
  const store = makeStore({ ...okApi(), listProducts: vi.fn().mockRejectedValue(new Error('boom')) });
  await store.dispatch(loadInventory(store.getState().filters));

  const { status, error } = store.getState().inventory;
  expect(status).toBe('error');
  expect(error).toEqual(expect.objectContaining({ code: 'CLIENT', status: 0 }));
  // The proof that rejectWithValue(toErrorInfo(...)) did its job:
  expect(JSON.parse(JSON.stringify(error))).toEqual(error);
});

it('writes the new value before the request resolves, and keeps it', async () => {
  const promise = store.dispatch(saveStock({ id: 1, stock: 42 }));
  expect(store.getState().inventory.entities[1]?.stock).toBe(42);   // BEFORE the await
  expect(store.getState().inventory.rows[1]?.status).toBe('saving');
  await promise;
  expect(store.getState().inventory.rows[1]).toBeUndefined();
});

it('narrows to low stock, and memoises', async () => {
  // Same state in, SAME ARRAY out — which is what stops useSelector looping.
  expect(selectVisibleIds(store.getState())).toBe(selectVisibleIds(store.getState()));

  const before = selectVisibleIds(store.getState());
  store.dispatch(rowSelectionToggled(2));      // changes neither input
  expect(selectVisibleIds(store.getState())).toBe(before);
});
```

`npm test` runs them in about 150 ms, with no jsdom and no network. That speed
is not a bonus — it is what makes the tests get written.

### Verify

1. `npm test` — ten passing tests.
2. **Fire the immutability check.** In `InventoryTable`, add
   `const ids = useAppSelector(selectProductIds); ids.sort();`. Load the page:
   the app throws `A state mutation was detected between dispatches, in the path
   'inventory.ids'`. Remove it.
3. `npm run build && npm run preview`. The Redux devtools tab shows *"No store
   found"* — `devTools: env.isDev && {…}` is `false` in a build.
4. In development, dispatch anything and open the **Trace** tab. It names the
   component. Set `trace: false` and the tab goes empty.
5. Break one test deliberately — change `toHaveBeenCalledTimes(1)` to `2` — and
   watch it fail. A test you have never seen fail is a test you do not have.

### Watch out

- **`devTools: true` in production.** The most common Redux security mistake,
  and it is one line.
- **Disabling the checks to make a slow page fast.** They are already absent
  from your production build. If they are slow in development, your state is
  probably too big, which is the real finding.
- **Testing through the UI only.** A reducer test that fails tells you which
  line is wrong. A rendering test that fails tells you a button did not do
  something.
- **`vi.mock('../api/services/products')`.** It works and it is the thing
  `extra` exists to avoid: it couples the test to the module path, so a file
  move breaks tests that have nothing to do with the move.

### Further reading

- [`configureStore` — the `devTools` option](https://redux-toolkit.js.org/api/configureStore) — every flag the extension accepts
- [The immutability middleware](https://redux-toolkit.js.org/api/immutabilityMiddleware) — what it walks, and `ignoredPaths`
- [Redux style guide](https://redux.js.org/style-guide/) — the priority-ordered rules this demo follows
- [Writing tests](https://redux.js.org/usage/writing-tests) — the official guidance, including testing components with a real store
- [redux-devtools](https://github.com/reduxjs/redux-devtools) — the extension's own repository and docs

---

## Wrap-up — what you can now do

- [x] Explain what a store, an action, a reducer and a dispatch are, and why the middleware chain is where the value is
- [x] Build a slice with `createSlice`, including a `prepare` callback and slice-scoped selectors, and say why `state.q = x` is not a mutation
- [x] Type a Redux app once — `RootState`, `AppDispatch`, `withTypes` hooks, `createAsyncThunk.withTypes` — and never annotate a selector again
- [x] Write a `createAsyncThunk` with `rejectWithValue`, `condition`, `signal` and `extra`, and handle its three actions in `extraReducers`
- [x] Defeat a stale-response race with a request id *and* an abort, and say why one of them is not enough
- [x] Normalise with `createEntityAdapter` and explain what `ids` + `entities` buys in re-renders
- [x] Memoise with `createSelector`, recognise the inline-selector render loop on sight, and write a selector factory
- [x] Put a side effect in the listener middleware with cancellation, bounded concurrency, honest partial failure and a real undo
- [x] Persist state with a version and a forward migration, and hydrate through `preloadedState`
- [x] Coordinate several slices with one action, and leave the state that is not yours alone
- [x] Read the serializability and immutability warnings, and fix the cause rather than the symptom
- [x] Rebuild the same fetching in RTK Query on a custom `baseQuery` over your own axios client, with tags, invalidation and an optimistic patch
- [x] Test reducers, thunks and selectors in milliseconds, with no React and no network

**Where each piece of state ended up today:**

| State | Home | Why |
|---|---|---|
| Inventory filters | `filters` slice | a background listener has to read them |
| The product page | `inventory` slice (Labs 2–4) / RTK Query cache (Lab 6) | it is the server's, and Lab 6 says which is better |
| Per-row save status | `inventory.rows` | per-row, never one flag |
| Selection + undo snapshot | `inventory` slice | not the server's, and it must survive the component |
| Recently inspected | `recent` slice + `localStorage` | ours, small, and worth keeping |
| The category list | a **route loader** | unchanging server state the route cannot render without |
| Cart, wishlist | **Zustand**, untouched | they work; a migration does not have to be a rewrite |
| Theme, toasts | **Context**, untouched | few writers, no selectors needed, no recording wanted |
| Search text draft | `useState` in the toolbar | it is not a filter until it is committed |
| `?q=`, `?page=` on the public catalogue | the URL | somebody may send the link |

---

## Zustand or Redux Toolkit?

Demo 13 built two Zustand stores; today built four Redux slices and an RTK Query
cache, for the same kind of app, in the same codebase. So: which one for the
next project?

> 📖 For the wider field — the four state-management paradigms, and where signals,
> atoms and Flux sit relative to one another — read Demo 13's
> **Groundwork** and **The landscape**. This section is narrower on purpose:
> Redux Toolkit against Zustand, with the receipts from these two demos.

### The architectures, side by side

```text
  ZUSTAND (24a)                        REDUX TOOLKIT (24b)

  ┌──────────────────────┐             ┌───────────────────────────┐
  │ component            │             │ component                 │
  │  useStore(selector)  │             │  useAppSelector(selector)  │
  └──────┬───────────────┘             └──────┬────────────────────┘
         │ calls an action                    │ dispatch(action object)
         ▼                                    ▼
  ┌──────────────────────┐             ┌───────────────────────────┐
  │ store.set(partial)   │             │ listener → thunk → rtkq   │
  │  (+ devtools naming, │             │  middleware chain         │
  │     opt-in)          │             └──────┬────────────────────┘
  └──────┬───────────────┘                    │
         │                                    ▼
         │                             ┌───────────────────────────┐
         │                             │ combineReducers           │
         │                             │  filters │ inventory │    │
         │                             │  recent  │ inventoryApi   │
         │                             └──────┬────────────────────┘
         ▼                                    ▼
  ┌──────────────────────┐             ┌───────────────────────────┐
  │ NEW state object     │             │ NEW state object          │
  └──────┬───────────────┘             └──────┬────────────────────┘
         │ notify subscribers                 │ notify subscribers
         ▼                                    ▼
    re-render the                        re-render the components
    components whose                     whose selected value changed
    selected value changed

  Provider:  none                       Provider:  <Provider store>
  Middleware: a fixed stack you          Middleware: an open chain anything
              compose by nesting                     can join
  Recording:  opt in, per call           Recording:  automatic, unavoidable
  Async:      inside the store          Async:      thunks / listeners /
                                                    RTK Query
```
*Figure 8 — the same data flow. The difference is not the store; it is whether
there is a place to stand between the intention and the state.*

### Bundle size — measured, not guessed

Built with the same Vite 8 config, minified, summing the gzipped size of every
emitted JS chunk — the same method Demo 24a used, so the two sets of numbers are
directly comparable. The library deltas are over an identical React 19 + React
DOM baseline of **67.5 kB gzipped**.

| | raw | gzipped |
|---|---|---|
| `zustand` + `immer` + `devtools` + `persist` + `subscribeWithSelector` (Demo 24a) | +16.8 kB | **+6.4 kB** |
| `@reduxjs/toolkit` core + `react-redux` — slices, thunks, entity adapter, listeners, `createSelector` | +36.8 kB | **+13.2 kB** |
| …plus RTK Query | +43.9 kB | **+13.3 kB** |
| **Redux Toolkit, all of it** | **+80.7 kB** | **+26.5 kB** |

And in this actual application, total shipped JavaScript across every chunk:

| | raw | gzipped | delta |
|---|---|---|---|
| Demo 14 — ShopScope with Zustand only | 650.2 kB | **200.4 kB** | — |
| Demo 24a — the same console, in Zustand | — | **216.0 kB** | **+15.6 kB** |
| Demo 24b — this demo, RTK + RTK Query | 760.1 kB | **242.5 kB** | **+42.1 kB** |

Two things are worth pulling out of that table.

**Redux Toolkit is about four times Zustand's library cost, and RTK Query
roughly doubles it again.** Whether 26.5 kB gzipped matters is a question about
your users, not your architecture — it is one large photograph. It matters on a
2G connection in a market where data costs money; it does not matter on an
internal admin tool. Decide it with the number in front of you.

**But almost none of it is on the critical path here.** The route is lazy, so
the console itself ships as a separate 9.9 kB chunk (3.6 kB gzipped) that only
an admin who opens `/account/inventory` ever downloads. What *is* on the critical
path is the store: `configureStore` and its slices are imported by `main.tsx`,
because the `<Provider>` needs them. That is the structural difference from
Zustand, where a store is only imported by whatever uses it — and it is the
reason the whole-app delta is bigger than the library delta.

### The honest scorecard

| | Zustand | Redux Toolkit |
|---|---|---|
| **Bundle** | 6.4 kB gzipped, with `immer` | 13.2 kB, or 26.5 kB with RTK Query |
| **Lines for a first store** | ~10 | ~30 across three files |
| **Provider** | none | `<Provider>`, and it must be above everything |
| **Boilerplate** | almost none | `createSlice` removed most of it; some remains |
| **TypeScript** | good, until the middleware stack — `create<T>()(devtools(persist(immer(…))))` is where people give up | excellent once, in three exported types, then invisible |
| **DevTools** | opt-in per `set` call; anything you forget is missing from the log | automatic, complete, with diffs, trace and time-travel |
| **Time-travel** | partial, and only for what you named | works, unconditionally, for everything including the RTK Query cache |
| **Async** | write it yourself inside the store | thunks, listener middleware, or epics ([24c](../24c-redux-observable-and-rxjs/)) |
| **Caching server state** | none — you reach for TanStack Query | RTK Query, included |
| **Normalisation** | hand-rolled | `createEntityAdapter` |
| **Memoised selectors** | hand-rolled, or add reselect | `createSelector`, included |
| **Side effects outside React** | `subscribe()` | listener middleware, with cancellation and forks |
| **Testing** | trivial — a store is a module | easy — a real store, a fake `extra` |
| **Conventions for a team** | you invent them | the style guide invents them for you |
| **Ecosystem** | small and growing | very large, and much of it is fifteen years old |
| **Hiring** | "it's twenty lines, read it" | most React developers have met some Redux, not all of it good |
| **Where it hurts** | the middleware-order TypeScript pain; no cache; no story for cross-cutting effects | the volume of concepts; four files before anything renders; RTK Query's argument-as-cache-key constraints |

### The case for Zustand, made properly

For most applications, most of the time, Zustand is the right answer, and the
reasons are not "it is smaller".

A store is a module. There is no provider, so there is no tree position to get
wrong, no context to re-render, and no `Provider` missing from a test. The
mental model is a function that returns state and the functions that change it —
that is the entire API surface, and a new team member reads the whole thing in
two minutes. The cart store in this very app is twenty lines and has needed no
maintenance across eleven demos.

And the thing Redux is proudest of is not free. Today cost four files before the
first row rendered, a typed-hooks module, a pre-typed thunk creator and a
middleware chain whose order matters in two places. If you never open the
devtools time-travel slider — and most teams never do — you paid for a feature
you do not use.

The honest limits are the ones Demo 13 names: no cache, no request dedupe, no
invalidation, no background refetch. But the answer to those is TanStack Query,
not Redux — and Zustand plus TanStack Query covers the same ground as RTK plus
RTK Query, at a comparable total size, with a substantially smaller vocabulary.

### The case for Redux Toolkit, made properly

Three situations where it genuinely wins, and they are specific.

**When the action log is the product.** Not "nice for debugging" — when you need
to know what a user did, in order, from a bug report or a session replay or an
audit trail. Redux gives you a serialisable recording of every state transition
that nobody can accidentally opt out of, because dispatching is the only way in.
Zustand's `devtools` middleware can name actions, but a `set()` without a name
is still a legal `set()`, and the one that matters will be the unnamed one.

**When the state is big, shared and edited from many places.** Four slices, one
`signedOut` action, three of them resetting themselves without any of them
knowing about the others; an entity adapter; memoised selectors; a side-effect
layer that can cancel itself. Each of those is available à la carte elsewhere,
and assembling them yourself is how you end up with a house style that only
works in the directory it was written in.

**When the team is large or changes often.** The style guide, `createSlice`, the
file layout and the devtools are conventions you inherit rather than invent. On
a team of twenty, "there is one way to do this and it is documented on
redux.js.org" is worth more than 24 kB.

To which add the pragmatic one: **if you already have Redux, RTK Query is free
and it is good.** You will not adopt Redux to get it — but having it is a real
reason not to leave.

### The recommendation

**Start with Zustand.** For a new application, with a team that fits in a room,
reach for Zustand for client state and TanStack Query for server state. It is
less code, less vocabulary, and a smaller bundle, and you can see all of it at
once.

**Choose Redux Toolkit when one of these is true**, and you should be able to
say which:

- the action log is a requirement — audit, replay, session reconstruction;
- the app is large enough that shared conventions beat local ingenuity — in
  practice, more than about eight engineers, or high turnover;
- there is a lot of normalised, relational client state edited from many screens;
- you have cross-cutting side effects — cancellable, sequenced, retried — that
  want a real middleware layer;
- you are already on Redux and want RTK Query, which is the easiest yes here.

**Never choose it because it is "the industry standard".** It was, in 2017. The
industry standard now is "use the smallest thing that answers your actual
question", and today you measured both answers.

**And do not migrate for the sake of it.** ShopScope still runs Zustand for the
cart and the wishlist, alongside four Redux slices and an RTK Query cache, and
nothing about that is a compromise. Two state libraries in one app is what a
real migration looks like — pick the boundary, move what benefits, leave what
works.

> **See it from the other side:** [Demo 24a — Advanced Zustand](../24a-advanced-zustand/)
> builds this identical Inventory Console with slices, the middleware stack,
> `immer`, `subscribeWithSelector` and `persist`. Doing both and reading the two
> `src/store/` directories next to each other is the fastest way to make this
> decision yours rather than mine.

---

## Reference

Official sources only — the libraries' own documentation, the React docs and MDN.
Every link is to the exact page, not a homepage.

### Redux Toolkit — core API

- [`configureStore`](https://redux-toolkit.js.org/api/configureStore) — the store, `preloadedState`, `devTools`, the middleware callback
- [`createSlice`](https://redux-toolkit.js.org/api/createSlice) — reducers, `prepare`, `extraReducers`, `selectors`, `reducerPath`
- [`createAction`](https://redux-toolkit.js.org/api/createAction) — the standalone action, and `.match()`
- [`createReducer`](https://redux-toolkit.js.org/api/createReducer) — the builder callback, used directly
- [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) — the lifecycle, `thunkApi`, `condition`, `rejectWithValue`, `withTypes`
- [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) — CRUD reducers, `getSelectors`, `sortComparer`
- [`createSelector`](https://redux-toolkit.js.org/api/createSelector) — RTK's re-export, and why you use it rather than adding reselect
- [`createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware) — effects, `fork`, `take`, `condition`, cancellation
- [Matching utilities](https://redux-toolkit.js.org/api/matching-utilities) — `isAnyOf`, `isPending`, `isRejectedWithValue`, `isAsyncThunkAction`
- [`getDefaultMiddleware`](https://redux-toolkit.js.org/api/getDefaultMiddleware) — what is installed by default, `prepend` vs `concat`

### Redux Toolkit — the development-only checks

- [Serializability middleware](https://redux-toolkit.js.org/api/serializabilityMiddleware) — the warning in Lab 2, and every option including `ignoredPaths`
- [Immutability middleware](https://redux-toolkit.js.org/api/immutabilityMiddleware) — "a state mutation was detected", and how to narrow it
- [Working with non-serializable data](https://redux-toolkit.js.org/usage/usage-guide) — the official position, and the rare legitimate exceptions

### Redux Toolkit — usage guides

- [Usage with TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript) — `RootState`, `AppDispatch`, typed thunks, typed listeners
- [Writing reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) — drafts, the "both" error, arrays, `delete`, and the pitfalls
- [Usage guide](https://redux-toolkit.js.org/usage/usage-guide) — the broad tour, including store setup patterns
- [Redux Toolkit with Next.js](https://redux-toolkit.js.org/usage/nextjs) — why a module-scope store is wrong under SSR, and the per-request pattern

### RTK Query

- [Overview](https://redux-toolkit.js.org/rtk-query/overview) — what it generates and what it deliberately does not do
- [`createApi`](https://redux-toolkit.js.org/rtk-query/api/createApi) — every endpoint option
- [Queries](https://redux-toolkit.js.org/rtk-query/usage/queries) — hooks, `isLoading` vs `isFetching`, `selectFromResult`
- [Mutations](https://redux-toolkit.js.org/rtk-query/usage/mutations) — `onQueryStarted`, `queryFulfilled`, the mutation hook tuple
- [Customizing queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries) — the custom `baseQuery` this demo is built on
- [Optimistic updates](https://redux-toolkit.js.org/rtk-query/usage/optimistic-updates) — `updateQueryData`, `patch.undo()`, pessimistic updates
- [Automated re-fetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching) — `providesTags` / `invalidatesTags`, and the LIST-tag pattern
- [Cache behaviour](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior) — `keepUnusedDataFor`, subscriptions, when an entry is removed
- [`fetchBaseQuery`](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery) — the default this demo replaced, for comparison
- [`setupListeners`](https://redux-toolkit.js.org/rtk-query/api/setupListeners) — `refetchOnFocus` / `refetchOnReconnect`

### Redux core — concepts, conventions and testing

- [Redux Essentials, part 1 — overview and concepts](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [Redux Essentials, part 5 — async logic and data fetching](https://redux.js.org/tutorials/essentials/part-5-async-logic)
- [Redux Essentials, part 7 — RTK Query basics](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics)
- [Three principles](https://redux.js.org/understanding/thinking-in-redux/three-principles) — single source of truth, read-only state, pure reducers
- [Redux style guide](https://redux.js.org/style-guide/) — the priority-ordered rules this demo follows throughout
- [Normalizing state shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape) — the argument behind `createEntityAdapter`
- [Deriving data with selectors](https://redux.js.org/usage/deriving-data-selectors) — when to memoise, and when memoising is pointless
- [Side-effect approaches](https://redux.js.org/usage/side-effects-approaches) — thunks, listeners, sagas and observables, compared
- [Writing tests](https://redux.js.org/usage/writing-tests) — reducers, thunks, selectors and components
- [FAQ: organizing state](https://redux.js.org/faq/organizing-state) — the page the serializability warning links to

### React Redux

- [Getting started](https://react-redux.js.org/introduction/getting-started) — `Provider`, `useSelector`, `useDispatch`
- [Usage with TypeScript](https://react-redux.js.org/using-react-redux/usage-with-typescript) — `withTypes`, and the pre-9 form you will still meet

### Immer and Reselect

- [Immer](https://immerjs.github.io/immer/) — the library `createSlice` runs your reducers inside
- [`produce`](https://immerjs.github.io/immer/produce) — drafts, the return rules, and structural sharing
- [Reselect: `createSelector`](https://reselect.js.org/api/createSelector) — `weakMapMemoize`, `argsMemoize`, and selector factories

### Tools, React and the platform

- [redux-devtools](https://github.com/reduxjs/redux-devtools) — the extension, its options and its source
- [React: `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — what React Redux 9 and Zustand are both built on
- [React: you might not need an effect](https://react.dev/learn/you-might-not-need-an-effect) — including "adjusting state when a prop changes", used in Labs 1 and 4
- [MDN: `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the signal behind `thunkApi.signal`
- [MDN: `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — quota, private mode, and why every access is wrapped
- [MDN: `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) — the "is this serialisable?" question, as a platform API

### The other side, and what comes next

- [Zustand documentation](https://zustand.docs.pmnd.rs/) — [getting started](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) · [the `persist` middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist)
- [redux-observable: epics](https://redux-observable.js.org/docs/basics/Epics) — the third side-effect approach, rebuilt in Demo 24c

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `could not find react-redux context value; please ensure the component is wrapped in a <Provider>` | `<Provider store={store}>` is missing, or it is inside `<RouterProvider>` instead of above it. Lab 1 D. |
| `Error: [Immer] An immer producer returned a new value *and* modified its draft` | A case reducer did both. Either edit `state.x`, or `return` a new object — never both in one case. |
| `A state mutation was detected between dispatches, in the path 'inventory.ids'` | Something outside a reducer edited store state in place — usually `.sort()`, `.reverse()` or `.push()` on a selected array. Copy first: `[...ids].sort()`. |
| `A non-serializable value was detected in the state, in the path: 'inventory.error'` | A class instance reached the store. Store `toErrorInfo(error)`, not the `ApiError`. Adding the path to `ignoredPaths` silences the alarm, not the fire. |
| The same warning, but the path starts `inventoryApi/` | RTK Query's internal actions carry a promise-shaped meta. `ignoredActions: ['inventoryApi/executeQuery/pending']` — the one legitimate ignore. |
| `Argument of type 'AsyncThunkAction<…>' is not assignable to parameter of type 'UnknownAction'` | `dispatch` is untyped. Import `useAppDispatch` from `src/store/hooks.ts`, not `useDispatch` from react-redux. |
| The same error, but in a **test** | The test store's reducer map does not match the real one, so its `RootState` differs. Add the missing slice — including `[inventoryApi.reducerPath]`. |
| A component re-renders after every action in the app | An inline selector building a new value: `useSelector((s) => s.x.filter(…))` or `useSelector((s) => ({ a, b }))`. Use `createSelector`, pass `shallowEqual`, or select the two values separately. |
| `selectVisibleIds` recomputes constantly | One of its inputs is itself unstable. Every input selector must return the same reference for the same state. |
| The table shows page 1 while the pager says page 2 | The `requestId` check in `loadInventory.fulfilled` is missing or inverted. Lab 2 C. |
| A red error box appears whenever filters change quickly | An abort is being treated as a failure. `if (action.meta.aborted) return;` in the `rejected` case. |
| The second search never fetches; the page is stuck on the first result | `pendingKey` is never cleared, so `condition` keeps returning `false`. The `addMatcher` at the end of `extraReducers` is what clears it. |
| Nothing fetches at all, and there is no `pending` in the log | `condition` returned `false` on the first dispatch — usually `pendingKey` was initialised to something other than `null`. |
| The list is sorted alphabetically however I sort it | The entity adapter has a `sortComparer`. Remove it — here the server owns the order. |
| An edit changes one number, then everything on the row flickers | The row is selecting the whole entities object rather than its own entity. `selectProductById(state, id)`. |
| The bulk progress bar goes past 100% | Two runs are interleaved. `listenerApi.cancelActiveListeners()` at the top of the effect. |
| Undo does nothing, silently | The listener read `getState()` instead of `getOriginalState()` — by then its own action has cleared the snapshot. |
| Twelve PATCHes fire at once and some 429 | `mapWithConcurrency` was replaced by `Promise.all`. Bound it. |
| The recent strip is empty after a reload | `preloadedState: { recent: loadRecent() }` is missing from `configureStore`, or the persisted shape did not validate — check the console for `[recent] unknown persisted shape`. |
| The recent strip shows `#41` instead of a title | Correct. Titles are the catalogue's and are not persisted; a title appears only when that product is on the current page. |
| A PATCH returns 200 and the number reverts on the next load | DummyJSON **simulates** writes. The mechanism is real; the persistence is not. |
| `Product with id '9999' not found` in a row's error | Also correct — that is DummyJSON's own message, carried through the error normaliser into `rejectWithValue`. It is what Lab 4's rollback step asks you to provoke. |
| RTK Query hooks render but nothing ever fetches | `.concat(inventoryApi.middleware)` is missing from `configureStore`. |
| An RTK Query optimistic update does nothing | `updateQueryData`'s second argument must be the **exact** argument the query was called with. Compare it against `state.inventoryApi.queries` in the devtools. |
| Editing a row on the RTK Query page refetches every page | `invalidatesTags` returns the `'LIST'` tag. Return `[{ type: 'Product', id }]`. |
| The Redux devtools tab says "No store found" after `npm run preview` | Correct: `devTools: env.isDev && {…}` is `false` in a build. |
| `[config] Missing required env var VITE_API_BASE_URL. Add it to .env.test.` | Vitest runs in mode `test`. `.env.test` is committed for exactly this; check it was not deleted. |
| Time-travel moves the state but the screen does not follow | A component is holding a copy in `useState` instead of selecting. The stock cell adjusts its draft during render for this reason. |

---

## Where to go from here

This demo has no "next starter" — it is a branch of the track, not a link in the
chain. Two places to go:

- **[Demo 24a — Advanced Zustand](../24a-advanced-zustand/)** builds this exact
  Inventory Console with the slices pattern, the middleware stack and its
  ordering, `immer`, `subscribeWithSelector` and `persist` in depth. Same
  feature, same backend, same spec — read the two `src/store/` directories side
  by side.
- **[Demo 24c — Redux-Observable and RxJS](../24c-redux-observable-and-rxjs/)**
  takes *this* solution as its starter. It first replaces the listener
  middleware in `src/store/listeners.ts` with RxJS epics — a like-for-like
  comparison of the two side-effect layers over identical reducers — and then
  does the thing epics are genuinely better at: a live WebSocket stock feed,
  merged, buffered and reconnecting.
