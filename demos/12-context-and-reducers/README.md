# Demo 12 — Context & Reducers

**Demo guide** · ~110 minutes · state whose shape cannot lie, and state any component can reach — without a library

---

## Where you are starting from

The starter is **Demo 11, finished**: login, a refresh queue, protected
routes, roles. The wishlist lives in `RootLayout` as `useState` and reaches
the grid through Outlet context; the cart badge is a hardcoded `3`; and three
different pages show a "done!" message three different ways.

New stubs: `src/reducers/requestStatus.ts`, `src/lib/cartMath.ts`,
`src/context/ThemeContext.tsx`, `src/context/ToastContext.tsx`,
`src/context/WishlistContext.tsx`. New dependency: **none** — `zustand` is in
`package.json` for Demo 13, installed and not yet imported.

## What you ship today

A **request status that cannot contradict itself**: the profile page's
`{ busy, result, error }` becomes one `useReducer` value with four legal
shapes, driven by a pure reducer — and the cart's quantity rules written the
same way, ready for Demo 13's store. A **`ThemeContext`** with a provider
above the router, a `useTheme()` hook that throws when misused, and a
light/dark toggle in the header. A **`ToastProvider`** — a reducer plus *two*
contexts — that every action and fetcher reports through, replacing three
per-page success messages. And the **wishlist moved into a
`WishlistProvider`**, so the detail page can finally save a product — with
DevTools open, so the re-render bill is on screen when Demo 13 swaps it for
a store.

By the end you will be able to answer, without hesitating:

- When `useReducer` beats `useState`, and what "a reducer is a state machine" means in code
- Why a reducer must be pure, and where the impure parts — ids, requests — go instead
- What a discriminated union buys you over three booleans, and how TypeScript enforces an exhaustive `switch`
- What `createContext`'s default value is *for*, why `undefined` is the right one here, and why the hook throws
- React's `createContext` vs React Router's Outlet context vs the router's middleware context — same word, three mechanisms
- Why a reducer-plus-context provider splits into two contexts, and what the split saves
- What re-renders when a context value changes, what `useMemo` on the value fixes, what it doesn't — and why that is Demo 13's opening argument

> **Three things called "context" in this app.** Demo 9's `<Outlet context>` is
> React Router's, scoped to a layout. Demo 11's `userContext` is the router's
> *middleware* context, read with `context.get()` in loaders. Today's is
> React's own `createContext`, read with `useContext()` in components. Lab 2
> puts them side by side.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/12-context-and-reducers/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/12-context-and-reducers/starter && npm install && npm run dev`.

Install React DevTools and open **Components → ⚙ → Highlight updates when
components render** — Labs 3 and 4 use it to *show* what a context change
costs. Sign in as `emilys` / `emilyspass`; Labs 1 and 3 need an admin.

---

## The cold open

Sign in as `emilys`. **Add product**, fill it in, save. A green alert above
the list: *created (server id 195)* — and `?flash=…` in the URL, because the
action redirected with the message in the query string (Demo 10). Delete a
product: a *second* green alert, elsewhere, from `fetcher.data`. Sign out,
**Sign up**, submit a valid form: a *third*, inside the modal, from a
`useState` called `welcome`.

Three "done!" messages, three places, three mechanisms — a URL parameter, a
fetcher's result, a local state — and none reusable from a fourth page
without copying the code.

Now open `src/routes/account/ProfilePage.tsx` and read `Check`:

```ts
interface Check {
  busy: boolean;
  result: string | null;
  error: ApiError | null;
}
```

Two values each: eight combinations. `busy: true` with a `result`? `result`
*and* `error`? Four of the eight mean nothing, and every `setCheck` has to
remember to null out the fields it isn't setting. (The obvious suspect,
`ProductForm`, is *not* guilty: its `submitting` comes from `useNavigation()`
— the router has owned that state since Demo 10. The three-flag pattern
survived in exactly one place. That's where we start.)

---

## Lab 1 — From three flags to one reducer (25 min)

### Problem

`ProfilePage` tracks one request with three independent fields, and every
transition is a hand-written object literal that must keep them consistent.
Meanwhile the cart Demo 13 will build has *rules* — adding an existing product
merges, a quantity of zero removes — with nowhere to live but the buttons.

### Concept

**A reducer is a function: `(state, action) => newState`.** Instead of
`setCheck({ busy: true, result: null, error: null })`, a component *describes
what happened* — `dispatch({ type: 'start' })` — and one function decides the
next state. Actions name **events**, not fields: `'succeed'` is an event,
`setResult` is a field, and when a transition touches three fields at once
an event lets the reducer own the consistency instead of every call site.

**Reducers must be pure.** Same state and same action → same result. No
mutation, no `fetch`, no `Date.now()`, no "next id". React calls reducers
*twice* in development under `StrictMode` to catch impurity — a reducer that
fires a request fires it twice — and a pure function is testable with
`expect(reducer(s, a)).toEqual(…)`, no renderer. The impure parts (the
request, the id) happen *before* `dispatch`, in the handler.

**A reducer is a state machine.** The `state` argument isn't decoration. A
`'succeed'` that arrives when the status is `'idle'` — the user reset while a
response was in flight — is a transition the machine doesn't define, so the
reducer returns the state unchanged. Three booleans cannot say "ignore this".

**Discriminated-union state makes impossible states unrepresentable.**

| Approach | Legal states | Representable states | `data` reachable when |
|---|---|---|---|
| `{ busy, result, error }` | 4 | 8 | always — it's just `null` sometimes |
| `{ status: 'idle' } \| { status: 'pending' } \| { status: 'success'; data } \| { status: 'error'; error }` | 4 | **4** | `status === 'success'`, and TypeScript refuses otherwise |

**`useState` vs `useReducer`.**

| Reach for `useState` when… | Reach for `useReducer` when… |
|---|---|
| one value, set from one or two places | several values that change *together* |
| the next value doesn't depend on the previous | transitions depend on the current state (a machine) |
| no rules — just store what the user typed | there are rules, and you want them in one testable place |
| the grid density, the search draft | a request's status, a multi-step form, a cart |

**And TypeScript says: exhaustive `switch`, and an instantiation expression.**
In a `switch` on `action.type`, TypeScript narrows `action` per `case`; once
every case is handled, `action` in `default` is `never`, so `const unhandled:
never = action` compiles *only* while the switch is exhaustive. And
`requestStatusReducer<string>` — a generic function with its type argument
filled in, used as a *value* — is an instantiation expression: how you hand a
generic reducer to `useReducer` with `T` pinned.

### Steps

**A. `src/reducers/requestStatus.ts` — `TODO(lab-1.1)`**

Replace the file:

```ts
import type { ApiError } from '../lib/ApiError';

/**
 * One request's status as a STATE MACHINE. A discriminated union: `status` decides which
 * other fields exist, so `data` is only reachable on success. Four states, not eight.
 */
export type RequestStatus<T> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

/** Everything that can HAPPEN to a request. An action names an event, not a field to set. */
export type RequestAction<T> =
  | { type: 'start' }
  | { type: 'succeed'; data: T }
  | { type: 'fail'; error: ApiError }
  | { type: 'reset' };

/**
 * PURE: same state + same action → same result; no side effects, no mutation; exhaustive.
 * A state machine, not a setter: a result that arrives when the request is no longer
 * pending (the user pressed reset) is ignored — that transition isn't defined.
 */
export function requestStatusReducer<T>(state: RequestStatus<T>, action: RequestAction<T>): RequestStatus<T> {
  switch (action.type) {
    case 'start':
      return { status: 'pending' };
    case 'succeed':
      return state.status === 'pending' ? { status: 'success', data: action.data } : state;
    case 'fail':
      return state.status === 'pending' ? { status: 'error', error: action.error } : state;
    case 'reset':
      return { status: 'idle' };
    default: {
      // Every action type is handled above, so here `action` has type `never`.
      // Add a new type to RequestAction without a case and THIS line is the compile error.
      const unhandled: never = action;
      throw new Error(`Unhandled request action: ${JSON.stringify(unhandled)}`);
    }
  }
}
```

The line that matters is `state.status === 'pending' ? … : state`: the
reducer consults where it *is* before deciding where it *goes*, and returning
`state` itself — the same reference — tells React "nothing changed".

**B. `src/routes/account/ProfilePage.tsx` — `TODO(lab-1.2)`**

Delete the `Check` interface and the `useState`; `useReducer` replaces both:

```tsx
import { useReducer } from 'react';                     // useState goes
// …
import { requestStatusReducer } from '../../reducers/requestStatus';
// …
export function ProfilePage() {
  const { user } = useLoaderData<typeof profileLoader>();

  // One value with four possible shapes, instead of { busy, result, error } with
  // eight combinations. `requestStatusReducer<string>` is an instantiation
  // expression: the generic reducer, pinned to T = string, passed as a value.
  const [check, dispatch] = useReducer(requestStatusReducer<string>, { status: 'idle' });

  async function whoAmI() {
    dispatch({ type: 'start' });
    try {
      const me = await getMe();
      dispatch({ type: 'succeed', data: `/auth/me → ${me.email} (${me.role})` });
    } catch (error) {
      dispatch({ type: 'fail', error: ApiError.from(error) });
    }
  }
  // …the button: disabled and spinning when check.status === 'pending'…

        {/* Narrowing: inside this branch TypeScript knows `check.data` exists — and nowhere else. */}
        {check.status === 'success' && (
          <Alert variant="info" className="mt-3 mb-0 font-monospace small">
            {check.data}
          </Alert>
        )}
        {check.status === 'error' && (
          <div className="mt-3">
            <ErrorNotice error={check.error} onRetry={whoAmI} />
          </div>
        )}
```

The request stays in the handler — the impure part — and the reducer only
sees its *outcome*. `ErrorNotice` gains a Retry for free: `error.isRetryable`
was always there.

**C. `src/types.ts` and `src/lib/cartMath.ts` — `TODO(lab-1.3)`**

The same idea with no React at all. First the type, in `types.ts` under the
`client state` divider:

```ts
/** One line in the shopping cart — a SNAPSHOT of the product, so the cart survives catalogue changes. */
export interface CartLine {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  qty: number;
}
```

Then the reducer:

```ts
import type { CartLine, Product } from '../types';

/** `add` reads exactly these four fields of a product — a full Product qualifies, and so does a smaller object. */
export type CartLineProduct = Pick<Product, 'id' | 'title' | 'price' | 'thumbnail'>;

/** Everything that can happen to the cart's lines. The rules live in the reducer, not in the buttons. */
export type CartAction =
  | { type: 'add'; product: CartLineProduct; qty?: number }
  | { type: 'setQty'; productId: number; qty: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' };

/**
 * The cart's rules as a PURE function over CartLine[] — no React, no store. A reducer is just
 * (state, action) => newState; useReducer is one home for it, Demo 13's Zustand store is another.
 */
export function cartLinesReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const { product, qty = 1 } = action;
      const existing = lines.find((line) => line.productId === product.id);
      if (existing) {
        return lines.map((line) => (line.productId === product.id ? { ...line, qty: line.qty + qty } : line));
      }
      // A SNAPSHOT of the product, not a reference: the cart must not break if the catalogue changes.
      return [...lines, { productId: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, qty }];
    }
    case 'setQty':
      // The RULE "zero means remove" lives here, once — not in every button that changes a quantity.
      return action.qty <= 0
        ? lines.filter((line) => line.productId !== action.productId)
        : lines.map((line) => (line.productId === action.productId ? { ...line, qty: action.qty } : line));
    case 'remove':
      return lines.filter((line) => line.productId !== action.productId);
    case 'clear':
      return [];
    default: {
      const unhandled: never = action; // exhaustive: a new action type without a case fails to compile here
      throw new Error(`Unhandled cart action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// --- Derived values are FUNCTIONS of the lines. Store them too and you have two sources of truth. ---

export const lineCount = (lines: CartLine[]) => lines.reduce((n, line) => n + line.qty, 0);
export const subtotal = (lines: CartLine[]) => lines.reduce((n, line) => n + line.qty * line.price, 0);
```

Nothing imports this yet — there is no cart UI; that's Demo 13. The *rules*
exist before the *store*, provable from the console (Verify, step 4). Next
demo the store's `add` is one line: `cartLinesReducer(state.lines, { type: 'add', product, qty })`.

### Verify

1. **Account → Who am I?** Spinner, then the monospace result. Network →
   **Offline**, click again: `ErrorNotice` with a **Retry** button. Back
   online, Retry: the result returns. At no point *could* the page show a
   spinner and a result.
2. **The exhaustive switch.** Add `| { type: 'cancel' }` to `RequestAction`.
   `npm run typecheck`: *Type '{ type: "cancel"; }' is not assignable to type
   'never'* — on the `unhandled` line. Remove it.
3. **The narrowing.** Move `{check.data}` outside its `'success'` branch:
   *Property 'data' does not exist on type 'RequestStatus<string>'*. Put it
   back. Three booleans let you render `check.result` anywhere — as `null`.
4. **A reducer with no React.** In the console:
   ```ts
   const { cartLinesReducer, lineCount, subtotal } = await import('/src/lib/cartMath.ts');
   let lines = cartLinesReducer([], { type: 'add', product: { id: 1, title: 'Phone', price: 10, thumbnail: '' } });
   lines = cartLinesReducer(lines, { type: 'add', product: { id: 1, title: 'Phone', price: 10, thumbnail: '' }, qty: 2 });
   lineCount(lines);                                             // 3 — merged into one line
   lines = cartLinesReducer(lines, { type: 'setQty', productId: 1, qty: 0 });
   lines.length;                                                 // 0 — zero removed it
   ```
   That is the cart's test suite; Demo 20 writes it in Vitest, no renderer.

### Watch out

**Mutating in the reducer.** `state.data = …; return state;` returns the same
reference; React sees no change and skips the render. Return a new object.

**Side effects in the reducer.** A `fetch` inside `case 'start'` runs twice
under `StrictMode` and is untestable. The request belongs in the handler.

### In the real world

This is the shape every data library exposes — TanStack Query's
`status: 'pending' | 'error' | 'success'` (Demo 19) is `RequestStatus<T>`
with caching bolted on. Redux Toolkit's `createSlice` is reducers with the
boilerplate generated; XState is reducers with the transitions drawn. And a
checkout that is `'cart' | 'address' | 'payment' | 'done'` cannot show the
payment form with an empty address.

---

## Lab 2 — React Context, properly (25 min)

### Problem

A theme has to be readable by the header (inside the router, inside
`RootLayout`) and by any page, and *writable* from the header. Props from
`main.tsx` can't get there — `RouterProvider` is in the way. Outlet context is
React Router's and stops at the layout's pages. This is what React's own
Context is for: a value any component under a provider can read *without
being handed it*.

### Concept

**Context is a way to read a value without passing it as a prop.**
`createContext(default)` makes a context object; `<Ctx value={…}>` *provides*
a value to everything beneath; `useContext(Ctx)` in any descendant *reads*
the nearest provider's. Context is not a state manager — it holds whatever
you put in `value`; the *state* is still `useState` or `useReducer`, in the
provider component.

**The default value is for "no provider above me".** A theme has no sensible
default: a component outside the provider that quietly showed `'light'` with
a dead toggle is a bug you'd find in production. So the default is
`undefined`, and the hook throws — you'll see that error once in Verify.

**Provider placement decides two things.** Who can read it — everything
beneath, so it goes *above* the router, because the header and every page
are inside it. And how often its value is recreated — a provider inside
`RootLayout` re-renders on every navigation; one in `main.tsx` only when its
own state changes. React skips a provider's `children` when it's the same
element as last time, so a provider re-render reaches *consumers*, not the
whole tree.

**A custom hook is the module's public API.** Components import `useTheme()`,
never `ThemeContext`; the hook owns the `useContext` and the `undefined` check.

**Three "contexts", three mechanisms.**

| Name | Import | Written by | Read by | Scope |
|---|---|---|---|---|
| React Context (today) | `createContext` from `'react'` | a provider component's `value` | `useContext` in *components* | everything under the provider |
| Outlet context (Demo 9) | `<Outlet context>` from `'react-router'` | a layout route | `useOutletContext()` in that layout's *pages* | one layout's children |
| Middleware context (Demo 11) | `createContext` from `'react-router'` | middleware, `context.set(…)` | `context.get(…)` in *loaders and actions* | one request |

The middleware one is the trap: `createContext` from `'react-router'`
autocompletes next to `createContext` from `'react'`. One is read with a hook
in components, the other with `.get()` in loaders; they never meet.

**And TypeScript says: `createContext<ThemeContextValue | undefined>(undefined)`.**
The generic is the type of what consumers get. Because `undefined` is in the
union, `useContext` returns `ThemeContextValue | undefined` — and the hook's
`if (context === undefined) throw` narrows it, so every *caller* gets a plain
`ThemeContextValue`. The check is for the type system as much as for you.

**React 19: the context object is its own provider.** `<ThemeContext value={…}>`
replaces `<ThemeContext.Provider value={…}>`; the old form still works.

### Steps

**A. `src/context/ThemeContext.tsx` — `TODO(lab-2.1)`**

Replace the file:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * `undefined` on purpose: a "sensible" default would make a component rendered OUTSIDE the
 * provider look like it works while its toggle does nothing. useTheme() turns it into an error.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Owns the theme. Bootstrap 5.3 recolours everything from ONE attribute, <html data-bs-theme>,
 * so React owns the state and the DOM attribute is a side effect of it. (Persistence, the OS
 * preference and "no flash on load" are Demo 16's job.)
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'light' ? 'dark' : 'light')), []);

  // The value is an OBJECT. Without useMemo it would be a new object on every provider render,
  // and every consumer would re-render even when nothing in it changed.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  // React 19: the context object is its own provider — no <ThemeContext.Provider> needed.
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The module's public API: components call useTheme(), never useContext(ThemeContext). */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme() must be called inside <ThemeProvider>. Is it wrapping <RouterProvider> in main.tsx?');
  }
  return context;
}
```

`ThemeContext` is not exported — that one decision makes `useTheme()` the API.

**B. `src/main.tsx` — `TODO(lab-2.2)`**

```tsx
import { ThemeProvider } from './context/ThemeContext';
// …
// Providers sit OUTSIDE the router: the header and every page live inside it, and unlike
// RootLayout nothing here re-renders on navigation. Their `children` is the same
// <RouterProvider> element every time, so React skips it — only consumers re-render.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
```

**C. `src/components/SiteHeader.tsx` — `TODO(lab-2.3)`**

A toggle next to the cart button:

```tsx
import { BoxArrowInRight, Cart3, Heart, MoonStars, PersonPlus, Shop, Sun } from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext';
// …
  const { theme, toggleTheme } = useTheme();
// …after the cart button:
            <Button
              variant="outline-light"
              size="sm"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={theme === 'dark'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun /> : <MoonStars />}
            </Button>
```

The header knows nothing about `document.documentElement`: it reads a value
and calls a function.

### Verify

1. Click the moon. The whole app recolours; **Elements** shows
   `<html data-bs-theme="dark">`. The navbar stays dark — it sets its own
   attribute, and Bootstrap resolves the nearest one.
2. Navigate anywhere: still dark, the state lives above the router. Reload:
   light again — intended; persistence and the OS preference are Demo 16.
3. **The throw.** In `main.tsx` temporarily delete the `<ThemeProvider>` pair.
   `RootErrorBoundary` shows *useTheme() must be called inside <ThemeProvider>.
   Is it wrapping <RouterProvider> in main.tsx?* A default of `{ theme:
   'light', toggleTheme: () => {} }` would have given you no error and a
   dead button. Put the provider back.
4. **Highlight updates** on, click the toggle. `SiteHeader` flashes (and its
   `SignupForm`). `RootLayout`, the grid, the pages do **not** — they don't
   consume the context, and the provider's `children` is the same
   `<RouterProvider>` element it rendered last time.

### Watch out

**A "helpful" default value.** `createContext({ theme: 'light', toggleTheme:
() => {} })` compiles, runs, and hides a missing provider until a user reports
a dead button. `undefined` + a throwing hook makes it a stack trace instead.

**`import { createContext } from 'react-router'`.** Autocomplete's choice, not
yours: it makes a middleware context — no `value` prop, no `useContext`. If
`<ThemeContext value>` says *Property 'value' does not exist*, check the import.

### In the real world

Theme, locale, the signed-in user, feature flags, a dependency to swap in
tests — low-frequency, app-wide values with one writer are what Context is
*for*. Libraries you already use are built on it: react-hook-form's
`useFormContext()`, React Router's `useNavigate()`, React Bootstrap's
`Accordion`. The `undefined`-default-plus-throwing-hook shape is the
convention you'll recognise in every codebase.

---

## Lab 3 — Reducer + Context: one toast system (30 min)

### Problem

Three success messages, three implementations, and the next page that needs
one will copy whichever it finds first. A notification belongs to the *app*,
not to the page that caused it — it should survive the modal closing and the
redirect completing, and every page should report the same way.

### Concept

**The standard pattern: a reducer in the provider, `dispatch` through
context.** `useReducer` owns the list; the provider puts the list in one
context and `dispatch` in another; components call `useToastDispatch()` and
describe what happened. Lab 1's reducer, Lab 2's context, one file.

**Two contexts, not one — the state/dispatch split.** A context change
re-renders *every* consumer. The toast list changes on every push and every
auto-dismiss; `dispatch` is the same function for the provider's entire life
(`useReducer` guarantees it). Put both in one `{ toasts, dispatch }` object
and every component that merely *reports* re-renders each time a toast
appears or disappears anywhere. Split them, and reporters subscribe to a
value that never changes.

**Action creators keep the impure part outside the reducer.** "The next id"
is not pure, so `pushToast(message, variant)` makes the id and returns the
action; the reducer just appends — and callers never hand-write the literal.

**A router action cannot reach Context.** `productsAction` is a plain
function: no hooks, no `useToastDispatch()`. So the *component that observes
the result* reports it — `?flash=` after a redirect and `fetcher.data` after
a delete both arrive in `ProductsPage`, and an effect dispatches when they
do. `SignupForm` is simpler: success is an event handler, and a handler
dispatches directly. Hold onto this limitation: Demo 13 Lab 4 shows a *store*
being written from a router action with no component in sight.

**Every message this lab replaces, and the three it keeps.**

| Message | Was | Becomes |
|---|---|---|
| *created / updated (server id …)* on the list | `?flash=` → `<Alert>` in `ProductsPage` | toast, from an effect on `flash` |
| *deleted* / delete error on the list | `fetcher.data` → two `<Alert>`s | toast, from an effect on `fetcher.state` |
| *your account is ready* in the sign-up modal | `welcome` state → `<Alert>` in the modal | toast, from `onValid`; the modal closes |
| *Your session expired* / *Sign in to continue* on the login page | `<Alert>`s from loader data | **kept** — they describe the page, not an event |
| *Who am I?* result on the profile page | Lab 1's `success` branch | **kept** — it's the answer to a question, not a notification |
| field errors in `ProductForm` and `LoginPage` | inline | **kept** — an error belongs next to its field |

### Steps

**A. `src/context/ToastContext.tsx` — `TODO(lab-3.1)`**

Replace the file:

```tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export type ToastVariant = 'success' | 'danger' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

export type ToastAction = { type: 'push'; toast: ToastItem } | { type: 'dismiss'; id: number };

/** Never more than this many on screen: the oldest drops off. A rule, so it lives in the reducer. */
const MAX_VISIBLE = 4;

/** PURE. Given the same list and the same action it returns the same list — which is why it's trivially testable. */
export function toastsReducer(toasts: ToastItem[], action: ToastAction): ToastItem[] {
  switch (action.type) {
    case 'push':
      return [...toasts, action.toast].slice(-MAX_VISIBLE);
    case 'dismiss':
      return toasts.filter((toast) => toast.id !== action.id);
    default: {
      const unhandled: never = action;
      throw new Error(`Unhandled toast action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// "The next id" is not pure — it changes every call. So it happens HERE, before dispatch, never inside the reducer.
let nextId = 1;

/** An action creator: the one place that knows what a "push" action looks like. */
export function pushToast(message: string, variant: ToastVariant = 'success'): ToastAction {
  return { type: 'push', toast: { id: nextId++, variant, message } };
}

// TWO contexts, not one. The list changes on every push and dismiss; `dispatch` never changes.
// A component that only REPORTS subscribes to dispatch alone and never re-renders for a toast.
const ToastStateContext = createContext<ToastItem[] | undefined>(undefined);
const ToastDispatchContext = createContext<Dispatch<ToastAction> | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  // useReducer returns the state and a dispatch whose identity is STABLE for the component's life — no useCallback needed.
  const [toasts, dispatch] = useReducer(toastsReducer, []);

  return (
    <ToastStateContext value={toasts}>
      <ToastDispatchContext value={dispatch}>
        {children}
        <ToastViewport />
      </ToastDispatchContext>
    </ToastStateContext>
  );
}

const TITLES: Record<ToastVariant, string> = { success: 'Done', danger: 'Something went wrong', info: 'Heads up' };

/** The only component that reads the LIST. It is rendered once, by the provider, above every route. */
function ToastViewport() {
  const toasts = useToasts();
  const dispatch = useToastDispatch();

  return (
    <ToastContainer position="bottom-end" className="p-3" containerPosition="fixed" style={{ zIndex: 1080 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          bg={toast.variant}
          autohide
          delay={toast.variant === 'danger' ? 8000 : 5000}
          onClose={() => dispatch({ type: 'dismiss', id: toast.id })}
        >
          <Toast.Header>
            <strong className="me-auto">{TITLES[toast.variant]}</strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'info' ? '' : 'text-white'}>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}

export function useToasts(): ToastItem[] {
  const toasts = useContext(ToastStateContext);
  if (toasts === undefined) throw new Error('useToasts() must be called inside <ToastProvider>.');
  return toasts;
}

export function useToastDispatch(): Dispatch<ToastAction> {
  const dispatch = useContext(ToastDispatchContext);
  if (dispatch === undefined) throw new Error('useToastDispatch() must be called inside <ToastProvider>.');
  return dispatch;
}
```

`Dispatch<ToastAction>` is React's type for what `useReducer` hands back.
Exporting *that* — not a `setToasts` — means consumers can only describe events.

**B. `src/main.tsx` — `TODO(lab-3.2)`**

```tsx
import { ToastProvider } from './context/ToastContext';
// …
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
```

Nesting order only matters when one provider calls another's hook; neither
does, so either order works.

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-3.3)`**

Delete the three `<Alert>` blocks above `<ProductToolbar>` (and `Alert` from
the react-bootstrap import), then report from effects:

```tsx
import { useEffect, useRef, useState } from 'react';
// …
import { pushToast, useToastDispatch } from '../context/ToastContext';
// …
  const notify = useToastDispatch();
// …
  const flash = searchParams.get('flash');

  // A router action is a plain function: no hooks, so no Context. The URL carries its message across
  // the redirect (Demo 10), and the component that SEES it is the one that reports it — toast once,
  // then drop the param. The ref keeps "once" true under StrictMode, which runs effects twice in dev.
  const lastFlash = useRef<string | null>(null);
  useEffect(() => {
    if (!flash) {
      lastFlash.current = null;
      return;
    }
    if (flash === lastFlash.current) return;
    lastFlash.current = flash;
    notify(pushToast(`${flash} DummyJSON simulates writes — the list was re-fetched and does not include it.`));
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('flash');
        return next;
      },
      { replace: true },
    );
  }, [flash, notify, setSearchParams]);
// …
  const deleteData = fetcher.data && 'ok' in fetcher.data ? fetcher.data : undefined;

  // A fetcher's result arrives as DATA, not a redirect — same rule: report it when it settles.
  useEffect(() => {
    if (fetcher.state !== 'idle' || !deleteData) return;
    notify(
      deleteData.ok
        ? pushToast(`“${deleteData.deleted}” deleted — the server confirmed it, then the list re-fetched (and, DummyJSON being simulated, it came back).`)
        : pushToast(deleteData.error ?? 'Delete failed.', 'danger'),
    );
  }, [fetcher.state, deleteData, notify]);
```

`notify` sits in both dependency arrays and never causes a re-run: it is
`useReducer`'s `dispatch`, stable by contract — which is *why* the split
context is safe in an effect's dependencies.

**D. `src/components/SignupForm.tsx` — `TODO(lab-3.4)`**

Delete `welcome`, its `useState`, its `<Alert>`, and `Alert` from the import:

```tsx
import { pushToast, useToastDispatch } from '../context/ToastContext';
// …
export function SignupForm({ show, onClose }: SignupFormProps) {
  // Dispatch only. This component never reads the toast list, so it never re-renders for one.
  const notify = useToastDispatch();
  // …
  async function onValid(values: SignupValues) {
    // …the fake request and the @taken.com branch, unchanged…

    // An event handler can dispatch directly — no effect, no local `welcome` state, and the message
    // outlives the modal, which can now simply close.
    notify(pushToast(`${values.firstName}, your account is ready. Following: ${values.interests.join(', ')}.`));
    reset();
    onClose();
  }
```

`handleClose` loses its `setWelcome(null)` line and keeps the rest.

### Verify

1. As `emilys`: **Add product**, save. A green toast bottom-right; the URL
   loses `?flash=` at once. Delete a product: a second toast, same viewport,
   same style.
2. Sign out, **Sign up**, submit a valid form. The modal closes and the toast
   says *Emily, your account is ready…* — the message outlived its component.
3. Delete five products quickly. Never more than four toasts: the reducer's
   rule, not the viewport's.
4. **Highlight updates** on. Wait for a toast to auto-dismiss: only
   `ToastViewport` flashes. `ProductsPage`, `SiteHeader`, the grid do **not**
   — they hold `dispatch`, which didn't change.
5. **Break the split.** In `ProductsPage`, add `useToasts();` under
   `useToastDispatch()`. Delete a product and watch the dismiss: the whole
   page flashes. Remove the line. That is the entire argument for two contexts.

### Watch out

**Generating the id in the reducer.** `id: nextId++` inside `case 'push'`
runs twice under `StrictMode` and makes the reducer untestable. Ids belong in `pushToast`.

**Dispatching in render.** `if (flash) notify(pushToast(flash))` at the top of
the component fires every render: *Cannot update a component while rendering a
different component*. Effects and handlers only.

**An effect without the `lastFlash` guard.** Reload a URL that still has
`?flash=` and you get two toasts — `StrictMode` runs mount effects twice in
development. The ref makes it idempotent, and resets when `flash` clears so
the *same* message a second time still shows.

### In the real world

This is the recipe in React's own docs — "Scaling up with reducer and
context" — for any cross-cutting list: notifications, a command palette, an
undo stack. Notice, though, what `sonner` and `react-hot-toast` actually do: a
module-level *store* with a `toast()` function callable from anywhere —
including a router action — plus one subscribing component. That is not
Context. Demo 13 explains why.

---

## Lab 4 — The wishlist in Context — and the bill (30 min)

### Problem

The wishlist lives in `RootLayout` because that is the nearest common
ancestor of the header and the grid — a fact about the component tree, not
about the wishlist. The detail page *could* read it through Outlet context
but nobody wired it; the header gets its count as a prop; move the header and
the state has to move too. You have the tool to fix all of that now — and
DevTools, to see what the fix costs.

### Concept

**Ownership by position vs ownership by provider.** With Outlet context,
whichever component is the common ancestor owns the state. With a provider
above the router the *module* owns it; header, grid, detail page all call `useWishlist()`.

**`useMemo` on the value; `useCallback` on the functions.** A `value` object
literal is a *new object every render*. If the provider re-rendered for any
reason other than its own state, every consumer would re-render for a value
that is `===`-different but identical inside. `useMemo` over `[ids, toggle,
isSaved]` makes it stable; `useCallback` makes `toggle` stable so the memo
has a chance. Above the router this is insurance; inside `RootLayout` it is
the difference between a quiet app and one that re-renders every consumer on
every navigation (the Challenge shows you).

**What re-renders when a context value changes.** Every component that
called `useContext` for it — plus, by React's ordinary rules, everything
*those* components render. Not the provider's `children`: that is the same
`<RouterProvider>` element, so React skips straight to the consumers.

**What Context cannot do: subscribe to part of a value.** A consumer gets the
whole `value` and re-renders when *any* of it changes — no "only when
`ids.length` changes", no "only product 42". The one lever is *splitting*
contexts, as Lab 3 did; it works for two or three, not for one per product.

**What Context is not for.** High-frequency updates, state with many writers
and readers wanting *different* slices, and anything read or written from
outside React — a router action, an interceptor, a test with no renderer.
Each is what Demo 13's store is for; the last is why Lab 3 needed effects.

### Steps

**A. `src/context/WishlistContext.tsx` — `TODO(lab-4.1)`**

Replace the file:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface WishlistContextValue {
  ids: number[];
  toggle: (id: number) => void;
  isSaved: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * The wishlist lived in RootLayout because that was the header's and the grid's nearest common
 * ancestor — a fact about the tree, not the wishlist. Here ANY component reads it with useWishlist().
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);

  // Stable identity: the same function object on every render, so the memoised value below only
  // changes when `ids` does. Without useCallback, `toggle` would be new every render and useMemo pointless.
  const toggle = useCallback((id: number) => {
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }, []);

  const isSaved = useCallback((id: number) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, toggle, isSaved }), [ids, toggle, isSaved]);

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist() must be called inside <WishlistProvider>.');
  return context;
}
```

`useState`, not `useReducer`: one array, one rule. Lab 1's table says so —
a cart with four rules is the other column, which is why `cartLinesReducer` exists.

**B. Provide it, and delete the old owner — `TODO(lab-4.2)` in `src/main.tsx` and `src/routes/RootLayout.tsx`**

```tsx
import { WishlistProvider } from './context/WishlistContext';
// …
    <ThemeProvider>
      <ToastProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </ToastProvider>
    </ThemeProvider>
```

In `RootLayout`, delete the wishlist entirely — the `useState`,
`toggleWishlist`, `RootOutletContext`, `outletContext`, the `context` prop on
`<Outlet>` — and the header loses one of its two count props:

```tsx
import { useEffect } from 'react';                       // useState goes
// …
  // The wishlist used to live HERE and travel down through Outlet context. It is
  // in WishlistProvider (main.tsx) now: the header and the pages read it themselves.
  return (
    <>
      <SiteHeader cartCount={3} user={user} onSignOut={handleSignOut} />
      // …
          <Outlet />
```

`cartCount={3}` stays: it has been `3` since Demo 3, and it is Demo 13's opening line.

**C. Consume it — `TODO(lab-4.3)` in `src/components/SiteHeader.tsx` and `src/routes/ProductsPage.tsx`**

The header deletes `wishlistCount` from `SiteHeaderProps` and from the
destructuring, and reads the context instead:

```tsx
import { useWishlist } from '../context/WishlistContext';
// …
  // Two contexts, read through their hooks. No prop for the wishlist count any more: the header
  // is a CONSUMER, and re-renders whenever the wishlist value changes — however it changes.
  const { theme, toggleTheme } = useTheme();
  const wishlistCount = useWishlist().ids.length;
```

`ProductsPage` drops `useOutletContext` from the router import and
`RootOutletContext` from the type import (keep `rootLoader`):

```tsx
import { useWishlist } from '../context/WishlistContext';
// …
  // Client state from the provider — no Outlet context, no props from the layout.
  const { ids: wishlist, toggle: toggleWishlist } = useWishlist();
```

The rest of the page is unchanged: the grid and the cards never knew where
the wishlist came from.

**D. `src/routes/ProductDetailPage.tsx` — `TODO(lab-4.4)`**

The page that could never save anything:

```tsx
import { useWishlist } from '../context/WishlistContext';     // and Button, Heart, HeartFill to the imports above
// …
  const product = useLoaderData<typeof productDetailLoader>();

  // This page never had access to the wishlist: it lived in the layout's Outlet context and only
  // ProductsPage read it. A provider above the router is visible from ANY page — no plumbing.
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);
// …under the description:
                <div className="d-flex gap-2">
                  <Button variant={saved ? 'danger' : 'outline-danger'} aria-pressed={saved} onClick={() => toggle(product.id)}>
                    {saved ? <HeartFill className="me-1" /> : <Heart className="me-1" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
```

### Verify

1. Open `/products/1`, **Save**. The heart fills; the badge says **1**. Back
   to the list: product 1's heart is filled. Same state, two pages, no props.
   `npm run typecheck`: clean — nothing referenced `RootOutletContext` except
   the two files you edited. It was plumbing.
2. **The bill.** Highlight updates on, on the list page. Click **one** heart
   and count what flashes: `SiteHeader` (and its `SignupForm`), and
   `ProductsPage` with everything under it — `PageHeader`, `ProductToolbar`,
   `CategoryStrip`, `ProductGrid`, twelve `ProductCard`s, `Pager`, the hidden
   `ProductForm` and `ConfirmDialog`. Twenty-odd. **Write the number down.**
   Which of them *needed* to? The badge and one card. Two.
3. **The ceiling.** In `ProductCard`, temporarily add `const saved =
   useWishlist().isSaved(product.id);` and drop `saved` from the props. Click
   one heart: **all twelve cards flash** — each consumes the same value, and
   the value changed. Context has one dial, consumer or not. Put the prop
   back; write down *twelve*. Demo 13 Lab 1 runs this exact experiment with a
   selector, and the number there is **one**.
4. **Profiler.** Record one heart click: the flamegraph is step 2's list with
   times. This is the screenshot that opens Demo 13.

### Watch out

**A value object without `useMemo`.** `value={{ ids, toggle, isSaved }}`
inline is a new object every provider render — rare above the router, every
navigation inside a layout. Memoise it, over stable functions.

**Fixing the bill with `memo(ProductCard)`.** It works for the cards and does
nothing for the page, the toolbar, the pager. Demo 18 does memoisation
properly; today the point is to *measure*, not to patch.

### Challenge (2 min)

Move `<WishlistProvider>` from `main.tsx` into `RootLayout`, wrapping the
fragment, and delete the provider's `useMemo`. Highlight updates on, click
**About**, then **Products**: every consumer flashes on every navigation —
the layout re-rendered, so did the provider, and the value was a new object.
Restore `useMemo`: it stops. Move the provider back: now it needn't even try.

### In the real world

Context earns its place for values that change rarely and are read
everywhere: theme, locale, the signed-in user, a client instance. Client
*state* — a cart, a wishlist, anything with many writers and readers wanting
different slices — outgrows it fast, and the symptom is what you measured:
one click, twenty renders, no way to narrow it. Teams then reach for a store;
the good ones can say *why*, with your numbers from steps 2 and 3. That is
Demo 13.

---

## Wrap-up — what you can now do

- [x] Replace independent flags with a discriminated-union state and a pure reducer, and let `never` prove the switch is exhaustive
- [x] Say what makes a reducer a state machine, where the impure work goes, and when `useState` is still the right call
- [x] Create a context with an `undefined` default and a throwing hook, and place the provider above the router on purpose
- [x] Tell React's `createContext` apart from React Router's Outlet context and middleware context
- [x] Build the reducer-plus-context pattern with the state/dispatch split, and show what the split saves
- [x] Report every action's outcome through one toast system — and say why a router action needs a component to do it
- [x] Measure what one context change re-renders, and name the two things Context cannot do that a store can

## Next demo

**Demo 13 — Client State with Zustand.** The wishlist leaves the
`WishlistProvider` for a store — no provider, a *selector* per component —
and you re-run today's twelve-card experiment to watch one card flash.
`cartLinesReducer` gets its second home inside a persisted cart store, and a
checkout *router action* reads the store with no component in sight — the
thing Lab 3's toasts could not do.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Type '{ type: "…" }' is not assignable to type 'never'` | You added an action type without a `case`. Handle it — the `never` line is doing its job. |
| `Property 'data' does not exist on type 'RequestStatus<string>'` | You read `check.data` outside a `check.status === 'success'` branch. Narrow first. |
| `check.data` is `unknown` | `useReducer(requestStatusReducer, …)` without the type argument. Write `requestStatusReducer<string>`. |
| `useTheme() must be called inside <ThemeProvider>` (or the toast/wishlist equivalent) | The provider is missing from `main.tsx`, or sits *below* the component that calls the hook. Providers wrap `<RouterProvider>`. |
| `Property 'value' does not exist on type 'IntrinsicAttributes & …'` on `<ThemeContext value>` | `createContext` came from `'react-router'`, not `'react'`. Fix the import. |
| Two identical toasts after a reload | `StrictMode` ran the effect twice on mount and the `lastFlash` guard is missing or never resets. |
| `Cannot update a component (ToastProvider) while rendering a different component` | You dispatched during render. Move the `notify(…)` into the effect or the handler. |
| A toast appears on every re-render of the list | The `?flash=` param wasn't removed — the `setSearchParams` call in the effect is missing. |
| `Property 'wishlistCount' does not exist on type 'SiteHeaderProps'` | `RootLayout` still passes it. Delete the prop; the header reads `useWishlist()` now. |
| `useOutletContext()` returns `undefined` / `Property 'wishlist' does not exist` | A page still reads Outlet context after you removed the `context` prop from `<Outlet>`. Switch it to `useWishlist()`. |
| `react-refresh/only-export-components` warning on the context files | A component and a hook share a file, so Fast Refresh falls back to a full reload for edits there. A warning, not an error; the same trade-off `RootLayout` makes with `rootLoader`. |
