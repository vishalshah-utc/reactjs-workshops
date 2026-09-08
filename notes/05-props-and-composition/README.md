# Module 5 — Props & Component Composition

**Study notes** · ~2–3 hours

> **Goal.** Props are how data moves through a React app, and composition is how
> you keep components reusable as requirements pile up. By the end of this module
> you should be able to design a component's API deliberately — and recognise
> when a component's props list is telling you the design is wrong.

**Prerequisites:** [Module 1](../01-javascript-foundations/) §8 (destructuring),
§9 (spread and rest), §14 (functions as values).
[Module 4](../04-components-and-jsx/) for components and JSX.

---

## Contents

1. [Props are one object](#1-props-are-one-object)
2. [Destructuring props](#2-destructuring-props)
3. [Default values](#3-default-values)
4. [Passing every kind of value](#4-passing-every-kind-of-value)
5. [Props are read-only](#5-props-are-read-only)
6. [One-way data flow, and how events travel back up](#6-one-way-data-flow-and-how-events-travel-back-up)
7. [Naming props well](#7-naming-props-well)
8. [`children`](#8-children)
9. [Multiple slots](#9-multiple-slots)
10. [Props for data, children for structure](#10-props-for-data-children-for-structure)
11. [Spreading and forwarding props](#11-spreading-and-forwarding-props)
12. [Designing a component API](#12-designing-a-component-api)
13. [Composition patterns](#13-composition-patterns)
14. [Prop drilling: when it is fine and when it is not](#14-prop-drilling-when-it-is-fine-and-when-it-is-not)
15. [Do not copy props into state](#15-do-not-copy-props-into-state)
16. [Pass the narrowest data a component needs](#16-pass-the-narrowest-data-a-component-needs)
17. [`key` is not a normal prop](#17-key-is-not-a-normal-prop)
18. [Documenting and validating props](#18-documenting-and-validating-props)
19. [Self-check](#19-self-check)
20. [References](#20-references)

---

## 1. Props are one object

When you write attributes on a component tag, React collects them into a single
object and passes it as the function's first argument:

```jsx
<StockBadge stock={12} size="small" showLabel />
```

```jsx
function StockBadge(props) {
  console.log(props);
  // { stock: 12, size: 'small', showLabel: true }
  return <span className={`badge badge--${props.size}`}>{props.stock} left</span>;
}
```

That is the entire mechanism. `props` is an ordinary JavaScript object, the
attribute names are its keys, and the values are whatever you passed. There is
no special props type, no schema, and no validation unless you add TypeScript
([Module 17](../17-typescript-with-react/)).

Two things follow immediately:

- **The order of attributes does not matter.** They are object keys.
- **A component always receives an object**, even when you pass nothing —
  `<StockBadge />` gives you `{}`, not `undefined`.

---

## 2. Destructuring props

Almost nobody writes `props.stock`. The idiomatic form destructures in the
parameter list ([Module 1 §8](../01-javascript-foundations/#8-destructuring)):

```jsx
function StockBadge({ stock, size, showLabel }) {
  return <span className={`badge badge--${size}`}>{stock} left</span>;
}
```

Why this is the default style, concretely:

- The component's **entire API is visible in one line** — you can read what it
  accepts without scanning the body.
- It removes the repetitive `props.` noise.
- Defaults and renaming come for free (below).

You still see `props` used whole in three situations, all legitimate:

```jsx
// 1. forwarding everything to a child or DOM element
function Button(props) {
  return <button className="btn" {...props} />;
}

// 2. a rest object for pass-through, with some props peeled off
function Button({ variant, ...rest }) {
  return <button className={`btn btn--${variant}`} {...rest} />;
}

// 3. logging or debugging
function Thing(props) {
  console.log(props);
  …
}
```

Form 2 is the one you will write most in real component libraries — see
[§11](#11-spreading-and-forwarding-props).

### Renaming and nesting

```jsx
function ProductRow({ product: { id, name, price }, onSelect }) {
  return <tr onClick={() => onSelect(id)}><td>{name}</td><td>{price}</td></tr>;
}
```

Legal, and use it sparingly. Once you destructure a nested object in the
parameter list you lose the ability to refer to `product` as a whole, and the
signature stops reading like an API. Prefer:

```jsx
function ProductRow({ product, onSelect }) {
  const { id, name, price } = product;      // destructure in the body if you like
  …
}
```

📖 [react.dev — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)

---

## 3. Default values

Use JavaScript's default parameter syntax:

```jsx
function StockBadge({ stock, size = 'medium', showLabel = true }) {
  …
}
```

Remember the rule from [Module 1 §8](../01-javascript-foundations/#8-destructuring):
**defaults fire for `undefined` only.**

```jsx
<StockBadge stock={5} />                    // size = 'medium'
<StockBadge stock={5} size={undefined} />   // size = 'medium'
<StockBadge stock={5} size={null} />        // size = null  ← the default does NOT apply
<StockBadge stock={5} size="" />            // size = ''    ← nor here
```

That `null` case causes real bugs when data comes from an API that returns
`null` for "not set". If `null` is a value your props can genuinely receive,
normalise it explicitly:

```jsx
function StockBadge({ stock, size }) {
  const resolvedSize = size ?? 'medium';    // ?? catches null AND undefined
  …
}
```

> **Legacy note.** Older code uses `Component.defaultProps = { size: 'medium' }`.
> It is deprecated for function components. Use default parameters.

---

## 4. Passing every kind of value

Any JavaScript value can be a prop. The braces are what get you out of "string
literal" mode.

```jsx
<Component
  title="Products"                       {/* string — quotes, no braces */}
  count={24}                             {/* number — braces required */}
  price={19.99}
  isActive                               {/* boolean true — shorthand */}
  isActive={true}                        {/* the same thing, explicit */}
  isDisabled={false}
  product={{ id: 1, name: 'Keyboard' }}  {/* object — note the double braces */}
  tags={['new', 'sale']}                 {/* array */}
  onSelect={handleSelect}                {/* function reference */}
  onDelete={() => remove(id)}            {/* inline function */}
  renderEmpty={() => <EmptyState />}     {/* function returning JSX */}
  icon={<TrashIcon />}                   {/* JSX as a value */}
  when={new Date()}                      {/* any object, including a Date */}
  nothing={null}
/>
```

Three details worth calling out.

**The double braces on objects are not special syntax.** The outer pair means
"an expression follows"; the inner pair is an object literal. Identical to:

```jsx
const product = { id: 1, name: 'Keyboard' };
<Component product={product} />
```

**A string does not need braces, and adding them changes nothing.**
`title="Products"` and `title={"Products"}` are the same. Prefer the quotes.

**Boolean shorthand only produces `true`.** There is no shorthand for `false` —
write `isDisabled={false}` or omit the prop entirely. And never
`isDisabled="false"`, which is a truthy string.

### Passing JSX as a prop

Because JSX is an expression ([Module 4 §5](../04-components-and-jsx/#5-what-jsx-is-and-what-it-compiles-to)),
elements are ordinary values you can pass around:

```jsx
function Field({ label, input, hint }) {
  return (
    <div className="field">
      <label>{label}</label>
      {input}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

<Field
  label="Email"
  input={<input type="email" name="email" />}
  hint="We never share it."
/>
```

This is the foundation of the slot pattern in [§9](#9-multiple-slots).

---

## 5. Props are read-only

A component must never modify its own props.

```jsx
function ProductCard({ product, tags }) {
  product.viewed = true;          // ✗ mutating a prop
  tags.push('seen');              // ✗ mutating a prop
  product = { …product };         // ✗ reassigning the parameter — pointless and confusing
  …
}
```

Why this is a hard rule rather than advice: the object you received belongs to
the parent (or to the parent's state). Mutating it changes data React does not
know changed, so the parent will not re-render, the screen will disagree with
the data, and the bug will be invisible until something else re-renders for an
unrelated reason. It also breaks purity
([Module 4 §15](../04-components-and-jsx/#15-components-must-be-pure)), so Strict
Mode's double render can produce doubled effects — a tag pushed twice, a counter
incremented twice.

**What to do instead**, depending on what you actually want:

| You want | Do this |
|---|---|
| A modified copy for rendering | Derive it locally: `const upper = name.toUpperCase()` |
| To change the value for everyone | Call a callback prop: `onViewed(product.id)` — the owner updates its state |
| A value that changes only here | Local state: `useState` ([Module 7](../07-state-and-events/)) |

```jsx
function ProductCard({ product, onViewed }) {
  const displayName = product.name.toUpperCase();   // ✓ a derived local value
  return (
    <article>
      <h2>{displayName}</h2>
      <button onClick={() => onViewed(product.id)}>Mark viewed</button>
      {/*                    ▲ ask the owner to change its own data */}
    </article>
  );
}
```

---

## 6. One-way data flow, and how events travel back up

Data flows **down** the tree through props. Nothing flows up. When a child needs
to cause a change, the parent hands it a function to call.

```jsx
function ProductGrid({ products, onAddToCart }) {
  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAddToCart} />
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button onClick={() => onAdd(product.id)}>Add to cart</button>
    </article>
  );
}
```

```
        App  ─── owns the cart state
         │
    products, onAddToCart          ↑ onAddToCart(id)
         ▼                         │
    ProductGrid                    │
         │                         │
    product, onAdd                 │ onAdd(product.id)
         ▼                         │
    ProductCard  ──────────────────┘
```

The child does not know what `onAdd` does, whether it updates state, calls an
API, or logs to analytics. It only knows it should be called when the button is
clicked. That ignorance is the point: `ProductCard` is now usable on the
storefront, in a wishlist and in a back-office table, with a different `onAdd`
each time.

This constraint is why React apps stay debuggable at scale. When a value on
screen is wrong, it came from exactly one place — walk up the tree until you find
the owner. There is no possibility of some distant component having reached in
and changed it.

📖 [react.dev — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
📖 [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

---

## 7. Naming props well

Names are the API. A few conventions that are worth following because everyone
else follows them:

| Kind | Convention | Example |
|---|---|---|
| Event callback (prop) | `on` + noun/verb | `onSelect`, `onAddToCart`, `onClose` |
| Event handler (implementation) | `handle` + the same | `handleSelect`, `handleClose` |
| Boolean | `is`/`has`/`can`/`should` | `isLoading`, `hasError`, `canEdit` |
| Render function | `render` + noun | `renderEmpty`, `renderRow` |
| A variant among several | one prop, a union of values | `variant="ghost"`, `size="sm"` |
| The main data | the domain noun | `product`, `order`, `items` |

```jsx
function ProductCard({ product, onAdd }) { … }        // the component names the prop

function ProductGrid({ products }) {
  function handleAdd(id) { … }                        // the owner names the handler
  return <ProductCard product={p} onAdd={handleAdd} />;
}
```

Two anti-patterns to recognise:

**Booleans that should be a union.** Six booleans allow 64 combinations, most of
which are nonsense (`isPrimary` *and* `isGhost`?). One `variant` prop allows
exactly the states you meant:

```jsx
// ✗
<Button isPrimary isLarge isGhost isDanger />

// ✓
<Button variant="danger" size="lg" />
```

**Names that describe the implementation rather than the intent.**
`onClick` on a `<ProductCard>` is worse than `onAdd` — it tells the parent
*how* the child is operated instead of *what happened*, and it breaks the moment
the trigger becomes a keyboard shortcut or a swipe.

---

## 8. `children`

Anything between a component's tags arrives as the `children` prop.

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <h2>Mechanical Keyboard</h2>
  <p>Tactile, hot-swappable, 87 keys.</p>
</Card>
```

`children` is a normal prop with special syntax. These two are equivalent:

```jsx
<Card>Hello</Card>
<Card children="Hello" />       {/* legal, and nobody writes this */}
```

Its value depends on what you pass: a string for one text child, a single
element for one element, an **array** for several. Do not write code that
assumes any particular shape — just render `{children}`.

### Why this matters so much

Without `children`, a reusable wrapper is impossible. Compare:

```jsx
// ✗ configuration — Card must know about every possible content shape
function Card({ title, body, imageUrl, footerText, badgeCount, ctaLabel, onCta }) {
  …
}

// ✓ composition — Card knows about padding and a border. That's it.
function Card({ children }) {
  return <div className="card">{children}</div>;
}
```

The first version gains a prop every time someone needs a card that is slightly
different, until it has twenty props and three mutually exclusive modes. The
second version never changes.

### `children` renders where you put it

You are not obliged to render `children` once, or at all:

```jsx
function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>{label}</button>
      {open && children}          {/* rendered conditionally */}
    </section>
  );
}
```

> **A detail for later.** Note that `children` passed from the parent is created
> in the *parent's* render, so it does not re-create when `Collapsible`'s own
> state changes. That property makes `children` a performance tool as well as a
> composition tool — [Module 15](../15-performance/) returns to it.

📖 [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)

---

## 9. Multiple slots

`children` is one slot. When a component has several distinct regions, give each
one a JSX-valued prop:

```jsx
function Panel({ header, children, footer }) {
  return (
    <section className="panel">
      {header && <div className="panel__header">{header}</div>}
      <div className="panel__body">{children}</div>
      {footer && <div className="panel__footer">{footer}</div>}
    </section>
  );
}

<Panel
  header={<h2>Order #1042</h2>}
  footer={<Button onClick={handleRefund}>Refund</Button>}
>
  <OrderLines lines={order.lines} />
</Panel>
```

Conventions that keep this readable:

- The **main content stays `children`**. Do not turn everything into named
  props — `<Panel body={…} />` reads worse and nests worse.
- **Guard optional slots** (`{header && …}`) so the wrapper markup disappears
  when the slot is unused, rather than leaving an empty styled div.
- Name slots by **position or role**, not by content: `header`, `footer`,
  `actions`, `aside` — not `titleText`, `refundButton`.

### Slot props vs render props

If a slot needs data the component owns, pass a **function** instead of an
element:

```jsx
function DataList({ items, renderItem, renderEmpty }) {
  if (items.length === 0) return renderEmpty();
  return <ul>{items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}

<DataList
  items={products}
  renderItem={(p) => <ProductRow product={p} />}
  renderEmpty={() => <EmptyState message="No products" />}
/>
```

The caller decides what a row looks like; `DataList` owns the loop, the keys and
the empty state. This is the **render prop** pattern, covered further in
[Module 16](../16-advanced-patterns/).

---

## 10. Props for data, children for structure

A useful default when you are unsure which to reach for:

> **Props** carry *data and behaviour* the component reasons about.
> **`children`/slots** carry *markup* the component only positions.

```jsx
<ProductCard product={product} onAdd={handleAdd}>   {/* data + behaviour as props */}
  <PromoRibbon>New</PromoRibbon>                     {/* markup as children */}
</ProductCard>
```

The test: does the component need to *look at* the value to do its job? A
`stock` number decides which badge to show — that is data, so it is a prop. A
promotional ribbon is positioned and never inspected — that is markup, so it is
a child.

Getting this backwards produces the two most common component-API smells:

- **Markup as data:** `<Card titleHtml="<h2>Hi</h2>" />` — now you need
  `dangerouslySetInnerHTML` and you have lost type safety and escaping.
- **Data as markup:** `<StockBadge><span>{stock}</span></StockBadge>` — the badge
  can no longer decide the "out of stock" variant, because it cannot see the
  number.

---

## 11. Spreading and forwarding props

A wrapper component usually needs to accept whatever the underlying element
accepts. Rest + spread ([Module 1 §9](../01-javascript-foundations/#9-spread-and-rest))
does it:

```jsx
function Button({ variant = 'primary', size = 'md', ...rest }) {
  return <button className={`btn btn--${variant} btn--${size}`} {...rest} />;
}

<Button variant="ghost" onClick={handleClose} disabled={busy} aria-label="Close">
  ×
</Button>
```

`variant` and `size` are consumed by `Button`; `onClick`, `disabled` and
`aria-label` land on the real `<button>`. Without this, every wrapper would need
to enumerate the fifty attributes a button might take.

### Order matters

Spread position decides who wins:

```jsx
<button {...rest} className="btn" />     {/* className always "btn" — caller cannot override */}
<button className="btn" {...rest} />     {/* caller's className REPLACES "btn" — usually a bug */}
```

Neither is right for `className`. Merge it explicitly:

```jsx
function Button({ variant = 'primary', className = '', ...rest }) {
  return (
    <button
      {...rest}
      className={`btn btn--${variant} ${className}`.trim()}
    />
  );
}
```

Same problem applies to `onClick` when the wrapper has its own behaviour — call
both:

```jsx
function TrackedButton({ onClick, trackingId, ...rest }) {
  function handleClick(event) {
    analytics.track(trackingId);
    onClick?.(event);                    // ✓ don't swallow the caller's handler
  }
  return <button {...rest} onClick={handleClick} />;
}
```

### The cost of unrestricted spreading

Spreading is a sharp tool. In a design system it lets any caller pass anything —
inline `style`, a conflicting `role`, an `id` that breaks your internal `aria`
wiring — so your component can no longer guarantee its own accessibility or
appearance. Two mitigations:

- Spread onto **one** element, never several ("which one got the `id`?").
- In a strict design system, **enumerate** the props you support instead of
  spreading, and add new ones deliberately.

And never forward props blindly between *your own* components:

```jsx
function ProductCard(props) {
  return <Card {...props} />;    // ✗ what does Card receive? Nobody knows.
}
```

That erases the API of both components. Spread onto DOM elements; be explicit
between your own.

📖 [react.dev — Forwarding props with the JSX spread syntax](https://react.dev/learn/passing-props-to-a-component#forwarding-props-with-the-jsx-spread-syntax)

---

## 12. Designing a component API

Props are a public interface. Treat them like one.

### Signals a props list has gone wrong

| Smell | What it means | Fix |
|---|---|---|
| More than ~7 props | The component does several jobs | Split it, or move markup to `children` |
| Several booleans that are really one choice | Invalid combinations are representable | One `variant`/`status` union |
| `isX` plus `xValue` plus `onXChange` × 4 | Several features crammed together | Separate components |
| A prop only used to pass to a child | Prop drilling | Composition, or Context ([§14](#14-prop-drilling-when-it-is-fine-and-when-it-is-not)) |
| `type="a" \| "b"` and the branches share nothing | Two components wearing one name | Two components |
| A `config` object prop | Avoiding the design question | Real named props |
| `renderX` for every region | Reinventing children | Slots |

### Make invalid states unrepresentable

The strongest design move available is choosing props that cannot express a
nonsense state:

```jsx
// ✗ eight combinations, five of them meaningless
<DataPanel isLoading isError isEmpty data={data} error={error} />

// ✓ exactly four states, each carrying only what it needs
<DataPanel status="loading" />
<DataPanel status="error" error={error} />
<DataPanel status="empty" />
<DataPanel status="ready" data={data} />
```

This pairs with a discriminated union in TypeScript
([Module 17](../17-typescript-with-react/)), where the compiler then refuses the
invalid calls. Even in plain JavaScript the shape is better: one `switch` on
`status`, no ambiguity about precedence when two booleans are true at once.

### Prefer composition to configuration

When a component grows options, ask whether the caller could just pass the
markup instead:

```jsx
// configuration — grows forever
<Modal
  title="Delete product?"
  body="This cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  confirmVariant="danger"
  showCloseButton
  size="sm"
  onConfirm={…}
  onCancel={…}
/>

// composition — Modal owns behaviour (focus trap, escape, overlay); the caller owns content
<Modal onClose={handleCancel}>
  <Modal.Title>Delete product?</Modal.Title>
  <Modal.Body>This cannot be undone.</Modal.Body>
  <Modal.Actions>
    <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
    <Button variant="danger" onClick={handleConfirm}>Delete</Button>
  </Modal.Actions>
</Modal>
```

The second version stops changing. The next design that needs a checkbox in the
footer, or two confirm buttons, or a form in the body, needs no new props.

That said — configuration is right when the variation is genuinely small and
closed. A `<Button variant size>` should not be a compound component. The
question is whether you can enumerate the variations once and be done.

---

## 13. Composition patterns

Five patterns that cover most day-to-day work.

### 13.1 Wrapper / layout

Owns spacing and structure, knows nothing about content:

```jsx
function PageLayout({ title, actions, children }) {
  return (
    <div className="page">
      <header className="page__header">
        <h1>{title}</h1>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
      <main className="page__body">{children}</main>
    </div>
  );
}
```

### 13.2 Specialisation

A general component with some props pre-decided:

```jsx
function Button({ variant = 'primary', ...rest }) { … }

const DangerButton = (props) => <Button variant="danger" {...props} />;
const GhostButton  = (props) => <Button variant="ghost" {...props} />;
```

Useful when a variant is used in fifty places and you want one place to change
it. Not useful as a reflex — three specialisations of a two-variant button is
churn.

### 13.3 Container / presentational

Split "where the data comes from" away from "what it looks like":

```jsx
// presentational — pure, trivially testable, reusable, no data source
function ProductGrid({ products, onAdd }) {
  return (
    <div className="grid">
      {products.map((p) => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
    </div>
  );
}

// container — owns fetching and state
function ProductGridContainer() {
  const { data, status } = useProducts();
  const { add } = useCart();
  if (status === 'loading') return <GridSkeleton />;
  return <ProductGrid products={data} onAdd={add} />;
}
```

Hooks made the strict version of this pattern unnecessary — a component can own
its own data with one line. But the underlying idea still earns its keep: the
presentational component is the one you can render in a test, a Storybook story,
or a different screen.

### 13.4 Compound components

Several components sharing implicit state through context, so the caller
composes them freely:

```jsx
<Tabs defaultValue="details">
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
    <Tabs.Trigger value="reviews">Reviews</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="details"><ProductDetails /></Tabs.Panel>
  <Tabs.Panel value="reviews"><Reviews /></Tabs.Panel>
</Tabs>
```

Built in [Module 16](../16-advanced-patterns/), once Context is available from
[Module 9](../09-reducers-and-context/).

### 13.5 Passing components as props

When the caller should decide *what* renders, not just what it contains:

```jsx
function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="empty">
      <Icon className="empty__icon" />       {/* note the capitalised alias */}
      <p>{message}</p>
      {action}
    </div>
  );
}

<EmptyState icon={SearchIcon} message="No results" action={<Button>Reset</Button>} />
```

The rename `{ icon: Icon }` matters — a lowercase `icon` used as `<icon />` would
be treated as an HTML tag
([Module 4 §2](../04-components-and-jsx/#2-capitalisation-is-syntax-not-style)).

---

## 14. Prop drilling: when it is fine and when it is not

**Prop drilling** is passing a prop through components that do not use it, only
to reach one that does.

```jsx
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} />;              // Layout doesn't use it
}
function Layout({ user }) {
  return <Sidebar user={user} />;             // Sidebar doesn't use it
}
function Sidebar({ user }) {
  return <UserMenu user={user} />;            // finally
}
```

**One or two levels is fine.** It is explicit, easy to trace, and needs no
machinery. Do not reach for Context to save one hop.

It becomes a problem when: the chain is four or more levels; the intermediate
components' signatures are noise; or many separate values are being drilled
through the same path.

### Fix 1 — composition (try this first)

Often the value does not need to travel at all. Pass the *rendered element*
down instead of the data:

```jsx
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout sidebar={<Sidebar userMenu={<UserMenu user={user} />} />} />
  );
}
function Layout({ sidebar }) { return <div className="layout">{sidebar}</div>; }
function Sidebar({ userMenu }) { return <aside>{userMenu}</aside>; }
```

`Layout` and `Sidebar` no longer mention `user` at all. `UserMenu` is created
where the data lives. This is the most underused fix in React, and it costs
nothing at runtime.

### Fix 2 — move the state

Sometimes the state is simply in the wrong place. If only one subtree needs it,
push it down to the closest common owner of the components that care
([Module 8](../08-state-structure/)).

### Fix 3 — Context

For values genuinely needed by many components at many depths — the current
user, the theme, the locale, the cart — Context is the right tool:

```jsx
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext value={user}>
      <Layout />
    </UserContext>
  );
}

function UserMenu() {
  const user = useContext(UserContext);       // no props, any depth
  …
}
```

Context has real costs — implicit data flow, harder testing, re-render
behaviour — so it is Module 9's subject, not a shortcut to reach for on day one.

📖 [react.dev — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

---

## 15. Do not copy props into state

A mistake so common it deserves its own section:

```jsx
function ProductForm({ product }) {
  const [name, setName] = useState(product.name);    // ✗ a snapshot, frozen forever
  …
}
```

`useState` uses its argument **only on the first render**
([Module 7](../07-state-and-events/)). If the parent later passes a different
`product`, `name` keeps the old value and the form silently shows stale data.

What to do instead, depending on intent:

**If the value is fully controlled by the parent** — do not use state at all:

```jsx
function ProductForm({ product, onChange }) {
  return <input value={product.name} onChange={(e) => onChange(e.target.value)} />;
}
```

**If the component genuinely owns an editable draft** — use the prop as the
initial value, and remount the component when the identity changes, with a
`key`:

```jsx
<ProductForm key={product.id} product={product} />
```

A different `key` means a different component instance, so state resets. This is
the idiomatic React answer, and it is covered properly in
[Module 8](../08-state-structure/).

**If the value is derived from props** — compute it, do not store it:

```jsx
function OrderTotal({ lines }) {
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);   // ✓ derived
  return <strong>{formatPrice(total)}</strong>;
}
```

Storing derived values in state guarantees they will eventually disagree with
their source.

📖 [react.dev — Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
📖 [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

## 16. Pass the narrowest data a component needs

Compare:

```jsx
<StockBadge product={product} />      {/* needs a whole product */}
<StockBadge stock={product.stock} />  {/* needs a number */}
```

The second is better, for reasons that compound:

- **Reusable.** A cart line, an inventory row and a back-office table all have a
  stock level; none of them is a `product`.
- **Obvious.** The signature says exactly what the component reads.
- **Testable.** `render(<StockBadge stock={0} />)` versus constructing a fixture
  product with twelve fields.
- **Fewer re-renders.** With `memo`, a number changes far less often than an
  object identity ([Module 15](../15-performance/)).

The counter-pressure is real: a component that needs six fields is better off
taking the object than six props.

```jsx
<ProductCard product={product} />          {/* ✓ needs name, price, discount, stock, image, id */}
<ProductCard name={…} price={…} … />       {/* ✗ six props that always travel together */}
```

The rule of thumb: **pass the object when the component is *about* that object;
pass fields when it is about a smaller idea.** `ProductCard` is about a product.
`StockBadge` is about a stock level.

---

## 17. `key` is not a normal prop

```jsx
{products.map((p) => <ProductCard key={p.id} product={p} />)}
```

`key` looks like a prop but is not one:

- It is **not** in `props` — `function ProductCard({ key })` gets `undefined`.
- React uses it internally, during reconciliation, to match elements between
  renders.
- It controls **component identity**, and therefore whether state is preserved
  or reset.

`ref` is the other prop with special handling (React 19 made it a normal prop
for function components — [Module 11](../11-refs-and-the-dom/)).

If you need the id inside the component, pass it twice:

```jsx
<ProductCard key={p.id} id={p.id} product={p} />
```

Full treatment of keys in [Module 6](../06-conditional-rendering-and-lists/), and
of the reset behaviour in [Module 8](../08-state-structure/).

---

## 18. Documenting and validating props

Plain JavaScript gives you no checking at all: pass a string where a number was
expected and you find out when the page looks wrong.

**TypeScript is the answer** ([Module 17](../17-typescript-with-react/)):

```tsx
type ButtonProps = {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
} & React.ComponentProps<'button'>;

function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) { … }
```

This is documentation and validation in one, checked in your editor before you
save.

You may still meet **`prop-types`** in older codebases — a runtime checker that
warned in development. It is no longer bundled with React and is not worth
adding to a new project; if a codebase has it, treat it as documentation and
migrate to TypeScript when you touch the file.

Whatever the type system, a short comment above a non-obvious prop is still
worth writing:

```jsx
function DataList({
  items,
  // Called with the item's id. Return false to prevent selection.
  onBeforeSelect,
}) { … }
```

---

## 19. Self-check

1. What exactly does a component receive as its first argument, and what does
   it receive when you pass no props at all?
2. Rewrite `function C(props)` with destructuring, a default for `size`, and a
   rest object for pass-through.
3. Why does `size = 'medium'` not apply when the parent passes `size={null}`?
   What catches both cases?
4. Explain the double braces in `product={{ id: 1 }}`.
5. Why is `disabled="false"` a bug?
6. Give three things a component should do *instead* of mutating a prop, and say
   when each applies.
7. Data flows down. Describe precisely how a click in a leaf component ends up
   changing state owned six levels up.
8. Convert `<Button isPrimary isLarge isGhost />` into a better API and say what
   invalid states you eliminated.
9. When is `<Card>{children}</Card>` better than `<Card body={…} />`? When is a
   named slot better than `children`?
10. Give the test for deciding whether a value should be a prop or a child.
11. What is wrong with `<button {...rest} className="btn" />`? And with
    `<button className="btn" {...rest} />`? Write the version that works.
12. Why is spreading props between two of *your own* components worse than
    spreading onto a DOM element?
13. You have `user` drilled through four components. Give three different fixes
    and say which you would try first, and why.
14. `const [name, setName] = useState(product.name)` — describe the bug, and give
    two correct alternatives depending on intent.
15. Why is `<StockBadge stock={product.stock} />` usually better than
    `<StockBadge product={product} />`, and when does that reasoning reverse?
16. Why can't a component read its own `key`?

### Practical

Take this component and redesign its API. It should end up with fewer props, no
representable invalid states, and content supplied by composition:

```jsx
function ProductPanel({
  title, subtitle, imageUrl, price, discountPercent, stock,
  showBadge, showPrice, showImage, isCompact, isLoading, isError,
  errorMessage, ctaLabel, ctaVariant, onCtaClick, footerNote,
}) { … }
```

---

## 20. References

Official React documentation only.

**Props**
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Forwarding props with the JSX spread syntax](https://react.dev/learn/passing-props-to-a-component#forwarding-props-with-the-jsx-spread-syntax)
- [Your First Component](https://react.dev/learn/your-first-component)
- [Describing the UI](https://react.dev/learn/describing-the-ui)

**Composition and data flow**
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [Thinking in React](https://react.dev/learn/thinking-in-react)

**Rules that constrain props**
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) — props vs state, derived values
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — syncing props into state
- [Common components — the DOM props you forward](https://react.dev/reference/react-dom/components/common)
- [Using TypeScript](https://react.dev/learn/typescript) — typing props

---

**Previous:** [Module 4 — Describing the UI: Components & JSX](../04-components-and-jsx/)
**Next:** [Module 6 — Conditional Rendering & Lists](../06-conditional-rendering-and-lists/)
