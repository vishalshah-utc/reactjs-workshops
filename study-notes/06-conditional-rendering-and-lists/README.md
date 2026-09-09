# Module 6 — Conditional Rendering & Lists

**Study notes** · ~2 hours

> **Goal.** Almost every screen you build is "show this when…, and repeat that
> for each…". This module covers both halves properly, including the one topic
> that causes more subtle React bugs than any other: `key`.

**Prerequisites:** [Module 1](../01-javascript-foundations/) §6 (truthiness),
§12 (array methods). [Module 4](../04-components-and-jsx/) §9–10 (curly braces,
what renders).

---

## Contents

1. [Four ways to render conditionally](#1-four-ways-to-render-conditionally)
2. [Early returns](#2-early-returns)
3. [The ternary](#3-the-ternary)
4. [Logical AND — and the falsy trap](#4-logical-and--and-the-falsy-trap)
5. [Variables and helper functions](#5-variables-and-helper-functions)
6. [Choosing between the four](#6-choosing-between-the-four)
7. [Rendering lists with `map`](#7-rendering-lists-with-map)
8. [`key`: what it is for](#8-key-what-it-is-for)
9. [`key`: the bug you must see once](#9-key-the-bug-you-must-see-once)
10. [Choosing a key](#10-choosing-a-key)
11. [Keys and multiple elements per row](#11-keys-and-multiple-elements-per-row)
12. [Filtering, sorting and deriving lists](#12-filtering-sorting-and-deriving-lists)
13. [Nested lists](#13-nested-lists)
14. [Rendering objects and other non-arrays](#14-rendering-objects-and-other-non-arrays)
15. [The four states of any data-driven list](#15-the-four-states-of-any-data-driven-list)
16. [Skeletons and loading placeholders](#16-skeletons-and-loading-placeholders)
17. [Conditional attributes and classes](#17-conditional-attributes-and-classes)
18. [Accessibility of conditional UI](#18-accessibility-of-conditional-ui)
19. [Self-check](#19-self-check)
20. [References](#20-references)

---

## 1. Four ways to render conditionally

React has no `v-if`, no `{% if %}`, no `*ngIf`. Conditional rendering is just
JavaScript, which means you have four tools:

| Tool | Shape | Best for |
|---|---|---|
| Early `return` | `if (x) return <A />;` | Whole-component branches |
| Ternary | `{x ? <A /> : <B />}` | Two alternatives, inline |
| `&&` | `{x && <A />}` | Render or nothing |
| A variable / helper | `let c = …; return <div>{c}</div>` | Three or more branches |

They are not interchangeable in practice. [§6](#6-choosing-between-the-four) gives
the decision rule; first, each one properly.

---

## 2. Early returns

The clearest form, and the most under-used by beginners. Statements are legal
above the `return`, so put the branching there
([Module 4 §9](../04-components-and-jsx/#9-curly-braces-where-they-are-legal-and-what-goes-in-them)):

```jsx
function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge--out">Out of stock</span>;
  if (stock < 5) return <span className="badge badge--low">Only {stock} left</span>;
  return <span className="badge">In stock</span>;
}
```

Compare the same logic as nested ternaries:

```jsx
function StockBadge({ stock }) {
  return stock === 0
    ? <span className="badge badge--out">Out of stock</span>
    : stock < 5
      ? <span className="badge badge--low">Only {stock} left</span>
      : <span className="badge">In stock</span>;
}
```

Both work. The first reads top-to-bottom as three independent rules; the second
requires you to track nesting. Once you have three branches, early returns win
almost every time.

### Returning nothing

```jsx
function Banner({ message }) {
  if (!message) return null;
  return <div className="banner">{message}</div>;
}
```

`return null` renders nothing at all — no element, no DOM node. This is better
than returning a hidden wrapper:

```jsx
// ✗ the div, its class, and its layout effects are still in the DOM
if (!message) return <div className="banner" style={{ display: 'none' }} />;
```

Guard clauses at the top of a component are also how you handle data that has
not arrived:

```jsx
function ProductDetail({ product }) {
  if (!product) return <Skeleton />;
  return <h1>{product.name}</h1>;         // below here, product is guaranteed
}
```

That pattern removes the need for `?.` on every line of the body, which is worth
a lot in a large component.

---

## 3. The ternary

For exactly two alternatives, inline:

```jsx
<button onClick={toggle}>
  {isSaved ? '♥ Saved' : '♡ Save'}
</button>

{isLoading ? <Spinner /> : <ProductGrid products={products} />}
```

Ternaries are expressions, so they nest — and nesting is where they go wrong.
One level is fine. Two is a code review comment. Three means you wanted early
returns or a lookup object.

A useful middle ground when the branches are values rather than markup, is a
**lookup object**:

```jsx
const BADGE = {
  out:  { className: 'badge--out', label: 'Out of stock' },
  low:  { className: 'badge--low', label: 'Low stock' },
  ok:   { className: '',           label: 'In stock' },
};

function StockBadge({ stock }) {
  const level = stock === 0 ? 'out' : stock < 5 ? 'low' : 'ok';
  const { className, label } = BADGE[level];
  return <span className={`badge ${className}`}>{label}</span>;
}
```

This scales to twenty variants without growing the JSX at all.

---

## 4. Logical AND — and the falsy trap

`{condition && <Thing />}` renders `<Thing />` when the condition is truthy and
nothing when it is falsy — because `false`, `null` and `undefined` render
nothing ([Module 4 §10](../04-components-and-jsx/#10-what-renders-and-what-does-not)).

```jsx
{isAdmin && <AdminPanel />}
{error && <ErrorMessage error={error} />}
{items.length > 0 && <Badge count={items.length} />}
```

### The trap

`&&` returns its **left operand** when that operand is falsy
([Module 1 §6](../01-javascript-foundations/#6-truthiness-equality-and-the-falsy-traps)),
and React **renders the number `0`**. So:

```jsx
{cartCount && <Badge count={cartCount} />}
// cartCount = 3  → <Badge />        ✓
// cartCount = 0  → renders "0"      ✗ a stray zero appears on your page
```

The same happens with `NaN`. It does *not* happen with `''`, `null` or
`undefined`, which is why the bug hides until a count legitimately reaches zero.

**Three fixes**, all fine:

```jsx
{cartCount > 0 && <Badge count={cartCount} />}       // ✓ compare explicitly — clearest
{Boolean(cartCount) && <Badge count={cartCount} />}  // ✓ coerce
{cartCount ? <Badge count={cartCount} /> : null}     // ✓ ternary
```

Prefer the first: `cartCount > 0` says what you mean, and survives someone later
changing the type.

> **Habit worth forming:** never put a bare number, or anything that could be a
> number, on the left of `&&` in JSX. Make the left side a real boolean, always.

📖 [react.dev — Logical AND operator (&&)](https://react.dev/learn/conditional-rendering#logical-and-operator-)

---

## 5. Variables and helper functions

When branching gets complex, assign to a variable above the `return`:

```jsx
function OrderStatus({ order }) {
  let content;

  if (order.cancelledAt) {
    content = <Chip tone="neutral">Cancelled</Chip>;
  } else if (order.shippedAt) {
    content = <Chip tone="success">Shipped {formatDate(order.shippedAt)}</Chip>;
  } else if (order.paidAt) {
    content = <Chip tone="info">Awaiting fulfilment</Chip>;
  } else {
    content = <Chip tone="warning">Awaiting payment</Chip>;
  }

  return <div className="order-status">{content}</div>;
}
```

Or extract a component, which is usually better because it gets a name and can
use early returns:

```jsx
function OrderChip({ order }) {
  if (order.cancelledAt) return <Chip tone="neutral">Cancelled</Chip>;
  if (order.shippedAt)   return <Chip tone="success">Shipped</Chip>;
  if (order.paidAt)      return <Chip tone="info">Awaiting fulfilment</Chip>;
  return <Chip tone="warning">Awaiting payment</Chip>;
}
```

### The switch, when the branches are exhaustive

```jsx
function StatusPanel({ status, data, error }) {
  switch (status) {
    case 'loading': return <Skeleton />;
    case 'error':   return <ErrorState error={error} />;
    case 'empty':   return <EmptyState />;
    case 'ready':   return <Grid data={data} />;
    default:        return null;
  }
}
```

`switch` is a statement, so it cannot go inside `{ }` — but a component whose
whole body is a `switch` is perfectly idiomatic, and pairs well with the
"one `status` union instead of several booleans" design from
[Module 5 §12](../05-props-and-composition/#12-designing-a-component-api).

---

## 6. Choosing between the four

```
Does the whole component render differently?
├─ YES → early return
└─ NO — it's one region inside larger JSX
   │
   How many outcomes?
   ├─ render or nothing        → {cond && <X />}   (guard against 0!)
   ├─ exactly two             → {cond ? <X /> : <Y />}
   └─ three or more           → extract a component with early returns,
                                or a lookup object
```

Two additional rules that keep JSX readable:

**Do not hide structure inside a ternary.** If the two branches share most of
their markup, branch on the *difference*, not the whole block:

```jsx
// ✗ the <article> is duplicated, and will drift
{isCompact
  ? <article className="card card--compact"><h2>{p.name}</h2></article>
  : <article className="card"><h2>{p.name}</h2><p>{p.description}</p></article>}

// ✓
<article className={isCompact ? 'card card--compact' : 'card'}>
  <h2>{p.name}</h2>
  {!isCompact && <p>{p.description}</p>}
</article>
```

**Watch out for conditionals that change component identity at one position.**
This resets state, because React sees a different type in the same slot:

```jsx
{isEditing ? <ProductForm product={p} /> : <ProductView product={p} />}
```

That reset is often exactly what you want. When it is not, the fix is
structural — [Module 8](../08-state-structure/) covers preserving and resetting
state deliberately.

📖 [react.dev — Conditional Rendering](https://react.dev/learn/conditional-rendering)

---

## 7. Rendering lists with `map`

`.map()` turns an array of data into an array of elements, and React renders
arrays of elements in order.

```jsx
function ProductGrid({ products }) {
  return (
    <div className="grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

The reason `map` is the right method — and not `forEach` — is that `map`
*returns* a value, and `{ }` needs an expression
([Module 1 §5](../01-javascript-foundations/#5-expressions-vs-statements--the-single-most-important-distinction-for-jsx)).
`forEach` returns `undefined`, so nothing renders.

```jsx
{products.forEach((p) => <Card key={p.id} />)}    // ✗ renders nothing, no error
```

### Rendering plain values

```jsx
<ul>
  {['Small', 'Medium', 'Large'].map((size) => (
    <li key={size}>{size}</li>
  ))}
</ul>
```

For a list of primitives with no ids, the value itself is a reasonable key —
provided the values are unique.

### A `for` loop is also fine

If you prefer, build the array above the `return`. Local mutation is pure
([Module 4 §15](../04-components-and-jsx/#15-components-must-be-pure)):

```jsx
function ProductGrid({ products }) {
  const cards = [];
  for (const product of products) {
    if (product.hidden) continue;
    cards.push(<ProductCard key={product.id} product={product} />);
  }
  return <div className="grid">{cards}</div>;
}
```

This is sometimes clearer than `.filter().map()` when the per-item logic is
involved.

📖 [react.dev — Rendering Lists](https://react.dev/learn/rendering-lists)

---

## 8. `key`: what it is for

Every element in a rendered array needs a `key`. Omit it and React warns:

```
Warning: Each child in a list should have a unique "key" prop.
```

**What React does with it.** During the render phase React compares the new
element list to the previous one to decide what to do with the real DOM
([Module 2 §5](../02-react-introduction/#5-how-react-updates-the-screen)). Without
keys it can only compare **by position**: first to first, second to second. With
keys it compares **by identity**: "the element with key `42` was third, now it is
first — move that DOM node, do not rebuild it".

So `key` answers one question: **which item is this?**

Three properties follow from that:

- Keys must be **unique among siblings** — not globally unique. Two different
  lists can both use key `1`.
- Keys must be **stable across renders** — the same item must get the same key
  every time, or React thinks it is a different item.
- Keys are **not props**. `function Row({ key })` receives `undefined`
  ([Module 5 §17](../05-props-and-composition/#17-key-is-not-a-normal-prop)). Pass
  the id separately if the component needs it.

### What `key` controls, beyond efficiency

This is the part people miss. Because `key` determines identity, it determines:

- whether a DOM node is **moved or recreated** — and therefore whether focus,
  scroll position, text selection, video playback and CSS transitions survive;
- whether a component's **state is preserved or reset**;
- whether its **effects re-run**.

A wrong key is therefore not a performance nit. It is a correctness bug that
manifests as data appearing on the wrong row.

---

## 9. `key`: the bug you must see once

Build this. Actually build it — reading about it does not stick.

```jsx
function BadList() {
  const [items, setItems] = useState([
    { id: 'a', label: 'First' },
    { id: 'b', label: 'Second' },
    { id: 'c', label: 'Third' },
  ]);

  return (
    <>
      <button onClick={() => setItems([...items].reverse())}>Reverse</button>
      <ul>
        {items.map((item, index) => (
          <li key={index}>                     {/* ✗ the index */}
            {item.label} <input placeholder="type here" />
          </li>
        ))}
      </ul>
    </>
  );
}
```

Type `one` into the first input, `two` into the second, `three` into the third.
Click **Reverse**.

**What you expect:** the rows reverse, and each input's text goes with its row.

**What happens:** the labels reverse but the inputs do not. `one` is still in the
first position, now next to "Third".

**Why.** The `<input>` is uncontrolled, so its value lives in the DOM node.
React matched the new list to the old one by key — and the keys are `0, 1, 2`
both before and after. So React concluded "position 0 is still key 0, only its
text child changed", updated the label, and left the input's DOM node exactly
where it was.

**The fix** is one word:

```jsx
{items.map((item) => (
  <li key={item.id}>
    {item.label} <input placeholder="type here" />
  </li>
))}
```

Now key `a` moves from position 0 to position 2, so React *moves* that `<li>` —
DOM node, input value and all.

The same bug, with component state instead of a DOM value, is worse: a
collapsed/expanded panel, a checked checkbox, a half-finished edit form, all
jumping to the wrong row after a sort. And it only appears when the list
reorders, so it typically ships.

---

## 10. Choosing a key

### Good keys

```jsx
key={product.id}          // ✓ a database id — the best case
key={order.orderNumber}   // ✓ any stable unique business identifier
key={user.email}          // ✓ unique and stable within this list
key={size}                // ✓ a unique primitive value ('Small', 'Medium'…)
key={`${row}-${col}`}     // ✓ a composite that is genuinely unique and stable
```

### Bad keys

```jsx
key={index}                  // ✗ position, not identity — see §9
key={Math.random()}          // ✗ new every render: React rebuilds everything, every time
key={crypto.randomUUID()}    // ✗ same problem
key={`item-${index}`}        // ✗ the index wearing a disguise
key={JSON.stringify(item)}   // ✗ changes whenever any field changes → node recreated
```

`Math.random()` as a key is worth understanding because it looks like it
satisfies "unique". It does — but it is not **stable**, so every render produces
a completely new set of keys, React matches nothing, and it destroys and
recreates every row on every render. You lose all state, all focus, and any
performance you thought you were getting.

### When is the index acceptable?

Only when **all** of these hold:

1. The list never reorders.
2. Items are never inserted or removed except at the end.
3. Items have no state, no uncontrolled inputs, and no focus.

Static footer links, a fixed set of table headers, a rendered array of strings
that never changes — fine. Anything driven by user actions or server data — not
fine. When in doubt, use an id; there is no downside.

### What if the data has no id?

Three options, in order of preference:

**1. Find a natural key.** A slug, an email, a SKU, a composite of two fields.

**2. Generate the id when the item is created, not when it is rendered.**

```jsx
function addItem(label) {
  setItems([...items, { id: crypto.randomUUID(), label }]);   // ✓ once, at creation
}
```

The id becomes part of the data and stays stable forever. This is the correct
answer for client-created items.

**3. Assign ids when the data arrives.**

```jsx
const withIds = rawRows.map((row, i) => ({ ...row, id: row.sku ?? `row-${i}` }));
```

A pragmatic fallback for data you do not control — but note it re-introduces the
index problem if the incoming order changes.

📖 [react.dev — Why does React need keys?](https://react.dev/learn/rendering-lists#why-does-react-need-keys)

---

## 11. Keys and multiple elements per row

When one data item produces several sibling elements, the key goes on a
`<Fragment>` — and this is the one case where the `<>` shorthand cannot be used,
because it takes no attributes:

```jsx
import { Fragment } from 'react';

function SpecList({ specs }) {
  return (
    <dl>
      {specs.map((spec) => (
        <Fragment key={spec.id}>
          <dt>{spec.label}</dt>
          <dd>{spec.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

A wrapper `<div>` here would be invalid HTML inside `<dl>`, so the fragment is
required rather than merely tidy
([Module 4 §11](../04-components-and-jsx/#11-fragments)).

### The key goes on the outermost element of the map

```jsx
// ✓ key on the element returned by map
{products.map((p) => <ProductCard key={p.id} product={p} />)}

// ✗ key on something inside the component — React never sees it
function ProductCard({ product }) {
  return <article key={product.id}>…</article>;
}
{products.map((p) => <ProductCard product={p} />)}
```

The key must be attached where the array is created, because that is where React
does the matching.

---

## 12. Filtering, sorting and deriving lists

Chain array methods before `map`
([Module 1 §12](../01-javascript-foundations/#12-array-methods-you-will-use-every-single-day)):

```jsx
function ProductGrid({ products, category, sortBy, query }) {
  const visible = products
    .filter((p) => !category || p.category === category)
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .toSorted((a, b) => (sortBy === 'price' ? a.price - b.price
                                            : a.name.localeCompare(b.name)));

  return (
    <div className="grid">
      {visible.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

Three things to note.

**Compute derived lists during render, do not store them in state.** A filtered
copy in state will eventually disagree with its source. Filtering 500 items on
each render costs nothing measurable; if profiling ever says otherwise,
`useMemo` is the tool ([Module 15](../15-performance/)) — after measuring.

**Never sort in place.** `products.sort()` mutates the array, which is a prop or
state you do not own
([Module 1 §11](../01-javascript-foundations/#11-immutability--the-rule-react-is-built-on)).
Use `toSorted()`, or `[...products].sort()`.

**Keys stay correct automatically.** Because keys come from item ids, filtering
and sorting just move nodes around. This is exactly the scenario index keys
break.

---

## 13. Nested lists

Each `map` needs its own keys, unique among *its own* siblings:

```jsx
function Catalog({ categories }) {
  return (
    <div>
      {categories.map((category) => (
        <section key={category.id}>
          <h2>{category.name}</h2>
          <ul>
            {category.products.map((product) => (
              <li key={product.id}>{product.name}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

`category.id` and `product.id` are independent namespaces — a category with id
`1` and a product with id `1` do not collide, because they are never siblings.

Once nesting reaches two levels, extract a component. It reads better and gives
each list a name:

```jsx
function Catalog({ categories }) {
  return categories.map((c) => <CategorySection key={c.id} category={c} />);
}

function CategorySection({ category }) {
  return (
    <section>
      <h2>{category.name}</h2>
      <ul>
        {category.products.map((p) => <li key={p.id}>{p.name}</li>)}
      </ul>
    </section>
  );
}
```

Note that a component may return an array directly — `Catalog` above has no
wrapper element at all.

---

## 14. Rendering objects and other non-arrays

JSX renders arrays. For anything else, convert first.

### An object

```jsx
const specs = { Switches: 'Brown tactile', Layout: '87-key', Backlight: 'RGB' };

<dl>
  {Object.entries(specs).map(([label, value]) => (
    <Fragment key={label}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </Fragment>
  ))}
</dl>
```

`Object.entries` gives `[key, value]` pairs, which destructure neatly in the
`map` parameter ([Module 1 §10](../01-javascript-foundations/#10-objects-in-depth)).

### A `Map` or `Set`

```jsx
{[...selectedIds].map((id) => <Chip key={id}>{id}</Chip>)}
{[...productsById.values()].map((p) => <Card key={p.id} product={p} />)}
```

Spread into an array first ([Module 1 §21](../01-javascript-foundations/#21-map-set-and-when-to-reach-for-them)).

### A fixed count

```jsx
{Array.from({ length: 5 }, (_, i) => <Star key={i} filled={i < rating} />)}
```

Index keys are correct here — the list is a fixed-length sequence of positions
with no identity of its own.

### A range of numbers

```jsx
{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
  <PageLink key={page} page={page} isCurrent={page === currentPage} />
))}
```

---

## 15. The four states of any data-driven list

A list backed by data has four states, not one. Treating them as one is the most
common cause of "it works on my machine, it's broken in production":

| State | What the user sees | Common mistake |
|---|---|---|
| **Loading** | A skeleton or spinner | Rendering nothing — a blank flash |
| **Error** | What failed, and a way to retry | Silence, or a stack trace |
| **Empty** | "No products match" + a way out | The empty-vs-loading conflation |
| **Ready** | The list | — |

The mistake that matters most is **conflating empty and loading**. `items.length
=== 0` is true while loading *and* when genuinely empty, so a naive check flashes
"No results found" before the data arrives — and users report it as a bug in
your search.

```jsx
// ✗ shows "No products" during the initial load
function ProductList({ products }) {
  if (products.length === 0) return <EmptyState />;
  return <Grid products={products} />;
}
```

```jsx
// ✓ four explicit states
function ProductList({ status, products, error, onRetry, onClearFilters }) {
  if (status === 'loading') return <GridSkeleton count={8} />;
  if (status === 'error')   return <ErrorState error={error} onRetry={onRetry} />;
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products match your filters"
        action={<Button onClick={onClearFilters}>Clear filters</Button>}
      />
    );
  }
  return (
    <div className="grid">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

Two refinements worth building in from the start:

**Distinguish "empty because there is nothing" from "empty because your filters
excluded everything".** They need different messages and different actions —
"Add your first product" versus "Clear filters".

**Keep showing stale data while refetching**, rather than dropping back to a
skeleton. Flashing a skeleton on every refetch is worse than a brief
inconsistency. This is one of the things a server-state library gives you for
free ([Module 13](../13-data-fetching-and-custom-hooks/)).

This four-state shape is why the `status` union from
[Module 5 §12](../05-props-and-composition/#12-designing-a-component-api) is a
better prop design than three booleans: `isLoading && isError` is not a state
your UI should have to have an opinion about.

---

## 16. Skeletons and loading placeholders

```jsx
function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card--skeleton">
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--price" />
        </div>
      ))}
    </div>
  );
}
```

Guidance that holds up in practice:

- **Match the real layout.** A skeleton whose shape differs from the loaded
  content causes a layout shift, which is a Core Web Vital
  ([Module 20](../20-production/)).
- **Match the expected count roughly.** Eight cards, not one.
- **Prefer skeletons to spinners** for content areas; spinners are for actions.
- **Announce it.** `aria-busy` plus a live region, so a screen reader user knows
  something is happening ([§18](#18-accessibility-of-conditional-ui)).

---

## 17. Conditional attributes and classes

Conditionals apply to attribute values as much as to elements.

```jsx
<button
  className={`btn ${isActive ? 'btn--active' : ''}`}
  disabled={isSubmitting || !isValid}
  aria-pressed={isActive}
  aria-describedby={error ? 'field-error' : undefined}
>
  Save
</button>
```

Note `undefined` rather than `null` or `''` for "omit this attribute": React
drops attributes whose value is `undefined`, whereas `aria-describedby=""`
renders an empty attribute that assistive technology may treat as a broken
reference.

For class names, the array pattern stays readable as conditions multiply:

```jsx
<article
  className={[
    'card',
    isSelected && 'card--selected',
    product.stock === 0 && 'card--unavailable',
    isCompact && 'card--compact',
  ].filter(Boolean).join(' ')}
/>
```

`.filter(Boolean)` drops the `false` entries — a small trick that relies on
`false` being falsy and `Boolean` being a function that returns its argument's
truthiness ([Module 1 §6](../01-javascript-foundations/#6-truthiness-equality-and-the-falsy-traps)).
Past three or four conditions, `clsx` earns its place.

### Conditionally spreading props

```jsx
<input
  {...(isRequired && { required: true, 'aria-required': true })}
/>
```

Legal, occasionally useful, and easy to overuse. Two explicit attributes are
usually clearer.

---

## 18. Accessibility of conditional UI

Conditional rendering is where a11y most often quietly breaks, because content
appearing is not the same as content being *announced*.

**Announce async changes.** A screen reader user gets no notification when a
list swaps from skeleton to results unless you put it in a live region:

```jsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {status === 'ready' && `${products.length} products found`}
  {status === 'error' && 'Could not load products'}
</div>
```

**Do not remove focus out from under someone.** If the element with focus
unmounts — a button inside a section you just hid — focus falls back to
`<body>`, and keyboard users lose their place. Move focus deliberately
([Module 11](../11-refs-and-the-dom/)).

**Loading state on the trigger, not just the region.** A submit button should
carry `disabled` and an accessible label change (`Saving…`) so the state is
perceivable where the user acted.

**Errors need to be associated, not merely nearby.** `aria-describedby` pointing
at the error element, plus `aria-invalid` on the input
([Module 10](../10-forms/)).

**`hidden` vs not rendering.** `{cond && <X />}` removes the element entirely,
which is usually right. Rendering it with `hidden` keeps its state and DOM — the
right choice for a tab panel you want to preserve, and the wrong choice for a
modal that should not exist when closed.

---

## 19. Self-check

1. Name the four ways to render conditionally, and give the situation each is
   best for.
2. Why does `{cartCount && <Badge />}` render a `0`, and why does
   `{name && <Badge />}` not render anything when `name` is `''`?
3. Give three fixes for the `0` bug and say which you prefer and why.
4. Why is `return null` better than returning a `<div style={{display:'none'}}>`?
5. Rewrite three nested ternaries as something more readable, two different ways.
6. Why does `{items.forEach(…)}` render nothing, and what should it be?
7. In your own words: what question does `key` answer, and what three things does
   it therefore control?
8. Must keys be globally unique? Explain.
9. Explain precisely why `key={index}` breaks a reorderable list of inputs.
   What does React do, step by step?
10. Why is `key={Math.random()}` wrong even though the keys are unique?
11. Give the three conditions under which `key={index}` is acceptable.
12. Your API returns rows with no id. Give three approaches, in order of
    preference.
13. When must you write `<Fragment key={…}>` instead of `<>`?
14. Why must `key` go on the element returned by `map`, not inside the component?
15. Why should a filtered list be computed during render rather than stored in
    state?
16. What is wrong with `products.sort(…)` inside a component? Give two fixes.
17. Name the four states of a data-driven list, and describe the bug caused by
    conflating two of them.
18. Why `aria-describedby={error ? 'id' : undefined}` rather than `: ''`?
19. When would you render a hidden element instead of not rendering it?

### Practical

1. Build the reorder bug from [§9](#9-key-the-bug-you-must-see-once) with
   `key={index}`, reproduce it, then fix it. Do not skip this one.
2. Build a `<DataList>` that takes `status`, `items`, `error`, `renderItem`,
   `onRetry` and renders all four states correctly, with a skeleton that matches
   the loaded layout and a live region announcing the change.
3. Take a product list and add category filtering plus name/price sorting, all
   derived during render, with no mutation and no derived state.
4. Render an object of specs as a `<dl>`, and a 5-star rating from a number.

---

## 20. References

Official React documentation only.

**Conditional rendering**
- [Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [Logical AND operator (&&)](https://react.dev/learn/conditional-rendering#logical-and-operator-)
- [Conditionally returning nothing with null](https://react.dev/learn/conditional-rendering#conditionally-returning-nothing-with-null)
- [JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)

**Lists and keys**
- [Rendering Lists](https://react.dev/learn/rendering-lists)
- [Why does React need keys?](https://react.dev/learn/rendering-lists#why-does-react-need-keys)
- [Keeping list items in order with key](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [`<Fragment>` — keyed fragments](https://react.dev/reference/react/Fragment#rendering-a-list-of-fragments)

**Related**
- [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) — keys and component identity
- [Render and Commit](https://react.dev/learn/render-and-commit) — where reconciliation happens
- [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state) — why not to sort in place
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) — local mutation in a `for` loop is fine

---

**Previous:** [Module 5 — Props & Component Composition](../05-props-and-composition/)
**Next:** [Module 7 — State & Events](../07-state-and-events/)
