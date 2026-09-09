# Module 7 — State & Events

**Study notes** · ~3 hours

> **Goal.** State is the single idea that turns a static component tree into an
> application. This module covers `useState` and event handling properly — and
> spends real time on the two things that confuse everyone at first: why your
> state looks "one render behind", and why calling a setter three times only
> increments once.

**Prerequisites:** [Module 1](../01-javascript-foundations/) §3 (functions),
§13 (closures), §17 (event loop). [Module 4](../04-components-and-jsx/) and
[Module 5](../05-props-and-composition/).

---

## Contents

1. [Why a plain variable does not work](#1-why-a-plain-variable-does-not-work)
2. [`useState`](#2-usestate)
3. [The Rules of Hooks, and why they exist](#3-the-rules-of-hooks-and-why-they-exist)
4. [State belongs to an instance, not a function](#4-state-belongs-to-an-instance-not-a-function)
5. [Naming state](#5-naming-state)
6. [Handling events](#6-handling-events)
7. [Passing a function vs calling a function](#7-passing-a-function-vs-calling-a-function)
8. [The event object](#8-the-event-object)
9. [Propagation, capture and stopping it](#9-propagation-capture-and-stopping-it)
10. [Handlers as props](#10-handlers-as-props)
11. [State as a snapshot](#11-state-as-a-snapshot)
12. [Updater functions](#12-updater-functions)
13. [Batching](#13-batching)
14. [Lazy initial state](#14-lazy-initial-state)
15. [One object or several state variables?](#15-one-object-or-several-state-variables)
16. [What should not be state](#16-what-should-not-be-state)
17. [What triggers a re-render](#17-what-triggers-a-re-render)
18. [Common mistakes](#18-common-mistakes)
19. [Self-check](#19-self-check)
20. [References](#20-references)

---

## 1. Why a plain variable does not work

Start with the version that seems obvious and fails:

```jsx
function Counter() {
  let count = 0;                                   // ✗

  function handleClick() {
    count = count + 1;
    console.log('count is now', count);            // logs 1, 2, 3 — the variable does change
  }

  return <button onClick={handleClick}>{count}</button>;   // always renders 0
}
```

The console proves the variable increments. The screen never changes. Two
separate reasons, and you need both:

1. **Nothing tells React to re-render.** React called `Counter`, got JSX back,
   and committed it. Mutating a local variable afterwards is invisible to React —
   it has no reason to call your function again.
2. **Even if it did re-render, the variable resets.** `let count = 0` runs again
   on every call, so it would go straight back to `0`.

State solves exactly these two problems: React **stores the value outside your
function** so it survives re-renders, and **re-renders when you change it**.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);           // ✓

  function handleClick() {
    setCount(count + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

📖 [react.dev — State: A Component's Memory](https://react.dev/learn/state-a-components-memory)

---

## 2. `useState`

```jsx
const [count, setCount] = useState(0);
//     ▲       ▲                    ▲
//     │       │                    └─ initial value, used on the FIRST render only
//     │       └─ the setter: tells React "store this and re-render me"
//     └─ the current value for THIS render
```

`useState` returns an array of exactly two items, which you destructure by
position ([Module 1 §8](../01-javascript-foundations/#8-destructuring)). The
names are yours; the order is fixed:

```jsx
const [setCount, count] = useState(0);    // compiles, completely broken
```

Any value works as state:

```jsx
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [user, setUser] = useState(null);
const [items, setItems] = useState([]);
const [form, setForm] = useState({ email: '', password: '' });
const [selectedIds, setSelectedIds] = useState(new Set());
```

### The initial value is used once

This is the source of a very common bug:

```jsx
function ProductForm({ product }) {
  const [name, setName] = useState(product.name);   // ✗ a snapshot, frozen at mount
  …
}
```

After the first render, `useState(product.name)` is ignored entirely. Pass a
different `product` later and `name` keeps the old value. Covered in
[Module 5 §15](../05-props-and-composition/#15-do-not-copy-props-into-state); the
fix is a `key`, or not holding it in state at all.

### The setter does not change the variable

```jsx
function handleClick() {
  console.log(count);        // 0
  setCount(count + 1);
  console.log(count);        // still 0 — not a bug
}
```

`count` is a `const` fixed for this render. `setCount` schedules a re-render in
which a *new* `count` will exist. This is [§11](#11-state-as-a-snapshot), and it
is the single most important section in this module.

📖 [react.dev — `useState`](https://react.dev/reference/react/useState)

---

## 3. The Rules of Hooks, and why they exist

Two rules, no exceptions:

1. **Only call hooks at the top level** of a component or another hook — never
   inside a condition, a loop, a nested function, or after an early return.
2. **Only call hooks from React function components or custom hooks** — not from
   plain functions, event handlers, or class components.

```jsx
function Bad({ isLoggedIn, items }) {
  if (isLoggedIn) {
    const [name, setName] = useState('');        // ✗ conditional
  }

  for (const item of items) {
    const [open, setOpen] = useState(false);     // ✗ in a loop
  }

  function handleClick() {
    const [x, setX] = useState(0);               // ✗ in a nested function
  }

  if (!items.length) return null;
  const [page, setPage] = useState(1);           // ✗ after a conditional return
}
```

### Why — the mechanism

React does not know the *names* of your state variables. It stores hook state in
an ordered list per component instance, and matches calls to slots **by call
order**:

```
render 1:  useState('')   → slot 0
           useState(0)    → slot 1
           useEffect(…)   → slot 2

render 2:  useState('')   → slot 0   ✓ same order, same slots
           useState(0)    → slot 1
           useEffect(…)   → slot 2
```

Put a hook behind an `if` and the order changes between renders, so slot 1 now
receives what belonged to slot 0. React detects the count mismatch and throws
(`Rendered fewer hooks than expected`), but when the *count* happens to match it
silently hands you the wrong value.

The practical consequence: **hooks first, then conditionals and early returns.**

```jsx
function ProductList({ products, status }) {
  const [page, setPage] = useState(1);            // ✓ all hooks up top
  const [sort, setSort] = useState('name');

  if (status === 'loading') return <Skeleton />;  // ✓ returns after the hooks
  …
}
```

If a value is only needed conditionally, the state still lives unconditionally —
or the conditional part becomes its own component, which is usually the better
design.

`eslint-plugin-react-hooks` enforces both rules. Leave it on.

📖 [react.dev — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

## 4. State belongs to an instance, not a function

```jsx
function WishlistButton() {
  const [saved, setSaved] = useState(false);
  return <button onClick={() => setSaved(!saved)}>{saved ? '♥' : '♡'}</button>;
}

function ProductGrid({ products }) {
  return products.map((p) => (
    <article key={p.id}>
      <h2>{p.name}</h2>
      <WishlistButton />        {/* 24 of these */}
    </article>
  ));
}
```

There is one `saved` variable in the source and twenty-four independent values
at runtime. React keeps a separate state list for each **position in the render
tree** ([Module 4 §12](../04-components-and-jsx/#12-nesting-composition-and-the-ui-tree)),
so clicking one heart does nothing to the others.

Verify it in React DevTools: **Components** → select two different
`WishlistButton` nodes → each shows its own hooks.

Two consequences worth stating now, both developed in
[Module 8](../08-state-structure/):

- State is tied to a **position**, not to a component name. Move a component
  elsewhere in the tree and its state does not follow.
- Remove a component from the tree and its state is **destroyed**. Render it
  again and it starts from the initial value.

If several components need to share one value, the state must live in a common
parent — that is "lifting state up", and it is Module 8's main subject.

---

## 5. Naming state

| Kind | Convention | Example |
|---|---|---|
| Value + setter | `x` / `setX` | `count` / `setCount` |
| Boolean | `is`/`has`/`should` | `isOpen`, `hasError`, `isSubmitting` |
| Collection | plural noun | `items`, `products`, `selectedIds` |
| A choice among options | the domain noun | `sortBy`, `activeTab`, `status` |
| Loading/error/data | one `status` union | `status` = `'loading' \| 'error' \| …` |

The setter is always `set` + the exact variable name, capitalised. Deviating from
that costs the reader a lookup every time, for nothing.

---

## 6. Handling events

Pass a function to a JSX event prop. Names are camelCase (`onClick`,
`onChange`, `onSubmit`, `onKeyDown`, `onFocus`, `onBlur`, `onMouseEnter`, …).

```jsx
function SaveButton({ onSaved }) {
  const [saving, setSaving] = useState(false);

  function handleClick() {              // convention: handleX for the implementation
    setSaving(true);
    onSaved();
  }

  return (
    <button onClick={handleClick} disabled={saving}>
      {saving ? 'Saving…' : 'Save'}
    </button>
  );
}
```

Three equivalent forms:

```jsx
<button onClick={handleClick}>Save</button>             {/* a named function — preferred */}
<button onClick={() => setSaving(true)}>Save</button>   {/* inline arrow — fine when tiny */}
<button onClick={function () { … }}>Save</button>       {/* nobody writes this */}
```

Use a named function once the body is more than one short statement. Inline
arrows are fine and idiomatic for one-liners — the "inline arrows hurt
performance" claim is [Module 15](../15-performance/) material and almost always
irrelevant.

Event handlers are the **right place for side effects**. Unlike the component
body, a handler runs in response to a user action, not during render, so it may
fetch, write to `localStorage`, call analytics, or navigate.

📖 [react.dev — Responding to Events](https://react.dev/learn/responding-to-events)

---

## 7. Passing a function vs calling a function

The number-one beginner bug in React, and it is pure JavaScript
([Module 1 §14](../01-javascript-foundations/#14-higher-order-functions-and-functions-as-values)).

```jsx
<button onClick={handleClick}>Save</button>       {/* ✓ pass the function */}
<button onClick={handleClick()}>Save</button>     {/* ✗ CALLS it during render */}
```

The second form calls `handleClick` while React is rendering and gives its
return value (usually `undefined`) to `onClick`. Symptoms: the action fires
immediately when the component appears, nothing happens on click, and — if the
handler sets state — `Too many re-renders`, because render → setState → render →
setState.

### When the handler needs an argument

Wrap it in an arrow, so you are passing a function that will call yours later:

```jsx
<button onClick={() => handleDelete(product.id)}>Delete</button>       {/* ✓ */}
<button onClick={handleDelete(product.id)}>Delete</button>             {/* ✗ */}
```

The arrow is created during render and called on click. That is the correct
shape, and it is what you want in a `.map()`:

```jsx
{products.map((p) => (
  <ProductCard key={p.id} product={p} onDelete={() => handleDelete(p.id)} />
))}
```

An alternative that avoids the closure is a data attribute
([Module 4 §7](../04-components-and-jsx/#7-attributes-the-differences-from-html)):

```jsx
<button data-id={p.id} onClick={(e) => handleDelete(e.currentTarget.dataset.id)}>
```

Correct, occasionally useful for very large lists, and less readable. Start with
the arrow.

---

## 8. The event object

React passes your handler a **synthetic event** — a cross-browser wrapper with
the standard DOM event API:

```jsx
function SearchForm({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleSubmit(event) {
    event.preventDefault();          // stop the browser navigating away
    onSearch(query);
  }

  function handleChange(event) {
    setQuery(event.target.value);    // the input's current text
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') setQuery('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={handleChange} onKeyDown={handleKeyDown} />
    </form>
  );
}
```

The properties you will actually use:

| Property / method | What it gives you |
|---|---|
| `event.target` | The element the event **originated on** |
| `event.currentTarget` | The element the **handler is attached to** |
| `event.target.value` | An input's text |
| `event.target.checked` | A checkbox's state |
| `event.preventDefault()` | Cancel the browser default (form submit, link navigation) |
| `event.stopPropagation()` | Stop the event bubbling further up |
| `event.key` | `'Enter'`, `'Escape'`, `'ArrowDown'`, … |
| `event.metaKey` / `ctrlKey` / `shiftKey` | Modifier keys |

**`target` vs `currentTarget`** matters more than it looks. Click the `<span>`
inside a button and `target` is the span, `currentTarget` is the button. For
reading `dataset` or identifying "which row", you almost always want
`currentTarget`.

`preventDefault` is required in two everyday cases: a `<form onSubmit>` (the
browser would reload the page) and an `<a>` you are handling yourself.

---

## 9. Propagation, capture and stopping it

Events **bubble**: an event on a child fires handlers on its ancestors too,
innermost first.

```jsx
function Row({ product, onOpen, onDelete }) {
  return (
    <div className="row" onClick={() => onOpen(product.id)}>
      <span>{product.name}</span>
      <button onClick={() => onDelete(product.id)}>Delete</button>
    </div>
  );
}
```

Clicking **Delete** fires `onDelete` *and then* `onOpen` — the row opens a
product the user just deleted. Fix:

```jsx
<button
  onClick={(event) => {
    event.stopPropagation();       // ✓ the row's handler will not run
    onDelete(product.id);
  }}
>
  Delete
</button>
```

Bubbling is a feature — a container can handle events for all its children —
but nested interactive elements need it stopped deliberately.

Two more details:

**Capture phase.** `onClickCapture` runs on the way *down* the tree, before the
target's own handler. Rare; useful for analytics or intercepting.

**`stopPropagation` is not `preventDefault`.** The first stops the event
travelling; the second cancels the browser's default action. They are
independent, and you sometimes need both.

📖 [react.dev — Event propagation](https://react.dev/learn/responding-to-events#event-propagation)

---

## 10. Handlers as props

A component that does not own the state receives a callback
([Module 5 §6](../05-props-and-composition/#6-one-way-data-flow-and-how-events-travel-back-up)):

```jsx
// the owner names the implementation handleX
function ProductGrid({ products }) {
  const [cart, setCart] = useState([]);

  function handleAdd(productId) {
    setCart([...cart, productId]);
  }

  return products.map((p) => (
    <ProductCard key={p.id} product={p} onAdd={handleAdd} />
  ));
}

// the child names the prop onX and knows nothing about what it does
function ProductCard({ product, onAdd }) {
  return <button onClick={() => onAdd(product.id)}>Add</button>;
}
```

### Extending rather than replacing

When a wrapper has its own behaviour, call the caller's handler too — do not
swallow it:

```jsx
function TrackedButton({ onClick, trackingId, ...rest }) {
  return (
    <button
      {...rest}
      onClick={(event) => {
        analytics.track(trackingId);
        onClick?.(event);            // ✓ optional call — the caller may not pass one
      }}
    />
  );
}
```

`onClick?.(event)` uses optional chaining
([Module 1 §7](../01-javascript-foundations/#7-optional-chaining-and-nullish-coalescing))
so an absent handler is not an error.

---

## 11. State as a snapshot

The most important idea in this module. Read it slowly.

**Each render gets its own `const`.** When React renders a component it calls
your function, and `useState` returns the value of the state *at that moment*.
That value never changes for the life of that render — it is a `const`, and every
function created during that render closes over it
([Module 1 §13](../01-javascript-foundations/#13-closures--and-why-your-state-looks-stale)).

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);      // count is 0 → schedules 1
    setCount(count + 1);      // count is STILL 0 → schedules 1
    setCount(count + 1);      // count is STILL 0 → schedules 1
    console.log(count);       // 0
  }

  return <button onClick={handleClick}>{count}</button>;   // renders 1 after the click
}
```

Three setter calls, and the count goes from 0 to 1. Not a bug, and not a race
condition. `count` is `0` throughout `handleClick`, so all three calls say
"make it 1".

### The delayed-log version

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setTimeout(() => {
      alert(count);           // alerts 0, even three seconds later
    }, 3000);
  }
  …
}
```

The `setTimeout` callback closed over *this render's* `count`. React has
re-rendered since, with a new `count`, but this closure still points at the old
one. That is not React being clever — it is how closures work, and React's
render model makes it visible.

### The mental model

> Calling a setter does not change the variable. It asks React to render again
> with a new value. `count` in the current render is a **photograph**, not a live
> reading.

Once this clicks, a whole family of "React is being weird" bugs stops being
mysterious.

📖 [react.dev — State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)

---

## 12. Updater functions

When the next state depends on the previous state, pass a **function** to the
setter instead of a value. React calls it with the latest pending state:

```jsx
function handleClick() {
  setCount((c) => c + 1);     // c = 0 → 1
  setCount((c) => c + 1);     // c = 1 → 2
  setCount((c) => c + 1);     // c = 2 → 3
}
```

Now three clicks' worth of work happens in one click, because React queues the
functions and applies them in order when it re-renders.

```
setCount(count + 1)  →  queue: [replace with 1, replace with 1, replace with 1]  →  1
setCount(c => c + 1) →  queue: [c=>c+1, c=>c+1, c=>c+1]  applied to 0            →  3
```

### When the updater form is required

- **Several updates in one event**, as above.
- **Updating from an async callback** — a `setTimeout`, a `fetch` `.then`, a
  WebSocket message, an interval. The closed-over value is stale by then; the
  updater always sees the current value.
- **Inside an effect with a cleanup-sensitive dependency**, where reading state
  would force it into the dependency array
  ([Module 12](../12-effects/)).

```jsx
useEffect(() => {
  const id = setInterval(() => {
    setSeconds((s) => s + 1);      // ✓ no `seconds` dependency needed
  }, 1000);
  return () => clearInterval(id);
}, []);                            // ✓ set up once
```

Writing `setSeconds(seconds + 1)` there would freeze at 1, because the interval
closure captured `seconds` from the first render.

### Rules for the updater

It must be **pure**: take the previous state, return the next state, do nothing
else. React may call it twice in Strict Mode.

```jsx
setItems((prev) => [...prev, newItem]);              // ✓ returns a new array
setItems((prev) => { prev.push(newItem); return prev; });  // ✗ mutates, same reference
setUser((prev) => ({ ...prev, name }));              // ✓
setCount((c) => { console.log(c); return c + 1; });  // ✗ side effect in an updater
```

**Guidance:** when the next value is computed *from* the current one, use the
updater form by default. It is never wrong, and it is required more often than
beginners expect.

📖 [react.dev — Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)

---

## 13. Batching

React does not re-render once per setter call. It waits until your handler
finishes, then re-renders once with all the updates applied:

```jsx
function handleSubmit() {
  setSubmitting(true);
  setError(null);
  setTouched(true);
  // → exactly ONE re-render, not three
}
```

This is called **batching**, and it is why the UI never flickers through
intermediate states. It also means a `console.log` immediately after a setter
shows the old value — the re-render has not happened yet
([§11](#11-state-as-a-snapshot)).

React 18 extended batching to **every** context, including promise callbacks,
`setTimeout` and native event handlers ("automatic batching"). Older code and
tutorials sometimes describe a world where only React event handlers batched;
that is no longer true.

```jsx
// React 18+: one re-render
fetch('/api/save').then(() => {
  setSaving(false);
  setSaved(true);
});
```

If you ever genuinely need the DOM updated before the next line — measuring
layout after a state change — that is `flushSync`, and it is a last resort worth
a comment explaining why.

📖 [react.dev — Render and Commit](https://react.dev/learn/render-and-commit)

---

## 14. Lazy initial state

The argument to `useState` is evaluated on **every render**, even though it is
only *used* on the first:

```jsx
const [items, setItems] = useState(expensiveParse(localStorage.getItem('items')));
// ✗ expensiveParse runs on every single render, and the result is thrown away
```

Pass a function instead, and React calls it only when it needs an initial value:

```jsx
const [items, setItems] = useState(() => expensiveParse(localStorage.getItem('items')));
// ✓ runs once
```

Note the difference carefully:

```jsx
useState(createInitialTodos())      // ✗ calls it now, every render
useState(createInitialTodos)        // ✓ passes the function — React calls it once
useState(() => createInitialTodos())// ✓ same, and clearer when arguments are involved
```

Only bother for genuinely expensive work — parsing, reading storage, building a
large structure. `useState(0)` and `useState([])` need nothing.

> **Careful:** if your initialiser is a function you want stored *as state*, you
> must wrap it: `useState(() => myFunction)`. Otherwise React calls it.

---

## 15. One object or several state variables?

Both are valid; the choice matters.

```jsx
// several — usually better
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// one object
const [form, setForm] = useState({ email: '', password: '' });
```

**Use separate variables when** the values change independently. Updates are
simple (`setEmail(v)`), and there is no risk of clobbering a sibling field.

**Use one object when** the values always change together, or when the fields
are dynamic (a form whose fields come from config). Then remember that the
setter **replaces**, it does not merge:

```jsx
setForm({ email: 'a@b.c' });                    // ✗ password is now gone
setForm((prev) => ({ ...prev, email: 'a@b.c' })); // ✓ spread first
```

That spread requirement is why one big object is a footgun for unrelated values,
and why a generic change handler is the payoff when the fields *are* related:

```jsx
function handleChange(event) {
  const { name, value } = event.target;
  setForm((prev) => ({ ...prev, [name]: value }));   // computed key
}

<input name="email" value={form.email} onChange={handleChange} />
<input name="password" value={form.password} onChange={handleChange} />
```

The deeper question — what shape should state have at all — is
[Module 8 §6](../08-state-structure/). The short version: group what changes
together, never store what you can derive, and never let two pieces of state be
able to contradict each other.

---

## 16. What should not be state

Putting the wrong things in state is the main cause of buggy React. Three
categories to keep out.

### 16.1 Anything you can derive

```jsx
// ✗ three sources of truth that will drift apart
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);
const [total, setTotal] = useState(0);
const [isEmpty, setIsEmpty] = useState(true);

// ✓ one source of truth; the rest computed during render
const [items, setItems] = useState([]);
const count = items.length;
const total = items.reduce((sum, i) => sum + i.price, 0);
const isEmpty = items.length === 0;
```

Derived state must be kept in sync manually, and eventually someone adds a code
path that updates `items` and forgets `total`. Computing during render cannot
go out of sync. Do not reach for `useMemo` unless profiling says to
([Module 15](../15-performance/)).

### 16.2 Anything the UI does not display

A value that does not affect the output does not belong in state — changing it
would trigger a pointless re-render. Use a ref
([Module 11](../11-refs-and-the-dom/)):

```jsx
const timerId = useRef(null);          // ✓ a timer handle
const previousQuery = useRef('');      // ✓ bookkeeping
const hasLoggedView = useRef(false);   // ✓ a one-time flag
```

### 16.3 Props

Covered in [Module 5 §15](../05-props-and-composition/#15-do-not-copy-props-into-state).
Either use the prop directly, or reset the component with a `key`.

### The decision table

| The value… | Where it goes |
|---|---|
| Changes over time **and** affects what is rendered | `useState` |
| Can be computed from other state or props | a plain `const`, during render |
| Comes from the parent and the parent owns it | a prop |
| Is needed by two siblings | state in the closest common parent |
| Changes but is never rendered | `useRef` |
| Lives on a server | a query library / framework loader ([Module 13](../13-data-fetching-and-custom-hooks/)) |
| Belongs in the URL (filters, page, tab) | search params ([Module 14](../14-routing/)) |

📖 [react.dev — Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
📖 [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

## 17. What triggers a re-render

Exactly four things:

1. **A state update in this component** — via a setter, when the new value is
   different.
2. **A parent re-rendered** — the whole subtree below re-renders by default.
3. **A context value this component reads changed** ([Module 9](../09-reducers-and-context/)).
4. **Its `key` changed** — which is not really a re-render but a remount, with
   fresh state ([Module 8](../08-state-structure/)).

Two clarifications that prevent a lot of confusion:

**Setting state to the same value skips the re-render.** React bails out using
`Object.is` comparison:

```jsx
setCount(0);                     // already 0 → no re-render
setUser(user);                   // same reference → no re-render
setUser({ ...user });            // NEW reference → re-renders, even if contents match
```

That last line is why mutating and re-setting the same object does nothing, and
why replacing it always works
([Module 1 §11](../01-javascript-foundations/#11-immutability--the-rule-react-is-built-on)).

**A re-render is not a DOM update.** React re-runs your function and diffs the
result; only the actual differences reach the DOM
([Module 2 §5](../02-react-introduction/#5-how-react-updates-the-screen)). Most
re-renders are cheap, which is why "reduce re-renders" is not a goal in itself.

---

## 18. Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| Handler fires on render, or `Too many re-renders` | `onClick={handleClick()}` | `onClick={handleClick}` or `onClick={() => handleClick(id)}` |
| Screen never updates | Mutated state instead of replacing | `setItems([...items, x])` |
| Three increments produce one | Reading `count` three times in one handler | `setCount(c => c + 1)` |
| `console.log` after a setter shows the old value | State as a snapshot + batching | Expected. Log in the render body |
| An interval or timeout sees a stale value | Closure over an old render | Updater function, or fix the effect deps |
| A form field will not type | `value` with no `onChange` | Add `onChange`, or use `defaultValue` |
| Fields reset when one changes | `setForm({ field })` replaced the object | `setForm(prev => ({ ...prev, field }))` |
| State ignores a new prop | Initial value is used once | `key`, or don't copy props into state |
| `Invalid hook call` | Hook in a condition/loop/nested function, or two copies of React | Move to the top level; check `npm ls react` |
| `Rendered fewer hooks than expected` | An early `return` above a hook | Hooks first, returns after |
| Two components' state moves together | They share one state in a parent when they should each own theirs | Push state down |
| Clicking a nested button also triggers the row | Event bubbling | `event.stopPropagation()` |
| Page reloads on form submit | Missing `preventDefault` | Add it in `onSubmit` |
| A stray `0` appears | `{count && <X />}` | `{count > 0 && <X />}` |

---

## 19. Self-check

1. Give the two distinct reasons a plain `let count = 0` cannot work as state.
2. What are the three parts of `const [count, setCount] = useState(0)`, and which
   of them is fixed by position rather than name?
3. When is the argument to `useState` actually used? What bug follows from
   forgetting that?
4. State the two Rules of Hooks, then explain the mechanism that makes the first
   one necessary.
5. Where must hooks go relative to an early `return`, and why?
6. Twenty-four `<WishlistButton />` components share one `useState(false)` line.
   Why are there twenty-four independent values?
7. What is the difference between `onClick={handleClick}` and
   `onClick={handleClick()}`? Name two symptoms of the second.
8. How do you pass an argument to a handler, and why does the arrow wrapper work?
9. `event.target` vs `event.currentTarget` — give a concrete case where the
   difference matters.
10. Name the two everyday situations that require `preventDefault`.
11. `stopPropagation` vs `preventDefault` — what does each do?
12. Predict the output and the final count:
    ```jsx
    function handleClick() {
      setCount(count + 1);
      setCount(count + 1);
      console.log(count);
    }
    ```
    Then rewrite it so the count increases by two.
13. Why does `setTimeout(() => alert(count), 3000)` alert the *old* count?
14. Name three situations where the updater form is not optional.
15. What is batching, and what changed about it in React 18?
16. Why is `useState(expensiveParse())` wrong, and what are the two correct
    forms?
17. When would you choose one state object over several state variables, and
    what must you remember about the setter?
18. Classify each: cart items · cart total · a timer id · the current search
    query · the product passed from a parent · the active tab · whether an
    analytics event has fired.
19. List the four things that trigger a re-render.
20. Why does `setUser(user)` not re-render but `setUser({...user})` does?

### Practical

1. Build a counter with `+1`, `-1`, `reset`, and a `+3` button that works
   correctly in a single click.
2. Build a search input, a checkbox, a radio group and a `<select>`, each as
   minimal state. Then combine them into one state object with a single change
   handler.
3. Build a row with an "open" click on the container and a "delete" button
   inside it. Reproduce the double-fire, then fix it.
4. Build a stopwatch with start/stop/reset using `setInterval` in an effect and
   `setSeconds(s => s + 1)`. Then try it with `setSeconds(seconds + 1)` and
   explain what you see.
5. Take a component with `items`, `count`, `total` and `isEmpty` all in state
   and reduce it to one piece of state.

---

## 20. References

Official React documentation only.

**State**
- [State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Adding Interactivity](https://react.dev/learn/adding-interactivity) — the section this module covers
- [`useState`](https://react.dev/reference/react/useState)

**Events**
- [Responding to Events](https://react.dev/learn/responding-to-events)
- [Event propagation](https://react.dev/learn/responding-to-events#event-propagation)
- [Common components — the full event prop reference](https://react.dev/reference/react-dom/components/common)

**Rendering**
- [Render and Commit](https://react.dev/learn/render-and-commit)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)

**Rules**
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Rules of React](https://react.dev/reference/rules)
- [`flushSync`](https://react.dev/reference/react-dom/flushSync) — the escape hatch from batching

---

**Previous:** [Module 6 — Conditional Rendering & Lists](../06-conditional-rendering-and-lists/)
**Next:** [Module 8 — Structuring State](../08-state-structure/)
