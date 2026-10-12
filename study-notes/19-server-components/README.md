# Module 19 — Server Components & Modern React 19

**Study notes** · ~3 hours

> **Goal.** React 19 added one layer under forms, fetching and rendering — the
> **Action** — and built pending, optimistic and streaming state on it. Part A
> is that layer in the Vite SPA you own. Part B crosses the server/client
> boundary and asks: *where does the line go, and what does it cost?*

**Prerequisites:** [Module 3](../03-rendering-architectures/) (CSR/SSR/SSG,
hydration, streaming, the RSC vocabulary — not repeated here),
[Module 10 §11–12](../10-forms/#11-react-19-form-actions) (first look at
Actions), [Module 13 §11–12](../13-data-fetching-and-custom-hooks/#11-suspense-based-fetching-and-use)
(`use`, loaders), [Module 11 §9](../11-refs-and-the-dom/#9-ref-as-a-prop--and-legacy-forwardref)
(`ref` as a prop).

---

## Contents

**Part A — React 19 in the browser**

1. [What React 19 actually added](#1-what-react-19-actually-added)
2. [Actions and async transitions](#2-actions-and-async-transitions)
3. [`useActionState`](#3-useactionstate)
4. [`useFormStatus`](#4-useformstatus)
5. [`useOptimistic`](#5-useoptimistic)
6. [`use` — promises and context](#6-use--promises-and-context)
7. [`<Suspense>` for data, and why a SPA still needs a loader](#7-suspense-for-data-and-why-a-spa-still-needs-a-loader)
8. [Document metadata and resources](#8-document-metadata-and-resources)
9. [`ref` as a prop, ref cleanup, and what to delete](#9-ref-as-a-prop-ref-cleanup-and-what-to-delete)
10. [The React Compiler](#10-the-react-compiler)

**Part B — Server Components**

11. [The server/client boundary](#11-the-serverclient-boundary)
12. [`'use client'` is a boundary, not a file switch](#12-use-client-is-a-boundary-not-a-file-switch)
13. [Crossing the boundary: props and `children`](#13-crossing-the-boundary-props-and-children)
14. [`'use server'` and Server Functions](#14-use-server-and-server-functions)
15. [Streaming and `<Suspense>` on the server](#15-streaming-and-suspense-on-the-server)
16. [Caching and revalidation vocabulary](#16-caching-and-revalidation-vocabulary)
17. [What RSC changes about data fetching](#17-what-rsc-changes-about-data-fetching)
18. [When RSC is not the answer](#18-when-rsc-is-not-the-answer)
19. [ShopScope: the Vite SPA and the Next.js mini-project](#19-shopscope-the-vite-spa-and-the-nextjs-mini-project)
20. [Self-check](#20-self-check)
21. [References](#21-references)

**Hands-on.** This module is the theory for
[Demo 21 — React 19 Actions, Suspense & Server Components](../../demos/21-react-19-actions-suspense-and-server-components/).
Blocks 1–3 implement Part A inside the ShopScope SPA (React 19.3, react-router
8.3, no new dependencies). Block 4 is Part B as a whiteboard, and Block 5
builds `next-mini/` — ShopScope's product list as an `async` Server Component
with one client island — on the current App Router.

---

## 1. What React 19 actually added

Module 3 gave you the vocabulary: Server Components, `'use client'`,
streaming, hydration. This module is about using it. Written against
**React 19.3**.

The headline list is long. Read it as three groups and it stops being a list:

| Group | What it is | Where it works |
|---|---|---|
| **Actions** | A function React tracks the pending state of; §2–§5 are all one idea | Any React 19 app, including a Vite SPA |
| **Cleanups** | `use`, metadata hoisting, `ref` as a prop, removed legacy APIs, the Compiler | Any React 19 app |
| **Server** | Server Components, `'use client'`, `'use server'`, server streaming | Only in a framework with an RSC-aware bundler |

The first two groups are in the `react@19.3.0` you have had since Demo 1. The
third needs a framework and a server — hence §18.

📖 [react.dev — React 19](https://react.dev/blog/2024/12/05/react-19)

---

## 2. Actions and async transitions

An **Action** is any async function you hand to React whose pending state
React will track. That is the whole definition.

Before 19 a transition had to be synchronous. Now it can be `async`, and
`isPending` stays true until the promise settles:

```tsx
startTransition(async () => {            // an Action
  await saveSortPreference(sort);
  startTransition(() => setSort(sort));  // updates AFTER an await must be re-wrapped
});
```

Inside an Action React keeps the pending flag true for the whole promise,
**queues** a second Action behind the first instead of running both, and
sends a thrown error to the nearest error boundary. It does not catch the
error for you.

### `<form action={fn}>`

Pass a function as a form's `action` and React attaches the submit handler,
calls `preventDefault()`, builds the `FormData`, and runs your function as an
Action: `<form action={subscribe}>`, where `subscribe(formData)` is any async
function.

The inputs are **uncontrolled**: `name` is how a value reaches the
`FormData`, `defaultValue` is only the starting text, the DOM holds the state
([Module 10 §4](../10-forms/#4-uncontrolled-inputs-and-formdata)). On a failed
submit React does not touch the inputs, so what the user typed survives
without you storing a character of it. On success React resets the form.
`<button formAction={fn}>` gives one form several Actions.

The three `<form>` mechanisms in this course answer different questions:

| | React Action | Router action (Module 14) | react-hook-form (Module 10) |
|---|---|---|---|
| Needs a route | no | **yes** | no |
| Pending state | `isPending` / `useFormStatus` | `useNavigation().state` | `formState.isSubmitting` |
| Errors arrive as | the Action's return value | `useActionData()` | `formState.errors` |
| Revalidates loaders after a write | no — invalidate by hand | **yes** | no |
| Validates per keystroke | no — on submit | no | **yes** |
| Works before JavaScript loads | in an RSC framework, **yes** | no | no |
| Bundle cost | 0 kB | 0 kB | ~43 kB |

A form that owns a URL should be a router action. A form that does not, and
validates on submit, should be a React Action. A form with twenty fields and
live dependent rules should be react-hook-form.

📖 [react.dev — `useTransition`](https://react.dev/reference/react/useTransition) ·
[`<form>`](https://react.dev/reference/react-dom/components/form)

**→ In the demos:** Demo 21, Block 1 — the sign-up modal moves from
react-hook-form to `<form action>`, and this table is built live.

---

## 3. `useActionState`

An Action that returns something needs somewhere to put it:

```tsx
const [state, formAction, isPending] = useActionState(action, initialState);
//     ↑ whatever the Action last RETURNED
//            ↑ hand this to <form action>, not the Action itself
//                         ↑ true from submit until the promise settles
```

The Action's signature, `(previousState, formData) → Promise<state>`, is the
part to memorise. **That is a reducer** — an asynchronous one whose
second argument is always a `FormData` ([Module 9](../09-reducers-and-context/)).
So type the state as a discriminated union, not a bag of flags. Four booleans
are sixteen combinations, of which four are real:

```ts
type SignupState =
  | { status: 'idle' }
  | { status: 'error'; errors: SignupErrors; values: SignupValues }
  | { status: 'success'; message: string };
```

```tsx
// Declared OUTSIDE the component: no props, no hooks, closes over nothing.
// This is exactly the shape a Server Function has (§14).
async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const values = parseSignupFormData(formData);
  const errors = validateSignup(values);
  if (errors) return { status: 'error', errors, values };     // RETURN, never throw

  try {
    await createAccount(values);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      return { status: 'error', errors: { email: 'That email is already registered.' }, values };
    }
    throw e;                                                   // unexpected → error boundary
  }
  return { status: 'success', message: `${values.firstName}, your account is ready.` };
}

// in SignupForm
const [state, formAction] = useActionState(signupAction, { status: 'idle' });
const values = state.status === 'error' ? state.values : SIGNUP_EMPTY;
<form action={formAction} noValidate>
  <TextField name="email" defaultValue={values.email}
             error={state.status === 'error' ? state.errors.email : undefined} />
  <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
</form>
```

Three rules, each a bug when broken:

- **Errors are returned, not thrown.** A bad email is an expected outcome and
  belongs in the return value; a `TypeError` belongs in a boundary.
- **Feed `defaultValue` from the returned `values`.** The DOM already keeps
  what the user typed, but a server-rendered form (§14) has no DOM to keep it
  in. Returning the values makes the form correct in both worlds.
- **Success is a return value, not a side effect.** No toast dispatched inside
  the Action, no effect watching a flag. Render the result.

**`FormData` is strings and `File`s.** An unchecked checkbox sends *nothing* —
there is no `'off'`. A checkbox group is many entries under one name, read
with `getAll`. An empty file input still sends a `File` of size 0. The
coercion a form library used to do is now a pure `parseSignupFormData`
function you write once and test without rendering. The `permalink` third
argument exists for progressive enhancement in an RSC framework — the URL the
form posts to before JavaScript has loaded; in a SPA it is irrelevant.

📖 [react.dev — `useActionState`](https://react.dev/reference/react/useActionState)

**→ In the demos:** Demo 21, Labs 1.1–1.3 — `parseSignupFormData`,
`validateSignup` and `SignupForm` on `useActionState`.

---

## 4. `useFormStatus`

```tsx
import { useFormStatus } from 'react-dom';   // react-DOM, not react

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
```

It lives in `react-dom` because it is about a DOM form submission. It returns
`{ pending, data, method, action }` for the **nearest `<form>` above it** — so
it must be called in a child of the form, never in the component that renders
the `<form>`. Call it there and it returns `pending: false` for ever, because
there is no form above it yet. Everyone makes this mistake once.

Its reason to exist is a shared component library: one `SubmitButton`,
correct in every form, told nothing.

📖 [react.dev — `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)

**→ In the demos:** Demo 21, Lab 1.2 — `SubmitButton.tsx`, reused unchanged
by the sign-up form and the wishlist button.

---

## 5. `useOptimistic`

```tsx
const [optimisticValue, setOptimisticValue] = useOptimistic(realValue);
```

`optimisticValue` **is** `realValue`, almost all the time. Inside an Action you
may push a different value into it, and React shows that one until the Action
settles — then it snaps back to whatever `realValue` has become. On success
the real value has caught up, so the snap is invisible. On failure it has not,
so the UI reverts. **There is no rollback; there is a temporary override that
expires.**

```tsx
export function WishlistButton({ productId, title }: WishlistButtonProps) {
  const saved = useWishlistStore(selectIsSaved(productId));   // the source of truth
  const toggle = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState<string | null>(null);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  async function toggleSaved() {
    setOptimisticSaved(!saved);              // on screen now
    try {
      await syncWishlist(productId, !saved); // the server may refuse
      toggle(productId);                     // only NOW does real state change
    } catch (e) {
      setError(toMessage(e));                // no setSaved(previous) anywhere
    }
  }

  return (
    <form action={toggleSaved}>
      <WishlistSubmit saved={optimisticSaved} title={title} />   {/* useFormStatus inside */}
      {error && <p role="status">{error}</p>}
    </form>
  );
}
```

With a reducer as the second argument —
`useOptimistic(inCart, (current, delta: number) => current + delta)` — the
override is computed from the real value and whatever you pass in.

Two constraints follow from the mechanism:

- **`setOptimistic…` may only be called inside an Action or a transition.**
  From a plain `onClick` React warns and ignores it — which is why the
  wishlist button is a `<form action>`, not a button with a click handler.
- **Update the store *after* the `await`.** Update it before and the optimistic
  value and the real one disagree for a frame: the heart flickers.

Use it for likes, saves, toggles, add-to-cart — not a payment or a delete.
And test the rejection path with the first optimistic update you ship, or the
UI quietly lies whenever the server has a bad day.

📖 [react.dev — `useOptimistic`](https://react.dev/reference/react/useOptimistic)

**→ In the demos:** Demo 21, Labs 1.4–1.8 — `syncWishlist` with a server-side
limit of five, `WishlistButton`, and the test asserting the screen says
"saved" while the store still says `[]`.

---

## 6. `use` — promises and context

`use` reads a resource during render. It is the only hook that may be called
conditionally or in a loop, and it works on two kinds of thing.

### A promise

```tsx
import { use } from 'react';

function ReviewsPanel({ reviews }: { reviews: Promise<Review[]> }) {
  const list = use(reviews);                 // suspends until it resolves
  return <ReviewList reviews={list} />;
}
```

| | `await` | `use(promise)` |
|---|---|---|
| Where | in an async function | **during render** |
| While pending | the function pauses | the component **suspends**; the nearest `<Suspense>` shows its fallback |
| On rejection | `try/catch` | **throws during render** → the nearest error boundary |
| Rules | anywhere | during render only; may be conditional |

**The promise must come from outside the render.** A promise created in the
component that calls `use` on it is a new promise every render, so it never
settles — React reports *"A component suspended while responding to
synchronous input"*. It must come from a loader, a cache, a parent Server
Component, or a ref. This is the single most common `use` bug.

### A context

`use(SettingsContext)` is `useContext` minus the call-order rule. React 19 also
lets you render `<SettingsContext value={…}>` directly as the provider.

📖 [react.dev — `use`](https://react.dev/reference/react/use) ·
[`createContext`](https://react.dev/reference/react/createContext)

---

## 7. `<Suspense>` for data, and why a SPA still needs a loader

In a client app `<Suspense>` does what Module 3 §8 showed on the server:
*this subtree may not be ready; show this until it is.*

### Boundary placement is the design decision

```tsx
<ProductHeader product={product} />           {/* outside: renders at once */}
<WidgetBoundary name="reviews">              {/* rejected → here */}
  <Suspense fallback={<ReviewsSkeleton />}>  {/* pending  → here */}
    <ReviewsPanel reviews={reviews} />
  </Suspense>
</WidgetBoundary>
```

**A boundary should surround the smallest piece of UI that can be meaningfully
missing.** Wrap the whole page and the title waits for the reviews — a slower
version of what you had. Suspense handles *pending*; an error boundary handles
*rejected*. React keeps them apart on purpose, and a `<Suspense>` with no
boundary beside it turns a failing reviews request into a blank product page.

### Why a SPA still needs a loader or a cache

`use` reads a promise. It does not *create* one and does not remember one
across renders. Something outside the component must own the promise, start
it early, and hand it in. In ShopScope that is the react-router 8.3 loader
with TanStack Query behind it:

```ts
export async function productDetailLoader({ params }: LoaderFunctionArgs) {
  const id = params.productId ?? '';

  // NOT awaited — and started BEFORE the awaited call, or the requests queue up.
  const reviews = queryClient.fetchQuery(productReviewsQuery(id));
  // Mark the rejection observed without consuming it: `.catch()` returns a NEW
  // promise; the original still rejects, and `use()` still sees it.
  reviews.catch(() => {});

  return { product: await queryClient.ensureQueryData(productQuery(id)), reviews };
}
```

A loader may return promises as well as values, and **a promise it did not
await does not block the navigation.** The page renders with everything that
is resolved; the rest sits in its boundaries. That is streaming, in a
client-side router.

The waterfall trap survives code review because the broken version looks
right: swap the two lines so `fetchQuery` comes *after* the `await`, and the
reviews request does not start until the product has landed — a second and a
half of nothing. **Start every request
before you await any of them.**

Without a loader, the alternative is fetching in an effect — and that is
[Module 12 §11](../12-effects/#11-data-fetching-in-an-effect) with its loading
flag, its race and its render-then-fetch waterfall. `<Suspense>` did not remove
the need for a cache; it removed the need for the `isLoading` branch.

### react-router's `<Await>`

`<Await resolve={reviews} errorElement={…}>{(list) => …}</Await>` does the
same job with a render prop and built-in error handling, and still works in
react-router 8.3. **Prefer `use` in new code** — it is React's API, not the
router's. Know `<Await>` for codebases written before React 19.

**The honest cost:** whatever depends on a streamed section cannot know its
value yet — a "12 reviews" badge in the tab header has nowhere to come from.

📖 [react.dev — `Suspense`](https://react.dev/reference/react/Suspense)

**→ In the demos:** Demo 21, Labs 2.1–2.6 — the reviews promise, `ReviewsPanel`
with `use`, and tests for both the streamed and the rejected case.

---

## 8. Document metadata and resources

React 19 **hoists `<title>`, `<meta>` and `<link>` into `<head>`** from
wherever you render them, and removes them when the component unmounts. No
provider, no portal, no library.

```tsx
export function PageMeta({ title, description, noIndex = false }: PageMetaProps) {
  const full = title ? `${title} · ${env.appName}` : env.appName;
  return (
    <>
      <title>{full}</title>
      {description && <meta key="description" name="description" content={description} />}
      <meta key="og:title" property="og:title" content={full} />
      {noIndex && <meta key="robots" name="robots" content="noindex" />}
    </>
  );
}

// ProductDetailPage
<PageMeta title={product.title} description={product.description} />
```

Four rules:

- **One `<title>` at a time.** The browser uses the *first* `<title>` in the
  document, and React appends — so a static one left in `index.html` wins for
  ever and every route is called "ShopScope". Delete it from `index.html`.
- **`<title>` takes a single string child.** `<title>{a} · {b}</title>` is an
  array of children and renders `[object Object]`. Build the string first.
- **Give each `<meta>` a `key`**, or two routes that each render a
  description can leave both behind across a navigation.
- **This runs in the browser.** The HTML the server sends is still
  `index.html` plus an empty `<div id="root">`. Google, which runs JavaScript,
  mostly sees these tags. Link-preview bots, social cards, `curl` and every
  crawler with a budget do not. Per-route metadata in a CSR app fixes tabs,
  bookmarks and history — half the problem. The other half needs the server
  (§19), and [Module 20](../20-production/) opens by `curl`ing the page to
  prove it.

**Stylesheets and resource hints.** `<link rel="stylesheet" precedence="…">`
is hoisted, de-duplicated and ordered by `precedence` rather than render order.
`preload`, `preinit` and `preconnect` from `react-dom` are called from the
component that needs the resource instead of hand-edited into `index.html`.

📖 [react.dev — `<title>`](https://react.dev/reference/react-dom/components/title) ·
[`<meta>`](https://react.dev/reference/react-dom/components/meta) ·
[`<link>`](https://react.dev/reference/react-dom/components/link) ·
[`preload`](https://react.dev/reference/react-dom/preload)

**→ In the demos:** Demo 21, Labs 3.1–3.3 — `PageMeta`, the five routes, the
deleted `<title>` in `index.html`, and a test that `document.title` changed.

---

## 9. `ref` as a prop, ref cleanup, and what to delete

### `ref` is an ordinary prop

```tsx
interface TextFieldProps extends ComponentProps<'input'> {
  ref?: Ref<HTMLInputElement>;
  label: string;
}

export function TextField({ ref, label, ...rest }: TextFieldProps) {
  return <label>{label}<input ref={ref} {...rest} /></label>;
}
```

`forwardRef` is deprecated: every `forwardRef((props, ref) => …)` becomes a
plain component with `ref` in its props interface and the wrapper deleted.
`useImperativeHandle` works exactly as before
([Module 11 §9–10](../11-refs-and-the-dom/#9-ref-as-a-prop--and-legacy-forwardref)).

### Ref callbacks may return a cleanup

```tsx
<div ref={(node) => {
  const observer = new ResizeObserver(() => measure(node));
  observer.observe(node);
  return () => observer.disconnect();       // runs when the node is removed
}} />
```

Before 19 a ref callback was called with the node on attach and with `null`
on detach, and you wrote the `if (node === null)` branch yourself. When the
callback returns a cleanup, React calls the cleanup instead of calling back
with `null` — a DOM ref now has the same setup/cleanup shape as an effect
([Module 12 §4](../12-effects/#4-cleanup)).

**Also new:** `useDeferredValue(value, initialValue)` renders `initialValue`
first for a cheap first paint ([Module 15](../15-performance/)); hydration
errors arrive as one server-vs-client diff; `createRoot` takes
`onCaughtError` / `onUncaughtError` for your logger.

### What to delete from older code

| Delete | Replace with | Why |
|---|---|---|
| `forwardRef(…)` | `ref` in the props interface | Deprecated; the wrapper does nothing now |
| `Component.defaultProps` | defaults in destructuring | **Removed** for function components — the prop silently arrives `undefined` |
| `propTypes` | TypeScript | Removed; ignored at runtime |
| `react-helmet` | `<title>` / `<meta>` in the component | Hoisting is built in (§8) |
| `useContext(Ctx)` | `use(Ctx)` | Optional; `use` may be conditional |

`defaultProps` is the one that bites: no warning, no throw, it just stops
working.

📖 [react.dev — `forwardRef`](https://react.dev/reference/react/forwardRef) ·
[`useDeferredValue`](https://react.dev/reference/react/useDeferredValue) ·
[React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

**→ In the demos:** Demo 21, Block 3 — the "what to delete" table, with
`TextField` from Demo 15 as the `ref`-as-prop example.

---

## 10. The React Compiler

The Compiler is a build-time companion to React 19, not part of it. It reads
your components and inserts the memoisation you would otherwise write by hand
— `useMemo`, `useCallback`, `memo` — based on what each value actually depends
on.

```ts
// vite.config.ts
plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
```

What it assumes is the part that matters: that your components and hooks
follow the **Rules of React** — pure during render, no mutation of props or
state, hooks called unconditionally. It skips any component it cannot prove
safe rather than breaking it, and the `react-hooks` ESLint rules flag the
reasons. Code that was already correct gets faster; code that quietly relied
on a re-render it should not have had may get *exposed*.

It does not change rendering architecture — not shipping the JavaScript at
all is still the bigger win, which is Part B.

📖 [react.dev — React Compiler](https://react.dev/learn/react-compiler) ·
[Rules of React](https://react.dev/reference/rules)

---

## 11. The server/client boundary

**A Server Component runs on the server (or at build time) and its code never
reaches the browser.** It can be `async`. It can `await` a database query or a
`fetch` with a secret key. It cannot use state, effects, event handlers,
context or browser APIs — because by the time the browser has the output, the
component is gone.

```tsx
// app/products/page.tsx — a Server Component. No directive: it is the default.
export default async function ProductsPage() {
  const products = await listProducts(12);          // runs on the server

  return (
    <ul className="grid">
      {products.map((product) => (
        <li key={product.id}>
          {product.title}
          <AddToCartButton productId={product.id} />   {/* the island */}
        </li>
      ))}
    </ul>
  );
}
```

`async` — a component may await. And what is **not** there: no effect, no
loading flag, no axios, no query cache — and none of this code in the browser.
A **Client Component** is what you have written for eighteen modules; its code
is in the bundle.

**What the browser receives** is not HTML exactly. The server renders Server
Components to the **RSC payload**: a compact description of the rendered tree —
the output of server components, *references* to client components (which
chunk, which export) and their serialised props. On first load the framework
also renders that payload to HTML, so the page is visible before any
JavaScript. On navigation the browser fetches just the payload and React
patches the existing DOM, keeping client state intact — which is why a Server
Component re-render after a mutation (§14) does not blow away a half-typed
form beside it.

| | Server Component | Client Component |
|---|---|---|
| Runs | server / build | browser (and server, for the initial HTML) |
| Can be `async` | **yes** | no |
| State, effects, handlers, browser APIs | **no** | yes |
| Reads a database / secret directly | **yes** | never |
| Code in the bundle | **none** | all of it |

📖 [react.dev — Server Components](https://react.dev/reference/rsc/server-components)
📖 [nextjs.org — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

## 12. `'use client'` is a boundary, not a file switch

Put `'use client'` at the top of `AddToCartButton.tsx`. It does not say "this
component runs in the browser". It says **"this module is the start of the client bundle"**. Every module it imports,
and everything those import, joins the client bundle — whether or not they
carry the directive. One `'use client'` at the top of a page turns the whole
page into client code, and the Server Components under it stop being Server
Components.

```
app/products/page.tsx            server  ──imports──►  lib/dummyjson.ts          server
        │
        └──imports──►  AddToCartButton.tsx  'use client'
                               ├──imports──►  react, react-dom               client
                               └──imports──►  ./actions.ts  'use server'  →  replaced by an endpoint reference
```

The discipline that follows: **push the directive as deep as you can.** Not
`page.tsx` — `AddToCartButton.tsx`. Each module below the line ships; each
module above it does not.

Two things people hit in the first hour:

- **A Server Component may render a Client Component; a Client Component may
  not *import* a Server Component.** Below the line there is no way back up
  through an `import`. There is a way back through `children` (§13).
- **A shared `utils.ts` imported from both sides is fine.** It is bundled
  only where a client module imports it.

Client Components still render on the server for the initial HTML — "client"
means *hydrated and interactive in the browser*, not *browser-only*. A Client
Component that touches `window` during render breaks on the server exactly as
in any SSR app ([Module 3 §5](../03-rendering-architectures/#5-hydration-explained-properly)).

📖 [react.dev — `'use client'`](https://react.dev/reference/rsc/use-client)

**→ In the demos:** Demo 21, Block 5 — `AddToCartButton.tsx` is the one
`'use client'` in `next-mini/`, and deleting it moves the bundle by 1.3 kB.

---

## 13. Crossing the boundary: props and `children`

### Props are serialised

A Server Component rendering a Client Component hands props across a process
boundary — they go into the RSC payload as data, so they must serialise:

| Crosses | Does not cross |
|---|---|
| strings, numbers, booleans, `null`, `undefined` | **functions** (except Server Functions) |
| plain objects and arrays of the above | class instances, anything with methods |
| `Date`, `Map`, `Set`, `FormData`, typed arrays | JSX element *types* (a component as a prop) |
| `Promise` (the client reads it with `use`) | an ORM row with lazy getters |
| JSX *elements* (rendered output) | |

Break the rule and you get *"Functions cannot be passed directly to Client
Components"* — a good error for a design problem: you were sending behaviour
across the wire. Pass `productId={product.id}`, not `onAdd={() => …}`, and
put the handler inside the client component.

### `children` — the pattern worth memorising

A Client Component may not *import* a Server Component, but it can *render*
server-rendered JSX it was handed. By then it is output, not code:

```tsx
// page.tsx — Server Component
export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct((await params).id);
  return (
    <ClientTabs>                                  {/* 'use client': owns which tab is open */}
      <ProductDetails product={product} />        {/* server: never reaches the bundle */}
    </ClientTabs>
  );
}
```

`ClientTabs` holds the selected tab in state and renders `{children}`;
`ProductDetails`, with whatever it imports, stays on the server. **An
interactive shell around server content is the single most useful RSC
pattern**, and it is why "client components are leaves" is not quite right —
they are leaves in the *import graph*, not in the render tree. Any slot prop
(`header={<ServerThing />}`) crosses as happily as `children`.

**Passing a promise.** Because a `Promise` serialises, a Server Component can
start a slow fetch and hand the *promise* to a Client Component, which reads
it with `use` inside a `<Suspense>`. The server does not wait; the client
streams the result in. It is §7's loader pattern with the server as the
loader.

📖 [react.dev — serializable types](https://react.dev/reference/rsc/use-client#serializable-types)

---

## 14. `'use server'` and Server Functions

`'use server'` is the mirror image of `'use client'`:

| | `'use client'` | `'use server'` |
|---|---|---|
| Marks | a module as the start of the client bundle | every export as a **Server Function** |
| Direction | server → client | client → server |
| What ships | this module and its imports | **nothing** — the import becomes an endpoint reference |

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { addLine } from '@/lib/cart';

export async function addToCart(productId: number): Promise<void> {
  // 1. VALIDATE — the argument arrived over the network (a zod parse in real code)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('addToCart: productId must be a positive integer.');
  }

  const session = await auth();                       // 2. AUTHORISE
  if (!session) throw new Error('Not signed in.');
  await addLine(session.userId, productId);
  revalidatePath('/products');                        // 3. SAY WHAT CHANGED
}
```

A Client Component imports it and calls `await addToCart(productId)` like a
local function. The bundler replaces the import with a stub that **POSTs to a generated
endpoint**, with arguments serialised by the same rules as props. The response
carries the updated RSC payload, so the page re-renders without a navigation.
Every Part A hook works identically with a Server Function as the Action —
nothing here is new React, only new plumbing.

### It is a public endpoint

Steps 1 and 2 are the lesson. A Server Function is an HTTP endpoint with a
generated URL. Anyone can call it, with any arguments, in any order, from
`curl`, regardless of what the UI allows. "It is only called from one button"
is not a check. Write it as you would write an Express route — because that is
what it is. The convenience is that you did not have to *name* the route, not
that the route is private. Return values are serialised back, so do not return
the whole user row because the caller only displays the name.

The directive goes at the top of a file or inside an `async` function in a
Server Component — never in a Client Component. It does not mean "server-only
code"; it *exposes* a function.

### Progressive enhancement

A Server Function passed *directly* to `<form action>` from a Server Component
works **before the JavaScript has loaded** — the browser posts the form, the
framework routes it to the function, the page re-renders. The `permalink`
argument to `useActionState` (§3) keeps that true inside a Client Component.
This is the one row of §2's table no client-only mechanism can offer.

### Revalidation is a problem you have solved twice

The server has new data; nothing re-renders until something says so.
`revalidatePath` / `revalidateTag` is `queryClient.invalidateQueries`
([Module 13 §9](../13-data-fetching-and-custom-hooks/#9-mutations-and-invalidation))
is the router's automatic revalidation after an action
([Module 14](../14-routing/)). Same idea, three layers.

📖 [react.dev — Server Functions](https://react.dev/reference/rsc/server-functions) ·
[`'use server'`](https://react.dev/reference/rsc/use-server)
📖 [nextjs.org — Updating data](https://nextjs.org/docs/app/getting-started/updating-data)

**→ In the demos:** Demo 21, Block 5 — `app/products/actions.ts`, with the
three numbered steps as comments.

---

## 15. Streaming and `<Suspense>` on the server

Module 3 §8 described streaming: flush the shell, send each slow section as
its data resolves. With Server Components the mechanism is §7's, with the
server doing the awaiting:

```tsx
export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);              // fast — in the first flush
  return (
    <>
      <ProductHeader product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={id} />                          {/* async; awaits 1.5 s — streamed later */}
      </Suspense>
    </>
  );
}
```

The header and skeleton are sent at once; when `Reviews` resolves, the server
streams its markup and a tiny inline script swaps it in.

The browser's rules hold: the smallest meaningful boundary; start every
request before awaiting any (two `await`s in a row is a server-side waterfall
— use `Promise.all` or a child component); and rejections go to an error
boundary — `error.tsx` beside the route.

**`loading.tsx` is the boundary the framework writes.** The App Router wraps
`page.tsx` in a `<Suspense>` and uses that file's default export as the
fallback: §7's boundary with the placement decided by a filename — and the
same trap, because it is the *route-level* boundary, and a slow section inside
the page still needs its own.

📖 [react.dev — `Suspense`](https://react.dev/reference/react/Suspense)
📖 [nextjs.org — `loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)

**→ In the demos:** Demo 21, Block 5 — `app/products/loading.tsx`.

---

## 16. Caching and revalidation vocabulary

Framework-specific; React defines almost none of it. The words matter more
than the details, because every RSC framework has these layers and names them
differently. The names below are the current App Router's.

| Layer | What it holds | Lives | Invalidated by |
|---|---|---|---|
| **Request memoisation** | identical `fetch`es (or `cache()`-wrapped calls) within *one* render | server, per request | ends with the request |
| **Data cache** | `fetch` results across requests and deploys | server, persistent | `revalidate: n`, `revalidateTag`, `revalidatePath` |
| **Full route cache** | rendered HTML + RSC payload for a static route | server / CDN | `revalidatePath`, a new deploy |
| **Router cache** | RSC payloads the *browser* already has | client, in memory | time, `router.refresh()`, a Server Function revalidating |

The first is React's. `cache` from `react` memoises a function per server
request, so a product fetched by the page and again by its metadata function
is fetched once:

```ts
import { cache } from 'react';
export const getProduct = cache(async (id: string) => fetchJson<Product>(`/products/${id}`));

await fetch(url, { next: { revalidate: 300, tags: ['products'] } });   // framework: data cache
export const dynamic = 'force-dynamic';   // framework: render per request (the cart lives in memory)
```

Defaults have changed between App Router versions, so do not learn the
default; learn to ask **"which layer am I looking at?"** The failure is always
the same: *you write, the database is correct, and the page still shows the
old value* — because one layer was never told.

📖 [react.dev — `cache`](https://react.dev/reference/react/cache)
📖 [nextjs.org — Caching and revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)

**→ In the demos:** Demo 21, Block 5 — `lib/dummyjson.ts` with
`next: { revalidate: 300 }`, and `force-dynamic` on the page.

---

## 17. What RSC changes about data fetching

[Module 13](../13-data-fetching-and-custom-hooks/) spent sixteen sections on
fetching from the browser. Here is what each problem becomes when the fetch
moves into a Server Component.

| Client-side problem | In a Server Component |
|---|---|
| Loading state per component | gone — the component awaits; the HTML arrives with the data |
| The race condition | gone — one render, one request, no second render to lose to |
| CORS | gone — the browser is not making the request |
| Secrets in the bundle | gone — `process.env` never ships; `VITE_` variables always do |
| Render → fetch waterfall | gone — the data is in the first response |
| Request dedup | `cache()` / request memoisation |
| Cache and revalidation | the framework's layers (§16) |
| Pagination, infinite scroll | search params + a Server Component, or a client island with a query library |
| Live data, polling, websockets | still a Client Component — the server rendered once and left |
| Mutations | Server Functions (§14), with `revalidatePath` as the invalidation |

**Fetch where the data is used** — the framework de-duplicates, so colocation
wins. **Server `fetch` is just `fetch`** — the interceptor stack of
[Module 13 §13](../13-data-fetching-and-custom-hooks/#13-the-api-layer) exists
because the browser is untrusted. **TanStack Query moves, it does not
disappear** — live or paginated islands still use it.

📖 [nextjs.org — Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data)

---

## 18. When RSC is not the answer

**RSC pays when:** the page is content-heavy and mostly read (a catalogue, a
product page, an article); first paint matters commercially and crawlers
matter; the data lives behind credentials you do not want in a bundle; the
client bundle is dominated by data-access code.

**RSC does not pay when:** the app is behind a login and never crawled; the UI
is dense and interactive, so nearly everything ends up `'use client'` anyway;
it must work offline or as a PWA; there is no server to run and no budget for
one — a static host is free; or the team is four people who would now own an
SSR runtime, a four-layer cache, and a class of bug ("stale after write") that
only happens in production.

### The verdict for ShopScope: no

A cart drawer, an infinite grid, a price ticker, an optimistic wishlist,
portals, focus traps, a theme switch: nearly every component needs state, so
an RSC ShopScope is one Server Component and sixty client ones — the
framework's full cost for a slightly better first paint on `/products`.

### The version that is worth doing

Narrower, and real: **if ShopScope's catalogue needed to rank in Google, move
`/products` and `/products/:id` to a framework and leave the account area as
it is.** The marketing site and the catalogue get Server Components; the
signed-in application stays a client app; they share a design system and an
API. Choose the boundary at the level of *pages*, not components. Weigh it with
[Module 3 §13](../03-rendering-architectures/#13-decision-worksheet)'s
worksheet, per route.

📖 [react.dev — Creating a React App](https://react.dev/learn/creating-a-react-app)

**→ In the demos:** Demo 21, Block 4 — the whiteboard, with this application
as the worked example.

---

## 19. ShopScope: the Vite SPA and the Next.js mini-project

The course's app is a Vite SPA on react-router 8.3, and it stays one.

### What the SPA adopted

Sign-up on `useActionState`, `SubmitButton` on `useFormStatus`, the wishlist
on `useOptimistic`, streamed reviews, and `PageMeta` on every route. The
bundle got 36 kB lighter and nobody optimised anything: the library
Actions replaced was not free. The router stayed — the SPA still needs a
loader to start promises early (§7) — and TanStack Query stayed, because the
cache is what makes the second visit instant.

### The mini-project

`next-mini/` is a sibling of `starter/` with its own `package.json`, the same
`react@19.3.0` beside the current App Router, about two hundred lines:

| File | Side | Shows |
|---|---|---|
| `app/products/page.tsx` | server | an `async` Server Component fetching DummyJSON directly |
| `app/products/AddToCartButton.tsx` | **client** | the one `'use client'`: `useOptimistic`, `useFormStatus`, `<form action>` |
| `app/products/actions.ts` | server | `'use server'` — validate, authorise, `revalidatePath` |
| `app/products/loading.tsx` | server | the route-level `<Suspense>` |
| `app/layout.tsx` | server | `export const metadata` — metadata as data, in the HTML before it is sent |
| `lib/dummyjson.ts` | server | `fetch` with `next: { revalidate: 300 }` |
| `lib/cart.ts` | server | a module-scope `Map` standing in for a session store, and honest about it |

Two commands make Part B's entire argument:

```bash
curl -s localhost:3000/products | grep -o 'class="title">[^<]*' | head -1   # Next: names in the HTML
curl -s localhost:4173/products | grep -o '<div id="root"></div>'           # Vite: an empty div
```

And one table, from summing the chunks the served HTML asks for:

| Build | Raw | Gzip |
|---|---|---|
| Vite / ShopScope after this module | 763 kB | main chunk 194 kB |
| Next.js `/products` as shipped | 567 kB | 170 kB |
| Next.js `/products` with `<AddToCartButton>` deleted | 566 kB | 170 kB |

The two apps are not comparable — a framework rendering twelve items against
nine thousand lines of application. The number that means something is the
last row: **the island costs 1.3 kB.** RSC does not
remove JavaScript; it removes *your* JavaScript. The framework floor is there
either way; a hundred more Server Components add nothing to it, a hundred
more Client Components add all of them. The Vite app has no floor and no
ceiling — every component you write ships.

**Metadata, on both sides.** `PageMeta` (§8) runs after the crawler has read
an empty document; the App Router's `generateMetadata` runs on the server with
the product in hand — the half of the SEO problem §8 could not close.

📖 [nextjs.org — Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)

**→ In the demos:** Demo 21, Block 5 — the whole of `next-mini/`, built,
`curl`ed and measured.

---

## 20. Self-check

1. Define an Action in one sentence. Name the three things React does for one
   and the one it does not.
2. What are the three values `useActionState` returns, and which goes on
   `<form action>`? Why is `(previousState, formData) → state` a reducer, and
   what does that suggest about typing the state?
3. Why are expected errors *returned* from an Action, not thrown? Why is
   `useFormStatus` in `react-dom`, and why is it `pending: false` beside the
   `<form>`?
4. "There is no rollback." Explain `useOptimistic` as an override that
   expires. When is the snap-back visible, and why may `setOptimistic…` only
   be called inside an Action?
5. Give the four-row table contrasting `await` and `use(promise)`. Why does
   `use(fetchReviews(id))` inside a component never settle?
6. Why does a SPA with `<Suspense>` still need a loader or a cache? Describe
   the two-line waterfall and the rule that prevents it.
7. Where does a `<Suspense>` boundary go, what goes wrong one level too high,
   and what handles a rejected promise?
8. Three rules for `<title>` / `<meta>` hoisting, and the half of the SEO
   problem it does not solve.
9. What does a ref callback returning a function change? What replaces
   `forwardRef`, and why does removing `defaultProps` bite hardest?
10. Four things a Server Component can do that a Client Component cannot, and
    four it cannot do. What is the RSC payload?
11. "`'use client'` is a boundary, not a file switch." What exactly joins the
    client bundle when you add it, and where should it go?
12. Why can a Client Component not import a Server Component, yet render one
    as `children`? Five things that serialise across the boundary and four
    that do not.
13. The three numbered steps every Server Function must contain, and why "it
    is only called from one button" is not a check.
14. Which three mechanisms in this course answer "the server has new data; who
    tells the UI?" — one per layer.
15. Name the four cache layers and what invalidates each. What is the first
    debugging question in an RSC app?
16. Which of Module 13's fetching problems disappear in a Server Component,
    and which merely move?
17. Four conditions under which RSC pays and four under which it does not.
    State the ShopScope verdict and the narrower version worth doing.
18. Read the bundle table: which number means something, and what does "RSC
    removes *your* JavaScript" mean?

### Practical

1. Convert a client-fetched product page into a Server Component; measure the
   bundle before and after, and list every import that left.
2. Push a `'use client'` boundary from a page down to a single button and
   observe, at each step, what leaves the bundle and what breaks.
3. Implement add-to-cart as a Server Function with `useOptimistic`; make the
   server fail every fifth call and watch the count revert with no rollback
   code.
4. Rewrite a react-hook-form modal on `<form action>` + `useActionState`,
   keeping field-level errors and the user's typed values; type the state as a
   discriminated union.
5. Return an unawaited promise from a react-router 8.3 loader, read it with
   `use` in a `<Suspense>`; then swap two lines and time the waterfall.
6. In the Next.js mini-project, remove `revalidatePath` from the Server
   Function and explain, layer by layer, why the count stops moving.

---

## 21. References

Official React and Next.js documentation only.

**React 19 — start here**
- [React 19](https://react.dev/blog/2024/12/05/react-19) — the release post: Actions, `use`, metadata, `ref` as a prop, Server Components
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) — removed APIs and codemods

**Actions, forms, Suspense**
- [`useActionState`](https://react.dev/reference/react/useActionState) · [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) · [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`<form>`](https://react.dev/reference/react-dom/components/form)
- [`useTransition`](https://react.dev/reference/react/useTransition) · [`startTransition`](https://react.dev/reference/react/startTransition)
- [`use`](https://react.dev/reference/react/use) · [`Suspense`](https://react.dev/reference/react/Suspense) · [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)

**Metadata, resources, refs**
- [`<title>`](https://react.dev/reference/react-dom/components/title) · [`<meta>`](https://react.dev/reference/react-dom/components/meta) · [`<link>`](https://react.dev/reference/react-dom/components/link)
- [`preload`](https://react.dev/reference/react-dom/preload) · [`preinit`](https://react.dev/reference/react-dom/preinit)
- [`forwardRef`](https://react.dev/reference/react/forwardRef) · [`createContext`](https://react.dev/reference/react/createContext)

- [React Compiler](https://react.dev/learn/react-compiler) · [Rules of React](https://react.dev/reference/rules)

**Server Components and the boundary**
- [Server Components](https://react.dev/reference/rsc/server-components)
- [Server Functions](https://react.dev/reference/rsc/server-functions) · [`'use client'`](https://react.dev/reference/rsc/use-client) · [`'use server'`](https://react.dev/reference/rsc/use-server)
- [`cache`](https://react.dev/reference/react/cache) · [Creating a React App](https://react.dev/learn/creating-a-react-app) — which frameworks support RSC

**Next.js App Router (current)**
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Fetching data](https://nextjs.org/docs/app/getting-started/fetching-data) · [Updating data](https://nextjs.org/docs/app/getting-started/updating-data)
- [Caching and revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading) · [`error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) · [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

---

**Previous:** [Module 18 — Testing React Applications](../18-testing/)
**Next:** [Module 20 — Shipping to Production](../20-production/)
