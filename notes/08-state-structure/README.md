# Module 8 — Structuring State: Objects, Arrays, Lifting & Resetting

**Study notes** · ~3 hours

> **Goal.** Knowing `useState` is not the same as knowing where state should
> live or what shape it should have. This module is about the decisions that
> separate a codebase that stays workable from one that accumulates
> "impossible" bugs: how to update nested data immutably, how to choose a shape
> that cannot contradict itself, which component should own a value, and how to
> control when React preserves state versus resets it.

**Prerequisites:** [Module 1](../01-javascript-foundations/) §9 (spread, shallow
copies), §11 (immutability), §12 (array methods).
[Module 7](../07-state-and-events/) throughout.

---

## Contents

1. [Treat state as read-only](#1-treat-state-as-read-only)
2. [Updating objects](#2-updating-objects)
3. [Nested objects](#3-nested-objects)
4. [Immer, and when it earns its place](#4-immer-and-when-it-earns-its-place)
5. [Updating arrays](#5-updating-arrays)
6. [Arrays of objects](#6-arrays-of-objects)
7. [Choosing the state structure: five principles](#7-choosing-the-state-structure-five-principles)
8. [Normalising state](#8-normalising-state)
9. [Derived state](#9-derived-state)
10. [Who should own a piece of state?](#10-who-should-own-a-piece-of-state)
11. [Lifting state up](#11-lifting-state-up)
12. [Controlled and uncontrolled components](#12-controlled-and-uncontrolled-components)
13. [Pushing state down](#13-pushing-state-down)
14. [State lives at a position in the tree](#14-state-lives-at-a-position-in-the-tree)
15. [Preserving and resetting state](#15-preserving-and-resetting-state)
16. [The `key` reset, in practice](#16-the-key-reset-in-practice)
17. [Two mistakes that destroy state silently](#17-two-mistakes-that-destroy-state-silently)
18. [Self-check](#18-self-check)
19. [References](#19-references)

---

## 1. Treat state as read-only

React decides whether to re-render by comparing the **identity** of the new
state to the old one, with `Object.is`. It does not look inside your objects.

```jsx
const [user, setUser] = useState({ name: 'Ada', city: 'London' });

// ✗ nothing happens on screen
function renameBad() {
  user.name = 'Grace';
  setUser(user);              // same reference → React bails out, no re-render
}

// ✓
function renameGood() {
  setUser({ ...user, name: 'Grace' });   // new reference → re-render
}
```

The mutation in `renameBad` is worse than a no-op: the data *has* changed, so the
screen and the state now disagree, and the wrong value will suddenly appear the
next time something unrelated causes a re-render. That is a bug that reproduces
"only sometimes".

So the rule for every piece of state, at every level of nesting:

> **Never modify state in place. Always create a new value and pass it to the
> setter.**

This is also required for correctness beyond re-rendering: mutating state
breaks purity ([Module 4 §15](../04-components-and-jsx/#15-components-must-be-pure)),
which breaks Strict Mode, the React Compiler, and features that render
speculatively.

📖 [react.dev — Updating Objects in State](https://react.dev/learn/updating-objects-in-state)

---

## 2. Updating objects

Spread the old object, then override the fields you are changing
([Module 1 §9](../01-javascript-foundations/#9-spread-and-rest)):

```jsx
const [form, setForm] = useState({ email: '', password: '', remember: false });

setForm({ ...form, email: 'ada@example.com' });                 // one field
setForm({ ...form, email: 'a@b.c', remember: true });           // several
setForm((prev) => ({ ...prev, email: 'a@b.c' }));               // updater form
```

Remember that the setter **replaces**, it does not merge — the spread is what
provides the merge:

```jsx
setForm({ email: 'a@b.c' });     // ✗ password and remember are gone
```

### A single handler for many fields

Computed keys ([Module 1 §10](../01-javascript-foundations/#10-objects-in-depth))
turn the `name` attribute into the state key:

```jsx
function handleChange(event) {
  const { name, value, type, checked } = event.target;
  setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
}

<input name="email" value={form.email} onChange={handleChange} />
<input name="password" type="password" value={form.password} onChange={handleChange} />
<input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} />
```

One handler, any number of fields. This is the standard shape for forms until
you adopt a form library ([Module 10](../10-forms/)).

### Removing a key

Rest destructuring is the cleanest way:

```jsx
const [filters, setFilters] = useState({ category: 'input', maxPrice: 5000 });

function clearCategory() {
  setFilters((prev) => {
    const { category, ...rest } = prev;      // ✓ everything except category
    return rest;
  });
}
```

---

## 3. Nested objects

`{ ...obj }` is a **shallow** copy — nested objects are shared with the original
([Module 1 §9](../01-javascript-foundations/#9-spread-and-rest)). So this looks
right and mutates:

```jsx
const [profile, setProfile] = useState({
  name: 'Ada',
  address: { city: 'London', postcode: 'E1' },
});

// ✗ the spread copied the address REFERENCE; this edits the original
setProfile((prev) => {
  const next = { ...prev };
  next.address.city = 'Bath';
  return next;
});
```

Spread every level you are changing:

```jsx
// ✓
setProfile((prev) => ({
  ...prev,
  address: { ...prev.address, city: 'Bath' },
}));
```

Three levels deep:

```jsx
setOrder((prev) => ({
  ...prev,
  customer: {
    ...prev.customer,
    address: { ...prev.customer.address, city: 'Bath' },
  },
}));
```

At which point you should stop and ask whether the state shape is the problem
rather than the syntax — see [§7](#7-choosing-the-state-structure-five-principles),
principle 5.

> **`structuredClone` is not the answer.** It works
> ([Module 1 §9](../01-javascript-foundations/#9-spread-and-rest)) but copies
> everything on every update, which loses the referential stability React and
> `memo` rely on: every nested object gets a new identity, so every child sees
> "changed" props. Copy only the path you are editing.

---

## 4. Immer, and when it earns its place

Immer lets you write mutating code against a draft and produces an immutable
result:

```jsx
import { useImmer } from 'use-immer';

const [order, updateOrder] = useImmer(initialOrder);

updateOrder((draft) => {
  draft.customer.address.city = 'Bath';        // looks like mutation
  draft.lines.push({ sku: 'KB-01', qty: 1 });  // …but produces a new object
  draft.lines[0].qty += 1;
});
```

**When it is worth it:** genuinely deep state you do not control the shape of —
a nested document, a form mirroring a complex API payload, a canvas or diagram
model.

**The costs, stated honestly:** a dependency in your hot path; a second mental
model for updates in the same codebase; and — the real one — it makes deep state
*comfortable*, so the pressure to flatten a bad shape disappears. Immer fixes
the syntax problem and hides the design problem.

**Order of preference:** flatten the state → spread the path you edit → reach for
Immer.

📖 [react.dev — Write concise update logic with Immer](https://react.dev/learn/updating-objects-in-state#write-concise-update-logic-with-immer)

---

## 5. Updating arrays

The table from [Module 1 §11](../01-javascript-foundations/#11-immutability--the-rule-react-is-built-on),
now as React state operations:

```jsx
const [items, setItems] = useState(['a', 'b', 'c']);

// ADD to the end
setItems([...items, 'd']);
setItems((prev) => [...prev, 'd']);

// ADD to the start
setItems(['z', ...items]);

// INSERT at an index
setItems((prev) => [...prev.slice(0, 1), 'x', ...prev.slice(1)]);

// REMOVE by value / by index
setItems((prev) => prev.filter((i) => i !== 'b'));
setItems((prev) => prev.filter((_, index) => index !== 1));

// REPLACE at an index
setItems((prev) => prev.map((i, index) => (index === 1 ? 'B' : i)));
setItems((prev) => prev.with(1, 'B'));            // modern, non-mutating

// SORT / REVERSE — never in place
setItems((prev) => [...prev].sort());
setItems((prev) => prev.toSorted());
setItems((prev) => prev.toReversed());

// CLEAR
setItems([]);
```

The methods to never call on state: `push`, `pop`, `shift`, `unshift`, `splice`,
`sort`, `reverse`, and direct index assignment `items[0] = x`. They all mutate.

`toSorted`, `toReversed`, `toSpliced` and `with` are the non-mutating
equivalents, available in Node 20+ and all current browsers.

📖 [react.dev — Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)

---

## 6. Arrays of objects

The realistic case, and the one where mutation sneaks back in. `map` gives you
each item — returning the item unchanged keeps its identity, returning a spread
copy replaces it:

```jsx
const [products, setProducts] = useState([
  { id: 1, name: 'Keyboard', price: 4999, tags: ['input'], selected: false },
  { id: 2, name: 'Mouse', price: 2999, tags: ['input'], selected: false },
]);

// UPDATE one field on one item
setProducts((prev) =>
  prev.map((p) => (p.id === 1 ? { ...p, price: 3999 } : p))
);

// TOGGLE a boolean on one item
setProducts((prev) =>
  prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
);

// UPDATE a nested array inside one item
setProducts((prev) =>
  prev.map((p) => (p.id === id ? { ...p, tags: [...p.tags, 'sale'] } : p))
);

// UPDATE every item
setProducts((prev) => prev.map((p) => ({ ...p, selected: true })));

// ADD
setProducts((prev) => [...prev, { id: crypto.randomUUID(), name, price, tags: [] }]);
//                                    ▲ generate the id at CREATION time — Module 6 §10

// REMOVE
setProducts((prev) => prev.filter((p) => p.id !== id));
```

The trap in this shape:

```jsx
// ✗ new array, but the objects inside are the SAME objects — this mutates state
setProducts((prev) => {
  const next = [...prev];
  next[0].price = 3999;
  return next;
});
```

`[...prev]` copies the array, not its contents. Any level you write to needs its
own copy. `map` + spread is the pattern that gets this right by construction,
which is why it is the idiom.

---

## 7. Choosing the state structure: five principles

Syntax is the easy half. The shape of your state decides which bugs are
*possible*.

### 7.1 Group what changes together

```jsx
// ✗ two variables that must always move in lockstep
const [x, setX] = useState(0);
const [y, setY] = useState(0);

// ✓ one value
const [position, setPosition] = useState({ x: 0, y: 0 });
```

If you can never update one without the other, they are one piece of state.

### 7.2 Avoid contradictions

```jsx
// ✗ isLoading && isError is representable, and meaningless
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// ✓ one variable, four states, no impossible combinations
const [status, setStatus] = useState('idle');   // 'idle' | 'loading' | 'error' | 'success'
```

Three booleans allow eight combinations, of which four are nonsense. Every
`if (isLoading && !isError)` in your codebase is you paying interest on that.
This pairs with the props design in
[Module 5 §12](../05-props-and-composition/#12-designing-a-component-api) and
becomes compiler-enforced with a discriminated union in
[Module 17](../17-typescript-with-react/).

### 7.3 Avoid redundancy — derive instead

```jsx
// ✗
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');      // will drift

// ✓
const fullName = `${firstName} ${lastName}`.trim();
```

See [§9](#9-derived-state).

### 7.4 Avoid duplication — store the id, not a copy

```jsx
// ✗ two copies of the same product; edit one and they disagree
const [products, setProducts] = useState(initial);
const [selectedProduct, setSelectedProduct] = useState(null);

// ✓ one source of truth
const [products, setProducts] = useState(initial);
const [selectedId, setSelectedId] = useState(null);
const selectedProduct = products.find((p) => p.id === selectedId) ?? null;
```

The `✗` version produces the classic "I edited the product but the detail panel
still shows the old name" bug. Storing the id makes it impossible.

### 7.5 Avoid deep nesting — flatten

```jsx
// ✗ updating one leaf requires four levels of spreading
const [catalog, setCatalog] = useState({
  categories: [
    { id: 1, name: 'Input', products: [{ id: 10, name: 'Keyboard', variants: [...] }] },
  ],
});

// ✓ flat, with ids as the links
const [categories, setCategories] = useState({ 1: { id: 1, name: 'Input', productIds: [10] } });
const [products, setProducts] = useState({ 10: { id: 10, name: 'Keyboard', categoryId: 1 } });
```

If an update is painful to write, the shape is usually wrong. That is the signal
to restructure, not to reach for Immer.

📖 [react.dev — Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

---

## 8. Normalising state

For relational data — a list you also need to look up by id, or nested
collections — the standard shape is a lookup object plus an order array:

```jsx
const [productsById, setProductsById] = useState({
  10: { id: 10, name: 'Keyboard', price: 4999 },
  11: { id: 11, name: 'Mouse', price: 2999 },
});
const [productIds, setProductIds] = useState([10, 11]);
```

What this buys you:

```jsx
// O(1) lookup instead of a scan
const product = productsById[id];

// updating one item touches one key
setProductsById((prev) => ({ ...prev, [id]: { ...prev[id], price: 3999 } }));

// order is independent of the data — sorting does not touch the items
setProductIds((prev) => [...prev].sort((a, b) => productsById[a].price - productsById[b].price));

// rendering
{productIds.map((id) => <ProductCard key={id} product={productsById[id]} />)}
```

**When to normalise:** the same entity appears in several places; you look up by
id often; items are deeply nested; the list is large and updates are frequent.

**When not to:** a short flat list you only ever render. `useState([])` is fine
and normalising it is ceremony. Normalisation is a response to a real problem,
not a default.

Note that once your data comes from a server, a query library keeps its own
normalised cache and this concern largely moves out of your components
([Module 13](../13-data-fetching-and-custom-hooks/)).

---

## 9. Derived state

**Compute during render. Do not store.**

```jsx
function Cart({ items }) {
  const count = items.length;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal > 5000 ? 0 : 499;
  const total = subtotal + shipping;
  const hasOutOfStock = items.some((i) => i.stock === 0);

  return <Summary count={count} total={total} canCheckout={!hasOutOfStock} />;
}
```

None of these is state. They are recalculated on every render from the one thing
that *is* state, so they cannot go stale.

### Do not sync derived values with an effect

The anti-pattern this replaces:

```jsx
// ✗ an extra render, and a window where total is wrong
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((s, i) => s + i.price, 0));
}, [items]);
```

React renders with the old `total`, the effect runs, state changes, React
renders again. Two renders and a transiently incorrect UI, to compute something
you could have written as a `const`. This is the headline example in
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
and it is [Module 12](../12-effects/)'s main theme.

### What about expensive derivations?

Measure first. Filtering a few thousand items per render is not a problem. If
profiling shows it is, `useMemo` caches it ([Module 15](../15-performance/)):

```jsx
const sorted = useMemo(
  () => [...products].sort((a, b) => a.price - b.price),
  [products]
);
```

That is an optimisation, not a correctness fix. It does not change the model: the
value is still derived, not stored.

📖 [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

## 10. Who should own a piece of state?

The rule: **state belongs in the closest common ancestor of every component that
needs it.**

Work it out by listing the consumers:

| Who needs it | Where it lives |
|---|---|
| One component, nobody else | that component |
| A component and its own children | that component, passed down as props |
| Two siblings | their nearest common parent |
| Most of a subtree, at several depths | that subtree's root — consider Context ([Module 9](../09-reducers-and-context/)) |
| The whole app (theme, session, cart) | app root, via Context or a store |
| The server | a query library / loader ([Module 13](../13-data-fetching-and-custom-hooks/)) |
| The user should be able to share or bookmark it | the URL ([Module 14](../14-routing/)) |

That last row is worth taking seriously and is routinely missed. Filters, sort
order, the current page, the open tab, a search query — putting these in
`useState` means a refresh loses them, the back button does nothing, and a user
cannot send a colleague a link to what they are looking at. Search params are
state too, and often the right kind.

---

## 11. Lifting state up

Two siblings need the same value, so it moves to their parent.

### The problem

From [Module 2](../02-react-introduction/#23-self-check): each `ProductCard`
owns its own `saved` flag, so the parent cannot implement "Save all", and a
counter in the header cannot know how many are saved.

```jsx
function ProductCard({ product }) {
  const [saved, setSaved] = useState(false);      // trapped in here
  …
}
```

### The fix

Move the state up, and pass down the value plus a way to change it:

```jsx
function ProductGrid({ products }) {
  const [savedIds, setSavedIds] = useState(new Set());

  function toggleSaved(id) {
    setSavedIds((prev) => {
      const next = new Set(prev);                 // copy first — Module 1 §21
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      <header>
        {savedIds.size} saved
        <button onClick={() => setSavedIds(new Set(products.map((p) => p.id)))}>
          Save all
        </button>
        <button onClick={() => setSavedIds(new Set())}>Clear</button>
      </header>

      <div className="grid">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            isSaved={savedIds.has(p.id)}
            onToggleSaved={() => toggleSaved(p.id)}
          />
        ))}
      </div>
    </>
  );
}

function ProductCard({ product, isSaved, onToggleSaved }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button onClick={onToggleSaved} aria-pressed={isSaved}>
        {isSaved ? '♥ Saved' : '♡ Save'}
      </button>
    </article>
  );
}
```

`ProductCard` now has no state. It renders what it is told and reports clicks —
which makes it trivially testable, reusable in the cart and the back-office, and
impossible to get out of sync with the header count.

### The steps, as a recipe

1. Identify every component that reads or writes the value.
2. Find their closest common parent.
3. Move `useState` there.
4. Pass the value down as a prop.
5. Pass a setter or a named callback down as a prop.
6. Delete the child's local state.

📖 [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

---

## 12. Controlled and uncontrolled components

Lifting state produces the distinction that runs through all of React's
component APIs.

- **Uncontrolled** — the component owns the value internally. The parent sets an
  initial value and then has no say.
- **Controlled** — the parent owns the value and passes it in, with a callback
  to request changes.

```jsx
// uncontrolled: SearchInput owns `query`
function SearchInput({ defaultValue = '' }) {
  const [query, setQuery] = useState(defaultValue);
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

// controlled: the parent owns it
function SearchInput({ value, onChange }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
```

| | Uncontrolled | Controlled |
|---|---|---|
| Owner | the component | the parent |
| Parent can read it | no | yes |
| Parent can reset it | only via `key` | yes, directly |
| Callers write | less code | more code |
| Coordination with siblings | impossible | easy |

**Choose uncontrolled** when nothing outside needs the value: a disclosure
toggle, a tooltip's open state, a local "show more".

**Choose controlled** when anything outside needs to read, set, validate,
persist or coordinate it — which is most form fields, filters and selections.

The same words describe DOM inputs specifically: `<input value onChange>` is
controlled by React, `<input defaultValue>` is controlled by the DOM. That is
[Module 10](../10-forms/).

Many library components support both — `value` for controlled, `defaultValue`
for uncontrolled — which is a good pattern to copy when you build a reusable
component ([Module 16](../16-advanced-patterns/)).

---

## 13. Pushing state down

The opposite refactor, and the one people forget exists. If state has drifted
upward and only one subtree uses it, move it down:

```jsx
// ✗ typing in the search box re-renders the entire page,
//   including an expensive chart that does not care
function Dashboard({ data }) {
  const [query, setQuery] = useState('');
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveChart data={data} />
      <Results query={query} />
    </>
  );
}

// ✓ the state lives with the two things that use it
function Dashboard({ data }) {
  return (
    <>
      <SearchPanel />
      <ExpensiveChart data={data} />
    </>
  );
}

function SearchPanel() {
  const [query, setQuery] = useState('');
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results query={query} />
    </>
  );
}
```

State as low as possible, and no lower: it limits how much of the tree
re-renders, keeps components self-contained, and makes it obvious who owns what.
"Lift state up" is advice for sharing, not a suggestion that higher is better.

---

## 14. State lives at a position in the tree

This is the idea that explains everything in the rest of the module.

React does not associate state with a component *function*. It associates it
with a **position in the render tree**, identified by that position's component
type and `key`. Same type and key at the same position on the next render →
React keeps the state. Anything else → it destroys the old state and mounts
fresh.

```jsx
function App() {
  const [showSecond, setShowSecond] = useState(true);
  return (
    <>
      <Counter />                       {/* position 1 */}
      {showSecond && <Counter />}       {/* position 2 */}
      <button onClick={() => setShowSecond(!showSecond)}>Toggle</button>
    </>
  );
}
```

Increment both counters, then click Toggle twice. The second counter comes back
at zero — removing it from the tree destroyed its state. The first is untouched.

**Same component, same position, state survives** — even across other changes:

```jsx
{isFancy ? <Counter isFancy /> : <Counter isFancy={false} />}
```

Both branches render `Counter` at the same position, so the count survives the
toggle. Different props, same identity.

**Different component at the same position, state resets:**

```jsx
{isFancy ? <FancyCounter /> : <PlainCounter />}
```

Two different types, so React unmounts one and mounts the other. The count goes.

📖 [react.dev — Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

---

## 15. Preserving and resetting state

Now you can predict — and choose — what happens.

### Same position, different key → reset

```jsx
{isFancy ? <Counter key="fancy" /> : <Counter key="plain" />}
```

Same component type, same position, but the keys differ, so React treats them as
different components. The count resets on every toggle. This is the mechanism
for **deliberately** resetting state.

### Two slots keep two states

```jsx
{isPlayerA
  ? <Counter person="Taylor" />
  : <Counter person="Sarah" />}
```

One position → one state, shared between the two players. Whatever Taylor
counted, Sarah inherits. If you want separate scores, either give them keys:

```jsx
{isPlayerA
  ? <Counter key="Taylor" person="Taylor" />
  : <Counter key="Sarah" person="Sarah" />}
```

…or render both and hide one, which preserves both states at the cost of keeping
both mounted.

### The reference table

| Change | State |
|---|---|
| Props change, same type, same position | **preserved** |
| Parent re-renders, tree shape unchanged | **preserved** |
| Component removed from the tree, then re-added | **reset** |
| Different component type at the same position | **reset** |
| Same type, different `key` | **reset** |
| Same type, same `key`, moved position (in a keyed list) | **preserved** — the node moves |
| Component function redefined each render (defined inline) | **reset every render** |

---

## 16. The `key` reset, in practice

The `key` reset is not a trick — it is the idiomatic React answer to a very
common requirement.

### An edit form that must reset when the record changes

```jsx
// ✗ the classic bug: switch records and the form still shows the old draft
function ProductForm({ product }) {
  const [name, setName] = useState(product.name);      // initial value only
  const [price, setPrice] = useState(product.price);
  …
}
```

```jsx
// ✓ a different key means a different instance, so state starts fresh
<ProductForm key={selectedProduct.id} product={selectedProduct} />
```

One prop, no effect, no manual synchronising. Compare the alternative people
reach for first:

```jsx
// ✗ an extra render, and easy to get the dependency list wrong
useEffect(() => {
  setName(product.name);
  setPrice(product.price);
}, [product]);
```

The `key` version is shorter, has no intermediate render with stale values, and
cannot fall out of sync.

### Other everyday uses

```jsx
// remount a component to retry after an error
<ErrorBoundary key={retryCount}>…</ErrorBoundary>

// reset all filter state when the route's category changes
<ProductList key={categorySlug} category={categorySlug} />

// clear a chat composer when switching conversation
<MessageComposer key={conversationId} />
```

### When *not* to use it

`key` unmounts and remounts. That destroys **all** state in the subtree, runs
cleanup and setup for every effect below, and discards DOM nodes — so scroll
position, focus and in-progress animations go too. If you only want to reset one
field, set that one field in the event handler that caused the change.

📖 [react.dev — Resetting a form with a key](https://react.dev/learn/preserving-and-resetting-state#resetting-a-form-with-a-key)

---

## 17. Two mistakes that destroy state silently

### 17.1 A component defined inside another component

```jsx
function Page() {
  function Counter() {                    // ✗ a NEW function on every Page render
    const [n, setN] = useState(0);
    return <button onClick={() => setN(n + 1)}>{n}</button>;
  }
  return <Counter />;
}
```

Each render of `Page` creates a different `Counter` function, so React sees a
different component type at that position and remounts it — resetting `n` every
time `Page` re-renders for any reason. The count appears to work until something
else on the page changes.

Fix: define components at module top level, always
([Module 4 §3](../04-components-and-jsx/#3-files-exports-and-imports)).

### 17.2 Conditional structure that changes a position's ancestry

```jsx
// ✗ the two <Counter />s are at different tree positions
{isWide
  ? <div className="wide"><Counter /></div>
  : <Counter />}
```

Toggling `isWide` moves `Counter` from being a child of `div` to being a direct
child, which is a different position — so its state resets. Keep the structure
stable and change the class instead:

```jsx
// ✓
<div className={isWide ? 'wide' : ''}>
  <Counter />
</div>
```

This is the same reasoning as
[Module 6 §6](../06-conditional-rendering-and-lists/#6-choosing-between-the-four)'s
advice to branch on the difference rather than duplicating the wrapper — there
it was about readability, here it is about correctness.

---

## 18. Self-check

1. Why does `user.name = 'Grace'; setUser(user)` not update the screen — and why
   is it worse than doing nothing at all?
2. Write the update for: one field of an object; a field of a nested object; a
   field two levels deep.
3. Why does `const next = {...prev}; next.address.city = 'Bath';` mutate state?
4. Write add / remove / insert-at-index / replace-at-index / sort for an array
   in state, without mutating.
5. Why is `const next = [...prev]; next[0].price = 3999;` still a mutation, and
   what is the correct form?
6. Give the five principles for choosing a state structure, with an example of
   each violation.
7. Convert `isLoading`/`isError`/`isSuccess` into a better shape and say which
   impossible states you eliminated.
8. You store `products` and `selectedProduct`. Describe the bug that follows, and
   the fix.
9. When is normalising state (`byId` + `ids`) worth it? When is it ceremony?
10. Why should a cart total not be state? What are the two costs of syncing it
    with an effect?
11. Where does state belong when: one component needs it; two siblings need it;
    the whole app needs it; the user should be able to bookmark it?
12. Give the six steps for lifting state up.
13. Controlled vs uncontrolled — define both, and give one case where each is
    the right choice.
14. What is "pushing state down", and what problem does it solve?
15. React associates state with what, exactly? Not with the component function —
    with what?
16. Predict: `{isFancy ? <Counter isFancy /> : <Counter isFancy={false} />}` —
    does the count survive a toggle? What about
    `{isFancy ? <FancyCounter /> : <PlainCounter />}`?
17. `{isPlayerA ? <Counter person="Taylor" /> : <Counter person="Sarah" />}` —
    why do both players share one score, and give two ways to separate them.
18. Give the idiomatic way to reset an edit form when the selected record
    changes, and explain why it beats the `useEffect` version on two counts.
19. When is a `key` reset the wrong tool?
20. Why does defining a component inside another component reset its state on
    every parent render?

### Practical

1. Build a task list with add, remove, toggle-done, edit-title, and reorder
   (move up / move down) — all immutably, no library.
2. Take a component with `products`, `filteredProducts`, `count` and `total` in
   state and reduce it to one piece of state.
3. Build a master–detail screen: a list, a selected id, and an edit form that
   resets correctly when the selection changes. Do it with `key`, then try it
   with an effect and compare the render counts in DevTools.
4. Build the "Save all" / "saved count" version of `ProductGrid` from
   [§11](#11-lifting-state-up), then make `ProductCard` support both controlled
   and uncontrolled `isSaved`.
5. Reproduce the state reset from
   [§17.2](#172-conditional-structure-that-changes-a-positions-ancestry), then
   fix it.

---

## 19. References

Official React documentation only.

**Updating state**
- [Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [Write concise update logic with Immer](https://react.dev/learn/updating-objects-in-state#write-concise-update-logic-with-immer)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)

**Structuring and owning state**
- [Managing State](https://react.dev/learn/managing-state) — the section this module covers
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

**Identity and resets**
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [Resetting a form with a key](https://react.dev/learn/preserving-and-resetting-state#resetting-a-form-with-a-key)
- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [`useState`](https://react.dev/reference/react/useState)
- [`useMemo`](https://react.dev/reference/react/useMemo) — for expensive derivations, after measuring

---

**Previous:** [Module 7 — State & Events](../07-state-and-events/)
**Next:** [Module 9 — Reducers & Context](../09-reducers-and-context/)
