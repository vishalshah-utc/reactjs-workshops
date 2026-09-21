# Demo 15 — Refs, the DOM & Keyboard Accessibility

**Demo guide** · ~110 minutes · the escape hatch: reaching the real DOM when the declarative model can't say what you mean — without fighting React for it

---

## Where you are starting from

The starter is **Demo 14, finished**: the complete ShopScope SPA — loaders
and actions, JWT auth with a refresh queue, protected routes and roles, a
theme and a toast system in Context, a wishlist and a persisted cart in
Zustand stores, optimistic deletes, uploads behind a flag, retries, lazy
routes and a build that deploys. Everything works. With a mouse.

New stubs: `src/hooks/useRenderCount.ts`, `src/hooks/useLatest.ts`,
`src/hooks/useKeyboardShortcut.ts`, `src/hooks/useReducedMotion.ts`,
`src/components/RouteAnnouncer.tsx`, `src/components/PriceHistogram.tsx`,
`src/lib/histogram.ts`.

New dependencies: **the Part 6 set** — already in `package.json`, already
installed. Part 6 is nine demos that each add a slice to the finished app,
and the track's rule is *install once*, so Demo 15's starter carries every
library the whole part will need. Today's code imports none of them; here is
what arrived and where you will first open it:

| Arrives today | First used in |
|---|---|
| `clsx`, `class-variance-authority`, `tailwindcss`, `@tailwindcss/vite` | Demo 16 — Styling & Theming |
| `react-error-boundary` | Demo 17 — Component Patterns & Portals |
| `rollup-plugin-visualizer`, `babel-plugin-react-compiler`, `@tanstack/react-virtual`, `web-vitals` | Demo 18 — Performance |
| `@tanstack/react-query`, `@tanstack/react-query-devtools` | Demo 19 — Server State & Real-time |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`, `@playwright/test`, `@types/node` | Demo 20 — Testing (`npm test` is already wired: `vitest run`) |
| `@axe-core/react`, `axe-core`, `dompurify` | Demo 22 — Production Readiness (axe automates today's checklist) |

Every version is pinned exactly, as always; from here to Demo 23 the set
does not change.

## What you ship today

`/` focuses the search box from anywhere on the products page. A failed
submit of the product form puts the cursor in the **first field that
failed**. Every route change moves focus to the new page's heading and
**announces it** to screen readers. `TextField` accepts a `ref` and exposes
`{ focus, select }` — and nothing else. The Pager scrolls the grid back into
view. A **price histogram drawn on a `<canvas>`** by a library with no React
in it, wrapped so React and the library never touch the same node. The cart
drawer closes on **Escape** and hands focus back to the button that opened it
— even when a link inside it navigated away. And the progress bar stops
animating for people who asked their OS for less motion.

By the end you will be able to answer, without hesitating:

- What `useRef` returns, what React guarantees about it, and the one-line test for ref vs state
- Why reading `ref.current` during render is a bug — and which lint rule now enforces it
- When `ref.current` is populated, and why a ref to a conditional element needs an effect that depends on the condition
- What you may do to a DOM node React rendered, what you may not, and the rule that separates them
- What changed about `ref` in React 19, what `forwardRef` was for, and why `useImperativeHandle` should be rare
- The timing difference between `useEffect` and `useLayoutEffect`, and the one case that needs the second
- What `flushSync` does and why it is almost always wrong
- Why "works with a mouse" is a bug report, not a passing grade

> **Refs are the escape hatch, not the front door.** Showing, hiding,
> styling, changing text — state and JSX. Focus, scroll, measure, draw,
> integrate — refs. Every ref in today's code does one of those five things.
> 📖 [study-notes 11](../../study-notes/11-refs-and-the-dom/) is the theory;
> each Concept below cites the section it turns into code.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/15-refs-dom-and-accessibility/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/15-refs-dom-and-accessibility/starter && npm install && npm run dev`.

DevTools panes for today: **Elements → Accessibility** (what assistive tech
is told about a node) and **Rendering → Emulate CSS media feature
`prefers-reduced-motion`**. On a Mac, ⌘F5 toggles VoiceOver.

---

## The cold open

Unplug the mouse. Or put it on the far side of the desk — you may not touch
it for three minutes.

Press **Tab** from the address bar: brand, Products, About, a search box in
the header. Type `phone`, Enter. Nothing — the box swallows the key. Tab on
through six more stops to the real search box. Type `phone`. Results. Now get
to the cart: **Shift+Tab six times**. Enter. The drawer opens with focus
inside; Escape closes it and focus returns to the cart button — the library's
freebie. Lab 5 shows where it breaks.

Tab into a card, **Add to cart**. In the drawer, Tab to the product's name,
Enter. The detail page loads. Where is focus? Press Tab: the *top of the
document*. A screen reader said nothing — no page loaded, as far as it
knows. The URL changed; the user was not told.

Sign in as `emilys`, **Add product**, Tab to **Create product**, Enter. Two
red messages. Where is your cursor? On the button you pressed. Which field
failed? Scroll and look — if you can see.

Press **/**. Nothing. GitHub, Gmail and YouTube would have put you in the
search box.

Four things a mouse hides. Each one is a ref.

---

## Lab 1 — A box that doesn't re-render (15 min)

### Problem

You have written `useRef` three times in this app without being told what
it is: `useDebouncedCallback`'s `callbackRef` (Demo 7), `ProductsPage`'s
`lastFlash` (Demo 12), `Uploader`'s `controllerRef` (Demo 14). Each time the
guide said "a ref, because this is not render state" and moved on.

### Concept

**A ref is a mutable box React keeps between renders.** `useRef(0)` returns
`{ current: 0 }` — one object, one property — and React hands you the *same
object* on every render of that component instance. Writing to `.current`
does **not** re-render. That is the whole API (📖 study-notes 11 §1).

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | **yes** | no |
| Read during render | yes — that is its job | **no** |
| Value between renders | a snapshot per render | one shared box |
| Use for | anything the user sees | everything else |

The one-line test: **does the screen need to change when this value
changes?** Yes → state. No → ref (📖 §2). A render counter is the perfect
example, because state is *impossible* for it: the render would change the
count, which would change the screen, which would render.

**Never read or write a ref during render.** A component's output must
depend on props and state; a ref is neither (📖 §2, §13). In React 19 this
stopped being advice: `eslint-plugin-react-hooks`' `recommended` set includes
the compiler's `react-hooks/refs` rule, and this starter has it on. Write
`ref.current += 1` in a component body and `npm run lint` says *Cannot update
ref during render*. Refs belong in **event handlers and effects**.

**And TypeScript says:** `useRef<T>(initial: T)` returns `RefObject<T>` —
`{ current: T }`. `useRef(0)` is `RefObject<number>`; `useRef<string |
null>(null)` is a box that may be empty. The box always has *something* in it,
so `.current` is `T`, never `T | undefined`.

### Steps

**A. `src/hooks/useRenderCount.ts` and `src/components/ProductToolbar.tsx` — `TODO(lab-1.1)`**

```ts
import { useEffect, useRef } from 'react';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** Counts renders in a ref, logs in an effect, never shows the number. */
export function useRenderCount(label: string): void {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;                 // no dependency array: after EVERY commit
    if (env.isDev) logger.debug(`[render] ${label} #${count.current}`);
  });
}
```

```tsx
// ProductToolbar, first line of the component:
  useRenderCount('ProductToolbar'); // watch the console while you type: the box re-renders, the badge doesn't care
```

Nothing on screen changes when `count.current` does — so it is a ref. No
dependency array on purpose: the effect runs after every commit, which is
exactly the event being counted.

**B. `src/hooks/useLatest.ts` and `src/hooks/useDebouncedCallback.ts` — `TODO(lab-1.2)`**

```ts
import { useEffect, useRef, type RefObject } from 'react';

/** A ref that always holds the latest `value` — read it from a callback created earlier and get today's value, not that render's. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;                // after the commit — never during render
  });
  return ref;
}
```

The four lines under *Keep the latest callback in a ref* in
`useDebouncedCallback` **are** this hook:

```ts
import { useLatest } from './useLatest';
// …
  const callbackRef = useLatest(callback);   // the debounced fn is created once but must call the NEWEST callback
// …
    [delay, callbackRef],                    // the ref object never changes identity — the linter wants it listed anyway
```

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-1.3)`**

Below `handleQueryChange`:

```tsx
import { logger } from '../config/logger';
// …
  // What the screen does NOT need: which search we already reported. A ref — changing it must not re-render,
  // and it must survive renders. Compare `lastFlash` below: the same shape, written in Demo 12 before you had the word for it.
  const lastReportedQuery = useRef<string | null>(null);
  useEffect(() => {
    if (filters.query === lastReportedQuery.current) return;
    logger.debug(`[search] "${filters.query}" → ${result.total} results (was "${lastReportedQuery.current ?? ''}")`);
    lastReportedQuery.current = filters.query;
  }, [filters.query, result.total]);
```

Read `lastFlash`, forty lines down. Same shape — a ref, compared and written
in an effect, never rendered. This is the pattern for "have we already done
this?", and you now know its name.

### Verify

1. Load `/products`: `[render] ProductToolbar #1`, then `#2` — StrictMode
   mounts twice in development, and the box kept its count across that.
2. Type `phone` slowly: one `[render]` line per keystroke (the parent
   re-renders, so the child does). Then, 400 ms after you stop, `[search]
   "phone" → 23 results (was "")`. **Once.** Press Back: `(was "phones")`.
3. **Try to display it.** Change the ref to `useState(0)` and `setCount((c)
   => c + 1)` in the effect. Lint: `react-hooks/set-state-in-effect`.
   Browser: *Maximum update depth exceeded*. Put the ref back.
4. **Try to read it during render.** Add `console.log(count.current)` above
   the effect. Lint: *Cannot access ref value during render*. The rule the
   study notes state in prose is a rule the toolchain enforces.

### Watch out

**"I changed the ref and the UI didn't update."** It won't — that is the
definition. If the UI should have changed, it was state.

**`useRef` inside `.map()`.** A hook in a loop. One ref holding a `Map` —
Lab 2, Step C — is the pattern for a list.

**Returning `ref.current` from a hook.** The classic `usePrevious` does
this (📖 §3) and `react-hooks/refs` flags it. Hold `{ value, previous }` in
state instead — what react.dev recommends today.

### In the real world

Every *handle* in a codebase is a ref: the `setInterval` id, the observer,
the chart instance, the `AbortController`. None is drawn, all must be cleaned
up — which is why refs and effect cleanups travel together. The `useLatest`
shape is in every event-listener hook you will ever read; Lab 2 uses it.

---

## Lab 2 — DOM refs and focus (30 min)

### Problem

Three of the cold open's failures are about **focus**: `/` does not reach
the search box, a failed submit leaves the cursor on the button, a
navigation leaves it nowhere. Focus is browser state, not markup — there is
no JSX for "the cursor is here". You need the node.

### Concept

**A DOM ref is the same box, filled by React at commit.** Pass
`ref={inputRef}` to a host element and React writes the node into `.current`
on commit and `null` back on unmount (📖 §4–5):

```
render          → ref.current is null (or the previous node)
React commits   → React sets ref.current to the DOM node
effects run     → ref.current is available ✓
unmount         → React sets ref.current back to null
```

So a DOM ref is `null` during the first render — always — and can be `null`
in a callback after unmount. `inputRef.current?.focus()` is not style.

**And TypeScript says:** `useRef<HTMLInputElement>(null)` — the type
argument is the *element*, the initial value is `null`, and `.current` is
`HTMLInputElement | null`. That `| null` is the lifecycle above, written as a
type; the `?.` is the compiler making you honour it.

**What you may and may not do to a node** (📖 §6). React owns the DOM it
rendered; a ref lets you reach in, not take over.

| Safe — reads and non-destructive calls | Unsafe — React will overwrite you, or crash |
|---|---|
| `focus()`, `blur()`, `select()` | `textContent = …`, `innerHTML = …` |
| `scrollIntoView()`, `getBoundingClientRect()` | `remove()`, `appendChild()` |
| `querySelector()`, `hasAttribute()` | `style.display = …`, `classList.add()` |
| `play()`, `showModal()` | anything that changes what React thinks is there |

The rule: **manipulate nodes React does not render into.** A `<div
ref={x} />` with no children is yours to fill — Lab 4's canvas, and today's
live region. Everything in the right column is a `className` or state change
in disguise.

**Ref callbacks and a list of refs** (📖 §7–8). Pass a *function* instead of
an object: React calls it with the node on mount and — new in React 19 —
calls the cleanup it returns on unmount. You cannot call `useRef` in a loop,
so a list is one ref holding a `Map`, filled by ref callbacks whose cleanups
delete their entry: five fields, one Map, one lookup.

**Focus follows action; changes are announced.** Focus goes where the
meaning went — into the form, onto the failed field, onto the new page. What
changed without the user doing it, a **live region** (`aria-live="polite"`)
tells them.

### Steps

**A. `src/hooks/useKeyboardShortcut.ts` — `TODO(lab-2.1)`**

```ts
import { useEffect } from 'react';
import { useLatest } from './useLatest';

interface ShortcutOptions {
  /** Don't fire while the user is typing somewhere. Default true — a "/" in the search box is a slash, not a command. */
  ignoreWhenTyping?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;   // EventTarget | null → narrow before .isContentEditable exists
  return target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

/** A single-key shortcut on the window. The listener is added ONCE; useLatest makes it call the newest handler. */
export function useKeyboardShortcut(key: string, handler: (event: KeyboardEvent) => void, { ignoreWhenTyping = true }: ShortcutOptions = {}): void {
  const handlerRef = useLatest(handler);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return; // Cmd+/ etc. belong to the browser
      if (ignoreWhenTyping && isTypingTarget(event.target)) return;
      event.preventDefault(); // Firefox opens quick-find on "/" — we own the key now
      handlerRef.current(event);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, ignoreWhenTyping, handlerRef]);
}
```

**B. `src/components/ProductToolbar.tsx` — `TODO(lab-2.2)`**

```tsx
import { useRef } from 'react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
// …after useRenderCount:
  // A DOM ref: null during render, the <input> once React has committed. Only ever touched in a handler.
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcut('/', () => {
    searchRef.current?.focus();
    searchRef.current?.select(); // the old query is selected: typing replaces it, Escape keeps it
  });
// …on the Form.Control:
        <Form.Control ref={searchRef} type="search" placeholder="Search products — press /" /* …unchanged… */ />
```

`Form.Control` forwards its `ref` to the real `<input>` — every component
library does, for exactly this reason. The placeholder is not decoration: a
shortcut nobody knows about does not exist.

**C. `src/components/ProductForm.tsx` — `TODO(lab-2.3)`**

```tsx
import { useEffect, useRef } from 'react';
// …
/** The order fields appear on screen — "first invalid" means first in THIS list, not first in the errors object. */
const FIELD_ORDER: (keyof ProductDraft)[] = ['title', 'price', 'stock', 'category', 'description'];
// …inside ProductForm, after categoryOptions:
  // A Map of DOM nodes, one per field, filled by ref CALLBACKS. Never read during render — only in the effect below.
  const fieldNodes = useRef<Map<keyof ProductDraft, HTMLDivElement> | null>(null);
  const getFieldNodes = () => (fieldNodes.current ??= new Map<keyof ProductDraft, HTMLDivElement>());
  const registerField = (name: keyof ProductDraft) => (node: HTMLDivElement | null) => {
    if (!node) return;
    getFieldNodes().set(name, node);
    return () => {
      getFieldNodes().delete(name); // React 19: runs when the node unmounts — the Map never holds a dead node
    };
  };

  // `actionData` is the dependency — a NEW object per submission, the SAME object across re-renders — so this runs once per failure.
  useEffect(() => {
    const first = FIELD_ORDER.find((name) => actionData?.errors?.[name]);
    if (!first) return;
    // A read (querySelector) and a non-destructive call (focus) — the two things a ref to React's DOM is FOR.
    getFieldNodes().get(first)?.querySelector<HTMLElement>('input, select, textarea')?.focus();
  }, [actionData]);
```

```tsx
// …each field gets a registering wrapper (title shown; do the same for price, stock, category, description):
          <div ref={registerField('title')}>
            <TextField controlId="pf-title" label="Title" name="title" autoFocus /* …unchanged… */ />
          </div>
```

Why a wrapper `<div>`? Because the field components do not *accept* a ref
yet — a `ref` on a function component that ignores it does nothing (Lab 3
fixes that for `TextField`). Why `actionData` and not `errors`? `errors` is
`actionData?.errors ?? {}` — a *new* `{}` every render — and the effect would
steal focus on every render.

**D. `src/components/RouteAnnouncer.tsx` — `TODO(lab-2.4)`**

```tsx
import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router';

interface RouteAnnouncerProps {
  /** The region the pages render into. Focus lands on its <h1> if that opted in, else on the region itself. */
  mainRef: RefObject<HTMLElement | null>;
}

/** What the browser does for a full page load, done by hand for a SPA: focus the new page's heading, announce it. */
export function RouteAnnouncer({ mainRef }: RouteAnnouncerProps) {
  const { pathname } = useLocation();
  const liveRef = useRef<HTMLDivElement>(null);
  const lastAnnounced = useRef<string | null>(null); // never displayed, survives renders, idempotent under StrictMode

  useEffect(() => {
    if (lastAnnounced.current === null) {
      lastAnnounced.current = pathname; // the first render IS a page load — the browser already announced it
      return;
    }
    if (lastAnnounced.current === pathname) return;
    lastAnnounced.current = pathname;

    const main = mainRef.current;
    if (!main) return;

    const heading = main.querySelector<HTMLElement>('h1');
    const title = heading?.textContent?.trim() || 'ShopScope';
    document.title = `${title} · ShopScope`; // not React-rendered — ours to set

    const target = heading?.hasAttribute('tabindex') ? heading : main; // only an element with a tabindex can take focus
    target.focus({ preventScroll: true }); // ScrollRestoration owns the scroll position

    // Clear, then set: the same text twice is not a change, and live regions announce CHANGES.
    if (liveRef.current) {
      liveRef.current.textContent = '';
      liveRef.current.textContent = `Navigated to ${title}`;
    }
  }, [pathname, mainRef]); // pathname ONLY — a search-param change (every keystroke in the search box) is not a new page

  return <div ref={liveRef} aria-live="polite" aria-atomic="true" className="visually-hidden" />;
}
```

Two lines write to the DOM, and both are legal by the rule's own wording:
`document.title` is not React's, and the live region is rendered **empty**,
so its text is ours. Hold the announcement in state instead and you need
`setAnnouncement` in the effect, which `react-hooks/set-state-in-effect`
refuses — correctly: an announcement is a side effect, not render state.

**E. `src/routes/RootLayout.tsx` and `src/components/PageHeader.tsx` — `TODO(lab-2.5)`**

```tsx
import { useEffect, useRef } from 'react';
import { RouteAnnouncer } from '../components/RouteAnnouncer';
// …
  // The region every page renders into. The announcer focuses its <h1> (or the region) after each navigation.
  const mainRef = useRef<HTMLElement>(null);
// …the Outlet's wrapper becomes a <main>. tabIndex={-1}: focusable from code, never in the Tab order. outline: none HERE only.
        <main ref={mainRef} id="main" tabIndex={-1} className={busy ? 'opacity-50' : ''} style={{ transition: 'opacity .15s', outline: 'none' }}>
          <Outlet />
        </main>
// …next to ScrollRestoration:
      <RouteAnnouncer mainRef={mainRef} />
```

```tsx
// PageHeader — the heading opts in:
        <h1 className="h3 mb-1" tabIndex={-1}>
          {title}
        </h1>
```

`tabIndex={-1}` is the whole trick of focus management: an element code can
focus and Tab will never stop on.

### Verify

1. **`/`.** From anywhere on `/products`, press `/`: the search box has
   focus and its text is selected. Press `/` *inside* the box: a literal
   slash — a typing target. Tab to **Sort**, press `/`: nothing — so is a
   `<select>`.
2. **First invalid field.** As `emilys`: Add product, clear the Title, set
   Stock to `-1`, submit. Focus lands in **Title** — first in screen order,
   whatever order the errors object has. Type a title, submit: **Stock**.
3. **Route announcement.** Click **About**: the tab title changes, the
   `visually-hidden` div in Elements reads *Navigated to About ShopScope*,
   and Tab lands *inside the page* — focus was on `<main>` (that heading has
   no `tabindex`). Click **Products**: the *All products* heading itself has
   a focus ring. VoiceOver reads each one.
4. **Not on every keystroke.** Type in the search: the URL changes, the
   announcer stays quiet. Depend on `location` instead and focus is yanked to
   the heading mid-word.

### Watch out

**`ref.current` is `null` in the first render.** Always. If it is `null` in
an effect too, the element is conditionally rendered and the effect must
depend on the condition (📖 §5).

**Depending on a derived object.** `[errors]` refocuses the first invalid
field on *every* render — including the one caused by clicking into another
field. Depend on what the router gives you.

**A live region that appears with its message.** `{msg && <div aria-live>
{msg}</div>}` is silent: the region must exist *before* the text changes.
Render it always, empty; change its content.

### Challenge (2 min)

`AboutPage`, `LoginPage`, `ProductDetailPage` and `ProfilePage` render their
own `<h1>`. Give each `tabIndex={-1}`. Then: should the announcer *force* it
with `heading.tabIndex = -1` when a heading did not opt in? The table under
Concept has the answer.

### In the real world

Next.js ships a route announcer; React Router's docs show this component
almost line for line. `/` for search is a convention users bring from GitHub
and Gmail. Focusing the first invalid field is WCAG's *Error Identification*
in code — the most common form defect an audit finds.

---

## Lab 3 — `ref` as a prop and imperative handles (20 min)

### Problem

Lab 2 wrapped every field in a `<div>` because a `ref` on `<TextField>` did
nothing — the component never looked at it. A design-system input its parent
cannot focus is half a component. And the Pager, at the bottom of the page,
wants to scroll *the grid* — a node that belongs to a different component.

### Concept

**In React 19, `ref` is a prop.** A function component receives it like
`label` or `onChange`, and passes it on to whatever should own it (📖 §9):

```tsx
function TextInput({ ref, ...props }: { ref?: Ref<HTMLInputElement> }) {   // React 19
  return <input ref={ref} {...props} />;
}
```

Before 19 React stripped it, and you threaded it through `forwardRef`. You
will read this in every library and every codebase older than a year:

```tsx
const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(props, ref) {   // legacy
  return <input ref={ref} {...props} />;
});
```

It still works and is deprecated for new code. Know it to read it; do not
write it.

**Expose a handle, not the node** (📖 §10). Hand out the `<input>` and the
input *is* your public API — restyled, `.value` read behind the form
library's back, `remove()`d. `useImperativeHandle(ref, () => ({ focus,
select }), [])` gives the parent two verbs and nothing else. **And it should
be rare:** a handle is a hole in the declarative model. "Open the dialog from
outside" wants `open={isOpen}`. Focus and selection are the honest
exceptions — there is no prop for "the cursor is here".

**A ref object is just an object.** `scrollTargetRef` in Step C is a
`RefObject` passed as an *ordinary* prop — how a parent shares a node with a
sibling. The name `ref` is only magic on a host element and as
`useImperativeHandle`'s first argument. **And TypeScript says:** `Ref<T>` is
what a component *receives* (object, callback or `null`); `RefObject<T |
null>` is what you *read*. `useRef<HTMLDivElement>(null)` gives the second and
fits where the first is expected.

### Steps

**A. `src/components/fields/TextField.tsx` and `fields/index.tsx` — `TODO(lab-3.1)`**

```tsx
import { useImperativeHandle, useRef, type Ref } from 'react';
// …
/** What a parent may DO to a TextField — and nothing else. Two verbs are a contract this file can keep when the markup changes. */
export interface TextFieldHandle {
  focus: () => void;
  select: () => void;
}

export interface TextFieldProps extends BaseFieldProps, ControlRest {
  /** React 19: `ref` is an ordinary prop. This one receives a HANDLE, not a DOM node. */
  ref?: Ref<TextFieldHandle>;
  // …unchanged…
}

export function TextField({ ref, controlId, label, /* …unchanged… */ ...rest }: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);   // the node stays private

  // Created once (empty deps); reads the node lazily, so it is never stale and never null-at-mount.
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    select: () => inputRef.current?.select(), // select() also focuses — one call for "cursor here, ready to retype"
  }), []);

  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control ref={inputRef} /* …unchanged… */ />
```

```ts
// fields/index.tsx, under the TextField export:
export type { TextFieldHandle, TextFieldProps } from './TextField';
```

**B. `src/components/ProductForm.tsx` — `TODO(lab-3.2)`**

```tsx
import { NumberField, SelectField, TextAreaField, TextField, type TextFieldHandle } from './fields';
// …after the focus-first-invalid effect:
  // The title field's HANDLE — { focus, select }, not the <input>. Used once the modal has finished opening.
  const titleRef = useRef<TextFieldHandle>(null);
// …
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop={submitting ? 'static' : true}
      // onEntered: the fade is done and Bootstrap's own focus management has run. Editing? The title is selected, ready to retype.
      onEntered={() => titleRef.current?.select()}
    >
// …the title field: ref in, autoFocus out
            <TextField ref={titleRef} controlId="pf-title" label="Title" name="title" defaultValue={initial('title')} error={errors.title} disabled={submitting} />
```

Should Lab 2's `Map` now hold handles? Only if three more field types grow
one — three more `useImperativeHandle`s for a feature the divs already
deliver with one `querySelector`. That is the "rare" in *should be rare*.

**C. `src/components/ProductGrid.tsx` and `src/components/Pager.tsx` — `TODO(lab-3.3)`**

```tsx
import type { Ref } from 'react';
// …
interface ProductGridProps {
  /** React 19: `ref` is a prop like any other. The parent gets the grid's root node — to scroll it into view, never to edit it. */
  ref?: Ref<HTMLDivElement>;
  // …unchanged…
}

export function ProductGrid({ ref, products, /* …unchanged… */ }: ProductGridProps) {
  if (products.length === 0) {
    return <div ref={ref} /* …unchanged… */ >
  // …
    // scrollMarginTop: scrollIntoView() stops BELOW the sticky header instead of under it.
    <Row ref={ref} {...COLUMNS[density]} className="g-3" style={{ scrollMarginTop: '4.5rem' }}>
```

The Pager *reads* one, as a plain prop:
```tsx
import type { RefObject } from 'react';
// …
  /** Something to bring back into view after a page change. A ref is just an object; it travels as a prop like any other value. */
  scrollTargetRef?: RefObject<HTMLElement | null>;
// …
export function Pager({ page, pageCount, onChange, scrollTargetRef }: PagerProps) {
  if (pageCount <= 1) return null;

  function go(next: number) {
    onChange(next);
    // A handler, not render — reading .current here is fine. The node can be null (an empty grid), hence `?.`.
    scrollTargetRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
// …Prev/Next call go(page - 1) / go(page + 1); give the <Pagination> aria-label="Pages"
```

**D. `src/routes/ProductsPage.tsx` and `src/hooks/useProductFilters.ts` — `TODO(lab-3.4)`**

```tsx
  // The grid's root node — for the Pager to scroll back to. One ref, handed to two components as a plain prop.
  const gridRef = useRef<HTMLDivElement>(null);
// …
      <ProductGrid ref={gridRef} products={products} /* …unchanged… */ />
// …
      <Pager
        page={filters.page}
        pageCount={pageCount}
        scrollTargetRef={gridRef}
        // preventScrollReset: the Pager scrolls to the grid itself; ScrollRestoration must not jump to the top first.
        onChange={(page) => updateFilters({ page }, { replace: false, preventScrollReset: true })}
      />
```

```ts
// useProductFilters — the new option, passed straight through:
    (patch: Partial<ProductFilters>, { replace = true, preventScrollReset = false }: { replace?: boolean; preventScrollReset?: boolean } = {}) => {
      setSearchParams(/* …unchanged… */, { replace, preventScrollReset });
```

### Verify

1. As `emilys`, click a pencil. When the modal lands, the title is
   **focused and fully selected**. **Add product**: the empty title has the cursor.
2. Try `titleRef.current?.style` anywhere in `ProductForm`. *Property
   'style' does not exist on type 'TextFieldHandle'.* The contract, doing its
   job.
3. Scroll to the bottom of `/products`, click **Next**. The grid slides up
   to sit just under the sticky header. Press Back: ScrollRestoration puts
   you where you were.
4. Remove `preventScrollReset: true`, click Next: the grid slides into view,
   then — when the loader finishes — the window **jumps to the top**. Two
   things fighting over scroll. Put it back.

### Watch out

**Exposing the node "for flexibility".** `ref?: Ref<HTMLInputElement>`
makes the `<input>` public. The day `TextField` wraps it in an `<InputGroup>`
for a prefix, every parent that reached for `inputRef.current.parentElement`
breaks. Verbs, not nodes.

**Focusing in an effect while a Modal opens.** `useEffect(() =>
titleRef.current?.focus(), [show])` races Bootstrap's own `autoFocus`.
`onEntered` runs after the library is done.

### Challenge (2 min)

Give `NumberField` the same `{ focus, select }` handle and switch Lab 2's
Map to `Map<keyof ProductDraft, TextFieldHandle>` for the fields that have
one. How many files did you touch, and what happens for `category`?

### In the real world

Radix, Base UI and React Aria expose a ref to their root node and a *small*
handle where focus is involved, nothing more. A handle with eight methods is
a component that wanted to be props.

---

## Lab 4 — Measuring and third-party widgets (25 min)

### Problem

A price distribution chart. Drawing is imperative — React has no `<canvas>`
API — and Chart.js, D3 or a map library all want a DOM node *to
themselves*. Two owners of one node is the bug class this lab prevents. And
a chart has to know how wide it is, which only the laid-out DOM can say.

### Concept

**A node React renders empty is yours.** `<canvas ref={canvasRef} />` has no
children; React creates it, hands it over, and never looks inside. That is
the integration contract for every non-React library (📖 §4, §6):

```
create   in an effect, once      → chart = createChart(node)
update   in an effect, on data   → chart.update(data)
destroy  in the cleanup          → chart.destroy()
```

**`useLayoutEffect` vs `useEffect`** (📖 §11). Identical, except *when*:

```
useEffect:        render → commit → PAINT → effect
useLayoutEffect:  render → commit → effect → PAINT
```

That matters exactly once: when you must **measure the DOM and change it
again before the user sees the intermediate state**. A tooltip that positions
itself by its own width; a canvas that sizes itself to its container. With
`useEffect` the browser paints the wrong version first — a one-frame flicker
you can see. Costs: it blocks painting, and it does not run on the server.
Default to `useEffect`; reach for the other when you can *see* the flicker.

The linter agrees precisely: `react-hooks/set-state-in-effect` refuses a
synchronous `setState` in `useEffect` and **allows it in `useLayoutEffect`**,
because measure-then-set-state is the one legitimate reason to do it.

**`flushSync`** (📖 §12). Updates are batched; the DOM is not updated by the
next line of your handler. When the next line *needs* it — scroll to the
element you just rendered — `flushSync(() => setState(…))` forces a
synchronous render first. It defeats batching. Comment it every time; today's
code has exactly one.

### Steps

**A. `src/lib/histogram.ts` — `TODO(lab-4.1)`**

The "library". Notice what it imports: nothing. Keep the stub's interfaces;
add `HistogramOptions` (`buckets`, `color`, `highlightColor`, all optional).

```ts
function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  return ctx;   // a helper, because a hoisted `function draw()` would not see the null check
}

export function createHistogram(canvas: HTMLCanvasElement, { buckets = 8, color = '#0d6efd', highlightColor = '#6ea8fe' }: HistogramOptions = {}): Histogram {
  const ctx = getContext(canvas);
  let values: number[] = [];
  let bars: HistogramBucket[] = [];
  let width = canvas.clientWidth || 300;
  let height = canvas.clientHeight || 150;
  let highlighted = -1;

  function compute() { /* min/max → `buckets` equal ranges → count each value into its bar; each bar records its x and width */ }

  function draw() {
    const dpr = window.devicePixelRatio || 1;     // bitmap in DEVICE pixels — sharp on retina; the CSS size is the wrapper's business
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    /* one fillRect per bar; `highlighted` gets highlightColor */
  }

  return {
    update(next) { values = next; compute(); draw(); },
    resize(nextWidth, nextHeight) { width = nextWidth; height = nextHeight; compute(); draw(); },
    hitTest(x) {
      const index = bars.findIndex((bar) => x >= bar.x && x <= bar.x + bar.width);
      if (index !== highlighted) { highlighted = index; draw(); }
      return index === -1 ? null : bars[index];
    },
    destroy() { ctx.clearRect(0, 0, width, height); values = []; bars = []; },
  };
}
```

The two elided bodies are twenty lines of arithmetic and `fillRect` with no
React in them — copy them from the finished tree
(`demos/16-styling-and-theming/starter/src/lib/histogram.ts`) or write your
own. What matters today is the *shape*: four methods, one node, no imports.

`canvas.width = …` is a write to a node — and fine, because React rendered
the canvas with no `width` attribute and will never set one. Lab 2's rule,
applied.

**B. `src/components/PriceHistogram.tsx` — `TODO(lab-4.2)`**

```tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Card } from 'react-bootstrap';
import { createHistogram, type Histogram, type HistogramBucket } from '../lib/histogram';
import { formatPrice } from '../lib/format';
import type { Product } from '../types';

const HEIGHT = 120;

export function PriceHistogram({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Histogram | null>(null); // the library instance: not render state, never displayed
  const [active, setActive] = useState<HistogramBucket | null>(null);

  // 1. Create ONCE, destroy on unmount — and measure the container before the first paint, so the chart never
  //    shows at the canvas's default 300×150 for a frame. A layout effect: measure → draw → paint.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const chart = createHistogram(canvas);
    chartRef.current = chart;
    chart.resize(container.clientWidth, HEIGHT);
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  // 2. React data → library call. That's the whole bridge.
  useEffect(() => {
    chartRef.current?.update(products.map((product) => product.price));
  }, [products]);

  // 3. Re-measure on resize. A ref CALLBACK: React calls it with the node on mount and, in React 19, calls the returned
  //    cleanup on unmount — the observer's life is the node's life. useCallback, or React re-runs it every render.
  const setContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => chartRef.current?.resize(entry.contentRect.width, HEIGHT));
    observer.observe(node);
    return () => {
      observer.disconnect();
      containerRef.current = null;
    };
  }, []);

  function handleMove(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect(); // a READ, in a handler — always allowed
    setActive(chartRef.current?.hitTest(event.clientX - rect.left) ?? null);
  }
  function handleLeave() {
    chartRef.current?.hitTest(-1);
    setActive(null);
  }
  const summary = `Price distribution of ${products.length} products on this page.`; // the finished file adds the min–max range

  return (
    <Card id="price-histogram">
      <Card.Body className="py-2">
        <div className="small text-muted mb-1">Price distribution — this page</div>
        <div ref={setContainer} className="position-relative">
          {/* Pixels are invisible to assistive tech: the canvas gets a role and a text alternative. */}
          <canvas ref={canvasRef} role="img" aria-label={summary} style={{ width: '100%', height: HEIGHT, display: 'block' }} onMouseMove={handleMove} onMouseLeave={handleLeave} />
          {/* key: a new bucket is a NEW tooltip, mounted at its default position and measured from scratch. */}
          {active && <BarTooltip key={active.index} bucket={active} containerRef={containerRef} />}
        </div>
      </Card.Body>
    </Card>
  );
}

/** Centred over its bar — unless that would push it past the container's edge, in which case it shifts back in. */
function BarTooltip({ bucket, containerRef }: { bucket: HistogramBucket; containerRef: RefObject<HTMLDivElement | null> }) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // MEASURE, then re-render before the browser paints — the one job useLayoutEffect exists for.
  // Change it to useEffect and hover the last bar: the tooltip paints hanging off the edge, THEN jumps in.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const box = containerRef.current;
    if (!tip || !box) return;
    const tipRect = tip.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    if (tipRect.right > boxRect.right) setShift(boxRect.right - tipRect.right - 4);
    else if (tipRect.left < boxRect.left) setShift(boxRect.left - tipRect.left + 4);
  }, [containerRef]);

  return (
    <div ref={tipRef} role="tooltip" className="position-absolute top-0 badge text-bg-dark"
      style={{ left: bucket.x + bucket.width / 2, transform: `translateX(calc(-50% + ${shift}px))`, pointerEvents: 'none' }}>
      {bucket.count} at {formatPrice(bucket.from)}–{formatPrice(bucket.to)}
    </div>
  );
}
```

Count the refs: a node to measure, a node to hand over, a library instance,
a node to measure. And one `key` doing quiet work: a new bucket remounts the
tooltip so `shift` starts at `0` and the measurement is honest.

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-4.3)`**

```tsx
import { flushSync } from 'react-dom';
import { BarChart, Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { PriceHistogram } from '../components/PriceHistogram';
// …state:
  const [showChart, setShowChart] = useState(false);
  const chartPanelRef = useRef<HTMLDivElement>(null);
// …a handler:
  function toggleChart() {
    if (showChart) {
      setShowChart(false);
      return;
    }
    // flushSync: render NOW, so the panel exists on the next line. Without it, setState is batched, the panel
    // doesn't exist yet, and chartPanelRef.current is null. Rare and deliberate — hence the comment.
    flushSync(() => setShowChart(true));
    chartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
// …in the PageHeader actions, after the density ButtonGroup:
            {/* A disclosure, not a toggle: aria-expanded + aria-controls tell assistive tech WHAT it opens. */}
            <Button size="sm" variant="outline-secondary" aria-expanded={showChart} aria-controls="price-histogram" onClick={toggleChart}>
              <BarChart className="me-1" />
              Prices
            </Button>
// …above the grid:
      {showChart && (
        <div ref={chartPanelRef} className="mb-3">
          <PriceHistogram products={products} />
        </div>
      )}
```

### Verify

1. **Prices.** The panel appears *and* scrolls into view in the same click.
   Eight bars for this page's twelve products. Hover: the bar lightens, a
   tooltip reads *3 at $9.99–$120.00*. Hover the **last** bar: the tooltip
   stays inside the card.
2. **The flicker.** In `BarTooltip`, change `useLayoutEffect` to
   `useEffect`. Hover the last bar, move off, hover again — it paints hanging
   off the right edge, then snaps in. Too fast to see? DevTools →
   Performance → CPU **6× slowdown**. Change it back.
3. **Batching.** Replace `flushSync(() => setShowChart(true))` with a plain
   `setShowChart(true)` and log `chartPanelRef.current` after it: `null`.
   Put `flushSync` back. Then resize the window (bars redraw — the observer)
   and page to the next twelve (bars redraw — effect 2).

### Watch out

**Chart size in state, set from `useEffect`.** The linter refuses it and
the browser paints the wrong size first. `useLayoutEffect` for a measurement
— or, as here, no state at all: tell the library.

**No cleanup.** A `ResizeObserver` never disconnected, a chart never
destroyed: a leak per mount, and in StrictMode two charts on one canvas.

**`flushSync` inside an effect or during render.** *flushSync was called
from inside a lifecycle method.* Event handlers only.

### In the real world

Every Chart.js, D3, Mapbox or video-player wrapper is this file with
different method names. Teams get it wrong in two ways: rendering *into* the
library's node, and skipping `destroy`. `useLayoutEffect` appears in tooltip,
popover and virtual-list code and almost nowhere else — the right frequency.

---

## Lab 5 — The keyboard pass (20 min)

### Problem

The remaining defects *look* finished. A drawer that closes on Escape —
until a link inside it steals the ending. A results count that changes
silently. A progress bar that animates for users who asked their OS not to.
A header search that has swallowed Enter since Demo 1. Each is a correctness
bug with a keyboard, invisible with a mouse.

### Concept

**Accessibility is correctness, not polish.** A keyboard user is a user;
"works with a mouse" is a partial pass. The checklist below is what Demo 22
automates with axe — which finds labels, roles, contrast and `aria-*`
mistakes, and **cannot** find focus order, focus restoration or whether
Escape works. Those need a human, or a Playwright test that presses keys.

| Check | Where in ShopScope | Tool |
|---|---|---|
| Every control reachable by Tab, in reading order | header → page → drawer | Tab |
| Visible focus on every stop | Bootstrap's ring — never `outline: none` globally | eyes |
| A **skip link** past the header | Step D | Tab from the address bar |
| Escape closes; focus **returns to the opener** | drawer, modals | Escape |
| Toggle/disclosure state exposed | `aria-pressed` (density, theme, heart), `aria-expanded` (Prices) | Accessibility pane |
| Async changes announced | results count, route change, cart quantity | live regions |
| Every dialog labelled | `aria-labelledby` on the drawer | Accessibility pane |
| Motion respects `prefers-reduced-motion` | progress bar, smooth scrolls, fade | Rendering → emulate |
| No control that does nothing | the header search | Enter |

**Focus restoration has a race.** When two things want focus, the one that
runs *last* wins. A drawer that restores focus when its slide-out finishes
(300 ms) and an announcer that fires when the loader finishes (50 ms to 2 s)
agree on fast networks and disagree on slow ones. The fix is not a
`setTimeout`; it is deciding, when the user acts, which one stands down.

### Steps

**A. `src/components/CartDrawer.tsx` — `TODO(lab-5.1)`**

```tsx
import { useState } from 'react';
// …after `submitting`:
  // Focus goes back to the opener when the drawer closes — EXCEPT when it closed because the user followed a link.
  // Then the new page's heading takes focus (RouteAnnouncer), and a "restore" firing 300 ms later would steal it back.
  const [restoreFocus, setRestoreFocus] = useState(true);
  function followLink() {
    setRestoreFocus(false);
    close();
  }

  return (
    <Offcanvas
      show={isOpen}
      onHide={close}
      placement="end"
      // All four are the library's defaults. Set them anyway: accessibility that lives in a default is accessibility a version bump can remove.
      keyboard // Escape closes
      autoFocus // focus moves INTO the drawer when it opens
      enforceFocus // and stays there while it is open
      restoreFocus={restoreFocus} // and goes back to the opener when it closes
      onExited={() => setRestoreFocus(true)}
      aria-labelledby="cart-drawer-title"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="cart-drawer-title" className="h6">
// …every <Link> in the drawer: onClick={followLink} instead of onClick={close}
// …the quantity, between − and +:
                  {/* Not a disabled <button> — Tab skips it and it is read as "dimmed". A live span: the new quantity is announced. */}
                  <span className="btn btn-outline-secondary px-3 pe-none" aria-live="polite" aria-atomic="true">
                    {line.qty}
                  </span>
```

**B. `src/components/ProductToolbar.tsx` — `TODO(lab-5.2)`**

```tsx
      {/* role="status" is an implicit aria-live="polite": a screen reader hears "24 results" after the list changes. */}
      <Badge bg="secondary" className="ms-auto" role="status">
```

Then **audit, don't add**: find `aria-pressed` in `ProductsPage`,
`SiteHeader` and `ProductCard`. Demo 2 put it on the density buttons, Demo
12 on the theme toggle, Demo 3 on the heart. Select one in Elements →
Accessibility: *pressed: true*. That is what the checklist row means, and
the audit is a two-minute habit.

**C. `src/hooks/useReducedMotion.ts`, `RootLayout.tsx`, `Pager.tsx`, `ProductsPage.tsx` — `TODO(lab-5.3)`**

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** For event handlers: read the OS preference right now. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/** For render: the preference as STATE, subscribed — setState runs in the listener's callback, never in the effect body. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

```tsx
// RootLayout:
import { useReducedMotion } from '../hooks/useReducedMotion';
  const reducedMotion = useReducedMotion();
// …
        {busy && <ProgressBar now={100} animated={!reducedMotion} striped /* …unchanged… */ />}
// …
        <main /* …unchanged… */ style={{ transition: reducedMotion ? 'none' : 'opacity .15s', outline: 'none' }}>

// Pager and ProductsPage — both scrollIntoView calls:
import { prefersReducedMotion } from '../hooks/useReducedMotion';
    scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', /* … */ })
```

Two functions on purpose: a handler reads the preference *now*; a component
subscribes so the bar re-renders if the setting flips while the app is open.
Nothing is removed — the bar still shows, the page still scrolls — it holds
still.

**D. `src/routes/RootLayout.tsx` and `src/components/SiteHeader.tsx` — `TODO(lab-5.4)`**

```tsx
// RootLayout — the FIRST Tab stop on every page, above <SiteHeader>. Invisible until focused; #main is the <main>.
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" style={{ zIndex: 1100 }}>
        Skip to content
      </a>
```

```tsx
// SiteHeader — the search box starts searching:
import { Form as RouterForm, Link, NavLink } from 'react-router';
// …
          {/* A GET form is a NAVIGATION: submit → /products?q=… and the toolbar adopts the URL. Until today this box swallowed Enter. */}
          <RouterForm method="get" action="/products" role="search" className="d-none d-sm-flex me-2">
            <Form.Control type="search" name="q" size="sm" placeholder="Search products" aria-label="Search products" />
          </RouterForm>
```

A `<Form method="get">` is a navigation, not a submission: the router
serialises the fields into the query string and goes there. No action, no
handler — `ProductsPage` already adopts `?q=` from the URL (Demo 9).

### Verify

1. **Escape and return.** Tab to the cart button, Enter, Tab around, Escape:
   focus is on the cart button. Tab to a card's **Add to cart**, Enter,
   Escape: focus is on *that* button.
2. **The race, fixed.** In the drawer, Tab to a product's name, Enter. Press
   Tab: you are *inside the page*, not the header. Change `followLink` back
   to `close`, throttle to Slow 3G, repeat: focus ends on the **cart button**
   — the restore fired after the announcer. Put `followLink` back.
4. **Reduced motion.** Rendering → *Emulate prefers-reduced-motion:
   reduce*. Navigate: the bar shows, its stripes hold still. Pager **Next**:
   the grid jumps instead of sliding. Turn emulation off: both animate again
   without a reload — the hook subscribed.
5. **Skip link and search.** Click the address bar, Tab once: *Skip to
   content* appears top-left; Enter: focus is in `<main>`. Type `laptop` in
   the header box, Enter: `/products?q=laptop`, the toolbar shows it, the
   grid filters.

### Watch out

**`outline: none` as a global rule.** The most common accessibility
regression. We set it on *one* element — `<main>` — because a ring around
the whole page is noise, and the heading inside keeps its own.

**A `disabled` button as a label.** Tab skips it, screen readers call it
dimmed, and its value changes silently. A `<span>`; live if it changes.

### Challenge (2 min)

The wishlist heart in the header is a `<button>` with no `onClick` — a Tab
stop that lies, like the header search was. Make it *do* something (filter
the grid to saved products via `?saved=1`) or make it *not a control* (a
`<span>` with a `visually-hidden` count). Why is "leave it" not an option?

### In the real world

Accessibility bugs are the ones your team does not experience, so they
survive every demo. Two habits catch them: unplug the mouse once per feature,
and put the checklist into CI — axe for the half it can see (Demo 22), a
Playwright test that presses Tab, Enter and Escape for the half it cannot
(Demo 20).

---

## Wrap-up — what you can now do

- [x] Say what `useRef` returns, why writing `.current` does not re-render, apply the one-line test — and point at the lint rule that enforces "never during render"
- [x] Explain the DOM-ref lifecycle, type it as `HTMLInputElement | null`, and focus, scroll or measure a node without mutating what React rendered
- [x] Register a list of nodes in a `Map` with ref callbacks and React 19 cleanups, and focus the first invalid field of a form
- [x] Move focus and announce on route change with a live region — rendered empty, written imperatively, and know why
- [x] Accept `ref` as a prop in React 19, read `forwardRef` in older code, expose a two-verb handle with `useImperativeHandle` — and argue for not doing it more
- [x] Wrap a non-React library around an empty node with create/update/destroy, measure in `useLayoutEffect`, and say why the linter allows `setState` there and not in `useEffect`
- [x] Use `flushSync` once, on purpose, with a comment
- [x] Run the keyboard pass — Tab order, Escape and focus return, live regions, `aria-pressed`/`aria-expanded`, reduced motion, a skip link — and know which half axe will automate

## Next demo

**Demo 16 — Styling & Theming in React.** This app has zero lines of custom
CSS; your next job will not. The same `PriceTag` styled five ways — plain
CSS, CSS Modules, inline style, Tailwind, Bootstrap utilities — then the best
one kept; `clsx` and `cva` variants for `StockBadge`; and Demo 12's
`ThemeContext` persisted on `data-bs-theme` with no flash of the wrong
colours on load.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `react-hooks/refs: Cannot access ref value during render` | You read or wrote `.current` in the component body. Move it into an effect or a handler — or it was state all along. |
| `react-hooks/set-state-in-effect: Avoid calling setState() directly within an effect` | A synchronous `setState` in `useEffect`. Measuring? `useLayoutEffect`. Subscribing? `setState` in the callback, not the body. Deriving? Compute it during render. |
| `Untyped function calls may not accept type arguments` on `querySelector<HTMLElement>` | `fieldNodes.current ??= new Map()` lost its type arguments, so `.get()` returned `any`. Write `new Map<keyof ProductDraft, HTMLDivElement>()`. |
| `'ctx' is possibly 'null'` inside `draw()` | A hoisted `function` does not see the `if (!ctx) throw` above it. Use the `getContext` helper. |
| `/` does nothing, or Firefox opens quick-find | You are not on `/products` (the toolbar owns the shortcut), or `event.preventDefault()` is missing. Inside a text box a slash is a slash — by design. |
| Focus stays on **Create product** after a failed submit | The effect depends on `errors` (a new `{}` every render), or a field is missing its `<div ref={registerField(…)}>` wrapper. |
| Focus jumps to the heading while typing in the search box | `RouteAnnouncer` depends on `location` instead of `location.pathname`. |
| Screen reader says nothing on navigation | The live region is rendered conditionally, or the same text was set twice — clear it first. Check the `visually-hidden` div's text in Elements. |
| Grid scrolls into view, then the page jumps to the top | `preventScrollReset: true` is missing on the Pager's `updateFilters` call — ScrollRestoration ran after you. |
| Tooltip flashes at the wrong position | `BarTooltip` measures in `useEffect`. `useLayoutEffect`. |
| `chartPanelRef.current` is `null` right after `setShowChart(true)` | Batching — the panel is not rendered yet. `flushSync(() => setShowChart(true))`, then scroll. |
| After following a link in the drawer, focus lands on the cart button | `restoreFocus` fired after the announcer. The link's `onClick` must be `followLink`, which stands `restoreFocus` down before `close()`. |
