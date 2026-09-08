# Module 1 — JavaScript Foundations for React

**Study notes** · Prerequisite module · ~4–6 hours of reading + practice

> **Why this module exists.** React is not a language and it is not a framework
> that hides JavaScript from you. It is a *library written in JavaScript*, and
> almost everything that confuses a beginner in React ("why did my list not
> update?", "why is my state one render behind?", "why is `props` undefined?")
> is a JavaScript question wearing a React costume.
>
> Every section below ends with **→ In React**, showing the exact place the
> concept shows up once you start writing components. If you only read one
> thing per section, read that.

---

## Contents

1. [How to use this module](#1-how-to-use-this-module)
2. [`var`, `let`, `const` and block scope](#2-var-let-const-and-block-scope)
3. [Functions, arrow functions and `this`](#3-functions-arrow-functions-and-this)
4. [Template literals](#4-template-literals)
5. [Expressions vs statements — the single most important distinction for JSX](#5-expressions-vs-statements--the-single-most-important-distinction-for-jsx)
6. [Truthiness, equality and the falsy traps](#6-truthiness-equality-and-the-falsy-traps)
7. [Optional chaining and nullish coalescing](#7-optional-chaining-and-nullish-coalescing)
8. [Destructuring](#8-destructuring)
9. [Spread and rest](#9-spread-and-rest)
10. [Objects in depth](#10-objects-in-depth)
11. [Immutability — the rule React is built on](#11-immutability--the-rule-react-is-built-on)
12. [Array methods you will use every single day](#12-array-methods-you-will-use-every-single-day)
13. [Closures — and why your state looks "stale"](#13-closures--and-why-your-state-looks-stale)
14. [Higher-order functions and functions as values](#14-higher-order-functions-and-functions-as-values)
15. [ES Modules: `import` / `export`](#15-es-modules-import--export)
16. [Asynchronous JavaScript: promises, `async`/`await`, `fetch`](#16-asynchronous-javascript-promises-asyncawait-fetch)
17. [The event loop, in one page](#17-the-event-loop-in-one-page)
18. [Errors and `try` / `catch`](#18-errors-and-try--catch)
19. [The DOM and events (what React replaces)](#19-the-dom-and-events-what-react-replaces)
20. [Classes — the 10% you still need](#20-classes--the-10-you-still-need)
21. [`Map`, `Set` and when to reach for them](#21-map-set-and-when-to-reach-for-them)
22. [Purity, side effects and referential identity](#22-purity-side-effects-and-referential-identity)
23. [The tooling around the language](#23-the-tooling-around-the-language)
24. [A glance at TypeScript](#24-a-glance-at-typescript)
25. [JavaScript → React cheat sheet](#25-javascript--react-cheat-sheet)
26. [Self-check exercises](#26-self-check-exercises)
27. [References](#27-references)

---

## 1. How to use this module

**Do not read this like a novel.** Open a browser, press <kbd>F12</kbd>, go to
the **Console** tab, and type every example in. JavaScript is learned in a REPL,
not on a page.

For anything longer than a few lines, use a scratch file:

```bash
node --version          # you want 20.19+ or 22.12+ for modern React tooling
echo 'console.log([1,2,3].map(n => n * 2))' > scratch.mjs
node scratch.mjs        # → [ 2, 4, 6 ]
```

The `.mjs` extension tells Node "this is an ES module", which is the same module
system React code uses. More on that in [§15](#15-es-modules-import--export).

**How much do you need?** This module is the honest minimum. It is not "all of
JavaScript" — there is no generators section, no `Proxy`, no `Symbol`
deep-dive, because you can write professional React for years without them.
Everything that *is* here, you will touch in your first week.

---

## 2. `var`, `let`, `const` and block scope

Three ways to declare a variable. In modern code you use two of them.

```js
const apiUrl = 'https://api.shopcrew.dev';  // cannot be reassigned
let count = 0;                              // can be reassigned
count = count + 1;                           // fine
// apiUrl = 'something else';                // ✗ TypeError: Assignment to constant variable

var legacy = 'avoid me';                     // function-scoped, hoisted — legacy
```

### Block scope

`let` and `const` live inside the nearest `{ }` block. `var` does not — it
leaks to the whole function, which is the source of a classic bug:

```js
// var: one shared binding — every callback sees the final value
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var:', i), 0);
}
// var: 3   var: 3   var: 3

// let: a fresh binding per iteration — what you actually meant
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let:', j), 0);
}
// let: 0   let: 1   let: 2
```

### `const` does not mean immutable

`const` freezes the *binding*, not the *value*. This is one of the most
commonly misunderstood things in the language:

```js
const user = { name: 'Ada' };
user.name = 'Grace';     // ✓ allowed — we mutated the object, not the binding
console.log(user);       // { name: 'Grace' }

// user = { name: 'Grace' };  // ✗ not allowed — that IS reassigning the binding

const scores = [10, 20];
scores.push(30);         // ✓ allowed
console.log(scores);     // [10, 20, 30]
```

That distinction matters enormously in React, because React detects change by
comparing *bindings* (identities), not by inspecting contents. See
[§11](#11-immutability--the-rule-react-is-built-on).

### Temporal Dead Zone (TDZ)

A `let`/`const` variable exists from the top of its block but cannot be read
until the declaration line runs:

```js
console.log(a);   // undefined   (var is hoisted AND initialised to undefined)
var a = 1;

console.log(b);   // ✗ ReferenceError: Cannot access 'b' before initialization
let b = 1;
```

The TDZ is a feature: it turns a silent `undefined` into a loud error.

> **Rule of thumb:** default to `const`. Switch to `let` only when you have a
> line that genuinely reassigns. Never write `var` in new code.

**→ In React:** component bodies are full of `const`:
`const [count, setCount] = useState(0)` — you never reassign `count`, you call
`setCount` and let React re-run the component with a new `const`. If you find
yourself wanting `let` for something the UI displays, that value almost always
belongs in state instead.

---

## 3. Functions, arrow functions and `this`

Four shapes you must be able to read at a glance:

```js
// 1. Function declaration — hoisted, callable before its definition line
function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// 2. Function expression assigned to a const
const formatPrice2 = function (cents) {
  return `$${(cents / 100).toFixed(2)}`;
};

// 3. Arrow function with a block body
const formatPrice3 = (cents) => {
  return `$${(cents / 100).toFixed(2)}`;
};

// 4. Arrow function with an implicit return — no braces, no `return`
const formatPrice4 = (cents) => `$${(cents / 100).toFixed(2)}`;
```

### Implicit return, and the object-literal gotcha

An arrow with no braces returns its expression. But `{` after `=>` is read as a
*block*, so returning an object literal needs parentheses:

```js
const toOption = (p) => { id: p.id, label: p.name };      // ✗ SyntaxError
const toOption = (p) => ({ id: p.id, label: p.name });    // ✓ wrap in ( )
const toOption = (p) => { return { id: p.id, label: p.name }; };  // ✓ or be explicit
```

### Default and rest parameters

```js
function greet(name = 'guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}
greet();                    // 'Hello, guest!'
greet('Ada');               // 'Hello, Ada!'
greet(undefined, 'Hi');     // 'Hi, guest!'   (undefined triggers the default; null does not)

function sum(...numbers) {          // rest: collect the remaining args into an array
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4);            // 10
```

### `this`, and why arrows fixed it

A `function`'s `this` depends on *how it is called*. An arrow function has no
`this` of its own — it uses the `this` of the surrounding code, decided when
the arrow was written, not when it is called.

```js
const counter = {
  count: 0,
  incrementBroken: function () {
    setTimeout(function () {
      this.count++;              // ✗ `this` is not `counter` here
    }, 100);
  },
  incrementWorks: function () {
    setTimeout(() => {
      this.count++;              // ✓ arrow inherits `this` from incrementWorks
    }, 100);
  },
};
```

> **In modern React you will barely touch `this`.** Function components have no
> `this` at all. It matters only when you read older class-component code
> (`this.props`, `this.setState`, `this.handleClick = this.handleClick.bind(this)`)
> — see [§20](#20-classes--the-10-you-still-need).

**→ In React:** a component *is* a function that returns markup, and event
handlers are arrow functions you pass as props:

```jsx
function ProductCard({ product, onAdd }) {
  return <button onClick={() => onAdd(product.id)}>Add to cart</button>;
}
```

Note `onClick={() => onAdd(product.id)}` and **not** `onClick={onAdd(product.id)}`.
The second one *calls* `onAdd` during render and passes its return value to
`onClick`. Passing a function vs calling a function is the number-one beginner
bug in React, and it is pure JavaScript.

📖 [react.dev — Responding to Events](https://react.dev/learn/responding-to-events)

---

## 4. Template literals

Backticks. String interpolation with `${}`, and real multi-line strings.

```js
const name = 'Ada';
const items = 3;

const greeting = `Hi ${name}, you have ${items} item${items === 1 ? '' : 's'}.`;
// 'Hi Ada, you have 3 items.'

const query = `
  SELECT *
  FROM products
  WHERE id = ${42}
`;
```

Any expression works inside `${}` — arithmetic, function calls, ternaries,
`.map().join('')`. Nesting is legal but hurts readability fast; pull complex
pieces into a named `const` first.

**→ In React:** template literals build className strings, `alt` text, aria
labels and URLs:

```jsx
<img src={`/images/${product.slug}.webp`} alt={`${product.name} — product photo`} />
<div className={`card ${isSelected ? 'card--selected' : ''}`} />
```

---

## 5. Expressions vs statements — the single most important distinction for JSX

An **expression** produces a value. A **statement** performs an action.

```js
// expressions — each one evaluates to something
2 + 2
user.name
isLoggedIn ? 'Log out' : 'Log in'
products.map(p => p.name)
formatPrice(1999)

// statements — these DO something, they are not values
if (isLoggedIn) { ... }
for (const p of products) { ... }
const x = 5;
return x;
```

Test: could you pass it to `console.log(...)` directly? If yes, it is an
expression.

**→ In React:** the curly braces in JSX accept **expressions only**. This is
why you can write a ternary or a `.map()` inside JSX but not an `if` or a
`for`:

```jsx
function ProductList({ products, isLoading }) {
  return (
    <div>
      {/* ✓ ternary — an expression */}
      {isLoading ? <Spinner /> : <span>{products.length} products</span>}

      {/* ✓ .map() returns an array — an expression */}
      {products.map((p) => <li key={p.id}>{p.name}</li>)}

      {/* ✗ if is a statement — this is a syntax error */}
      {/* {if (isLoading) { return <Spinner />; }} */}
    </div>
  );
}
```

When you need a statement, move it *above* the `return`:

```jsx
function ProductList({ products, isLoading }) {
  if (isLoading) return <Spinner />;              // statements live here
  if (products.length === 0) return <EmptyState />;

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

📖 [react.dev — JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
📖 [react.dev — Conditional Rendering](https://react.dev/learn/conditional-rendering)

---

## 6. Truthiness, equality and the falsy traps

### The eight falsy values

Everything else is truthy — including `[]`, `{}`, `'0'` and `'false'`.

```js
Boolean(false);        // false
Boolean(0);            // false
Boolean(-0);           // false
Boolean(0n);           // false   (BigInt zero)
Boolean('');           // false
Boolean(null);         // false
Boolean(undefined);    // false
Boolean(NaN);          // false

Boolean([]);           // true  ← surprises people
Boolean({});           // true  ← surprises people
Boolean('0');          // true
```

### `===` vs `==`

Always `===`. `==` coerces types and produces nonsense:

```js
0 == '';          // true
0 == '0';         // true
null == undefined; // true
NaN == NaN;       // false
'1' == 1;         // true

0 === '';         // false — use this one
```

The single accepted use of `==` is `x == null`, which is true for both `null`
and `undefined`. Even then, many teams ban it; `x === null || x === undefined`
or `x ?? fallback` are clearer.

### `&&`, `||` and short-circuiting

These do **not** return booleans. They return one of their operands.

```js
'Ada' && 'Grace';       // 'Grace'   — left is truthy, so return the right
'' && 'Grace';          // ''        — left is falsy, so return the LEFT
null || 'fallback';      // 'fallback'
'Ada' || 'fallback';     // 'Ada'
0 || 'fallback';         // 'fallback'  ← 0 is falsy, so the fallback wins
```

**→ In React — the `0` trap.** React renders `0` (and `NaN`) as visible text,
but skips `false`, `null` and `undefined`. So this bug appears in almost every
codebase:

```jsx
{cartCount && <Badge count={cartCount} />}
// cartCount = 3  → renders <Badge />        ✓
// cartCount = 0  → renders the literal "0"  ✗ a stray zero on your page
```

Fix it by making the left side a real boolean:

```jsx
{cartCount > 0 && <Badge count={cartCount} />}     // ✓
{Boolean(cartCount) && <Badge count={cartCount} />} // ✓
{cartCount ? <Badge count={cartCount} /> : null}    // ✓
```

📖 [react.dev — Conditional Rendering: Logical AND operator (&&)](https://react.dev/learn/conditional-rendering#logical-and-operator-)

---

## 7. Optional chaining and nullish coalescing

### `?.` — read safely through possibly-missing values

```js
const order = { customer: { address: null } };

order.customer.address.city;      // ✗ TypeError: Cannot read properties of null
order.customer?.address?.city;    // ✓ undefined

order.items?.[0]?.name;           // ✓ safe index access
order.onSaved?.();                // ✓ call only if it exists
```

`?.` stops the whole chain and yields `undefined` the moment it meets `null` or
`undefined`. It does *not* silence other mistakes — a typo in a property name
still gives you `undefined`, silently, so do not scatter it everywhere.

### `??` — default only for `null` / `undefined`

```js
const settings = { pageSize: 0, title: '' };

settings.pageSize || 20;    // 20   ← wrong! 0 is a legitimate value
settings.pageSize ?? 20;    // 0    ← correct
settings.missing ?? 20;     // 20
settings.title ?? 'Untitled';  // ''  — an empty string is a real value to ??
```

Use `||` when you want to replace *any* falsy value. Use `??` when only
"absent" should trigger the fallback. Numbers and booleans almost always want
`??`.

### Logical assignment operators

```js
let config = { retries: null };
config.retries ??= 3;      // assign only if null/undefined  → 3
config.retries ||= 3;      // assign if falsy
config.enabled &&= false;  // assign if truthy
```

**→ In React:** `?.` and `??` are how you render data that arrives over the
network, where a field may not exist yet:

```jsx
<h2>{order.customer?.name ?? 'Guest checkout'}</h2>
<p>{order.items?.length ?? 0} items</p>
```

---

## 8. Destructuring

Pull values out of objects and arrays into named bindings. React's API is
designed around it, so this is not optional knowledge.

### Object destructuring

```js
const product = { id: 7, name: 'Keyboard', price: 4999, stock: 0 };

const { name, price } = product;
// name = 'Keyboard', price = 4999

const { name: title } = product;                 // rename
// title = 'Keyboard'

const { discount = 0 } = product;                // default for a missing key
// discount = 0

const { name: n, discount: d = 0, ...rest } = product;   // rename + default + rest
// n = 'Keyboard', d = 0, rest = { id: 7, price: 4999, stock: 0 }
```

Defaults fire for `undefined` only — the same rule as default parameters:

```js
const { stock = 10 } = { stock: 0 };        // 0    (0 is present)
const { stock = 10 } = { stock: null };     // null (null is present)
const { stock = 10 } = {};                  // 10
```

### Nested destructuring

Powerful, and easy to overdo:

```js
const order = { id: 1, customer: { name: 'Ada', address: { city: 'London' } } };

const { customer: { name, address: { city } } } = order;
// name = 'Ada', city = 'London'

// Safer when the shape may be incomplete:
const { customer: { name: n2 = 'Guest' } = {} } = {};
// n2 = 'Guest'
```

### Array destructuring — position matters

```js
const colors = ['red', 'green', 'blue'];

const [first, second] = colors;          // 'red', 'green'
const [, , third] = colors;              // skip with commas → 'blue'
const [head, ...tail] = colors;          // 'red', ['green', 'blue']
const [a, b, c, d = 'none'] = colors;    // d = 'none'

// swap without a temp variable
let x = 1, y = 2;
[x, y] = [y, x];                         // x = 2, y = 1
```

### Destructuring in parameters

This is the form you will write hundreds of times:

```js
function formatAddress({ street, city, postcode = '' }) {
  return `${street}, ${city} ${postcode}`.trim();
}
formatAddress({ street: '1 High St', city: 'Bath' });
```

**→ In React:** props are one object, and every component destructures it.
Hooks return arrays, and you destructure those by position:

```jsx
// props destructuring, with a default and a rest for pass-through
function Button({ variant = 'primary', children, ...buttonProps }) {
  return <button className={`btn btn--${variant}`} {...buttonProps}>{children}</button>;
}

// array destructuring — the names are YOURS to choose, the order is fixed
const [count, setCount] = useState(0);
const [query, setQuery] = useState('');
```

`useState` returns `[value, setter]`. If you wrote `const [setCount, count] =
useState(0)` it would compile and be completely broken — position is meaning.

📖 [react.dev — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
📖 [react.dev — `useState`](https://react.dev/reference/react/useState)

---

## 9. Spread and rest

Same `...` token, opposite jobs. **Spread** unpacks; **rest** collects.

```js
// SPREAD — expand into a new array/object/argument list
const a = [1, 2];
const b = [...a, 3];                  // [1, 2, 3]
const merged = { ...{ x: 1 }, y: 2 }; // { x: 1, y: 2 }
Math.max(...[3, 1, 4]);               // 4

// REST — gather the leftovers
const [first, ...others] = [1, 2, 3];        // others = [2, 3]
const { id, ...withoutId } = { id: 1, x: 2 }; // withoutId = { x: 2 }
function log(label, ...values) { /* values is an array */ }
```

### Object spread: later keys win

```js
const defaults = { pageSize: 20, sort: 'name' };
const userPrefs = { sort: 'price' };

const options = { ...defaults, ...userPrefs };      // { pageSize: 20, sort: 'price' }
const forced  = { ...userPrefs, sort: 'name' };     // { sort: 'name' } — explicit key wins
```

### Spread is a *shallow* copy

This trips up everyone. Nested objects are shared between the copy and the
original:

```js
const original = { name: 'Ada', address: { city: 'London' } };
const copy = { ...original };

copy.name = 'Grace';               // ✓ original.name is still 'Ada'
copy.address.city = 'Bath';        // ✗ original.address.city is NOW 'Bath' too
```

To copy a nested level, spread that level too:

```js
const copy = { ...original, address: { ...original.address, city: 'Bath' } };
```

For deep data, `structuredClone` does a real deep copy (built into Node 17+ and
all current browsers):

```js
const deep = structuredClone(original);   // fully independent
```

Prefer restructuring your state so it is shallow over reaching for deep clones
— [Module 8](../08-state-structure/) covers that.

**→ In React:** spread is how you update state without mutating it, and how you
forward props:

```jsx
setUser({ ...user, name: 'Grace' });                      // new object → React re-renders
setItems([...items, newItem]);                            // new array
setUser({ ...user, address: { ...user.address, city } }); // nested update

<Input {...register('email')} />                          // forward a bag of props
```

📖 [react.dev — Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
📖 [react.dev — Passing Props to a Component: Forwarding props with the JSX spread syntax](https://react.dev/learn/passing-props-to-a-component#forwarding-props-with-the-jsx-spread-syntax)

---

## 10. Objects in depth

```js
const key = 'stock';
const name = 'Keyboard';
const price = 4999;

const product = {
  name,                                  // shorthand for name: name
  price,
  [key]: 12,                             // computed key → stock: 12
  [`${key}Label`]: 'In stock',           // → stockLabel: 'In stock'
  formatted() {                          // method shorthand
    return `${this.name}: ${this.price}`;
  },
};

product.name;          // dot access — when you know the key
product['name'];       // bracket access — when the key is in a variable
'stock' in product;    // true
delete product.stock;
```

### Iterating an object

```js
const scores = { ada: 90, grace: 95, alan: 88 };

Object.keys(scores);     // ['ada', 'grace', 'alan']
Object.values(scores);   // [90, 95, 88]
Object.entries(scores);  // [['ada', 90], ['grace', 95], ['alan', 88]]

for (const [name, score] of Object.entries(scores)) {
  console.log(`${name}: ${score}`);
}

Object.fromEntries([['a', 1], ['b', 2]]);   // { a: 1, b: 2 }
```

`Object.entries()` + `.map()` is the standard way to render an object as a list
in React, since JSX can only map over arrays:

```jsx
{Object.entries(specs).map(([label, value]) => (
  <dl key={label}><dt>{label}</dt><dd>{value}</dd></dl>
))}
```

### Reference vs value

Primitives (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`,
`bigint`) are compared by value. Objects, arrays and functions are compared by
**reference**:

```js
'a' === 'a';                 // true
1 === 1;                     // true

{ x: 1 } === { x: 1 };       // false — two different objects
[1, 2] === [1, 2];           // false
(() => {}) === (() => {});   // false

const o = { x: 1 };
const alias = o;
o === alias;                 // true — same reference
```

**This is the mechanism React uses to decide what changed.** Internalise it now
and half of React's "gotchas" stop being mysterious.

---

## 11. Immutability — the rule React is built on

React re-renders when a state value's **identity** changes. It does not scan
your objects for edits. So mutating in place is invisible to React:

```js
// ✗ mutation — same reference, React sees nothing
items.push(newItem);
user.name = 'Grace';
items.sort();
items[0].done = true;

// ✓ replacement — new reference, React re-renders
setItems([...items, newItem]);
setUser({ ...user, name: 'Grace' });
setItems([...items].sort());
setItems(items.map((i) => (i.id === id ? { ...i, done: true } : i)));
```

### Mutating vs non-mutating array methods

Memorise this table. It is the single highest-value thing in this module.

| Task | ✗ Mutates (avoid on state) | ✓ Returns a new array |
|---|---|---|
| add to end | `push` | `[...arr, item]` |
| add to start | `unshift` | `[item, ...arr]` |
| remove | `pop`, `shift`, `splice` | `filter`, `slice` |
| replace one item | `arr[i] = x` | `map` |
| insert at index | `splice` | `[...arr.slice(0, i), x, ...arr.slice(i)]` |
| sort | `sort` | `[...arr].sort()` or `arr.toSorted()` |
| reverse | `reverse` | `[...arr].reverse()` or `arr.toReversed()` |

The `toSorted`, `toReversed`, `toSpliced` and `with` methods are the modern
non-mutating versions (Node 20+, all current browsers):

```js
const nums = [3, 1, 2];
nums.toSorted();            // [1, 2, 3]  — nums is untouched
nums.toReversed();          // [2, 1, 3]
nums.with(0, 99);           // [99, 1, 2] — replace index 0
```

### Worked example: the four state updates you will write constantly

```js
const products = [
  { id: 1, name: 'Keyboard', price: 4999, tags: ['input'] },
  { id: 2, name: 'Mouse', price: 2999, tags: ['input'] },
];

// ADD
const added = [...products, { id: 3, name: 'Monitor', price: 19999, tags: [] }];

// REMOVE
const removed = products.filter((p) => p.id !== 2);

// UPDATE one field on one item
const updated = products.map((p) =>
  p.id === 1 ? { ...p, price: 3999 } : p
);

// UPDATE a nested array inside one item
const tagged = products.map((p) =>
  p.id === 1 ? { ...p, tags: [...p.tags, 'mechanical'] } : p
);
```

Every one of these leaves `products` untouched and hands back a fresh array.
That is exactly what you pass to a state setter.

📖 [react.dev — Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
📖 [react.dev — Updating Objects in State](https://react.dev/learn/updating-objects-in-state)

---

## 12. Array methods you will use every single day

Assume this data:

```js
const products = [
  { id: 1, name: 'Keyboard',  price: 4999,  stock: 12, category: 'input' },
  { id: 2, name: 'Mouse',     price: 2999,  stock: 0,  category: 'input' },
  { id: 3, name: 'Monitor',   price: 19999, stock: 4,  category: 'display' },
  { id: 4, name: 'Webcam',    price: 6999,  stock: 7,  category: 'video'  },
];
```

### `map` — transform every item, same length out

```js
products.map((p) => p.name);
// ['Keyboard', 'Mouse', 'Monitor', 'Webcam']

products.map((p) => ({ ...p, priceLabel: `$${(p.price / 100).toFixed(2)}` }));
// same 4 objects, each with an extra field
```

The callback gets `(item, index, array)`. `map` **always** returns an array of
the same length — if you find yourself returning `null` for some items to skip
them, you wanted `filter`.

### `filter` — keep the items that pass a test

```js
products.filter((p) => p.stock > 0);              // 3 items
products.filter((p) => p.category === 'input');   // 2 items
```

### `find` / `findIndex` — get one item

```js
products.find((p) => p.id === 3);            // the Monitor object (or undefined)
products.findIndex((p) => p.id === 3);       // 2 (or -1)
products.findLast((p) => p.stock > 0);       // the Webcam
```

### `some` / `every` / `includes` — questions that return a boolean

```js
products.some((p) => p.stock === 0);         // true  — is anything out of stock?
products.every((p) => p.price > 1000);       // true  — is everything over $10?
['a', 'b'].includes('b');                    // true
```

### `reduce` — fold a list into a single value

The one people fear. It is just an accumulator plus a starting value:

```js
// total price
products.reduce((total, p) => total + p.price, 0);        // 34996

// group by category  → { input: [...], display: [...], video: [...] }
products.reduce((groups, p) => {
  groups[p.category] = [...(groups[p.category] ?? []), p];
  return groups;
}, {});

// index by id → { 1: {...}, 2: {...} } — a very useful shape for lookups
products.reduce((byId, p) => ({ ...byId, [p.id]: p }), {});
```

Modern alternatives read better for the grouping case:

```js
Object.groupBy(products, (p) => p.category);   // Node 21+, current browsers
```

> **Guidance:** if a `reduce` needs a comment to explain it, a `for...of` loop
> with a local accumulator is better code. Clever `reduce` is a common source
> of unreviewable pull requests.

### `sort` — mutates, and compares as strings by default

```js
[10, 9, 1].sort();                       // [1, 10, 9]  ← lexicographic!
[10, 9, 1].sort((a, b) => a - b);        // [1, 9, 10]  ← numeric ascending
[10, 9, 1].sort((a, b) => b - a);        // [10, 9, 1]  ← descending

// objects, by string field
[...products].sort((a, b) => a.name.localeCompare(b.name));

// never sort state in place:
setProducts([...products].sort((a, b) => a.price - b.price));   // ✓
setProducts(products.toSorted((a, b) => a.price - b.price));    // ✓ modern
```

### `slice` vs `splice`

```js
const arr = [1, 2, 3, 4, 5];
arr.slice(1, 3);      // [2, 3]   — copy, arr untouched
arr.slice(-2);        // [4, 5]   — last two
arr.splice(1, 2);     // [2, 3]   — REMOVES from arr; arr is now [1, 4, 5]
```

`slice` = **s**afe **c**opy. `splice` = surgery. Only `slice` belongs anywhere
near React state.

### `flat` / `flatMap` / `join` / `Array.from`

```js
[[1, 2], [3, [4]]].flat();               // [1, 2, 3, [4]]
[[1, 2], [3, [4]]].flat(2);              // [1, 2, 3, 4]

products.flatMap((p) => p.name.split(''));   // map then flatten one level

['a', 'b', 'c'].join(', ');              // 'a, b, c'

Array.from({ length: 5 }, (_, i) => i + 1);   // [1, 2, 3, 4, 5]
```

`Array.from({ length: n })` is the idiomatic way to render *n* skeleton
placeholders while data loads.

### Chaining

Reads top-to-bottom, each step producing a new array:

```js
const topInStock = products
  .filter((p) => p.stock > 0)
  .toSorted((a, b) => b.price - a.price)
  .slice(0, 2)
  .map((p) => p.name);
// ['Monitor', 'Webcam']
```

**→ In React:** this exact chain, inside JSX, is what renders a filtered and
sorted list. `map` produces the elements, and each needs a stable `key`:

```jsx
<ul>
  {products
    .filter((p) => p.category === activeCategory)
    .map((p) => <ProductCard key={p.id} product={p} />)}
</ul>
```

📖 [react.dev — Rendering Lists](https://react.dev/learn/rendering-lists)

---

## 13. Closures — and why your state looks "stale"

A **closure** is a function that remembers the variables that were in scope
where it was *defined*, even after that outer function has returned.

```js
function makeCounter() {
  let count = 0;                    // lives on, captured by the returned function
  return function increment() {
    count += 1;
    return count;
  };
}

const next = makeCounter();
next();   // 1
next();   // 2

const other = makeCounter();
other();  // 1 — a separate captured `count`
```

### The stale-value problem

A closure captures the *variable*, and when that variable is a `const` created
fresh on each call, each closure sees the value from its own call:

```js
function render(count) {
  return {
    onClick: () => console.log('count is', count),   // captures THIS call's count
  };
}

const first = render(0);
const second = render(1);

first.onClick();    // 'count is 0'  — even though `second` exists now
second.onClick();   // 'count is 1'
```

**→ In React:** this *is* React's render model. Every render is a new call to
your component function, producing a new `const count` and new handler closures
over it. So:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleTripleWrong() {
    setCount(count + 1);      // count is 0 → schedules 1
    setCount(count + 1);      // count is STILL 0 in this closure → schedules 1
    setCount(count + 1);      // → schedules 1.  Final result: 1, not 3
  }

  function handleTripleRight() {
    setCount((c) => c + 1);   // updater form: React passes the latest value
    setCount((c) => c + 1);
    setCount((c) => c + 1);   // Final result: 3
  }

  return <button onClick={handleTripleRight}>{count}</button>;
}
```

`count` is not a variable React reassigns — it is a `const` fixed for the
lifetime of that one render. React calls this "state as a snapshot", and the
updater-function form (`setCount(c => c + 1)`) is how you escape the snapshot.

The same closure capture explains why an interval set up in an effect logs an
old value unless the effect's dependencies (or an updater function) account for
it — [Module 12](../12-effects/) covers that in detail.

📖 [react.dev — State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
📖 [react.dev — Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)

---

## 14. Higher-order functions and functions as values

Functions are values: assign them, pass them, return them, store them in
arrays and objects.

```js
const double = (n) => n * 2;

[1, 2, 3].map(double);                 // pass a function as data

function withLogging(fn) {             // take a function, return a function
  return (...args) => {
    console.log('calling with', args);
    return fn(...args);
  };
}
const loggedDouble = withLogging(double);
loggedDouble(21);                      // logs, then returns 42

const handlers = {                     // functions in an object
  onSave: () => {},
  onCancel: () => {},
};
```

### Calling vs referencing

```js
const fn = double;      // reference — fn is the function
const val = double(2);  // call — val is 4
```

**→ In React:** components are functions passed around as values; props carry
callbacks; custom hooks are functions that call other functions. The
call-vs-reference distinction is the bug you will hit first:

```jsx
<button onClick={handleDelete}>Delete</button>          // ✓ pass the function
<button onClick={handleDelete()}>Delete</button>        // ✗ calls it during render
<button onClick={() => handleDelete(id)}>Delete</button> // ✓ need an argument? wrap it
```

---

## 15. ES Modules: `import` / `export`

Every file is a module with its own scope. Nothing is global unless exported
and imported.

```js
// formatters.js
export const CURRENCY = 'USD';                    // named export
export function formatPrice(cents) { ... }        // named export
export default function Money({ cents }) { ... }  // default export (one per file)
```

```js
// consumer.js
import Money from './formatters.js';                  // default — name is yours to pick
import { formatPrice, CURRENCY } from './formatters.js';   // named — names must match
import Money, { formatPrice } from './formatters.js';      // both
import { formatPrice as fmt } from './formatters.js';      // rename
import * as formatters from './formatters.js';             // namespace object
import './styles.css';                                     // side-effect import
```

### Paths

```js
import { api } from './lib/api';      // relative — your own files
import { api } from '../lib/api';     // up one directory
import React from 'react';            // bare specifier — a package in node_modules
import { Button } from '@/components/ui/button';   // path alias, configured in your bundler
```

### Dynamic `import()` — loads on demand, returns a promise

```js
const { formatPrice } = await import('./formatters.js');
```

**→ In React:** dynamic import is what code-splitting is built on:

```jsx
const AdminDashboard = lazy(() => import('./AdminDashboard'));
```

📖 [react.dev — Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)
📖 [react.dev — `lazy`](https://react.dev/reference/react/lazy)

### One export style per team

Both work. Pick one and be consistent — mixed conventions make imports
unpredictable. A common professional choice: **named exports for everything**
(better auto-import, better rename refactors, no accidental duplicate names),
with default exports only where a framework demands them (for example, a
Next.js `page` file).

### ESM vs CommonJS

You will still meet `require`/`module.exports` in Node tooling and older
packages:

```js
const fs = require('fs');           // CommonJS — Node's original system
module.exports = { formatPrice };
```

Modern React code is always ESM (`import`/`export`). If Node complains
`Cannot use import statement outside a module`, the fix is `"type": "module"`
in `package.json` or an `.mjs` extension.

---

## 16. Asynchronous JavaScript: promises, `async`/`await`, `fetch`

JavaScript runs on one thread. Anything slow — a network call, a timer, reading
a file — is handed off and its result delivered later. A **Promise** is the
object representing "a value that isn't here yet".

A promise is `pending`, then either `fulfilled` (with a value) or `rejected`
(with a reason).

### `.then` / `.catch` / `.finally`

```js
fetch('/api/products')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error))
  .finally(() => console.log('done either way'));
```

### `async` / `await` — the same thing, readable

```js
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);          // fetch does NOT throw on 404/500
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load products', error);
    throw error;                                            // re-throw, or return a fallback
  }
}
```

Three rules that catch everyone:

1. `await` only works inside an `async` function (or at the top level of a
   module).
2. An `async` function **always** returns a promise, even if you `return 5`.
3. `fetch` rejects only on a *network* failure. A 404 or 500 is a successful
   fetch with `response.ok === false`. You must check it yourself.

### Sequential vs parallel

```js
// ✗ sequential — 300ms total, for no reason
const user = await fetchUser();
const orders = await fetchOrders();

// ✓ parallel — as slow as the slowest one
const [user, orders] = await Promise.all([fetchUser(), fetchOrders()]);

// tolerate individual failures
const results = await Promise.allSettled([fetchUser(), fetchOrders()]);
// [{ status: 'fulfilled', value }, { status: 'rejected', reason }]

await Promise.any([fastMirror(), slowMirror()]);   // first success wins
await Promise.race([fetchData(), timeout(5000)]);  // first settle wins, success or failure
```

### `AbortController` — cancelling a request

```js
const controller = new AbortController();

fetch('/api/search?q=keyboard', { signal: controller.signal })
  .then((r) => r.json())
  .catch((err) => {
    if (err.name === 'AbortError') return;    // expected — we cancelled it
    throw err;
  });

controller.abort();     // cancel
```

**→ In React:** every data-fetching effect needs cleanup, or a slow earlier
request can land after a fast later one and overwrite fresh data with stale
data (a "race condition"). `AbortController` — or an `ignore` flag — is the
standard fix:

```jsx
useEffect(() => {
  let ignore = false;

  async function load() {
    const data = await fetchResults(query);
    if (!ignore) setResults(data);      // discard the response if we've moved on
  }
  load();

  return () => { ignore = true; };      // cleanup runs before the next effect
}, [query]);
```

📖 [react.dev — Synchronizing with Effects: Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)
📖 [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

## 17. The event loop, in one page

Why this matters: it explains *when* your callbacks run, which explains why
state updates are batched and why a `console.log` right after `setState` shows
the old value.

The engine runs one thing at a time. When the call stack empties, it drains the
**microtask queue** (promise callbacks) completely, then takes one **macrotask**
(a timer, an I/O callback, a DOM event) and repeats.

```js
console.log('1 — sync');

setTimeout(() => console.log('4 — macrotask (timer)'), 0);

Promise.resolve().then(() => console.log('3 — microtask'));

console.log('2 — sync');

// Output: 1 — sync, 2 — sync, 3 — microtask, 4 — macrotask (timer)
```

Microtasks always beat timers, even a `setTimeout(..., 0)`.

**Blocking is real.** A long synchronous loop freezes everything — no clicks,
no paint, no timers:

```js
const t = Date.now();
while (Date.now() - t < 3000) {}     // the tab is frozen for 3 full seconds
```

**→ In React:** the same single thread renders your components. A slow render or
an expensive synchronous computation in a component body makes the UI
unresponsive, which is why React 19 offers transitions
(`useTransition`, `startTransition`) to mark work as interruptible. Covered in
[Module 15](../15-performance/).

---

## 18. Errors and `try` / `catch`

```js
function parseConfig(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Invalid config JSON:', error.message);
    return {};                      // a sensible fallback
  } finally {
    // always runs — cleanup goes here
  }
}
```

Throw `Error` objects, never strings — you lose the stack trace otherwise:

```js
throw new Error('Order not found');                 // ✓
throw 'Order not found';                            // ✗

class ApiError extends Error {                      // custom error types
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
throw new ApiError('Unauthorized', 401);
```

`try`/`catch` does **not** catch errors from an un-awaited async call:

```js
try {
  loadProducts();          // ✗ returns a promise; the rejection escapes
} catch (e) { /* never runs */ }

try {
  await loadProducts();    // ✓ now the rejection is caught
} catch (e) { /* runs */ }
```

**→ In React:** errors thrown during render are caught by an **error boundary**,
not by `try`/`catch` around your JSX. Errors inside event handlers and effects
need normal JavaScript handling. [Module 16](../16-advanced-patterns/) covers
boundaries.

---

## 19. The DOM and events (what React replaces)

You will write very little of this by hand once you use React, but you must
recognise it — it is what React is doing on your behalf, and refs put you back
in this world.

```js
const el = document.querySelector('#root');
const all = document.querySelectorAll('.card');

el.textContent = 'Hello';
el.classList.add('active');
el.setAttribute('aria-busy', 'true');
el.dataset.productId = '7';

const div = document.createElement('div');
el.appendChild(div);
el.remove();
```

### Events, bubbling and delegation

```js
button.addEventListener('click', (event) => {
  event.preventDefault();        // stop the browser's default action
  event.stopPropagation();       // stop bubbling to ancestors
  console.log(event.target);     // the element actually clicked
  console.log(event.currentTarget); // the element the listener is attached to
});
```

Events bubble from the clicked element up through its ancestors — which is why
one listener on a container can serve a hundred children ("delegation"). React
uses a variant of this internally.

**→ In React:** you write `onClick={...}` in JSX and React manages the listener.
The `event` object you receive is a React synthetic event with the same
`preventDefault`, `stopPropagation`, `target` API. Direct DOM access is the
exception, reached for through refs (focus management, scrolling, canvas,
integrating a non-React library):

```jsx
const inputRef = useRef(null);
useEffect(() => { inputRef.current?.focus(); }, []);
return <input ref={inputRef} />;
```

📖 [react.dev — Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)

---

## 20. Classes — the 10% you still need

Modern React is written with functions. You still need to *read* classes,
because they appear in older codebases and in error boundaries.

```js
class Product {
  #internalId = crypto.randomUUID();   // # = truly private field

  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  get label() {                        // getter — accessed as product.label
    return `${this.name} — $${(this.price / 100).toFixed(2)}`;
  }

  static fromApi(json) {               // static — called as Product.fromApi(...)
    return new Product(json.name, json.price_cents);
  }
}

class DigitalProduct extends Product {
  constructor(name, price, sizeMb) {
    super(name, price);                // must call super() before using `this`
    this.sizeMb = sizeMb;
  }
}
```

**→ In React:** a class component looks like this. You should not write new
ones, but you will maintain them:

```jsx
class Counter extends React.Component {
  state = { count: 0 };
  handleClick = () => this.setState((s) => ({ count: s.count + 1 }));   // arrow binds `this`

  componentDidMount() { /* ≈ useEffect(..., []) */ }
  componentDidUpdate() { /* ≈ useEffect with deps */ }
  componentWillUnmount() { /* ≈ the effect cleanup function */ }

  render() {
    return <button onClick={this.handleClick}>{this.state.count}</button>;
  }
}
```

Error boundaries are the one thing still commonly written as a class, because
`componentDidCatch` has no hook equivalent.

---

## 21. `Map`, `Set` and when to reach for them

```js
// Set — unique values, O(1) membership
const seen = new Set([1, 2, 2, 3]);
seen.size;                 // 3
seen.has(2);               // true
seen.add(4);
[...seen];                 // [1, 2, 3, 4] — spread back to an array

const unique = [...new Set(['a', 'b', 'a'])];    // ['a', 'b'] — dedupe idiom

// Map — keys of any type, preserves insertion order
const byId = new Map([[1, { name: 'Keyboard' }]]);
byId.get(1);
byId.set(2, { name: 'Mouse' });
byId.has(2);
byId.size;
for (const [id, product] of byId) { /* ... */ }
```

Use a `Set` for "which ids are selected", a `Map` for a lookup table. Use a
plain object when the keys are strings and you want easy JSON serialisation.

**→ In React:** `Set` and `Map` are mutable, so treat them immutably in state —
copy, then modify the copy:

```jsx
const [selected, setSelected] = useState(new Set());

function toggle(id) {
  setSelected((prev) => {
    const next = new Set(prev);        // copy first
    next.has(id) ? next.delete(id) : next.add(id);
    return next;                       // new reference → React re-renders
  });
}
```

---

## 22. Purity, side effects and referential identity

A **pure** function returns the same output for the same input and touches
nothing outside itself.

```js
// pure
const add = (a, b) => a + b;
const withTax = (price, rate) => price * (1 + rate);

// impure — mutates an argument
function addItemBad(cart, item) {
  cart.items.push(item);      // caller's object changed
  return cart;
}

// pure version
const addItem = (cart, item) => ({ ...cart, items: [...cart.items, item] });

// impure — reads/writes the outside world (a "side effect")
let requestCount = 0;
function trackedFetch(url) {
  requestCount++;             // external state
  console.log(url);           // I/O
  return fetch(url);          // network
}
```

Side effects are not bad — an app that does nothing to the world is useless.
They just need to happen in the *right place*.

**→ In React:** React requires your component function and your hooks to be
**pure during render**. Same props and state in, same JSX out, and no
"reaching outside" while rendering — no network calls, no DOM writes, no
mutating variables declared outside the component. Side effects belong in event
handlers (for user-caused things) or in effects (for synchronising with an
external system).

React exploits purity aggressively: it may call your component twice in
development (Strict Mode) to surface impurity, skip a render it can prove is
unnecessary, and the React Compiler memoises on the assumption that your code
is pure. Impure components produce bugs that only appear in production builds.

### Referential identity, one more time

Because objects compare by reference, a new object literal in a component body
is a *different* value every render:

```jsx
function Parent() {
  const config = { pageSize: 20 };            // NEW object every render
  const onSave = () => {};                    // NEW function every render
  return <Child config={config} onSave={onSave} />;
}
```

If `Child` is wrapped in `memo`, or if `config` is in an effect's dependency
array, this defeats it — the props "changed" every time even though nothing
meaningful did. The fixes (`useMemo`, `useCallback`, moving the value outside
the component, or letting the React Compiler handle it) are in
[Module 15](../15-performance/), but the *reason* is the JavaScript fact from
[§10](#10-objects-in-depth).

📖 [react.dev — Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
📖 [react.dev — Rules of React: Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

---

## 23. The tooling around the language

You do not need to master this before React, but you need the vocabulary.

### Node.js and npm

**Node** runs JavaScript outside the browser — it is what your dev server,
bundler, linter and test runner are written for. **npm** is the package manager
that ships with it.

```bash
node -v                     # 20.19+ or 22.12+ for current React tooling
npm -v

npm init -y                 # create a package.json
npm install react react-dom # add runtime dependencies
npm install -D vitest       # add a dev-only dependency
npm ci                      # install exactly what package-lock.json says (use in CI)
npm run dev                 # run a script from package.json
npx create-vite my-app      # run a package without installing it globally
```

### `package.json`, the lockfile, `node_modules`

```json
{
  "name": "shopcrew",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest"
  },
  "dependencies": { "react": "^19.0.0" },
  "devDependencies": { "vite": "^8.0.0" }
}
```

- **`dependencies`** ship to the browser. **`devDependencies`** are build-time
  only.
- **`package-lock.json`** pins the exact resolved version of every package,
  direct and transitive. **Commit it.** It is what makes your build
  reproducible.
- **`node_modules/`** is generated. Never commit it; it is in `.gitignore`.

### Semver ranges

| Range | Means |
|---|---|
| `19.0.0` | exactly this version |
| `^19.0.0` | any `19.x.x` — minor and patch updates allowed |
| `~19.0.0` | any `19.0.x` — patch updates only |

### Why a build step exists at all

Browsers do not understand JSX, and until recently could not efficiently load
thousands of small modules. A build tool:

1. **Transforms** JSX and modern syntax into plain JavaScript
   (Babel, SWC, esbuild).
2. **Bundles and code-splits** your modules into files a browser fetches
   efficiently (Rollup, webpack, Rspack).
3. **Optimises** — minification, tree-shaking of unused exports, asset hashing
   for cache-busting.
4. **Serves** a dev server with Hot Module Replacement so an edit appears
   without a full reload.

Module 2 covers which tool to pick and why Create React App is no longer the
answer.

📖 [react.dev — Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)

---

## 24. A glance at TypeScript

Professional React is overwhelmingly TypeScript. You do not need it to start,
and this course teaches JavaScript concepts first, but here is the shape of it
so nothing surprises you:

```ts
type Product = {
  id: number;
  name: string;
  price: number;
  tags?: string[];              // optional
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const products: Product[] = [];
```

In a component, types describe the props:

```tsx
type ButtonProps = {
  variant?: 'primary' | 'ghost';       // a union of allowed literals
  onClick: () => void;
  children: React.ReactNode;
};

function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return <button className={`btn btn--${variant}`} onClick={onClick}>{children}</button>;
}
```

TypeScript is erased at build time — it produces no runtime code. Its whole
value is catching the "cannot read property of undefined" class of bug in your
editor instead of in production.

📖 [react.dev — Using TypeScript](https://react.dev/learn/typescript)

Full treatment in [Module 17](../17-typescript-with-react/).

---

## 25. JavaScript → React cheat sheet

| JavaScript concept | Where it shows up in React |
|---|---|
| Arrow functions | Components, event handlers, callbacks in `map` |
| Implicit return | One-line components and selectors |
| Expression vs statement | What is legal inside JSX `{ }` |
| Truthy/falsy, `&&` | Conditional rendering — and the stray `0` bug |
| Ternary | Inline conditional JSX |
| `?.` / `??` | Rendering data that may not have arrived yet |
| Object destructuring | `function Card({ title, children })` |
| Array destructuring | `const [value, setValue] = useState()` |
| Rest in params | `function Button({ variant, ...rest })` |
| Spread | Immutable state updates, `{...props}` forwarding |
| Shallow copy | Why nested state updates need nested spreads |
| `map` | Rendering lists |
| `filter` | Search, facets, deleting an item from state |
| `find` | Selecting one record by id |
| `reduce` | Cart totals, grouping, indexing by id |
| Non-mutating array ops | The core rule of state updates |
| Reference equality | Re-render decisions, `memo`, effect dependencies |
| Closures | State-as-a-snapshot, stale values, updater functions |
| Functions as values | Passing callbacks down as props |
| ES modules | Component files, `lazy(() => import(...))` |
| Promises / `async`-`await` | Data fetching, server functions |
| `AbortController` | Effect cleanup, avoiding request race conditions |
| Event loop | Batched state updates, transitions, why the UI freezes |
| `try`/`catch` | Handlers and effects (render errors use boundaries) |
| DOM API | Refs — focus, scroll, canvas, third-party widgets |
| Classes | Reading legacy components; error boundaries |
| `Set` / `Map` | Selection state, lookup tables |
| Purity | The rule React's rendering model depends on |

---

## 26. Self-check exercises

Do these before starting Module 2. If you can write all fifteen without
looking anything up, you are ready.

1. Write `formatPrice(cents)` returning `"$49.99"` for `4999`.
2. Given `products`, produce an array of names of items with `stock === 0`.
3. Same data: return the total value of stock (`price × stock`) as one number.
4. Write `updatePrice(products, id, newPrice)` that returns a **new** array with
   one product's price changed and everything else untouched.
5. Write `removeProduct(products, id)` immutably.
6. Write `addTag(products, id, tag)` — the tag goes into the product's nested
   `tags` array, immutably.
7. Sort a copy of `products` by name, ascending, without mutating the original.
8. Group `products` by `category` into `{ input: [...], display: [...] }`.
9. Given `order = { customer: { address: { city: 'Bath' } } }`, safely read
   `city` from an `order` that might be `{}`, defaulting to `'Unknown'`.
10. Explain why `{count && <Badge />}` renders a `0` and give two fixes.
11. Write a function that takes a delay and returns a promise resolving after
    it (`sleep(500)`).
12. Fetch `/api/products`, throw on a non-2xx status, return the parsed JSON,
    and let the caller handle failures.
13. Fetch two endpoints in parallel and destructure both results.
14. Write `makeIdGenerator()` returning a function that yields `1, 2, 3, …` —
    using a closure, no module-level variable.
15. Predict the output order, then verify:
    ```js
    console.log('a');
    setTimeout(() => console.log('b'), 0);
    Promise.resolve().then(() => console.log('c'));
    console.log('d');
    ```

<details>
<summary><strong>Answers</strong> — try first, then expand</summary>

```js
// 1
const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

// 2
const outOfStock = products.filter((p) => p.stock === 0).map((p) => p.name);

// 3
const stockValue = products.reduce((total, p) => total + p.price * p.stock, 0);

// 4
const updatePrice = (products, id, newPrice) =>
  products.map((p) => (p.id === id ? { ...p, price: newPrice } : p));

// 5
const removeProduct = (products, id) => products.filter((p) => p.id !== id);

// 6
const addTag = (products, id, tag) =>
  products.map((p) => (p.id === id ? { ...p, tags: [...p.tags, tag] } : p));

// 7
const byName = [...products].sort((a, b) => a.name.localeCompare(b.name));
// or: products.toSorted((a, b) => a.name.localeCompare(b.name));

// 8
const byCategory = products.reduce((groups, p) => {
  groups[p.category] = [...(groups[p.category] ?? []), p];
  return groups;
}, {});
// or: Object.groupBy(products, (p) => p.category);

// 9
const city = order.customer?.address?.city ?? 'Unknown';

// 10  `0` is falsy, so `&&` returns the left operand — the number 0 — and
//     React renders numbers as text. Fixes: `count > 0 && <Badge />`
//     or `count ? <Badge /> : null`.

// 11
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 12
async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 13
const [user, orders] = await Promise.all([fetchUser(), fetchOrders()]);

// 14
function makeIdGenerator() {
  let id = 0;
  return () => ++id;
}

// 15  a, d, c, b
//     Synchronous first (a, d), then microtasks (c), then timers (b).
```
</details>

---

## 27. References

Official React documentation only, as used by this course.

**JavaScript inside React**
- [JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces) — which expressions are legal in JSX
- [Conditional Rendering](https://react.dev/learn/conditional-rendering) — ternary, `&&`, and the falsy trap
- [Rendering Lists](https://react.dev/learn/rendering-lists) — `map`, `filter`, and `key`
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component) — destructuring, defaults, spread forwarding
- [Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components) — ES module conventions

**Immutability and state**
- [Updating Objects in State](https://react.dev/learn/updating-objects-in-state) — spread, shallow copies, nested updates
- [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state) — the mutating vs non-mutating table
- [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot) — closures over render values
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates) — the updater-function form
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

**Purity and the rules**
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [Rules of React](https://react.dev/reference/rules)
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

**Async, effects and the DOM**
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) — cleanup, race conditions
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [Responding to Events](https://react.dev/learn/responding-to-events)

**Tooling and types**
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch) — what a bundler does for you
- [Using TypeScript](https://react.dev/learn/typescript)
- [`lazy`](https://react.dev/reference/react/lazy) — dynamic `import()` in practice

---

**Next:** [Module 2 — Introduction to React & Getting Started](../02-react-introduction/)
