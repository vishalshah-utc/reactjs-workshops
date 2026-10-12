# Module 17 — TypeScript with React

**Study notes** · ~2.5 hours

> **Goal.** You have been writing TypeScript since the first line of Session 1,
> one idea at a time, where the app needed it. This module names those ideas,
> fills the gaps between them, and draws the line between a type that is
> earning its keep and one that is ceremony. By the end you should be able to
> type props, state, events, refs, context, reducers and hooks without
> fighting the compiler — and to use unions so that invalid UI states cannot
> be written at all.

**Prerequisites:** [Module 1 §24](../01-javascript-foundations/#24-a-glance-at-typescript)
(the shape of TypeScript). [Module 5](../05-props-and-composition/) (props,
`children`, spreading). [Module 8 §7](../08-state-structure/#7-choosing-the-state-structure-five-principles)
(the `status` union). [Module 9](../09-reducers-and-context/) (reducers,
context, the custom-hook API). [Module 13 §5](../13-data-fetching-and-custom-hooks/#5-building-usefetch-properly)
(`useFetch`).

---

## Contents

1. [Why TypeScript in React — and what it costs](#1-why-typescript-in-react--and-what-it-costs)
2. [The `tsconfig` that matters](#2-the-tsconfig-that-matters)
3. [The 20% of TypeScript that covers 95% of React](#3-the-20-of-typescript-that-covers-95-of-react)
4. [Typing props](#4-typing-props)
5. [`ReactNode` vs `ReactElement` vs `JSX.Element`](#5-reactnode-vs-reactelement-vs-jsxelement)
6. [Props from the DOM: `ComponentProps`](#6-props-from-the-dom-componentprops)
7. [Typing state](#7-typing-state)
8. [Making bad states impossible](#8-making-bad-states-impossible)
9. [Typing events](#9-typing-events)
10. [Typing refs](#10-typing-refs)
11. [Typing context and reducers](#11-typing-context-and-reducers)
12. [Generic components](#12-generic-components)
13. [Typing custom hooks](#13-typing-custom-hooks)
14. [`satisfies`, `Record`, `Pick`/`Omit`/`Partial` and template literals](#14-satisfies-record-pickomitpartial-and-template-literals)
15. [`import type`](#15-import-type)
16. [Types at the boundary: zod, parsing vs casting](#16-types-at-the-boundary-zod-parsing-vs-casting)
17. [Escape hatches and their cost](#17-escape-hatches-and-their-cost)
18. [The ESLint rules the track uses](#18-the-eslint-rules-the-track-uses)
19. [Common error messages and what they mean](#19-common-error-messages-and-what-they-mean)
20. [What not to type](#20-what-not-to-type)
21. [Self-check](#21-self-check)
22. [References](#22-references)

---

**Hands-on.** The TypeScript in this module is spread across the track rather
than taught in one sitting. [Session 1 — JavaScript & TypeScript for React](../../demos/00a-javascript-and-typescript-for-react/)
introduces literal unions, `as const`, narrowing, generics, type guards and
`unknown` with no React in sight. [Demo 1 — Components, JSX & Props](../../demos/01-components-jsx-props/)
types props from the very first component — `interface`, `?`, defaults,
`ReactNode` and `Record`. [Demo 17 — Component Patterns, Portals & TypeScript Consolidation](../../demos/17-component-patterns-and-portals/)
is where the ideas meet: generic components, discriminated unions for props,
`satisfies`, `NoInfer` and the utility types, named and used together. Each
section below that a lab implements ends with a **→ In the demos** line.

---

## 1. Why TypeScript in React — and what it costs

React is a library for building trees of functions that pass objects to each
other. Almost every runtime error in a React app is one of those objects not
having the shape the receiver assumed: a prop that was never passed, a
`product.brand` that is `undefined` for nine of 194 products, a `status`
spelt `'sucess'` in one branch. TypeScript turns that class of bug into a red
squiggle at the moment you write it.

| Benefit | Where you feel it |
|---|---|
| Props are documented and checked | `<PriceTag>` cannot be rendered without `price`, or with `price="9.99"` |
| Refactors are safe | Rename `discountPercentage` on `Product` and the compiler lists every component to fix |
| Editor autocomplete | `product.` shows the fields; `variant=` shows the allowed literals |
| Impossible states are unrepresentable | A request cannot be `loading` *and* have `error` set ([§8](#8-making-bad-states-impossible)) |
| Library APIs are discoverable | `useForm<SignupValues>` knows the field names; `<Link to>` knows it wants a string |

What it costs, honestly:

- **A build step that can fail.** Vite strips types without checking them; it
  is `tsc` (`npm run typecheck`) and your editor that complain. A green dev
  server is not a green build.
- **Time at the boundaries.** Data from a network, a `<select>`, `localStorage`
  or a URL arrives untyped. Somebody has to say what it is
  ([§16](#16-types-at-the-boundary-zod-parsing-vs-casting)).
- **The temptation to over-type.** Annotating what the compiler already knows
  adds noise and no safety ([§20](#20-what-not-to-type)).

TypeScript is erased at build time: no runtime code, no runtime checks, no
runtime cost. Its whole value is what it catches before the browser runs.

📖 [react.dev — Using TypeScript](https://react.dev/learn/typescript)

---

## 2. The `tsconfig` that matters

Vite's `react-ts` template generates three files. `tsconfig.json` holds no
options at all — it just references the other two:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json` types `src/` with the browser's `DOM` lib;
`tsconfig.node.json` types `vite.config.ts` with Node's. Two environments, two
configs; `tsc -b` builds both. The options that matter in the app config:

| Option | What it does | Why the track sets it |
|---|---|---|
| `"strict": true` | A family of flags: no implicit `any`, `null`/`undefined` are real types, `catch (e)` is `unknown` | Turning it on later means fixing hundreds of errors at once |
| `"jsx": "react-jsx"` | JSX compiles to `_jsx()` calls from `react/jsx-runtime`; no `import React` needed | Without it: *Cannot use JSX unless the '--jsx' flag is provided* |
| `"moduleResolution": "bundler"` | Resolve imports the way Vite does: `package.json` `exports`, no extensions required | `"node"` (node10) is deprecated and misreads modern packages |
| `"verbatimModuleSyntax": true` | A type must be imported with `import type`; imports are emitted exactly as written | A per-file transpiler cannot know whether `import { Product }` is a type — so you tell it ([§15](#15-import-type)) |
| `"erasableSyntaxOnly": true` | Forbids `enum`, `namespace`, parameter properties — syntax that *generates* JavaScript | Everything left can be stripped, which is exactly what Vite does. Use `as const` unions instead of `enum` |
| `"types": ["vite/client"]` | Declares `import.meta.env` and `import './x.css'` | Without it the CSS import in `main.tsx` is an error |

**What the track leaves off.** `noUncheckedIndexedAccess` makes `products[0]`
a `Product | undefined` and `errors[field]` a `string | undefined`. Session 1
turns it on so you feel it once; the demos leave it off so the React code reads
quieter. A fine team decision either way — just a deliberate one.

**Path aliases** (`@/components/PriceTag`) need two halves: `"paths"` in
`tsconfig.app.json` so TypeScript resolves the *types*, and `resolve.alias` in
`vite.config.ts` so Vite resolves the *module*.

### TypeScript 6.0 — what changed

The track pins **TypeScript 5.9**. TypeScript 6.0 is current, and a fresh
`npm create vite` installs it — which is why Session 2 replaces the template's
`package.json` *before* `npm install`. 6.0 is the bridge to 7.0 (the compiler
rewritten in Go); anything it deprecates is removed in 7.0. The defaults that
moved:

| Option | 5.9 default | 6.0 default | Effect on the track's config |
|---|---|---|---|
| `strict` | `false` | `true` | None — already on |
| `module` | `commonjs` | `esnext` | None — already `ESNext` |
| `target` | `es5` | `es2025` | None — set explicitly |
| `types` | every `@types/*` package | `[]` | None — `["vite/client"]` is explicit; a project *relying* on auto-inclusion breaks |
| `baseUrl` | — | **deprecated** | Write `paths` relative to the tsconfig and drop `baseUrl` |

Every explicit setting in the track's tsconfig survives 6.0 unchanged; the
pin is about reproducibility, not compatibility.

📖 [TSConfig reference — `strict`](https://www.typescriptlang.org/tsconfig/#strict) ·
[`jsx`](https://www.typescriptlang.org/tsconfig/#jsx) ·
[`moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution) ·
[`verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax) ·
[`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly) ·
[`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess)

**→ In the demos:** Session 2 — React Introduction & Toolchain, Lab step D
builds all three tsconfig files from Vite's template and explains every line.

---

## 3. The 20% of TypeScript that covers 95% of React

[Module 1 §24](../01-javascript-foundations/#24-a-glance-at-typescript) and
Session 1 introduced the basics. This is the reference card for the subset a
React codebase actually uses.

### `type` vs `interface`

For an object shape they are interchangeable. `interface` can be `extends`-ed
and is what the demos use for props and API responses; `type` is the only one
that can name a union, a tuple or a template literal. The rule the track
follows: **`interface` for object shapes, `type` for everything else.** Do not
spend a code review on it.

### Literal unions and `as const`

```ts
type SortOrder = 'asc' | 'desc';                      // exactly two strings

export const SORT_ORDERS = ['asc', 'desc'] as const;   // readonly ['asc', 'desc']
export type SortOrder = (typeof SORT_ORDERS)[number];  // 'asc' | 'desc', derived
```

A literal union is the most-used TypeScript feature in React — every
`variant`, `size` and `status` prop is one. When you need the values at
runtime too (to render a `<select>`), write the array once with `as const` and
derive the type, so the two cannot drift. This is what `enum` was for;
`erasableSyntaxOnly` forbids `enum`.

### Narrowing

TypeScript follows your `if`:

```ts
function label(product: Product) {
  if (product.brand === undefined) return product.category;   // brand: undefined here
  return product.brand.toUpperCase();                          // brand: string here
}
```

`typeof`, `instanceof`, `in`, `===` against a literal, and early `return` all
narrow. A function that narrows for its caller is a **type guard**
(`e is ApiError`). Narrowing does not survive an ordinary function call.

### Generics

A generic is a type parameter the caller fills in, almost always by inference:
`pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` makes
`pluck(products, 'price')` a `number[]` with nothing written at the call.
`extends` is the constraint. If a generic has one call site, it is a concrete
type wearing a costume. Generic *components* are [§12](#12-generic-components).

### The utility types

| Type | Reads as | A ShopScope use |
|---|---|---|
| `Partial<T>` | every field optional | a patch to send to `PATCH /products/:id` |
| `Pick<T, K>` | only these fields | `Pick<Product, 'id' \| 'title' \| 'price'>` for a cart line |
| `Omit<T, K>` | all but these fields | `Omit<Product, 'id'>` for a draft not yet saved |
| `Record<K, V>` | an object with exactly these keys | `Record<PriceSize, string>` for class names |
| `ReturnType<F>` | what a function returns | `ReturnType<typeof setTimeout>` |
| `Awaited<P>` | what a promise resolves to | `Awaited<ReturnType<typeof fetchProducts>>` |
| `Extract<T, U>` / `Exclude<T, U>` | keep / drop union members | `Extract<keyof T, string>` |

📖 [Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) ·
[Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) ·
[Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) ·
[Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

**→ In the demos:** Session 1 Labs 2, 5 and 6 — literal unions and `as const`
in `catalog.ts`, `pluck` and `debounce` in `fn.ts`, the `isApiError` guard in
`api.ts`.

---

## 4. Typing props

Props arrive as one object, so the type is the type of that object, written
on the destructured parameter. Inline — `function Greeting({ name }: { name: string })`
— is fine for one prop. For anything more, name it:

```tsx
interface PriceTagProps {
  price: number;
  discountPercentage?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceTag({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  /* … */
}
```

Two mechanisms doing two jobs: `?` is **TypeScript's** — "the caller may omit
this"; `= 0` is **JavaScript's** — "and when they do, use this". Inside the
function `discountPercentage` is a plain `number`, because the default
removed the `undefined`. You almost always use them together.

### `children`

`children` is a prop like any other and must be declared:

```tsx
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;          // required: a card with no body is a mistake
  footer?: ReactNode;           // optional slot
}
```

`ReactNode` is "anything React can render" — see [§5](#5-reactnode-vs-reactelement-vs-jsxelement).
Write `children` explicitly rather than via `PropsWithChildren<P>`, so you
choose whether it is required. Type a callback prop by what it *receives*
(`onAddToCart: (product: Product) => void`), not by the DOM event it happened
to come from ([§9](#9-typing-events)).

### Mutually exclusive props

When the props depend on a *kind*, a discriminated union says so, and an
interface with everything optional does not:

```tsx
type LinkOrButtonProps = { children: ReactNode } & (
  | { variant: 'link'; to: string; onClick?: never }
  | { variant: 'button'; to?: never; onClick: () => void }
);

function LinkOrButton(props: LinkOrButtonProps) {
  if (props.variant === 'link') return <Link to={props.to}>{props.children}</Link>;   // to: string here
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

`to?: never` means "optional, and the only value it accepts is nothing". Narrow
on `props.variant` and read `props.to`; destructuring `{ variant, to }` first
loses the link between them and `to` stays `string | undefined`.

📖 [react.dev — TypeScript with React Components](https://react.dev/learn/typescript#typescript-with-react-components)

**→ In the demos:** Demo 1 Labs 1–3 — `SiteHeader`, `PageHeader`, `PriceTag`,
`StockBadge`, `ProductCard`; Demo 17 Lab 3 B — `LinkOrButton`.

---

## 5. `ReactNode` vs `ReactElement` vs `JSX.Element`

Three types for "something renderable", and only one you usually want:

| Type | Means | Use for |
|---|---|---|
| `ReactNode` | anything React can render: element, string, number, array, `null`, `undefined`, boolean, fragment, portal | **content props** — `children`, `label`, `footer`, `actions` |
| `ReactElement` | the object `<Foo />` evaluates to; nothing else | a render prop that must return an element; a prop you will `cloneElement` |
| `JSX.Element` | `ReactElement<any, any>` — the old global alias | nothing new; `@types/react` 19 removed the global `JSX` namespace (it is `React.JSX` now) |

`PageHeader`'s `actions?: ReactNode` takes a `<Button>`, two of them, or text;
`Field`'s render prop `children: (field) => ReactElement` must give back an
element. A component's **return type** needs no annotation. Annotating it as
`JSX.Element` makes `return null` an error; leave it inferred.

📖 [react.dev — Useful types](https://react.dev/learn/typescript#useful-types)

---

## 6. Props from the DOM: `ComponentProps`

A wrapper around a native element should accept what that element accepts,
without retyping the DOM:

```tsx
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<'button'> & {
  tone?: 'primary' | 'ghost';
};

function Button({ tone = 'primary', className, ...rest }: ButtonProps) {
  return <button className={`btn btn--${tone} ${className ?? ''}`} {...rest} />;
}

<Button type="submit" disabled aria-label="Save">Save</Button>   // every button attribute checks
```

| Type | Includes `ref`? | Use |
|---|---|---|
| `ComponentProps<'button'>` | yes | the default in React 19, where `ref` is a prop |
| `ComponentPropsWithoutRef<'button'>` | no | when you will not forward one, or you spread onto a polymorphic element |
| `ComponentProps<typeof Link>` | — | the props of *another component*, for a wrapper around a library |

### Extending intrinsic props when yours collide

If your prop shares a name with a DOM attribute but means something else,
`Omit` the DOM one first — an interface may only `extends` a type with no
conflicting members:

```tsx
interface TextFieldProps extends Omit<ComponentProps<'input'>, 'onChange' | 'size'> {
  size?: 'sm' | 'lg';                      // ours, not the input's numeric size
  onChange?: (value: string) => void;      // ours reports a value
}
```

Prefer a **whitelist** when the component owns most of the control. Demo 4's
`TextField` passes through exactly five input attributes —
`Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue' | 'autoFocus' | 'required' | 'readOnly'>`
— so a typo in a passed-through prop is a compile error, and nobody can
smuggle a DOM `onChange` past the field's `onChange(value)` contract.

**→ In the demos:** Demo 4 Lab 1 step 3 — `ControlRest`; Demo 17 Lab 3 A —
`ComponentPropsWithoutRef<T>` behind the polymorphic `<Text as>`.

---

## 7. Typing state

`useState` infers from the initial value. Most of the time that is enough:

```tsx
const [query, setQuery] = useState('');          // string
const [page, setPage] = useState(1);             // number
const [open, setOpen] = useState(false);         // boolean
```

Write the type argument in exactly three situations.

**The initial value is `null` but the real value is not:**

```tsx
const [selected, setSelected] = useState<Product | null>(null);
```

Without the argument TypeScript infers `null`, and `setSelected(product)` is
an error. The `| null` is honest: there is a moment before anything is
selected, and every read must deal with it.

**The initial value is an empty array:**

```tsx
const [cart, setCart] = useState<CartLine[]>([]);
```

`useState([])` infers `never[]` — an array nothing can be pushed into.

**The initial value is a literal but the state is a union:**

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');
```

Without the argument the state is `string`, and `setStatus('sucess')`
compiles.

The setter is `Dispatch<SetStateAction<CartLine[]>>` (both from `react`) — a
value or an updater. That is its type if you pass it as a prop, but usually
you pass a narrower callback (`onRemove: (id: number) => void`) and keep the
state's shape private ([Module 5 §12](../05-props-and-composition/#12-designing-a-component-api)).

📖 [react.dev — Typing `useState`](https://react.dev/learn/typescript#typing-usestate)

---

## 8. Making bad states impossible

Three booleans for a request — `loading`, `error`, `data` — produce eight
combinations, of which four (`loading && error`, `data && error`, …) are
nonsense that the code must nonetheless handle. A **discriminated union** — one field (`status`) whose literal value decides
which other fields exist — has exactly the states you meant:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

const [state, setState] = useState<RequestState<Product[]>>({ status: 'idle' });
```

Now `data` is only reachable after a check:

```tsx
if (state.status === 'success') {
  return <ProductGrid products={state.data} />;     // data: Product[] here
}
state.data;   // ✗ Property 'data' does not exist on type 'RequestState<Product[]>'
```

The same narrowing works inside JSX — `{state.status === 'error' && <Alert>{state.error.message}</Alert>}`
— and in a `switch`.

### Exhaustive `switch` with `never`

```tsx
function View({ state }: { state: RequestState<Product[]> }) {
  switch (state.status) {
    case 'idle':    return null;
    case 'loading': return <Skeleton />;
    case 'success': return <ProductGrid products={state.data} />;
    case 'error':   return <ErrorBanner error={state.error} />;
    default: {
      const unhandled: never = state;          // compiles only while every case is handled
      throw new Error(`Unhandled state: ${JSON.stringify(unhandled)}`);
    }
  }
}
```

After every case is handled, `state` in `default` has type `never`, and
assigning it to a `never` variable is legal. Add a fifth member to the union
without a case, and that assignment is the compile error — pointing at the
`switch` that needs updating, not at a user who found the blank screen.
[Module 9 §8](../09-reducers-and-context/#8-reducers-as-state-machines) is the
reducer that makes bad *transitions* impossible as well.

📖 [Handbook — Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) ·
[Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)

**→ In the demos:** Demo 12 Lab 1 — `RequestStatus<T>` and the exhaustive
`requestStatusReducer`.

---

## 9. Typing events

Inline handlers need no annotation. The JSX attribute's type flows into the
arrow function — **contextual typing**:

```tsx
<input onChange={(e) => setQuery(e.target.value)} />        // e: ChangeEvent<HTMLInputElement>
<form onSubmit={(e) => { e.preventDefault(); save(); }} />  // e: FormEvent<HTMLFormElement>
<button onClick={(e) => e.stopPropagation()} />              // e: MouseEvent<HTMLButtonElement>
```

A handler declared as a separate function has no context, so you annotate it.
The event types live in `react`, each generic over the element:

```tsx
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from 'react';

function handleChange(e: ChangeEvent<HTMLInputElement>) {
  setQuery(e.target.value);
}
function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
}
function handleKey(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Escape') setQuery('');
}
```

Note the import: React's `MouseEvent` shadows the DOM's global `MouseEvent`.
Forget the import and you get the DOM one, and `e.currentTarget` loses its
element type. `ChangeEvent` takes `HTMLInputElement`, `HTMLSelectElement` or
`HTMLTextAreaElement`; `MouseEvent` and `KeyboardEvent` take whichever element
the handler sits on.

**`target` vs `currentTarget`.** `e.currentTarget` is always the element the
handler is attached to and is typed as `T`. `e.target` is whatever was clicked
— for a `MouseEvent` on a `<div>` it could be a child, so it is `EventTarget`
and must be narrowed. `ChangeEvent` is the exception: its `target` is
`EventTarget & T`, which is why `e.target.value` works without a cast.

**Handler props** are typed by the *value* they report unless the caller
genuinely needs the event; then `MouseEventHandler<HTMLButtonElement>` and the
other `…Handler` aliases spell `(e: MouseEvent<HTMLButtonElement>) => void`.

📖 [react.dev — Typing DOM events](https://react.dev/learn/typescript#typing-dom-events)

**→ In the demos:** Demo 4 Lab 1 — `TextField.onChange(value)`; Lab 2 —
`handleSubmit(event: React.FormEvent<HTMLFormElement>)` in `ProductForm`.

---

## 10. Typing refs

A DOM ref is created with the element type and `null`, because the node does
not exist until after the first commit:

```tsx
const inputRef = useRef<HTMLInputElement>(null);     // RefObject<HTMLInputElement | null>

useEffect(() => {
  inputRef.current?.focus();                          // current may be null — say so
}, []);

<input ref={inputRef} />
```

`inputRef.current` is `HTMLInputElement | null`; the `?.` is the honest spelling
of "if it is mounted". A `!` here is a bug waiting for a conditional render.

A ref holding a mutable value is typed by its initial value:
`useRef<ReturnType<typeof setTimeout> | null>(null)`, `useRef(0)`. Two
`@types/react` 19 facts: `useRef` **requires an argument** —
`useRef<HTMLInputElement>()` is *Expected 1 arguments, but got 0* — and
`MutableRefObject` is deprecated; everything is `RefObject<T>` now.

### `ref` as a prop

In React 19 a function component receives `ref` as an ordinary prop, typed
with `Ref<T>`:

```tsx
import type { ComponentProps, Ref } from 'react';

interface TextInputProps extends ComponentProps<'input'> {
  label: string;
  ref?: Ref<HTMLInputElement>;      // ComponentProps<'input'> already includes this; shown for clarity
}

function TextInput({ label, ref, ...rest }: TextInputProps) {
  return <label>{label}<input ref={ref} {...rest} /></label>;
}

<TextInput label="Search" ref={inputRef} />
```

`Ref<T>` accepts a `RefObject`, a ref callback, or `null`. The legacy
`forwardRef<HTMLInputElement, TextInputProps>(…)` still type-checks and is
what you will read in library source ([Module 11 §9](../11-refs-and-the-dom/#9-ref-as-a-prop--and-legacy-forwardref)).

📖 [react.dev — `useRef`](https://react.dev/reference/react/useRef)

---

## 11. Typing context and reducers

### Context

Give `createContext` the value type, and make "no provider" a real,
distinguishable state rather than a plausible default:

```tsx
import { createContext, useContext, type ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  /* …state… */
  return <ThemeContext value={value}>{children}</ThemeContext>;     // React 19: the context is its own provider
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme() must be used inside <ThemeProvider>');
  return context;
}
```

The custom hook does the narrowing **once**, so every consumer gets a
non-optional `ThemeContextValue` and a useful error at the point of the
mistake ([Module 9 §15](../09-reducers-and-context/#15-a-custom-hook-as-the-public-api)).
Do not export the context object.

### Reducers

Type the **state** and the **action union**; `useReducer` infers the rest:

```ts
type CartAction =
  | { type: 'added'; product: Product; qty: number }
  | { type: 'removed'; id: Product['id'] }
  | { type: 'cleared' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'added':   /* action.product and action.qty exist here */ return …;
    case 'removed': return …;
    case 'cleared': return { items: [] };
    default: {
      const unhandled: never = action;
      throw new Error(`Unhandled action: ${JSON.stringify(unhandled)}`);
    }
  }
}

const [cart, dispatch] = useReducer(cartReducer, { items: [] });
// dispatch: Dispatch<CartAction> — dispatch({ type: 'addd' }) is a compile error
```

Each `case` narrows `action` to one member, so `action.qty` exists only where
the union says it does. The `never` in `default` is the same exhaustiveness
trick as [§8](#8-making-bad-states-impossible), applied to actions: add
`{ type: 'undone' }` to the union and the reducer stops compiling until it is
handled.

When the reducer is generic, pin its type argument with an **instantiation
expression** — a generic function with `<T>` filled in, used as a value:

```tsx
const [check, dispatch] = useReducer(requestStatusReducer<string>, { status: 'idle' });
```

To pass `dispatch` through context, its type is `Dispatch<CartAction>`.

📖 [react.dev — Typing `useReducer`](https://react.dev/learn/typescript#typing-usereducer) ·
[Typing `useContext`](https://react.dev/learn/typescript#typing-usecontext)

**→ In the demos:** Demo 12 Lab 1 — `RequestAction<T>` and
`requestStatusReducer<string>`; Lab 2 — `ThemeContext` and `useTheme()`.

---

## 12. Generic components

When the *type comes from the data*, the component is generic over it:

```tsx
interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  getRowKey: (row: T) => string | number;
}

export function DataTable<T>({ rows, columns, getRowKey }: DataTableProps<T>) {
  /* a <tr key={getRowKey(row)}> per row, a <td> per column calling column.render?.(row) */
}

<DataTable rows={products} columns={columns} getRowKey={(p) => p.id} />   // T = Product, inferred
```

Nobody writes `<DataTable<Product>>`; `T` is inferred from `rows`, and then
every `render: (row) => …` in `columns` and the `getRowKey` callback know
`row` is a `Product`. You *can* pin it — `<DataTable<Product> rows={…}>` —
when inference has nothing to go on, or to check the data against a type you
chose.

### A generic `Select`

```tsx
interface Option<T extends string> { value: T; label: string }

interface SelectProps<T extends string> {
  options: readonly Option<T>[];
  value: NoInfer<T>;
  onChange: (value: NoInfer<T>) => void;
}

export function Select<T extends string>({ options, value, onChange }: SelectProps<T>) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
```

Two things to see. **Inference has a direction.** Without `NoInfer`, `T`
would be inferred from `options` *and* `value`; given `Option<SortKey>[]` and
a `string`, TypeScript widens `T` to `string` so both fit and reports nothing.
`NoInfer<T>` (TypeScript 5.4) says "check against `T`, do not contribute to
it", so `onChange={(sort: SortKey) => …}` against string options is the error
it should be. **The one cast lives inside.** `e.target.value` is a `string`;
the `<option>`s were rendered *from* `options`, so it really is a `T`. The
cast is justified once, where the knowledge is, not at every caller.

In a `.tsx` file `const Select = <T>(props) => …` is parsed as a JSX tag; write
a function declaration (the track's choice) or `<T,>(props) => …`.

📖 [Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) ·
[`NoInfer`](https://www.typescriptlang.org/docs/handbook/utility-types.html#noinfertype)

**→ In the demos:** Demo 17 Lab 3 C and D — `DataTable<T>` with
`satisfies Column<DirectoryUser>[]`, and `SelectField<T>` with `NoInfer`;
Demo 4 Lab 3 — `Field<TValues, TName>` over react-hook-form.

---

## 13. Typing custom hooks

A hook is a function; type its parameters, and let its return be inferred
unless the inference is wrong.

### Tuple returns need `as const`

```ts
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;              // readonly [boolean, () => void]
}

const [open, toggleOpen] = useToggle();      // open: boolean, toggleOpen: () => void
```

Without `as const` the return type is `(boolean | (() => void))[]` — an array
where every position might be either — and `toggleOpen()` is an error
(*not all constituents are callable*). `as const` turns the literal into a
readonly tuple with a type per position, which is what `useState` returns too.

### Object returns are inferred

`return { count, isEmpty: items.length === 0 }` needs no annotation — the
type is read off the literal. Annotate the return when it is the *contract*:
a hook other teams consume, or a type you want to export:

```ts
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  { skip = false, initialData = null }: UseApiOptions<T> = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  /* …the one fetch effect the whole app shares… */
  return { data, loading, error, reload, setData };
}

const { data } = useApi((signal) => listProducts(filters, signal), [filters]);
// data: ProductListResponse | null — T inferred from what the fetcher resolves to
```

`useApi` is generic over `T` and never names a domain type; the fetcher's
return type supplies it. `deps: unknown[]` is honest — the hook does not read
them, it only re-runs on them.

📖 [react.dev — Example hooks](https://react.dev/learn/typescript#example-hooks)

**→ In the demos:** Demo 8 Lab 4 — `useApi<T>`; Demo 17 Lab 2 —
`useControllableState<T>` returning `[T, (next: T) => void]`.

---

## 14. `satisfies`, `Record`, `Pick`/`Omit`/`Partial` and template literals

### `Record<K, V>` — exactly these keys

```tsx
type PriceSize = 'sm' | 'md' | 'lg';
const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };
```

Add `'xl'` to the union and the compiler asks for its class. A lookup object
keyed by a literal union is the typed replacement for a chain of ternaries
([Module 6 §3](../06-conditional-rendering-and-lists/#3-the-ternary)).

### `satisfies` — check the shape, keep the literals

An annotation **widens**: with `: Record<PriceSize, string>` above, `SIZES.sm`
is a `string`, not `'fs-6'`. `satisfies` checks the value against the type and
leaves its own type as what you wrote:

```ts
const ROLE_VARIANT = { admin: 'danger', moderator: 'warning', user: 'secondary' } satisfies Record<Role, string>;
// ROLE_VARIANT.admin: 'danger' — not string. A missing role is still an error.

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
  { key: 'email', header: 'Email' },
] satisfies Column<DirectoryUser>[];
// `row` is a DirectoryUser with no annotation — satisfies supplies the contextual type
```

Use `satisfies` for configuration objects, column definitions, route tables,
theme maps — anywhere you want checking *and* the narrow literal types for
whatever reads the value next.

### `Pick`, `Omit`, `Partial` on domain types

```ts
type CartLine = Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'> & { qty: number };
type ProductDraft = Omit<Product, 'id' | 'rating'>;                  // not yet saved
type ProductErrors = Partial<Record<keyof ProductDraft, string>>;    // at most one message per field
```

Derive, do not restate: a second hand-written `interface CartLine` would drift
from `Product` the first time someone renames a field. `Omit` over a *union*
keeps only the shared keys — distribute it (`T extends unknown ? Omit<T, K> : never`)
when you need per-member behaviour.

### Template literal types

```ts
type StockLevel = 'out' | 'low' | 'in';
type BadgeClass = `badge--${StockLevel}`;          // 'badge--out' | 'badge--low' | 'badge--in'
```

Useful for class-name conventions and CSS-ish values (`` `${number}px` ``);
rarely for much else in application code.

📖 [Handbook — `satisfies`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator) ·
[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

**→ In the demos:** Demo 1 Lab 2 B — `Record<PriceSize, string>`; Demo 4
Lab 2 — `ProductErrors`; Demo 17 Lab 3 C — `satisfies`.

---

## 15. `import type`

Vite transpiles each file in isolation with esbuild, which does not know what
is exported from any other file. Faced with `import { Product } from './types'`
it cannot tell whether `Product` is a value to keep or a type to erase.
`verbatimModuleSyntax` removes the guesswork: **a type must be imported as a
type**, and everything else is emitted exactly as written.

```ts
import type { Product } from '../types';                         // the whole import is types
import { useState, type ReactNode, type Dispatch } from 'react';  // mixed: inline `type`
import { PriceTag } from './PriceTag';                             // a value
```

Forget the `type` and you get *TS1484: 'Product' is a type and must be
imported using a type-only import when 'verbatimModuleSyntax' is enabled.* The
same applies to re-exports: `export type { Product } from './types'`.

📖 [Handbook — Modules reference: `verbatimModuleSyntax`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#verbatimmodulesyntax)

**→ In the demos:** Session 1 Lab 6 — the first `import type`; every demo
after it.

---

## 16. Types at the boundary: zod, parsing vs casting

Inside your app, TypeScript knows everything. At the edges — a `fetch`, a
form, `localStorage`, a URL — data arrives as `any` or `string`, and someone
has to say what it is.

### Hand-written, with a cast

```ts
export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) throw apiError(response.status, `Product ${id} not found`);
  return (await response.json()) as Product;     // a promise we make, not a check
}
```

`response.json()` resolves to `any`; the `as Product` is a statement of
*expectation*. If the server renames `thumbnail`, nothing fails here — it
fails three components later as `undefined`. Fine for a stable API you
control; be aware of what it is. A type generated from an OpenAPI document is
the same promise, kept up to date by a build step instead of by hand.

### Inferred from a zod schema — and checked

```ts
import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  price: z.number().nonnegative(),
  brand: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;      // derived — one source of truth

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) throw apiError(response.status, `Product ${id} not found`);
  return productSchema.parse(await response.json());      // a CHECK: throws on a wrong shape
}
```

**Parsing at the boundary** turns the type into a runtime guarantee: past this
line, `Product` is true, not hoped. The error surfaces at the fetch, naming
the field, instead of as a mystery render.

| zod 4 type | Is | Use for |
|---|---|---|
| `z.infer<typeof s>` | the **output** of `parse` — after defaults and transforms (same as `z.output`) | data you read from the API |
| `z.input<typeof s>` | what you may **give** to `parse` — before defaults and transforms | form values, where `terms` must be `boolean` so the empty form compiles |

Demo 4 types its signup form as `z.input<typeof signupSchema>` for exactly
that reason: `z.boolean().refine((v) => v)` keeps the *type* `boolean` and
makes the *rule* "must be true", where `z.literal(true)` would have made the
default value `false` a compile error.

The DOM is a boundary too: a `<select>` hands you a `string`,
`URLSearchParams.get()` a `string | null`. Session 1's `parseSortOrder(value: string): SortOrder`
is the shape — wide type in, narrow type out, the narrowing in one place.

📖 [Handbook — Type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

**→ In the demos:** Session 1 Lab 6 — `as ProductListResponse` and
`isApiError`; Demo 4 Lab 4 — `signupSchema`, `z.input`, and `safeParse` in the
console.

---

## 17. Escape hatches and their cost

Every escape hatch is a place where you tell the compiler you know better.
Sometimes you do. Each one should be rare enough to notice in review.

| Hatch | Says | Cost | Legitimate when |
|---|---|---|---|
| `any` | "stop checking this" | Spreads: anything touching an `any` becomes `any` | Almost never. `tseslint` recommended flags it |
| `unknown` | "I do not know yet" | None — you must narrow before use | Every boundary: `catch (e)`, `JSON.parse`, event `target` |
| `as T` | "treat this as `T`" | Silent if wrong; survives refactors that make it wrong | After a runtime check the compiler cannot see; `e.target.value as T` inside a generic `Select` |
| `as const` | "keep the literals, make it readonly" | None | Lookup arrays, tuple returns, config |
| `x!` | "this is not null" | A runtime `TypeError` the moment it is | `document.getElementById('root')!` in `main.tsx` — one place, provably present |
| `satisfies T` | "check this against `T`" | None | Prefer it to `as T` on object literals |
| `// @ts-expect-error` | "the next line is wrong on purpose" | Errors if the line stops being wrong — self-cleaning | Tests of bad input; a known library typing bug, with a comment |
| `// @ts-ignore` | "do not tell me" | Hides a fix forever | Never — `ban-ts-comment` says so |

### `any` vs `unknown`

```ts
function handle(e: unknown) {
  e.message;                                        // ✗ 'e' is of type 'unknown'
  if (e instanceof Error) console.log(e.message);   // ✓ narrowed
}
```

`unknown` costs you a narrowing per use, which is exactly the check `any`
lets you skip and then pay for in production. `catch (error)` is `unknown`
under `strict`; `ApiError.from(error)` in the demos is the narrowing in one
place.

**When a cast is a bug waiting to happen:** `(await res.json()) as Product`
with no check; `e.target as HTMLInputElement` on a `MouseEvent` whose target
could be a child; `list as [number, number]` when `list` may have one element.
The test: *what runtime fact makes this cast true, and where is it checked?*
If the answer is "nowhere", write the check, or type the result as a union and
narrow.

📖 [Handbook — Type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

---

## 18. The ESLint rules the track uses

Type-checking and linting are different jobs: `tsc` says whether the types
agree; ESLint says whether the code is *good*. The track's `eslint.config.js`
is deliberately short — `js.configs.recommended`, `tseslint.configs.recommended`,
the two React plugins, and one configured rule:

| Rule | From | What it catches |
|---|---|---|
| `react-hooks/rules-of-hooks` | `eslint-plugin-react-hooks` | A hook inside an `if`, loop or callback. **Never disable it** |
| `react-hooks/exhaustive-deps` | same | A dependency array missing something the effect reads |
| `react-hooks/refs` and friends | same (v7, the compiler rules) | Reading `ref.current` during render; mutating props |
| `react-refresh/only-export-components` | `eslint-plugin-react-refresh` | A file exporting a component *and* a function, which breaks hot reload |
| `@typescript-eslint/no-unused-vars` | `typescript-eslint`, configured with `argsIgnorePattern: '^_'` | Dead imports and variables; a leading `_` means "intentionally unused" |
| `@typescript-eslint/no-explicit-any` | `tseslint.configs.recommended` | A written `any` |
| `@typescript-eslint/ban-ts-comment` | recommended | `@ts-ignore`; `@ts-expect-error` without a description |

Two rules the track does **not** add, and why: `consistent-type-imports` is
redundant because `verbatimModuleSyntax` makes a missing `import type` a
compile error; the type-checked rule set (`recommendedTypeChecked`) is
stronger but runs the type-checker inside ESLint, which slows every lint run —
a team decision for later. `npm run lint` and `npm run typecheck` are two
commands because they are two tools. Vite runs neither while serving.

**→ In the demos:** Session 2 Lab step F — `eslint.config.js` from scratch.

---

## 19. Common error messages and what they mean

Read the message. TypeScript's errors are long because they are precise; the
last line usually names the exact mismatch.

| Message | Means | Usual fix |
|---|---|---|
| `Type 'string' is not assignable to type 'number'` (TS2322) | A prop or state was given the wrong kind of value | Check the call site: `cartCount="3"` → `cartCount={3}` |
| `Type '"up"' is not assignable to type '"asc" \| "desc"'` | A literal outside the union | Fix the spelling, or widen the union on purpose |
| `Property 'brand' does not exist on type 'Product'` (TS2339) | Misspelt, or not in the type | *Did you mean 'brand'?* is usually right |
| `Property 'data' does not exist on type 'RequestState<T>'` | Reading a field before narrowing a discriminated union | `if (state.status === 'success')` first |
| `'inputRef.current' is possibly 'null'` (TS18047) | A nullable read without a check | `?.`, an `if`, or an early return |
| `Type 'string' is not assignable to type 'never'` | `useState([])` inferred `never[]` | `useState<string[]>([])` |
| `Parameter 'e' implicitly has an 'any' type` (TS7006) | A standalone handler with no annotation | `e: ChangeEvent<HTMLInputElement>` — or move it inline |
| `Property 'children' does not exist on type 'IntrinsicAttributes & CardProps'` | You passed children; the props type does not declare them | Add `children: ReactNode` |
| `Property 'price' is missing in type '{ … }' but required in type 'PriceTagProps'` (TS2741) | A required prop not passed | Pass it, or make it optional with a default |
| `Type 'Product' is not assignable to type 'ReactNode'` | You rendered an object: `{product}` | Render a field: `{product.title}` |
| `'Product' is a type and must be imported using a type-only import` (TS1484) | `verbatimModuleSyntax` | `import type` |
| `This syntax is not allowed when 'erasableSyntaxOnly' is enabled` (TS1294) | An `enum`, `namespace` or parameter property | `as const` union |
| `Expected 1 arguments, but got 0` on `useRef` | `@types/react` 19 | `useRef<T>(null)` |
| `Type '(value: SortKey) => void' is not assignable to type '(value: string) => void'` | A generic widened to `string` because inference took two sources | Type the options as `Option<SortKey>[]`; `NoInfer` on the other positions |
| `Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Record<PriceSize, string>'` (TS7053) | Indexing a `Record` with a plain `string` | Narrow the key first, or type the parameter as the union |
| `Cannot use JSX unless the '--jsx' flag is provided` / `Property 'env' does not exist on type 'ImportMeta'` | `"jsx"` or `"types": ["vite/client"]` missing | Fix `tsconfig.app.json` |

When a message runs to twenty lines of `IntrinsicAttributes & Omit<…>`, scroll
to the end: the final *Type 'X' is not assignable to type 'Y'* is the actual
problem, and everything above is the path to it.

---

## 20. What not to type

The compiler infers more than beginners expect. Every annotation you add that
it could have inferred is noise that can drift from the truth:

```tsx
// ✗ restating the obvious
const [query, setQuery] = useState<string>('');
const total: number = items.reduce((n: number, i: CartLine): number => n + i.price, 0);

// ✓ inferred, identical types
const [query, setQuery] = useState('');
const total = items.reduce((n, i) => n + i.price, 0);
```

| Annotate | Infer |
|---|---|
| Function **parameters** — always; nothing to infer from | Local variables with an initialiser |
| **Props** types — the component's contract | Callback parameters inside JSX and array methods (contextual typing) |
| `useState` when the initial value is `null`, `[]`, or a literal of a union | `useState` otherwise |
| Exported **return types** that are a public contract (`Promise<Product>`, `UseApiResult<T>`) | Return types of local helpers, hooks with an object return, components |
| Generic parameters when inference has nothing to go on | Generic parameters when the data is in the call |
| Context value types, reducer state and action unions | `dispatch`, `setState`, everything `useReducer` returns |

Hover is your friend: if the inferred type on hover is what you would have
written, do not write it. If it is *wider* than you meant (`string` where you
wanted `SortOrder`), that is the moment for an annotation, `as const`, or a
type argument.

A type is earning its keep when it either **documents a contract** another
file depends on, or **narrows** something the compiler would otherwise let
through. Everything else is ceremony.

---

## 21. Self-check

1. TypeScript produces no runtime code. What, then, does `strict: true` buy a
   React app — name three concrete bugs it catches. Why does Vite serve a
   project with type errors, and what does that imply for CI?
2. Explain `verbatimModuleSyntax` from the bundler's point of view, and why
   `erasableSyntaxOnly` forbids `enum`.
3. Which TypeScript 6.0 default changes would affect a project that *relied*
   on the old defaults, and why does the track's tsconfig not care?
4. In `{ discountPercentage?: number }` with `discountPercentage = 0` in the
   parameter: which mechanism makes the prop optional and which removes the
   `undefined` inside the body?
5. When is `children` a `ReactNode` and when a `ReactElement`? Why is
   `JSX.Element` not what you want in `@types/react` 19?
6. `ComponentProps<'button'>` vs `ComponentPropsWithoutRef<'button'>` — which
   is the default in React 19, and when do you want the other?
7. Give the three situations where `useState` needs a type argument.
8. Turn `{ loading, error, data }` into a discriminated union. How many
   states did you remove? Write the `default` branch that makes a `switch`
   over it exhaustive and explain what `never` is doing.
9. Why does `<input onChange={(e) => …}>` need no annotation while
   `function handleChange(e) {}` does? Name the mechanism.
10. What is the type of `useRef<HTMLInputElement>(null).current`, and why is
    `inputRef.current!.focus()` a bug waiting to happen?
11. Why `createContext<ThemeContextValue | undefined>(undefined)` rather than
    a sensible default object? Where does the `undefined` get removed?
12. Without `NoInfer`, why does `<Select options={sortOptions} onChange={(k: SortKey) => …}>`
    with a `string` `value` compile when it should not?
13. Why does `return [value, toggle]` from a hook need `as const`?
14. `satisfies Record<Role, string>` vs `: Record<Role, string>` — what is the
    type of `.admin` in each case, and when does the difference matter?
15. `(await res.json()) as Product` vs `productSchema.parse(await res.json())`
    — what does each guarantee? Which zod type does the signup form use for
    its values, and why?
16. Rank `any`, `unknown`, `as`, `!`, `@ts-expect-error`, `@ts-ignore` by how
    often they should appear in a codebase, and give the one legitimate use of
    `!` in the track.
17. Which ESLint rule must never be disabled, and what bug does it prevent?
18. List five annotations the compiler would have inferred identically, and
    delete them from a component you wrote this week.

### Practical

1. Take an untyped feature — a product filter bar in `.jsx` — and convert it
   to `.tsx` end to end: props, state, handlers, the API call. Count the bugs
   the compiler finds before the browser does. Expect at least two.
2. Write a `<Select<T>>` that infers its option type from `options` and
   rejects a mismatched `onChange`. Prove it: write the call that *should*
   fail, confirm it does, then remove `NoInfer` and confirm it compiles.
3. Replace three booleans in a component with a discriminated union; make the
   `switch` exhaustive with `never`; add a fifth state and watch the compiler
   point at the `switch`.
4. Replace `as Product` in one fetch function with a zod schema and
   `.parse()`. Break the API shape in the mock and see where the error
   surfaces now versus before.

---

## 22. References

Official React documentation and the TypeScript handbook only.

**React**
- [Using TypeScript](https://react.dev/learn/typescript)
- [TypeScript with React Components](https://react.dev/learn/typescript#typescript-with-react-components)
- [Example hooks](https://react.dev/learn/typescript#example-hooks) — [`useState`](https://react.dev/learn/typescript#typing-usestate) · [`useReducer`](https://react.dev/learn/typescript#typing-usereducer) · [`useContext`](https://react.dev/learn/typescript#typing-usecontext)
- [Useful types](https://react.dev/learn/typescript#useful-types) · [DOM events](https://react.dev/learn/typescript#typing-dom-events) · [Children](https://react.dev/learn/typescript#typing-children)
- [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [`useState`](https://react.dev/reference/react/useState) · [`useReducer`](https://react.dev/reference/react/useReducer) · [`useRef`](https://react.dev/reference/react/useRef) · [`useContext`](https://react.dev/reference/react/useContext)

**TypeScript handbook**
- [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated unions, exhaustiveness checking, type predicates
- [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html) — `verbatimModuleSyntax`, `moduleResolution: bundler`
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/) — `strict`, `jsx`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`
- [TypeScript 4.9 — `satisfies`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator) · [TypeScript 5.4 — `NoInfer`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type)

---

**Previous:** [Module 16 — Advanced Patterns, Error Boundaries & Portals](../16-advanced-patterns/)
**Next:** [Module 18 — Testing React Applications](../18-testing/)
