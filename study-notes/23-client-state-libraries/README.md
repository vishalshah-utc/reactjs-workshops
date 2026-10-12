# Module 23 — Client State Libraries: Zustand, Redux Toolkit & RxJS

**Study notes** · ~4 hours

> **Goal.** What to do when reducer + Context hits a wall
> ([Module 9 §17](../09-reducers-and-context/#17-when-to-reach-for-a-library)).
> A **decision** first — which kind of state, and whether a library is
> warranted — then **one feature built three ways**: Zustand, Redux Toolkit,
> and RxJS epics on Redux. Then a comparison you can defend, and the line none
> of the three should cross: server state.

**Prerequisites:** [Module 9](../09-reducers-and-context/) in full, especially
§12–§17. [Module 8](../08-state-structure/) §8–§9.
[Module 12 §14](../12-effects/#14-usesyncexternalstore).
[Module 13 §7](../13-data-fetching-and-custom-hooks/#7-server-state-is-not-client-state).

**Versions:** React 19.3 · zustand 5.0 · @reduxjs/toolkit 2.x · react-redux 9.x · rxjs 7.x · redux-observable 3.x. TypeScript throughout.

---

## Contents

1. [Where Module 9 left you](#1-where-module-9-left-you)
2. [Three kinds of state, three owners](#2-three-kinds-of-state-three-owners)
3. [What Context cannot do well](#3-what-context-cannot-do-well)
4. [What a store is: `useSyncExternalStore`](#4-what-a-store-is-usesyncexternalstore)
5. [The decision](#5-the-decision)
6. [The shared feature: the Inventory Console](#6-the-shared-feature-the-inventory-console)
7. [Zustand: `create`, selectors, actions](#7-zustand-create-selectors-actions)
8. [Zustand: `useShallow` and selector discipline](#8-zustand-useshallow-and-selector-discipline)
9. [Zustand: slices](#9-zustand-slices)
10. [Zustand: `persist`, `devtools`, `immer`](#10-zustand-persist-devtools-immer)
11. [Zustand: outside React, and testing](#11-zustand-outside-react-and-testing)
12. [Redux Toolkit: `configureStore`, `createSlice`, Immer](#12-redux-toolkit-configurestore-createslice-immer)
13. [Redux Toolkit: typed hooks](#13-redux-toolkit-typed-hooks)
14. [Redux Toolkit: `createAsyncThunk` (and RTK Query, briefly)](#14-redux-toolkit-createasyncthunk-and-rtk-query-briefly)
15. [Redux Toolkit: `createEntityAdapter` and `createSelector`](#15-redux-toolkit-createentityadapter-and-createselector)
16. [Redux Toolkit: listener middleware, DevTools, checks](#16-redux-toolkit-listener-middleware-devtools-checks)
17. [RxJS: streams and operators](#17-rxjs-streams-and-operators)
18. [redux-observable: epics](#18-redux-observable-epics)
19. [A WebSocket as a stream](#19-a-websocket-as-a-stream)
20. [When a stream model pays off](#20-when-a-stream-model-pays-off)
21. [The comparison](#21-the-comparison)
22. [Migration paths](#22-migration-paths)
23. [Staying out of server-state territory](#23-staying-out-of-server-state-territory)
24. [Self-check](#24-self-check)
25. [References](#25-references)

**Hands-on.** [Demo 13 — Client State with Zustand](../../demos/13-client-state-with-zustand/)
replaces the `WishlistProvider`, builds a cart with a drawer, persists both
and reads the store from a router action. The **Inventory Console** is then
built three times:
[Demo 24a — Advanced Zustand](../../demos/24a-advanced-zustand/),
[Demo 24b — Redux Toolkit](../../demos/24b-redux-toolkit/) and
[Demo 24c — Redux-Observable, RxJS and a WebSocket Stream](../../demos/24c-redux-observable-and-rxjs/).
Sections a lab implements end with a **→ In the demos** line.

---

## 1. Where Module 9 left you

The standard pattern — a reducer, two contexts, a custom hook as the public
API ([Module 9 §14](../09-reducers-and-context/#14-reducer--context-the-standard-pattern))
— is enough for a great many applications. Its hook-shaped API is also what
makes a migration cheap: nothing outside `CartProvider.tsx` imports a context,
so swapping the internals touches one file.

If you cannot name the wall you hit (Module 9 §17), you do not need a store yet.

---

## 2. Three kinds of state, three owners

| Kind | The test | Owner in ShopScope |
|---|---|---|
| **Server** | a server is the authority; it changes without you | route loaders today; a query cache later ([Module 24](../24-server-state-tanstack-query-and-realtime/)) |
| **URL** | somebody might send the link; Back should undo it | `useSearchParams` ([Module 14](../14-routing/)) |
| **Client (UI)** | yours; many distant readers; outlives any one page | **a store** — this module |

Not store state: **form drafts**, **local UI** (`useState`), 60 Hz values (a ref).

So in ShopScope a store holds exactly two things: the **wishlist** and the
**cart**. The Inventory Console (§6) breaks the rule on purpose — server data
in a store — so you feel the cost.

📖 [react.dev — Managing State](https://react.dev/learn/managing-state)

**→ In the demos:** Demo 13 Lab 1 fills this table in for ShopScope, file by file.

---

## 3. What Context cannot do well

Context is a **transport**, not a state manager
([Module 9 §16](../09-reducers-and-context/#16-what-context-is-not-for)).

**1. The granularity is the whole value.** Every consumer re-renders when
`value` changes identity
([§12](../09-reducers-and-context/#12-context-re-render-behaviour)); splitting
contexts ([§13](../09-reducers-and-context/#13-splitting-contexts)) buys two
or three subscriptions, not one per product card.

```text
  One wishlist click:  ids: [7] ──► [7, 42]

  CONTEXT — value is a new object,     STORE — each component hands in a selector
  so EVERY consumer renders:           (s) => s.ids.length        2 ─► 2   quiet
    Header, ProductsPage,              (s) => s.ids.includes(7)   T ─► T   quiet
    Card #7, Card #42, …ten more       (s) => s.ids.includes(42)  F ─► T   RENDER
  15 renders.                          1 render.
```

**2. No selectors.** The header wants a count, a card one boolean; both get
the whole array. **3. No access outside React.** A router action, an
interceptor or a test with no renderer cannot call `useContext`. All three are
what a **subscription** adds — and a subscription is what a store is.

**→ In the demos:** Demo 13 Lab 1 — *Verify* runs the fifteen-versus-one experiment in the Profiler.

---

## 4. What a store is: `useSyncExternalStore`

A store is four things: **state** in a module-level closure, **actions** (the
only way to replace it), **selectors** and **a subscription list**. React
ships the hook that connects one to a component
([Module 12 §14](../12-effects/#14-usesyncexternalstore)):

```ts
import { useSyncExternalStore } from 'react';

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (next: T) => { state = next; listeners.forEach((l) => l()); },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  };
}

const wishlist = createStore<{ ids: number[] }>({ ids: [] });

function useWishlistCount() {
  return useSyncExternalStore(wishlist.subscribe, () => wishlist.getState().ids.length);
}
```

It re-renders when `getSnapshot()` changes by `Object.is`. Two rules every
library here inherits:

- **`getSnapshot` must return a stable value for unchanged state.** Return a
  fresh object each call and React warns *"The result of getSnapshot should
  be cached"* and loops. This is the §8 `useShallow` problem.
- **Store state is not React state.** React does not batch or schedule it,
  and will not warn about mutation. `setState(sameObject)` notifies nobody.

A library sells you the selector comparison, middleware, DevTools and types —
not the mechanism.

📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

---

## 5. The decision

```text
  Server state?        ── yes ──►  a loader or a query cache. Stop.
  URL state?           ── yes ──►  useSearchParams. Stop.
  One screen's?        ── yes ──►  useState / useReducer. Stop.
  Few readers, rarely changes?  ── yes ──►  Context (theme, auth, toasts). Stop.
         │ no
         ▼
  A store.  Zustand by default; Redux Toolkit when §21's conditions hold;
            RxJS epics only for the stream-shaped parts.
```

**Context survives the decision** (theme and toasts stay in Context in every
demo), and **the libraries are not exclusive**: Demo 24b keeps the Zustand
cart beside Redux slices; Demo 24c keeps thunks beside epics.

---

## 6. The shared feature: the Inventory Console

Demos 24a–24c build one admin screen, `/account/inventory`, with **no** route loaders, so the store owns the async:

| | Requirement | Forces |
|---|---|---|
| F1 | load products through the store, with a status machine | async in a store; states that cannot contradict |
| F2 | normalised entities — `ids` + `entities`, never a nested array | why normalisation exists; selector memoisation |
| F3 | debounced filters; a slow stale response must be discarded | races, cancellation, request identity |
| F4 | inline stock edit, instant, rolled back on rejection | optimistic updates; per-row status |
| F5 | bulk restock: limited concurrency, partial failure, undo | snapshots, batching, honest reporting |
| F6 | a persisted "recently inspected" list with a version and migration | persistence; what not to persist |
| F7 | sign-out clears user-scoped state in one call | cross-slice coordination; reset |
| F8 | Redux DevTools time-travel works | the debugging story is a selection criterion |

All three use a `status` union and the normalised `ids` + `entities` of
[Module 8 §8](../08-state-structure/#8-normalising-state).

---

## 7. Zustand: `create`, selectors, actions

A Zustand store is a hook. `create()` takes `(set, get) => state` and returns
`useWishlistStore`; call it with a **selector** and the component subscribes
to exactly that value.

```ts
// src/store/wishlist.ts
import { create } from 'zustand';

interface WishlistState { ids: number[]; toggle: (id: number) => void; clear: () => void }

export const useWishlistStore = create<WishlistState>()((set) => ({
  ids: [],
  toggle: (id) =>
    set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
  clear: () => set({ ids: [] }),
}));

// Selectors: named, reusable, testable without React.
export const selectWishlistCount = (state: WishlistState) => state.ids.length;
export const selectIsSaved = (id: number) => (state: WishlistState) => state.ids.includes(id);
```

```tsx
const count = useWishlistStore(selectWishlistCount);        // header: re-renders only when the count changes
const saved = useWishlistStore(selectIsSaved(product.id));  // card: one boolean, one subscription
const toggle = useWishlistStore((s) => s.toggle);           // a function — stable
```

No provider, no hook that throws, no `useMemo`, no `useCallback`. **`set`
merges** (`set(next, true)` replaces — §11). **Actions live in the store**, so
a rule change touches one file. **`create<State>()(…)`** — the empty call lets
middleware types flow through. Three ways to get it wrong: no selector
(subscribes to everything), `create()` inside a component (a new store every
render), and mutating in `set` (same reference, nobody notified).

📖 [Zustand — `create`](https://zustand.docs.pmnd.rs/apis/create) · [TypeScript guide](https://zustand.docs.pmnd.rs/guides/typescript)

**→ In the demos:** Demo 13 Lab 1 — the wishlist store replaces `WishlistProvider`.

---

## 8. Zustand: `useShallow` and selector discipline

The cart *hosts* the reducer you already wrote:

```ts
export const useCartStore = create<CartState>()((set) => ({
  lines: [],
  isOpen: false,                       // the drawer: cross-cutting UI, so it lives here
  add: (product, qty = 1) =>
    set((state) => ({
      lines: cartLinesReducer(state.lines, { type: 'add', product, qty }),
      isOpen: true,                    // ONE set, one notification
    })),
  remove: (productId) =>
    set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'remove', productId }) })),
  close: () => set({ isOpen: false }),
}));

// Derived values are SELECTORS, not state — Module 8 §9.
export const selectCount = (state: CartState) => lineCount(state.lines);
export const selectSubtotal = (state: CartState) => subtotal(state.lines);
```

Storing `count` too would be two sources of truth
([Module 8 §9](../08-state-structure/#9-derived-state)).

### The object-selector trap

```tsx
// ✗ a NEW object every call → Object.is fails → "getSnapshot should be cached" → render loop
const { setQty, remove } = useCartStore((s) => ({ setQty: s.setQty, remove: s.remove }));

// ✓ compare the object's KEYS instead of its identity — or select each value separately
import { useShallow } from 'zustand/shallow';
const { setQty, remove } = useCartStore(useShallow((s) => ({ setQty: s.setQty, remove: s.remove })));
```

**Selector discipline:** select the smallest thing (`s.entities[id]`, not
`s.entities`); never build a new object or array in a selector unless you
memoise it; and hoist defaults — `s.rows[id] ?? { pending: false }` allocates
every call.

For a derived *list* — the one selector that cannot return an existing
reference — remember the inputs and the answer, and return the same array when
the inputs are identical **by reference**. Demo 24a writes that in eleven
lines as `selectVisibleIds`; it is `reselect` (§15) by hand, and it works only
because immer gives `entities` a new reference exactly when something in it
changed.

📖 [Zustand — `useShallow`](https://zustand.docs.pmnd.rs/hooks/use-shallow) · [Prevent rerenders with `useShallow`](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)

**→ In the demos:** Demo 13 Lab 2 — the cart, the drawer, `useShallow`; Demo 24a Lab 3 — selector discipline and the hand-written memo.

---

## 9. Zustand: slices

The console's thirty keys do not fit one `create()`, and five stores fail
because `setFilter` must trigger `fetchPage` and sign-out must clear
everything atomically. **A slice is a creator with `create()`'s signature that
returns part of the state:**

```ts
import type { StateCreator } from 'zustand';

export type InventoryStore = FiltersSlice & CatalogueSlice & EditSlice & BulkSlice & RecentSlice;
//                          whole store ─┐  mutators above ─┐ ┌─ mutators this creator applies
export type SliceOf<T> = StateCreator<InventoryStore, [], [], T>;   // T: what THIS creator returns

export const createFiltersSlice: SliceOf<FiltersSlice> = (set, get) => ({
  filters: initialFilters,
  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
    void get().fetchPage(0);                     // another slice's action — same `get`
  },
});

export const useInventoryStore = create<InventoryStore>()((...args) => ({
  ...createFiltersSlice(...args),
  ...createCatalogueSlice(...args),
  ...createEditSlice(...args),
  ...createBulkSlice(...args),
  ...createRecentSlice(...args),
}));
```

`(...args)` is the whole trick: every slice receives **the same `set` and
`get`** — one store, one state object, one subscription list.

Several stores are right when nothing must happen atomically across them —
`cart` and `wishlist` stay separate. The cost of slices is a shared namespace.

📖 [Zustand — Slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)

**→ In the demos:** Demo 24a Lab 1 — five typed slices, no middleware yet.

---

## 10. Zustand: `persist`, `devtools`, `immer`

A middleware takes a state creator and returns another; they nest.

### `persist`

```ts
import { persist } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  persist((set) => ({ … }), {
    name: 'shopscope.cart',                            // the localStorage key
    partialize: (state) => ({ lines: state.lines }),   // the DATA, not the drawer
    version: 1,                                        // bump when CartLine changes shape
  }),
);
```

`partialize` decides what is *yours*: not the drawer (UI), not products (a
March price read back in November). The console persists eight **ids** — an id
cannot go stale. `version` + `migrate` handle data already on users' machines:

```ts
version: 2,
migrate: (persisted, version) => {
  if (version >= 2) return persisted as PersistedInventory;
  const old = (persisted ?? {}) as { recentlyViewed?: { id: number; title: string }[] };
  return { recent: { ids: (old.recentlyViewed ?? []).map((e) => e.id).slice(0, 8) } };
},
merge: (persisted, current) =>                // the default merge is SHALLOW, and `recent` is nested
  ({ ...current, recent: { ...current.recent, ...(persisted as Partial<PersistedInventory>).recent } }),
```

Bump and migrate in one commit. `persist` adds `useStore.persist.rehydrate()`
and `.hasHydrated()` — the seam for testing a migration.

### `devtools`

```ts
import { devtools } from 'zustand/middleware';
create<InventoryStore>()(devtools(slices, { name: 'ShopScope · inventory', enabled: env.isDev }));

set((state) => ({ … }), false, 'inventory/setFilter');   // third argument: the name in the timeline
```

The Redux DevTools extension, for a store that is not Redux. Keep it dev-only,
and name every `set` — unnamed ones show as `anonymous`.

### `immer`

```ts
// without immer: { ...s.entities, [id]: { ...s.entities[id], stock } } — two load-bearing spreads
import { immer } from 'zustand/middleware/immer';
patchStock: (id, stock) => set((s) => { const p = s.entities[id]; if (p) p.stock = stock; }),
```

One runtime rule: **mutate the draft or return a new state, never both**
([Module 8 §4](../08-state-structure/#4-immer-and-when-it-earns-its-place)).

### The stack, and the mutator tuple

```ts
create<InventoryStore>()(
  devtools(                      // outermost — sees every next state, including rehydration
    persist(                     // writes the partialized slice after it settles
      immer(                     // turns a draft recipe into a state
        subscribeWithSelector(   // selector-aware subscribe() — §11
          slices)))));

export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/persist', unknown],          // `unknown`: persist ADDS an API to the store
  ['zustand/immer', never],
  ['zustand/subscribeWithSelector', never],
];
export type SliceOf<T> = StateCreator<InventoryStore, InventoryMutators, [], T>;
```

Every slice must declare the middlewares above it — Zustand's best-known
TypeScript pain. `TS2554 … got 3` means `devtools` is missing from the tuple;
`TS2769 … 'void'` means `immer` is. One ordering rule is real: **`devtools`
outermost**, or it never records rehydration.

📖 [Zustand — `persist`](https://zustand.docs.pmnd.rs/middlewares/persist) · [Persisting store data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) · [`devtools`](https://zustand.docs.pmnd.rs/middlewares/devtools) · [`immer`](https://zustand.docs.pmnd.rs/middlewares/immer)

**→ In the demos:** Demo 13 Lab 3 — `persist` with `partialize`; Demo 24a Lab 2 (`devtools`, async, the race), Lab 3 (`immer`), Lab 6 (`version`, `migrate`, `merge`).

---

## 11. Zustand: outside React, and testing

A store is an object first: `getState()`, `setState()`, `subscribe()`.

```ts
// src/routes/account/checkout.ts — a router action with NO component
export async function checkoutAction({ context }: ActionFunctionArgs): Promise<CheckoutResult> {
  const user = context.get(userContext);
  const { lines, clear } = useCartStore.getState();        // no hook, no props
  if (lines.length === 0) return { ok: false, error: 'Your cart is empty.' };
  const cart = await createCart(user.id, lines.map((l) => ({ id: l.productId, quantity: l.qty })));
  clear();                                                 // every subscribed component updates
  return { ok: true, cart };
}
```

Context could not do this. With `subscribeWithSelector`, a **transient
subscription** runs when one slice changes, with no render:

```ts
useInventoryStore.subscribe(
  (state) => state.recent.ids,                                   // what to watch
  (ids) => logger.debug(`recently inspected: ${ids.join(', ')}`), // what to do
);
```

### Reset, and the `replace` trap

```ts
useInventoryStore.setState(initialData, false, 'inventory/reset');   // ✓ merge
useInventoryStore.setState(initialData, true);                       // ✗ REPLACE — deletes the actions too
```

The actions live in the state object; a replace removes `fetchPage` with the
data. For F7 the demo keeps a registry: each user-scoped store registers its
reset at import time and sign-out calls them all. The cart does not register —
a shopper who signs out expects to keep their basket.

### Testing with no React

Drive it through `getState()`; mock only the API module.

```ts
it('DISCARDS a slow earlier response when a newer request has started', async () => {
  mockedList.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);   // two deferreds
  const first = useInventoryStore.getState().fetchPage(0);    // answers LAST
  const second = useInventoryStore.getState().fetchPage(1);   // answers FIRST
  fast.resolve(page([product(9, 1)])); await second;
  slow.resolve(page([product(1, 5)])); await first;
  expect(useInventoryStore.getState().ids).toEqual([9]);     // the stale answer changed nothing
});
```

Abort alone cannot stop a response already queued; a monotonic `requestId`,
re-read from `get()` *after* the `await`, decides. `get()` before an `await`
is a photograph.

📖 [Zustand — `subscribeWithSelector`](https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector) · [How to reset state](https://zustand.docs.pmnd.rs/guides/how-to-reset-state) · [Testing](https://zustand.docs.pmnd.rs/guides/testing)

**→ In the demos:** Demo 13 Lab 4 — checkout from a router action; Demo 24a Lab 2 (the race) and Lab 6 (transient subscription, reset registry, tests).

---

## 12. Redux Toolkit: `configureStore`, `createSlice`, Immer

Redux adds one thing to §4: actions travel through a **middleware chain**,
and every change is a recorded, replayable entry.

```ts
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: { filters: filtersReducer, inventory: inventoryReducer, recent: recentReducer },
  preloadedState: { recent: loadRecent() },           // hydrate ONCE, before the first render
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: { extraArgument: extra } })
      .prepend(listenerMiddleware.middleware),         // a typed tuple — never build the array by hand
  devTools: env.isDev && { name: `ShopScope · ${env.mode}`, trace: true },
});

export type RootState = ReturnType<typeof store.getState>;   // DERIVED, never declared
export type AppDispatch = typeof store.dispatch;
```

`configureStore` replaces the deprecated `createStore` and adds the slice map,
thunks, the dev-only checks and DevTools.

```ts
// src/store/filters.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    searchChanged(state, action: PayloadAction<string>) {
      state.q = action.payload;          // looks like mutation; it is an Immer draft
      state.page = 0;                    // "any filter change resets the page" — once
    },
    filtersCleared() { return initialState; },   // return a value OR edit the draft — never both
  },
  extraReducers: (builder) => {
    builder.addCase(signedOut, () => initialState);   // F7: an action this slice does not own
  },
  selectors: { selectFilters: (state) => state },     // written against the SLICE, exposed against RootState
});

export const { searchChanged, filtersCleared } = filtersSlice.actions;
export default filtersSlice.reducer;
```

Each case's name becomes an action type — `searchChanged('lip')` is
`{ type: 'filters/searchChanged', payload: 'lip' }` — named in DevTools for
free. **The Immer illusion:** `state.q = 'lip'` writes to a draft, so the
reducer stays pure ([Module 9 §4](../09-reducers-and-context/#4-reducers-must-be-pure)).
**One action, several slices:** each slice answers `signedOut` in
`extraReducers` — F7 without a `resetEverything()`.

📖 [Redux Toolkit — `configureStore`](https://redux-toolkit.js.org/api/configureStore) · [`createSlice`](https://redux-toolkit.js.org/api/createSlice) · [Writing Reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers)

**→ In the demos:** Demo 24b Lab 1 — the store, typed, and the filters slice.

---

## 13. Redux Toolkit: typed hooks

React Redux connects the store through `<Provider>` and two hooks. Write the
typed versions **once** and import those everywhere:

```tsx
// main.tsx
<Provider store={store}><App /></Provider>

// src/store/hooks.ts — react-redux 9 form
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

Plain `useSelector` types state as `unknown`; plain `useDispatch` rejects
thunks.

`useSelector` compares by reference — §4's contract, so §8's discipline
applies unchanged. And `<Provider>` puts the store on every page's critical
path, where a Zustand store is imported only by the code that uses it.

📖 [React Redux — Hooks](https://react-redux.js.org/api/hooks) · [TypeScript Quick Start](https://react-redux.js.org/tutorials/typescript-quick-start)

**→ In the demos:** Demo 24b Lab 1 — `hooks.ts`.

---

## 14. Redux Toolkit: `createAsyncThunk` (and RTK Query, briefly)

A reducer cannot fetch. A **thunk** is a function you dispatch;
`createAsyncThunk` dispatches `pending`/`fulfilled`/`rejected` — the status
machine of [Module 9 §8](../09-reducers-and-context/#8-reducers-as-state-machines).

```ts
export const createAppAsyncThunk = createAsyncThunk.withTypes<{      // typed ONCE for the app
  state: RootState; dispatch: AppDispatch; extra: ThunkExtra; rejectValue: ApiErrorInfo;
}>();

export const loadInventory = createAppAsyncThunk<LoadResult, FiltersState>(
  'inventory/load',
  async (filters, { extra, signal, rejectWithValue }) => {
    try {
      const res = await extra.listProducts({ ...filters, limit: PAGE_SIZE, signal });
      return { products: res.products, total: res.total };
    } catch (error) {
      return rejectWithValue(toErrorInfo(error));     // serialisable DATA, not the ApiError instance
    }
  },
  { condition: (filters, { getState }) =>             // runs BEFORE pending; false = dispatch nothing
      getState().inventory.pendingKey !== filtersKey(filters) },
);
```

```ts
extraReducers: (builder) => {
  builder
    .addCase(loadInventory.pending, (state, action) => {
      state.status = 'loading';
      state.currentRequestId = action.meta.requestId;          // F3: the only answer we will accept
    })
    .addCase(loadInventory.fulfilled, (state, action) => {
      if (state.currentRequestId !== action.meta.requestId) return;   // LATEST WINS
      productsAdapter.setAll(state, action.payload.products);
      state.status = 'ready';
    })
    .addCase(loadInventory.rejected, (state, action) => { /* same id check; ignore meta.aborted */ });
}

// the component aborts on change
useEffect(() => { const p = dispatch(loadInventory(filters)); return () => p.abort(); }, [dispatch, filters]);
```

- **`rejectWithValue` vs `throw`:** throwing leaves a stringified
  `action.error`; `rejectWithValue(x)` puts `x` on `action.payload`, intact.
- **Store data, not instances:** an `ApiError` in state trips the
  serializability check. Fix it with a plain `ApiErrorInfo`, not `ignoredPaths`.
- **`extra` is dependency injection** — a test hands in a fake API. And
  `condition` is dedupe, not a cache.

### RTK Query, in one paragraph

All of that is 108 lines, and the console still has no cache. **RTK Query**
is a cache with a code generator: endpoints declared in `createApi` produce a
hook each, a cache keyed by argument, dedupe, abort and tag invalidation, over
a custom `baseQuery` wrapping the existing axios client. It is server state —
[Module 24](../24-server-state-tanstack-query-and-realtime/) — and it is both the strongest reason to pick
RTK and most of its bundle weight.

📖 [Redux Toolkit — `createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) · [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview)

**→ In the demos:** Demo 24b Lab 2 — `createAsyncThunk` with `condition`, `signal`, `rejectWithValue` and the race; Lab 6 — the same fetching in RTK Query.

---

## 15. Redux Toolkit: `createEntityAdapter` and `createSelector`

F2 — `ids` + `entities` — is a pattern you can hand-roll (§8) or take
pre-written:

```ts
const productsAdapter = createEntityAdapter<Product, number>({
  selectId: (product) => product.id,
  // NO sortComparer: the SERVER owns the order. Add one only when the client does.
});

const initialState = productsAdapter.getInitialState<InventoryExtraState>({ status: 'idle', /* … */ });

// inside reducers — each keeps `ids` and `entities` in step
productsAdapter.setAll(state, action.payload.products);
productsAdapter.updateOne(state, { id, changes: { stock } });

// selectors, bound to where the slice is mounted
const adapterSelectors = productsAdapter.getSelectors((state: RootState) => state.inventory);
export const selectProductById = adapterSelectors.selectById;
```

After an edit only `entities[7]` is new, so only row 7 re-renders.

### `createSelector`

A selector that calls `.filter()` returns a new array every dispatch.
`createSelector` (reselect, bundled) memoises on its inputs:

```ts
export const selectVisibleIds = createSelector(
  [adapterSelectors.selectAll, selectLowStockOnly],
  (products, lowStockOnly) =>
    (lowStockOnly ? products.filter((p) => p.stock < LOW_STOCK) : products).map((p) => p.id),
);

// a FACTORY for per-row state — one instance per row, created in useMemo
export const makeSelectRowState = () =>
  createSelector(
    [(state: RootState) => state.inventory.rows, (_: RootState, id: number) => id],
    (rows, id) => rows[id],
  );
```

**Return ids, not objects**: each row selects its own entity, so one edit
re-renders one row. Reselect 5 (RTK 2) defaults to `weakMapMemoize`, so a
shared selector would work for a numeric id; know the factory anyway.

📖 [Redux Toolkit — `createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) · [`createSelector`](https://redux-toolkit.js.org/api/createSelector) · [Redux — Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors)

**→ In the demos:** Demo 24b Lab 3 — the adapter and memoised selectors; Lab 4 — optimistic edit with `updateOne` and rollback.

---

## 16. Redux Toolkit: listener middleware, DevTools, checks

Bulk restock is twelve requests that must survive navigation — a
**listener**: a predicate plus an async effect, run *after* the reducers.

```ts
import { createListenerMiddleware, isAnyOf, type TypedStartListening } from '@reduxjs/toolkit';

export const listenerMiddleware = createListenerMiddleware();
const startAppListening = listenerMiddleware.startListening as TypedStartListening<RootState, AppDispatch>;

startAppListening({
  actionCreator: bulkRestockRequested,
  effect: async (action, listenerApi) => {
    listenerApi.cancelActiveListeners();                 // `takeLatest` in one line
    const entities = listenerApi.getState().inventory.entities;
    const task = listenerApi.fork(async () =>            // a child task; cancelling the listener cancels it
      mapWithConcurrency(action.payload.ids, 4, async (id) => {
        await listenerApi.dispatch(saveStock({ id, stock: entities[id].stock + action.payload.amount })).unwrap();
      }),
    );
    const outcome = await task.result;                   // { status: 'ok' | 'cancelled' | 'rejected' }
    if (outcome.status !== 'ok') return;                 // a cancelled run must not report
    listenerApi.dispatch(bulkRestockFinished({ failed: outcome.value }));
  },
});

startAppListening({
  matcher: isAnyOf(inspected, recentCleared, signedOut),              // three actions, one effect
  effect: (_action, listenerApi) => saveRecent(listenerApi.getState().recent),   // persistence IS a side effect
});
```

Each item reuses `saveStock`, so bulk inherits the optimistic write and rollback.

| | Reads | Use for |
|---|---|---|
| `listenerApi.getState()` | state **after** the reducers ran | "what is true now" — persistence |
| `listenerApi.getOriginalState()` | state **before** | "what was true when this arrived" — undo |

Swapping those two is the most common listener bug, and it is silent.

Thunks for "do this now", listeners for "when X, do Y" — the modern
replacement for sagas. Epics are §18.

### DevTools and the two checks

Every action named, a diff per action, a Trace tab showing who dispatched it,
and time-travel that always works — dispatching is the only way in, so nothing
escapes the log. Keep `devTools` off in production: the extension hook lets
any script on the page read and write the store.

Two dev-only checks: **serializability** (class instances, promises in state)
and **immutability** (a component `.sort()`-ing a store-owned array).

**Testing:** a reducer is a function — call it. A thunk is tested against a
**real store with a fake `extraArgument`**: no React, no `vi.mock`.

📖 [Redux Toolkit — `createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware) · [Serializability middleware](https://redux-toolkit.js.org/api/serializabilityMiddleware) · [Redux — Writing Tests](https://redux.js.org/usage/writing-tests)

**→ In the demos:** Demo 24b Lab 5 — bulk, undo and persistence as listeners; Lab 7 — DevTools, the checks, a real store with a fake `extra`.

---

## 17. RxJS: streams and operators

A socket, keystrokes, a gesture are not requests — values keep arriving.
RxJS models them as **Observables**: `next`, `error`, `complete`, and a
**teardown** on unsubscribe.

```ts
// a promise, made cancellable — `from(promise)` compiles, passes every test, and cancels NOTHING
export function fromAbortable<T>(run: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const controller = new AbortController();
    run(controller.signal).then(
      (value) => { subscriber.next(value); subscriber.complete(); },
      (error) => { if (!controller.signal.aborted) subscriber.error(error); },
    );
    return () => controller.abort();          // runs on unsubscribe
  });
}
```

**Operators** are functions on streams, composed with `.pipe()`. Three carry
this module: `debounceTime(400)` emits only after a quiet period; `switchMap`
keeps the latest inner stream and **unsubscribes** the loser, so its teardown
runs; `takeUntil(close$)` completes when `close$` emits — the cleanup *is* the
stream ending.

```text
  keystrokes   -l-i-p---s-----------      debounceTime(400)
  out          -----------------X---      one request for four keystrokes
```

### The four flattening operators

One identical input, four behaviours. Choose by answering: *if a second one
starts while the first is running, what should happen to the first?*

| If a new one starts while the old is running… | Operator | Use |
|---|---|---|
| cancel the old one — it is obsolete | `switchMap` | search, filters, navigation |
| let both run — they are independent | `mergeMap` | per-row writes, fan-out |
| queue it behind the old one | `concatMap` | ordered writes, a log |
| ignore the new one until the old finishes | `exhaustMap` | a submit button, login |

Wrong choices are silent: a race, or a row stuck on "saving". `mergeMap(fn, 4)`
is bounded concurrency — all of §16's helper in one argument.

📖 [RxJS — Observable](https://rxjs.dev/guide/observable) · [Operators](https://rxjs.dev/guide/operators) · [`switchMap`](https://rxjs.dev/api/index/function/switchMap) · [`debounceTime`](https://rxjs.dev/api/index/function/debounceTime) · [`takeUntil`](https://rxjs.dev/api/index/function/takeUntil)

---

## 18. redux-observable: epics

**An epic is a function from a stream of actions to a stream of actions.**

```ts
type Epic = (action$, state$, dependencies) => Observable<Action>;
```

Every action is pushed into `action$` after the reducers; everything an epic
emits is dispatched. So an epic must **never emit the action it listened
for**, and **an escaped error ends it for ever** — it looks like a hang.

```ts
export type AppEpic = Epic<UnknownAction, UnknownAction, RootState, EpicDeps>;
export const rootEpic = combineEpics<UnknownAction, UnknownAction, RootState, EpicDeps>(loadEpic, saveStockEpic, feedEpic);
const resilientRootEpic: AppEpic = (action$, state$, deps) =>
  rootEpic(action$, state$, deps).pipe(catchError((error, source) => { logger.error(error); return source; }));  // the net
export const epicMiddleware = createEpicMiddleware({ dependencies: epicDeps });   // `extraArgument`, renamed

export const store = configureStore({
  reducer: rootReducer,                // combineReducers in its own file, so RootState does not depend on the store
  middleware: (getDefault) => getDefault().concat(epicMiddleware),   // CONCAT: epics see actions, not thunk functions
});
epicMiddleware.run(resilientRootEpic);   // AFTER the store — before it, every epic is silently inert
```

`ofType('x')` narrows `UnknownAction` to `never`; use `filter(creator.match)`.

### The load, as a stream

```ts
export const loadEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(consoleOpened.match),
    switchMap(() =>                                     // one session per visit — see the takeUntil note
      merge(
        action$.pipe(filter(searchChanged.match), debounceTime(400)),               // typing: wait
        action$.pipe(filter(isAnyOf(categoryChanged, sortChanged, pageChanged))),   // dropdowns: now
      ).pipe(
        startWith(null),                                // the first load
        map(() => selectFilters(state$.value)),         // state AFTER the reducers ran
        switchMap((filters) =>                          // F3: latest wins; the loser's teardown aborts axios
          deps.listProducts({ ...filters, limit: PAGE_SIZE }).pipe(
            map((res) => inventoryLoaded({ products: res.products, total: res.total, page: filters.page })),
            retry({ count: 2, delay: (error, attempt) => {
              if (!toErrorInfo(error).isRetryable) throw error;
              return timer(400 * 2 ** (attempt - 1));   // the delay is an OBSERVABLE
            } }),
            catchError((error) => of(inventoryFailed(toErrorInfo(error)))),   // must RETURN, never rethrow
            startWith(inventoryLoading()),              // after retry: one spinner per user action
          ),
        ),
        takeUntil(action$.pipe(filter(consoleClosed.match))),   // unmount: abort, drop the timer
      ),
    ),
  );
```

This replaces the thunk, `condition`, `currentRequestId`, the abort
`useEffect` and a debounce hook: a stale response is never *delivered*.
Two silent bugs: **`takeUntil` at the epic's top level** kills it on the first
unmount (the outer `switchMap` prevents that), and **a missing inner
`catchError`** lets one 404 end every effect. Per-row writes use `mergeMap`.

📖 [redux-observable — Epics](https://redux-observable.js.org/docs/basics/Epics.html) · [Setting up the middleware](https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware.html) · [Error handling](https://redux-observable.js.org/docs/recipes/ErrorHandling.html) · [Cancellation](https://redux-observable.js.org/docs/recipes/Cancellation.html)

**→ In the demos:** Demo 24c Lab 1 — the middleware beside the thunks; Lab 2 — the load as a stream; Lab 3 — the flattening operator for the per-row write.

---

## 19. A WebSocket as a stream

The feature thunks could not write: a WebSocket streaming stock changes.
`webSocket()` from `rxjs/webSocket` is a `Subject` that is a connection:

| You do | It does |
|---|---|
| `socket$.subscribe(…)` | opens the connection |
| `socket$.next(msg)` | sends a frame (queued until open) |
| unsubscribe | **closes** the connection |
| the server drops you | the Observable **errors** |
| a clean close (1000) | the Observable **completes** |

```ts
export const feedEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(consoleOpened.match),
    switchMap(() => {
      const socket$ = deps.openFeed();                 // INSIDE the switchMap: one socket per visit
      const status$ = new Subject<FeedStatus>();       // an operator callback cannot emit; a local Subject can

      const inbound$ = socket$.pipe(
        tap(() => status$.next('live')),
        retry({                                        // reconnection: error → resubscribe → new socket
          delay: (_error, attempt) => {
            status$.next('reconnecting');
            return timer(Math.min(30_000, 500 * 2 ** (attempt - 1)));   // backoff, with a ceiling
          },
          resetOnSuccess: true,
        }),
        filter(isFeedServerMessage),                   // the socket hands you `unknown`; validate at the boundary
        filter(() => !selectFeedPaused(state$.value)), // pause: one operator, drops while paused
        bufferTime(250),                               // back-pressure: at most four actions a second
        filter((messages) => messages.length > 0),
        map((messages) => feedTicked(coalesce(messages))),   // last write wins per id, inside the window
      );

      const outbound$ = state$.pipe(map(selectVisibleIds), distinctUntilChanged(sameIds),   // state$ is a stream too
        tap((ids) => socket$.next({ type: 'subscribe', ids })), map(feedSubscriptionChanged));

      return merge(inbound$, outbound$, status$.pipe(distinctUntilChanged(), map(feedStatusChanged))).pipe(
        catchError(() => of(feedStatusChanged('offline'))),   // no server at all (a production build)
        takeUntil(action$.pipe(filter(consoleClosed.match))), // the CLOSE — no ws.close() anywhere
      );
    }),
  );
```

Each operator — `retry`, `bufferTime`, `distinctUntilChanged`, `filter` —
replaces a hand-rolled timer, array and cleanup. **The gap question:** a feed
sends deltas, so after a reconnect refetch (or ask for everything since a
sequence number); doing nothing is the bug that ships.

📖 [RxJS — `webSocket`](https://rxjs.dev/api/webSocket/webSocket) · [`retry`](https://rxjs.dev/api/index/function/retry) · [`bufferTime`](https://rxjs.dev/api/index/function/bufferTime)

**→ In the demos:** Demo 24c Lab 5 — the socket as an Observable; Lab 6 — reconnection, back-pressure, multiplexing and pause.

---

## 20. When a stream model pays off

`TestScheduler` replaces the clock, so timing claims become assertions:

```ts
import { TestScheduler } from 'rxjs/testing';

it('cancels the first request when the filters change', () => {
  scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
    const action$ = hot<UnknownAction>('a 49ms b', { a: consoleOpened(), b: categoryChanged('beauty') });
    const response$ = cold('100ms r|', { r: PAGE });
    const out$ = loadEpic(action$, stateOf(stateWith()), noDeps({ listProducts: () => response$ }));

    expectObservable(out$).toBe('l 49ms l 100ms d', { l: inventoryLoading(), d: inventoryLoaded(…) });
    expectSubscriptions(response$.subscriptions).toBe(['^ 49ms !', '50ms ^ 100ms !']);
    //                                                   ^^^^^^^^^ unsubscribed before it ever emitted
  });
});
```

Only `expectSubscriptions` proves a cancellation. Each marble character is one
frame, and a value consumes its frame.

### The honest verdict

**RTK Query wins ordinary data loading** — Demo 24c's epic version of F1–F5
is sixty-eight lines *longer* than the thunks, with no cache. **Epics win
streams** — sockets, `EventSource`, gestures — and multi-step orchestration
("the next X, within five seconds, unless Y"). **Adopt it with the whole
team**: one RxJS expert writes code nobody else can review, and one unhandled
error ends every effect.

**The elephant.** redux-observable's only Redux 5–compatible release (RTK 2
ships Redux 5) is `3.0.0-rc.3`, a release candidate. It works, but some
dependency policies forbid pre-releases; say so in the ADR.

📖 [RxJS — Marble testing](https://rxjs.dev/guide/testing/marble-testing) · [redux-observable — Writing tests](https://redux-observable.js.org/docs/recipes/WritingTests.html)

**→ In the demos:** Demo 24c Lab 7 — marble tests; the closing *Thunks, listeners, epics or RTK Query?* section.

---

## 21. The comparison

The same eight requirements, solved by code you write (Zustand), by
configuration you supply (Redux Toolkit), or by operators (RxJS).

Bundle sizes are the demos' measurements (gzip). Most of RTK's 26.5 kB is
RTK Query — a cache Zustand lacks; add TanStack Query to the Zustand column
and the gap closes.

| | Zustand | Redux Toolkit | RTK + redux-observable |
|---|---|---|---|
| **Boilerplate** | ~10 lines for a first store | ~30 across three files; `<Provider>` required | + typed `Epic`, root epic, `run()` |
| **Learning curve** | an hour to productive, a day to the middleware stack | a day to productive, a week to RTK Query | large; operators are a second mental model |
| **TypeScript** | painful in one place (the mutator tuple) | three exported types once, then invisible | `UnknownAction` makes `ofType` useless; use `.match` |
| **DevTools** | same extension; naming per `set`, opt-in | automatic, complete, trace, time-travel | same as RTK |
| **Async model** | you write it: abort + request id + status machine | thunks + listeners | streams: cancellation, retry, debounce as operators |
| **Streams / sockets** | `subscribe` plus a hand-rolled lifecycle | a `while` loop in a listener | native |
| **Normalisation, memoised selectors** | by hand | `createEntityAdapter`, `createSelector` | same as RTK |
| **Guardrails** | none | serializability and immutability checks | same; plus one escaped error ends every epic |
| **Testing** | a plain object; no React | a real store, a fake `extra` | marble tests prove timing and cancellation |
| **Bundle (gzip)** | 6.4 kB | 13.2 kB / 26.5 kB with RTK Query | + 10 kB |
| **Team fit** | 1–5; conventions in code review | large or high-turnover; the style guide is the convention | a team that knows RxJS, or will learn it together |

### The recommendation

**Default to Zustand plus a query cache** — the combination ShopScope would
ship. **Choose Redux Toolkit when at least two are true:** the action log is a
requirement (audit, replay); the team is large or high-turnover (more than
about eight engineers); there is much normalised client state edited from many
screens; you need cancellable, sequenced side effects; or Redux is already
there and you want RTK Query. **Add RxJS epics only for streams** — Demo 24c
runs RTK Query, epics, thunks and slices together and they do not fight.


---

## 22. Migration paths

### Context → Zustand

A one-file change if you kept to Module 9's custom-hook API. **Move the
reducer, do not rewrite it** — the store hosts `cartLinesReducer` (§8). Turn
each `dispatch({ type: 'item_added', product })` into an action, `add(product)`.
Replace whole-value reads with the smallest selector. Delete the provider and
the hook that threw. Keep Context where it still fits — theme, toasts, auth.

```tsx
// before — Module 9 §14
const { items } = useCart();
const count = items.reduce((n, i) => n + i.qty, 0);
// after
const count = useCartStore(selectCount);
```

### Zustand → Redux Toolkit

Do it **one feature at a time**. Demo 24b keeps `cart.ts` and `wishlist.ts` in
Zustand while the console runs on RTK, in the same app, on purpose.

| Zustand | Redux Toolkit |
|---|---|
| a slice creator `(set, get) => ({ … })` | `createSlice({ name, initialState, reducers })` |
| an action calling `set` | a case reducer; the action creator is generated |
| `set((s) => { s.x = 1 })` under `immer` | the same line; Immer is built in |
| an async action, `get()` after `await` | `createAsyncThunk` + `extraReducers`, or RTK Query |
| `selectVisibleIds` memo by hand | `createSelector` |
| `ids` + `entities` by hand | `createEntityAdapter` |
| `subscribe(selector, listener)` | a listener with `matcher` |
| `registerReset()` + `setState(…, false)` | one `createAction`, handled in each slice |
| `persist` middleware | `preloadedState` + a persistence listener |
| `useStore(selector)` | `useAppSelector(selector)` + `useAppDispatch()` |
| no provider | `<Provider store>` above everything |

What genuinely changes: **errors become data**, and **side effects leave the
state object** for thunks or listeners.

### Redux Toolkit → epics

Two lines of `configureStore` in Demo 24c; nothing else changed. Thunks stay on.

---

## 23. Staying out of server-state territory

All three libraries hold **client** state. The console keeps server data in a
store on purpose, so you could feel the five things a store does not do:

```text
  What the store has                    What a CACHE would add
  entities{} that accumulate       →   EVICTION — 194 products stay in memory for ever
  fetchPage(), called by you       →   DEDUPE — two callers in one tick are two requests
  data written once                →   STALENESS — nothing records WHEN it was fetched
  a PATCH that updates one entity  →   INVALIDATION — /products and the cart still show the old figure
  a refetch when YOU ask           →   BACKGROUND REFETCH — on focus, on reconnect, on an interval
```

That is the boundary
[Module 13 §7](../13-data-fetching-and-custom-hooks/#7-server-state-is-not-client-state)
drew: server state is a copy of somebody else's, and it needs a cache, not a
store.

| Reach for a store with async in it when… | Reach for a query cache when… |
|---|---|
| one screen owns the data and nobody else reads it | several screens read the same data |
| the state is mostly *yours* with a request attached (a wizard, a draft) | the state is mostly *theirs* |
| the interaction is the interesting part — selection, undo, optimistic batches | the fetching is the interesting part |
| you need one atomic snapshot across several concerns | you need freshness, dedupe and invalidation |

A real ShopScope uses **both**: a cache for the products, a store for the
selection, undo snapshot and recent list. [Module 24](../24-server-state-tanstack-query-and-realtime/)
builds that cache.

---

## 24. Self-check

1. Name the three limits of Context that a store removes, and say which one
   Demo 13's checkout action depends on.
2. What must `getSnapshot` guarantee for `useSyncExternalStore`, and what
   happens when it does not?
3. Classify: the cart, `?page=2`, the sign-up draft, the product list, the
   grid density, the drawer's open state. Which belong in a store?
4. `useCartStore((s) => ({ setQty: s.setQty, remove: s.remove }))` — what
   happens, why, and what are the two fixes?
5. When are slices right and when are two stores right? What lets a filters
   slice call `fetchPage` in another slice?
6. What does `partialize` decide? Why does the console persist ids, never
   products?
7. You bump `version` without writing `migrate`. What happens to users with
   last month's JSON?
8. Why must `devtools` be outermost? What does `['zustand/persist', unknown]`
    mean?
9. "`get()` before an `await` is a photograph" — explain, and say why
    `AbortController` alone does not prevent a stale write.
10. Why is `state.q = value` inside `createSlice` not a mutation? Name the one
    rule that keeps the illusion safe.
11. What does the serializability check catch, and why is `ignoredPaths` the
    wrong fix?
12. Why does `useSelector((s) => s.inventory.ids.filter(…))` re-render for
    ever? Give both fixes.
13. State the one question that picks between `switchMap`, `mergeMap`,
    `concatMap` and `exhaustMap`, and the symptom of `switchMap` on per-row
    saves.
14. Why does `from(promise)` not cancel? Where must `takeUntil` go in an epic?
15. What ends every epic in the application at once? Name the two mitigations.
16. Give the conditions for choosing Redux Toolkit over Zustand, and the one
    requirement that justifies RxJS.
17. Name the five things a query cache does that none of the three stores do.

### Practical

1. Write the store from [§4](#4-what-a-store-is-usesyncexternalstore) and
   connect it with `useSyncExternalStore`. Make `getSnapshot` return a fresh
   object and watch the warning appear.
2. Convert the Module 9 §14 cart provider to Zustand following
   [§22](#22-migration-paths). Confirm in the Profiler that adding an item
   re-renders the badge and the drawer, not the product cards.
3. Add `persist` with `partialize` and `version: 1`. Change `CartLine`'s shape,
   bump to `version: 2`, write `migrate`, and test it through
   `useCartStore.persist.rehydrate()` with a hand-written v1 payload.
4. Reproduce F3's race in a test: two overlapping `fetchPage` calls where the
   first answers last. Remove the `requestId` check and watch it fail.
5. Write a marble test proving `loadEpic` unsubscribes the first request when
   a filter changes. Change `switchMap` to `mergeMap` and watch
   `expectSubscriptions` fail.

---

## 25. References

Official documentation only — react.dev where React is the subject; the
libraries' own docs otherwise.

**React**
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context) — the pattern this module starts from
- [Managing State](https://react.dev/learn/managing-state) · [Choosing the State Structure — avoid redundant state](https://react.dev/learn/choosing-the-state-structure#avoid-redundant-state)
- [`useContext` — optimizing re-renders](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

**Zustand 5**
- [`create`](https://zustand.docs.pmnd.rs/apis/create) · [`createStore`](https://zustand.docs.pmnd.rs/apis/create-store) · [`useStore`](https://zustand.docs.pmnd.rs/hooks/use-store) · [`useShallow`](https://zustand.docs.pmnd.rs/hooks/use-shallow)
- [TypeScript guide](https://zustand.docs.pmnd.rs/guides/typescript) · [Slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern) · [Prevent rerenders with `useShallow`](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
- [`persist`](https://zustand.docs.pmnd.rs/middlewares/persist) · [Persisting store data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) · [`devtools`](https://zustand.docs.pmnd.rs/middlewares/devtools) · [`immer`](https://zustand.docs.pmnd.rs/middlewares/immer) · [`subscribeWithSelector`](https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector)
- [How to reset state](https://zustand.docs.pmnd.rs/guides/how-to-reset-state) · [Testing](https://zustand.docs.pmnd.rs/guides/testing) · [Source on GitHub](https://github.com/pmndrs/zustand)

**Redux Toolkit 2 and React Redux 9**
- [`configureStore`](https://redux-toolkit.js.org/api/configureStore) · [`createSlice`](https://redux-toolkit.js.org/api/createSlice) · [`createAction`](https://redux-toolkit.js.org/api/createAction) · [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk)
- [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter) · [`createSelector`](https://redux-toolkit.js.org/api/createSelector) · [`createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware)
- [Serializability middleware](https://redux-toolkit.js.org/api/serializabilityMiddleware) · [Immutability middleware](https://redux-toolkit.js.org/api/immutabilityMiddleware)
- [Writing Reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) · [Usage with TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript)
- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview) · [Customizing queries (`baseQuery`)](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries)
- [Redux — Style Guide](https://redux.js.org/style-guide/) · [Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors) · [Writing Tests](https://redux.js.org/usage/writing-tests)
- [React Redux — Hooks](https://react-redux.js.org/api/hooks) · [TypeScript Quick Start](https://react-redux.js.org/tutorials/typescript-quick-start)

**RxJS 7 and redux-observable 3**
- [Observable](https://rxjs.dev/guide/observable) · [Operators](https://rxjs.dev/guide/operators) · [Subject](https://rxjs.dev/guide/subject)
- [`switchMap`](https://rxjs.dev/api/index/function/switchMap) · [`mergeMap`](https://rxjs.dev/api/index/function/mergeMap) · [`concatMap`](https://rxjs.dev/api/index/function/concatMap) · [`exhaustMap`](https://rxjs.dev/api/index/function/exhaustMap)
- [`debounceTime`](https://rxjs.dev/api/index/function/debounceTime) · [`takeUntil`](https://rxjs.dev/api/index/function/takeUntil) · [`retry`](https://rxjs.dev/api/index/function/retry) · [`bufferTime`](https://rxjs.dev/api/index/function/bufferTime) · [`catchError`](https://rxjs.dev/api/index/function/catchError)
- [`webSocket`](https://rxjs.dev/api/webSocket/webSocket) · [Marble testing](https://rxjs.dev/guide/testing/marble-testing)
- [redux-observable — Epics](https://redux-observable.js.org/docs/basics/Epics.html) · [Setting up the middleware](https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware.html) · [Error handling](https://redux-observable.js.org/docs/recipes/ErrorHandling.html) · [Cancellation](https://redux-observable.js.org/docs/recipes/Cancellation.html) · [Writing tests](https://redux-observable.js.org/docs/recipes/WritingTests.html)
- [redux-observable on GitHub](https://github.com/redux-observable/redux-observable)

---

**Previous:** [Module 9 — Reducers & Context](../09-reducers-and-context/) — the module this one continues
**Next:** [Module 24 — Server State](../24-server-state-tanstack-query-and-realtime/)
