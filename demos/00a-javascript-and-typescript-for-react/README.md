# Session 1 — JavaScript & TypeScript for React

**Session guide** · ~150 minutes · the JavaScript that React assumes you already know, with TypeScript on from the first line

---

## Where you are starting from

The starter is a Vite **vanilla-ts** project: `index.html`, `src/main.ts`, a
tiny `style.css`, and exactly two dev dependencies — `typescript` and `vite`.
No React. No Bootstrap. Nothing to unlearn.

Written for you: `src/types.ts` (the `Product` type, shaped like a DummyJSON
product), `src/data/sampleProducts.ts` (three of them), and `createCard` in
`src/render.ts` (forty lines of `createElement` you read, not type). Every
other function under `src/` is a stub that compiles and does nothing useful:
`lib/format.ts`, `lib/catalog.ts`, `lib/fn.ts`, `api.ts`, the rest of
`render.ts`, `main.ts`. Nineteen `TODO(lab-…)` markers say what goes where.

## What you ship today

The ShopScope catalogue in plain TypeScript: `formatPrice` and
`discountedPrice`, a `catalog.ts` that filters, sorts and groups 194 products
without mutating anything, a handful of generic helpers, a typed `fetch` of
DummyJSON with a real error type, and a product grid rendered **by hand** —
`createElement`, `append`, one delegated click listener — with a wishlist heart
you keep in sync yourself. Session 2 rewrites that grid in React, and the
three files at its heart (`types.ts`, `format.ts`, `sampleProducts.ts`) move
into Demo 1 **byte for byte**.

By the end you will be able to answer, without hesitating:

- Why JSX only accepts expressions, and what that forces you to do with `if`
- Which eight values are falsy, and why `count && <Badge />` renders a `0`
- What `{ ...product, price: 5 }` copies, what it shares, and why React needs it
- Why `[...products].sort()` and not `products.sort()`
- What a closure captures, and why React calls state "a snapshot"
- Why `products[0]` is `Product | undefined` here, and how to live with it
- What `e is ApiError` does to the code after the `if`

> **Every TypeScript idea today is a thin label on a JavaScript idea.** A
> literal union is a fact about which strings show up; `readonly` is a fact
> about who mutates; `unknown` is a fact about what a network can hand you.
> When the type looks strange, look for the runtime fact underneath it.

## Pre-reading

[study-notes 01 — JavaScript Foundations](../../study-notes/01-javascript-foundations/README.md),
in full. The session teaches the subset React leans on; the notes carry the
rest (classes §20, npm and semver §23, the cheat sheet §25). Per lab:

| Lab | Read first |
|---|---|
| 1 · The language you'll write JSX in | §2 `let`/`const` · §3 functions and `this` · §4 template literals · **§5 expressions vs statements** · §24 a glance at TypeScript |
| 2 · Truthiness, unions and narrowing | §6 truthiness and equality · §7 `?.` and `??` |
| 3 · Shapes | §8 destructuring · §9 spread · §10 reference vs value · **§11 immutability** |
| 4 · The array toolbox | §12 array methods · §21 `Map` and `Set` |
| 5 · Closures, purity, identity, generics | **§13 closures** · §14 higher-order functions · §22 purity and referential identity |
| 6 · Modules & async | §15 modules · §16 promises and `fetch` · §17 the event loop · §18 errors |
| 7 · The DOM, imperatively | §19 the DOM and events |

## Deferred to the demos

Not front-loaded here — each lands where the app first needs it:

| TypeScript idea | Where it lands |
|---|---|
| Generics in components (a generic `Select`, a generic `useFetch`) | Demo 4, Demo 8 |
| `z.infer<typeof schema>` — types from a validator | Demo 4 |
| Module augmentation (`declare module 'axios'`) | Demo 6 |
| `satisfies` | Demo 6 |
| Discriminated unions for request state | Demo 12, Demo 13 |
| `ComponentProps<'button'>` and polymorphic `as` props | Demo 17 |

---

## Before the session (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/00a-javascript-and-typescript-for-react/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL. Every click of the
> `/fork/` link is a fresh copy.

Locally: `cd demos/00a-javascript-and-typescript-for-react/starter && npm install && npm run dev`.

Have two tabs open beside the app: `https://dummyjson.com/products/1` and
`https://dummyjson.com/products?limit=2`. You will read both against your types.

---

## The cold open

Open `demos/01-components-jsx-props/starter/src/lib/format.ts` and
`src/data/sampleProducts.ts`. Fifteen lines and sixty-three. Read
`formatPrice`: one `Intl.NumberFormat`, one function, a return type. Read the
first product: `"price": 9.99`, `"discountPercentage": 10.48`, `"stock": 99`
— the exact JSON DummyJSON serves.

**By the end of today you will have written both of these yourself, and a
product grid with no React in it.** Then, in Session 2, you will watch that
grid break in a way you cannot fix by being more careful — the moment React
becomes necessary rather than fashionable.

Now `npm run dev` in *this* starter: a toolbar that does nothing and one line,
*3 sample products loaded · formatPrice(9.99) currently gives "9.99"*. Every
lab makes one file honest.

---

## Lab 1 — The language you'll write JSX in (20 min)

### Problem

`formatPrice(9.99)` returns `"9.99"`. It should return `"$9.99"`, and it
should be impossible to call it with a string.

### Concept

**Expressions vs statements is the one distinction JSX will punish you for
not knowing.** An expression *produces a value* — `2 + 2`, `user.name`,
`ok ? 'Yes' : 'No'`, `products.map(…)`. A statement *does something* — `if`,
`for`, `const x = …`, `return`. The test: could you pass it to
`console.log(…)`? JSX's curly braces take expressions only — a ternary or a
`.map()` can live inside markup, an `if` cannot; statements go above the
`return`.

| Statement (does) | Expression form (is) |
|---|---|
| `if (stock > 0) label = 'In stock'; else label = 'Sold out';` | `stock > 0 ? 'In stock' : 'Sold out'` |
| `for (const p of products) names.push(p.title);` | `products.map((p) => p.title)` |
| `let s = ''; if (brand) s = brand;` | `brand ?? 'Unbranded'` |

**`const` by default, `let` when you reassign, `var` never.** `const` stops
*reassignment*, not *mutation* — `const p = { price: 1 }; p.price = 2` is
legal; Lab 3 is why you still won't. **Arrow functions have no `this`**,
which is why they replaced `function` for callbacks; one trap: an arrow
returning an object literal needs parentheses, `() => ({ id: 1 })`.
**Template literals** interpolate any expression — JSX's `{}` does the same job.

**And TypeScript says: annotate the boundaries, infer the middle.**
`function formatPrice(amount: number): string` — parameter and return types
are the *contract*; the `const usd` inside needs nothing. `interface` and
`type` are interchangeable for object shapes; this track uses `interface`
for objects and `type` for unions and aliases (Lab 2). `brand?: string`
means the key may be absent; `readonly id: number` means no one may assign
to it.

**Vite serves; `tsc` checks.** Vite strips the types without reading them —
a type error does *not* stop the dev server. `npm run typecheck` is the
check, and `npm run build` runs it first. The page working proves nothing
about the types.

### Steps

**A. `src/lib/format.ts` — `TODO(lab-1.1)`**

Replace the stub:

```ts
// One formatter, created once at module scope — not on every call.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 9.99 → "$9.99". Never format money with string concatenation. */
export function formatPrice(amount: number): string {
  return usd.format(amount);
}
```

Leave `discountedPrice` and its marker for Lab 2. TypeScript would infer the
`: string`; writing it makes the promise visible at the top of the file, and
a future edit that returns a `number` fails *here*, not in the component.

**B. `src/types.ts` — `TODO(lab-1.2)`**

Read `Product` field by field against `https://dummyjson.com/products/1`.
`brand?` is optional because 92 of the 194 live products have none. Now prove
the type does something: change `price: number` to `price: string` and run
`npm run typecheck`. Three errors, one per sample product:

```
error TS2322: Type 'number' is not assignable to type 'string'.
```

The type is *load-bearing*. Put `number` back and delete the marker line —
the file is now byte-identical to Demo 1's, and Session 2 copies it across.

**C. `src/main.ts` — `TODO(lab-1.3)`**

Delete the marker line and replace everything **below the markers**:

```ts
const grid = document.querySelector<HTMLElement>('#grid')!;

// One EXPRESSION per product: a template literal wrapping a ternary. No if, no loop body, no temp variable.
const lines = sampleProducts.map(
  (p) => `${p.title} — ${formatPrice(p.price)} — ${p.stock > 0 ? 'in stock' : 'sold out'}`,
);

const pre = document.createElement('pre');
pre.textContent = lines.join('\n');
grid.replaceChildren(pre);
```

Read the callback as JSX-in-waiting: in Demo 1 the same line becomes
`{products.map((p) => <li>{p.title}</li>)}`.

### Verify

1. Three lines; the second says *sold out* (product 3 has `stock: 0`).
   Prices have a `$`.
2. Break it: `formatPrice('9.99')` in `main.ts`. **The page still works.**
   `npm run typecheck`:
   ```
   error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
   ```
   Revert. Remember which tool caught it.
3. Hover `lines`: `string[]`. Inference from `map`.

### Watch out

**`() => { title: p.title }` returns `undefined`.** Braces start a block and
`title:` is a label. `() => ({ title: p.title })`.

**`npm run dev` is green, the build is red.** Always. Keep `npm run
typecheck` in a second terminal, or trust the editor's squiggles.

### In the real world

The `Intl` formatter at module scope is the pattern "expensive to create,
cheap to use — build it outside the function". In React the same instinct
becomes "don't create it inside the component body"; Demo 18 measures why.

---

## Lab 2 — Truthiness, unions and narrowing (20 min)

### Problem

`discountedPrice(9.99, 10.48)` returns `9.99`. And `catalog.ts` calls a sort
order a `string`, so `sortProducts(products, 'price', 'up')` is legal today
and wrong forever.

### Concept

**There are exactly eight falsy values**: `false`, `0`, `-0`, `0n`, `''`,
`null`, `undefined`, `NaN`. Everything else is truthy — including `'0'`,
`[]` and `{}`. The one that bites React developers is `0`:

```tsx
{cart.count && <Badge count={cart.count} />}   // count is 0 → renders "0" on the page
```

`&&` returns the *left* operand when it is falsy, and `0` is renderable.
Demo 2 shows the bug; the fix is a boolean (`cart.count > 0 && …`) or a ternary.

**`||` and `??` answer different questions.** `a || b` gives `b` when `a` is
*falsy* — `qty || 1` turns a real `0` into `1`. `a ?? b` gives `b` only for
`null`/`undefined`. For "missing", use `??`. `?.` reads through a
possibly-missing value and yields `undefined` instead of throwing; `??=`
assigns only when the target is nullish (Lab 4). **Always `===`.**

**And TypeScript says: a literal union is a set of allowed values.**
`type SortOrder = 'asc' | 'desc'` holds exactly those two strings. This is
what `enum` was for, without the runtime object. When you also need the
values *at runtime*, write the array once with `as const` and derive the type:

```ts
export const SORT_ORDERS = ['asc', 'desc'] as const;       // readonly ['asc', 'desc'] — not string[]
export type SortOrder = (typeof SORT_ORDERS)[number];       // 'asc' | 'desc'
```

**Narrowing** is TypeScript following your `if`: after `typeof x ===
'string'`, `x` *is* a string in that branch; after `'brand' in product`, the
key exists; after `value === 'desc'`, `value` is the literal. `keyof
Product` is the union of its key names; `Product['category']` is the type of
one field — *indexed access*.

### Steps

**A. `src/lib/format.ts` — `TODO(lab-2.1)`**

Replace the stub (the parameter loses its underscore now that it is used):

```ts
/** DummyJSON gives a list price and a percentage; the sale price is DERIVED. */
export function discountedPrice(price: number, discountPercentage = 0): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}
```

A **default parameter**: type inferred as `number`, parameter optional. It is
`??` spelt as a parameter — only a *missing* argument takes the default; a
real `0` stays `0`. Delete the marker; the file is byte-identical to Demo 1's.

**B. `src/lib/catalog.ts` — `TODO(lab-2.2)`**

Replace the two placeholder types and `parseSortOrder`:

```ts
/** `as const` freezes the array AND narrows its element type from `string` to the two literals. */
export const SORT_ORDERS = ['asc', 'desc'] as const;
/** Derived FROM the value, so the type and the runtime list can never drift apart. */
export type SortOrder = (typeof SORT_ORDERS)[number];

/** A hand-picked subset of `keyof Product` — the fields a user may sort by. */
export type SortKey = 'price' | 'rating' | 'title';

/** Indexed access: "whatever type `category` has on `Product`". Today `string`; if that changes, this follows. */
export type Category = Product['category'];

export type StockLabel = 'Out of stock' | 'Low stock' | 'In stock';

/** A `<select>` hands you a `string`; the rest of the code wants a `SortOrder`. `===` narrows. */
export function parseSortOrder(value: string): SortOrder {
  return value === 'desc' ? 'desc' : 'asc';
}
```

`parseSortOrder` is the shape of every boundary: a wide type in (`string`
from the DOM), a narrow type out, the narrowing in *one* place.

**C. `src/lib/catalog.ts` — `TODO(lab-2.3)`**

Replace `stockLabel` and `brandLabel`, add `tagLine`:

```ts
/** The return type is a literal union: a typo in a branch is a compile error, not a wrong badge. */
export function stockLabel(product: Product): StockLabel {
  if (product.stock === 0) return 'Out of stock';
  if (product.stock < 10) return 'Low stock';
  return 'In stock';
}

/** `??` defaults for null/undefined ONLY. `||` would also swallow '' — and 0, which is the bug JSX will show you. */
export function brandLabel(product: Product): string {
  return product.brand ?? 'Unbranded';
}

/** `?.` stops at the first missing link and yields undefined; `??` then supplies the fallback. */
export function tagLine(product: Product): string {
  return product.tags?.join(', ') ?? '';
}
```

Three early returns are three *statements* — legal here because this is a
function body, not JSX. Demo 1's `StockBadge` is this function with markup.

### Verify

1. In the browser console (Vite serves your source as modules):
   ```ts
   const { discountedPrice } = await import('/src/lib/format.ts');
   discountedPrice(9.99, 10.48);   // 8.94
   discountedPrice(9.99);          // 9.99 — the default
   discountedPrice(9.99, 0);       // 9.99 — a real 0 is NOT replaced
   0 || 'fallback';                // 'fallback'
   0 ?? 'fallback';                // 0
   ```
2. Type `const order: SortOrder = 'up';` in `catalog.ts`:
   ```
   error TS2322: Type '"up"' is not assignable to type '"asc" | "desc"'.
   ```
   Delete it. Hover `SORT_ORDERS`: `readonly ["asc", "desc"]`. Remove `as
   const`, hover again: `string[]` — the union is gone with it. Put it back.
3. Change a `stockLabel` branch to `'Low Stock'` (capital S). The return type
   catches the typo. Revert.

### Watch out

**`if (product.discountPercentage)` skips a real `0%`.** Any number that can
legitimately be zero: compare explicitly.

**`enum` looks like a union and is not** — it compiles to a runtime object.
`erasableSyntaxOnly` in this tsconfig **forbids** it; use `as const`.

**Narrowing does not survive a function call** unless the function is a
type guard (`x is string`) — Lab 6.

### In the real world

Literal unions are the most-used TypeScript feature in a React codebase:
`variant: 'primary' | 'secondary'`, `status: 'idle' | 'loading' | 'error'`.
`parseSortOrder` is the pattern for every `URLSearchParams.get()` and
`event.target.value` — a wide type in, a known set out.

---

## Lab 3 — Shapes: destructuring, spread, immutability (25 min)

### Problem

You need four fields from a `Product` for a card, three for an edit form,
and a way to change a product's price *without changing the product*. The
obvious code — `product.price = 5` — is exactly what React cannot see.

### Concept

**Objects and arrays are references.** `const b = a; b.price = 2` changes
`a.price`: one object, two names. `a === b` compares the *reference*, not the
contents — `{} === {}` is `false`. React uses that comparison to decide
whether anything changed. Mutate in place and React compares the same
reference to itself, sees "unchanged", and skips the update. Hence the rule:

**Never mutate what you were handed; build a new one.** `{ ...product,
price: 5 }` is a *new* object with every key of `product`, then `price`
overridden — later keys win. `[...products, next]` is a new array. Both are
**shallow**: `{ ...product }.tags === product.tags`. Nested changes spread at
every level you touch.

**Destructuring pulls keys into variables**, best done in the parameter
list: `function toPreview({ id, title }: Product)`. Defaults go inside the
pattern (`{ brand = 'Unbranded' }`); rest collects the remainder (`{ id,
...rest }`). Every React component starts with a destructured `props`.

**The four state updates** — add, remove, update one, toggle membership —
are `[...xs, x]`, `xs.filter(…)`, `xs.map((x) => cond ? { ...x, patch } :
x)` and `includes ? filter : spread`. Learn them as reflexes.

**And TypeScript says: derive shapes from the source of truth** instead of
writing a second interface that must be kept in step:

| Utility | Meaning | Today |
|---|---|---|
| `Readonly<T>` | every key `readonly` — assignment is a compile error | a parameter you promise not to mutate |
| `Partial<T>` | every key optional | a patch: "any subset of these fields" |
| `Pick<T, K>` | only the listed keys | what a card needs |
| `Omit<T, K>` | everything except the listed keys | a list item without `description` |
| `Record<K, V>` | keys of type `K`, values of type `V` | `Record<Category, Product[]>` — Lab 4 |

`readonly Product[]` is the honest parameter type for "I will read this list
and not reorder it": `.push` and `.sort` are not even on the type.

### Steps

**A. `src/lib/catalog.ts` — `TODO(lab-3.1)`**

Add `import { formatPrice } from './format';` at the top, then under the
*shapes & immutability* banner:

```ts
/** What a card needs — nothing more. `Pick` names the subset once. */
export type ProductPreview = Pick<Product, 'id' | 'title' | 'thumbnail' | 'price'>;

/** What an edit form may send: any subset of these three fields. */
export type ProductPatch = Partial<Pick<Product, 'price' | 'stock' | 'discountPercentage'>>;

/** The list shape without the long text — what a list endpoint might return. */
export type ProductSummary = Omit<Product, 'description'>;

/** Destructure in the parameter list; `Readonly<Product>` promises the caller we will not touch it. */
export function toPreview({ id, title, thumbnail, price }: Readonly<Product>): ProductPreview {
  return { id, title, thumbnail, price };
}

/** A default INSIDE the destructuring pattern — `brand` is optional on Product, so it needs one. */
export function describeProduct({ title, brand = 'Unbranded', price }: Product): string {
  return `${title} by ${brand} — ${formatPrice(price)}`;
}
```

`{ id, title, thumbnail, price }` on the return line is **shorthand
property syntax** — `{ id: id, … }`. Destructure in, shorthand out.

**B. `src/lib/catalog.ts` — `TODO(lab-3.2)`**

```ts
// The four updates you will write constantly. None of them touches its input:
// each hands back a NEW array, which is what a React state setter needs to see.

export function addProduct(products: readonly Product[], product: Product): Product[] {
  return [...products, product];
}

export function removeProduct(products: readonly Product[], id: number): Product[] {
  return products.filter((p) => p.id !== id);
}

/** Spread, then the patch: later keys win, so the patch overrides. Untouched items are the SAME objects. */
export function updateProduct(products: readonly Product[], id: number, patch: ProductPatch): Product[] {
  return products.map((p) => (p.id === id ? { ...p, ...patch } : p));
}

/** Toggle membership in a list of ids — the wishlist. */
export function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
```

`updateProduct` is the one to stare at: items that did not match are
returned *as is* — same reference — and only the matched one is new. React
(and Demo 18's `memo`) can tell which card changed from that alone.

### Verify

```ts
const { sampleProducts } = await import('/src/data/sampleProducts.ts');
const { updateProduct, toggleId, toPreview } = await import('/src/lib/catalog.ts');

const next = updateProduct(sampleProducts, 3, { stock: 12 });
next === sampleProducts;          // false — a new array
next[0] === sampleProducts[0];    // true  — untouched item, same object
next[1] === sampleProducts[1];    // false — the one we changed
sampleProducts[1].stock;          // 0     — the original is untouched
({ ...sampleProducts[0] }).tags === sampleProducts[0].tags;   // true — SHALLOW
toggleId([1, 5], 5);              // [1]
toPreview(sampleProducts[0]);     // four keys, no more
```

Then in `toPreview`, change the pattern to `(product: Readonly<Product>)`
and write `product.price = 0;`:
`error TS2540: Cannot assign to 'price' because it is a read-only property.`
Revert.

### Watch out

**`products.push(next)` in a React state update is invisible.** Same
reference, nothing re-renders. Spread instead — every time.

**`Partial<Product>` as a patch type is too loose** — it accepts `{ id: 99 }`.
`Partial<Pick<…>>` says exactly which fields are editable.

### Challenge (2 min)

`withoutDescription(product: Product): ProductSummary` with rest in the
pattern: `const { description, ...rest } = product`. `noUnusedLocals`
complains about `description`; the idiom is `_description` — a leading
underscore means "unused on purpose" to both tsc and ESLint.

### In the real world

`updateProduct` *is* the reducer case in Demo 12, the Zustand `set((s) =>
({ … }))` in Demo 13 and the optimistic update in Demo 14. Reviewers look
for mutation first — one `.push` in a reducer passes every manual test and
fails in production when a memoised child does not update.

---

## Lab 4 — The array toolbox on 194 products (25 min)

### Problem

Three sample products hide every problem. The live catalogue has 194 across
24 categories. You need to filter, search, sort and group them — and
`sortProducts` must not reorder the caller's array.

### Concept

**`map`, `filter`, `find`, `some`, `every`, `reduce`** — each takes a
callback, returns a *new* value, mutates nothing. `map` transforms, `filter`
keeps, `find` returns the first match *or `undefined`*, `some`/`every`
answer yes/no, `reduce` folds a list into anything. They chain.

**The mutators and their safe twins.** `sort`, `reverse`, `splice`, `push`,
`pop`, `shift`, `unshift` change the array in place; React state must never
meet them. Copy-then-mutate — `[...products].sort(…)` — or the twin (`slice`
for `splice`, `toSorted()`). `sort` also compares as *strings* by default
(`[10, 9, 1].sort()` → `[1, 10, 9]`); always pass a comparator.

**`flatMap`** is `map` then flatten one level. **`Set`** keeps one of each
and spreads back to an array; **`Map`** is keyed by anything with O(1)
lookup — the tool for "product by id".

**And TypeScript says: callbacks are inferred, indexes are honest.** You
never annotate `p` in `products.filter((p) => …)`; `reduce` is the
exception — its accumulator needs a hint, `reduce<Record<Category,
Product[]>>(…, {})`. And **`noUncheckedIndexedAccess`** is on here:
`products[0]` is `Product | undefined`, because an empty array has no first
element. Demo 1's tsconfig leaves the flag off so the React demos read
quieter; the runtime fact is the same, and you have now felt it once.

### Steps

**A. `src/lib/catalog.ts` — `TODO(lab-4.1)`**

Replace the two stubs and add three functions:

```ts
export function filterByCategory(products: readonly Product[], category: Category | 'all'): Product[] {
  return category === 'all' ? [...products] : products.filter((p) => p.category === category);
}

export function searchProducts(products: readonly Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...products];
  return products.filter((p) => p.title.toLowerCase().includes(q) || p.category.includes(q));
}

/** `a[key]` is `string | number`; `typeof` narrows to the branch that can compare it. */
function compare(left: string | number, right: string | number): number {
  if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right);
  return Number(left) - Number(right);
}

/** `.sort()` MUTATES. Copy first — the caller's array is not ours to reorder. */
export function sortProducts(products: readonly Product[], key: SortKey, order: SortOrder = 'asc'): Product[] {
  const direction = order === 'asc' ? 1 : -1;
  return [...products].sort((a, b) => compare(a[key], b[key]) * direction);
}

/** `noUncheckedIndexedAccess`: `[0]` is `Product | undefined` — the type now says what the runtime always did. */
export function cheapest(products: readonly Product[]): Product | undefined {
  return sortProducts(products, 'price')[0];
}
```

`a[key]` with `key: SortKey` is `string | number` — TypeScript unions the
three fields' types. `compare` is where Lab 2's `typeof` narrowing earns its
keep.

**B. `src/lib/catalog.ts` — `TODO(lab-4.2)`**

Replace `categoriesOf` and add the rest:

```ts
/** `reduce` into an object keyed by category. `??=` creates the bucket on first sight — and satisfies the checker. */
export function groupByCategory(products: readonly Product[]): Record<Category, Product[]> {
  return products.reduce<Record<Category, Product[]>>((groups, product) => {
    (groups[product.category] ??= []).push(product);
    return groups;
  }, {});
}

/** A Set keeps one of each; spreading it back gives an array. */
export function categoriesOf(products: readonly Product[]): Category[] {
  return [...new Set(products.map((p) => p.category))];
}

/** `flatMap` = map + flatten one level: 194 arrays of tags → one array of tags. */
export function allTags(products: readonly Product[]): string[] {
  return [...new Set(products.flatMap((p) => p.tags ?? []))].sort();
}

export function totalStock(products: readonly Product[]): number {
  return products.reduce((sum, p) => sum + p.stock, 0);
}

/** A Map for O(1) lookup by id. `new Map(pairs)` — the constructor's signature gives the arrow its `[key, value]` tuple context. */
export function byId(products: readonly Product[]): Map<number, Product> {
  return new Map(products.map((p) => [p.id, p]));
}
```

`groups[product.category]` is `Product[] | undefined` under the flag — you
cannot `.push` on it. `??=` assigns an empty array when the bucket is missing
*and evaluates to the bucket*. (The accumulator is mutated — it was created
two lines up and nobody else holds a reference. Purity is about what *others*
can see.)

**C. `src/main.ts` — `TODO(lab-4.3)`**

Delete the marker line and replace everything below the markers:

```ts
// A two-line preview of Lab 6 so the toolbox has 194 products to chew on. Lab 6 explains every word.
const response = await fetch('https://dummyjson.com/products?limit=0');
const { products } = (await response.json()) as { products: Product[] };

// A chain: each call returns a new array; nothing is mutated; each step is one idea.
const topBeauty = sortProducts(filterByCategory(products, 'beauty'), 'rating', 'desc')
  .slice(0, 3)
  .map(toPreview);
console.table(topBeauty);
console.log(Object.keys(groupByCategory(products)).length, 'categories');
console.log('cheapest:', cheapest(products)?.title);

const grid = document.querySelector<HTMLElement>('#grid')!;
const pre = document.createElement('pre');
pre.textContent = JSON.stringify(topBeauty, null, 2);
grid.replaceChildren(pre);
```

Fix the imports: `cheapest, filterByCategory, groupByCategory, sortProducts,
toPreview` from `./lib/catalog`, `import type { Product } from './types'`;
drop `sampleProducts` and `formatPrice`. Top-level `await` is legal in a
module. `as { products: Product[] }` is a promise to the compiler, not a
check — Lab 6 names it properly, Demo 4 makes it real.

### Verify

1. Three beauty products in the console, highest-rated first; `24
   'categories'`; `cheapest: …`. Remove the `?.` after `cheapest(products)`:
   `error TS18048: 'cheapest(...)' is possibly 'undefined'.` — the flag,
   through the return type. Put it back.
2. Prove `sort` mutates and the copy protects you:
   ```ts
   const { sortProducts } = await import('/src/lib/catalog.ts');
   const { sampleProducts } = await import('/src/data/sampleProducts.ts');
   sortProducts(sampleProducts, 'price', 'desc')[0].title;   // "Powder Canister"
   sampleProducts[0].title;                                   // "Essence Mascara…" — unchanged
   sampleProducts.sort((a, b) => b.price - a.price)[0].title; // and now…
   sampleProducts[0].title;                                   // …the ORIGINAL is reordered
   ```
3. `[10, 9, 1].sort()` → `[1, 10, 9]`. `products.some((p) => p.stock === 0)`
   → `true` (four of them).

### Watch out

**`Property 'sort' does not exist on type 'readonly Product[]'`.** The type
stopping you from mutating the caller's array. `[...products].sort(…)`.

**`reduce` without the generic infers the accumulator from `{}`** —
`Property 'beauty' does not exist on type '{}'`. Pass the type argument.

**`find` returns `T | undefined` — always.** `if (!p) return;` before `p.title`.

### In the real world

`filter → sort → slice → map` is Demo 7's search page and Demo 9's category
route, minus the URL state. `byId` is what every normalised store looks
like. `noUncheckedIndexedAccess` is on in more production tsconfigs every
year; the errors it surfaces are almost always real.

---

## Lab 5 — Closures, purity, identity, generics (20 min)

### Problem

`fn.ts` has a `debounce` that does not debounce, and you need three helpers
that do not care what a `Product` is — `pluck` a field from any list, build
a comparator from any selector, delay any function.

### Concept

**A closure is a function plus the variables it can see.** `makeCounter`
declares `let count`, returns two arrows, and *returns*. `count` should be
gone — it is not, because the arrows still reference it. That mechanism is
behind React state, effects and every "stale value" bug you will debug:

```ts
function snapshot(count: number) {
  return () => `count is ${count}`;   // captures THIS call's count
}
const first = snapshot(0);
const second = snapshot(1);
first();    // 'count is 0' — even though second exists
```

Every React render is a new call to your component; every handler it creates
closes over *that render's* values. React calls this "state as a snapshot";
JavaScript calls it a closure.

**Functions are values** — passed (`map(fn)`), returned (`by()` returns a
comparator), stored. **Calling vs referencing**: `onClick={handle()}` calls
now; `onClick={handle}` passes the function. **Purity**: same inputs, same
output, nothing else touched — React may call a render twice, so it must be.
**Referential identity**: `{} !== {}`. A new object literal in a component
body is a *different* value every render; that fact is why `memo`,
`useMemo`, `useCallback` and dependency arrays exist (Demo 18).

**And TypeScript says: a generic is a type parameter the caller fills in.**
`pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` reads: for *any*
`T`, and any `K` that is a key of `T`, return an array of that key's type.
`extends` is the **constraint**; without it `item[key]` is an error. You
almost never *write* the type arguments — `pluck(products, 'price')` infers
`T = Product`, `K = 'price'`, result `number[]`. Write `<T>` explicitly only
when inference has nothing to go on. If a generic has one use, it is a
concrete type wearing a costume.

### Steps

**A. `src/lib/fn.ts` — `TODO(lab-5.1)`**

Add `import type { SortOrder } from './catalog';` at the top, then:

```ts
/** A closure: `count` outlives the call that created it, private to the two functions that captured it. */
export function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    value: () => count,
  };
}

/**
 * The "stale value". Each call gets its OWN `count`; the function it returns
 * remembers that one forever. This is React's render model: every render is a
 * new call, every handler closes over that render's values.
 */
export function snapshot(count: number): () => string {
  return () => `count is ${count}`;
}

/**
 * Generic: `T` is whatever the array holds; `K` must be one of its keys; the
 * result is an array of that key's type. `pluck(products, 'price')` is `number[]`,
 * and `pluck(products, 'colour')` is a compile error.
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
```

`makeCounter` has no return type on purpose: hover it and read `{ increment:
() => number; value: () => number }`. Annotate the contract when it is the
*point*; `snapshot`'s `() => string` is.

**B. `src/lib/fn.ts` — `TODO(lab-5.2)`**

```ts
/**
 * A higher-order function: takes a selector, RETURNS a comparator.
 * `[...products].sort(by((p) => p.price, 'desc'))`.
 */
export function by<T>(select: (item: T) => string | number, order: SortOrder = 'asc'): (a: T, b: T) => number {
  const direction = order === 'asc' ? 1 : -1;
  return (a, b) => {
    const left = select(a);
    const right = select(b);
    if (left < right) return -direction;
    if (left > right) return direction;
    return 0;
  };
}

/**
 * Generic over the ARGUMENT LIST: the debounced function has exactly the
 * parameters of the original, so a typo in a call is still caught.
 * `ReturnType<typeof setTimeout>` is `number` in the browser and an object in Node — this works in both.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

`debounce` works *because* it is a closure over `timer`: each call to
`debounce` gets its own, and every call to the *returned* function shares it.

### Verify

```ts
const { makeCounter, snapshot, pluck, by, debounce } = await import('/src/lib/fn.ts');
const { sampleProducts } = await import('/src/data/sampleProducts.ts');

const c = makeCounter(); c.increment(); c.increment(); c.value();   // 2 — count survived
makeCounter().value();                                              // 0 — its own count
const first = snapshot(0), second = snapshot(1);
first(); second(); first();       // 'count is 0', 'count is 1', 'count is 0' — frozen per call
pluck(sampleProducts, 'price');   // [9.99, 14.99, 8.99]
[...sampleProducts].sort(by((p) => p.price, 'desc')).map((p) => p.title);
({}) === ({});                                          // false
sampleProducts.filter(() => true) === sampleProducts;   // false — a new array even when nothing was removed
const log = debounce((q) => console.log('search', q), 500);
log('a'); log('ab'); log('abc');  // one line, half a second later: 'search abc'
```

Then in `main.ts`, type `pluck(sampleProducts, 'colour')` (import both):
`error TS2345: Argument of type '"colour"' is not assignable to parameter of
type 'keyof Product'.` The constraint did that. Delete the line.

### Watch out

**`setTimeout(fn(), 500)`.** Calls `fn` now and schedules `undefined`. Pass
the reference. The React version is `onClick={save()}`.

**"My handler sees an old value."** React state variables are `const` per
render, so the closure sees the snapshot — the fix is the updater form
`setCount((c) => c + 1)`, Demo 2.

### In the real world

`debounce` is Demo 7's search box. `by()` is every "sort by column" table.
`pluck`'s signature is the most-copied generic in TypeScript; you will read
it in `react-hook-form`'s `Path<T>` and Demo 4's field library.

---

## Lab 6 — Modules & async (25 min)

### Problem

Lab 4's `main.ts` has a `fetch` that would crash the page on a 404 and a
type assertion that could be wrong. Nothing says what the promise resolves
to; nothing handles failure; nothing can be cancelled.

### Concept

**A module is a file that `export`s.** `import { x } from './file'` is a
live binding to one shared instance. Named exports are searchable and
refactor-safe; this track uses them everywhere a tool does not demand a
default. `import type { Product }` imports *only the type* — with
`verbatimModuleSyntax` on, TypeScript **requires** it, so the import can be
erased. `import()` with parentheses is a *function* returning a promise of
the module — the bundler splits it into its own file, downloaded only when
the line runs.

**A promise is a value that will be there later.** `await` pauses *this
function* until it settles. Two independent awaits in a row add their
latencies; `await Promise.all([a(), b()])` starts both and waits once.
**`fetch` only rejects on network failure** — a 404 is a *fulfilled* promise
with `response.ok === false`; you check it yourself. `AbortController`
cancels: pass `controller.signal`, call `controller.abort()`, the `fetch`
rejects. React effects do this on cleanup in Demo 5.

**The event loop, in one paragraph.** One thread. Synchronous code runs to
completion; timers, `fetch` resolutions and `await` continuations queue and
run *after* it finishes. That is why `await` never blocks the page, why a
`while (true)` does, and why React can batch several state updates from one
click into one render.

**And TypeScript says: `unknown` at every boundary, then narrow.** A caught
error is `unknown` — `throw 'oops'` is legal, so `e.message` cannot be
assumed. `response.json()` resolves to `any`; the honest move is to name what
you *expect* — `Promise<ProductListResponse>` — knowing it is a promise, not
a check (Demo 4 adds the check with zod). A **type guard** is a function
whose return type is `e is ApiError`: when it returns `true`, `e` is narrowed
for the rest of the branch. `Awaited<ReturnType<typeof fn>>` reads "what
`fn`'s promise resolves to" — derived from the function, so it cannot drift.

### Steps

**A. `src/api.ts` — `TODO(lab-6.1)`**

Add `import type { Product } from './types';` at the top, then under
`API_BASE`:

```ts
/** Exactly what GET /products returns — https://dummyjson.com/products?limit=2 */
export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** GET /products/categories returns these, not strings. */
export interface CategorySummary {
  slug: string;
  name: string;
  url: string;
}

/** An Error with the HTTP status attached. Demo 6 turns this into a class; the guard below keeps working. */
export interface ApiError extends Error {
  status: number;
}

export function apiError(status: number, message: string): ApiError {
  return Object.assign(new Error(message), { status });
}

/**
 * A TYPE GUARD. The return type `e is ApiError` tells TypeScript: when this
 * returns true, treat `e` as an ApiError from here on. `instanceof` and `in`
 * each narrow one step.
 */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && 'status' in e && typeof e.status === 'number';
}
```

Read `isApiError` as three narrowings: `instanceof Error` → an `Error`;
`'status' in e` → it has a `status` key of type `unknown`; `typeof e.status
=== 'number'` → it matches `ApiError`. Each is runtime JavaScript — the guard
really checks.

**B. `src/api.ts` — `TODO(lab-6.2)`**

```ts
interface ListOptions {
  /** 0 means "all of them" on DummyJSON. */
  limit?: number;
  skip?: number;
  signal?: AbortSignal;
}

export async function fetchProducts({ limit = 0, skip = 0, signal }: ListOptions = {}): Promise<ProductListResponse> {
  // URL + searchParams: no string concatenation, no forgotten encoding.
  const url = new URL('/products', API_BASE);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('skip', String(skip));

  const response = await fetch(url, { signal });
  // fetch only rejects on NETWORK failure. A 404 is a fulfilled promise — you check `ok` yourself.
  if (!response.ok) throw apiError(response.status, `GET ${url.pathname} failed`);

  // `json()` resolves to `any`. Naming the type here is a promise WE make about the
  // server, not a check. Demo 4's zod schemas turn the promise into a check.
  return (await response.json()) as ProductListResponse;
}

export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`, { signal });
  if (!response.ok) throw apiError(response.status, `Product ${id} not found`);
  return (await response.json()) as Product;
}
```

`{ limit = 0, skip = 0, signal }: ListOptions = {}` is Lab 3's destructuring
with defaults, plus a default for the *whole* parameter. An `async` function
*always* returns a promise; `Promise<ProductListResponse>` is the honest
return type, and TypeScript checks the `return` against the inner type.

**C. `src/api.ts` — `TODO(lab-6.3)`**

```ts
export async function fetchCategories(signal?: AbortSignal): Promise<CategorySummary[]> {
  const response = await fetch(`${API_BASE}/products/categories`, { signal });
  if (!response.ok) throw apiError(response.status, 'GET /products/categories failed');
  return (await response.json()) as CategorySummary[];
}

/** Two INDEPENDENT requests — start both, wait once. Sequential awaits would add the two latencies. */
export async function fetchCatalogue(signal?: AbortSignal) {
  const [list, categories] = await Promise.all([fetchProducts({ signal }), fetchCategories(signal)]);
  return { products: list.products, total: list.total, categories };
}

/** Derived from the function, so the type can never disagree with what the function returns. */
export type Catalogue = Awaited<ReturnType<typeof fetchCatalogue>>;
```

`Promise.all` takes a tuple and gives back a tuple, inferred positionally.
`fetchCatalogue` has no return type on purpose, so `Catalogue` can be
*derived*: hover it — `{ products: Product[]; total: number; categories:
CategorySummary[] }`.

**D. `src/main.ts` — `TODO(lab-6.4)`**

Delete the marker line and replace everything below the markers — imports
too:

```ts
import './style.css';
import { fetchCatalogue, isApiError } from './api';
import type { Product } from './types';

// ---- The state. Every pixel below is DERIVED from these values — by hand, in every handler.
let allProducts: Product[] = [];

// ---- DOM handles. `querySelector<T>` returns `T | null`; the `!` says "index.html has it".
const status = document.querySelector<HTMLElement>('#status')!;

async function load(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // give up after 8 s
  status.textContent = 'Loading 194 products…';

  try {
    const catalogue = await fetchCatalogue(controller.signal);
    allProducts = catalogue.products;
    status.textContent = `${catalogue.total} products · ${catalogue.categories.length} categories`;
  } catch (error: unknown) {
    // `unknown` is the honest type of a caught value. Narrow before you read anything off it.
    const reason = isApiError(error)
      ? `HTTP ${error.status}: ${error.message}`
      : error instanceof Error
        ? error.message
        : String(error);
    // Offline fallback via a DYNAMIC import: the bundled data is only downloaded if we get here.
    const { sampleProducts } = await import('./data/sampleProducts');
    allProducts = sampleProducts;
    status.textContent = `Could not reach DummyJSON (${reason}) — showing ${sampleProducts.length} bundled products`;
  } finally {
    clearTimeout(timeout);
  }

  console.log(allProducts.length, 'products in memory — Lab 7 renders them');
}

void load();
```

`error.status` is legal *only* inside the branch where `isApiError(error)`
was true — move it out and TypeScript says `'error' is of type 'unknown'`.
`finally` runs on every path, so the timer is always cleared. `void load()`
says "I know this returns a promise and I am not awaiting it".

### Verify

1. Reload: *194 products · 24 categories*. Network tab: `/products` and
   `/products/categories` start at the **same time** — `Promise.all`.
2. Make it fail. In `fetchProducts`, change `'/products'` to `'/productz'`.
   Reload: *Could not reach DummyJSON (HTTP 404: GET /productz failed) —
   showing 3 bundled products*. The guard narrowed; the fallback loaded;
   `sampleProducts.ts` appears in the Network tab **only now**. Revert.
3. Make it slow. Add `url.searchParams.set('delay', '9000');` in
   `fetchProducts`. After 8 s: *Could not reach DummyJSON (signal is aborted
   without reason)* — the controller fired. Remove the line.
4. Console: `const { fetchProduct, isApiError } = await import('/src/api.ts');
   try { await fetchProduct(9999); } catch (e) { console.log(isApiError(e), e.status); }`
   → `true 404`.
5. `npm run build`: `dist/assets/` has a second file, `sampleProducts-….js`.
   The dynamic import became its own chunk.

### Watch out

**`catch (e) { console.log(e.message) }`** → `error TS18046: 'e' is of type
'unknown'.` Narrow first.

**`import { Product } from './types'`** → `error TS1484: 'Product' is a type
and must be imported using a type-only import when 'verbatimModuleSyntax' is
enabled.` Write `import type`.

**Forgetting `await`.** `const list = fetchProducts();` is a
`Promise<ProductListResponse>` and `list.products` is an error — the message
tells you exactly what you forgot.

### Challenge (2 min)

`fetchProducts` and `fetchCategories` share four lines. Extract `async
function getJson<T>(url: string | URL, signal?: AbortSignal): Promise<T>`.
`T` cannot be inferred from the arguments — this is the case where you
*write* the type argument: `getJson<ProductListResponse>(url)`.

### In the real world

`api.ts` is the seed of Demo 6's service layer: the same functions, an axios
instance instead of `fetch`, interceptors instead of the `ok` check, the
`ApiError` as a class. `Awaited<ReturnType<typeof loader>>` is exactly how
React Router types loader data in Demo 10.

---

## Lab 7 — The DOM, imperatively (15 min)

### Problem

194 products are in memory and nothing is on screen. A category select, a
search box and a wishlist count all have to be wired to the DOM by hand.
This is the code React replaces — write it once so you know what you are
being spared.

### Concept

**The DOM is a tree of objects you mutate.** `createElement` makes a node;
properties and `setAttribute` set its state; `append`/`replaceChildren` put
it in the tree. `textContent` sets text safely; `innerHTML` parses markup —
never feed it text you did not write.

**Event delegation**: one listener on the grid, not one per heart. Cards are
rebuilt on every filter; a listener on the container survives that, and
`event.target.closest('button[data-action]')` finds which heart was clicked.
`dataset` reads `data-*` attributes — always *strings*.

**The state lives in variables; the DOM must be told.** Toggle a heart and
the `Set` changes — then *you* update the button. Filter and the cards are
rebuilt — then *you* re-apply the hearts from the `Set`. Two calls, in every
handler, that nothing forces you to keep together. Hold that thought; it is
the first five minutes of Session 2.

**And TypeScript says: the DOM cannot know your HTML, so it says so.**
`document.querySelector('#search')` is `Element | null`.
`querySelector<HTMLInputElement>('#search')` names the element type (so
`.value` exists); the `!` says "and it is not null" — a promise you can make
because you wrote `index.html`. Use `!` for elements *you* put in the page;
`if (!el) return` for anything that might not be there. `event.target` is
`EventTarget | null` — cast to `HTMLElement` before `closest`.

### Steps

**A. `src/render.ts` — `TODO(lab-7.1)`**

Read `createCard` first — it is written for you. Forty lines of
`createElement`, one property at a time: `dataset.id` (a string), `alt`,
`loading`, `textContent` for the title (never `innerHTML` for text you did
not write), `formatPrice(discountedPrice(…))` for the sale price, and a
`<button>` with `data-action="wish"`, `aria-pressed="false"` and an
`aria-label`. Every one of those lines is an attribute in Demo 1's JSX.

Now replace the three stubs below it:

```ts
/** Throw every old card away and build new ones. Simple — and the reason the hearts reset (see main.ts). */
export function renderGrid(root: HTMLElement, products: readonly Product[]): void {
  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No products match.';
    root.replaceChildren(empty);
    return;
  }
  root.replaceChildren(...products.map(createCard));
}

/** Walk every heart and make the DOM agree with the Set. Must run after EVERY renderGrid — by hand. */
export function syncHearts(root: HTMLElement, wishlist: ReadonlySet<number>): void {
  for (const heart of root.querySelectorAll<HTMLButtonElement>('button[data-action="wish"]')) {
    const saved = wishlist.has(Number(heart.dataset.id));
    heart.setAttribute('aria-pressed', String(saved));
    heart.textContent = saved ? '♥' : '♡';
  }
}

export function renderCategoryOptions(select: HTMLSelectElement, categories: readonly Category[]): void {
  const options = ['all', ...categories].map((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All categories' : category;
    return option;
  });
  select.replaceChildren(...options);
}
```

Forty lines to describe one card. In Demo 1 the same card is twelve lines of
JSX, and `products.map(createCard)` becomes `products.map((p) =>
<ProductCard product={p} />)` — the `map` is the part that stays.

**B. `src/main.ts` — `TODO(lab-7.2)`**

Delete the marker line — the last one. Four edits to the file you wrote in
Lab 6. Imports, after the `./api` line:

```ts
import { categoriesOf, filterByCategory, searchProducts } from './lib/catalog';
import { debounce } from './lib/fn';
import { renderCategoryOptions, renderGrid, syncHearts } from './render';
```

State and handles — three more state lines under `allProducts`, four more
handles under `status`:

```ts
let category = 'all';
let query = '';
const wishlist = new Set<number>();
// …
const grid = document.querySelector<HTMLElement>('#grid')!;
const categorySelect = document.querySelector<HTMLSelectElement>('#category')!;
const searchInput = document.querySelector<HTMLInputElement>('#search')!;
const wishlistCount = document.querySelector<HTMLElement>('#wishlist-count')!;
```

The handlers, between the handles and `async function load`:

```ts
function visibleProducts(): Product[] {
  return searchProducts(filterByCategory(allProducts, category), query);
}

categorySelect.addEventListener('change', () => {
  category = categorySelect.value;
  renderGrid(grid, visibleProducts());
  syncHearts(grid, wishlist); // forget this line and the hearts lie
});

searchInput.addEventListener(
  'input',
  debounce(() => {
    query = searchInput.value;
    renderGrid(grid, visibleProducts());
    syncHearts(grid, wishlist); // …and again here
  }, 200),
);

// Event DELEGATION: one listener on the grid, not one per heart. Cards come and go; the listener stays.
grid.addEventListener('click', (event) => {
  const heart = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action="wish"]');
  if (!heart) return;
  const id = Number(heart.dataset.id);
  if (wishlist.has(id)) wishlist.delete(id);
  else wishlist.add(id);
  syncHearts(grid, wishlist);
  wishlistCount.textContent = String(wishlist.size);
});
```

And at the end of `load`, replace the `console.log` line with the render:

```ts
  renderCategoryOptions(categorySelect, categoriesOf(allProducts));
  renderGrid(grid, visibleProducts());
  syncHearts(grid, wishlist);
```

Count the places the wishlist reaches the screen: click, category, search,
initial load. Four. Add a sort select and it is five. Each is a place to forget.

### Verify

1. 194 cards. Pick *beauty* — five. Type `mascara` — one. Clear it.
2. Click three hearts: the badge says **3**, the hearts are filled. Change
   category and back: **still filled** — `syncHearts` ran.
3. Comment out the `syncHearts` line in the category handler. Save a heart,
   change category and back: **empty heart, badge still says 3.** The data
   is right; the DOM is wrong. Un-comment it. You have just met the only bug
   Session 2 is about.
4. Inspect a heart → Event Listeners: nothing on the button. The one click
   listener is on `#grid`.
5. `npm run typecheck && npm run build`: clean. `grep -r "TODO(lab-" src`
   prints nothing.

### Watch out

**`'el' is possibly 'null'`.** Add `!` because you own the HTML, or guard
with `if (!el) return` because you don't. Do not sprinkle `!` to make errors
go away.

**A listener per card.** Works until the cards are rebuilt — then the
listeners are gone with the nodes. Delegation is the cure here; in React,
`onClick` on the card is, and React does the delegation for you.

### In the real world

You will not write this file again. But every React bug report that says
"the badge shows 3 but the list is empty" is *this* file — DOM-derived state
that fell out of step with the data. Knowing what React does for you is what
lets you reason about it when it is slow (Demo 18) or when you step outside
it with a ref (Demo 15).

---

## Wrap-up — what you can now do

- [x] Tell an expression from a statement, and know why JSX cares
- [x] Name the eight falsy values and explain the `0 &&` bug before it happens
- [x] Write a literal union, derive it from an `as const` array, and narrow a `string` into it
- [x] Copy, update and toggle with spread/filter/map — never mutate — and explain why React needs that
- [x] Derive `Pick`/`Partial`/`Omit`/`Record` shapes from one source type
- [x] Sort without mutating, group with `reduce`, dedupe with `Set`, index with `Map`
- [x] Explain a closure, a stale snapshot and `{} !== {}` in one breath; write a constrained generic
- [x] `fetch` with `ok` checks, `unknown` in `catch`, a type guard, `Promise.all` and an `AbortController`
- [x] Render a grid imperatively — and point at the exact line React makes unnecessary

## Next session

**Session 2 — React Introduction, Rendering Architectures & the Toolchain.**
It opens by adding a sort select to *this* grid and watching the hearts
desync; then why React, how it updates the screen, where components become
HTML (CSR vs SSR vs SSG — and why ShopScope is a Vite SPA), and a lab that
scaffolds Demo 1's starter from `npm create vite` — with your `types.ts`,
`format.ts` and `sampleProducts.ts` ported in unchanged.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Page works in `npm run dev` but `npm run build` fails with TS errors | Vite does not typecheck. Run `npm run typecheck` and fix what it lists. |
| `Argument of type 'string' is not assignable to parameter of type 'number'` | You passed a string to `formatPrice`. Fix the caller — the type caught a real bug. |
| `Type '"up"' is not assignable to type '"asc" \| "desc"'` | A literal union rejected a value outside the set. Go through `parseSortOrder`. |
| `'first' is possibly 'undefined'` on `products[0].title` | `noUncheckedIndexedAccess`. `products[0]?.title`, or `const first = products[0]; if (!first) return;`. |
| `Property 'sort' does not exist on type 'readonly Product[]'` | Working as intended — copy first: `[...products].sort(…)`. |
| `Property 'beauty' does not exist on type '{}'` inside `reduce` | The accumulator was inferred from `{}`. `reduce<Record<Category, Product[]>>(…, {})`. |
| `Object is possibly 'undefined'` on `groups[product.category].push` | Same flag. `(groups[key] ??= []).push(…)`. |
| `'e' is of type 'unknown'` in a `catch` | Narrow: `e instanceof Error ? e.message : String(e)`, or `isApiError(e)`. |
| `'Product' is a type and must be imported using a type-only import` | `verbatimModuleSyntax`. `import type { Product } from './types'`. |
| `'el' is possibly 'null'` / `Property 'value' does not exist on type 'Element'` | `querySelector<HTMLInputElement>(…)!` — name the element type; assert non-null only for elements you put in `index.html`. |
| `Argument of type '"colour"' is not assignable to parameter of type 'keyof Product'` | `pluck`'s `K extends keyof T` constraint: the key does not exist on `Product`. |
| Hearts empty after filtering, badge still counts them | A `renderGrid` without its `syncHearts`. Add the call — and remember this for Session 2. |
| Two `sampleProducts` requests in the Network tab | You kept the static `import { sampleProducts }` in `main.ts` *and* the dynamic one. Remove the static import. |
