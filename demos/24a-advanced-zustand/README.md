# Demo 24a — Advanced Zustand

**Demo guide** · ~150 minutes · a 64-line store has no answer for the eight things this screen needs

> Not doing the labs? [**WALKTHROUGH.md**](./WALKTHROUGH.md) is the short
> companion: it tours the finished `solution/` file by file and tells you what
> to click to watch each concept actually happen.

---

## Where you are starting from

The starter is **Demo 14, finished** — the shipped ShopScope: React Router 8 in
data mode, an axios layer with one `ApiError`, an auth interceptor with a
refresh queue, validated env, protected routes and roles, optimistic delete
through a fetcher, retries where they are safe, lazy routes, and two Zustand
stores you wrote in Demo 13: `src/store/cart.ts` and `src/store/wishlist.ts`.

Those two stores are good, and they are small. Between them they are 103 lines,
they hold four pieces of state and eight actions, and **not one line of either
of them is asynchronous**. Everything that talks to the network in this app is
somewhere else: a loader, an action, a service, an interceptor.

Today you find out what happens when it isn't.

This guide does **not** re-teach the landscape. Demo 13's *Groundwork* and *The
landscape* sections already cover what application state is, the six kinds of
it, unidirectional flow, store versus Context, and how the client-state and
server-cache libraries divide the work. Everything below assumes you have read
them, and the comparison at the end of this guide is narrowed to exactly one
question: **Zustand or Redux Toolkit, for a screen like this one?**

New in the starter, so you only write the interesting part: the
`/account/inventory` route is already wired behind `requireRole('admin')` in
`src/router.tsx`, the **Inventory** link is in the account sidebar,
`InventoryFilters.tsx` and `RecentlyInspected.tsx` are finished, and
`listProducts()` has grown two options — `sortBy: 'title' | 'stock'` and a
dev-only `delayMs` that appends DummyJSON's `?delay=`, which is how you will
make a race reproducible on a fast machine.

New dependency: **`immer@11.1.18`**, one package, for the Zustand immer
middleware. Nothing else.

## What you ship today

The **Inventory Console** — one admin screen, and deliberately the only screen
in ShopScope whose data is owned by a store instead of a loader. That choice is
the experiment: by the end of the day you will have felt exactly what it costs
and exactly what it buys.

**A store built out of slices.** Five typed slices — filters, catalogue, edit,
bulk, recent — combined into one `create<InventoryStore>()`. It starts with **no
middleware at all**, and ends as
`devtools(persist(immer(subscribeWithSelector(…))))` — but you add those four
one at a time, each in the lab where something you are trying to do stops being
possible without it, and each with one more entry in the mutator tuple that
keeps `set` typed. Four small doses instead of one cliff.

**Async inside the store.** A four-state machine that cannot contradict itself,
an `AbortController` that cancels the request nobody wants any more, and a
monotonic request id that throws away the answer that arrives too late. You will
make a slow page-one response land after a fast page-two response, on purpose,
and watch the store refuse it.

**A normalised catalogue** — `ids: number[]` plus `entities: Record<number,
Product>` — written through immer drafts, read through atomic selectors, with a
derived list memoised in eleven lines so React 19 stops telling you that the
result of `getSnapshot` should be cached.

**Optimistic editing with real rollback.** Type a new stock figure, see it
instantly, watch the server reject it, and watch the old number come back with
the reason attached to that row and no other.

**Bulk restock with undo.** Select rows, add ten to each, four requests at a
time, and a report that says "9 of 10 updated · 1 rolled back" instead of
"Something went wrong" — plus an Undo built on one snapshot taken before
anything was sent.

**Persistence with a migration.** Eight recently inspected ids, and only those:
`partialize`, `version`, `migrate` from a shape an earlier release wrote,
a `merge` that is not shallow, and `onRehydrateStorage`.

**A reset registry**, so signing out clears the previous admin's screen with one
call — and leaves the shopper's cart exactly where it was.

**Tests with no React in them at all**, because a Zustand store is a plain
object and the React binding is optional.

By the end you will be able to answer, without hesitating:

- When a slice is better than a second store, and when it is not
- What each of the four middlewares does, which problem buys it its place, and exactly which compiler error you get when the mutator tuple and the stack disagree
- Why `get()` before an `await` is a photograph, and what to do about it
- Why cancelling a request is not enough to prevent a stale write
- What normalisation actually buys, and what it costs
- Why an inline `(s) => s.ids.filter(…)` selector re-renders for ever, and the eleven lines that stop it
- The exact order of snapshot → optimistic write → request → rollback
- What `partialize` is really deciding, and what `setState(next, true)` deletes
- Where the line is between client state and server state — and what Zustand deliberately does not do on the far side of it

> **Everything today is a consequence of one decision: the store owns the
> async.** Nothing here is Zustand being awkward. It is what any state library
> has to deal with once you put requests inside it — which is exactly why
> [Demo 24b](../24b-redux-toolkit/) builds this same screen again with Redux
> Toolkit, and why both guides end with the same comparison.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24a-advanced-zustand/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/24a-advanced-zustand/starter && npm install && npm run dev`.

Three things to set up before Lab 1, all of which you will use all day:

1. **Install the Redux DevTools browser extension** if you do not have it
   ([Chrome](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd),
   [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/reduxdevtools/)).
   It is not only for Redux — Zustand's `devtools` middleware speaks the same
   protocol, and from Lab 2 A every change to the inventory store will appear in
   it by name, with time travel that works. Lab 1 deliberately runs without it,
   so you can feel what it is for.
2. **Sign in as `emilys` / `emilyspass`.** That is DummyJSON's admin account,
   and `/account/inventory` is behind `requireRole('admin')`. `averyp` /
   `averyppass` is a moderator, and useful later for watching a 403.
3. Open DevTools → **Network**, tick **Disable cache**, filter to **Fetch/XHR**,
   and open **Application → Local storage**. Lab 6 lives in that panel.

**A standing note about the backend.** DummyJSON's reads are real. Its writes
are *simulated*: `PATCH /products/1` returns a correct, complete product with
your change applied, and stores nothing. Reload and the old number is back. That
is fine for everything today — an optimistic update is about what the UI does
between the request and the answer — and the guide says so again wherever it
matters. To force a *failure* you will patch a product that does not exist:

```
PATCH https://dummyjson.com/products/9999
→ 404  { "message": "Product with id '9999' not found" }
```

That is a real response, checked against the live API, and `ApiError.from()`
already prefers the backend's message to ours — so the rollback in Lab 4 shows
the words `Product with id '9999' not found` on the row.

---

## The cold open

Open `src/store/cart.ts` and count the lines. Sixty-four, including comments and
two blank lines. It holds an array and a boolean, it has six actions, every one
of them is a single synchronous `set`, and it is **the most complicated store in
the application**. `wishlist.ts` is thirty-nine lines and holds one array.

They are not small because they are unfinished. They are small because they hold
*client state* — state the app itself created and owns. Nothing in either of
them can fail, take time, arrive out of order, be rejected by somebody else, or
be wrong.

Now sign in as `emilys` / `emilyspass` and open **Account → Inventory**.

You get an empty card and an honest label: *"The store is inert until Lab 2."*
The route exists, the filters render, the table renders nothing. Here is what
that screen has to do, and what the cart store has to say about each of it:

| The Inventory Console needs | `cart.ts` offers |
|---|---|
| **1.** To fetch a page of products *from the store* | nothing — every request in this app lives in a loader or a service |
| **2.** A loading state, an error, and an empty state that cannot contradict each other | nothing — there is no failure to represent |
| **3.** Overlapping requests that do not corrupt state when the slow one lands last | nothing |
| **4.** Cancellation, so a request nobody wants stops | nothing |
| **5.** Twelve rows, each with its own pending and error state | one `isOpen` boolean |
| **6.** An update that shows instantly and undoes itself if the server says no | nothing — `add` cannot be refused |
| **7.** A batch of writes, partly failing, with one Undo over all of them | nothing |
| **8.** A shape you can update deeply, select from cheaply, persist selectively and reset wholesale | `lines: CartLine[]`, replaced whole, every time |

Eight rows, eight blanks. That is not a criticism of the cart store — it is a
measurement of the distance between *"a store for client state"*, which you can
learn in an afternoon, and *"a store that owns asynchronous, shared, failable
state"*, which is the thing people mean when they argue about state management
on the internet.

**One more thing before you start.** Everything in that list is *already solved*
in ShopScope — by loaders, by actions, by `useFetch`, by TanStack Query in Demo
19. Putting it in a store is a deliberate choice with a deliberate cost, and the
last section of this guide is where you decide whether you would make it. Build
it first; judge it after.

Six labs. By the end of Lab 2 the table fills. By the end of Lab 4 you will have
made the server reject an edit and watched the row heal itself.

**And one note on how the store gets built.** The finished store sits under four
middlewares. They do not all arrive in Lab 1. Each one is added in the lab where
the thing it solves first hurts — `devtools` when you cannot see what is
happening, `immer` when the nested write turns ugly, `subscribeWithSelector`
when a subscription needs a selector, `persist` when something has to survive a
reload — and each addition is the same two-file diff: one more layer in
`index.ts`, one more entry in `InventoryMutators` in `types.ts`.

```text
  Lab 1    create<InventoryStore>()( slices )                       []

  Lab 2 A  devtools( slices )                                       [devtools]
           you are about to write a request with three outcomes
           and no way to watch it

  Lab 3 B  devtools( immer( slices ) )                              [devtools,
           `entities: { ...state.entities, [id]: {...} }` is one     immer]
           forgotten spread away from a mutation bug

  Lab 6 B  devtools( immer( subscribeWithSelector( slices ) ) )     [devtools,
           plain `subscribe()` takes ONE argument, and the           immer, sWS]
           transient listener wants a selector

  Lab 6 C  devtools( persist( immer( subscribeWithSelector(         [devtools,
                    slices ) ) ) )                                   persist,
           the recent list has to survive a reload                   immer, sWS]
```

*The stack, grown one layer at a time. The right-hand column is
`InventoryMutators` — it gains exactly one entry per layer, and Lab 6 C inserts
`persist` in the middle rather than appending it.*

---

## Lab 1 — Slices, and one store with no middleware at all (10 min)

### Problem

The inventory store is going to hold filters, a catalogue, a status machine,
per-row edit state, a selection, a bulk report, an undo snapshot and a persisted
recent list. Written the Demo 13 way that is one `create()` call with about
thirty keys in it, in one file, that five people edit in the same sprint.

The obvious fix is five stores. It is also the wrong one here, and it is worth
being precise about why: `setFilter` has to trigger `fetchPage`, `commitStock`
has to read `entities` and write `rows`, `bulkRestock` has to read the selection
*and* the entities *and* write both, and sign-out has to clear all of it at
once. Five stores means five imports in every file that coordinates them, five
things to reset, and no single snapshot in the devtools timeline.

### Concept

**A store is still one object; a slice is just a function that returns part of
it.** Nothing magic happens. `create()` takes one function `(set, get, store) =>
State`. A slice creator has exactly that signature and returns *some* of the
keys. You spread the results together:

```ts
create<Store>()((...args) => ({
  ...createFiltersSlice(...args),
  ...createCatalogueSlice(...args),
}));
```

`(...args)` is the entire trick, and it is worth a sentence: every slice gets
**the same `set` and the same `get`**, because they are the same arguments. That
is why `setFilter` in the filters slice can call `get().fetchPage(0)` in the
catalogue slice. One store, one state object, one subscription list.

```text
  ┌──────────────┐  useInventoryStore(selector)   ┌──────────────────┐
  │  Component   │ ────────────────────────────►  │   The store      │
  │              │                                │                  │
  │              │  ◄──── notify, if the ──────── │  state object    │
  └──────┬───────┘        selected value          │  + listeners     │
         │                changed                 └────────▲─────────┘
         │ calls an action                                 │
         ▼                                                 │
  ┌──────────────┐        set(partial | recipe)            │
  │ filters │ catalogue │ edit │ bulk │ recent  ───────────┘
  │   five slice creators, one (set, get)       │
  └─────────────────────────────────────────────┘
```

*Zustand's data flow: a component calls an action, the action calls `set`, the
store notifies only the subscribers whose selected value changed.*

**When to use several stores instead.** The test is not size, it is
*coordination*. Two stores are right when nothing has to happen atomically
across them and nothing has to read across them — `cart` and `wishlist` are a
good example and stay exactly as they are today. One store with slices is right
when actions in one area read or write another, or when a single change must
notify subscribers once rather than twice. The cost of slices is that everything
shares a namespace, so `status` had better mean the catalogue's status and
nothing else; name keys as though they will collide, because they will.

**And that is the entire lab.** No middleware today — the slices pattern is
enough to learn in one sitting, and every middleware you meet from Lab 2 on is
easier to understand when you have already seen the store work without it.

**The signature a slice creator has, before anything wraps it.** This is the
line the starter ships, and today it is correct:

```ts
export type SliceOf<T> = StateCreator<InventoryStore, [], [], T>;
//                                    ^^^^^^^^^^^^^^  ^^  ^^  ^
//                                    the WHOLE store │   │   what THIS
//                                    (so get() sees  │   │   creator returns
//                                     every slice)   │   └── mutators this
//                                                    │       creator applies
//                                                    └────── mutators applied
//                                                            ABOVE it
```

Two of those four parameters deserve a sentence each.

- **The first is the whole store, the last is this slice.**
  `SliceOf<FiltersSlice>` means "a creator that can `get()` all five slices and
  returns the filters ones". Swapping them is the most common and most confusing
  mistake in this file.
- **The two empty arrays are the mutator lists**, and they are empty because
  nothing is wrapped. `StateCreator`'s job is to work out what `set` looks like,
  and `set`'s shape is decided entirely by the middlewares above the creator.
  Plain, it is what Demo 13 used: `set(partial)` or `set((state) => partial)`,
  with an optional second `replace` argument. That is all.

**Every middleware from here on changes that signature**, which is the whole
reason the mutator tuple exists. `devtools` adds a third argument to `set`;
`immer` swaps the "return a partial" recipe for a "mutate a draft" one; `persist`
adds a `.persist` API to the store object; `subscribeWithSelector` adds a second
argument to `subscribe`. A slice creator whose type does not list them loses
them, and the error always lands on a `set` call in a slice rather than on the
middleware you actually changed. You will see each of those errors, in the lab
that adds the middleware that fixes it.

**One thing that is required even with no middleware: `create<State>()(…)`, the
empty call.** Same reason as in Demo 13 — the currying is what lets middleware
types flow through later instead of being inferred away. Write it now and you
never have to come back for it.

### Steps

**A. Read `src/store/inventory/types.ts`. Change nothing.**

Every slice interface, the `InventoryStore` intersection, `LOW_STOCK`, and the
bare `SliceOf` from the Concept. This file is the whole feature described in
types, and it is worth five minutes before you write a line: `LoadStatus` is a
union of four rather than four booleans, `RowState` is per row rather than per
page, `recent` is nested on purpose. The comment block above `SliceOf` lists the
four middlewares that will each add one entry to it — you can ignore it today.

**B. Read `src/store/inventory/index.ts`. Change nothing there either.**

```ts
export const useInventoryStore = create<InventoryStore>()((...args) => ({
  ...createFiltersSlice(...args),
  ...createCatalogueSlice(...args),
  ...createEditSlice(...args),
  ...createBulkSlice(...args),
  ...createRecentSlice(...args),
}));
```

Five lines, no middleware, and a working store. `(...args)` is the entire trick,
as in the Concept: same `set`, same `get`, five creators. Everything the rest of
this guide adds to this file is a wrapper around those five lines.

**C. `src/store/inventory/filtersSlice.ts` — `TODO(lab-1.1)`**

The three actions land as no-ops in the starter. Write them with the plain
`set` — one argument, no draft, no name:

```ts
export const createFiltersSlice: SliceOf<FiltersSlice> = (set) => ({
  ...initialFiltersState,

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () => set({ filters: initialFilters }),

  setDebugDelay: (ms) => set({ debugDelayMs: ms }),
});
```

Three shapes of `set` in three lines, and all three are plain Zustand:
`set(updater)` where the updater returns a **partial** and Zustand merges it,
and `set(partial)` directly where nothing has to be read first. Note the spread
in `setFilter`: `filters` is nested, so replacing one key means rebuilding the
object around it. It is one line today. Lab 3's version of that problem is not,
and that is where `immer` earns its place.

`setFilter` is generic over the key — look at its declaration in `types.ts`:

```ts
setFilter: <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => void;
```

so `setFilter('sortBy', 'stock')` compiles and `setFilter('sortBy', 'stok')`
does not, and `setFilter('lowStockOnly', true)` knows it wants a boolean. One
setter, five filters, no `any`.

### Verify

1. `npm run typecheck` — clean.
2. `npm run dev`, sign in as `emilys`, open **Account → Inventory**. The page
   still shows the "inert until Lab 2" notice — correct. Nothing fetches yet.
3. **One store, five slices.** In the browser console:

   ```js
   const s = useInventoryStore.getState();
   Object.keys(s);
   ```

   Not exported globally? Add `window.useInventoryStore = useInventoryStore` at
   the bottom of `index.ts` for the day, or use the *Sources* panel. You should
   see keys from all five slices in one object — `filters`, `status`,
   `entities`, `rows`, `selected`, `recent` — with every action beside them.
   That is what "one store" means, and it is why `setFilter` will be able to
   call `get().fetchPage(0)` in Lab 2.
4. Change **Sort by** to *Stock* in the toolbar, then run
   `useInventoryStore.getState().filters` again. `sortBy` is `'stock'` and the
   other four are untouched.
5. **Now the honest part.** Do steps 3 and 4 again, but this time answer these
   without adding a `console.log`: how many times did `set` run? Which action
   ran first? What did `filters` look like *before* the change? You cannot. The
   store works and is completely opaque, and in Lab 2 you are about to put a
   network request inside it with three possible outcomes. That is the problem
   `devtools` solves, and it is the first thing Lab 2 does.

### Watch out

- **`create<State>()(…)`, not `create<State>(…)`.** Drop the empty call and it
  works today and collapses the moment you add a middleware in Lab 2, with an
  error that appears somewhere else entirely. Write the empty call now.
- **`set(partial, true)` deletes your store.** The second argument is `replace`.
  `true` replaces the whole state object, actions included, and the next click
  throws `state.setFilter is not a function`. It is `false` — or absent —
  everywhere in this store; Lab 6 is the one place a replace is even considered.
- **`set` merges one level deep, and one level only.** `set({ filters: {...} })`
  replaces `filters` wholesale, which is why `setFilter` has to spread. It is
  not a deep merge and never has been.
- **A slice that only reads another slice still declares the whole store type.**
  `SliceOf<FiltersSlice>` is `StateCreator<InventoryStore, …, FiltersSlice>`:
  the first parameter is the *whole* store (so `get()` sees everything), the last
  is what this creator *returns*. Swapping them is a common and confusing error.
- **Name keys as though they will collide.** Five slices share one namespace.
  `status` belongs to the catalogue; the bulk slice's is `bulkStatus` for exactly
  this reason.

### In the real world

The slices pattern is what stops a store becoming a dumping ground, and it costs
nothing: no dependency, no convention beyond a shared namespace, and it is
reversible in an afternoon if the store turns out to want splitting after all.

The middleware stack is the other half of most teams' Zustand setup, and the
mistake worth avoiding is the one this guide is arranged to avoid: writing all
four on day one because a blog post had all four. Every layer is a cost —
`devtools` serialises, `persist` writes to disk, `immer` proxies every write,
`subscribeWithSelector` adds a second subscribe path — and every layer is an
entry you have to keep in step with a type in another file. Add each one the
week you need it, and you will be able to say what it is for.

### Further reading

- Zustand — [Slices Pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern): the official version of Step C, including the typed `StateCreator` form.
- Zustand — [Advanced TypeScript Guide](https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript): the mutator tuple, `create<T>()(…)`, and why the currying exists.
- Zustand — [`create`](https://zustand.docs.pmnd.rs/reference/apis/create): the API `create`, `set`, `get` and `subscribe` are defined by.
- Zustand — [Updating state](https://zustand.docs.pmnd.rs/learn/guides/updating-state): the plain `set` you used today — partial, updater, and the one-level merge.
- Zustand — [TypeScript guide](https://zustand.docs.pmnd.rs/learn/guides/typescript): why `create<T>()(…)` is curried, in the authors' own words.

---

## Lab 2 — `devtools`, then async in the store: a status machine, cancellation, and the race (35 min)

### Problem

**First, the small problem.** You are about to write one action with three
possible outcomes — it fills the table, or it fails, or it is superseded and
must write nothing at all — and at the end of Lab 1 you established that you
cannot see any of them. A `console.log` in each branch would tell you which
branch ran; it would not tell you what the state looked like on either side of
it, in what order eleven writes landed, or let you step back to the one before
the bug. That is `devtools`, it is ten lines, and it goes in first because
everything else in this lab is easier to debug with it than without it.

**Then the real problem.** Every other screen in ShopScope gets its data from a
loader, and a loader has three properties you have been quietly relying on since
Demo 10. The router
*calls* it, so it runs once per navigation. The router *cancels* it, through
`request.signal`, when you navigate away. And the router *owns the result*, so
there is exactly one place the page's data can be.

Move the fetch into a store and you lose all three at once. Nothing calls the
action but you; nothing cancels it but you; and the result has to be written
into state that other things are also writing into. The two failures that
follow are the two failures every hand-rolled data layer has:

- a `loading` that is still true after an error, or an `error` still on screen
  next to fresh data — because four booleans have sixteen combinations and only
  four of them are real;
- a response from a request you no longer care about overwriting the one you do
  — because promises resolve in whatever order the network feels like.

### Concept

**What a Zustand middleware actually is.** A function that takes your state
creator and returns another state creator. That is the whole interface. Because
they are functions, they nest, and the nesting order is the order an update
travels through on its way out:

```ts
create<InventoryStore>()(devtools(slices, { /* options */ }));
//                       ^^^^^^^^ wraps the creator, returns a creator
```

`devtools` connects the store to the Redux DevTools extension protocol. Every
`set` becomes an entry in a timeline, with the state after it, a diff against
the state before it, and a **Jump** button that puts the store back into that
state. It is a development tool that Zustand borrows wholesale; you install one
extension and you get the whole Redux debugging experience for a library that
is not Redux.

**Two options, and both are decisions.** `name` is what the instance is called
in the extension's dropdown — with three stores in this app (`cart`, `wishlist`,
`inventory`) an unnamed one is useless. `enabled: env.isDev` is not decoration:
without it the middleware ships to production, where it serialises every state
change into a message for an extension that is probably not listening, and
publishes your application's state shape to anyone who installs one.

**Named actions, which are the point.** Under `devtools`, `set` takes a third
argument:

```ts
set(partial, false, 'inventory/setFilter:sortBy');
//           ^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^ the name in the timeline
//           replace — still false, always
```

Skip it and the entry is called `anonymous`. Every `set` in this store names
itself, because Lab 4's rollback and Lab 5's partial failure are almost
impossible to read in a timeline of thirty entries all called `anonymous`.

**And the type, which is the first instalment of Zustand's best-known
complaint.** `devtools` changes what `set` can do, so a slice creator whose type
does not know about it cannot call the three-argument form. Add the middleware
to `index.ts` alone and `npm run typecheck` says this, once per named `set`:

```
src/store/inventory/filtersSlice.ts(40,7): error TS2554: Expected 1-2 arguments, but got 3.
```

Twenty-odd of those by the end of the day, and not one of them mentions
`devtools`. The fix is the mutator tuple the Lab 1 Concept promised, with
exactly one entry in it today:

```ts
export type InventoryMutators = [['zustand/devtools', never]];
export type SliceOf<T> = StateCreator<InventoryStore, InventoryMutators, [], T>;
```

That is the pattern for the rest of the day: one middleware in `index.ts`, one
entry in the tuple, in the same commit.

**A status machine, not booleans.** `status: 'idle' | 'loading' | 'ready' |
'error'` has four states and no others. There is no way to be loading *and*
errored, because a union is one value. `error: ApiError | null` hangs off it,
non-null only while `status === 'error'`, and every transition is one `set` so
subscribers never observe a half-updated pair.

```text
        ┌────────┐   fetchPage()    ┌──────────┐
        │  idle  │ ───────────────► │ loading  │
        └────────┘                  └────┬─────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
      response │ id matches   response │ id is STALE   abort or │ rejected
                ▼                        ▼                        ▼
          ┌──────────┐             ┌──────────────┐         ┌──────────┐
          │  ready   │             │  (discarded) │         │  error   │
          │ ids      │             │  no set at   │         │ ApiError │
          │ entities │             │  all         │         │          │
          └────┬─────┘             └──────────────┘         └────┬─────┘
               │                                                 │
               └──────────── fetchPage() again ◄─────────────────┘
                              (retry, or a filter change)
```

*The lifecycle. Cancellation and staleness land in the middle branch — they are
not errors, and they must not write anything.*

**Why cancellation alone is not enough.** `AbortController` stops the transfer,
and the browser rejects the `fetch`/XHR with an abort. But if the response had
already arrived and was sitting in the microtask queue waiting for your `await`
to be scheduled, aborting changes nothing: your `await` resumes, with data, from
a request you abandoned. This is not theoretical — it is what you get whenever
the abort and the response race, which on a fast connection is often.

So you need **request identity** as well: a number that goes up on every call,
stored in state, checked after every `await`. If it is not yours, return without
writing. Cancellation saves bandwidth and server work; the id is what saves
correctness. Use both.

```text
  t ──────────────────────────────────────────────────────────────►

  user types "phone"          user types "phones"
        │                            │
        ▼                            ▼
  ┌───────────────────────────────────────────────┐
  │ REQUEST A   id=1   GET /search?q=phone         │  (slow: 3000 ms)
  └───────────────────────────────────────────────────────────┐
                               ┌──────────────────┐           │
                               │ REQUEST B  id=2  │           │
                               │ GET ?q=phones    │ (fast)    │
                               └────────┬─────────┘           │
                                        │                     │
   state.requestId : 1 ─────────► 2 ────┤                     │
                                        ▼                     ▼
                                  B resolves            A resolves
                                  id 2 === 2            id 1 !== 2
                                  ✓ WRITE               ✗ DISCARD

  Without the id check, the LAST line wins and the table shows
  results for "phone" under a search box that says "phones".
```

*The race. B answers first and wins; A answers later and is thrown away.*

**`get()` before an `await` is a photograph.** This is the rule that catches
people, and it is not Zustand-specific — it is what "await" means:

```ts
const { page } = get();          // true right now
await listProducts({ page });    // …the world continues without you…
set({ ids: …, page });           // `page` is whatever it was BEFORE the await
```

Read what you need immediately before the call, and read `get()` **again** after
it for anything you are about to compare or write. In `fetchPage` there is
exactly one thing read afterwards — `get().requestId` — and it is the whole
safety mechanism.

**Where to put the AbortController.** Not in the store. Nothing renders from it,
`immer` would have to draft it, `devtools` would have to serialise it, and
`persist` would have to skip it. A module-scope `let inFlight: AbortController |
null` is the right home: state is what the UI reads, and this is a handle the
store keeps to itself.

**And a debounce is not the store's job.** "Wait 400 ms after the last
keystroke" is a property of one text input. Put it in `setFilter` and a preset
link, a test, and the next caller all inherit a delay they never asked for. The
starter's `InventoryFilters` already debounces with `useDebouncedCallback`
(Demo 7); the store action stays immediate and therefore testable without timers.

### Steps

**A. `src/store/inventory/index.ts` and `src/store/inventory/types.ts` —
`TODO(lab-2.1)`**

One layer, two files, and do them in this order so you see the error.

First `index.ts`. Wrap the five lines from Lab 1 — nothing inside the wrap
changes:

```ts
import { devtools } from 'zustand/middleware';
import { env } from '../../config/env';

export const useInventoryStore = create<InventoryStore>()(
  devtools(
    (...args) => ({
      ...createFiltersSlice(...args),
      ...createCatalogueSlice(...args),
      ...createEditSlice(...args),
      ...createBulkSlice(...args),
      ...createRecentSlice(...args),
    }),
    { name: 'ShopScope · inventory', enabled: env.isDev },
  ),
);
```

`npm run typecheck` is still clean — nothing has tried to use the third
argument yet. Now `types.ts`, where the tuple starts:

```ts
export type InventoryMutators = [['zustand/devtools', never]];
export type SliceOf<T> = StateCreator<InventoryStore, InventoryMutators, [], T>;
```

Still clean. The two are in step, and neither of them has changed a single line
of a slice.

**B. `src/store/inventory/filtersSlice.ts` — `TODO(lab-2.2)`**

Now name the three actions you wrote in Lab 1. Same bodies, two more arguments:

```ts
setFilter: (key, value) =>
  set(
    (state) => ({ filters: { ...state.filters, [key]: value } }),
    false,                          // replace — always false
    `inventory/setFilter:${key}`,   // the name devtools will show
  ),

clearFilters: () => set({ filters: initialFilters }, false, 'inventory/clearFilters'),

setDebugDelay: (ms) => set({ debugDelayMs: ms }, false, 'inventory/setDebugDelay'),
```

> **Skip step A's `types.ts` edit and this is what you get**, once per named
> `set`, from `npm run typecheck`:
>
> ```
> src/store/inventory/filtersSlice.ts(40,7): error TS2554: Expected 1-2 arguments, but got 3.
> ```
>
> Nothing in that message says `devtools`, or middleware, or `types.ts`. It is
> worth provoking on purpose now, while you know the cause, because you will
> meet it again in six months when you do not. Add the tuple entry and it goes.

**C. `src/store/inventory/catalogueSlice.ts` — `TODO(lab-2.3)`**

The initial state is already written. Add the two thin actions:

```ts
goToPage: (page) => {
  void get().fetchPage(page);
},
retry: () => {
  void get().fetchPage();     // no argument = the current page
},
```

`void` is deliberate: these return `void`, not a promise, and `void` tells both
the reader and `@typescript-eslint` that the floating promise is intended.

**D. `src/store/inventory/catalogueSlice.ts` — `TODO(lab-2.4)`**

```ts
// NOT state — nothing renders from it.
let inFlight: AbortController | null = null;

fetchPage: async (page) => {
  const requestId = get().requestId + 1;

  inFlight?.abort();                       // cancel the one nobody wants
  const controller = new AbortController();
  inFlight = controller;

  set(
    {
      requestId,
      status: 'loading',
      error: null,
      ...(page !== undefined ? { page } : {}),
    },
    false,
    'inventory/fetchPending',
  );

  // Read AFTER that set, and BEFORE the await: the last safe moment.
  const { filters, limit, page: current, debugDelayMs } = get();

  try {
    const data = await listProducts({
      q: filters.q,
      category: filters.category,
      sortBy: filters.sortBy,
      order: filters.order,
      page: current,
      limit,
      delayMs: debugDelayMs,
      signal: controller.signal,
    });

    if (get().requestId !== requestId) return;   // ← latest wins

    set(
      (state) => ({
        status: 'ready' as const,
        error: null,
        total: data.total,
        ids: data.products.map((product) => product.id),
        entities: {
          ...state.entities,
          ...Object.fromEntries(data.products.map((product) => [product.id, product])),
        },
      }),
      false,
      'inventory/fetchFulfilled',
    );
  } catch (error) {
    if (controller.signal.aborted) return;       // not a failure — us
    if (get().requestId !== requestId) return;

    set({ status: 'error', error: ApiError.from(error) }, false, 'inventory/fetchRejected');
  } finally {
    if (inFlight === controller) inFlight = null;
  }
},
```

Note `if (inFlight === controller)` in the `finally`. Without the check, a fast
request finishing *after* a newer one started would null out the newer one's
controller and the next `fetchPage` would have nothing to abort.

And look at the fulfilled branch before you move on. `ids` and `entities` are
explained properly in Lab 3 — write them now so the table fills — but the shape
of the write is the thing to notice: two nested spreads and an
`Object.fromEntries` to merge a page into a map. It is correct, and it is the
easiest kind of code to get subtly wrong. Lab 3 replaces those five lines with
two, and that replacement is the argument for the `immer` middleware.

**E. `src/store/inventory/filtersSlice.ts` — `TODO(lab-2.5)`**

Both `setFilter` and `clearFilters` now end with:

```ts
void get().fetchPage(0);
```

Always page 0. Page 3 of "phone" is not page 3 of "phones", and a filter change
that leaves you on page 3 of a 1-page result set shows an empty table with a
pager that says "Page 4 of 1".

Note what this means for `lowStockOnly`: DummyJSON has no predicate for
`stock < 20`, so that filter is applied client-side in Lab 3's selector — but it
still resets to page 0 here, because it still changes which rows you are looking
at. One rule, no exceptions, nothing to remember.

**F. `src/routes/account/InventoryPage.tsx` — `TODO(lab-2.6)`**

```tsx
const status = useInventoryStore(selectStatus);
const error = useInventoryStore(selectError);
const total = useInventoryStore(selectTotal);
const page = useInventoryStore(selectPage);
const pageCount = useInventoryStore(selectPageCount);
const visibleIds = useInventoryStore(selectVisibleIds);
const fetchPage = useInventoryStore((state) => state.fetchPage);
const goToPage = useInventoryStore((state) => state.goToPage);
const retry = useInventoryStore((state) => state.retry);

useEffect(() => {
  if (useInventoryStore.getState().status === 'idle') void fetchPage(0);
}, [fetchPage]);
```

Three things in those ten lines are decisions, not boilerplate:

- **`getState()` inside the effect, not `status` from the render.** Reading it
  reactively would put `status` in the dependency array, and the effect would
  re-run on every transition it causes. A non-reactive read is the right tool
  for "what is true at this instant" — it is `useInventoryStore.getState()`, the
  same function Demo 13's checkout action used.
- **`status === 'idle'`.** The store is a module singleton and outlives the
  route. Navigate to a product and back and the table is still there; fetching
  again would be a request for data you already have.
- **`loading` means two different things.** With rows already on screen, keep
  them and dim them — that is a *refresh*. With nothing on screen, show the
  skeleton — that is a *load*. The finished page distinguishes them with
  `status === 'loading' && visibleIds.length === 0`.

Then the four branches — error, skeleton, empty, table — and
`<Pager page={page} pageCount={pageCount} onChange={goToPage} />` under them.
The finished file in `solution/` is the reference if you get tangled.

### Verify

Steps A and B first — they are worth checking on their own, because everything
below is easier to read once they work.

1. **The instance exists.** `npm run dev`, sign in as `emilys`, open **Account →
   Inventory**, open **Redux DevTools**. There is an instance called **ShopScope
   · inventory** in the dropdown. Select it.
2. **Named actions.** Change **Sort by** to *Stock*, then **Order** to
   *Descending*, then toggle **Low stock only**. Three entries appear, named
   `inventory/setFilter:sortBy`, `inventory/setFilter:order`,
   `inventory/setFilter:lowStockOnly` — not `anonymous`. Delete the third
   argument from one of them and watch that entry become `anonymous`; put it
   back.
3. **Time travel.** Click the first of the three in the timeline, then press
   **Jump**. The toolbar snaps back to the state as it was, and forward again
   when you click the last entry. That works because `replace` is `false`: the
   actions are still in every snapshot.
4. **The Diff tab** of the last entry shows `filters.lowStockOnly: false →
   true`, and `filters` rebuilt around it — the spread from Lab 1 C, visible.
   Lab 3 changes what this diff looks like.
5. **Production is off.** `npm run build && npm run preview`, open the same page:
   no instance in the dropdown. That is `enabled: env.isDev`.

Then the rest of the lab.

6. Open **Account → Inventory**. The skeleton flashes, then twelve rows.
   Network shows **one** `GET /products?limit=12&skip=0&select=…&sortBy=title`.
7. Click **Next**. One request, `skip=12`, the pager says *Page 2 of 17*.
8. Navigate to a product, press Back. **No request.** The store still has the
   page. (Compare that with Demo 19's cold open, where the loader re-fetched
   every time. You have just re-invented the smallest possible cache — hold that
   thought for the last section.)
9. **The race.** Set **Simulated latency** to `4000 ms`. Type `phone` in the
   search box and wait for the spinner. Now set latency back to `none` and type
   `s` so the box reads `phones`. Watch the network panel:

   ```
   GET /products/search?q=phone&delay=4000   (pending…)
   GET /products/search?q=phones             200   140 ms
   GET /products/search?q=phone&delay=4000   (cancelled)
   ```

   The table shows results for **phones**, and it stays showing them. Now do the
   same thing with the `if (get().requestId !== requestId) return;` line
   commented out: the table flips back to `phone`'s results four seconds later,
   under a search box that says `phones`. Put the line back.
10. **Cancellation.** With latency at `4000 ms`, change the category twice
   quickly. The first request shows as *cancelled* in the network panel and
   never reaches the `catch`'s `set` — no error banner appears.
11. **Errors.** In DevTools → Network, switch to **Offline**, then click
   **Retry** or change a filter. `status` goes to `error`, `ErrorNotice` shows
   *"Can't reach the server…"* with a **Retry** button (it is retryable —
   `ApiError.isRetryable` is true for status 0). Go back online, click Retry,
   the table returns.
12. **DevTools.** The timeline reads `inventory/fetchPending` →
   `inventory/fetchFulfilled`. The pending entry's diff shows `status:
   "idle" → "loading"` and `requestId: 0 → 1`. A cancelled request contributes
   *one* entry, not two — there is no set on the abort path.

### Watch out

- **`Expected 1-2 arguments, but got 3` is always the same bug.** `devtools` is
  applied in `index.ts` but missing from `InventoryMutators` in `types.ts`. The
  error lands on a `set` call in a slice, sometimes twenty of them, and never
  names the middleware.
- **The devtools instance is missing entirely?** Either the extension is not
  installed, or `env.isDev` is false — check which build you are looking at
  before you go looking at the store.
- **An entry called `anonymous` is a `set` with no third argument.** Harmless
  today, unreadable by Lab 5. There is an `anonymousActionType` option if you
  want them labelled something better than `anonymous`, but naming the `set` is
  the real fix.
- **StrictMode fetches twice in development.** React mounts, unmounts and
  remounts every component in dev. You will see two requests on first load and
  the first will be *cancelled* — which is the code working exactly as designed,
  and a good demonstration of it. It does not happen in a production build.
- **`if (controller.signal.aborted) return;` must come before the id check**, or
  an abort that happens to also be stale writes an error.
- **Do not `throw` out of `fetchPage`.** Nothing awaits it — `void
  get().fetchPage(0)` is fire-and-forget — so a throw becomes an unhandled
  rejection with no UI. Failures go into `state.error`; that is what it is for.
- **`requestId` belongs in state, not in a module variable.** Two reasons: it
  shows up in the devtools diff, which is how you debug a race in the first
  place, and the reset in Lab 6 clears it with everything else.
- **`delayMs` is dev-only.** It is a teaching instrument. Nothing should ever
  send `?delay=` from production code, and the control that sets it is behind
  `env.isDev`.

### In the real world

The pattern in `fetchPage` — bump an id, abort the old request, check the id
after every await — is the same one `takeLatest` implements in redux-saga,
`switchMap` in RxJS, `condition` + `signal` in `createAsyncThunk`, and a query
key in TanStack Query. Every mature data layer has a "latest wins" primitive,
because every application that lets people type has this bug. Writing it by hand
once is the cheapest way to recognise it in all of them.

The other thing worth taking away: `status === 'loading'` covering both a
first load and a refresh is the most common "why does the screen flash" bug in
front-end code. Distinguish them by what is on screen, not by a second flag.

And the devtools decision is worth making explicitly, once, per project.
`enabled: env.isDev` is the safe default; some teams turn it on in staging
behind a flag, and nobody should turn it on in production, where it is both a
performance cost and a way of publishing your application's state shape to
anyone with the extension. The naming convention is worth agreeing too —
`slice/action:detail` here — because a timeline is only as good as its labels.

### Further reading

- Zustand — [`devtools`](https://zustand.docs.pmnd.rs/reference/middlewares/devtools): the `enabled`, `name`, `store` and `anonymousActionType` options.
- Zustand — [Advanced TypeScript Guide](https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript): the mutator tuple you started today, and why it exists.
- MDN — [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController): `signal`, `abort(reason)` and what aborting actually guarantees.
- MDN — [`AbortSignal`: `abort` event](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/abort_event): listening for cancellation, and `signal.aborted`.
- Zustand — [Updating state](https://zustand.docs.pmnd.rs/learn/guides/updating-state): `set`, the updater form, `replace`, and reading with `get`.
- React — [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect): the reasoning behind the one effect this page does keep.
- React — [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore): the hook Zustand's React binding is built on, and the source of the "getSnapshot should be cached" warning you meet in Lab 3.

---

## Lab 3 — Normalised entities, `immer`, and selector discipline (35 min)

### Problem

The table works. Two things about it do not.

Open React DevTools, tick **Highlight updates while components render**, and
edit nothing — just click **Next**. Every row flashes, which is expected. Now
toggle **Low stock only**. Every row flashes again, and in Lab 4 a single
changed stock number on row seven will flash all twelve. `InventoryTable`
subscribes to `entities`, so any change to any product is a change to the whole
table.

And the second: the visible list is currently `state.ids`, unfiltered, because
the honest version —

```ts
const ids = useInventoryStore((s) => s.ids.filter((id) => s.entities[id].stock < 20));
```

— returns a **new array every call**. Zustand compares with `Object.is`, sees a
new reference every time it checks, and calls your selector again. React 19
answers with:

```
Warning: The result of getSnapshot should be cached to avoid an infinite loop
```

and then, usually, `Maximum update depth exceeded`. This is the single most
common Zustand bug, and it has nothing to do with Zustand: it is what any
`useSyncExternalStore` does when the snapshot is unstable.

### Concept

**Normalisation, and what it is actually for.** The server sends an array. An
array is the wrong shape for a screen that updates one item, because "update
product 7" over an array is a `map` that allocates a new array, a new object for
the match, and touches every element on the way past.

```text
  NESTED (what the API sends)      NORMALISED (what the store keeps)

  products: [                      ids: [1, 2, 3]
    { id: 1, stock:  5, … },       entities: {
    { id: 2, stock: 30, … },         1: { id: 1, stock:  5, … },
    { id: 3, stock: 12, … },         2: { id: 2, stock: 30, … },
  ]                                  3: { id: 3, stock: 12, … },
                                   }
  find product 2   → O(n) scan     find product 2   → entities[2], O(1)
  update product 2 → map the       update product 2 → write ONE key
                     whole array
  row subscribes   → to the array  row subscribes   → to entities[2]
  duplicates       → possible,     duplicates       → impossible, the id
                     two copies                        IS the identity
                     drift
  order            → implicit      order            → explicit, in `ids`
```

*The same page, two shapes. `ids` holds the order, `entities` holds the truth.*

Three consequences worth naming:

- **`ids` is the current page, in the server's order.** Do not re-sort it in the
  client; the server sorted it, and re-sorting a 12-of-194 window gives you a
  sorted *page*, which is not the same thing and is a classic bug.
- **`entities` accumulates.** Page 2 does not delete page 1's products. That is
  deliberate: it is what makes "recently inspected" able to show titles for ids
  from three pages ago, and it is also — be honest about this — a tiny, unmanaged
  cache with no eviction. The last section of this guide comes back to it.
- **Normalisation is not free.** You now maintain two structures that must agree,
  and every read goes through a selector. For a list you only ever render whole,
  it is overhead. For a list whose individual rows are edited, it pays for itself
  the first time.

**And this is where the second middleware arrives.** Step A asks you to write
`patchStock` with the plain `set` you have been using since Lab 1. There is
exactly one way to do it:

```ts
patchStock: (id, stock) =>
  set(
    (state) => ({
      entities: { ...state.entities, [id]: { ...state.entities[id], stock } },
    }),
    false,
    `inventory/patchStock:${id}`,
  ),
```

Read that once more before you accept it. Two spreads, two levels, and every
one of them is load-bearing: drop the inner one and you mutate a product object
that components are still rendering — a bug where the data is right and the
screen is wrong, and the hardest kind to find. Drop the outer one and you mutate
the map. There is no type error for either. And `patchStock` is the *easy* case:
Lab 4 writes into `rows[id]`, Lab 5 writes twelve entities and a snapshot in one
`set`, and Lab 2's fulfilled branch already spreads `entities` and merges a page
into it by hand.

`immer` deletes all of it:

```ts
patchStock: (id, stock) =>
  set(
    (state) => {
      const product = state.entities[id];
      if (product) product.stock = stock;
    },
    false,
    `inventory/patchStock:${id}`,
  ),
```

immer hands you a **draft**: a Proxy that records what you touched and builds
the next state by structural sharing — the objects you did not touch keep the
same reference, which is exactly what the selectors below depend on, and exactly
what the hand-written spreads were there to guarantee. It is the same library,
and the same idea, that Redux Toolkit's `createSlice` uses internally; Demo
24b's reducers look like this for the same reason.

Note what does *not* change: the third argument is still there, `replace` is
still `false`, and the recipe is still a function of the state. The only
difference is that it mutates instead of returning. That is also the one rule
immer enforces at runtime — **mutate the draft or return a new state, never
both**; do both and immer throws.

**The type, instalment two.** `immer` goes *inside* `devtools`, so it is
appended to the tuple:

```ts
export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/immer', never],
];
```

Forget it, and this is the error, once per draft recipe — a wall of it, because
the last three labs are all draft recipes:

```
src/store/inventory/catalogueSlice.ts(127,7): error TS2769: No overload matches this call.
  Overload 1 of 2, '(partial: InventoryStore | Partial<InventoryStore> | ((state: InventoryStore) => InventoryStore | Partial<...>), replace?: false | undefined, action?: Action | undefined): unknown', gave the following error.
    Argument of type '(state: InventoryStore) => void' is not assignable to parameter of type 'InventoryStore | Partial<InventoryStore> | ((state: InventoryStore) => InventoryStore | Partial<InventoryStore>)'.
      Type '(state: InventoryStore) => void' is not assignable to type '(state: InventoryStore) => InventoryStore | Partial<InventoryStore>'.
        Type 'void' is not assignable to type 'InventoryStore | Partial<InventoryStore>'.
```

Worth reading slowly once, because it is the single most-reported Zustand
TypeScript error and the meaning is buried: *your recipe returns nothing, and
without immer in the tuple, `set` still wants a recipe that returns the next
state.* It says nothing about immer, and the file it names is never the file
you changed.

**Selector discipline, in three rules.**

1. **Select the smallest thing.** `(s) => s.entities[id]` re-renders one row.
   `(s) => s.entities` re-renders every row that reads it.
2. **Never build a new object or array in a selector unless you memoise it.**
   `{ a: s.a, b: s.b }` is a new object every call. Either select twice, or wrap
   it in `useShallow`, which compares the object's keys instead of its identity.
3. **A "default" object is a new object.** `s.rows[id] ?? { pending: false,
   error: null }` allocates on every call for every idle row. Hoist it to a
   shared constant and the comparison becomes free.

**Memoising a derived list without a library.** Remember the inputs and the
answer. When the inputs are identical *by reference*, return the same array:

```ts
let lastInputs: [number[], Record<number, Product>, boolean] | null = null;
let lastResult: number[] = [];

export function selectVisibleIds(state: InventoryStore): number[] {
  const inputs = [state.ids, state.entities, state.filters.lowStockOnly] as const;
  if (lastInputs && inputs.every((input, i) => input === lastInputs![i])) return lastResult;
  lastInputs = [...inputs] as typeof lastInputs;
  lastResult = state.filters.lowStockOnly
    ? state.ids.filter((id) => (state.entities[id]?.stock ?? 0) < LOW_STOCK)
    : state.ids;
  return lastResult;
}
```

That is `reselect` — the library Redux Toolkit's `createSelector` comes from —
in eleven lines. Writing it once is the fastest way to understand that
memoisation is about **references**, not values: this works *only* because immer
gives `entities` a new reference when and only when something in it changed.

One honest caveat, and it is the reason `reselect` has a cache size option: this
is a cache of one, at module scope, shared by every component. Two components
selecting with different filter values would thrash it. Here there is one
inventory table, so one entry is right — and `resetVisibleIdsCache()` exists so
tests and hot reloads can clear it.

**Testing a store with no React at all.** This is where Zustand is genuinely
pleasant. `useInventoryStore` is a hook, but it is also a plain object with
`getState`, `setState`, `subscribe` and (under `persist`) `persist`. A test
calls actions and reads state. No `render`, no Testing Library, no act warnings.

### Steps

**A. `src/store/inventory/catalogueSlice.ts` — `TODO(lab-3.1)`, the spread
version**

Two small actions, both of them nested writes, both with the plain `set` you
have used since Lab 1. Write them this way first — you are going to delete them
in ten minutes, and that is the point:

```ts
upsertProduct: (product) =>
  set(
    (state) => ({ entities: { ...state.entities, [product.id]: product } }),
    false,
    `inventory/upsert:${product.id}`,
  ),

patchStock: (id, stock) =>
  set(
    (state) => ({
      entities: { ...state.entities, [id]: { ...state.entities[id], stock } },
    }),
    false,
    `inventory/patchStock:${id}`,
  ),
```

Run the app. Both work. Then look at what you have: `patchStock` rebuilds the
whole `entities` map and the whole product object to change one number, in an
expression where two spreads, two brackets and a shorthand key all have to be
right, and where getting one wrong produces silence rather than an error. Now
look at the `entities` line in `fetchPage`, which does the same thing for twelve
products at once. Then go to Step B.

**B. `src/store/inventory/index.ts` and `src/store/inventory/types.ts` —
`TODO(lab-3.2)`**

`immer` goes **inside** `devtools` — it is the layer closest to your recipe,
because it is the layer that turns a recipe into a state:

```ts
import { immer } from 'zustand/middleware/immer';

export const useInventoryStore = create<InventoryStore>()(
  devtools(
    immer((...args) => ({
      ...createFiltersSlice(...args),
      // …the other four
    })),
    { name: 'ShopScope · inventory', enabled: env.isDev },
  ),
);
```

and the tuple gains its second entry, in the same order:

```ts
export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/immer', never],
];
```

Then rewrite Step A as drafts — the version in the Concept — and go back to
`fetchPage` from Lab 2 D and do the same to its fulfilled branch:

```ts
set(
  (state) => {
    state.status = 'ready';
    state.error = null;
    state.total = data.total;
    state.ids = data.products.map((product) => product.id);
    for (const product of data.products) state.entities[product.id] = product;
  },
  false,
  'inventory/fetchFulfilled',
);
```

Five spread-heavy lines become five plain ones, and the `Object.fromEntries`
goes with them.

Then finish the job, because a store with two styles of `set` in it is worse
than a store with either. `fetchPending` and `fetchRejected` become draft
recipes too — `state.status = 'loading'`, `state.error = null` — and so do all
three filters actions, where `setFilter` collapses to a single line:

```ts
set((state) => { state.filters[key] = value; }, false, `inventory/setFilter:${key}`);
```

From here to the end of the day, every `set` in this store is a draft recipe.
Labs 4 and 5 assume it.

> Do the `index.ts` half without the `types.ts` half and you get the TS2769
> wall from the Concept. Do it the other way round — tuple updated, stack not —
> and you get the other half of the same lesson:
>
> ```
> src/store/inventory/bulkSlice.ts(20,5): error TS2349: This expression is not callable.
>   Type 'never' has no call signatures.
> ```
>
> `set` has resolved to `never`, because you have described a store that does
> not exist. Both errors point at a slice; neither points at the two files you
> have to change together. That is the whole reason the tuple is a named alias
> with a comment on it.

Labs 4 and 5 are built out of these two. Naming them after what they mean —
rather than writing the same draft mutation in three places — is what makes the
devtools timeline readable later.

**C. `src/store/inventory/selectors.ts` — `TODO(lab-3.3)`**

Add the factories and the memoised list:

```ts
export const selectProduct = (id: number) => (state: InventoryStore) => state.entities[id];
export const selectIsSelected = (id: number) => (state: InventoryStore) => state.selected.includes(id);

const IDLE_ROW: RowState = { pending: false, error: null };
export const selectRowState = (id: number) => (state: InventoryStore) => state.rows[id] ?? IDLE_ROW;
```

then `selectVisibleIds` and `resetVisibleIdsCache` exactly as in the Concept.

> Try it wrong first, deliberately. Replace `IDLE_ROW` with an inline object
> literal, run the app, and watch every row re-render on every store change in
> React DevTools. Then put it back. Three seconds of work for a rule you will
> never need to be told again.

**D. `src/components/inventory/InventoryTable.tsx` — `TODO(lab-3.4)`**

Split the row out. The table now subscribes to **one** thing:

```tsx
export function InventoryTable() {
  const ids = useInventoryStore(selectVisibleIds);
  return ( …<tbody>{ids.map((id) => <InventoryRow key={id} id={id} />)}</tbody>… );
}

const InventoryRow = memo(function InventoryRow({ id }: { id: number }) {
  const product = useInventoryStore(selectProduct(id));
  const isSelected = useInventoryStore(selectIsSelected(id));
  const { toggleSelected, inspect } = useInventoryStore(
    useShallow((state) => ({ toggleSelected: state.toggleSelected, inspect: state.inspect })),
  );
  …
});
```

Two notes. `memo` is *not* what makes this cheap — the selectors are; `memo`
only stops the re-render the parent would otherwise force when `ids` is
unchanged. And `useShallow` is the exception, not the rule: two separate
`useInventoryStore((s) => s.toggleSelected)` calls would do the same job with no
import. It is here so you have written it once and know what it compares.

**E. `src/store/inventory/inventory.test.ts` — `TODO(lab-3.5)`**

`npm test` runs, and everything in the file is `it.todo`. Fill in the first
four. The shape:

```ts
vi.mock('../../api/services/products', () => ({
  listProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

beforeEach(() => {
  resetUserScopedStores();     // a store is a module singleton: reset it
  resetVisibleIdsCache();
});
```

The race test needs a promise you resolve by hand, because "two requests
overlap" cannot be arranged with `await`:

```ts
const slow = deferred<ProductListResponse>();
const fast = deferred<ProductListResponse>();
mockedList.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);

const first = useInventoryStore.getState().fetchPage(0);   // answers LAST
const second = useInventoryStore.getState().fetchPage(1);  // answers FIRST

fast.resolve(page([product(9, 1)]));
await second;
expect(useInventoryStore.getState().ids).toEqual([9]);

slow.resolve(page([product(1, 5)]));   // the stale one
await first;
expect(useInventoryStore.getState().ids).toEqual([9]);     // unchanged
```

And the memoisation test asserts `toBe`, not `toEqual` — a new array with the
same contents is precisely the bug:

```ts
expect(selectVisibleIds(useInventoryStore.getState())).toBe(first);
```

### Verify

1. **immer is actually on.** In Redux DevTools, change **Sort by** and open the
   **Diff** tab of that entry. You should see exactly one changed key,
   `filters.sortBy`. Before Step B the same action showed `filters` replaced
   wholesale — that was your spread rebuilding the object. If you still see the
   whole object, `immer` is in the tuple but not in `index.ts`.
2. `npm test` — eight tests in `inventory.test.ts` (four of them yours for now;
   Labs 4 and 5 fill the rest). They run in about 300 ms and render nothing.
3. React DevTools → **Highlight updates while components render** → toggle
   **Low stock only**. The table re-renders and only rows with `stock < 20`
   survive; the pager and the filters do not flash.
4. In the console: `useInventoryStore.getState().entities` — an object keyed by
   id. `useInventoryStore.getState().ids` — an array of twelve numbers in the
   server's sort order.
5. Click through to page 2 and back to page 1. `Object.keys(entities).length` is
   24, not 12. The store remembers.
6. In Redux DevTools, run `inventory/fetchFulfilled` and open **Diff**. Only
   `ids`, `total`, `status` and the *new* entity keys appear. The entities that
   did not change are not in the diff — that is structural sharing, and it is
   what the memoised selector depends on.

### Watch out

- **Mutate the draft, or return a new state — never both in one recipe.** immer
  throws if you do, and the message is clearer than most: *"An immer producer
  returned a new value *and* modified its draft."* It is an easy accident when
  you are converting a spread version to a draft one and leave the `return`
  behind.
- **The draft is a Proxy, so do not keep it.** Anything you pull out of `state`
  inside a recipe is only valid inside that recipe. Assigning
  `const p = state.entities[id]` and using `p` after the `set` returns gives you
  a revoked proxy.
- **`Maximum update depth exceeded` after adding a selector** means the selector
  allocates. Find the `{`, the `[`, the `.map`, the `.filter` or the `??
  {default}` and either memoise it or select something smaller.
- **`useShallow` is one level deep.** It compares the object's own values with
  `Object.is`. `useShallow((s) => ({ product: s.entities[id] }))` is fine;
  `useShallow((s) => ({ all: Object.values(s.entities) }))` is not — the inner
  array is new every time.
- **Do not put derived values in state.** `pageCount` is
  `Math.ceil(total / limit)` — a selector. Store it too and the day somebody
  forgets to update it, two parts of the screen disagree and neither is
  obviously wrong.
- **A module-scope memo cache leaks between tests.** That is why
  `resetVisibleIdsCache()` exists and why `beforeEach` calls it. In a component
  you would reach for `useMemo`; in a selector shared by several components, this
  is the shape, and it is a cache of one.
- **Never mutate outside a `set` recipe.** `useInventoryStore.getState().entities[1].stock = 3`
  compiles, changes nothing on screen, and — because immer froze that object —
  throws in development. The draft is only a draft inside `set`.

### In the real world

`ids` + `entities` is the shape `createEntityAdapter` generates for you in Redux
Toolkit, and it is what Demo 24b uses in three lines instead of twenty. That is
a real advantage of RTK and the comparison at the end says so. What writing it
by hand buys you is knowing what the adapter is doing, which matters the day you
need a shape it does not generate — a `Map`, a tree, entities keyed by
composite id.

The selector rules generalise past this library. "Do not return a new object
from a selector" is the same rule as React Redux's, the same rule as
`useSyncExternalStore`'s, and the reason `reselect` exists at all.

### Further reading

- Zustand — [Prevent rerenders with `useShallow`](https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow): the exact failure in this lab's Problem, and the fix.
- Zustand — [`useShallow`](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow): the hook's API and what "shallow" compares.
- Zustand — [Testing](https://zustand.docs.pmnd.rs/learn/guides/testing): resetting a store between tests, and testing without React.
- Immer — [Update patterns](https://immerjs.github.io/immer/update-patterns): arrays, nested objects, deletes and the "mutate or return, never both" rule.
- React — [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure): the case for normalisation, in React's own words.

---

## Lab 4 — Optimistic inline edit, and rollback (25 min)

### Problem

Editing stock is the whole point of an inventory console, and the honest version
— disable the row, wait for the round trip, re-render — costs 140 ms on a good
connection and two seconds on a train. An admin correcting twenty figures feels
every one of them.

The optimistic version writes the new number immediately and asks afterwards.
That is easy. What is not easy is the other branch: **the server says no.** Now
the screen shows a number that is not true, and you have to put the old one
back, say why, and do it on *that row* — not in a page-level banner that leaves
the operator guessing which of their twenty edits failed.

ShopScope already has an optimistic delete (Demo 14, via a router fetcher). This
is the same idea with the state in a store instead — and unlike a fetcher, a
store has no framework to undo things for you.

### Concept

**Four beats, always in this order.**

```text
  t ───────────────────────────────────────────────────────────────►

  ① SNAPSHOT            const previous = get().entities[id].stock;  // 5
     (a local const — it lives exactly as long as this call)

  ② OPTIMISTIC WRITE    patchStock(id, 99)   rows[id] = {pending:true}
     ┌───────────────────────────────────────────────┐
     │  row 1  │ Mascara │ £9.99 │  [ 99 ] spinner   │  ← one frame later
     └───────────────────────────────────────────────┘

  ③ REQUEST             await updateProduct(id, { stock: 99 })
     ──────────────────────────────────────────►
                                                 ✗ 404
     ◄──────────────────────────────────────────
                        { message: "Product with id '9999' not found" }

  ④ ROLLBACK            patchStock(id, previous)      // 5, from ①
                        rows[id] = { pending:false, error: message }
     ┌───────────────────────────────────────────────────────────┐
     │  row 1  │ Mascara │ £9.99 │  [ 5 ]  ↺ Product with id …   │
     └───────────────────────────────────────────────────────────┘

  On SUCCESS instead:   take the SERVER's product (it is the authority),
                        delete rows[id]   → the spinner and error vanish
```

*Snapshot before you destroy, write, ask, restore. Nothing else is safe.*

**The snapshot is a local `const`, not state.** It lives for the duration of one
call, which is exactly as long as it can possibly be needed. Putting it in the
store would mean deciding when to clear it, and getting that wrong is how you
roll back to a value from three edits ago. (Lab 5's undo *is* state, because it
has to outlive the call — and that difference is the lesson.)

**Per-row state, not a global flag.** `rows: Record<number, RowState>` where
`RowState` is `{ pending, error }`. Twelve rows can be in twelve different
states, and an operator editing three at once needs to see which one failed. A
single `isSaving` boolean is not a simplification here; it is a wrong model.

**Take the server's answer on success.** `updateProduct` returns the product the
server stored. Your optimistic value was a guess; the response is the fact. If
the backend clamps, rounds or normalises anything, this is where the screen
learns about it:

```ts
const updated = await updateProduct(id, { stock });
get().upsertProduct({ ...get().entities[id], ...updated });
```

Note the second `get()` — after the await, as always.

**And the backend, honestly.** DummyJSON simulates this write: the 200 response
is complete and correct, and nothing persists. Reload and the old number is
back. Everything this lab teaches is about the window between the request and
the answer, so the simulation is enough — but say it out loud, because a learner
who reloads and sees the old value will otherwise think they broke something.

### Steps

**A. `src/store/inventory/editSlice.ts` — `TODO(lab-4.1)`**

```ts
commitStock: async (id, stock) => {
  const previous = get().entities[id]?.stock;
  if (previous === undefined || previous === stock) return;   // nothing to do

  set((state) => { state.rows[id] = { pending: true, error: null }; },
      false, `inventory/editPending:${id}`);
  get().patchStock(id, stock);                                 // ② optimistic

  try {
    const updated = await updateProduct(id, { stock });        // ③
    get().upsertProduct({ ...get().entities[id], ...updated });
    set((state) => { delete state.rows[id]; },
        false, `inventory/editFulfilled:${id}`);
  } catch (error) {
    const apiError = ApiError.from(error);
    get().patchStock(id, previous);                            // ④ rollback
    set((state) => { state.rows[id] = { pending: false, error: apiError.message }; },
        false, `inventory/editRejected:${id}`);
  }
},

dismissRowError: (id) =>
  set((state) => { delete state.rows[id]; }, false, `inventory/dismissRowError:${id}`),
```

`delete state.rows[id]` is an immer draft delete, and it is the right call —
leaving `{ pending: false, error: null }` behind would grow `rows` for ever and
make `selectRowState`'s shared-constant trick pointless.

**B. `src/components/inventory/StockCell.tsx` — `TODO(lab-4.2)`**

A read-only button becomes an editor. The state model is the one line worth
copying:

```tsx
// null = idle; a number = the draft being typed. ONE piece of state, so
// "editing" and "the draft" cannot disagree — and no effect syncing them.
const [editing, setEditing] = useState<number | null>(null);
const draft = editing ?? stock;
```

Two `useState`s (`editing: boolean` plus `draft: number`) would need an effect
to copy `stock` into `draft` when the store changes underneath — and
`eslint-plugin-react-hooks` will tell you so, with *"Calling setState
synchronously within an effect can trigger cascading renders"*. It is right: the
store already holds the truth, and the copy only needs to exist while somebody
is typing over it.

The rest is Enter to save, Escape to cancel, a spinner while `row.pending`, and
`row.error` rendered next to the button with a dismiss link. The finished file
is 90 lines.

### Verify

1. Click a stock number, type a new one, press **Enter**. The number changes
   instantly; the network panel shows `PATCH /products/:id`; the spinner appears
   and vanishes. Redux DevTools shows
   `inventory/editPending:1` → `inventory/patchStock:1` → `PATCH` →
   `inventory/upsert:1` → `inventory/editFulfilled:1`.
2. **Reload the page.** The old number is back, because DummyJSON simulates
   writes. Expected, and worth seeing once.
3. **Force the failure.** In DevTools → Network, right-click the last `PATCH`
   and choose **Block request URL**, then edit that row again. Or, more
   instructively, change the id in `commitStock` to `9999` for one run. Either
   way:
   - the new number appears, then reverts to the old one;
   - the row shows `Product with id '9999' not found` (DummyJSON's real 404
     message, which `ApiError.from` prefers over ours);
   - **no other row is affected**, and there is no page-level banner.
4. **Watch the rollback in slow motion.** Set Network throttling to **Slow 3G**
   and edit two different rows within a second. Two spinners, independently.
   Fail one of them and the other finishes normally.
5. **Time travel.** In Redux DevTools, click `inventory/editPending:1` and then
   the **Jump** button. The table shows the optimistic state again. Click the
   last entry to come back. This is the payoff for naming every `set`.
6. `npm test` — add the rollback test (`TODO(lab-4.3)`); it asserts the
   optimistic value *before* awaiting, and the restored value after.

### Watch out

- **Snapshot before you write, not after.** `const previous = get().entities[id]
  .stock` must come before `patchStock`. After it, you snapshot the value you
  just wrote and "rollback" becomes a no-op — a bug that looks like the server
  silently accepting everything.
- **`?.stock` and the `undefined` guard.** The row can be gone: a filter change
  between click and save removes it from `entities`. Rolling back a product that
  no longer exists must do nothing, not create one.
- **Do not clear `rows[id]` in a `finally`.** The error path needs it to survive;
  a `finally` that deletes it erases the message you just wrote.
- **One `set` per beat, and name it.** Merging the optimistic write and the
  pending flag into one `set` is fine; splitting the rollback into three is how
  you get a frame where the number is old and the spinner is still on.
- **The edit survives a refetch, and that is a decision.** Changing a filter
  re-fetches, and the server's (unchanged) stock overwrites your optimistic
  value. That is correct — the server is the authority — but it will surprise
  someone, so it is worth a comment in the code.

### In the real world

Every optimistic update is the same four beats, whatever the tool: TanStack
Query's `onMutate`/`onError`/`onSettled` (Demo 19 Lab 4), RTK Query's
`onQueryStarted` with `patchResult.undo()`, a router fetcher's
`fetcher.formData` (Demo 14). The differences are only in who holds the
snapshot and who calls the rollback.

What a store does *not* give you, and the others do, is the fourth beat:
`onSettled` → invalidate. There is nothing here that says "and now go and check
what the server really thinks". You would have to write it, and you would have
to decide when. Hold that thought too.

### Further reading

- Immer — [Using `produce`](https://immerjs.github.io/immer/produce): what a draft is, what it records, and structural sharing.
- Zustand — [`immer` middleware](https://zustand.docs.pmnd.rs/reference/middlewares/immer): the middleware wrapping `produce` around every `set`.
- React — [`memo`](https://react.dev/reference/react/memo): what it does and does not do, for the row component in Lab 3 D.
- MDN — [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController): an edit is a write, so it is deliberately *not* aborted on a filter change — see Watch out.

---

## Lab 5 — Bulk restock: limited concurrency, partial failure, undo (20 min)

### Problem

Select ten rows, add ten to each. The one-line version is

```ts
await Promise.all(ids.map((id) => updateProduct(id, { stock: … })));
```

and it is wrong twice over. It opens ten connections at once — make it "select
all 194" and you have opened 194, which is how a helpful button becomes a
denial-of-service attack on your own API and a `429` for everybody else. And
`Promise.all` rejects on the *first* failure, discarding the nine results that
worked, so the UI has no idea which rows are now out of sync with the server.

Then there is the part users actually ask for: **undo**. Ten optimistic writes
have destroyed ten old values, and one of them was a mistake.

### Concept

**Limited concurrency in eleven lines.** `limit` workers pull from one shared
cursor until the list is empty. Results are written back at the *input* index,
so the caller can line them up with ids:

```ts
export async function mapWithConcurrency<T, R>(
  items: readonly T[], limit: number, worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = { status: 'fulfilled', value: await worker(items[index], index) }; }
      catch (reason) { results[index] = { status: 'rejected', reason }; }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
```

`cursor++` is safe without a lock for the same reason all of this is: JavaScript
is single-threaded, and `cursor++` cannot be interrupted. The `await` is the
only place another worker can run, and by then the index is already claimed.

**Partial failure, said out loud.** The result shape is
`{ attempted, succeeded: number[], failed: { id, message }[] }`. The UI says
*"9 of 10 updated · 1 rolled back"* and lists the failures with reasons.
"Something went wrong" would be a lie about nine rows, and it is the single most
common way a bulk action loses a user's trust.

**The snapshot is state this time.** In Lab 4 it was a local `const`, because it
was needed only until the request settled. Undo has to survive until the user
either clicks it or does something else, so `undoSnapshot: Record<number,
number> | null` lives in the store. That is the whole of undo:

```ts
undoBulk: () => set((state) => {
  for (const [key, stock] of Object.entries(state.undoSnapshot!)) {
    const product = state.entities[Number(key)];
    if (product) product.stock = stock;
  }
  state.undoSnapshot = null;
});
```

Be honest about what that is: a **client-side undo of a client-side change**.
It does not send anything, so on a real backend the server would still hold the
new value. The production version sends the reverse patch — and it still needs
this snapshot, because that is where it learns what to send.

**One `set` for all the optimistic writes.** Ten separate `set` calls are ten
notifications and ten renders. One recipe that mutates ten drafts is one
notification, and immer's structural sharing still gives each changed entity a
new reference so each row re-renders exactly once.

### Steps

**A. `src/lib/concurrency.ts` — `TODO(lab-5.1)`**

Write `mapWithConcurrency` as above. It is a pure utility with no store in it,
which is the point: test it on its own, use it anywhere.

**B. `src/store/inventory/bulkSlice.ts` — `TODO(lab-5.2)`**

The selection actions first (`toggleSelected`, `selectMany`, `clearSelection` —
three draft mutations), then:

```ts
bulkRestock: async (amount) => {
  const { selected, entities } = get();
  if (selected.length === 0 || get().bulkStatus === 'running') return;

  const snapshot: Record<number, number> = {};
  for (const id of selected) {
    const stock = entities[id]?.stock;
    if (stock !== undefined) snapshot[id] = stock;
  }
  const ids = Object.keys(snapshot).map(Number);

  set((state) => {                                   // ONE set, all of them
    state.bulkStatus = 'running';
    state.bulkReport = null;
    state.undoSnapshot = snapshot;
    for (const id of ids) {
      const product = state.entities[id];
      if (product) product.stock = snapshot[id] + amount;
      state.rows[id] = { pending: true, error: null };
    }
  }, false, `inventory/bulkPending:${ids.length}`);

  const outcomes = await mapWithConcurrency(ids, 4, (id) =>
    updateProduct(id, { stock: snapshot[id] + amount }));

  // split, then keep the winners and roll the losers back — in one more set
  …
}
```

The `bulkStatus === 'running'` guard is the cheap version of a dedupe: a second
click while the first batch is in flight does nothing. (Redux Toolkit spells
this `condition` on a thunk; it is the same idea.)

**C. `src/components/inventory/BulkBar.tsx` — `TODO(lab-5.3)`**

"Select page" / "Clear", the count, a **+10 stock to selected** button disabled
while running, **Undo** shown only while `undoSnapshot !== null`, and the report
alert listing failures by id.

### Verify

1. Tick three rows, click **+10 stock to selected**. All three numbers jump at
   once, three spinners, then a green *"3 of 3 updated"*. Network shows three
   `PATCH`es.
2. **Concurrency.** Click **Select page** (12 rows) with throttling on **Slow
   3G** and watch the network panel's waterfall: four requests overlap, then the
   next four, then the next four. Change `4` to `12` in `bulkRestock` and the
   waterfall becomes one solid block — that is the difference the limit makes.
3. **Partial failure.** In DevTools → Network, block one product's URL
   (right-click a `PATCH` → **Block request URL**) and run the bulk again. The
   report is amber: *"11 of 12 updated · 1 rolled back"*, with the blocked id and
   its message listed. That row's number goes back; the other eleven keep theirs.
4. **Undo.** Click **Undo**. Every number returns to what it was before the
   batch — including the eleven that succeeded. No requests are sent. Redux
   DevTools shows one `inventory/undoBulk` entry, and its diff contains twelve
   changed entities.
5. `npm test` — the bulk test asserts all three outcomes: winners kept, loser
   rolled back, report exact, then undo restoring all of them.

### Watch out

- **Take the snapshot from `entities`, not from the DOM or the row components.**
  It has to be the store's value at one instant, for all rows.
- **`Promise.allSettled` still starts everything at once.** It fixes partial
  failure, not concurrency. You need both, which is why `mapWithConcurrency`
  wraps its own try/catch rather than calling `allSettled`.
- **Do not `await` inside the `set` recipe.** immer's draft is only valid
  synchronously; an `async` recipe silently produces nothing.
- **Clear `undoSnapshot` when it stops being meaningful.** Dismissing the report
  clears it, and so does a refetch that replaces the entities — otherwise Undo
  writes numbers back onto rows the server has since changed.
- **`selected` holds ids that may leave the page.** Filtering does not clear the
  selection, deliberately, so an operator can filter, select, filter again and
  act on both. `bulkRestock` skips any id no longer in `entities`, which is what
  the `snapshot[id] !== undefined` filter is doing.

### In the real world

Concurrency limits belong to whoever knows the server's budget, which is you and
not the component. Four is a guess tuned to DummyJSON; a real API tells you in
its rate-limit headers, and the grown-up version of this helper reads `Retry-
After` and backs off — which `src/lib/retry.ts` already knows how to do.

The partial-failure report is the part reviewers skip and users remember. A bulk
action that says "done" when it half-worked is worse than one that failed
outright, because nobody goes looking for the difference.

### Further reading

- MDN — [`Promise.allSettled()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled): the settled-result shape this helper returns.
- Immer — [Update patterns](https://immerjs.github.io/immer/update-patterns): batching many draft mutations into one produce.
- Zustand — [Updating state](https://zustand.docs.pmnd.rs/learn/guides/updating-state): why one `set` is one notification.

---

## Lab 6 — `subscribeWithSelector`, `persist`, migration, and the cross-slice reset (25 min)

### Problem

Four questions, and the last two middlewares fall out of the first two.

**One: how do you run a side effect when one slice of state changes, without a
component?** The console should log the recently-inspected list whenever it
changes, in development. Nothing renders that log, so no component should
subscribe for it, and `useEffect` is the wrong tool for something that is not
part of a render. The store has a `subscribe`, but the plain one fires on
*every* change and hands you the whole state.

**Two: the console should remember the last eight products you opened, across
reloads.** Demo 13 already did persistence — `persist` with a `name` and a
`partialize`.

**Three, and it is the hard one: what happens to that stored data when the code
changes?** A
shipped release wrote `{ recentlyViewed: [{ id, title }] }` into
`localStorage`. Today's code expects `{ recent: { ids: [] } }`. Every user who
ever used the old version has the old shape sitting on their machine, and it
will be read by the new code, on their next visit, for as long as that browser
profile exists. Without a plan, the best case is that their list silently
empties; the worst is a crash on a field that is not there.

**And four, smaller:** signing out leaves the previous admin's catalogue page,
selection and recently-inspected list in memory for whoever signs in next.

### Concept

**The transient subscription, and the middleware it needs.** A Zustand store
has a `subscribe` whether or not React is involved — the React binding is built
on it. The plain form takes one argument:

```ts
useInventoryStore.subscribe((state, previousState) => { /* every change */ });
```

which is not what you want here. You want *"when `recent.ids` changes, and only
then"*, so you write the two-argument form:

```ts
useInventoryStore.subscribe(
  (state) => state.recent.ids,                    // what to watch
  (ids) => logger.debug(`recently inspected: ${ids.join(', ')}`),   // what to do
);
```

and the compiler stops you:

```
src/store/inventory/index.ts(135,5): error TS2554: Expected 1 arguments, but got 2.
src/store/inventory/index.ts(135,6): error TS7006: Parameter 'ids' implicitly has an 'any' type.
```

That is the entire case for `subscribeWithSelector`: it replaces the store's
`subscribe` with one that takes a selector, a listener and an options object
(`fireImmediately`, `equalityFn`), and only calls the listener when the selected
value actually changes. The listener runs outside React, no component is
subscribed, and nothing re-renders — which is what "transient" means, and why
it is the right shape for logging, analytics, a canvas redraw, or anything else
that is a consequence of state rather than a view of it.

It goes **innermost**, under everything else, because it is the layer that owns
`subscribe` and it has no opinion about `set`. Fourth entry, third instalment of
the tuple:

```ts
export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/immer', never],
  ['zustand/subscribeWithSelector', never],
];
```

**Now `persist`, the fourth and last layer.** It goes **between `devtools` and
`immer`**, and both halves of that matter. Under `devtools`, so that the state
change rehydration makes is an entry in the timeline — the debugging session
where you need that entry is the one where the bug *is* rehydration, and the
closing section of this lab demonstrates it. Above `immer`, so that what it
serialises is a finished state.

`persist` is also the one of the four that adds an **API to the store object**
rather than changing `set`: `useInventoryStore.persist.rehydrate()`,
`.hasHydrated()`, `.clearStorage()`. Lab 6 F's test is written against
`rehydrate()`, and without the middleware it does not exist:

```
src/store/inventory/persist.test.ts(51,30): error TS2339: Property 'persist' does not exist on type 'UseBoundStore<Write<WithImmer<WithDevtools<StoreApi<InventoryStore>>>, StoreSubscribeWithSelector<InventoryStore>>>'.
```

That is also the reason for the one oddity in the tuple. Three of the entries
say `never`; `persist` says `unknown`:

```ts
export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/persist', unknown],      // ← inserted, not appended
  ['zustand/immer', never],
  ['zustand/subscribeWithSelector', never],
];
```

The second element of each pair is the middleware's own type argument.
`never` means "this middleware contributes nothing to the store's type";
`unknown` is `persist` saying "I add something — the `.persist` API". It is not
a typo you can normalise. Copy it exactly.

And note **inserted, not appended**. Every previous instalment went on the end,
because every previous middleware went on the inside. This one goes into the
middle of the stack, so it goes into the middle of the tuple.

**`partialize` is a decision about what is *yours*.** Only the `recent` slice
survives. Everything else is deliberately excluded, and each exclusion has a
reason worth being able to say:

| Not persisted | Why |
|---|---|
| `entities`, `ids`, `total` | the server's data. Stored, it is a price that was true in March being read back in November |
| `status`, `error`, `requestId` | describes a request that ended long ago |
| `rows` | a spinner for an edit nobody is making |
| `selected`, `undoSnapshot`, `bulkReport` | a screen nobody is looking at |
| `filters` | arguable — and the URL is the better home for it (Demo 9) |
| `recent.ids` | **ours.** A choice the user made, that survives nothing else |

**Store ids, not objects.** `recent` holds ids because an id cannot go stale.
The titles beside them are looked up in `entities` at render time and simply
omitted when the product is not loaded. That is the whole reason persisting ids
is safe and persisting products is not.

**`version` + `migrate` is the contract.** `version` is a number you bump when
the persisted *shape* changes. `migrate(persisted, version)` is handed the old
payload and returns the new shape:

```ts
version: 2,
migrate: (persisted, version) => {
  if (version >= 2) return persisted as PersistedInventory;
  const old = (persisted ?? {}) as { recentlyViewed?: { id: number; title: string }[] };
  return { recent: { ids: (old.recentlyViewed ?? []).map((e) => e.id).slice(0, 8) } };
},
```

Bump the version *and* write the migration in the same commit. A bump without a
migration throws the data away; a shape change without a bump feeds the new code
the old shape, which is the crash.

**`merge` is shallow by default, and `recent` is nested.** The default merge is
`{ ...currentState, ...persistedState }`. With `recent: { ids }` that happens to
be equivalent — until the day `recent` gains a second key, when the persisted
object replaces the whole thing and the new key is `undefined`. Write the deep
version now:

```ts
merge: (persisted, current) => {
  const stored = (persisted ?? {}) as Partial<PersistedInventory>;
  return { ...current, recent: { ...current.recent, ...stored.recent } };
},
```

**`onRehydrateStorage` answers "did it work?"** It runs *before* rehydration and
returns a function that runs *after*, with the state or the error. The hydration
trap it exists for: rehydration is asynchronous for any storage that is, so
there is a window in which the store holds its initial state and a component
that renders in that window sees an empty list. In this app nothing depends on
it; in an SSR app it is the difference between a clean hydration and a mismatch,
and `skipHydration: true` plus a manual `rehydrate()` is the escape hatch.

**Reset, and the thing that eats an afternoon.**

```ts
useInventoryStore.setState(initialData, false, 'inventory/reset');   // merge
useInventoryStore.setState(initialData, true);                       // ✗ REPLACE
```

The second argument is `replace`. `true` replaces the whole state object — and
your **actions live in that object**. Replace it with data only and the next
click throws `state.fetchPage is not a function`. Merge the initial *data* back
in and leave the functions alone.

The registry is a small idea with a real payoff: each store registers its own
reset at import time, and `RootLayout` calls one function. A store added next
year needs no change in a layout component, and the decision about *which*
stores are user-scoped stays next to the store making it.

### Steps

**A. `src/store/inventory/recentSlice.ts` — `TODO(lab-6.1)`**

```ts
inspect: (id) =>
  set((state) => {
    const without = state.recent.ids.filter((existing) => existing !== id);
    state.recent.ids = [id, ...without].slice(0, RECENT_LIMIT);
  }, false, `inventory/inspect:${id}`),
```

Most recent first, no duplicates, capped — three rules, one place.

**B. `src/store/inventory/index.ts` and `types.ts` — `TODO(lab-6.2)`**

Write the subscription **first**, at the bottom of `index.ts`, and run
`npm run typecheck`:

```ts
if (env.isDev) {
  useInventoryStore.subscribe(
    (state) => state.recent.ids,
    (ids) => logger.debug(`[inventory] recently inspected: ${ids.join(', ') || '(none)'}`),
  );
}
```

```
src/store/inventory/index.ts(135,5): error TS2554: Expected 1 arguments, but got 2.
src/store/inventory/index.ts(135,6): error TS7006: Parameter 'ids' implicitly has an 'any' type.
```

Then add the middleware that makes it legal — innermost, wrapping the slices
directly:

```ts
devtools(
  immer(
    subscribeWithSelector((...args) => ({ /* the five slices */ })),
  ),
  { name: 'ShopScope · inventory', enabled: env.isDev },
)
```

and append the third entry to `InventoryMutators`. Typecheck is clean, and the
log appears the next time you open a product.

> `subscribe` also takes a third argument: `{ fireImmediately: true }` calls the
> listener once on subscription, and `equalityFn` replaces `Object.is` for the
> comparison. Neither is needed here; both are worth knowing exist.

**C. `src/store/inventory/index.ts` and `types.ts` — `TODO(lab-6.3)`**

Now `persist`, between `devtools` and `immer`, with its real options straight
away — there is nothing to stub, because you know what every one of them is for:

```ts
devtools(
  persist(
    immer(subscribeWithSelector(/* the five slices */)),
    {
      name: INVENTORY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: INVENTORY_PERSIST_VERSION,
      partialize: …,
      migrate: …,
      merge: …,
      onRehydrateStorage: …,
    },
  ),
  { name: 'ShopScope · inventory', enabled: env.isDev },
)
```

All six as in the Concept, all commented with *why*, not *what*. Then insert
`['zustand/persist', unknown]` into the tuple **between devtools and immer** —
not on the end — and you have the finished stack and the finished tuple.

**D. `src/store/registry.ts` — `TODO(lab-6.4)`**

A `Set<() => void>`, a `registerReset`, and a `resetUserScopedStores` that runs
them all. Then register the inventory reset at the bottom of `index.ts`, with
`replace` left `false`. Do not register the cart or the wishlist: they belong to
this browser, not to this account, and a shopper who signs out expects to still
have a basket.

**E. `src/routes/RootLayout.tsx` — `TODO(lab-6.5)`**

One line in `handleSignOut`, after `logout()`.

**F. `src/store/inventory/persist.test.ts` — `TODO(lab-6.6)`**

`useInventoryStore.persist.rehydrate()` is the seam — it re-reads storage and
runs `migrate` and `merge`, so a test can write a version 1 payload by hand and
watch the upgrade:

```ts
localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({
  version: 1,
  state: { recentlyViewed: [{ id: 4, title: 'A title that went stale' }, { id: 9, title: 'Another' }] },
}));
await useInventoryStore.persist.rehydrate();
expect(useInventoryStore.getState().recent.ids).toEqual([4, 9]);
```

### Verify

1. Open three products from the table. The **Recently inspected** strip appears
   with three names, most recent first. Open one again — it moves to the front
   and does not duplicate.
2. **Application → Local storage → `shopscope.inventory`.** The value is
   `{"state":{"recent":{"ids":[…]}},"version":2}`. Search it for a product
   title: there is none. Search it for `entities`: none. That is `partialize`.
3. Reload. The strip is still there. The table is empty and re-fetches, because
   the catalogue was deliberately not persisted.
4. **The migration, by hand.** In the console:

   ```js
   localStorage.setItem('shopscope.inventory', JSON.stringify({
     version: 1,
     state: { recentlyViewed: [{ id: 4, title: 'old' }, { id: 9, title: 'older' }] },
   }));
   location.reload();
   ```

   The strip comes back with two entries, and the console logs
   `[inventory] migrated persisted state v1 → v2 (2 ids)`. Look at the storage
   value now: it has been rewritten as version 2.
5. **Corruption.** `localStorage.setItem('shopscope.inventory', '{ not json')`
   and reload. The app starts, the strip is empty, and the console shows
   `[inventory] rehydration failed — starting empty`. Nothing throws.
6. **The reset.** Load a page of products, select three rows, open two products,
   then **Sign out**. Sign back in as `emilys` and open the console: the table
   re-fetches from page 1, nothing is selected, the strip is empty. Then check
   the header — **the cart still has your items.** That is the decision in
   `registry.ts`, visible.
7. **The transient subscription.** With `VITE_LOG_LEVEL=debug` (it is, in
   `.env.development`), opening a product logs `[inventory] recently inspected:
   12, 3, 7`. That line comes from `useInventoryStore.subscribe(selector,
   listener)` — outside React, no component subscribed, no render caused. That
   is what `subscribeWithSelector` is for.
8. `npm test` — eleven tests across the two files, all passing, in under a second.

### Watch out

- **`setState(next, true)` deletes your actions.** Said three times in this
  guide because it is the single most reported "Zustand broke" issue.
- **A store that is never imported never registers its reset.** The inventory
  store is only imported by the lazily-loaded `InventoryPage`, so a user who
  never opens the console has nothing to reset — which is fine, and worth
  knowing before you debug it.
- **Bump `version` in the same commit as the shape change.** Not the next one.
- **`partialize` runs on every state change.** Keep it cheap — a key pick, not a
  computation.
- **`localStorage` can throw.** Private mode, blocked cookies, quota. `persist`
  catches it and calls `onRehydrateStorage` with the error; your app must render
  without the data, which is why nothing renders from it unconditionally.
- **`persist` is not a cache.** It is a way to remember a choice. Persisting
  `entities` would give you an offline-first app with no invalidation, no TTL and
  no way to know how old anything is — which is the next section.

### Further reading

- Zustand — [`persist`](https://zustand.docs.pmnd.rs/reference/middlewares/persist): the whole option set, including `skipHydration` and `storage`.
- Zustand — [Persisting store data](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data): `version`, `migrate`, `merge` and `onRehydrateStorage` in depth, with examples.
- Zustand — [How to reset state](https://zustand.docs.pmnd.rs/learn/guides/how-to-reset-state): the registry pattern this lab uses, in the official docs.
- Zustand — [`subscribeWithSelector`](https://zustand.docs.pmnd.rs/reference/middlewares/subscribe-with-selector): `subscribe(selector, listener, { fireImmediately, equalityFn })`.
- MDN — [`Window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): synchronous, per-origin, string-only, and every way it can fail.

---

## The finished stack, and what reordering it actually breaks

All four are now in place, so the order can be *demonstrated* rather than
asserted. This is where most Zustand guides start; you have arrived at it with
a reason for every layer.

```text
  create<InventoryStore>()(
    devtools(               ← sees the next state + the action name
      persist(              ← writes the partialized slice, after
        immer(              ← turns your draft recipe into a state
          subscribeWithSelector(   ← selector-aware subscribe()
            slices ))))     ← your (set, get) => state

  InventoryMutators = [devtools, persist, immer, subscribeWithSelector]
                       └──────── same order, outside-in ────────┘
```

*The stack, outside-in. Each layer wraps the one below and hands the result up.*

**Three rules of thumb, in decreasing order of how much they matter.**

1. **`devtools` outermost, and this one is real.** It can only record state
   changes that pass through it, and the ones it misses when it is nested too
   deep are `persist`'s: rehydration writes state from *inside* `persist`, so a
   `devtools` underneath never sees it.

   Provable in a minute, with a stubbed extension counting the actions it is
   sent. With `devtools(persist(…))`, rehydrating and then dispatching one
   action sends three messages — two for the rehydration, one named `bump`.
   With `persist(devtools(…))`, the same sequence sends exactly one: `bump`.
   The rehydration happened; nothing recorded it. The debugging session where
   you need that entry is the one where the bug *is* rehydration.

2. **`immer` below anything that reads the finished state.** It is the layer
   that turns a recipe into a state, so everything above it should be handed a
   state. Keeping it directly above the slices is also the simplest thing to
   reason about: the `set` your slices receive is the draft-taking one, and
   there is nothing between them to think about.

3. **`subscribeWithSelector` innermost.** It owns `subscribe` and has no
   opinion about `set`, so it has nowhere it needs to be relative to the other
   three. Innermost is convention, and convention is worth having.

**And now the honest part, because it is more useful than the folklore.**
Reordering this stack mostly does *not* produce a compiler error, and mostly
does not break at runtime either. Verified on this store:

| What you do | What happens |
|---|---|
| Reverse `InventoryMutators` completely, leaving `index.ts` alone | **Compiles clean.** The tuple is used to derive what `set` can do, and devtools' and immer's contributions combine the same way in either order |
| Drop `['zustand/persist', unknown]` from the tuple, leaving `persist` applied | **Compiles clean** — until something calls `useInventoryStore.persist.…`, which is what makes `TS2339` such a confusing first symptom |
| Swap `persist` and `immer` in `index.ts` *and* the tuple | **Compiles clean, all eleven tests pass, and storage still receives `{"state":{"recent":{"ids":[…]}},"version":2}`.** `persist` serialises `get()` after the write settles, not the updater you handed in — so it never sees a draft |
| Move `devtools` under `persist` | Compiles, tests pass, **and rehydration silently disappears from the timeline** |
| Remove a middleware from `index.ts` but leave it in the tuple | `error TS2349: This expression is not callable. Type 'never' has no call signatures.` — `set` has resolved to `never` |
| Remove it from the tuple but leave it applied | `TS2554` (devtools) or `TS2769` (immer): the wall of errors from Labs 2 and 3 |

So the two claims worth carrying out of today are narrow ones: **`devtools`
outermost, for a reason you can watch**; and **the tuple and the stack are one
contract in two files, and the compiler enforces only about half of it.** Put a
comment above `InventoryMutators` saying "keep in step with `index.ts`" —
because the day somebody adds a fifth middleware, the error they get will point
at a `set` call in a file they have never opened, and the day somebody removes
one, there may be no error at all.

---

## Wrap-up — what you can now do

- [x] Split a store into typed slices, combine them with `(...args)`, and say when two stores would be better than one
- [x] Add each of `devtools`, `immer`, `subscribeWithSelector` and `persist` at the moment it is needed, keep `InventoryMutators` in step one entry at a time, and recognise `TS2554`, `TS2769`, `TS2349` and `TS2339` as four faces of the same drift
- [x] Say which part of `devtools(persist(immer(subscribeWithSelector(…))))` the order genuinely matters for, and demonstrate it
- [x] Model a request as a four-state machine that cannot contradict itself
- [x] Cancel a request with `AbortController` **and** discard a stale answer with a monotonic request id — and say which of the two is the correctness fix
- [x] Recognise that `get()` before an `await` is a photograph, and read it again afterwards
- [x] Normalise a page into `ids` + `entities`, write it through immer drafts, and say what normalisation costs as well as what it buys
- [x] Write atomic selectors, memoise a derived list in eleven lines, and diagnose "the result of getSnapshot should be cached" in one look
- [x] Implement an optimistic update with a local snapshot, per-row status, and a rollback that names the row it failed on
- [x] Run a batch with limited concurrency, report partial failure honestly, and undo it from one snapshot
- [x] Persist one slice with `partialize`, migrate an older shape with `version` + `migrate`, and survive a corrupted payload
- [x] Reset user-scoped state from a registry — without deleting the actions
- [x] Test a whole store, including a race and a rollback, with no React in the test file
- [x] Say precisely what this store does **not** do, and what you would reach for instead

### The store's honest limits

Everything you built today works. Here is what it is not:

```text
  What the Inventory Console has          What a CACHE would add
  ──────────────────────────────          ──────────────────────────────
  entities{} that accumulate        →  eviction. Nothing is ever removed.
                                       Page through 194 products and all
                                       194 stay in memory, for ever.

  fetchPage(), called by you        →  DEDUPE. Two callers in the same
                                       tick are two requests. There is no
                                       "somebody is already asking".

  data written once                 →  STALENESS. Nothing records WHEN a
                                       product was fetched, so nothing can
                                       say whether it is still true.

  a PATCH that updates one entity   →  INVALIDATION. Nothing else knows
                                       that product changed. /products,
                                       the detail route and the cart all
                                       still show the old figure.

  a refetch when YOU ask            →  BACKGROUND REFETCH. Nothing
                                       refreshes on focus, on reconnect,
                                       or on an interval.

  ┌────────────────────────────────────────────────────────────────┐
  │  components  →  useInventoryStore  →  api/services  →  server   │
  │                        ▲                                        │
  │                        └── this is where a query cache would    │
  │                            sit: TanStack Query (Demo 19), or    │
  │                            RTK Query (Demo 24b)                 │
  └────────────────────────────────────────────────────────────────┘
```

*The cache-shaped hole. Everything above the dashed idea is server state that a
store is holding on trust.*

That is not a flaw in Zustand. It is the boundary Demo 19 drew: **client state
is state you own; server state is a copy of somebody else's, and what it needs
is a cache, not a store.** The Inventory Console keeps server state in a store on
purpose, so you could feel the five lines above rather than be told them.

So when *is* today's pattern the right one?

| Reach for a store with async in it when… | Reach for a query cache when… |
|---|---|
| one screen owns the data and nobody else reads it | several screens read the same data |
| the state is mostly *yours* with a request attached (a wizard, a draft, a canvas) | the state is mostly *theirs* |
| the interaction is the interesting part — selection, undo, optimistic batches | the fetching is the interesting part |
| you need one atomic snapshot across several concerns | you need freshness, dedupe and invalidation |
| adding a dependency is genuinely not an option | it is |

The Inventory Console sits in the first column on rows 3 and 4 and the second
column on rows 1 and 2 — which is why a real ShopScope would probably use
**both**: TanStack Query for the page of products, this store for the selection,
the edit state, the undo snapshot and the recent list. That combination is the
one the last section recommends, and it is not a fudge.

---

## Zustand or Redux Toolkit?

[Demo 24b](../24b-redux-toolkit/) builds this exact screen again, same API, same
components, in Redux Toolkit. Both guides end with this section, and both are
meant to be fair. Here is the case, with the numbers measured rather than
guessed.

### The same architecture, twice

```text
  ZUSTAND (24a)                      REDUX TOOLKIT (24b)

  create<Store>()(                   configureStore({
    devtools(                          reducer: { inventory, [api]: … },
      persist(                         middleware: (get) => get()
        immer(                           .prepend(listener.middleware)
          subscribeWithSelector(         .concat(api.middleware),
            filters   ┐              })
            catalogue ├ slices         ├── createSlice   (immer inside)
            edit      │                ├── createAsyncThunk  pending/
            bulk      │                │     fulfilled/rejected
            recent    ┘                ├── createEntityAdapter (ids)
  ))))                                 ├── createListenerMiddleware
                                       └── RTK Query  createApi + baseQuery
  ── you write ──                    ── you configure ──
  fetchPage: abort + requestId       thunk `condition` + `signal`
  ids/entities by hand               createEntityAdapter
  selectVisibleIds memo by hand      createSelector
  registry + setState(…, false)      an action several slices react to
  persist middleware                 redux-persist, or listener + storage
  nothing                            RTK Query: dedupe, tags, invalidation

  ONE library, 4 middlewares         TWO libraries, one convention
  ~6.4 kB gzip added                 ~26.5 kB gzip added
```

*The same five concerns, solved by code you write versus configuration you
supply.*

### Bundle size — measured

Built with Vite 8, minified, gzip, on top of an identical React 19 baseline
(67.7 kB gzip). Each entry imports everything this feature actually uses:

| | gzip added | What was imported |
|---|---|---|
| **zustand + immer** | **6.4 kB** | `create`, `useShallow`, `devtools`, `persist`, `subscribeWithSelector`, `createJSONStorage`, `immer` |
| **@reduxjs/toolkit + react-redux** | **13.2 kB** | `configureStore`, `createSlice`, `createAsyncThunk`, `createEntityAdapter`, `createListenerMiddleware`, `createSelector`, `Provider`, `useSelector`, `useDispatch` |
| **…and RTK Query as well** | **26.5 kB** | all of the above plus `createApi`, `fetchBaseQuery` and the generated hooks |

Read the second row before you use the first one in an argument. Most of
Redux Toolkit's weight is RTK Query, and RTK Query is a *cache* — the thing
this store does not have and cannot pretend to. Comparing 6.4 kB of Zustand
against 26.5 kB of all-in RTK compares a store against a store plus a cache.
Against RTK's store alone it is 6.4 against 13.2, and if you add TanStack
Query to the Zustand column to make the features match, the gap closes
further still.

And in the real app: ShopScope's total JavaScript went from **200.4 kB** gzip
(Demo 14) to **216.0 kB** with the whole console here, against **242.5 kB**
for [the Redux build of the same feature](../24b-redux-toolkit/) — +15.6 kB
versus +42.1 kB. The lazily loaded `InventoryPage` chunk is about the same in
both, near 9.8 kB, downloaded only by admins who open the route. The
whole-app gap is wider than the library gap for a structural reason worth
understanding: `<Provider>` puts the Redux store on the critical path for
every visitor, while a Zustand store is only pulled in by the code that
imports it.

None of which settles the question. It is twenty-odd kilobytes on one screen,
and the rest of this table matters more.

### Everything else, honestly

| | Zustand | Redux Toolkit |
|---|---|---|
| **Boilerplate** | almost none to start; you write the patterns | more setup; the patterns come with it |
| **Async** | you write it — abort, request id, status machine (Lab 2) | `createAsyncThunk` gives you the lifecycle, `condition` and `signal`; RTK Query gives you the whole cache |
| **Normalisation** | by hand (Lab 3) | `createEntityAdapter` — three lines |
| **Memoised selectors** | by hand, or add `reselect` | `createSelector` is in the box |
| **TypeScript** | painful in exactly one place — the mutator tuple — and free everywhere else | more types to declare (`RootState`, `AppDispatch`, pre-typed hooks) but each one is documented and mechanical |
| **DevTools** | the same extension, via a middleware; action names are your job | first-class; every action is named by `createSlice` automatically |
| **Side effects** | an action, or `subscribe` | `createListenerMiddleware` — cancellation, `takeLatest` semantics, forks |
| **Server state** | nothing. You noticed. | **RTK Query**, and it is the strongest argument in this table |
| **Guardrails** | none — nothing warns you about a non-serialisable value or an accidental mutation | serializability and immutability checks on by default, in development |
| **Team size** | excellent at 1–5; needs conventions written down beyond that | designed for large teams; the convention *is* the library |
| **Testing** | a plain object; no React, no Provider | reducers are pure functions; thunks need a store, and `setupApiStore` for RTK Query |
| **Ecosystem** | small, focused, few opinions | large; the Redux style guide, an established idiom, and twenty years of hiring pool |
| **Learning curve** | an hour to productive, a day to the middleware stack | a day to productive, a week to RTK Query |

### The straight recommendation

**Default to Zustand plus a query cache.** For most React applications the right
split is TanStack Query (Demo 19) for server state and Zustand for client state.
You pay 6 kB for the store, you keep the API layer you already have, and the two
libraries never argue because they are not solving the same problem. That is the
combination ShopScope would actually ship, and it is what today's *honest
limits* section is arguing for.

**Choose Redux Toolkit when at least two of these are true:**

- the team is large enough that a shared, enforced convention is worth more than
  fewer lines — RTK is the only option here with a published style guide and an
  answer to "how do we all agree";
- the app is **server-state heavy** and you want one tool for both halves — RTK
  Query over your existing axios client (a custom `baseQuery`, not
  `fetchBaseQuery`) is genuinely excellent, and it is what Demo 24b builds;
- you need complex, cancellable side-effect orchestration — `createListenerMiddleware`
  is a better answer than anything in this guide, and a much better answer than
  the sagas it replaced;
- the domain is genuinely complex and time-travel over named actions is a
  debugging tool you will use weekly, not a demo;
- there is already Redux in the codebase. Migrating working Redux to Zustand is
  almost never worth it — and note that you do not have to choose all at once:
  24b keeps `cart.ts` and `wishlist.ts` in Zustand while the console runs on
  RTK, in the same app, on purpose.

**Choose Zustand when:**

- the shared state is small, or mostly UI, and the server state already has a
  home;
- bundle size is a real constraint (4× is 20 kB, and on a marketing-adjacent app
  that is a number somebody owns);
- you want state readable from outside React — a router action, an interceptor,
  a `subscribe` — with no Provider and no `dispatch` (Demo 13 Lab 4 did exactly
  this, and it stays easy at this scale);
- the team is small enough that conventions can live in a code review rather
  than in a library.

**What would change my mind, in either direction.** If this console grew a
second screen reading the same products, I would move the fetching to a query
cache that afternoon — whichever store stayed. And if it grew five more
developers, I would take RTK's guardrails over my own discipline, because the
serializability check catches the `ApiError` instance in state that this guide
puts there deliberately and nothing here warns about.

**The honest summary:** Zustand is a smaller tool that trusts you. Redux Toolkit
is a larger tool that protects you. Both build this screen well; you have now
built one of them, and [24b](../24b-redux-toolkit/) is the other. Read both
before you argue about either.

> For the wider landscape — Jotai, Valtio, MobX, XState, and which combinations
> actually work — see [Demo 13's *The landscape*](../13-client-state-with-zustand/).
> For side effects as streams, [Demo 24c](../24c-redux-observable/) takes the
> RTK store and puts RxJS over it.

---

## Reference

Official documentation only — each library's own docs, the React docs, and MDN
for web-platform APIs. Deep links to the exact page, so the link teaches
something on its own.

**Zustand — getting the shape right**

- [Introduction](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) — the whole API in one page
- [Slices Pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern) — Lab 1, officially
- [Beginner TypeScript Guide](https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript) — `create<T>()(…)` and why the currying exists
- [Advanced TypeScript Guide](https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript) — the mutator tuple that `InventoryMutators` is
- [`create`](https://zustand.docs.pmnd.rs/reference/apis/create) — `set`, `get`, `subscribe`, `getState`, `setState`

**Zustand — the middleware stack**

- [`devtools`](https://zustand.docs.pmnd.rs/reference/middlewares/devtools) — `enabled`, `name`, `anonymousActionType`
- [`persist`](https://zustand.docs.pmnd.rs/reference/middlewares/persist) — every option, including `skipHydration`
- [Persisting store data](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) — `version`, `migrate`, `merge`, `onRehydrateStorage` in depth
- [`immer`](https://zustand.docs.pmnd.rs/reference/middlewares/immer) — the draft recipe form of `set`
- [`subscribeWithSelector`](https://zustand.docs.pmnd.rs/reference/middlewares/subscribe-with-selector) — transient subscriptions outside React

**Zustand — rendering, resetting, testing**

- [Prevent rerenders with `useShallow`](https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow) — Lab 3's Problem and its fix
- [`useShallow`](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow) — what "shallow" compares
- [Updating state](https://zustand.docs.pmnd.rs/learn/guides/updating-state) — flat, nested, and with immer
- [How to reset state](https://zustand.docs.pmnd.rs/learn/guides/how-to-reset-state) — the registry in Lab 6 D
- [Testing](https://zustand.docs.pmnd.rs/learn/guides/testing) — resetting a module singleton between tests

**Immer**

- [Introduction](https://immerjs.github.io/immer/) — drafts, structural sharing, auto-freeze
- [Using `produce`](https://immerjs.github.io/immer/produce) — base state plus recipe
- [Update patterns](https://immerjs.github.io/immer/update-patterns) — arrays, nested objects, deletes, and "mutate or return, never both"

**React**

- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — what Zustand's React binding is built on
- [`memo`](https://react.dev/reference/react/memo) — what it does, and what selectors do instead
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) — normalisation, in React's own words
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — why `StockCell` has none

**MDN — the web platform underneath**

- [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Lab 2's cancellation
- [`AbortSignal`: `abort` event](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/abort_event) — `signal.aborted`, and listening for it
- [`Promise.allSettled()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) — the settled-result shape in Lab 5
- [`Window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — synchronous, per-origin, string-only, and how it fails
- [Structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — what can and cannot be cloned, which is the same question as what can be persisted

**The other side of the comparison**

- [Redux Toolkit — Getting started](https://redux-toolkit.js.org/introduction/getting-started)
- [`createSlice`](https://redux-toolkit.js.org/api/createSlice) · [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) · [`createEntityAdapter`](https://redux-toolkit.js.org/api/createEntityAdapter)
- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview) — the part with no Zustand equivalent
- [Redux Style Guide](https://redux.js.org/style-guide/) — the published convention Zustand does not have
- [React Redux — Usage with TypeScript](https://react-redux.js.org/using-react-redux/usage-with-typescript) — `RootState`, `AppDispatch`, pre-typed hooks

**Where server state belongs**

- [TanStack Query — Overview](https://tanstack.com/query/latest/docs/framework/react/overview) — the cache-shaped hole, filled
- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) — `staleTime`, `gcTime`, refetch behaviour

**In this track**

- [Demo 13 — Client State with Zustand](../13-client-state-with-zustand/) — the basics today builds on, plus *Groundwork* and *The landscape*
- [Demo 19 — TanStack Query & Real-time](../19-tanstack-query-and-realtime/) — server state, and the argument this guide hands off to
- [Demo 24b — Redux Toolkit](../24b-redux-toolkit/) — the same screen, the other library
- [Demo 24c — Redux-Observable & RxJS](../24c-redux-observable/) — side effects as streams, over a WebSocket
- [WALKTHROUGH.md](./WALKTHROUGH.md) — read the finished solution instead of building it

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `TS2769: No overload matches this call` … `Type 'void' is not assignable to type 'InventoryStore \| Partial<InventoryStore>'` | `SliceOf` does not declare `immer`, so `set` still wants a recipe that RETURNS the next state. Append `['zustand/immer', never]` to `InventoryMutators` (Lab 3 B). |
| `TS2554: Expected 1-2 arguments, but got 3` on a `set` call | Same cause, different middleware: `devtools` is missing from the mutator tuple, so `set` has no third "action name" parameter (Lab 2 A). |
| `TS2349: This expression is not callable. Type 'never' has no call signatures.` | The opposite drift: the tuple lists a middleware that `index.ts` does not apply, so `set` resolves to `never`. |
| `TS2339: Property 'persist' does not exist on type 'UseBoundStore<…>'` | `persist` is in the tuple or the test but not in the stack. `.persist.rehydrate()` only exists once the middleware is applied (Lab 6 C). |
| `TS2554: Expected 1 arguments, but got 2` on `subscribe` | The plain `subscribe` takes a listener and nothing else. `subscribe(selector, listener)` needs `subscribeWithSelector` (Lab 6 B). |
| Types break the moment you add a middleware | The tuple in `types.ts` and the nesting in `index.ts` have drifted. They are one contract in two files; change them together, in one commit. |
| `state.setFilter is not a function` after a reset | `setState(next, true)` replaced the state object, and the actions were in it. The second argument is `replace` — it must be `false`. |
| `Warning: The result of getSnapshot should be cached to avoid an infinite loop` | A selector allocates: an object literal, an array literal, `.map`, `.filter`, or `?? { default }`. Memoise it (Lab 3 C), select something smaller, or wrap it in `useShallow`. |
| `Maximum update depth exceeded` on the inventory page | The same thing, one step further along. Comment out selectors until it stops; the last one you removed is the culprit. |
| Every row flashes when one stock number changes | The row is subscribed to `entities` rather than `entities[id]`. Use `selectProduct(id)` (Lab 3 D). |
| Two requests on first load, the first cancelled | StrictMode, in development only. React mounts, unmounts and remounts; `fetchPage` aborts its predecessor. Correct behaviour — it does not happen in a build. |
| The table shows results for the previous search | The `if (get().requestId !== requestId) return;` guard is missing or is comparing a stale `get()`. Read `get()` fresh after every `await`. |
| An error banner appears after changing a filter quickly | The `catch` is missing `if (controller.signal.aborted) return;`, so a cancellation is being reported as a failure. |
| A request is never cancelled | `signal: controller.signal` was not passed to `listProducts`, or the `finally` nulls `inFlight` unconditionally — it needs `if (inFlight === controller)`. |
| The optimistic value never reverts | The snapshot was taken *after* the optimistic write, so it is the new value. `const previous = …` must come first. |
| An edit reverts on its own a moment later | A refetch landed and the server's (unchanged) value overwrote it. Expected — DummyJSON simulates writes and does not persist them. |
| `PATCH /products/9999` → 404 `Product with id '9999' not found` | Correct, and deliberate: that is the guide's way of forcing a rollback. The message on the row is DummyJSON's own, because `ApiError.from` prefers the backend's. |
| The row spinner never stops | `rows[id]` was deleted in a `finally`, or the error path forgot to write `{ pending: false }`. |
| Bulk restock fires every request at once | `mapWithConcurrency` fell back to `Promise.allSettled(items.map(…))` — the starter's stub. Implement the cursor (Lab 5 A). |
| Bulk reports "0 of 12" although rows updated | `outcomes` was indexed by iteration order rather than input index. Write results back at `index`. |
| Undo does nothing | `undoSnapshot` was cleared by a refetch or by `dismissReport` before the click. It is deliberately one-shot. |
| `localStorage` has no `shopscope.inventory` key | `persist` needs a `name`. Without one it throws at store creation; with one but no writes, check that `partialize` returns something non-empty. |
| The recently-inspected list empties after a deploy | A `version` bump without a `migrate`, or a shape change without a bump. Ship both in the same commit (Lab 6 C). |
| `[inventory] rehydration failed — starting empty` | A corrupted or hand-edited storage value. The app carries on by design; clear the key to silence it. |
| Product titles vanish from the recent strip after a reload | Correct: only ids are persisted, and `entities` starts empty. The strip falls back to `#id` until the catalogue loads. |
| Signing out leaves the table full | `resetUserScopedStores()` is missing from `handleSignOut`, or the store module was never imported, so it never registered (it is behind the lazy `/account/inventory` route). |
| The cart empties on sign-out | The cart store was registered in the reset registry. It should not be — it is this browser's state, not this account's. |
| Redux DevTools shows no instance | The extension is not installed, or `enabled: env.isDev` is false because you are on `npm run preview`. |
| Every devtools entry is called `anonymous` | The third argument to `set` is missing. Name every action; Lab 4's timeline is unreadable otherwise. |
| `Cannot read properties of undefined (reading 'stock')` in a test | The store is a module singleton and a previous test left it empty. `resetUserScopedStores()` and `resetVisibleIdsCache()` in `beforeEach`. |
| A test passes alone and fails in the suite | The module-level memo cache in `selectors.ts`. That is what `resetVisibleIdsCache()` is for. |
| `[config] Missing required env var VITE_API_BASE_URL` in a test run | Vitest does not read `.env.development`. `vitest.config.ts` sets it in `test.env`. |
| `TypeError: Cannot add property …, object is not extensible` | A mutation outside a `set` recipe. immer froze that object; the draft is only a draft inside `set`. |
