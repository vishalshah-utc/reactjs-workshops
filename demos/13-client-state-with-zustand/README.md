# Demo 13 — Client State with Zustand

**Demo guide** · ~90 minutes · state that isn't the server's, isn't the URL's and isn't one component's — and where it should live

---

## Where you are starting from

The starter is **Demo 12, finished**: login, a refresh queue, protected
routes, roles — and, since Demo 12, a light/dark `ThemeProvider`, a
`ToastProvider` every action reports through, a reducer-driven request status
on the profile page, `cartLinesReducer` in `src/lib/cartMath.ts`, and the
wishlist in a `WishlistProvider` above the router. Everything works — except
three things you may not have noticed are broken.

New stubs: `src/store/wishlist.ts`, `src/store/cart.ts`,
`src/components/CartDrawer.tsx`, `src/api/services/carts.ts`,
`src/routes/account/checkout.ts`. New dependency: **`zustand@5.0.15`** —
already in `package.json`, already installed.

## What you ship today

A **wishlist store** that replaces Demo 12's `WishlistProvider` — no
provider, no hook that throws, and a *subscription per component* instead of
one per context. A **real cart** built on the `cartLinesReducer` you wrote
last time: lines, quantities, a drawer that opens from the header, a live
badge, subtotal — derived, never stored. Both **persisted**
across reloads, with the drawer's open state deliberately left out. And a
**checkout action** that reads the cart *from inside a router action*, with
no hook in sight — because a store is an object first and a hook second.

By the end you will be able to answer, without hesitating:

- The four kinds of state in this app, and where each one lives
- Why a Zustand store is a hook, and what a selector buys you over Context
- Why derived values are selectors, not state
- Why selecting an object needs `useShallow`, and what happens without it
- What `persist` saves, what `partialize` leaves out, and what `version` is for
- How code outside React reads and writes the store — and why that's the point

> **Not everything belongs in a store.** The product list stays in the loader.
> The filters stay in the URL. The sign-up form stays in react-hook-form. The
> grid density stays in `useState`. Today's store holds exactly the two things
> that are none of those: the wishlist and the cart.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/13-client-state-with-zustand/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/13-client-state-with-zustand/starter && npm install && npm run dev`.

If you have React DevTools, open **Components → ⚙ → Highlight updates when
components render**. Lab 1's Verify uses it to *show* what a selector does.

---

## The cold open

Look at the header. The cart badge says **3**. It has said 3 since Demo 3 —
open `RootLayout.tsx` and there it is: `cartCount={3}`. Click **Add to cart**
on any product. Nothing. Save something on `/products/1` (Demo 12 gave the
detail page a heart), reload: gone.

Now read how the wishlist gets to the grid: `useState` in `WishlistProvider`
(`main.tsx`) → `useWishlist()` in `ProductsPage` → `wishlist` prop →
`ProductGrid` → `saved` prop → `ProductCard`. Better than Demo 9's Outlet
context — any page can read it. But every reader gets the *whole* value, and
in Demo 12 Lab 4 you measured what that costs: one heart click re-rendered
the header and everything under `ProductsPage` — twenty-odd components — and
when you put `useWishlist()` inside the card, all twelve cards flashed for one
click. A context has one dial: consumer, or not.

Today the wishlist and the cart become **stores**: one file each, readable
from any component in one line — *the slice it needs* — and writable from
outside React entirely.

---

## Groundwork — application state, and what a store actually is

You are about to install a state-management library. Before you do, it is
worth being precise about what you are managing, because most of the pain
teams have with "state management" is not caused by the library they chose.
It is caused by putting the wrong *kind* of state in it.

This section is the theory. Lab 1's Concept applies it to ShopScope
specifically — a five-row table naming where each piece of this app's state
lives. Read this first and that table stops being a list to memorise.

### What "application state" means

State is **any value that can change and that the UI must reflect**. That is
the whole definition. The interesting question is never "is this state?" —
it is **who owns it, who else reads it, and how long must it live**, asked
in that order:

1. **Who is the authority?** If a server decides the value and can change it
   without telling you, you do not own it — you hold a *copy*, and a copy
   that can go stale is a cache, not state.
2. **Who reads it?** One component, one screen, or components in unrelated
   branches of the tree?
3. **How long must it survive?** This render, this screen, this session, or
   across reloads?

### The six kinds of state

| Kind | The test | Typical home |
|---|---|---|
| **Server** | A server is the authority; it can change without you | a loader, or a query cache |
| **URL** | Somebody might send the link; Back should undo it | `useSearchParams`, route params |
| **Form** | Invalid until submitted; nobody else may see the draft | react-hook-form, or the form element |
| **Local UI** | One screen's business; dies with the screen | `useState`, `useReducer` |
| **Global client** | Yours, many distant readers, outlives any page | **a store** |
| **Ephemeral** | Changes faster than you want to render | a ref, or an external subscription |

Only the **global client** row needs a store. Every other row already has a
better home, and putting it in a store makes it worse — a filter in a store
cannot be linked to, a form draft in a store survives a cancelled form, and
server data in a store goes quietly stale.

The last row is the one people forget. A mouse position during a drag, a
scroll offset, the seconds ticking on a video: these change at 60 Hz and the
UI usually does not need a render for each change. They belong in a `ref`,
or in an external source read through
[`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore),
not in `useState` and not in a store.

> Lab 1's table is this one applied to ShopScope. It merges "ephemeral" away
> (this app has none) and names the actual file each row lives in. If the two
> ever disagree, the app-specific one wins — these are trade-offs with
> reasons attached, not laws. Demo 19 Lab 7 revisits the same table once a
> query cache exists and *changes one of the decisions*, because the reason
> behind it expired.

### One source of truth, and why duplicated state is the bug factory

**A value should be derived from one place, or stored in one place — never
both.** The moment the same fact exists twice, something has to keep the two
copies in step, and eventually something will forget.

```ts
// Two sources of truth. They will disagree.
{ lines: CartLine[], count: number, subtotal: number }

// One source of truth. The rest is arithmetic.
{ lines: CartLine[] }
const selectCount = (s) => s.lines.reduce((n, l) => n + l.qty, 0);
```

In the first shape every action must update three fields. `remove()` gets
written correctly, and six months later somebody adds `setQty()` and updates
`lines` and `count` but not `subtotal`. No test catches it, because the state
is internally inconsistent rather than wrong. In the second, `count` and
`subtotal` are **derived state** — *functions of* `lines`, computed on read.

You cannot have a stale derived value, because there is no value to go
stale. React's own docs make the same argument under
[avoid redundant state](https://react.dev/learn/choosing-the-state-structure#avoid-redundant-state)
— it is a React principle before it is a store principle, and Lab 2 applies
it to the cart.

The same rule explains **normalisation**. If a product appears in three
lists, store it once in `entities: Record<id, Product>` and keep `ids` per
list. Otherwise editing it means finding and updating three copies. Demos 24a
and 24b both build that shape, for exactly this reason.

### Unidirectional data flow

React's model has one direction: state flows down, events flow up. A store
does not change that — it just moves the *source* out of the tree.

```text
   ┌─────────────────────────────────────────────────┐
   │                                                 │
   ▼                                                 │
 STATE ──────► SELECTOR ──────► UI ──────► ACTION ───┘
 (one place)   (a pure fn)     (a pure   (the only
               state → view    function   way state
               -model)         of props)  changes)

 Read one way, write one way. Nothing in the UI mutates state directly;
 nothing derives a second copy of it.
```
*The loop every library on this page implements, whatever it calls the parts.*

Why it matters in practice: when there is exactly one way for state to
change, "why is this value wrong?" has a finite answer. You read the actions.
With two-way binding or a mutable object handed around, the answer is "any of
the 40 places holding a reference", and you are reading the whole codebase.

### What a store is, mechanically

Strip the marketing away and a store is four things:

1. **State** — one plain object, held in a module-level closure, outside the
   React tree.
2. **Actions** — the only functions permitted to replace that object.
3. **Selectors** — pure functions from state to the slice a caller wants.
4. **A subscription list** — callbacks to run when the state object changes.

That is it. You could write one in twenty lines, and React ships the hook
that connects one to a component —
[`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
— which is precisely what Zustand, Redux, Jotai and Valtio all call
underneath. What you buy from a library is not the mechanism; it is the
selector comparison, the middleware, the DevTools and the types.

### Store versus Context — the difference is the subscription

Context and a store both solve prop drilling. They do not both solve
re-rendering.

```text
  PROP DRILLING          CONTEXT                STORE
  ─────────────          ───────                ─────
   App(state)           Provider(state)       ┌───────────┐
     │ prop               │                   │   state   │
     ▼                    │ (no props)        │  actions  │
   Layout                 ▼                   └─────┬─────┘
     │ prop             Layout           subscribe  │  notify
     ▼                    │                    ┌────┴────┐
   Page                   ▼                    ▼    ▼    ▼
     │ prop             Page ◄─useContext   Header Page Card
     ▼                    │                   ▲    ▲    ▲
   Card ◄─uses it         ▼                   │    │    │
                        Card ◄─useContext    each picks its
                                              own slice
  Layers carry a       Any depth reads,     Any depth reads
  prop they never      but reads the        a SLICE, and is
  use themselves.      WHOLE value.         woken only for it.
```
*Three ways to get a value from the top of a tree to the bottom of it.*

Context is a *transport*, not a state manager — it holds whatever you put in
`value`, and the state itself is still `useState` or `useReducer` in the
provider (Demo 12 Lab 2 laboured this point). Its granularity is the whole
value: React re-renders **every** consumer whenever the provider's `value`
changes by reference, and there is no API to say "only when the count
changes". The one lever is splitting contexts, which works for two or three
and not for one per product.

A store inverts that. The component hands the store a selector, the store
runs it after every change and compares the result, and the component is only
woken when *its* result differs:

```text
  One value changes:   ids:  [7]  ──►  [7, 42]

  CONTEXT                        STORE + SELECTORS
  ───────                        ─────────────────
  value = { ids, toggle }        (s)=>s.ids.length       2 ─► 2   quiet
  is a NEW object,               (s)=>s.ids.includes(7)  T ─► T   quiet
  so every consumer              (s)=>s.ids.includes(42) F ─► T   RENDER
  is notified:
         │                       Header .......... quiet
         ▼                       ProductsPage .... quiet
   Header      RENDER            Card #7 ......... quiet
   ProductsPage RENDER           Card #42 ........ RENDER
   Card #7     RENDER            ...ten more cards  quiet
   Card #42    RENDER
   ...ten more RENDER            1 render, not 15.
```
*Subscription granularity: one heart click, fifteen renders or one.*

This is the entire practical argument for a store over Context, and Demo 12
Lab 4 made you measure it before you were allowed to hear it.

Two consequences worth stating plainly:

- **A store is readable outside React.** It is an object first and a hook
  second, so a router action, an axios interceptor or a test with no renderer
  can read and write it. Context cannot — `useContext` needs a component.
  Lab 4 is built on this.
- **The store's state is not React state.** React does not schedule it, does
  not batch it in the same way, and will not warn you about mutating it. That
  freedom is why returning the same object from `set` silently does nothing —
  see Lab 1's *Watch out*.

### Where the vocabulary came from

**Flux** was Facebook's 2014 answer to a specific bug: a notification count
that disagreed with the inbox, because two components each owned a piece of
the same truth. Flux's prescription was one-way flow — a *dispatcher* sends
*actions* to *stores*, stores notify *views*, views dispatch more actions.

[Redux](https://redux.js.org/understanding/thinking-in-redux/three-principles)
(2015) sharpened it to three rules: one store, state is read-only, changes
are made by pure **reducers**. That is where the words you will meet
everywhere come from:

| Word | Means |
|---|---|
| **action** | a plain object describing *what happened*: `{ type, payload }` |
| **dispatch** | send an action into the store |
| **reducer** | `(state, action) => newState`, pure, no side effects |
| **store** | holds the state, runs the reducer, notifies subscribers |
| **middleware** | a layer between dispatch and reducer: logging, async, DevTools |

The vocabulary outlived the strictness. Zustand has no dispatcher and no
action objects, but the shape is the same: one owner, pure updates, a
subscription list. You already wrote the reducer half in Demo 12 — Lab 2 of
this demo *hosts* `cartLinesReducer` inside a Zustand store precisely to show
that these are separable ideas.

### The distinction that matters more than the library: server state

If you take one thing from this section, take this. **Server state is not
client state.** Products, orders, the user record: a
server is the authority, other people change them, and your copy is stale the
instant it arrives. That copy is a **cache**, and caches have problems client
state does not have:

- when to refetch, and what counts as stale
- deduplicating the same request fired by three components at once
- what to show while refetching something you already have
- what to do when the window regains focus, or the network returns
- invalidating everything a mutation just made wrong
- discarding a slow response that arrived after a newer one

None of that is a *storage* problem, and a store solves none of it for you.
Put server data in a Zustand or Redux store by hand and you will implement
those six bullets yourself, badly, one `isLoading` flag at a time. That is
the single most common architectural mistake in React applications.

```text
  CLIENT STATE                    SERVER STATE
  ────────────                    ────────────
  you are the authority           somebody else is
  cannot be "stale"               stale the moment it arrives
  synchronous                     asynchronous, and can fail
  needs: storage + notify         needs: a CACHE
                                  (refetch, dedupe, invalidate,
                                   retry, background update)

  wishlist, cart, theme,          products, categories, orders,
  drawer open, feature flags      the signed-in user's record

        ▼                                  ▼
  Zustand / Redux / Jotai         loaders, TanStack Query,
  Context + useReducer            RTK Query, SWR, Apollo
```
*The dividing line. Most "state management" questions are cache questions.*

In ShopScope the loader owns server state today, which is why the store you
build in a moment holds only the wishlist and the cart. Demo 19 replaces the
hand-rolled half of that with TanStack Query and revisits the table with the
cache in place.

## The landscape — the four paradigms, and what to combine

The React state ecosystem looks crowded because the names arrive unsorted.
Sort them and it shrinks fast: almost every client-state library you will be
offered belongs to one of **four paradigms**, and the names that do not
belong to one are either a *cache* — a different axis entirely, further down
this page — or not state libraries at all.

Before any of that, the floor.

### The floor — most state should never become global

`useState` and `useReducer` are not a beginner's tool you graduate from.
They are where most of every application's state belongs and stays. A drawer
flag, a hovered row, an accordion's open panel: local UI state dies with the
screen that owns it, and promoting it to a global anything buys nothing and
costs you a name the whole app can collide with.

Prop drilling through two levels is not a crisis either; it is two props. Go
shopping for a paradigm only when a value has readers in *different branches*
of the tree, outlives the screen that created it, and is genuinely yours —
not the server's, not the URL's, not a form's. The six-kinds table above
decides that. The four paradigms below only decide *how* you hold what is
left over, which is usually far less than people expect.

```text
  ┌─ CLIENT STATE — pick ONE paradigm ───────────────────────┐
  │ 1 Context   React.createContext + useState/useReducer    │
  │ 2 Flux      Redux Toolkit · Zustand · (NgRx, Pinia)      │
  │ 3 Atomic    Jotai · Recoil (archived)                    │
  │ 4 Proxy     Valtio · MobX                                │
  └──────────────────────────────────────────────────────────┘
  ┌─ SERVER CACHE — a different axis; pick one of these too ─┐
  │ TanStack Query · RTK Query · SWR · Apollo · urql         │
  │ (React Router loaders do a smaller version of the job)   │
  └──────────────────────────────────────────────────────────┘
  ┌─ EFFECTS / LOGIC ────────┐  ┌─ NOT STATE LIBRARIES ─────┐
  │ redux-thunk  redux-saga  │  │ React-Redux  (bindings)   │
  │ redux-observable         │  │ Immer    (immutability)   │
  │ RTK listener middleware  │  │ Reselect (memoisation)    │
  │ XState  (state machines) │  │ Redux DevTools (devtool)  │
  └──────────────────────────┘  └───────────────────────────┘
```
*One paradigm, one cache, and effects only if the app asks for them.*

One from each box is normal. Two from the same box is a smell, and the
[redundant combinations](#combinations-that-are-redundant-or-a-mistake)
below say which pairs are the expensive ones.

The four paradigms differ on exactly one question — *who gets re-rendered,
and how does the library know?*

```text
  1 CONTEXT — one value, every consumer
      Provider(value) ──► useContext ──► ALL consumers render

  2 FLUX — one loop, one choke point
      action ──► reducer/set ──► store ──► selector ──► UI
         ▲                                              │
         └──────────── dispatch / call ◄────────────────┘
      a selector's RESULT is compared; equal means quiet

  3 ATOMIC — many tiny stores, subscribe per atom
      atomA ─┐
      atomB ─┴─► derived atom ──► only that atom's readers

  4 PROXY — write the object; the proxy knows who read it
      state.user.name = 'Bob'
         └──► only the components that READ .user.name render
```
*Four answers to "who wakes up, and why".*

### Paradigm 1 — Context, the native approach

**What it is.** React itself:
[`createContext`](https://react.dev/reference/react/createContext) and
[`useContext`](https://react.dev/reference/react/useContext), with the value
held by `useState` or
[`useReducer`](https://react.dev/reference/react/useReducer) in the provider.
It passes data down the tree without manual prop drilling, and it is React's
own documented pattern for
[scaling up with a reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context).

**Main libraries.** None — that is the whole appeal. Nothing to install and
nothing to add to the bundle. Note what this implies: Context is a
*transport*, not a state manager. Something else still owns the value.

**Best for.** Small to medium apps, and global values that change rarely:
theme (dark/light), locale, an injected API client, feature flags, the
signed-in user's identity. Demo 12 built exactly this shape, and this track
keeps it for the low-frequency values even after Zustand arrives.

**How it works.** The provider publishes one `value`; every consumer beneath
it reads that value. When the reference changes, React re-renders **every**
consumer, and there is no API to say "wake me only when the count changes".
The one lever is splitting contexts, which works for two or three and not
for one per product.

**Pros and cons.** Zero dependencies, zero bundle cost, zero new vocabulary,
and it is already in the codebase. Against that: re-render granularity is
the whole value, so it bottlenecks on anything that changes often; nothing
outside React can read it, because `useContext` needs a component; and you
hand-roll persistence, DevTools and middleware yourself. Demo 12 Lab 4 made
you measure that bill — one heart click, twenty-odd components — and this
demo exists because of the number you got.

### Paradigm 2 — Flux and Redux, the unidirectional flow

**What it is.** The architecture the vocabulary section above traces back to
Facebook in 2014, and the one every library on this page borrows from. Data
travels in a single loop: **actions** describe intent ➔ **dispatch** (or a
`set` call) is the only way in ➔ a **reducer** or updater produces the next
store ➔ components read back through **selectors**. One owner, one direction,
one choke point to read when a value is wrong.

**Main libraries.** Redux Toolkit and Zustand in React; the same idea is
[NgRx](https://ngrx.io/guide/store) in Angular and
[Pinia](https://pinia.vuejs.org/core-concepts/) in Vue, so the vocabulary
travels with you.

**[Redux Toolkit](https://redux-toolkit.js.org/introduction/getting-started)
(RTK)** — what "Redux" means in 2026. `configureStore` wires the store,
DevTools and sensible middleware in one call; `createSlice` writes your
actions and reducers from one object and lets you write "mutating" code
safely via Immer. *Cost:* the largest bundle of the client-state options and
the most vocabulary to learn. *Reach for it* when a team benefits from strong
conventions and the best debugging story in the ecosystem. The Redux team's
own position is
[RTK is Redux today](https://redux.js.org/introduction/why-rtk-is-redux-today);
believe them and never hand-write an action type again. Demo 24b.

**[Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction)**
— a store is a hook; selectors give per-component subscriptions; ~1 kB and
no provider. It belongs in this family, and it is worth being precise about
why: a Zustand store is a single owner with actions, a subscription list and
selector reads, which *is* the Flux loop. What it drops is the ceremony —
no action-type constants, no dispatcher, no reducer indirection, because an
action just calls `set`. Same data flow, a tenth of the apparatus, which is
exactly why this track teaches it first and meets RTK later, when you can
see what the extra apparatus is buying. *Cost:* no opinions, so conventions
are yours to enforce, and the middleware stack's TypeScript can bite. *Reach
for it* when you want the smallest thing that fixes Context's re-render
problem. This demo, and Demo 24a for the deep end.

**[Redux](https://redux.js.org/introduction/getting-started)** (the core
library) — one immutable state tree, pure reducers, a `dispatch` choke point,
middleware. *Cost:* by itself, a great deal of hand-written ceremony. *Reach
for it* — directly — essentially never in new code. You use it through RTK.

**[React-Redux](https://react-redux.js.org/introduction/getting-started)** —
**this is not a state library.** It is the *bindings*: `<Provider>`,
`useSelector`, `useDispatch`, and the subscription machinery that makes Redux
efficient in React. People confuse the two constantly and then argue about
"Redux" while meaning different halves of it. Redux without React-Redux is a
plain JS store; React-Redux without Redux does nothing. *Cost:* none worth
counting. *Reach for it* whenever you use Redux with React — you have no
choice, and its
[TypeScript guide](https://react-redux.js.org/using-react-redux/usage-with-typescript)
is the page to read first.

**Best for.** Medium to large applications with structured business rules
that several developers change at once — the case where a convention you can
enforce in review is worth more than the lines it costs. Also any app whose
hard days are spent asking "how did this value get like that?", because
time-travel over a list of actions answers that faster than anything else on
this page.

**How it works.** State is read-only and replaced, never edited in place, so
every change has a name and a moment. Selectors sit between the store and the
components, and the library compares each selector's *result*, so a component
is woken only when *its* answer changed — one card for one heart click, where
Context wakes every consumer it has.

**Pros and cons.** Predictability, one audit trail, DevTools that replay a
bug, and the largest hiring pool of any option here. Against that: RTK is the
heaviest client-state choice and the most to learn, and Zustand's lightness
comes back as conventions you must enforce yourself. And Redux's reducers are
pure and **synchronous**, which is why this paradigm — alone of the four —
comes with a middleware slot bolted to the side of it.

#### Asynchronous middleware sub-options

Redux reducers are pure and synchronous, so an API call cannot live in one.
You choose a layer between `dispatch` and the reducer instead. (Zustand skips
this decision entirely: an action can just be an `async` function that awaits
and calls `set`, which Demo 24a takes as far as cancellation and request
identity.)

**[redux-thunk](https://redux.js.org/usage/writing-logic-thunks) — the simple
pipeline.** Dispatch a *function* instead of an object and write ordinary
`async`/`await` inside it. Bundled in RTK's default middleware, so if you use
RTK you already have it. *Cost:* it is just functions — no cancellation, no
dedupe, no orchestration primitives. *Reach for it* for the ordinary 95% of
CRUD work: fetch, dispatch the result. Demo 24b builds `createAsyncThunk` in
full, with `rejectWithValue`, `condition` for dedupe and `signal` for abort.

**[redux-saga](https://redux-saga.js.org/docs/introduction/GettingStarted) —
the background worker.** Side effects as generator functions that watch for
actions and `yield` declarative effect descriptions, running like a separate
thread that can be paused, resumed, cancelled or raced. That makes them
unusually testable and good at long multi-step user journeys — undo/redo,
wizards, a workflow that must survive the user wandering off. *Cost:* a whole
second mental model, generators everywhere, and effects that are powerful
right up until somebody writes a 400-line saga. *Reach for it* in a codebase
that already uses it; in new RTK code,
[`createListenerMiddleware`](https://redux-toolkit.js.org/api/createListenerMiddleware)
does most of the same work with none of the generators, and the Redux team
recommends it instead.

**[redux-observable](https://redux-observable.js.org/docs/basics/Epics) — the
event-stream processing plant.** Side effects as RxJS streams ("epics"):
actions in, actions out, with the whole operator set for debouncing, retries,
backoff, cancellation and merging sockets into one river of data. *Cost:* you
are adopting RxJS, which is a large and genuinely difficult library, and
everyone touching that code must know it. **Check its maintenance before you
commit:** the latest published release is `3.0.0-rc.3` (December 2025) and it
is the *only* one that declares compatibility with Redux 5 — the last stable
release, `2.0.0`, peers `redux >=4 <5` and dates from 2021. Since Redux
Toolkit 2 ships Redux 5, a release candidate is the only version that fits,
which is a decision rather than an accident. *Reach for it* when the
application really is a stream — sockets, telemetry, live prices,
collaborative editing — and the team already speaks RxJS. Demo 24c builds
exactly that case over a WebSocket.

### Paradigm 3 — Atomic, the bottom-up approach

**What it is.** Instead of one large store, state is split into many tiny
independent nodes called **atoms**. A component subscribes to the atoms it
actually uses, so granularity is the default rather than a discipline you
have to keep.

**Main libraries.**

**[Jotai](https://jotai.org/docs/basics/concepts)** — the maintained one.
Primitive atoms hold values, derived atoms compose from other atoms, and the
library works out the dependency graph. *Cost:* the graph is implicit, so
"what depends on what" lives in your head, and debugging a wide atom graph is
harder than reading one store object. *Reach for it* for highly interactive
UIs with lots of independent, finely scoped state. Its
[comparison page](https://jotai.org/docs/basics/comparison) is honest about
where it beats a single store and where it does not.

**[Recoil](https://recoiljs.org/docs/introduction/core-concepts)** — the
atomic model from Facebook that popularised the idea. Same concepts, more API
surface. *Cost:* **the project is archived and no longer maintained.** *Reach
for it* never in new code; recognise it in old code and plan a move to Jotai,
whose model is close enough that migration is mostly mechanical.

**Best for.** Spreadsheets, canvases, drawing and design tools, node graphs,
dashboards — anywhere thousands of small values change independently and
fast, and a single store object would mean either one selector per cell or a
re-render of the lot.

**How it works.** An atom is its own subscription list. Write to one and only
its readers, and the readers of atoms derived from it, are woken; nothing
else in the app is consulted. Async is native: an atom's value can be a
Promise, and Suspense handles the waiting, so "loading" often needs no flag.

**Pros and cons.** Very high performance with no selector discipline
required, and composition that reads well. Against that: it is deliberately
unstructured, which suits a UI graph and suits a team's shared business
rules much less — there is no single object to open and read, and no obvious
place a newcomer looks first.

### Paradigm 4 — Proxy and reactive, the mutable approach

**What it is.** You mutate a plain object (`state.user.name = 'Bob'`) and a
JavaScript Proxy — or an observable wrapper — records both what changed and
which component read what, then re-renders exactly those components. No
actions, no reducers, no immutable spread.

**Main libraries.**

**[Valtio](https://valtio.dev/docs/introduction/getting-started)** — a proxy
store in the Zustand family of packages: mutate it anywhere, read it in a
component through `useSnapshot`, and the proxy tracks which properties that
render actually touched. *Cost:* mutation is easy to do in the wrong place,
proxies make some values (class instances, `Map`s) awkward, and "what
changed?" is less obvious than with an explicit action. *Reach for it* when
the ergonomics of direct mutation genuinely matter and the team is
disciplined.

**[MobX](https://mobx.js.org/the-gist-of-mobx.html)** — observable state with
automatic dependency tracking: mark state observable, mark components
observers, and MobX derives the minimum to re-render. Very productive, and
very unlike idiomatic React. *Cost:* the magic is opaque when it misfires,
decorators and class stores sit awkwardly beside hooks, and the hiring pool
is smaller. *Reach for it* in OO-shaped domains with deep object graphs, or
when the team already knows it.

**Best for.** Teams who think in objects and methods rather than in
transitions — often people arriving from Angular, Vue or a backend OO
language — and who do not want to spend their day on the rules of
immutability.

**How it works.** Reads during a render are recorded, writes are intercepted,
and the library computes the intersection. Async needs no middleware at all:
an ordinary `async` method awaits and then assigns, because there is no
reducer purity to protect.

**Pros and cons.** The least code of any option here, and it feels like
vanilla JavaScript. Against that: state can be changed from almost anywhere,
so on a large team "who wrote this value?" becomes a hard question — the
precise thing the Flux loop was invented to answer. Time-travel debugging is
weaker for the same reason.

### Comprehensive architecture matrix

| State paradigm | Key libraries | Asynchronous mechanics | Best architectural fit |
|---|---|---|---|
| **Context** (native React) | `createContext` + `useState` / `useReducer` | handled in a local `useEffect` or a custom hook, outside the context | small applications, and global settings that rarely change |
| **Flux / Redux** | Redux Toolkit, Zustand | extended via middleware — thunk, saga or observable; Zustand just awaits inside an action | scalable corporate apps with heavy structured business rules |
| **Atomic** | Jotai, Recoil *(archived)* | atoms can be async and natively return Promises, read through Suspense | complex interactive grids, node graphs, canvases, dashboards |
| **Proxy / reactive** | Valtio, MobX | handled natively inside class methods or `async` functions | teams prioritising development speed and mutable JavaScript syntax |

Read it by row. The paradigm decides who re-renders, the async column is a
*consequence* of that choice rather than a separate decision, and the last
column is the one your team's answer actually turns on — nobody has ever
picked a paradigm on bundle size alone and been glad two years later.

### The other axis — server-state caches

Now the correction the matrix cannot make on its own. **TanStack Query, RTK
Query, SWR, Apollo and urql are not a fifth paradigm.** They are not a row in
that table because they do not compete with its rows: they solve *caching*,
not client state, so a team picks one **in addition to** a paradigm above,
not instead of one. Zustand and TanStack Query in the same app is the most
common modern React stack precisely because the two hold different categories
of value — which is the point the server-state section above was making, and
the single most useful idea on this page.

These do the six things a store does not: refetch, dedupe, invalidate, retry,
update in the background, and hand you a request's status.

**[TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)**
— the default answer for server state, library-agnostic, excellent
[defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
mutations with optimistic updates, infinite queries, devtools. *Cost:* a
second cache to reason about beside your router's loaders, and query keys are
a design problem of their own. *Reach for it* in essentially any app with
meaningful server data. **Demo 19.**

**[RTK Query](https://redux-toolkit.js.org/rtk-query/overview)** — the same
job, built into Redux Toolkit, with the cache living in your Redux store so
one DevTools timeline shows everything. *Cost:* only sensible if you are
already using RTK. *Reach for it* the moment you are — do not hand-write
thunks to fetch lists. Demo 24b builds it on the axios layer from Demos 5–8.

**[SWR](https://swr.vercel.app/docs/getting-started)** — smaller and simpler
than TanStack Query: stale-while-revalidate, a lean
[cache API](https://swr.vercel.app/docs/advanced/cache), a fraction of the
surface. *Cost:* less capable where things get hard — mutations, pagination,
offline. *Reach for it* when the needs are simple and you value the smaller
API.

**[Apollo Client](https://www.apollographql.com/docs/react/caching/overview)**
and **[urql](https://nearform.com/open-source/urql/docs/)** — GraphQL
clients, which are *normalised caches first* and happen to hold state. Apollo
even offers
[local state](https://www.apollographql.com/docs/react/local-state/local-state-management)
in the same cache; urql is lighter and its
[Graphcache](https://nearform.com/open-source/urql/docs/graphcache/) is
opt-in. *Cost:* Apollo is large and its cache normalisation has sharp edges;
both only make sense with a GraphQL API. *Reach for it* when you speak
GraphQL — and note that you then usually need **no** separate server-cache
library, because you already have one.

### A note on state machines, which fit none of the four

**[XState](https://stately.ai/docs/state-machines-and-statecharts)** is not a
row in the matrix and not a paradigm for holding data. It is a **state
machine / statechart** library: you enumerate the legal states and the
transitions between them, so impossible states become unrepresentable rather
than merely unlikely. The question it answers is "what is allowed to happen
next?", not "where does this value live". *Cost:* real up-front modelling
work, a new formalism, and overkill for a cart. *Reach for it* for multi-step
flows with rules — checkout, onboarding, a media player, a document approval
chain. It composes with anything above: keep the machine for the workflow,
keep a store of whichever paradigm for the data.

### Supporting cast, so the names stop confusing you

[Immer](https://immerjs.github.io/immer/) makes immutable updates look like
mutations (RTK uses it internally; Zustand offers it as middleware).
**Reselect** — shipped inside RTK as `createSelector` — memoises derived
selectors. **Redux DevTools** is a browser extension, not a library, and
Zustand's `devtools` middleware speaks to it too. None of these is a state
manager; all three turn up in "which state library" arguments anyway.

### Which combinations actually work

Almost no real application uses one library. The useful question is not
"which one" but **"one paradigm, one cache"** — a client-state paradigm from
the four above, a server cache from the other axis, and something for side
effects only if the app needs it. Here are stacks that work, by application
profile.

| Profile | Client state | Server state | Effects / logic | Why |
|---|---|---|---|---|
| **Small–medium SPA** (1–5 devs) | **Zustand**, or Context + `useReducer` if the global state is one theme | **TanStack Query**, or a router's loaders | none — actions and mutation callbacks are enough | smallest thing that works; ~1 kB and no ceremony to argue about |
| **Large app, many devs** | **Redux Toolkit** | **RTK Query** | `createListenerMiddleware` | conventions you can enforce in review, one DevTools timeline for everything, a hiring pool that knows it |
| **Dominated by server data** (most CRUD apps) | **very little** — a store for UI preferences only | **TanStack Query** (or RTK Query if already on RTK) | none | the honest shape of a CRUD app: the cache *is* the state layer |
| **Heavy real-time / async orchestration** | **Redux Toolkit** | RTK Query with streaming updates | **redux-observable** (RxJS) or listener middleware | streams need operators — backoff, `takeUntil`, merging — and hand-rolled timers lose |
| **Complex multi-step workflows** | **XState** for the workflow + a store for the data | TanStack Query | XState actors | the bug is illegal transitions, not storage; enumerate the states |
| **Highly interactive editor / canvas** | **Jotai** or **Valtio** | TanStack Query | none | thousands of finely scoped values; atom or proxy granularity beats selector discipline |
| **GraphQL API** | Zustand for the little that is truly client's | **Apollo** or **urql** | none | the GraphQL client already *is* your normalised cache |
| **Legacy Redux being modernised** | **RTK**, slice by slice | RTK Query for newly touched endpoints | keep existing sagas; write no new ones | RTK is a drop-in for the same store, so you migrate a slice at a time — see the official [migrating to modern Redux](https://redux-toolkit.js.org/usage/migrating-to-modern-redux) guide. Do not start a parallel rewrite in a second library while still shipping features |

Two pairings deserve spelling out, because they look like duplication and
are not:

- **Zustand *and* TanStack Query** is the most common modern stack, and it is
  not redundant: they hold different categories. Query owns the cache, the
  store owns the wishlist. TanStack Query's docs make the same point in
  [does this replace client state?](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state)
  — no, and it is not trying to.
- **Redux Toolkit *and* Context** is fine too. Context still carries things
  that never change — a theme object, an injected client, a feature-flag bag.
  Not everything global needs a store; only things that *change* and have
  many readers do.

### Combinations that are redundant, or a mistake

**Server data hand-written into Redux or Zustand when a query cache is
available.** This is the big one. You will write `loading`/`error`/`data`
triples per entity, then a refetch-on-focus, then dedupe, then invalidation —
and arrive at a worse TanStack Query. If the data has an owner other than
you, cache it with a cache.

**Two client-state libraries with no migration plan.** Zustand *and* Redux
*and* Jotai in one app means three places a value might live and three
conventions in review. During a *migration* this is correct and temporary —
Demo 24b deliberately leaves the Zustand cart in place while RTK arrives
beside it, because that is what real migrations look like. Without a written
plan and an end date, it is just entropy.

**Both RTK Query and TanStack Query.** Two caches, two sets of keys, two
devtools, and nothing invalidates across them. Pick one. (RTK Query if you
are on RTK; TanStack Query otherwise.)

**redux-saga *and* redux-observable.** Two competing effect models, two
difficult formalisms, and every new developer must learn both.

**Apollo plus TanStack Query for the same GraphQL API.** You have a
normalised cache already; adding a second one buys nothing but conflicts.

**Redux for a form.** Every keystroke through a dispatch, every draft in
global state, and the cancel button needs a "reset" action. Forms are their
own category, which is why Demo 4 uses react-hook-form.

**A store for anything the URL should own.** `?q=`, `?page=`, `?sort=` in a
store means the Back button does nothing and a link to "page 3 of shoes"
cannot exist. This one is easy to spot in review and easy to write anyway.

**Reaching for any of it before you have the problem.** `useState` and props
carry a surprising amount of application. Prop drilling through two levels is
not a crisis; it is two props.

### The decision guide

```text
  Where does this piece of state go?

  Does a server own it, and can it change without me?
    ├─ YES ─► SERVER STATE: a loader, or TanStack Query / RTK
    │         Query / SWR / Apollo. Not a store. Stop here.
    └─ no
        │
  Should the Back button undo it, or could somebody send the link?
    ├─ YES ─► the URL: search params or route params. Stop here.
    └─ no
        │
  Is it a form draft, invalid until submitted?
    ├─ YES ─► react-hook-form, or the uncontrolled form. Stop.
    └─ no
        │
  Does it change faster than the UI needs to re-render?
    ├─ YES ─► a ref, or useSyncExternalStore. Stop here.
    └─ no
        │
  Do components in DIFFERENT branches read or write it?
    ├─ no ──► useState / useReducer, as close as it is used.
    └─ YES
        │
  Does it change often, with readers wanting different slices,
  or must non-React code (an action, an interceptor, a test)
  read it?
    ├─ no ──► Context + useReducer. No dependency needed.
    └─ YES ─► A STORE.
                ├─ small team, want the least ceremony ─► Zustand
                ├─ large team, want conventions + the
                │  best DevTools ───────────────────────► RTK
                ├─ thousands of tiny independent values ► Jotai
                └─ the rules, not the data, are the
                   hard part ──────────────────────────► XState
```
*Answer top to bottom and stop at the first YES. Most state stops early.*

Three habits make that tree hold up under pressure:

1. **Start at the bottom of the tree and move up only when it hurts.**
   `useState` → lift it → Context → a store. Every step up costs something;
   make the application ask for it.
2. **Write the reason down**, next to the code or in the pull request. Demo
   19 Lab 7 changes one of ShopScope's decisions because the reason behind it
   expired — which you can only notice if the reason was recorded.
3. **Judge maintenance health as part of the choice.** Recoil is archived.
   redux-observable's Redux 5 support exists only as a release candidate.
   Neither fact makes those libraries wrong, but both are part of the cost
   and neither shows up in a bundle-size comparison.

### Where this track takes it further

- **Demo 12 — Context & Reducers.** The reducer half of all of this, and the
  measurement of Context's re-render bill that this demo answers.
- **Demo 19 — Server State with TanStack Query.** The cache, and the
  where-does-state-live table redrawn once one exists.
- **Demo 24a — Advanced Zustand.** Slices, the middleware stack and its
  order, async in the store with cancellation and request identity,
  `persist` in depth, selector discipline — and the store's honest limits.
- **Demo 24b — Redux Toolkit.** `createSlice`, `createAsyncThunk`,
  `createEntityAdapter`, listener middleware and RTK Query, built on the same
  axios layer you already have.
- **Demo 24c — Redux-Observable & RxJS.** Side effects as streams, over a
  WebSocket.

24a and 24b build the **same feature** in both libraries, against the same
API and the same component tree, so the comparison is a measurement rather
than an opinion. When somebody asks you "Zustand or Redux?", that is the
answer worth having.

Now build a store.

---

## Lab 1 — The first store: the wishlist (20 min)

### Problem

The wishlist is owned by `WishlistProvider`, and that fixed Demo 9's problem
— position no longer matters, any page can read it. It left one: a consumer
of a context re-renders whenever *anything* in the value changes, and there
is no way to ask for less. The header wants a count; a card wants one
boolean; both get the whole array and re-render for every heart in the app.

### Concept

**Where state lives.** Before reaching for a store, name the kind of state.
Groundwork gave you the general taxonomy and the test for each row; this is
that taxonomy for *this* app, with the file each row lives in:

| Kind | Example in ShopScope | Lives in | Since |
|---|---|---|---|
| **Server** | products, categories, the user | loaders, revalidated by actions | Demo 10 |
| **URL** | `?q=`, `?page=`, `?edit=` | `useSearchParams` | Demo 9 |
| **Form** | the sign-up draft | react-hook-form | Demo 4 |
| **Local UI** | grid density, a pending delete | `useState` | Demo 2 |
| **Global client** | wishlist, cart | **a store** | today |

The last row is the *only* one a store is for: state that many distant
components read and write, that isn't the server's, and that has to outlive
any one page. Everything else already has a better home.

**A store is a hook.** `create()` returns `useWishlistStore`. Call it with a
**selector** — `useWishlistStore((s) => s.ids)` — and the component
subscribes to *that value*: it re-renders when `ids` changes and at no other
time. That is the difference from Context, where every consumer re-renders
whenever anything in the value changes — the bill you counted in Demo 12
Lab 4.

**Selectors are what Context cannot give you.** A context has one
granularity: the whole value. A selector is a *function from state to the
thing this component cares about*, and the store compares that result —
`selectWishlistCount` returns a number, so the header re-renders only when
the count changes; `selectIsSaved(42)` returns a boolean, so a card that
selects it re-renders only when product 42 flips. Twelve cards, one click,
one flash — you'll run that experiment in Verify. Splitting contexts (Demo 12
Lab 3) gets you two or three subscriptions; selectors get you one per
component, for free, without a provider.

**Actions live in the store.** Components never call `set`. They call
`toggle(id)`, and the store decides what toggling means. When the rule
changes ("a maximum of 20"), one file changes.

**The TypeScript idiom.** `create<State>()(…)` — note the empty call. It's
how the middleware types (Lab 3's `persist`) flow through; without the
currying, `persist` would lose your state type. Write it this way from the
start so nothing changes later.

### Steps

**A. `src/store/wishlist.ts` — `TODO(lab-1.1)`**

Replace the file:

```ts
import { create } from 'zustand';

/**
 * State AND the actions that change it, in one object. Components never call
 * `set` — they call `toggle`, and the store decides what that means.
 */
interface WishlistState {
  ids: number[];
  toggle: (id: number) => void;
  clear: () => void;
}

/**
 * A store is a HOOK. `useWishlistStore((s) => s.ids)` subscribes a component
 * to exactly that slice — it re-renders when `ids` changes and at no other time.
 *
 * `create<State>()(…)` — the empty call is the TypeScript idiom that lets the
 * middleware types flow through; without it, Lab 3's `persist` loses the state type.
 */
export const useWishlistStore = create<WishlistState>()((set) => ({
  ids: [],
  // `set` with a function reads the CURRENT state, like React's updater form.
  toggle: (id) =>
    set((state) => ({ ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id] })),
  clear: () => set({ ids: [] }),
}));

// --- Selectors: named, reusable, testable without React. -------------------

export const selectWishlistCount = (state: WishlistState) => state.ids.length;

/** A selector FACTORY: `useWishlistStore(selectIsSaved(42))` → boolean. */
export const selectIsSaved = (id: number) => (state: WishlistState) => state.ids.includes(id);
```

`set({ ids: [] })` **merges**: it replaces `ids` and leaves `toggle` and
`clear` alone. You never spread the whole state.

**B. `src/main.tsx` — `TODO(lab-1.2)`**

Delete the provider. A store needs none — it is a module, not a component:

```tsx
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
```

Remove the `WishlistProvider` import, then delete
`src/context/WishlistContext.tsx` altogether. `ThemeProvider` and
`ToastProvider` stay: a theme and a notification list are what Context is
*for* — few writers, rare changes, read everywhere. In `RootLayout`, drop the
`cartCount={3}` prop: the header is about to read both counts itself.

**C. `src/components/SiteHeader.tsx` — `TODO(lab-1.3)`**

Drop `cartCount` from the props, replace `useWishlist()` with the store, and
remove the `useWishlist` import:

```tsx
import { selectWishlistCount, useWishlistStore } from '../store/wishlist';
// …
interface SiteHeaderProps {
  /** null = signed out. */
  user?: User | null;
  onSignOut?: () => void;
}

export function SiteHeader({ user = null, onSignOut }: SiteHeaderProps) {
  const [showSignup, setShowSignup] = useState(false);
  const { theme, toggleTheme } = useTheme();             // Demo 12's context — unchanged

  // No prop and no context for this any more: the header subscribes to the store itself.
  // The selector returns a NUMBER, so the header re-renders only when the count actually changes —
  // useWishlist().ids.length re-rendered it whenever the ARRAY changed.
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const cartCount = 0;   // Lab 2 replaces this
```

**D. `src/routes/ProductsPage.tsx` — `TODO(lab-1.4)`**

Replace the `useWishlist` import with the store's:

```tsx
import { useWishlistStore } from '../store/wishlist';
// …
  // Client state from the store — no provider, no props from the layout.
  const wishlist = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
```

Two calls, two subscriptions. `toggle` never changes, so that one never
causes a render; `ids` does, and this page needs it to.

### Verify

1. Save three products. The header badge says **3** — and it isn't
   hardcoded any more (`cartCount` is `0` for now; that's Lab 2). Open
   `/products/1`: the Save button still works — it reads the store now
   (Lab 2 Step E finishes that page).
2. **Highlight updates** on: click a heart. The header badge flashes, and
   `ProductsPage` with its children — it selected `ids`, and a parent's
   re-render still re-renders its children (React's rule, not the store's;
   Demo 18 is where that gets fixed). `RootLayout` does **not** flash: it no
   longer knows the wishlist exists.
3. **Demo 12's twelve-card experiment, with a selector.** In `ProductCard`,
   temporarily add `const saved = useWishlistStore(selectIsSaved(product.id));`
   and drop `saved` from the props; in `ProductsPage` stop passing `wishlist`
   to the grid. Click one heart: **one card flashes** — that card subscribed
   to one boolean. With `useWishlist()` in the same spot last time, all
   twelve did. Put it back (the grid keeps the prop; the point was the
   comparison).
4. In the console:
   ```ts
   const { useWishlistStore } = await import('/src/store/wishlist.ts');
   useWishlistStore.getState().ids;          // [1, 5, 9] — no component, no hook
   useWishlistStore.getState().toggle(2);    // the heart on product 2 fills in
   ```
   Lab 4 is built on that second line — and it is what Demo 12's toasts
   could not do from a router action.
5. `npm run typecheck`: clean. Nothing imports `WishlistContext` any more —
   the provider, the hook and the throw were plumbing, and they're gone.

### Watch out

**`const state = useWishlistStore()` — no selector.** It works, and it
subscribes the component to *everything*. Add a cart action later and this
component re-renders for it. Always select; select the smallest thing.

**Defining the store inside a component.** `create()` builds a new store on
every render — state that resets itself. Stores are module-level, like the
router.

**Mutating in `set`.** `set((s) => { s.ids.push(id); return s; })` returns
the *same* object; subscribers compare by reference and see no change. Return
a new array, as `toggle` does. (The `immer` middleware exists for deep
shapes; the cart in Lab 2 doesn't need it.)

### In the real world

The table under Concept is the interview answer. Most "state management"
pain comes from putting *server* state in a client store — a cache without
invalidation, staleness bugs, a hand-written `loading` flag per entity. The
loader owns server state here; if you're not using a router with loaders, a
server-state library (TanStack Query) does the same job. The store is for the
thin layer that's genuinely the client's.

---

## Lab 2 — The cart: actions, derived values, and a drawer (25 min)

### Problem

There is no cart. The badge is a literal, the buttons are decoration, and a
cart is the textbook case for a store: added on the list page, added on the
detail page, counted in the header, edited in a drawer that belongs to no page.

### Concept

**One testable function, two homes.** The cart's rules already exist:
`cartLinesReducer` in `src/lib/cartMath.ts` (Demo 12 Lab 1) — add merges,
zero removes, pure, exhaustively typed, proven from the console. A store
doesn't replace a reducer; it *hosts* one. Each action below is
`set((state) => ({ lines: cartLinesReducer(state.lines, action) }))`: the
store holds the lines and notifies subscribers, the reducer decides what the
next lines are. `useReducer` could run the same function; so could a test.

**A line is a snapshot, not a reference.** Store `{ productId, title, price,
thumbnail, qty }`, not `Product`. If the catalogue changes — a price, a
deleted product — the cart still renders. (A real checkout re-prices on the
server anyway; Lab 4.)

**Derived values are selectors.** `count` and `subtotal` are *functions of
lines*. Store them too and you have two sources of truth that will disagree
the first time an action forgets to update one. `selectCount(state)` is a
plain function: testable without React, reusable in the header and the
drawer, and — because it returns a number — a cheap subscription.

**One `set`, one render.** `add` both appends a line and opens the drawer.
Two `set` calls would be two notifications; return one object.

**UI state can live in a store — when it's cross-cutting.** The drawer's
`isOpen` is set by the header (open), the drawer (close) and `add` (open).
Three components, no common parent that isn't the layout. That's the test.
The grid density, by contrast, is one page's business and stays in
`useState`.

**Selecting an object needs `useShallow`.** `useCartStore((s) => ({ setQty:
s.setQty, remove: s.remove }))` builds a *new object* on every call. Zustand
compares by reference, sees a change every time, and React 19 warns *"The
result of getSnapshot should be cached"* — then re-renders in a loop.
`useShallow` compares the object's *keys* instead. Or select each value
separately, which is what the rest of this lab does.

### Steps

**A. `src/store/cart.ts` — `TODO(lab-2.1)`**

Replace the file:

```ts
import { create } from 'zustand';
import { cartLinesReducer, lineCount, subtotal, type CartLineProduct } from '../lib/cartMath';
import type { CartLine } from '../types';

interface CartState {
  lines: CartLine[];
  /** UI state that BELONGS to the cart — the drawer — set from three different components. */
  isOpen: boolean;

  add: (product: CartLineProduct, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  lines: [],
  isOpen: false,

  // The RULES are cartLinesReducer (Demo 12, src/lib/cartMath.ts) — one pure, testable function.
  // The store's job is to hold the lines, hand them to the reducer and notify subscribers.
  // Same function, two homes: useReducer could run it; so can this.
  add: (product, qty = 1) =>
    set((state) => ({
      lines: cartLinesReducer(state.lines, { type: 'add', product, qty }),
      isOpen: true, // adding opens the drawer — ONE set, one render
    })),
  setQty: (productId, qty) => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'setQty', productId, qty }) })),
  remove: (productId) => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'remove', productId }) })),
  clear: () => set((state) => ({ lines: cartLinesReducer(state.lines, { type: 'clear' }) })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

// --- Derived values live in SELECTORS, not in state. Storing `count` too would be two sources of truth. ---

export const selectCount = (state: CartState) => lineCount(state.lines);
export const selectSubtotal = (state: CartState) => subtotal(state.lines);
```

`CartLineProduct` — `Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>`,
from `cartMath.ts` — is the contract: `add` takes anything that has those
four fields — a `Product` qualifies — and promises to read nothing else. And
notice what is *not* in this file: the merge rule, the zero-removes rule, the
snapshot. They stayed in the reducer, where Demo 12 put them, and where
Demo 20's tests will find them without a store or a renderer.

`CartLine` is already in **`src/types.ts`** — Demo 12 Lab 1 added it under
the `client state` divider.

**B. `src/components/ProductCard.tsx` and `ProductGrid.tsx` — `TODO(lab-2.2)`**

The card stays dumb. It reports the product; the page decides what "add"
means:

```tsx
interface ProductCardProps {
  // …
  /** The card stays dumb: it reports the product, the page decides what "add" means. */
  onAddToCart?: (product: Product) => void;
  // …
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onAddToCart, onEdit, onDelete, busy = false }: ProductCardProps) {
  // …
  <Button size="sm" disabled={isOutOfStock || busy} variant={isOutOfStock ? 'secondary' : 'primary'} onClick={() => onAddToCart?.(product)}>
    {isOutOfStock ? 'Sold out' : 'Add to cart'}
  </Button>
```

`ProductGrid` gains the same optional prop and passes it to every card.
Then, in `ProductsPage`, one selector and one prop:

```tsx
import { useCartStore } from '../store/cart';
// …
  const addToCart = useCartStore((s) => s.add);
// …
      <ProductGrid … onToggleSave={toggleWishlist} onAddToCart={addToCart} … />
```

**C. `src/components/CartDrawer.tsx` — `TODO(lab-2.3)`**

Replace the file. Nobody passes it props; it *is* a view of the store:

```tsx
import { Badge, Button, ButtonGroup, Image, ListGroup, Offcanvas } from 'react-bootstrap';
import { Dash, Plus, Trash } from 'react-bootstrap-icons';
import { Link } from 'react-router';
import { useShallow } from 'zustand/shallow';
import { selectCount, selectSubtotal, useCartStore } from '../store/cart';
import { formatPrice } from '../lib/format';

/**
 * Rendered ONCE, in the layout. Nobody passes it props: it reads the cart
 * store directly, and the header's button opens it through the same store.
 */
export function CartDrawer() {
  // One selector per value: each subscription re-renders only when ITS slice changes.
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  // Selecting an OBJECT needs useShallow — otherwise `{…}` is a new reference every time and the component re-renders on every store change.
  const { setQty, remove, close } = useCartStore(useShallow((s) => ({ setQty: s.setQty, remove: s.remove, close: s.close })));

  return (
    <Offcanvas show={isOpen} onHide={close} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">
          Your cart{' '}
          {count > 0 && (
            <Badge bg="primary" pill>
              {count}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        {lines.length === 0 ? (
          <p className="text-muted">Your cart is empty. Add something from the catalogue.</p>
        ) : (
          <ListGroup variant="flush" className="mb-3">
            {lines.map((line) => (
              <ListGroup.Item key={line.productId} className="d-flex align-items-center gap-3 px-0">
                <Image src={line.thumbnail} width={48} height={48} className="object-fit-contain bg-body-secondary rounded" alt="" />
                <div className="flex-grow-1 min-w-0">
                  <Link to={`/products/${line.productId}`} onClick={close} className="text-decoration-none text-reset fw-semibold small d-block text-truncate">
                    {line.title}
                  </Link>
                  <div className="small text-muted">
                    {formatPrice(line.price)} × {line.qty}
                  </div>
                </div>
                <ButtonGroup size="sm" aria-label={`Quantity of ${line.title}`}>
                  <Button variant="outline-secondary" aria-label="Decrease quantity" onClick={() => setQty(line.productId, line.qty - 1)}>
                    <Dash />
                  </Button>
                  <Button variant="outline-secondary" disabled className="px-3">
                    {line.qty}
                  </Button>
                  <Button variant="outline-secondary" aria-label="Increase quantity" onClick={() => setQty(line.productId, line.qty + 1)}>
                    <Plus />
                  </Button>
                </ButtonGroup>
                <Button size="sm" variant="outline-danger" aria-label={`Remove ${line.title}`} onClick={() => remove(line.productId)}>
                  <Trash />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="mt-auto border-top pt-3">
          <div className="d-flex justify-content-between fw-semibold mb-3">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {/* Lab 4 puts the Checkout button here */}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
```

`setQty(id, qty - 1)` at quantity 1 removes the line — the *store* decided
that (`qty <= 0` → filter), not the drawer. The drawer has no rules in it.

**D. Open it — `TODO(lab-2.4)` in `SiteHeader.tsx` and `RootLayout.tsx`**

The header's cart button opens the drawer, and its badge goes live:

```tsx
import { selectCount, useCartStore } from '../store/cart';
// …
  const cartCount = useCartStore(selectCount);        // replaces the `0` from Lab 1
  const openCart = useCartStore((s) => s.open);
// …
  <Button variant="outline-light" size="sm" className="position-relative" aria-label={`Cart, ${cartCount} items`} onClick={openCart}>
```

And the layout renders the drawer once, next to `<ScrollRestoration />`:

```tsx
import { CartDrawer } from '../components/CartDrawer';
// …
      {/* Rendered once, here; opened from the header, filled from the product pages — all through the store. */}
      <CartDrawer />

      <ScrollRestoration />
```

**E. `src/routes/ProductDetailPage.tsx` — `TODO(lab-2.5)`**

Demo 12 gave this page its Save button through `useWishlist()`. Swap the
provider for the store, and add the cart button beside it:

```tsx
import { Badge, Button, Card, Col, Ratio, Row, Stack } from 'react-bootstrap';
import { ArrowLeft, Cart3, Heart, HeartFill } from 'react-bootstrap-icons';
// …
import { useCartStore } from '../store/cart';
import { selectIsSaved, useWishlistStore } from '../store/wishlist';   // replaces the useWishlist import
// …
  const product = useLoaderData<typeof productDetailLoader>();

  // Demo 12's WishlistProvider gave this page its Save button. The store keeps it — and subscribes
  // to ONE boolean: this product's saved flag, not the whole list.
  const saved = useWishlistStore(selectIsSaved(product.id));
  const toggleSave = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
// …
                <p className="mb-0">{product.description}</p>

                <div className="d-flex gap-2">
                  <Button disabled={product.stock === 0} onClick={() => addToCart(product)}>
                    <Cart3 className="me-1" />
                    {product.stock === 0 ? 'Sold out' : 'Add to cart'}
                  </Button>
                  <Button variant={saved ? 'danger' : 'outline-danger'} aria-pressed={saved} onClick={() => toggleSave(product.id)}>
                    {saved ? <HeartFill className="me-1" /> : <Heart className="me-1" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
```

`toggle(product.id)` becomes `toggleSave(product.id)` in the button, and the
`const { isSaved, toggle } = useWishlist();` line goes.

`selectIsSaved(product.id)` makes a new selector function each render.
That's fine: it returns a **boolean**, and Zustand compares results, not
selectors. It's *objects* that need `useShallow`.

### Verify

1. **Add to cart** on a card: the drawer slides in with the line, the badge
   says **1**. Add the same product again: quantity 2, still one line.
2. `−` to zero: the line disappears. Subtotal tracks. Close, reopen from the
   header icon.
3. Open `/products/1`: **Save** fills the heart; go back to the list — the
   card's heart is filled. Same store, two pages, no props.
4. **Highlight updates** on, click `+` in the drawer: the drawer and the
   header badge flash. `ProductsPage` behind it does not — it selected
   `s.add`, which didn't change.
5. Break it on purpose: in `CartDrawer`, delete `useShallow(` and its closing
   `)`. Console: *"The result of getSnapshot should be cached to avoid an
   infinite loop"*, and the tab freezes. Put it back. That's the Watch out.

### Watch out

**Storing `count` in state.** It's tempting because the header wants it.
Every action then has to maintain it, and the first one that doesn't is a bug
the user sees in the badge. Derive it.

**Object selectors without `useShallow`.** You just saw it. Two fixes: wrap
in `useShallow`, or split into separate selectors. Prefer splitting for two
or three values; `useShallow` when it's genuinely many.

**Business rules in the drawer.** `if (qty === 0) remove(…)` in the click
handler is a rule the detail page would have to repeat. Rules go in actions.

### Challenge (2 min)

Add a `maxQty` of 10 to `setQty`, and make `add` respect it too. Which file
did you open? (`cartMath.ts` — and zero components changed. The store didn't
either.)

### In the real world

Zustand recommends **one store per domain** for small apps, and **slices** for
large ones — `createCartSlice`, `createWishlistSlice` combined into one store.
The selectors don't change either way. Also real: the **`devtools`
middleware** (`devtools(persist(…))`) shows every action in the Redux
DevTools extension with a name — worth wiring once the store has more than a
handful of actions.

---

## Lab 3 — Persist: what survives a reload (15 min)

### Problem

Reload. Empty cart, empty wishlist. A shopper who comes back tomorrow starts
over.

### Concept

**`persist` is a middleware.** It wraps the store, writes state to storage
after every `set`, and reads it back on load. `localStorage` by default;
`createJSONStorage(() => sessionStorage)` or anything with
`getItem`/`setItem` otherwise.

**`partialize` chooses what to save.** `isOpen` is UI. A reload that reopens
the drawer would be a bug. Save the *data*; let the UI start fresh.

**`version` is insurance.** Next month `CartLine` gains a field. Users who
still have last month's JSON in `localStorage` load it into this month's
code. `version` + `migrate` is how you rename or backfill instead of
crashing — or, at minimum, how the old data is *dropped* rather than
half-loaded.

**Hydration is synchronous for `localStorage`,** so the first render already
has the data. For async storage (IndexedDB, React Native) it isn't, and you'd
use `onRehydrateStorage` / `useStore.persist.hasHydrated()` to hold a
skeleton. Worth knowing; not needed here.

### Steps

**A. `src/store/cart.ts` — `TODO(lab-3.1)`**

Wrap the state function in `persist`, and give it a key:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// …
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      // …everything from Lab 2, unchanged…
    }),
    {
      name: 'shopscope.cart',
      /** Persist the DATA, not the UI: a reload should not reopen the drawer. */
      partialize: (state) => ({ lines: state.lines }),
      /** Bump this when CartLine changes shape, and add a `migrate` — never let an old shape crash a new build. */
      version: 1,
    },
  ),
);
```

Only the wrapper is new. This is why Lab 1 insisted on `create<CartState>()(…)`
— the state type flows into `persist` and out again, and `partialize`'s
parameter is typed as `CartState` without you saying so.

**B. `src/store/wishlist.ts` — `TODO(lab-3.2)`**

Same shape, nothing to leave out:

```ts
import { persist } from 'zustand/middleware';
// …
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      // …unchanged…
    }),
    { name: 'shopscope.wishlist' }, // the localStorage key
  ),
);
```

### Verify

1. Add two products, save one, **reload.** Both back. Badges correct.
   The drawer is **closed** — `isOpen` was never saved.
2. DevTools → **Application → Local Storage**. Three ShopScope entries now:
   `shopscope.accessToken` and friends from Demo 11, plus
   `shopscope.cart` → `{"state":{"lines":[…]},"version":1}` and
   `shopscope.wishlist`. Note `version` in the JSON. Note no `isOpen`.
3. Edit the JSON by hand — change a `qty` — and reload. The store believes
   storage. Which is the point of the next Watch out.

### Watch out

**Persisting the UI.** Drop `partialize` and reload with the drawer open:
it's open again. Small here; a persisted "modal open" flag is a support
ticket.

**Trusting persisted data as if it were yours.** It's a string in the user's
browser. They can edit it; an older build wrote it. Never persist anything
the server should decide (a price is fine to *display* from the cart;
checkout re-prices). And never persist the *server's* data as a cache —
that's what loaders are for.

**Changing the shape without bumping `version`.** Old JSON, new code,
`undefined` where a field should be. Bump the version; write `migrate`.

### In the real world

A migration looks like this — `persistedState` is `unknown` because it's
whatever an old build wrote:

```ts
version: 2,
migrate: (persistedState, version) => {
  const old = persistedState as { lines?: Array<Omit<CartLine, 'thumbnail'>> };
  if (version < 2) {
    // v1 lines had no thumbnail: backfill, don't discard the user's cart.
    return { lines: (old.lines ?? []).map((line) => ({ ...line, thumbnail: '' })) };
  }
  return persistedState as { lines: CartLine[] };
},
```

Cross-tab sync is *not* built in: two tabs each hold their own copy and the
last write wins. Zustand's docs show a `storage` event listener for that;
most apps don't need it.

---

## Lab 4 — The store outside React: checkout (25 min)

### Problem

Checkout has to send the cart to the server. That belongs in a **router
action** (Demo 10: mutations go through actions). But an action is a plain
function — no hooks. How does it read the cart?

### Concept

**A store is an object first, a hook second.** `useCartStore` is a function
you call in components, and it is *also* an object with `getState()`,
`setState()` and `subscribe()`. Nothing about it needs React. Loaders,
actions, interceptors, tests — all can read and write it.

```ts
useCartStore.getState().lines;        // read, right now
useCartStore.getState().clear();      // run an action
useCartStore.setState({ isOpen: true });          // write directly (rare — prefer actions)
const unsubscribe = useCartStore.subscribe((state, previous) => { /* every change */ });
```

**An action with no component.** A route can have an `action` and nothing
else. The drawer's `fetcher.Form` posts to it; the action runs; loaders
revalidate; no navigation. Put it under `/account` and the **middleware from
Demo 11 guards it** — a signed-out submission is redirected to `/login`
before the action's first line.

**The form sends nothing.** The cart is in the store; the action reads it
there. Compare with Demo 10's product form, where the *values* were the
form's. Here the values are the client's state, and the POST just says "now".

**DummyJSON simulates `POST /carts/add`.** It computes totals and returns a
cart with a new id; nothing persists. The success message says so, and the
*Carts* page won't show it.

### Steps

**A. `src/api/endpoints.ts` and `src/api/services/carts.ts` — `TODO(lab-4.1)`**

```ts
  carts: {
    create: () => '/carts/add',
  },
```

```ts
import { api } from '../client';
import { endpoints } from '../endpoints';
import type { Cart, CartItemInput } from '../../types';

/**
 * POST /carts/add — DummyJSON simulates it: it computes totals and returns a
 * cart with a new id, and persists nothing. No `signal`: a mutation is never
 * cancelled on unmount — the server may already have committed it.
 */
export async function createCart(userId: number, products: CartItemInput[]): Promise<Cart> {
  const { data } = await api.post<Cart>(endpoints.carts.create(), { userId, products });
  return data;
}
```

And in `types.ts`, next to `CartLine`:

```ts
/** One item in a POST /carts/add body. */
export interface CartItemInput {
  id: number;
  quantity: number;
}
```

**B. `src/routes/account/checkout.ts` — `TODO(lab-4.2)`**

```ts
import { data, type ActionFunctionArgs } from 'react-router';
import { createCart } from '../../api/services/carts';
import { ApiError } from '../../lib/ApiError';
import { useCartStore } from '../../store/cart';
import { userContext } from '../middleware';
import type { Cart } from '../../types';

/** A discriminated union: `ok` tells the drawer which fields exist. */
export type CheckoutResult = { ok: true; cart: Cart } | { ok: false; error: string };

/**
 * An action with NO component — the app's checkout "endpoint". It sits under
 * /account, so authMiddleware runs first: a signed-out fetcher submission is
 * redirected to /login before this line ever executes.
 */
export async function checkoutAction({ context }: ActionFunctionArgs): Promise<CheckoutResult> {
  const user = context.get(userContext);
  if (!user) throw data({ message: 'Sign in to check out.' }, { status: 401 }); // a wiring bug — the middleware should have redirected

  // The store OUTSIDE React: getState() is a plain function call — no hook, no component, no props.
  const { lines, clear } = useCartStore.getState();
  if (lines.length === 0) return { ok: false, error: 'Your cart is empty.' };

  try {
    const cart = await createCart(
      user.id,
      lines.map((line) => ({ id: line.productId, quantity: line.qty })),
    );
    clear(); // a store action, called from a router action — every subscribed component updates
    return { ok: true, cart };
  } catch (error) {
    return { ok: false, error: ApiError.from(error).message };
  }
}
```

`useCartStore.getState()` — the lint rule for hooks doesn't complain, and it
shouldn't: `getState` is a method on an object. The `use` prefix is a
convention about *how it's called in components*, not a restriction on the
object.

**C. `src/router.tsx` — `TODO(lab-4.3)`**

Inside the `account` children, after `carts`:

```tsx
import { checkoutAction } from './routes/account/checkout';
// …
          // Action only, no Component: the cart drawer's fetcher posts here. The middleware above guards it too.
          { path: 'checkout', action: checkoutAction },
```

**D. `src/components/CartDrawer.tsx` — `TODO(lab-4.4)`**

The footer gets its button. Signed in: a fetcher form. Signed out: a link,
because the UX half of authorisation is "don't show doors people can't open"
(Demo 11) — the middleware is still the lock:

```tsx
import { Link, useFetcher, useRouteLoaderData } from 'react-router';
import type { checkoutAction } from '../routes/account/checkout';
import type { rootLoader } from '../routes/RootLayout';
// …
  const fetcher = useFetcher<typeof checkoutAction>();
  const user = useRouteLoaderData<typeof rootLoader>('root')?.user ?? null;
  const submitting = fetcher.state !== 'idle';
// …at the top of <Offcanvas.Body>:
        {fetcher.data?.ok === true && fetcher.state === 'idle' && (
          <Alert variant="success">
            Order placed — cart #{fetcher.data.cart.id}, {fetcher.data.cart.totalQuantity} items,{' '}
            {formatPrice(fetcher.data.cart.discountedTotal)}. DummyJSON simulates writes, so it won't appear under
            Account › Carts.
          </Alert>
        )}
        {fetcher.data?.ok === false && fetcher.state === 'idle' && <Alert variant="danger">{fetcher.data.error}</Alert>}
// …replacing the Lab 4 comment in the footer:
          {user ? (
            // No fields: the action reads the cart from the STORE. The /account middleware guards it.
            <fetcher.Form method="post" action="/account/checkout">
              <Button type="submit" className="w-100" disabled={lines.length === 0 || submitting}>
                {submitting ? 'Placing order…' : 'Checkout'}
              </Button>
            </fetcher.Form>
          ) : (
            <Link to="/login?redirectTo=/products" className="btn btn-primary w-100" onClick={close}>
              Sign in to check out
            </Link>
          )}
```

`fetcher.data?.ok === true` narrows the union: inside that branch
`fetcher.data.cart` exists and the compiler knows it. `Alert` joins the
react-bootstrap import.

**E. `src/store/cart.ts` — `TODO(lab-4.5)`**

`subscribe`, the other half of "outside React" — a dev-only log of every
cart change, at the bottom of the file:

```ts
import { env } from '../config/env';
import { logger } from '../config/logger';
import { formatPrice } from '../lib/format';
// …
// --- The store outside React: subscribe() is a plain function — no component, no hook. ---
if (env.isDev) {
  useCartStore.subscribe((state, previous) => {
    if (state.lines !== previous.lines) {
      logger.debug(`[cart] ${selectCount(state)} items · ${formatPrice(selectSubtotal(state))}`);
    }
  });
}
```

`state.lines !== previous.lines` — the reference check again. Opening the
drawer changes `isOpen`, not `lines`, and logs nothing.

### Verify

1. Signed out, cart with two lines: the footer says **Sign in to check out**.
   Click it → login → back on `/products` with the cart intact (persisted).
2. **Checkout.** Network: `POST /carts/add` with `{ userId, products: [{ id,
   quantity }] }`; the response has a fresh `id` and `discountedTotal`. The
   drawer shows the success alert with those numbers; the lines are gone; the
   header badge is **0**; the console says `[cart] 0 items · $0.00`.
3. The lock, not the door. Sign out, then temporarily remove the `user ?`
   check in the drawer so the **Checkout** button shows for everyone. Click
   it. You land on `/login?redirectTo=…` — `authMiddleware` redirected the
   fetcher's submission before `checkoutAction` ran a single line. Put the
   check back. (A `fetch('/account/checkout')` from the console would *not*
   test this: that hits the dev server, not the router.)
4. Open **Account › Carts.** The new cart isn't there. Simulated, as the
   alert said.

### Watch out

**Calling the hook in the action.** `useCartStore((s) => s.lines)` inside
`checkoutAction` is a hook call outside a component — `rules-of-hooks` flags
it and React would throw. `getState()` is the non-React door.

**Passing `signal` to `createCart`.** Cancel a POST on navigation and the
server may still have created the cart — with the client believing it
didn't. Mutations are never cancelled (Demo 8).

**Reading the store in a *loader* for server-ish data.** A loader that
returns `useCartStore.getState().lines` has made the store a cache and the
loader a lie. Loaders load server state; components read client state
directly.

### Challenge (2 min)

A **recently viewed** store — `ids: number[]`, newest first, max eight — and
one line in `productDetailLoader`: `useRecentStore.getState().push(product.id)`.
Render the list in the drawer's empty state. No component wrote to the store,
and no component needed to.

### In the real world

The "store outside React" property is what makes Zustand fit an app like
this one. The API layer stays React-free; an interceptor could clear the cart
on a 401 the same way `tokenStore.clear()` fires `AUTH_CHANGED`. Tests call
`useCartStore.setState({ lines: [] })` in `beforeEach` and assert on
`getState()` with no renderer. And the moment someone asks for Redux — action
names in DevTools, time-travel, strict unidirectional flow — the honest
answer is `devtools` middleware first, and Redux Toolkit only if a team
actually wants its ceremony.

---

## Wrap-up — what you can now do

- [x] Name the five kinds of state in the app and say where each one lives — and why only one belongs in a store
- [x] Create a typed store with `create<State>()(…)`, keep actions inside it, and select the smallest slice
- [x] Explain what a selector buys over Context, and show it with render highlighting
- [x] Keep derived values as selectors, and use `useShallow` when an object selector is unavoidable
- [x] Persist the data and not the UI with `partialize`, and defend `version`
- [x] Read and write the store from a router action with `getState()`, and watch it with `subscribe()`
- [x] Put a mutation behind an action-only route that the middleware already guards

## Next demo

**Demo 14 — Advanced HTTP & Shipping.** Optimistic delete that rolls back
by itself, an upload with a progress bar behind a feature flag, retries with
backoff for the requests that deserve them, lazy-loaded routes, and what a
static host needs to serve a routed app.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `The result of getSnapshot should be cached to avoid an infinite loop` | A selector returns a new object/array each call. Wrap it in `useShallow`, or select the values separately. |
| Header badge doesn't update | The header still takes `cartCount` as a prop, or selects the whole store instead of `selectCount`. |
| `useWishlist() must be called inside <WishlistProvider>` | You deleted the provider in `main.tsx` but a component still calls Demo 12's hook — `SiteHeader`, `ProductsPage` or `ProductDetailPage`. Switch it to the store. |
| `Cannot find module '../context/WishlistContext'` | You deleted the file before switching every import. `useWishlistStore` replaces it in three files. |
| `Property 'cartCount' does not exist on type 'SiteHeaderProps'` | `RootLayout` still passes `cartCount={3}`. Delete the prop — the header selects `selectCount` now. |
| Wishlist resets on every render | `create()` is inside a component. Move it to module scope. |
| `Property 'persist' does not exist` / state type is `unknown` inside `persist` | You wrote `create<State>(…)` instead of `create<State>()(…)`. The empty call matters. |
| Drawer reopens after a reload | `partialize` is missing — `isOpen` was persisted. |
| Old cart shape crashes the new build | Bump `version` and write `migrate`; or at least bump `version` so the old JSON is dropped. |
| `React Hook "useCartStore" is called in function "checkoutAction"` | You called the hook in the action. Use `useCartStore.getState()`. |
| Checkout button does nothing when signed out | Expected — it's a link to `/login`. To test the middleware, see Lab 4 Verify step 3. |
| `POST /account/checkout` 404s in the Network tab | The `{ path: 'checkout', action }` route is missing under `account`, or the drawer's `action` path is wrong. |
| Cart doesn't appear under Account › Carts after checkout | DummyJSON simulates writes. The response is real; persistence isn't. |
| `Type 'Product' is not assignable to parameter of type 'Pick<…>'` | `add` wants `id`, `title`, `price`, `thumbnail`. A `Product` has them — check you're passing the product, not the id. |
