# Module 9 — Reducers & Context

**Study notes** · ~3 hours

> **Goal.** Two tools for when `useState` and props stop scaling. A **reducer**
> consolidates scattered update logic into one testable pure function.
> **Context** delivers a value to a whole subtree without threading it through
> every component in between. Together they are how most React apps manage
> app-level state without a library — and knowing their costs is how you decide
> whether you need one.

**Prerequisites:** [Module 7](../07-state-and-events/) and
[Module 8](../08-state-structure/) in full.
[Module 1](../01-javascript-foundations/) §22 (purity, referential identity).

---

## Contents

1. [When `useState` stops scaling](#1-when-usestate-stops-scaling)
2. [`useReducer`](#2-usereducer)
3. [Actions](#3-actions)
4. [Reducers must be pure](#4-reducers-must-be-pure)
5. [Migrating `useState` → `useReducer`](#5-migrating-usestate--usereducer)
6. [`useState` vs `useReducer`](#6-usestate-vs-usereducer)
7. [Reducers are trivially testable](#7-reducers-are-trivially-testable)
8. [Reducers as state machines](#8-reducers-as-state-machines)
9. [The problem Context solves](#9-the-problem-context-solves)
10. [Using Context](#10-using-context)
11. [The default value](#11-the-default-value)
12. [Context re-render behaviour](#12-context-re-render-behaviour)
13. [Splitting contexts](#13-splitting-contexts)
14. [Reducer + Context: the standard pattern](#14-reducer--context-the-standard-pattern)
15. [A custom hook as the public API](#15-a-custom-hook-as-the-public-api)
16. [What Context is not for](#16-what-context-is-not-for)
17. [When to reach for a library](#17-when-to-reach-for-a-library)
18. [Self-check](#18-self-check)
19. [References](#19-references)

---

## 1. When `useState` stops scaling

Here is a filter panel that started small:

```jsx
function ProductBrowser({ products }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);

  function handleQueryChange(value) {
    setQuery(value);
    setPage(1);                       // must reset the page
  }
  function handleCategoryChange(value) {
    setCategory(value);
    setPage(1);                       // …here too
    setMinPrice(0);                   // …and clear the price filter
    setMaxPrice(100000);
  }
  function handleClearAll() {
    setQuery(''); setCategory(null); setMinPrice(0);
    setMaxPrice(100000); setInStockOnly(false); setSortBy('name'); setPage(1);
  }
  …
}
```

Nothing here is *wrong*, and it is already hard to maintain. The symptoms:

- **The rules are scattered.** "Changing a filter resets the page" is enforced
  in four handlers, and the fifth one someone adds next month will forget it.
- **Related state is not grouped.** Seven independent variables that are really
  one thing: "the current query".
- **Nothing is testable in isolation.** To verify "changing category clears the
  price range" you must render a component.
- **Impossible states are representable.** `minPrice` can exceed `maxPrice`.

A reducer fixes all four by moving the update rules into one function, outside
the component.

---

## 2. `useReducer`

```jsx
import { useReducer } from 'react';

const initialState = {
  query: '', category: null, minPrice: 0, maxPrice: 100000,
  inStockOnly: false, sortBy: 'name', page: 1,
};

function filtersReducer(state, action) {
  switch (action.type) {
    case 'query_changed':
      return { ...state, query: action.query, page: 1 };
    case 'category_changed':
      return { ...state, category: action.category, minPrice: 0, maxPrice: 100000, page: 1 };
    case 'price_changed':
      return { ...state, minPrice: action.min, maxPrice: action.max, page: 1 };
    case 'stock_toggled':
      return { ...state, inStockOnly: !state.inStockOnly, page: 1 };
    case 'sort_changed':
      return { ...state, sortBy: action.sortBy };
    case 'page_changed':
      return { ...state, page: action.page };
    case 'cleared':
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function ProductBrowser({ products }) {
  const [filters, dispatch] = useReducer(filtersReducer, initialState);

  return (
    <>
      <input
        value={filters.query}
        onChange={(e) => dispatch({ type: 'query_changed', query: e.target.value })}
      />
      <button onClick={() => dispatch({ type: 'cleared' })}>Clear all</button>
      …
    </>
  );
}
```

Read off what changed:

- **"Changing a filter resets the page" now lives in one file**, visible as a
  pattern you can audit at a glance.
- The component is a **description of the UI plus dispatches** — no update logic
  at all.
- `filtersReducer` is a plain function. No React, no rendering, no mocking
  required to test it.

### The signature

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
const [state, dispatch] = useReducer(reducer, initialArg, init);   // lazy init
```

| | |
|---|---|
| `reducer(state, action)` | a pure function returning the **next** state |
| `initialState` | the state for the first render |
| `state` | the current state — a snapshot, exactly like `useState` |
| `dispatch(action)` | send an action; React runs the reducer and re-renders |
| `init` (optional) | called as `init(initialArg)` to compute the initial state lazily |

`dispatch` is **stable** — React guarantees the same function identity for the
life of the component. That matters: you can pass it through Context or list it
in an effect's dependencies without causing re-runs
([Module 12](../12-effects/)).

📖 [react.dev — `useReducer`](https://react.dev/reference/react/useReducer)

---

## 3. Actions

An action is any value describing **what happened**. By convention it is an
object with a `type` string plus whatever data that event carries:

```jsx
dispatch({ type: 'added', product });
dispatch({ type: 'removed', id: 42 });
dispatch({ type: 'quantity_changed', id: 42, quantity: 3 });
dispatch({ type: 'cleared' });
```

Conventions worth adopting:

**Name actions after events, not setters.** `'query_changed'`, not
`'set_query'`. The difference is not cosmetic — a setter name pushes you back
toward one-field-at-a-time thinking, while an event name invites the reducer to
decide *all* the consequences (which is the whole point).

**Keep the payload flat and minimal.** Everything the reducer needs, nothing it
does not.

**Throw on an unknown type.** A typo'd action type that silently returns the
current state is a bug you will spend an afternoon on:

```jsx
default:
  throw new Error(`Unknown action: ${action.type}`);
```

> **`useReducer` is not Redux.** No store, no middleware, no `combineReducers`,
> no provider required, no devtools. It is one hook, local to a component. The
> shared vocabulary (reducer, action, dispatch) is where the similarity ends —
> which is worth saying because half the material online conflates them.

---

## 4. Reducers must be pure

A reducer takes the current state and an action, and returns the next state.
That is all it may do.

```jsx
// ✗ every one of these is wrong
function badReducer(state, action) {
  state.items.push(action.item);          // mutation
  fetch('/api/track', { … });             // I/O
  localStorage.setItem('cart', '…');      // side effect
  const id = crypto.randomUUID();         // non-deterministic
  return { ...state, updatedAt: Date.now() };  // non-deterministic
}

// ✓
function goodReducer(state, action) {
  switch (action.type) {
    case 'added':
      return { ...state, items: [...state.items, action.item] };
    default:
      return state;
  }
}
```

Two things force this. React may call your reducer **twice** in Strict Mode to
surface impurity, so a side effect inside it happens twice. And a reducer's
value is that it is a pure function of its inputs — the moment it reads the clock
or the network, it stops being testable and stops being predictable.

**Where the impure parts go:**

| Impure thing | Where it belongs |
|---|---|
| Generating an id or timestamp | the event handler, passed **in** the action |
| Fetching, tracking, logging | the event handler, or an effect |
| Persisting to storage | an effect watching the state |

```jsx
// ✓ the non-deterministic values are computed in the handler
function handleAdd(name) {
  dispatch({
    type: 'added',
    item: { id: crypto.randomUUID(), name, addedAt: Date.now() },
  });
}
```

Same rule for the state itself: **never mutate `state`** inside a reducer. All of
[Module 8](../08-state-structure/)'s update patterns apply unchanged — spread the
path you are editing, `map` over arrays, `filter` to remove.

📖 [react.dev — Writing reducers well](https://react.dev/learn/extracting-state-logic-into-a-reducer#writing-reducers-well)

---

## 5. Migrating `useState` → `useReducer`

Three mechanical steps.

**Step 1 — turn setters into dispatches.** Look at each handler and ask "what
happened?", not "what should change?":

```jsx
// before
setQuery(value);
setPage(1);

// after
dispatch({ type: 'query_changed', query: value });
```

**Step 2 — write the reducer.** One `case` per action, returning new state:

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'query_changed':
      return { ...state, query: action.query, page: 1 };
    …
  }
}
```

**Step 3 — swap the hook.**

```jsx
// before
const [query, setQuery] = useState('');
const [page, setPage] = useState(1);

// after
const [state, dispatch] = useReducer(reducer, initialState);
// then read state.query, state.page
```

A worked example — a cart, before and after:

```jsx
// ── before ────────────────────────────────────────────
const [items, setItems] = useState([]);
const [couponCode, setCouponCode] = useState(null);
const [isOpen, setIsOpen] = useState(false);

function addItem(product) {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    setItems(items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)));
  } else {
    setItems([...items, { id: product.id, name: product.name, price: product.price, qty: 1 }]);
  }
  setIsOpen(true);
}

function removeItem(id) {
  const next = items.filter((i) => i.id !== id);
  setItems(next);
  if (next.length === 0) setCouponCode(null);      // easy to forget
}
```

```jsx
// ── after ─────────────────────────────────────────────
const initialCart = { items: [], couponCode: null, isOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'item_added': {
      const existing = state.items.find((i) => i.id === action.product.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...state.items, {
            id: action.product.id,
            name: action.product.name,
            price: action.product.price,
            qty: 1,
          }];
      return { ...state, items, isOpen: true };
    }
    case 'item_removed': {
      const items = state.items.filter((i) => i.id !== action.id);
      return { ...state, items, couponCode: items.length === 0 ? null : state.couponCode };
    }
    case 'quantity_changed':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i),
      };
    case 'coupon_applied':
      return { ...state, couponCode: action.code };
    case 'cart_opened':  return { ...state, isOpen: true };
    case 'cart_closed':  return { ...state, isOpen: false };
    case 'cart_cleared': return initialCart;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
```

Note the braces around multi-statement `case` bodies — a block scope, so `const
items` in one case does not collide with another
([Module 1 §2](../01-javascript-foundations/#2-var-let-const-and-block-scope)).

And note what became impossible: the cart cannot keep a coupon on an empty cart,
because that rule is in the reducer rather than in one of three call sites.

📖 [react.dev — Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)

---

## 6. `useState` vs `useReducer`

| | `useState` | `useReducer` |
|---|---|---|
| Best for | independent values | several values that change together |
| Update logic lives | in each handler | in one reducer |
| Lines of code | fewer for simple cases | more boilerplate, less duplication |
| Reading a component | see the update inline | see *what happened*; the how is elsewhere |
| Testing | needs a rendered component | a plain function call |
| Debugging | scattered breakpoints | one place, and the action names log the story |
| Setter identity | stable | `dispatch` stable, and useful for that |
| Enforcing invariants | by convention across handlers | structurally, in one function |

**Reach for `useReducer` when** three or more pieces of state change together;
the same rule is repeated in several handlers; the next state genuinely depends
on the current one in non-trivial ways; you have a workflow with defined states
and transitions; or a bug in "how state updates" is hard to locate.

**Stay with `useState` when** the values are independent, the updates are
one-liners, or there are only two or three of them. `useReducer` for
`const [isOpen, setIsOpen]` is pure ceremony.

They coexist happily in one component: a reducer for the complex cluster,
`useState` for the incidental toggle.

---

## 7. Reducers are trivially testable

This is the benefit that is easiest to underrate. A reducer is a pure function,
so testing it needs no React at all — no `render`, no DOM, no user simulation:

```js
import { describe, it, expect } from 'vitest';
import { cartReducer } from './cartReducer';

const empty = { items: [], couponCode: null, isOpen: false };

describe('cartReducer', () => {
  it('adds a new item and opens the cart', () => {
    const next = cartReducer(empty, {
      type: 'item_added',
      product: { id: 1, name: 'Keyboard', price: 4999 },
    });
    expect(next.items).toEqual([{ id: 1, name: 'Keyboard', price: 4999, qty: 1 }]);
    expect(next.isOpen).toBe(true);
  });

  it('increments quantity instead of duplicating', () => {
    const withItem = cartReducer(empty, { type: 'item_added', product: { id: 1, name: 'K', price: 1 } });
    const next = cartReducer(withItem, { type: 'item_added', product: { id: 1, name: 'K', price: 1 } });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].qty).toBe(2);
  });

  it('drops the coupon when the last item is removed', () => {
    const state = { items: [{ id: 1, qty: 1 }], couponCode: 'SAVE10', isOpen: true };
    expect(cartReducer(state, { type: 'item_removed', id: 1 }).couponCode).toBeNull();
  });

  it('never lets quantity fall below 1', () => {
    const state = { items: [{ id: 1, qty: 1 }], couponCode: null, isOpen: true };
    expect(cartReducer(state, { type: 'quantity_changed', id: 1, qty: 0 }).items[0].qty).toBe(1);
  });

  it('does not mutate the state it was given', () => {
    const state = { items: [], couponCode: null, isOpen: false };
    cartReducer(state, { type: 'item_added', product: { id: 1, name: 'K', price: 1 } });
    expect(state.items).toHaveLength(0);          // ✓ purity check
  });
});
```

Five tests covering the business rules of a shopping cart, running in
milliseconds. Writing the equivalent against a rendered component would be an
order of magnitude more code and far slower. This is the argument for reducers
that survives contact with a real codebase — [Module 18](../18-testing/) returns
to it.

---

## 8. Reducers as state machines

A reducer is a natural fit whenever your UI has *states* and *transitions*
rather than independent flags. Making that explicit removes a category of bug:

```jsx
const initial = { status: 'idle', data: null, error: null };

function requestReducer(state, action) {
  switch (state.status) {
    case 'idle':
      if (action.type === 'fetch_started') return { status: 'loading', data: null, error: null };
      return state;

    case 'loading':
      if (action.type === 'fetch_succeeded') return { status: 'success', data: action.data, error: null };
      if (action.type === 'fetch_failed')    return { status: 'error', data: null, error: action.error };
      if (action.type === 'cancelled')       return initial;
      return state;

    case 'success':
    case 'error':
      if (action.type === 'fetch_started') return { status: 'loading', data: state.data, error: null };
      return state;

    default:
      return state;
  }
}
```

Switching on `state.status` *first* means an action that does not apply to the
current state is ignored rather than corrupting it. A late `fetch_succeeded`
arriving after the user cancelled cannot flip you back to `success` — the
transition simply does not exist.

Note also that `'success'` keeps `state.data` while reloading, which is the
"show stale data during a refetch" behaviour from
[Module 6 §15](../06-conditional-rendering-and-lists/#15-the-four-states-of-any-data-driven-list),
falling out of the design for free.

This pairs with the `status` union from
[Module 8 §7.2](../08-state-structure/#7-choosing-the-state-structure-five-principles):
the union makes bad states unrepresentable, and the machine makes bad
*transitions* unrepresentable.

---

## 9. The problem Context solves

Prop drilling ([Module 5 §14](../05-props-and-composition/#14-prop-drilling-when-it-is-fine-and-when-it-is-not)):
a value has to pass through components that do not care about it.

```jsx
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} />;
}
function Layout({ user })   { return <Sidebar user={user} />; }     // doesn't use it
function Sidebar({ user })  { return <UserMenu user={user} />; }    // doesn't use it
function UserMenu({ user }) { return <span>{user?.name}</span>; }   // finally
```

Add a theme, a locale and a cart and every component in the chain grows four
props it never reads. Context lets a component read a value from an ancestor
directly, at any depth:

```jsx
function UserMenu() {
  const user = useContext(UserContext);       // no props at all
  return <span>{user?.name}</span>;
}
```

**But try composition first.** Very often the data does not need to travel — pass
the *element* down instead of the value
([Module 5 §14](../05-props-and-composition/#fix-1--composition-try-this-first)).
Context is for values genuinely needed by many components at many depths, not
for saving two prop hops.

---

## 10. Using Context

Three steps: create it, provide it, read it.

```jsx
// ── ThemeContext.js ──────────────────────────────────
import { createContext, useContext } from 'react';

export const ThemeContext = createContext('light');    // 'light' is the DEFAULT

// ── App.jsx ──────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState('dark');

  return (
    <ThemeContext value={theme}>       {/* React 19: the context IS the provider */}
      <Layout />
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle theme
      </button>
    </ThemeContext>
  );
}

// ── anywhere below, at any depth ─────────────────────
function Panel() {
  const theme = useContext(ThemeContext);
  return <div className={`panel panel--${theme}`}>…</div>;
}
```

> **React 19 syntax note.** `<ThemeContext value={…}>` replaces
> `<ThemeContext.Provider value={…}>`. The `.Provider` form still works and is
> what you will see in nearly all existing code and tutorials — both are correct,
> and this course uses the newer form.

### Nesting and overriding

`useContext` finds the **nearest** provider above it in the tree:

```jsx
<ThemeContext value="dark">
  <Panel />                            {/* dark */}
  <ThemeContext value="light">
    <Panel />                          {/* light — the nearer provider wins */}
  </ThemeContext>
</ThemeContext>
```

This is genuinely useful — a light-themed modal inside a dark app, a
form-disabled subtree, a locale override for one section.

📖 [react.dev — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
📖 [react.dev — `useContext`](https://react.dev/reference/react/useContext) ·
[`createContext`](https://react.dev/reference/react/createContext)

---

## 11. The default value

The argument to `createContext` is used **only when there is no matching
provider above** the component:

```jsx
const ThemeContext = createContext('light');

// rendered outside any provider → useContext returns 'light'
```

Two useful choices, depending on intent:

**A sensible default**, when the context is genuinely optional:

```jsx
const ThemeContext = createContext('light');    // works standalone, e.g. in tests
```

**`null`, plus a hook that throws**, when using the value without a provider is
a programming error:

```jsx
const CartContext = createContext(null);

export function useCart() {
  const cart = useContext(CartContext);
  if (cart === null) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return cart;
}
```

The second is strongly preferable for app state. Without it, a component
rendered outside the provider silently receives `null` and fails somewhere
unrelated with `Cannot read properties of null` — twenty stack frames from the
actual mistake.

---

## 12. Context re-render behaviour

The cost you must understand before using Context for anything that changes
often.

**Every component that reads a context re-renders when that context's `value`
changes identity** — by `Object.is`, not by deep comparison. `memo` does not
help; a context consumer re-renders regardless of its props.

The classic mistake:

```jsx
// ✗ a NEW object every render of App → every consumer re-renders every time
function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext value={{ user, setUser }}>
      <Layout />
    </UserContext>
  );
}
```

The object literal is created fresh on each render of `App`
([Module 1 §22](../01-javascript-foundations/#22-purity-side-effects-and-referential-identity)),
so its identity always differs, so every consumer re-renders — even when `user`
did not change.

**Fix — memoise the value:**

```jsx
function App() {
  const [user, setUser] = useState(null);

  const value = useMemo(() => ({ user, setUser }), [user]);
  //                                               ▲ setUser is stable, so only user matters

  return (
    <UserContext value={value}>
      <Layout />
    </UserContext>
  );
}
```

Now the identity changes only when `user` does. Note that setters from
`useState` and `dispatch` from `useReducer` are stable, so they never need to be
in the dependency list — though including them is harmless.

Two further notes:

- **The React Compiler memoises this for you** where it is enabled
  ([Module 15](../15-performance/)) — but write it correctly anyway; the compiler
  is not universally on, and the reasoning is what you are being tested on in a
  code review.
- **A single primitive value needs no memo:** `<ThemeContext value={theme}>`
  where `theme` is a string is already stable when the string is unchanged.

---

## 13. Splitting contexts

Even with `useMemo`, one context holding several unrelated things means a change
to any of them re-renders every consumer of all of them.

```jsx
// ✗ a component that only needs `theme` re-renders when the cart changes
<AppContext value={{ user, theme, cart, dispatch }}>
```

Split by **rate of change** and by **who needs what**:

```jsx
// ✓ three contexts, three independent subscriptions
<UserContext value={userValue}>
  <ThemeContext value={theme}>
    <CartContext value={cartValue}>
      <App />
    </CartContext>
  </ThemeContext>
</UserContext>
```

### The state/dispatch split

The highest-value version of this idea. `dispatch` never changes; the state
changes constantly. Separating them means components that only *dispatch* never
re-render:

```jsx
const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  return (
    <CartStateContext value={cart}>
      <CartDispatchContext value={dispatch}>       {/* stable — never re-renders consumers */}
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}
```

Now an "Add to cart" button on a product card reads only the dispatch context.
Adding an item re-renders the cart badge and the cart sheet — and not the
twenty-four product cards.

```jsx
function AddToCartButton({ product }) {
  const dispatch = useCartDispatch();              // does NOT subscribe to cart state
  return <button onClick={() => dispatch({ type: 'item_added', product })}>Add</button>;
}
```

Confirm it in the DevTools Profiler: record an add, and check that the product
cards are not in the committed set.

---

## 14. Reducer + Context: the standard pattern

Put together, this is how most React apps manage app-level state without a
library. The complete shape, in one file:

```jsx
// ── features/cart/CartProvider.jsx ───────────────────
import { createContext, useContext, useReducer } from 'react';

const initialCart = { items: [], couponCode: null, isOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'item_added': { … }
    case 'item_removed': { … }
    case 'quantity_changed': { … }
    case 'cart_cleared': return initialCart;
    default: throw new Error(`Unknown action: ${action.type}`);
  }
}

const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  return (
    <CartStateContext value={cart}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

export function useCart() {
  const cart = useContext(CartStateContext);
  if (cart === null) throw new Error('useCart must be used within <CartProvider>');
  return cart;
}

export function useCartDispatch() {
  const dispatch = useContext(CartDispatchContext);
  if (dispatch === null) throw new Error('useCartDispatch must be used within <CartProvider>');
  return dispatch;
}
```

Used like this:

```jsx
// main.jsx
<CartProvider>
  <App />
</CartProvider>

// anywhere below
function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);     // derived, not stored
  return count > 0 ? <Badge count={count} /> : null;       // Module 6 §4 — guard the 0
}

function AddToCartButton({ product }) {
  const dispatch = useCartDispatch();
  return <button onClick={() => dispatch({ type: 'item_added', product })}>Add</button>;
}
```

What this gives you:

- **One place for cart rules**, testable with no React.
- **No prop drilling** — any component at any depth can read or dispatch.
- **Minimal re-renders** — dispatch-only consumers are unaffected by state
  changes.
- **A clear public API** — the rest of the app imports `useCart` and
  `useCartDispatch` and knows nothing about Context or reducers.
- **A migration path** — swapping the internals for Zustand or Redux later
  touches this one file, because nothing else imports the contexts.

### Multiple providers

Real apps have several. Order matters only when one depends on another:

```jsx
<ThemeProvider>
  <AuthProvider>              {/* may read the theme */}
    <CartProvider>            {/* may read the user */}
      <App />
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

Once this nesting gets deep, extract it into a single `<AppProviders>` component
so `main.jsx` stays readable.

📖 [react.dev — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

## 15. A custom hook as the public API

Always export a hook, never the context object. Compare:

```jsx
// ✗ every consumer imports the context and repeats the null check
import { CartStateContext } from './CartProvider';
const cart = useContext(CartStateContext);

// ✓ one import, a real error message, and an API you can change
import { useCart } from './CartProvider';
const cart = useCart();
```

Four concrete benefits:

1. **A useful error** when the provider is missing, at the point of the mistake.
2. **Freedom to change the implementation** — split one context into two, or
   move to Zustand — without touching a single consumer.
3. **A place for derived values**, so callers do not each recompute them:
   ```jsx
   export function useCartSummary() {
     const { items } = useCart();
     const count = items.reduce((n, i) => n + i.qty, 0);
     const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
     return { count, subtotal, isEmpty: items.length === 0 };
   }
   ```
4. **Discoverability.** `useCart` is findable; `CartStateContext` is an
   implementation detail.

Custom hooks in general — the rules, the naming, and the ones worth writing —
are [Module 13](../13-data-fetching-and-custom-hooks/).

---

## 16. What Context is not for

Context is a **delivery mechanism**, not a state manager. It answers "how does
this value reach a deep component", not "where should state live" or "how do I
avoid re-renders".

| Situation | Better tool |
|---|---|
| Passing a value one or two levels | props |
| A layout needs content it does not inspect | composition — pass the element |
| Data that lives on a server | TanStack Query / SWR / a framework loader ([Module 13](../13-data-fetching-and-custom-hooks/)) |
| Filters, sort, page, active tab | URL search params ([Module 14](../14-routing/)) |
| High-frequency updates (mouse position, scroll, animation frames) | local state, a ref, or a store with selectors |
| Avoiding re-renders in a large tree | not Context — see [§17](#17-when-to-reach-for-a-library) |

The most common misuse is putting **server data** in a Context and hand-rolling
loading, caching, refetching and invalidation on top of it. That is a query
library's entire job, and it does it better.

The second most common is a single `<AppContext>` holding everything, which
recreates a global variable with extra steps and re-renders the whole app on any
change.

---

## 17. When to reach for a library

Reducer + Context is genuinely enough for a great many applications. Reach for a
dedicated store when you hit one of these specific walls:

| Wall | Why Context struggles | Library answer |
|---|---|---|
| A large tree, frequent updates | every consumer re-renders on any value change | selector-based subscriptions — a component re-renders only when *its slice* changes |
| Reading state outside React | `useContext` only works in a component | stores expose `getState()` |
| Time-travel / action logging | none built in | Redux DevTools |
| Async workflows, cross-cutting logic | you write it yourself | middleware, thunks, listeners |
| Very many providers | deep nesting in `main.jsx` | one store, many slices |

The realistic options:

- **Zustand** — a small hook-based store with selectors. The lowest-friction step
  up from Context, and the usual answer today.
- **Redux Toolkit** — the mature, heavily-tooled option: devtools, middleware,
  strong conventions. Worth it on large teams and long-lived codebases.
- **Jotai / Recoil-style atoms** — fine-grained atomic state, good when
  independent values are read in scattered places.
- **`useSyncExternalStore`** — the built-in hook for subscribing React to an
  external store. What the libraries above use under the hood, and what you would
  use to write your own.

**Do not start here.** Start with local state, lift when needed, add Context when
drilling genuinely hurts, and adopt a store when you can name the specific wall
you have hit. Adding Redux to an app with four pieces of shared state is a cost
with no matching benefit.

📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

---

## 18. Self-check

1. Name four concrete problems with seven related `useState` variables and
   handlers that each update several of them.
2. What are the two things `useReducer` returns, and which of them is stable
   across renders? Why does that stability matter?
3. What is an action? Why is `'query_changed'` a better name than `'set_query'`?
4. Why should a reducer throw on an unknown action type?
5. List four things a reducer must not do, and say where each belongs instead.
6. What does Strict Mode do to your reducer, and what does that catch?
7. Give the three steps for migrating `useState` to `useReducer`.
8. When should you *not* use a reducer?
9. Write two tests for a `cartReducer` — one for a business rule, one that
   verifies purity.
10. What does switching on `state.status` first, before `action.type`, buy you?
11. Why try composition before Context?
12. What does `createContext(defaultValue)`'s argument actually do, and when
    should it be `null`?
13. Why is `<UserContext value={{ user, setUser }}>` a performance bug, and what
    are two fixes?
14. Precisely when does a context consumer re-render? Does `memo` prevent it?
15. Why split state and dispatch into two contexts? What measurable difference
    does it make?
16. Give four reasons to export `useCart()` rather than `CartContext`.
17. Why is server data a poor fit for Context?
18. Name three specific walls that justify adopting Zustand or Redux over
    reducer + Context.
19. `<ThemeContext value>` vs `<ThemeContext.Provider value>` — what is the
    relationship?
20. Two nested providers for the same context — which one does a consumer read,
    and give a real use for that.

### Practical

1. Take the `ProductBrowser` from [§1](#1-when-usestate-stops-scaling) and
   convert it to a reducer. Verify that "any filter change resets the page" is
   now expressed once.
2. Write a full test suite for that reducer — every action, plus a purity
   assertion — with no `render` call.
3. Build the cart from [§14](#14-reducer--context-the-standard-pattern) end to
   end: provider, split contexts, two hooks, a badge, an add button and a cart
   sheet.
4. Prove the split-context benefit: put a `console.log` in `ProductCard`, add an
   item, and confirm the cards do not re-render. Then merge the two contexts into
   one and watch them all re-render.
5. Convert the request state machine from [§8](#8-reducers-as-state-machines)
   into a `useReducer` and drive it from a real `fetch`. Dispatch a stale
   `fetch_succeeded` after a `cancelled` and confirm it is ignored.

---

## 19. References

Official React documentation only.

**Reducers**
- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Writing reducers well](https://react.dev/learn/extracting-state-logic-into-a-reducer#writing-reducers-well)
- [Comparing `useState` and `useReducer`](https://react.dev/learn/extracting-state-logic-into-a-reducer#comparing-usestate-and-usereducer)
- [`useReducer`](https://react.dev/reference/react/useReducer)

**Context**
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [`useContext`](https://react.dev/reference/react/useContext)
- [`createContext`](https://react.dev/reference/react/createContext)
- [Optimizing re-renders when passing objects and functions](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

**Both together**
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Managing State](https://react.dev/learn/managing-state)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

**Related**
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [`useMemo`](https://react.dev/reference/react/useMemo) — memoising a context value
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — subscribing to an external store
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)

---

**Previous:** [Module 8 — Structuring State](../08-state-structure/)
**Next:** [Module 10 — Forms & Controlled Components](../10-forms/)
