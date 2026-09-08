# Module 4 — Describing the UI: Components & JSX

**Study notes** · ~2–3 hours

> **Goal.** Become fluent in the two things you will type more than anything
> else in React: components and JSX. By the end you should be able to look at
> any JSX and know what JavaScript it becomes, why each rule exists, and what
> React will actually put on the screen.

**Prerequisites:** [Module 1](../01-javascript-foundations/) §5 (expressions vs
statements), §15 (modules), §22 (purity). [Module 2](../02-react-introduction/)
for the mental model.

---

## Contents

1. [What a component actually is](#1-what-a-component-actually-is)
2. [Capitalisation is syntax, not style](#2-capitalisation-is-syntax-not-style)
3. [Files, exports and imports](#3-files-exports-and-imports)
4. [Organising components in a real project](#4-organising-components-in-a-real-project)
5. [What JSX is, and what it compiles to](#5-what-jsx-is-and-what-it-compiles-to)
6. [The rules of JSX](#6-the-rules-of-jsx)
7. [Attributes: the differences from HTML](#7-attributes-the-differences-from-html)
8. [Inline styles](#8-inline-styles)
9. [Curly braces: where they are legal and what goes in them](#9-curly-braces-where-they-are-legal-and-what-goes-in-them)
10. [What renders and what does not](#10-what-renders-and-what-does-not)
11. [Fragments](#11-fragments)
12. [Nesting, composition and the UI tree](#12-nesting-composition-and-the-ui-tree)
13. [`children`: a first look](#13-children-a-first-look)
14. [Extracting components: when and how](#14-extracting-components-when-and-how)
15. [Components must be pure](#15-components-must-be-pure)
16. [Where React elements come from: `createElement`](#16-where-react-elements-come-from-createelement)
17. [Common errors and what they mean](#17-common-errors-and-what-they-mean)
18. [Self-check](#18-self-check)
19. [References](#19-references)

---

## 1. What a component actually is

A React component is **a JavaScript function that returns markup**. There is no
class to extend, no interface to implement, no registration step. If it is a
function, it returns JSX, and its name starts with a capital letter, React will
treat it as a component.

```jsx
function StockBadge() {
  return <span className="badge">In stock</span>;
}
```

That is a complete, valid, useful React component. Everything else — props,
state, hooks, effects — is added on top of this shape.

You can write it in any of the function forms from
[Module 1 §3](../01-javascript-foundations/#3-functions-arrow-functions-and-this):

```jsx
// function declaration — the most common, and hoisted
function StockBadge() {
  return <span className="badge">In stock</span>;
}

// arrow with a block body
const StockBadge = () => {
  return <span className="badge">In stock</span>;
};

// arrow with an implicit return — fine for tiny presentational components
const StockBadge = () => <span className="badge">In stock</span>;

// implicit return of multi-line JSX needs parentheses
const StockBadge = () => (
  <span className="badge">
    In stock
  </span>
);
```

All four are equivalent to React. Pick one convention per codebase. A common
professional default is `function` declarations for components (they hoist, they
show a real name in stack traces and DevTools without extra work, and they read
as declarations rather than assignments) and arrows for everything else.

> **The `{ }` vs `( )` trap.** `const C = () => { <div /> }` returns
> `undefined`, because `{` starts a block. React then renders nothing and gives
> you no error. If a component mysteriously renders nothing, check this first.

### Using a component

Once defined, you use it as a tag:

```jsx
function ProductCard() {
  return (
    <article>
      <h2>Mechanical Keyboard</h2>
      <StockBadge />
    </article>
  );
}
```

`<StockBadge />` means "call `StockBadge` and put its output here". You never
call it yourself — `StockBadge()` would work mechanically but bypasses React
entirely: no state, no hooks, no place in the component tree, invisible in
DevTools. Always use the tag.

📖 [react.dev — Your First Component](https://react.dev/learn/your-first-component)

---

## 2. Capitalisation is syntax, not style

JSX decides between "HTML element" and "your component" **by the first letter**.

```jsx
<span />        // lowercase → the DOM element <span>
<StockBadge />  // uppercase → your component StockBadge
```

This is a hard rule of the language, not a convention you can opt out of. Get it
wrong and the failure is quiet:

```jsx
function stockBadge() {                 // ✗ lowercase name
  return <span>In stock</span>;
}

function ProductCard() {
  return <stockBadge />;                // React emits a literal <stockbadge> tag
}
```

The browser accepts unknown tags silently, so you get an empty element, no
error, and a confusing DevTools tree. React will usually warn
(`The tag <stockBadge> is unrecognized in this browser`), but the warning is
easy to miss.

Two related rules:

- **Dotted names are allowed** — `<Tabs.List />` works, and `Tabs.List` is
  looked up as a property. This is how compound components
  ([Module 16](../16-advanced-patterns/)) are built.
- **A component held in a variable must be capitalised at the point of use**:

```jsx
const components = { badge: StockBadge };

<components.badge />        // ✓ dotted access is fine
const Chosen = components.badge;
<Chosen />                 // ✓ capitalised variable
```

---

## 3. Files, exports and imports

One component per file is the default for anything reusable. The file name
matches the component name.

```jsx
// src/components/StockBadge.jsx
export function StockBadge() {
  return <span className="badge">In stock</span>;
}
```

```jsx
// src/components/ProductCard.jsx
import { StockBadge } from './StockBadge';

export function ProductCard() {
  return (
    <article>
      <h2>Mechanical Keyboard</h2>
      <StockBadge />
    </article>
  );
}
```

### Named vs default exports

```jsx
// named export — the import name must match
export function StockBadge() { … }
import { StockBadge } from './StockBadge';

// default export — the import name is arbitrary
export default function StockBadge() { … }
import StockBadge from './StockBadge';
import AnythingAtAll from './StockBadge';    // ✓ compiles, and is a real hazard
```

Both work. The trade-offs, stated honestly:

| | Named | Default |
|---|---|---|
| Import name | Fixed — enforced by the tool | Arbitrary — typos become new names |
| Editor auto-import | Reliable | Less reliable |
| Rename refactor | Updates every import site | Often misses import sites |
| Multiple exports per file | Natural | Awkward (one default + named) |
| Framework requirements | — | Some frameworks require a default (e.g. a Next.js `page`) |

**Recommendation:** named exports everywhere, except where a framework demands
a default. Then the name of a thing is the same in every file that uses it,
which is worth more than the two saved characters.

### More than one component per file

Legal, and sometimes right. A small helper used only by its neighbour can live
in the same file, unexported:

```jsx
// ProductCard.jsx
function Price({ cents }) {                      // private to this file
  return <span className="price">${(cents / 100).toFixed(2)}</span>;
}

export function ProductCard({ product }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <Price cents={product.price} />
    </article>
  );
}
```

The rule of thumb: colocate while it has exactly one consumer; extract to its
own file the moment a second file needs it.

### Never define a component inside another component

```jsx
function ProductCard({ product }) {
  function Price() {                     // ✗ redefined on every render
    return <span>{product.price}</span>;
  }
  return <><h2>{product.name}</h2><Price /></>;
}
```

This "works" and is a real bug. Each render creates a *new* `Price` function, so
React sees a different component type at that position and destroys and
recreates the whole subtree — losing its state, its DOM nodes, its focus, and
any animation in progress. Define components at the top level of a module,
always. ([Module 8](../08-state-structure/) covers why identity at a tree
position determines state.)

📖 [react.dev — Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)

---

## 4. Organising components in a real project

There is no official React answer here, so here is a structure that scales and
the reasoning behind it.

```
src/
├── components/            shared, presentational, feature-agnostic
│   ├── ui/                design-system primitives (Button, Input, Card, Badge)
│   └── layout/            AppShell, SiteHeader, SiteFooter
├── features/              one folder per business capability
│   ├── catalog/
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── useProducts.js
│   │   └── api.js
│   └── cart/
│       ├── CartSheet.jsx
│       ├── cartReducer.js
│       └── useCart.js
├── lib/                   framework-agnostic helpers (formatters, http client)
├── hooks/                 genuinely generic hooks (useDebounce, useMediaQuery)
└── App.jsx
```

Two principles do the real work:

**Group by feature, not by file type.** A `components/` folder holding 200 files
tells you nothing about the app. `features/cart/` tells you where the cart is,
and makes it obvious when the cart starts reaching into the catalogue's
internals.

**Point dependencies one way.** `features/*` may import from `components/`,
`lib/` and `hooks/`. The reverse is a mistake — the moment a shared `Button`
imports from `features/cart/`, "shared" stops being true. This is the single
rule that keeps a codebase from turning into a graph nobody can reason about.

On **barrel files** (`index.js` re-exporting a folder): they make imports
prettier and cost you real things — slower cold builds, worse tree-shaking, and
import cycles that are hard to diagnose. Use them for a stable public surface
like `components/ui/`, not reflexively for every folder.

---

## 5. What JSX is, and what it compiles to

JSX is a **syntax extension to JavaScript**. It is not HTML, it is not a
template language, and it is not a string. It is syntax that your build tool
converts into ordinary function calls.

```jsx
// what you write
const element = <h1 className="title">Hello</h1>;
```

```js
// what the compiler emits (React 17+ automatic runtime, simplified)
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('h1', { className: 'title', children: 'Hello' });
```

The call returns a plain object — a **React element** — describing what should
be on screen:

```js
{
  type: 'h1',
  key: null,
  props: { className: 'title', children: 'Hello' },
  // …plus internal fields
}
```

Three consequences follow from JSX being JavaScript, and they explain most of
its rules:

1. **It is an expression.** You can assign it to a variable, put it in an array,
   return it from a function, pass it as an argument, or store it in an object.
2. **All of JavaScript is available inside it**, via `{ }` — which is why
   [Module 1](../01-javascript-foundations/) came first.
3. **JavaScript's constraints apply.** `class` and `for` are reserved words, so
   JSX uses `className` and `htmlFor`. Every expression must produce one value,
   so a component returns one root element.

### An element is a description, not a DOM node

```jsx
const badge = <span className="badge">In stock</span>;
```

Nothing has been rendered. `badge` is a cheap, immutable object. React decides
later — during the render and commit phases from
[Module 2 §5](../02-react-introduction/#5-how-react-updates-the-screen) — what
DOM operations that description implies. Creating a thousand elements is cheap;
React only touches the DOM where the description changed.

Because elements are just values, this is completely normal React:

```jsx
const columns = [
  { key: 'name', header: 'Product', cell: (p) => <strong>{p.name}</strong> },
  { key: 'stock', header: 'Stock', cell: (p) => <StockBadge stock={p.stock} /> },
];
```

JSX stored in an array of config objects. No template language lets you do that.

📖 [react.dev — Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)

---

## 6. The rules of JSX

### 6.1 Return a single root element

An expression evaluates to one value, so a component returns one element.

```jsx
// ✗ Adjacent JSX elements must be wrapped in an enclosing tag
function Header() {
  return (
    <h1>ShopCrew</h1>
    <p>Everything for your desk</p>
  );
}

// ✓ a real wrapper, when you want the div
function Header() {
  return (
    <div className="header">
      <h1>ShopCrew</h1>
      <p>Everything for your desk</p>
    </div>
  );
}

// ✓ a fragment, when you do not want an extra DOM node
function Header() {
  return (
    <>
      <h1>ShopCrew</h1>
      <p>Everything for your desk</p>
    </>
  );
}
```

Fragments matter more than they look — see [§11](#11-fragments).

### 6.2 Close every tag

HTML forgives `<br>`, `<img src="…">` and an unclosed `<li>`. JSX does not.

```jsx
<br />
<hr />
<img src="/logo.svg" alt="ShopCrew" />
<input type="text" />
<li>Item</li>
```

### 6.3 Wrap multi-line JSX in parentheses

Not strictly a rule, but the consequence of omitting it is JavaScript's
automatic semicolon insertion, which turns your component into one that returns
`undefined`:

```jsx
// ✗ ASI inserts a semicolon after return — this returns undefined
return
  <div>Hello</div>;

// ✓
return (
  <div>Hello</div>
);
```

### 6.4 Comments use `{/* … */}`

```jsx
<div>
  {/* This is a JSX comment */}
  <h1>ShopCrew</h1>
  <p /* an attribute-position comment, valid but unusual */ />
</div>
```

`<!-- HTML comments -->` are a syntax error in JSX. Inside `{ }` you are in
JavaScript, so `//` and `/* */` work there.

### 6.5 Literal braces need escaping

To render an actual `{` character, pass it as a string:

```jsx
<code>{'{ count: 3 }'}</code>       // renders  { count: 3 }
<p>Use {'{'} to open a block</p>
```

### 6.6 Whitespace is meaningful, mostly

JSX trims leading and trailing whitespace on lines and collapses blank lines.
Which means this renders `HelloWorld`, with no space:

```jsx
<span>
  Hello
  World
</span>
```

When you need a space between two expressions, be explicit:

```jsx
<span>{firstName} {lastName}</span>        {/* ✓ literal space in the JSX */}
<span>{firstName}{' '}{lastName}</span>    {/* ✓ explicit — survives reformatting */}
<span>{`${firstName} ${lastName}`}</span>  {/* ✓ or build the string yourself */}
```

The `{' '}` form exists because Prettier may put your expressions on separate
lines, which would silently delete a literal space.

---

## 7. Attributes: the differences from HTML

JSX attribute names are **camelCase**, because they map to DOM properties rather
than HTML attributes.

| HTML | JSX | Why |
|---|---|---|
| `class` | `className` | `class` is a reserved JavaScript word |
| `for` | `htmlFor` | `for` is a reserved word |
| `tabindex` | `tabIndex` | camelCase property name |
| `onclick` | `onClick` | camelCase, and it takes a function not a string |
| `readonly` | `readOnly` | camelCase |
| `maxlength` | `maxLength` | camelCase |
| `colspan` | `colSpan` | camelCase |
| `stroke-width` (SVG) | `strokeWidth` | camelCase |
| `style="color: red"` | `style={{ color: 'red' }}` | an object, not a string |

The exceptions worth memorising: **`data-*` and `aria-*` keep their dashes.**

```jsx
<button
  className="btn"
  data-product-id={product.id}      {/* dashes kept */}
  aria-label="Add to cart"          {/* dashes kept */}
  aria-pressed={saved}              {/* a real boolean, not the string "true" */}
  tabIndex={0}
  onClick={handleAdd}
>
  Add
</button>
```

### Strings vs expressions

```jsx
<img src="/logo.svg" />                    {/* a literal string */}
<img src={product.imageUrl} />             {/* an expression */}
<img src={`/img/${product.slug}.webp`} />  {/* a template literal expression */}
<img src="{product.imageUrl}" />           {/* ✗ the literal 8 characters "{produ…" */}
```

### Booleans

```jsx
<input disabled />                {/* shorthand for disabled={true} */}
<input disabled={true} />
<input disabled={isSubmitting} />
<input disabled={false} />        {/* React omits the attribute entirely */}
```

Do **not** write `disabled="false"` — a non-empty string is truthy, so the input
is disabled. This is a genuinely common bug.

📖 [react.dev — Common components (`<div>`, props)](https://react.dev/reference/react-dom/components/common)

---

## 8. Inline styles

`style` takes an **object**, with camelCased CSS properties and string values
(numbers are assumed to be pixels where that makes sense):

```jsx
<div style={{ backgroundColor: 'tomato', paddingTop: 16, fontSize: '1.25rem' }} />
```

The double braces are not special syntax — the outer pair is "an expression
follows", the inner pair is an object literal. Same thing as:

```jsx
const cardStyle = { backgroundColor: 'tomato', paddingTop: 16 };
<div style={cardStyle} />
```

CSS custom properties keep their dashes and must be strings:

```jsx
<div style={{ '--card-accent': product.color }} />
```

**Prefer classes to inline styles.** Inline styles cannot do media queries,
pseudo-classes (`:hover`, `:focus-visible`) or pseudo-elements, they create a
new object every render (which matters for `memo` —
[Module 15](../15-performance/)), and they are hard to override. Use them for
genuinely dynamic values: a computed width, a progress percentage, a colour
coming from data.

```jsx
<div className="progress">
  <div className="progress__bar" style={{ width: `${percent}%` }} />
</div>
```

### Conditional class names

```jsx
<div className={`card ${isSelected ? 'card--selected' : ''}`} />

// with an array, which stays readable as conditions multiply
<div className={['card', isSelected && 'card--selected', isDisabled && 'is-disabled']
  .filter(Boolean)
  .join(' ')} />
```

Once you have more than two conditions, a helper (`clsx` / `classnames`) is
worth the dependency.

---

## 9. Curly braces: where they are legal and what goes in them

`{ }` is the door from JSX back into JavaScript. It works in exactly **two**
positions.

```jsx
function ProductCard({ product }) {
  return (
    <article className={product.stock === 0 ? 'card is-out' : 'card'}>
      {/*        ▲ position 1: an attribute VALUE                    */}
      <h2>{product.name}</h2>
      {/*     ▲ position 2: as a CHILD, between tags                 */}
    </article>
  );
}
```

Nowhere else. These are all syntax errors:

```jsx
<{tagName} />           {/* ✗ tag names cannot be expressions */}
<div {attrName}="x" />  {/* ✗ attribute names cannot be expressions */}
```

To vary the tag, put the component in a capitalised variable
([§2](#2-capitalisation-is-syntax-not-style)). To vary attribute names, spread
an object: `<div {...{ [attrName]: value }} />`.

### What is allowed inside the braces

**Expressions only.** This is [Module 1 §5](../01-javascript-foundations/#5-expressions-vs-statements--the-single-most-important-distinction-for-jsx),
and it is the rule people trip over most.

```jsx
{product.name}                                 {/* ✓ property access */}
{product.price / 100}                          {/* ✓ arithmetic */}
{formatPrice(product.price)}                   {/* ✓ function call */}
{isLoading ? <Spinner /> : <Grid />}           {/* ✓ ternary */}
{items.length > 0 && <Badge />}                {/* ✓ logical AND */}
{items.map((i) => <li key={i.id}>{i.name}</li>)} {/* ✓ map returns an array */}
{`${count} items`}                             {/* ✓ template literal */}
{<StockBadge />}                               {/* ✓ JSX is an expression too */}

{if (isLoading) { … }}                         {/* ✗ if is a statement */}
{for (const i of items) { … }}                 {/* ✗ for is a statement */}
{const x = 5;}                                 {/* ✗ declaration is a statement */}
{switch (status) { … }}                        {/* ✗ statement */}
```

When you need a statement, put it above the `return`:

```jsx
function ProductList({ products, status }) {
  if (status === 'loading') return <Skeleton />;
  if (status === 'error') return <ErrorState />;

  const visible = products.filter((p) => p.stock > 0);
  let heading = 'All products';
  switch (status) {
    case 'filtered': heading = 'Matching products'; break;
    case 'empty': heading = 'Nothing here'; break;
  }

  return (
    <section>
      <h2>{heading}</h2>
      <ul>{visible.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </section>
  );
}
```

This is not a workaround. Statements above, one JSX expression below, is what
idiomatic React looks like — and it reads better than any nested-ternary
alternative.

### An IIFE is legal and almost always wrong

```jsx
{(() => {
  switch (status) {
    case 'loading': return <Spinner />;
    case 'error': return <ErrorState />;
    default: return <Grid />;
  }
})()}
```

Valid, occasionally defended, and worse than either an early return or a small
helper component. Reach for it only when there is genuinely nowhere else to put
the logic.

📖 [react.dev — JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)

---

## 10. What renders and what does not

React's rules for children are specific, and knowing them prevents a whole class
of confusing output.

| Value | Rendered as |
|---|---|
| `'hello'` | `hello` |
| `42` | `42` |
| `0` | `0` — **visible**, the classic bug |
| `NaN` | `NaN` — visible |
| `true` / `false` | nothing |
| `null` | nothing |
| `undefined` | nothing |
| `[]` | nothing |
| `[<A />, <B />]` | both, in order (needs `key`s) |
| `{ name: 'Ada' }` | ✗ **throws** — "Objects are not valid as a React child" |
| `new Date()` | ✗ throws (it is an object) |
| `() => {}` | ✗ throws |

```jsx
<p>{0}</p>              {/* renders "0" */}
<p>{false}</p>          {/* renders nothing */}
<p>{null}</p>           {/* renders nothing */}
<p>{[1, 2, 3]}</p>      {/* renders "123" */}
<p>{user}</p>           {/* ✗ throws if user is an object */}
<p>{JSON.stringify(user)}</p>   {/* ✓ what you wanted while debugging */}
<p>{new Date().toLocaleDateString()}</p>  {/* ✓ format dates yourself */}
```

The fact that `false`, `null` and `undefined` render nothing is what makes
`{condition && <Thing />}` work at all — and the fact that `0` *does* render is
why that pattern bites. Full treatment in
[Module 6](../06-conditional-rendering-and-lists/).

### JSX escapes text for you

```jsx
const userInput = '<script>alert(1)</script>';
<p>{userInput}</p>       {/* renders the literal text — no script runs */}
```

Every string you interpolate is escaped, which makes XSS-by-accident hard in
React. The one deliberate hole is `dangerouslySetInnerHTML`, named to make you
hesitate:

```jsx
<div dangerouslySetInnerHTML={{ __html: trustedSanitisedHtml }} />
```

Only with HTML you produced or ran through a sanitiser. See
[Module 20](../20-production/).

---

## 11. Fragments

`<>…</>` groups children without adding a DOM node.

```jsx
function ProductMeta({ product }) {
  return (
    <>
      <dt>Price</dt>
      <dd>{formatPrice(product.price)}</dd>
      <dt>Stock</dt>
      <dd>{product.stock}</dd>
    </>
  );
}
```

This is not cosmetic. In the example above a wrapper `<div>` would be **invalid
HTML** inside a `<dl>`, and would break `<tr>` inside `<table>`, `<option>`
inside `<select>`, and any CSS grid or flex layout that expects direct children.
Fragments let a component return several siblings without dictating the parent's
DOM structure.

When you need a `key` — rendering a list where each item produces several
elements — use the long form:

```jsx
import { Fragment } from 'react';

<dl>
  {specs.map((spec) => (
    <Fragment key={spec.id}>
      <dt>{spec.label}</dt>
      <dd>{spec.value}</dd>
    </Fragment>
  ))}
</dl>
```

`<>` cannot take attributes at all, so `<Fragment key={…}>` is the only option
there.

📖 [react.dev — `<Fragment>`](https://react.dev/reference/react/Fragment)

---

## 12. Nesting, composition and the UI tree

Components nest exactly like elements do, and the result is a tree:

```jsx
function App() {
  return (
    <AppShell>
      <SiteHeader />
      <main>
        <PageHeader title="All products" />
        <ProductGrid />
      </main>
      <SiteFooter />
    </AppShell>
  );
}
```

```
App
├── AppShell
    ├── SiteHeader
    │   ├── Logo
    │   └── CartButton
    │       └── Badge
    ├── main
    │   ├── PageHeader
    │   └── ProductGrid
    │       ├── ProductCard        ← 24 of these
    │       │   ├── ProductImage
    │       │   ├── PriceTag
    │       │   └── StockBadge
    │       └── …
    └── SiteFooter
```

This **render tree** is the structure React reasons about. It is worth
internalising because so much of React is defined in terms of it:

- **Props flow down it** — one direction only ([Module 5](../05-props-and-composition/)).
- **State belongs to a position in it** — which is why `key` and component
  identity determine whether state survives ([Module 8](../08-state-structure/)).
- **Context is read from the nearest provider above** ([Module 9](../09-reducers-and-context/)).
- **Errors propagate up it** to the nearest boundary ([Module 16](../16-advanced-patterns/)).
- **A re-render re-renders the subtree below** ([Module 15](../15-performance/)).

Note that the tree is built from what *renders*, not from your import graph. A
component in a different folder appears wherever it is used, and conditional
rendering means the tree's shape changes over time. React DevTools shows you the
live version — keep it open.

📖 [react.dev — Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)

---

## 13. `children`: a first look

Anything between a component's opening and closing tag arrives as the `children`
prop:

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <h2>Mechanical Keyboard</h2>
  <p>Tactile, hot-swappable, 87 keys.</p>
</Card>
```

This is the single most important composition mechanism in React. It lets a
component control *structure* (padding, border, layout) while knowing nothing
about *content*, which is what makes wrappers, layouts, modals and lists
reusable.

Full treatment — multiple slots, when to use props vs children, and how
`children` helps with performance — in
[Module 5](../05-props-and-composition/).

---

## 14. Extracting components: when and how

Beginners under-extract, then over-extract. Useful signals that a piece of JSX
wants to become a component:

- **It repeats.** Two near-identical blocks with different data.
- **It has a name.** If you would write a comment saying `{/* the price */}`,
  that is `<PriceTag />`.
- **It is independently complex.** A block with its own three conditionals.
- **It needs its own state.** A block with a toggle that nothing else cares
  about.
- **The file is hard to scan.** A 300-line `return` is a file you cannot read.

Signals that you have gone too far:

- The component has one caller, no name you would say out loud, and adds only
  indirection (`<ProductCardTitleWrapper />`).
- You are passing eight props straight through to reassemble what you split.
- You have to jump through four files to understand one screen.

### A worked extraction

Before — one component doing everything:

```jsx
function ProductCard({ product }) {
  return (
    <article className="card">
      <img src={product.imageUrl} alt={product.name} className="card__img" />
      <h2 className="card__title">{product.name}</h2>
      <div className="card__price">
        {product.discount ? (
          <>
            <s>${(product.price / 100).toFixed(2)}</s>
            <strong>${((product.price * (1 - product.discount)) / 100).toFixed(2)}</strong>
          </>
        ) : (
          <strong>${(product.price / 100).toFixed(2)}</strong>
        )}
      </div>
      {product.stock === 0 ? (
        <span className="badge badge--out">Out of stock</span>
      ) : product.stock < 5 ? (
        <span className="badge badge--low">Only {product.stock} left</span>
      ) : (
        <span className="badge">In stock</span>
      )}
    </article>
  );
}
```

After — three components, each with one job:

```jsx
function PriceTag({ cents, discount }) {
  const final = discount ? cents * (1 - discount) : cents;
  return (
    <div className="card__price">
      {discount && <s>{formatPrice(cents)}</s>}
      <strong>{formatPrice(final)}</strong>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge--out">Out of stock</span>;
  if (stock < 5) return <span className="badge badge--low">Only {stock} left</span>;
  return <span className="badge">In stock</span>;
}

function ProductCard({ product }) {
  return (
    <article className="card">
      <img src={product.imageUrl} alt={product.name} className="card__img" />
      <h2 className="card__title">{product.name}</h2>
      <PriceTag cents={product.price} discount={product.discount} />
      <StockBadge stock={product.stock} />
    </article>
  );
}
```

What improved, concretely: `ProductCard` now reads as a summary of its own
structure; `StockBadge`'s three-way branch became three early returns instead of
a nested ternary; both new components are independently testable and reusable in
the cart, the wishlist and the back-office table.

Notice also that `StockBadge` takes `stock`, not `product`. Passing the narrowest
data a component needs keeps it reusable — a cart line has a stock level but is
not a product. More on this in [Module 5](../05-props-and-composition/).

---

## 15. Components must be pure

React requires that rendering a component be a **pure calculation**: same props
and state in, same JSX out, with no observable effect on anything else.

Concretely, during render you must not:

```jsx
let renderCount = 0;                       // module-scope variable

function Bad({ product, items }) {
  renderCount++;                           // ✗ mutating outside state
  product.viewed = true;                   // ✗ mutating a prop
  items.push({ id: 'new' });               // ✗ mutating a prop
  document.title = product.name;           // ✗ touching the DOM
  localStorage.setItem('last', product.id); // ✗ I/O
  fetch('/api/track');                     // ✗ network
  const id = Math.random();                // ✗ non-deterministic
  const now = Date.now();                  // ✗ non-deterministic

  return <h2>{product.name}</h2>;
}
```

**Local mutation is fine.** Anything created *during* this render is yours:

```jsx
function ProductGrid({ products }) {
  const rows = [];                         // ✓ created here, so mutating is fine
  for (const p of products) {
    rows.push(<ProductCard key={p.id} product={p} />);
  }
  return <div className="grid">{rows}</div>;
}
```

The distinction is scope, not the word "mutation": purity means you do not touch
things that existed before your render started.

### Where the impure things go instead

| You want to | Put it in |
|---|---|
| React to a click, submit, keypress | an event handler |
| Set the document title, subscribe, start a timer | an effect ([Module 12](../12-effects/)) |
| Fetch data | a framework loader, a query library, or an effect |
| Generate a stable id | `useId`, or generate it at creation time and store it |
| Read the current time or a random value | state initialised once, or an effect |
| Persist to `localStorage` | an event handler or an effect |

### Why React insists

This is not stylistic. React actively relies on purity:

- It may **render and throw the result away** (a transition that gets
  interrupted, a Suspense retry).
- It may **skip a render** it can prove is unnecessary — which is only sound if
  rendering has no side effects.
- **Strict Mode calls your component twice** in development specifically to
  expose impurity ([Module 2 §18](../02-react-introduction/#18-strict-mode-and-why-your-consolelog-prints-twice)).
- The **React Compiler** memoises aggressively on the assumption that your
  components are pure ([Module 15](../15-performance/)).

An impure component produces the worst class of bug: one that behaves
differently between development and production, or appears only under load.

📖 [react.dev — Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
📖 [react.dev — Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

---

## 16. Where React elements come from: `createElement`

You never need to write this, but seeing it once removes the last of the magic.

```jsx
// JSX
function ProductCard({ product }) {
  return (
    <article className="card">
      <h2>{product.name}</h2>
      <StockBadge stock={product.stock} />
    </article>
  );
}
```

```js
// the same thing, by hand
import { createElement } from 'react';

function ProductCard({ product }) {
  return createElement(
    'article',
    { className: 'card' },
    createElement('h2', null, product.name),
    createElement(StockBadge, { stock: product.stock })
  );
}
```

Read off the correspondences:

- A lowercase tag becomes the **string** `'article'`; a capitalised tag becomes
  the **function reference** `StockBadge`. That is exactly the rule from
  [§2](#2-capitalisation-is-syntax-not-style), and now you can see why it must be
  a language-level rule.
- Attributes become a props object.
- Children become the remaining arguments (and end up as `props.children`).
- `{ }` disappears entirely — it was only ever the boundary between JSX syntax
  and normal JavaScript.

Modern toolchains use the "automatic runtime" and emit `jsx()` from
`react/jsx-runtime` instead, which is why you no longer need
`import React from 'react'` at the top of every file. Older codebases (and any
tutorial written before React 17) still have that import, and now you know what
it was for.

📖 [react.dev — `createElement`](https://react.dev/reference/react/createElement)

---

## 17. Common errors and what they mean

| Message | Cause | Fix |
|---|---|---|
| `Adjacent JSX elements must be wrapped in an enclosing tag` | Two roots returned | Wrap in `<>…</>` or a real element |
| `Objects are not valid as a React child` | Rendered an object, array of objects, `Date`, or function | Render a string/number; `JSON.stringify` while debugging |
| Component renders nothing, no error | `=> { … }` instead of `=> ( … )`, or a missing `return` | Return the JSX |
| `The tag <foo> is unrecognized in this browser` | Lowercase component name | Capitalise the component and its usage |
| `Warning: Invalid DOM property 'class'. Did you mean 'className'?` | HTML attribute name | Use `className`, `htmlFor`, camelCase |
| `Received 'false' for a non-boolean attribute` | `disabled="false"` | `disabled={false}` |
| `Each child in a list should have a unique "key" prop` | `.map()` without `key` | Add a stable `key` ([Module 6](../06-conditional-rendering-and-lists/)) |
| `Cannot read properties of undefined (reading 'name')` | Data not loaded, or a typo'd prop | `?.`, a loading state, check the prop name |
| A stray `0` on the page | `{count && <Badge />}` with `count === 0` | `{count > 0 && <Badge />}` |
| Text renders with no space between values | JSX collapsed the newline | `{' '}` or a template literal |
| Child state resets on every keystroke | A component defined inside another component | Move it to module scope |
| `Too many re-renders` | State set during render instead of in a handler/effect | Move the call into an event handler |
| `<div> cannot appear as a child of <tbody>` | A wrapper where HTML forbids one | Use a fragment |

---

## 18. Self-check

1. What is the minimum a function needs to be a valid React component?
2. Why must a component's name be capitalised? Answer in terms of what the JSX
   compiles to.
3. What does `const C = () => { <div /> }` render, and why?
4. Name three ways JSX attributes differ from HTML attributes, and one place
   where they deliberately do not.
5. What object does `<h1 className="a">Hi</h1>` evaluate to, roughly?
6. What are the exactly two positions where `{ }` is legal in JSX?
7. Why can you write a ternary inside `{ }` but not an `if`? Where does the `if`
   go instead?
8. Which of these render something, and what?
   `{0}` `{false}` `{null}` `{''}` `{[]}` `{[1,2]}` `{{a:1}}`
9. Give a case where a `<div>` wrapper is a bug and a fragment is required.
10. When must you write `<Fragment key={…}>` rather than `<>`?
11. Why is defining a component inside another component a bug and not just
    inefficient?
12. Which of these are impure, and where should each one go instead?
    ```jsx
    function C({ product, items }) {
      const rows = [];  rows.push(product.name);
      items.sort();
      document.title = product.name;
      const id = crypto.randomUUID();
      return <div>{rows}</div>;
    }
    ```
13. Name three reasons React requires component purity — not "because the docs
    say so".
14. Why do modern React files not need `import React from 'react'`?
15. Give three signals that a block of JSX should become its own component, and
    two signals that you have extracted too much.

---

## 19. References

Official React documentation only.

**Components**
- [Your First Component](https://react.dev/learn/your-first-component)
- [Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)
- [Describing the UI](https://react.dev/learn/describing-the-ui) — the section this module covers
- [Thinking in React](https://react.dev/learn/thinking-in-react) — going from a mockup to a component tree
- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)

**JSX**
- [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
- [`<Fragment>` (`<>`)](https://react.dev/reference/react/Fragment)
- [`createElement`](https://react.dev/reference/react/createElement)
- [Common components — the full DOM prop reference](https://react.dev/reference/react-dom/components/common)

**Purity**
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [Rules of React](https://react.dev/reference/rules)
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)

---

**Previous:** [Module 3 — Rendering Architectures](../03-rendering-architectures/)
**Next:** [Module 5 — Props & Component Composition](../05-props-and-composition/)
