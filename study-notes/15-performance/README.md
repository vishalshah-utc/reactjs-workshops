# Module 15 — Performance & Optimisation

**Study notes** · ~2.5 hours

> **Goal.** Most React performance advice is `memo` everywhere, and most React
> apps that follow it are still slow. This module teaches the order that
> actually works: **measure**, fix the **structure**, memoise what is left,
> make the rest **interruptible**, render **fewer things**, ship **less code**
> — and then let the compiler write the memoisation for you.

**Prerequisites:** [Module 1 §17](../01-javascript-foundations/#17-the-event-loop-in-one-page)
(the single thread), [§22](../01-javascript-foundations/#22-purity-side-effects-and-referential-identity)
(purity and referential identity), [Module 2 §5](../02-react-introduction/#5-how-react-updates-the-screen)
(render and commit), [Module 5 §8](../05-props-and-composition/#8-children),
[Module 8 §13](../08-state-structure/#13-pushing-state-down),
[Module 9 §12–13](../09-reducers-and-context/#12-context-re-render-behaviour).

---

## Contents

1. [Measure first](#1-measure-first)
2. [What causes a re-render](#2-what-causes-a-re-render)
3. [Why re-renders are usually fine](#3-why-re-renders-are-usually-fine)
4. [`memo`](#4-memo)
5. [`useMemo`](#5-usememo)
6. [`useCallback`](#6-usecallback)
7. [Structural fixes that beat memoisation](#7-structural-fixes-that-beat-memoisation)
8. [Lists at scale: virtualisation](#8-lists-at-scale-virtualisation)
9. [Concurrent features: transitions and deferred values](#9-concurrent-features-transitions-and-deferred-values)
10. [Code splitting and the bundle budget](#10-code-splitting-and-the-bundle-budget)
11. [The React Compiler](#11-the-react-compiler)
12. [Rendering-level wins](#12-rendering-level-wins)
13. [Self-check](#13-self-check)
14. [References](#14-references)

**Hands-on.** [Demo 18 — Performance: Measure, then Fix](../../demos/18-performance/)
builds every section of this module into ShopScope, in this order: a `<Profiler>`
on the product grid, three structural fixes, a `memo` broken on purpose, a
deferred quick filter and a transition on the tabs, a virtualised 194-item
list, a bundle treemap with a budget, and the React Compiler deleting the
hand-written memoisation again. Read a section here, then do the lab.

---

## 1. Measure first

A performance fix without a measurement is a guess, and most guesses are wrong
in the same way: they optimise the component someone *suspects*, not the one
that is slow. Three tools, used in this order.

### 1.1 React DevTools Profiler

The **Profiler** tab of the React Developer Tools extension records every
**commit** while recording is on, and shows one bar per commit. Before you
record, open the gear and tick **"Record why each component rendered"**.

| View | What it answers |
|---|---|
| **Flamegraph** | Which components rendered in this commit, nested as in the tree; grey ones bailed out |
| **Ranked** | The same commit sorted by cost — the first three bars are usually the whole problem |
| Hover a component | **"Why did this render?"** — *parent rendered*, *props changed: x*, *hook n changed*, *context changed* |

The "why" tooltip is the most useful sentence in the tool. It tells you which of
the four causes in [§2](#2-what-causes-a-re-render) you are looking at, and each
cause has a different fix.

The Profiler only works on a **development** build; production builds compile
the instrumentation out and the tab refuses to record. Find *which* component
in development; confirm the win on a production build with the browser's tools.

### 1.2 `<Profiler>` in code

The DevTools tab is a UI over a public component. `<Profiler>` wraps a subtree
and calls `onRender` once per **commit** of that subtree:

```tsx
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { logger } from '../config/logger';

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  logger.debug(`[profiler] ${id} · ${phase} · actual ${actualDuration.toFixed(1)}ms · base ${baseDuration.toFixed(1)}ms`);
};

export function RenderProfiler({ id, children }: { id: string; children: ReactNode }) {
  if (!import.meta.env.DEV) return children;   // the raw constant, so the bundler deletes the branch
  return <Profiler id={id} onRender={onRender}>{children}</Profiler>;
}
```

```tsx
<RenderProfiler id="grid">
  <ProductGrid products={visible} />
</RenderProfiler>
```

| Argument | Meaning |
|---|---|
| `phase` | `'mount'`, `'update'`, or `'nested-update'` — an effect set state and forced a second pass before paint; a steady stream of these is a bug |
| `actualDuration` | What this commit really cost. Falls as children bail out |
| `baseDuration` | What it would cost with no memoisation anywhere — the ceiling |

`actual ≈ base` means nothing is being skipped. `actual` near zero against a
large `base` means memoisation is working. One number is noise; the shape of the
pair over a session is the signal.

### 1.3 The browser Performance panel

React's profiler measures React. The browser's **Performance** panel measures
everything: long tasks, layout, paint, script parse. Record it on a
**production build** (`npm run build && npm run preview`) with CPU throttling at
4× — a four-year-old phone, not your laptop. A long scripting block after an
input event is render work; layout after it is the DOM being measured; a wide
parse block at page load is bundle size ([§10](#10-code-splitting-and-the-bundle-budget)).
React 19's development builds add **Scheduler ⚛** and **Components ⚛** tracks
to the panel, so a render shows up next to the browser's work.

**Lighthouse** reports Core Web Vitals
([Module 3 §11](../03-rendering-architectures/#11-the-metrics-that-decide-arguments))
— a page-load tool, useless for "typing feels slow".

### 1.4 Three habits

Discard the first commit after a hot reload — it is always the slowest.
Optimise milliseconds, not render counts: a `useRenderCount` hook tells you
*how often*, the Profiler *how much*, and sixty renders at 0.02 ms is not a
problem. And make the slowness reproducible — a dev-only switch that burns time
inside a render (the demo's `spin()`) lets you see a fix instead of believing it.

📖 [react.dev — `<Profiler>`](https://react.dev/reference/react/Profiler)
📖 [react.dev — React Developer Tools](https://react.dev/learn/react-developer-tools)

**→ In the demos:** Demo 18, Lab 1 — slow mode, `RenderProfiler` and the "why did this render" recording.

---

## 2. What causes a re-render

A **render** is React calling your component function and getting a tree of
elements back. A **commit** is React comparing that tree with the previous one
and touching the DOM where they differ
([Module 2 §5](../02-react-introduction/#5-how-react-updates-the-screen)). A
component can render fifty times and cause zero DOM writes. "It re-rendered" is
not a bug report; "it was slow" is.

There are exactly four reasons a component renders again:

| Cause | What triggers it | What stops it |
|---|---|---|
| **Its own state changed** | `setState`, `dispatch`, a store selector returning a new value | Nothing — this one is the point |
| **Its parent rendered** | Anything above it rendered, for any reason | `memo`, the parent not owning that state, or receiving the child as `children` |
| **A context it reads changed** | The provider's `value` is a new value | Splitting the context, or a stable value |
| **Its `key` changed** | You gave it a different key | That is a remount, and usually deliberate |

Number two is the common one. In an unoptimised ShopScope, typing one letter
into the search box sets state on `ProductsPage`, so `ProductsPage` renders, so
its children render: the toolbar, the category strip, the grid, and twelve
`ProductCard`s whose props did not change. Hover any card in the Profiler:
**"Parent component rendered."**

Two things that do **not** cause a render: a prop "changing" to an equal value
(React does not compare props to decide whether to render a child — only
`memo` makes props matter, [§4](#4-memo)), and a ref changing
(`ref.current = x` schedules nothing, [Module 11](../11-refs-and-the-dom/)).

And one that does, surprisingly: **a context change goes straight through
`memo`**. `memo` compares props; a component that reads a context re-renders
whenever that context's value changes, memoised or not.

📖 [react.dev — Render and Commit](https://react.dev/learn/render-and-commit)

**→ In the demos:** Demo 18, Lab 1 — the four causes, read off the Profiler's tooltip.

---

## 3. Why re-renders are usually fine

React was designed so that re-rendering is cheap: calling a function, building
some objects, diffing. A `ProductCard` renders in about 0.05 ms. Twelve of them
on every keystroke is 0.6 ms — invisible, and not worth a line of code.

The arithmetic changes in exactly three situations:

| Situation | Why it hurts | Fix |
|---|---|---|
| **Large lists** | 194 cards × 0.05 ms is fine; 194 cards × their DOM nodes × a layout pass is not | Render fewer — [§8](#8-lists-at-scale-virtualisation) |
| **Expensive computation in render** | A sort over thousands of rows, a chart, a parse, on every keystroke | Cache it — [§5](#5-usememo); or defer it — [§9](#9-concurrent-features-transitions-and-deferred-values) |
| **Deep trees over frequent updates** | One keystroke → one state change → a thousand components called | Move the state — [§7](#7-structural-fixes-that-beat-memoisation); then `memo` — [§4](#4-memo) |

Everything else is premature. The threshold that matters is perceptual: a
response under ~100 ms feels instant; a frame at 60 fps is ~16 ms. If the
Profiler says a commit is 3 ms, leave it alone.

The order of fixes is not negotiable: **structure first, memoisation second,
compiler third.** Every piece of state you move is a `memo` you never write, a
dependency array you never keep correct, and a bug you never find. Sections
4–6 explain the memoisation tools properly, because you will meet them in every
codebase — but read [§7](#7-structural-fixes-that-beat-memoisation) before you
use them.

---

## 4. `memo`

`memo` wraps a component and tells React: **skip rendering this when its props
are shallow-equal to last time.**

```tsx
import { memo } from 'react';

function ProductCardImpl({ product, saved, onToggleSave }: ProductCardProps) {
  // …unchanged…
}

export const ProductCard = memo(ProductCardImpl);
```

When `ProductsPage` re-renders for reasons unrelated to the grid — a dialog
opening, a toast's `?flash` param being cleaned up — each `ProductCard`
compares its new props to its old ones, finds them equal, and returns the
previous result. In the Profiler, `actualDuration` collapses while
`baseDuration` stays put: that gap is `memo` working.

### 4.1 Shallow equality

"Shallow-equal" means `Object.is` on each prop, one level deep. Referential
identity, from [Module 1 §22](../01-javascript-foundations/#22-purity-side-effects-and-referential-identity),
is the whole of it:

```ts
Object.is(5, 5);                      // true  — numbers, strings, booleans, null: fine
Object.is('phone', 'phone');          // true
Object.is({}, {});                    // false — two different objects
Object.is([1], [1]);                  // false
Object.is(() => {}, () => {});        // false — a new function every render
```

So `memo` works on primitives and on references that were created once, and it
fails silently on anything created during the parent's render.

### 4.2 Breaking it with one line

```tsx
// ProductGrid — one harmless-looking addition
<ProductCard
  product={product}
  style={{ marginBottom: 0 }}          // ✗ a new object, every render, every card
/>
```

Open the dialog again: twelve cards, full cost, and the Profiler tooltip reads
**"Props changed: style"**. One inline object and the whole optimisation is
gone — while the code still *looks* optimised, which is why this is the bug you
will actually meet. An inline arrow (`onEdit={(p) => …}`), an inline array
(`columns={[…]}`) or an inline options object do exactly the same.

**A broken `memo` is slower than no `memo`**: you pay the comparison every
render and it never succeeds.

### 4.3 Not every prop needs wrapping

Before you reach for `useCallback` on every handler, look at what each prop
actually *is*:

```tsx
<ProductGrid
  onDelete={setPendingDelete}        // ✓ a useState setter — React guarantees stability
  onToggleSave={toggleSave}          // ✓ from a Zustand store — same function every time
  onAddToCart={addLine}              // ✓ same
  onEdit={(p) => setParam('edit', p.id)}   // ✗ the only one that breaks memo
/>
```

Three of four handlers needed nothing. `useCallback` everywhere is noise that
hides the one place it matters.

### 4.4 When `memo` cannot help

- **The component reads a context.** A context change bypasses `memo`
  entirely. Pass the value as a prop instead, or split the context
  ([§7.3](#73-split-the-context)).
- **The component takes `children`.** `<Wrapper><Grid /></Wrapper>` passes a
  new element as `children` on every parent render, so `memo(Wrapper)` never
  bails out. The fix is structural ([§7.2](#72-lift-content-into-children)).
- **The props genuinely change every time.** A card whose `product` object is
  rebuilt from fresh data has nothing to skip.

`memo(Component, areEqual)` accepts a custom comparator. Almost never use it: a
comparator that ignores a prop is a stale-render bug, and a deep comparison
usually costs more than the render it skips.

📖 [react.dev — `memo`](https://react.dev/reference/react/memo)

**→ In the demos:** Demo 18, Lab 3 — `memo(ProductCard)`, broken with an inline `style`, repaired.

---

## 5. `useMemo`

`useMemo` caches a **computed value** between renders and recomputes it only
when a dependency changes:

```tsx
const visible = useMemo(
  () => products.filter((p) => p.category === category).toSorted(byPrice),
  [products, category],
);
```

Same `Object.is` on each dependency as everywhere else. Two legitimate reasons
to use it, and only two:

**1. The computation is measurably expensive.** A sort of thousands of rows on
every keystroke; a histogram over every price; a parse. "Measurably" means the
Profiler said so. Filtering 500 products costs nothing you can see
([Module 6 §12](../06-conditional-rendering-and-lists/#12-filtering-sorting-and-deriving-lists)).

**2. The value's identity feeds something that compares identity.** A `memo`'d
child, an effect's dependency array
([Module 12 §7.5](../12-effects/#75-memoise--the-last-resort)), another
`useMemo`. The computation can be cheap; what you are buying is a stable
reference.

```tsx
// TeamPage — `render` closes over `needle`, so the columns cannot live at module scope.
// DataTable has an internal useMemo([rows, columns, sort]); a fresh array would defeat it.
const columns = useMemo(
  () => [
    { key: 'name', header: 'Name', render: (row) => highlight(`${row.firstName} ${row.lastName}`, needle) },
    { key: 'email', header: 'Email', render: (row) => highlight(row.email, needle) },
  ] satisfies Column<DirectoryUser>[],
  [needle],
);
```

Without the `useMemo`, clicking a column header — which only changes
`DataTable`'s own sort state — hands it a brand-new `columns` array, its cache
misses, and it re-sorts. With it, the array changes when the filter changes and
not otherwise.

### 5.1 Module scope is the best memoisation

A value that depends on nothing from a render should not be inside the
component at all:

```tsx
// ✓ created once, for the life of the module — no hook, no deps, no comparison
const SORT_OPTIONS = [{ value: 'price-asc', label: 'Price: low to high' }, …];

// ✗ a worse version of module scope
const options = useMemo(() => [ … ], []);
```

Reach for `useMemo` only when the value genuinely depends on props or state.

### 5.2 The cost of memoising something cheap

```tsx
const total = useMemo(() => price * quantity, [price, quantity]);   // ✗ a net loss
```

`useMemo` costs a slot in the hook list, a closure allocation, a dependency
comparison every render, and a line someone maintains. Multiplying two numbers
costs less than the comparison. The bar is not "could this be cached" but "did
the Profiler say so, or does something compare its identity".

And the dependency array is not optional. The same rule as effects
([Module 12 §6](../12-effects/#6-reactive-values-and-why-the-linter-is-right)):
every reactive value the callback reads goes in it. A `useMemo` with a missing
dependency returns a stale value — far worse than a slow one, because it is
*wrong* and nothing warns you.

📖 [react.dev — `useMemo`](https://react.dev/reference/react/useMemo)

**→ In the demos:** Demo 18, Lab 3 — the `useMemo` a filtered `DataTable` genuinely needs.

---

## 6. `useCallback`

`useCallback(fn, deps)` is `useMemo(() => fn, deps)`: it returns the **same
function identity** until a dependency changes.

```tsx
// `setSearchParams` is stable, so this is created once — which is what memo(ProductCard) needs.
const handleEdit = useCallback(
  (product: Product) => setParam('edit', product.id),
  [setSearchParams],
);

<ProductGrid onEdit={isAdmin ? handleEdit : undefined} />
```

It has exactly two jobs, and the second is older and more common than the
first:

**1. Feeding a `memo`'d child.** Without it, the inline arrow in
[§4.3](#43-not-every-prop-needs-wrapping) breaks the card's `memo` on every
render.

**2. Keeping someone else's dependency array honest.** A function you return
from a custom hook will end up in a consumer's `useEffect` or `useMemo` deps.
If its identity changes every render, that effect re-runs every render:

```tsx
export function useDebouncedCallback<TArgs extends unknown[]>(callback: (...args: TArgs) => void, delay = 400) {
  const callbackRef = useLatest(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable: a consumer whose effect depends on this will not restart the timer every keystroke.
  return useCallback((...args: TArgs) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }, [delay, callbackRef]);
}
```

This `useCallback` has nothing to do with `memo`. The debounced function is
*somebody else's dependency*; if its identity changed every render the debounce
would restart on every keystroke and never fire.

### 6.1 The stale-closure failure mode

```tsx
const handleAdd = useCallback(() => addToCart(product), []);   // ✗ always the FIRST product
```

The callback is created once and closes over the `product` of that first
render ([Module 1 §13](../01-javascript-foundations/#13-closures--and-why-your-state-looks-stale)).
A stale closure is worse than a slow render: the handler holds last week's
value. List the dependency, or use an updater function so the callback does not
need to read state at all.

### 6.2 What does not need it

`useState` setters and `dispatch` (React guarantees stability); functions from
a Zustand store or a ref (stable by construction); handlers on plain DOM
elements (`<button onClick>` does no comparison); and any function nobody
compares. If no `memo` child and no dependency array receives it, `useCallback`
is pure cost.

📖 [react.dev — `useCallback`](https://react.dev/reference/react/useCallback)

**→ In the demos:** Demo 18, Lab 3 — `handleEdit`, and the `useCallback`s already in `useDebouncedCallback` and `useControllableState` explained.

---

## 7. Structural fixes that beat memoisation

Everything in §4–6 adds a comparison that runs on every render, forever, and
can be silently defeated by one inline object. The fixes in this section cost
nothing at runtime, cannot be broken by a prop, and usually make the code
clearer. **Try these first.** They are the composition patterns from
[Module 5 §13](../05-props-and-composition/#13-composition-patterns) used as
performance tools.

| Move | When | Cost |
|---|---|---|
| **Push state down** | Only one component *shows* the value | Free — a smaller blast radius |
| **Lift content into `children`** | The state's owner does not *read* the content | Free — one prop, no comparison |
| **Split the context** | Consumers want different parts at different rates | One extra provider |
| **Colocate state** | State lives higher than the components that use it | Free |
| *`memo`* | *None of the above apply* | *A props comparison on every render* |

### 7.1 Push state down

The search draft is shown by exactly one component: the search box. It does not
belong on the page, where every keystroke renders twelve cards.

```tsx
// ✓ the toolbar owns the draft; the page learns about it when typing pauses
function ProductToolbar({ query, onQueryCommit }: ProductToolbarProps) {
  const [draft, setDraft] = useState(query);
  const commit = useDebouncedCallback(onQueryCommit, 400);

  function handleChange(value: string) {
    setDraft(value);     // instant — this component and nothing else
    commit(value);       // 400 ms later — the URL, the loader, the network
  }
  // …
}
```

The grid does not render until the debounce fires and the loader returns. No
`memo` was written, and the page lost four locals and a whole concern
([Module 8 §13](../08-state-structure/#13-pushing-state-down)).

The test is **"who *shows* this value?"**, not "who changes it". State that two
siblings read cannot go down — it will be lifted back within a week, or
duplicated and allowed to drift.

### 7.2 Lift content into `children`

Sometimes the state cannot go down because the owner genuinely needs it high
up. Then move it *up, into a component that receives the expensive content from
above*:

```tsx
// ProductsSurface owns ONE piece of state: whether the price chart is open.
export function ProductsSurface({ title, actions, toolbar, products, children }: ProductsSurfaceProps) {
  const [showChart, setShowChart] = useState(false);

  return (
    <>
      <PageHeader title={title} actions={<>{actions}<Button onClick={() => setShowChart((o) => !o)}>Prices</Button></>} />
      {toolbar}
      {showChart && <PriceHistogram products={products} />}
      {children}
    </>
  );
}
```

```tsx
// ProductsPage creates the grid element; ProductsSurface never learns what a grid is.
<ProductsSurface title="All products" products={visible} toolbar={<ProductToolbar … />}>
  <ProductGrid products={visible} />
</ProductsSurface>
```

Why it works: `<ProductGrid products={visible} />` is an object —
`{ type: ProductGrid, props: {…} }` — created during *`ProductsPage`'s* render.
When `setShowChart` re-renders `ProductsSurface`, `ProductsPage` did not render,
so `children` is the **same object** as last time. React compares it to the
previous tree, finds it identical, and skips the whole subtree. No `memo`, no
props comparison, no dependency array: the cheapest bail-out React has.

**Content passed in cannot be re-rendered by state that lives here.** The same
holds for `actions` and `toolbar` — any prop that is an element.

The one way to break it:

```tsx
<ProductsSurface>{() => <ProductGrid … />}</ProductsSurface>    // ✗ a render function
```

A function is *called* during `ProductsSurface`'s render, so the grid is
rebuilt every time. The effect depends on `children` being an element, created
elsewhere, passed through untouched.

### 7.3 Split the context

A context re-renders **every consumer** when its value changes
([Module 9 §12](../09-reducers-and-context/#12-context-re-render-behaviour)),
and `memo` does not stop it. If consumers want different parts at different
rates, give them different contexts:

```tsx
// ✗ one context: every push rebuilds the object, every consumer of EITHER half re-renders
<ToastContext value={{ toasts, dispatch }}>

// ✓ two contexts: the list changes on every toast; dispatch never changes
const ToastStateContext = createContext<ToastItem[] | undefined>(undefined);
const ToastDispatchContext = createContext<Dispatch<ToastAction> | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastsReducer, []);
  return (
    <ToastStateContext value={toasts}>
      <ToastDispatchContext value={dispatch}>
        {children}                 {/* an element from main.tsx — skipped on every toast */}
        <ToastViewport />          {/* the ONLY component that reads the list */}
      </ToastDispatchContext>
    </ToastStateContext>
  );
}
```

`ProductsPage` calls `useToastDispatch()`, not `useToasts()`. `dispatch` is
identity-stable for the provider's life, so that context's value never changes
and the page never re-renders for a toast. Note that `{children}` here is also
[§7.2](#72-lift-content-into-children) at work: the whole app is an element
created by `main.tsx`, so React skips it on every push.

Do not *assume* a split works — a `useMemo` on a provider value with the wrong
dependencies is common. It is one `<Profiler>` line to check
([Module 9 §13](../09-reducers-and-context/#13-splitting-contexts)).

### 7.4 Colocate state, and know when structure cannot win

A component with twelve `useState` calls and a `memo` on every child is the
tell: the state is in the wrong place and the `memo`s are scar tissue. Move each
piece of state to the lowest component that shows it, and most of the `memo`s
become unnecessary.

Sometimes the state genuinely belongs high up. ShopScope's density toggle is
rendered in the page header and read by the grid — two siblings whose only
common ancestor is the page. It cannot be pushed down, and it should not go in
the URL either, because React Router re-runs the loader on any search-param
change. "We looked, and here is why it stays" is a result. That is where
[§4](#4-memo) earns its keep, and where [§9](#9-concurrent-features-transitions-and-deferred-values)
makes the click feel instant anyway.

📖 [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
📖 [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

**→ In the demos:** Demo 18, Lab 2 — the search draft pushed into the toolbar, the grid as `children` of `ProductsSurface`, the split `ToastContext` proved with a Profiler.

---

## 8. Lists at scale: virtualisation

Rendering 194 product cards is not slow because React is slow. It is 194 sets
of DOM nodes, 194 images, and one browser layout pass over all of them — on
every commit that touches the list. Past a few hundred rows, no amount of `memo`
helps, because the DOM itself is the cost.

**Virtualisation renders the rows you can see and lies convincingly about the
rest.** Three pieces: a **scroll container** with a fixed height; a **spacer**
as tall as every row added together, so the scrollbar is honest; and **only the
visible rows**, absolutely positioned where the virtualiser says. Scroll, and
the same dozen `<li>` elements are reused with different content.

### 8.1 `useVirtualizer` from TanStack Virtual

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function ProductRowList({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,                                   // how many exist — not how many you render
    getScrollElement: () => scrollRef.current,                // the node that actually scrolls
    estimateSize: () => 96,                                   // a guess, used before a row is measured
    overscan: 6,                                              // extra rows above and below the viewport
    measureElement: (node) => node.getBoundingClientRect().height,   // the real height, once rendered
    getItemKey: (index) => products[index]?.id ?? index,      // a stable key per PRODUCT, not per slot
  });

  return (
    // 1. the viewport
    <div ref={scrollRef} style={{ height: 420, overflowY: 'auto' }} role="region" aria-label="All products, scrollable">
      {/* 2. the spacer */}
      <ul className="list-unstyled position-relative" style={{ height: virtualizer.getTotalSize() }}>
        {/* 3. only the visible rows; data-index + ref is how measureElement knows which row it measured */}
        {virtualizer.getVirtualItems().map((item) => (
          <li
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="position-absolute w-100"
            style={{ top: 0, left: 0, transform: `translateY(${item.start}px)` }}
          >
            <ProductRow product={products[item.index]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

| Option | What it is |
|---|---|
| `count` | Total items. The virtualiser decides how many to render |
| `getScrollElement` | Returns the scrolling node. `useWindowVirtualizer` exists for lists that scroll with the page |
| `estimateSize` | Pixels per row *before* measurement. Wrong by a lot and the scrollbar jumps as it corrects |
| `overscan` | Rows rendered outside the viewport so a fast scroll does not show white |
| `measureElement` | How to measure a row **for real**. Required for variable heights, via `ref={virtualizer.measureElement}` + `data-index` |
| `getItemKey` | A stable key per item. Without it, `key={item.index}` reuses the wrong DOM node as you scroll |

`estimateSize` alone gives a list where every row is assumed to be the same
height forever. With `measureElement` and the `ref` on each row, a
`ResizeObserver` replaces each estimate with the real number as it scrolls
past. Delete it and scroll to the bottom of a list with wrapping descriptions:
the scrollbar drifts by hundreds of pixels.

### 8.2 Rows before grids, and what it costs

Virtualising a **grid** means telling the virtualiser how many cards fit per
row, recomputing that on resize, and keeping it in step with every breakpoint.
TanStack Virtual can (`lanes`), but virtualise the one-dimensional thing first,
and reach for a virtualised grid only when a measurement says the grid is the
problem. A paginated grid showing twelve is not.

Virtualisation has real costs: find-in-page stops working for rows that are not
rendered; screen readers see a dozen items in a list that claims hundreds (give
the container a `role` and a label); and you have added a scroll container, a
`ResizeObserver` and a dependency — to save 0.4 ms on a list of thirty. Pay for
it when the measurement says to. Stable keys from data
([Module 6 §10](../06-conditional-rendering-and-lists/#10-choosing-a-key))
still apply.

📖 [TanStack Virtual — `useVirtualizer`](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)
📖 [TanStack Virtual — Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)

**→ In the demos:** Demo 18, Lab 5 — `ProductRowList`: 194 products, about eleven `<li>`.

---

## 9. Concurrent features: transitions and deferred values

Two updates are left that no amount of structure or `memo` can fix, because in
both the expensive thing *is* what the user asked for. A filter over the
products on screen must re-render the grid; a density toggle must re-lay out
every card. The work is necessary. The *waiting* is not.

### 9.1 One thread, and what may interrupt what

React runs on the single JavaScript thread
([Module 1 §17](../01-javascript-foundations/#17-the-event-loop-in-one-page)).
Before React 18 every update was equally urgent: `setState` started a render
that ran to completion, and the browser painted nothing — not even the
character you typed — until it finished.

Concurrent rendering lets you mark an update as **non-urgent**. React then
renders it in the background, keeping the previous UI on screen; paints urgent
updates (typing, clicks) *during* that work; and throws the background work
away and restarts if a newer update arrives. Nothing renders faster —
`actualDuration` is unchanged. What changes is that the keystroke paints first.

### 9.2 `useTransition` — you own the event

```tsx
import { useState, useTransition } from 'react';

function ProductsPage() {
  const [density, setDensity] = useState<Density>('comfortable');
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => startTransition(() => setDensity('compact'))}>Compact</Button>
      {isPending && <Spinner size="sm" role="status" aria-label="Re-laying out the grid" />}
      <ProductGrid products={visible} density={density} />
    </>
  );
}
```

Click **Compact**: the button flips immediately, the spinner appears, the old
grid stays on screen for the ~100 ms the re-layout takes, then the new one
replaces it in one commit. The UI never froze.

A spinner, not a disabled button: the point of a transition is that the UI
stays interactive while it runs, and disabling the control you just made
responsive throws the win away.

Two updates from one click is a common shape:

```tsx
function select(next: string) {
  setRequested(next);                          // URGENT — the tab can show its spinner this frame
  startTransition(() => setSelected(next));    // TRANSITION — the panel may render in the background
}
```

`startTransition` is also exported from `react` on its own, for code that
cannot call hooks (a store, a utility); you lose `isPending`. And in React 19
the callback may be `async`: updates after the `await` are still part of the
transition and `isPending` stays true until the promise settles — the
mechanism behind Actions and `useActionState`
([Module 19](../19-server-components/)).

### 9.3 `useDeferredValue` — you are handed a value

When the state is a prop, or comes from a hook you do not control, you cannot
wrap the `setState`. Defer the *value* instead:

```tsx
import { useDeferredValue, useState } from 'react';

const [quickFilter, setQuickFilter] = useState('');
const deferredFilter = useDeferredValue(quickFilter);
const filterIsStale = quickFilter !== deferredFilter;

const needle = deferredFilter.trim().toLowerCase();           // ← the deferred one
const visible = needle
  ? products.filter((p) => `${p.title} ${p.brand ?? ''} ${p.category}`.toLowerCase().includes(needle))
  : products;

<Form.Control value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)} />   {/* the LIVE one */}
<div style={{ opacity: filterIsStale ? 0.55 : 1, transition: 'opacity 120ms linear' }} aria-busy={filterIsStale}>
  <ProductGrid products={visible} />
</div>
```

React renders twice: once urgently with the new input value and the **old**
`deferredFilter`, so the caret moves; then again in the background with the
new one. While the two disagree, the list is one keystroke behind — so say so.
The `opacity` is not decoration: stale results with no explanation read as a
broken filter. `aria-busy` is the same message for anyone not looking at the
pixels.

**The one line that matters** is `products.filter(… deferredFilter …)`. Filter
by the live `quickFilter` instead and you have the code you had before, with an
unused hook.

### 9.4 Choosing between them

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| You have | the **event** that causes the update | a **value** you are given |
| You write | `startTransition(() => setX(next))` | `const deferred = useDeferredValue(x)` |
| You get | `isPending` | `x !== deferred` |
| Use it | where you own the `setState` | when the state is a prop, or from a hook you do not control |

The rule that survives contact with a product: **urgent is what the user just
did; non-urgent is what you decided to show them because of it.** Typing,
clicking, dragging — urgent. The list, the chart, the preview, the route you are
navigating to — transitions. React Router already wraps navigations in one,
which is why `useNavigation().state` exists at all.

### 9.5 Mistakes

- **Deferring the input's own value.** The text you type is always urgent.
  Defer what is *derived* from it, never the controlled `value`, or the caret
  jumps.
- **No stale indicator.** `useDeferredValue` with no feedback is worse than none.
- **Expecting `actualDuration` to fall.** Transitions change *when* work
  happens, not how much. Work that is simply too big gets virtualised ([§8](#8-lists-at-scale-virtualisation)).
- **A transition around a cheap update.** If the render is 3 ms, the spinner
  is a flicker. Measure first.

📖 [react.dev — `useTransition`](https://react.dev/reference/react/useTransition)
📖 [react.dev — `startTransition`](https://react.dev/reference/react/startTransition)
📖 [react.dev — `useDeferredValue`](https://react.dev/reference/react/useDeferredValue)

**→ In the demos:** Demo 18, Lab 4 — `useDeferredValue` on the quick filter, `useTransition` on the density toggle and `Tabs`.

---

## 10. Code splitting and the bundle budget

The thing nobody profiles: a ShopScope production build ships about 620 kB of
JavaScript in its entry chunk, to be downloaded, parsed and executed *before
the first render*. Nothing you do inside React beats not shipping the code.

### 10.1 `lazy` and `Suspense`

A dynamic `import()` tells the bundler to put that module in its own chunk,
fetched on first use. `lazy` wraps it as a component; `Suspense` says what to
show while the chunk loads:

```tsx
import { lazy, Suspense } from 'react';

// `lazy` wants a module whose DEFAULT export is the component; this codebase uses named exports.
const PriceHistogram = lazy(() =>
  import('./PriceHistogram').then((m) => ({ default: m.PriceHistogram })),
);

{showChart && (
  <Suspense fallback={<Placeholder style={{ height: 150 }} />}>
    <PriceHistogram products={products} />
  </Suspense>
)}
```

The histogram is the only thing in the app that pulls in the canvas-drawing
code, and it sits behind a disclosure most people never open. After this change
it is a 4 kB chunk that most sessions never download.

Where to split, in order of payoff: **routes** (React Router's `lazy` route
property, [Module 14](../14-routing/), does this without a `Suspense` of your
own); **heavy components behind a disclosure or tab** — charts, editors, maps;
**admin-only features**. Do not split tiny components: each chunk is a network
round trip, and twenty 2 kB chunks are slower than one 40 kB one.

Declare `lazy` components at **module scope**, never inside another component —
a `lazy()` call during render creates a new component type every time, which
remounts the subtree ([Module 8 §14](../08-state-structure/#14-state-lives-at-a-position-in-the-tree)).

### 10.2 Look at the bundle

Vite 8 bundles with Rolldown and runs Rollup-compatible plugins, so
`rollup-plugin-visualizer` 7 draws a treemap of the finished build:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // A REPORT, not a transform — behind an env flag so a normal build stays fast.
    process.env.ANALYZE
      ? visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true })
      : null,
  ],
});
```

```json
"build:analyze": "tsc -b && ANALYZE=1 vite build"
```

Write it in that order: `ANALYZE=1 tsc -b && vite build` sets the variable for
`tsc` only. Open `dist/stats.html`: `react-dom` is the largest single thing and
always will be; then the UI library, the router, the HTTP client, the validator.
Find your lazy components — they should be their own boxes.

### 10.3 Tree-shaking and the cost of one dependency

A bundler drops exports nobody imports — but only for ES modules, only without
side effects, only for static imports. `import moment from 'moment'` pulls in
~70 kB because it is one CommonJS object with every locale attached. The
browser already has the answer:

```ts
// Constructed ONCE at module scope; `new Intl.DateTimeFormat()` per call is the expensive part.
const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

/** An ISO string from the API → "14 Apr 2025". */
export const formatDate = (iso: string) => mediumDate.format(new Date(iso));
```

Six lines, zero bytes shipped. One careless dependency outweighs every `memo`
in the codebase, and it is the most common way a page gets slower — added at
5pm on a Friday, noticed six months later on a phone.

### 10.4 A budget, not a report

A treemap nobody looks at is not a control. A budget fails the build:

```js
// scripts/check-bundle-size.mjs — raw kilobytes, because raw is what the browser PARSES
const DEFAULT_MAX_KB = 680;

const rows = readdirSync(DIST).filter((f) => f.endsWith('.js'))
  .map((file) => ({ file, kb: statSync(join(DIST, file)).size / 1024 }))
  .sort((a, b) => b.kb - a.kb);

for (const row of rows) console.log(`${row.kb > maxKb ? '✗' : '✓'} ${row.kb.toFixed(1)} kB  ${row.file}`);
if (rows.some((row) => row.kb > maxKb)) process.exit(1);
```

**680 is not a number from the internet.** It is what the app measures today
(619.6 kB) plus about 9 % headroom. That is the only honest way to pick a
budget: measure, add room, and move it deliberately when you add something on
purpose.

`size-limit` is the off-the-shelf version of this script: a `"size-limit"`
block in `package.json` with a glob and a limit, and a CLI that exits non-zero.
Either way the check runs in CI, next to the tests. Vite's own
`build.chunkSizeWarningLimit` (500 kB by default) warns; it does not fail,
which is why it is not a budget. And budget on **raw** size: gzip is what
crosses the network; raw is what the parser chews. A 200 kB gzipped bundle is
still 620 kB of parsing on the phone.

📖 [react.dev — `lazy`](https://react.dev/reference/react/lazy)
📖 [react.dev — `Suspense`](https://react.dev/reference/react/Suspense)
📖 [Vite — Building for Production](https://vite.dev/guide/build)

**→ In the demos:** Demo 18, Lab 5 — `lazy(PriceHistogram)`, `build:analyze`, `check:bundle` at 680 kB, and `formatDate` over `Intl`.

---

## 11. The React Compiler

Look at what [§4–6](#4-memo) cost: a renamed component and a `memo` wrapper, a
`useCallback` with a dependency array to keep correct, a `useMemo` around a
columns array — and one inline `style` away from all of it being pointless.
Every line is mechanical, and a compiler works out which values depend on which
inputs far more reliably than a person reviewing a pull request at 5pm.

### 11.1 What it does

The React Compiler (`babel-plugin-react-compiler` 1.0) reads each component and
hook at build time, builds a dependency graph of every value inside, and emits
a cache — `react/compiler-runtime`, which React 19 ships — so a value is
recomputed only when something it depends on changes. Props, JSX elements,
callbacks, derived arrays: all of them, at a granularity no human writes by
hand.

In effect, every component becomes `memo`'d, every derived value `useMemo`'d,
every handler `useCallback`'d — without the code. And because it caches the
*JSX* too, the inline `style={{ marginBottom: 0 }}` that broke `memo` in
[§4.2](#42-breaking-it-with-one-line) cannot break this: the object is cached
as well.

### 11.2 What it assumes

It memoises everything it can prove is safe, and it decides that by assuming
you followed the **Rules of React**:

- **Components and hooks are pure.** Same props and state in, same JSX out, no
  side effects during render ([Module 1 §22](../01-javascript-foundations/#22-purity-side-effects-and-referential-identity)).
- **You do not mutate props, state, or anything a hook returned.**
- **Hooks are called unconditionally, at the top level.**
- **Refs are not read or written during render.** A ref is a mutable box the
  compiler deliberately refuses to reason about.

It cannot verify all of that, which is why `eslint-plugin-react-hooks` 7 ships
the compiler's own analysis as lint rules — `react-hooks/refs`,
`react-hooks/set-state-in-effect`, `react-hooks/purity`, `react-hooks/immutability`.
**Lint first, fix what it finds, then enable the compiler.** In that order it is
a config change; in the other, a debugging session. Code the compiler cannot
prove safe is simply skipped — it does not break it, it leaves it uncompiled.
Class components are skipped entirely.

### 11.3 Turning it on

With `@vitejs/plugin-react` 6 the switch is `react({ compiler: true })`, which
runs the compiler through oxc and needs the optional `oxc-transform-react`
package. If you cannot add that package — the demo's pinned set cannot — run
the Babel plugin from a short `enforce: 'pre'` Vite plugin:

```ts
// vite.config.ts
import { transformAsync } from '@babel/core';
import reactCompiler from 'babel-plugin-react-compiler';
import type { Plugin } from 'vite';

function reactCompilerPlugin(): Plugin {
  const include = /\/src\/.*\.tsx?$/;
  return {
    name: 'shopscope:react-compiler',
    enforce: 'pre',                              // before plugin-react: we see TSX and hand back TSX
    async transform(code, id) {
      if (!include.test(id)) return null;
      const result = await transformAsync(code, {
        filename: id, babelrc: false, configFile: false, sourceMaps: true,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: [[reactCompiler, { target: '19' }]],   // emits react/compiler-runtime, which 19.3 ships
      });
      return result?.code ? { code: result.code, map: result.map as never } : null;
    },
  };
}

export default defineConfig({ plugins: [reactCompilerPlugin(), react()] });
```

Then verify it ran rather than assume: React DevTools shows a **✨ Memo ✨**
badge next to every compiled component in the Components tab, and
`grep -o useMemoCache dist/assets/*.js | sort | uniq -c` counts the cache slots
in the build. A plugin that silently matched nothing is the failure mode.

### 11.4 Then delete the memoisation

```tsx
// ProductCard.tsx — the memo() wrapper and the *Impl rename: gone
export function ProductCard({ product, … }: ProductCardProps) { … }

// ProductsPage.tsx — the useCallback: gone
onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}

// TeamPage.tsx — the useMemo: gone
const columns = [ … ] satisfies Column<DirectoryUser>[];
```

Re-profile: the same `actual ~3 ms` against `base ~118 ms` that the
hand-written `memo` produced, with none of the code.

**Do not delete memoisation that is doing a different job.** A `useMemo` or
`useCallback` whose *identity* something outside React depends on — a ref
callback feeding a `ResizeObserver`, an object handed to a non-React library —
is not about re-renders. Leave it.

### 11.5 What it does not do

| Problem | Compiler? | Fix |
|---|---|---|
| Wasted re-renders from unstable props | **Yes** | — |
| State in the wrong place | No | [§7](#7-structural-fixes-that-beat-memoisation) |
| A list that renders everything | No | [§8](#8-lists-at-scale-virtualisation) |
| A necessary render that blocks typing | No | [§9](#9-concurrent-features-transitions-and-deferred-values) |
| A 620 kB bundle | No | [§10](#10-code-splitting-and-the-bundle-budget) |
| A request that is slow, or made twice | No | [Module 13](../13-data-fetching-and-custom-hooks/) |

It removes the mechanical category of work and leaves every architectural
decision to you. Teams that turn it on delete thousands of lines of `memo`,
`useCallback` and `useMemo`, stop arguing about them in review, and find their
remaining problems are all structure, lists and bundles.

`'use no memo'` as the first statement in a component or hook opts it out;
narrowing the plugin's `include` opts out a folder. Both are a note-to-self with
a date on it, not a solution — fix the rule violation instead.

📖 [react.dev — React Compiler](https://react.dev/learn/react-compiler)
📖 [react.dev — Rules of React](https://react.dev/reference/rules)

**→ In the demos:** Demo 18, Lab 6 — the compiler on via a Vite plugin, Lab 3's memoisation deleted, the grid re-profiled.

---

## 12. Rendering-level wins

Everything above runs *after* the JavaScript has arrived. The largest numbers
on a performance budget are earlier than that, and the fix is architectural
([Module 3](../03-rendering-architectures/)):

- **Nothing in the client beats not shipping the JavaScript at all.** A Server
  Component ([Module 19](../19-server-components/)) renders on the server and
  sends HTML; its code and its dependencies never reach the bundle.
- **Server rendering** puts content on screen before the bundle has parsed —
  on a phone, the difference between a 1 s and a 3 s first paint
  ([Module 3 §2](../03-rendering-architectures/#2-server-side-rendering-ssr)).
- **A cache in front of the network** removes the request that no `memo` can
  speed up. Loaders fetch; they do not remember — a query cache does
  ([Module 13 §8](../13-data-fetching-and-custom-hooks/#8-tanstack-query)).
- **Images.** `loading="lazy"`, `width`/`height` to avoid layout shift, a
  modern format. Often the largest bytes on the page and not JavaScript at all.

The point of mentioning them here is proportion: a 50 ms render fix is real,
and a 2 s bundle-parse fix is forty of them. The full policy — what to reach
for, in order, and where each tool lives in ShopScope — is the wrap-up table of
[Demo 18](../../demos/18-performance/).

---

## 13. Self-check

1. What is the difference between a render, a commit and a DOM update? Which
   one does the Profiler count?
2. Name the four causes of a re-render, and give the fix that matches each.
3. What do `actualDuration` and `baseDuration` mean? What does
   `actual ≈ base` tell you, and what does `actual ≪ base` tell you?
4. Why can you not use the DevTools Profiler on a production build, and what
   do you use instead?
5. Give the three situations in which re-renders stop being fine.
6. Exactly what does `memo` compare? Write five `Object.is` results from
   memory, and say which prop types therefore break it.
7. Why is a broken `memo` slower than no `memo`?
8. Why does a context change go straight through `memo`? Why does
   `memo(Wrapper)` never bail out when `Wrapper` takes `children`?
9. Give the only two legitimate reasons to use `useMemo`, and list the costs
   of `useMemo(() => a + b, [a, b])`.
10. When is module scope better than `useMemo`?
11. Name `useCallback`'s two jobs. Which is more common?
12. Explain the stale-closure bug in `useCallback(() => addToCart(product), [])`.
13. Which of these needs `useCallback` before being passed to a `memo`'d
    child: a `useState` setter · an inline arrow · `dispatch` · a Zustand
    action · a function from a custom hook that did not wrap it?
14. Why does passing the grid as `children` stop the chart disclosure from
    re-rendering it? Be precise about *which render* created the element.
    What is the one way to break it?
15. What is the test for whether a piece of state can be pushed down?
16. Why is `{ toasts, dispatch }` as one context value a problem, and why is
    `dispatch` safe as its own context value?
17. Name the three pieces of a virtualised list. What does `estimateSize` do,
    what does `measureElement` add, and what happens to the scrollbar if you
    omit the second?
18. Why `getItemKey` rather than `key={item.index}`? Give two costs of
    virtualisation that are not performance.
19. What does "interruptible rendering" mean on a single thread? Does it make
    a render faster?
20. `useTransition` vs `useDeferredValue`: what do you *have* in each case,
    and what do you *get*?
21. Why must you never defer a controlled input's own value, and why does
    `useDeferredValue` need a visible stale indicator?
22. Why must `lazy` components be declared at module scope?
23. Why `tsc -b && ANALYZE=1 vite build` and not `ANALYZE=1 tsc -b && vite build`?
24. Why budget on raw size rather than gzipped? How should the number be
    chosen?
25. Why does `import moment from 'moment'` cost 70 kB when you use one
    function, and what replaces it for free?
26. What does the React Compiler assume about your code? What happens to a
    component it cannot prove safe, and to a class component?
27. Name four problems the compiler does not solve, and one kind of
    memoisation you should *not* delete after enabling it.

### Practical

1. Add a dev-only `spin()` to `ProductCard`, wrap the grid in a `<Profiler>`,
   and record a keystroke with "why did this render" on. Write down the cause.
2. Profile a slow list, find the actual cause, and fix it *structurally* —
   push the state down or lift the content into `children` — before reaching
   for `memo`. Prove the fix with `actualDuration`.
3. Wrap `ProductCard` in `memo`, break it deliberately with an inline `style`
   object, read the Profiler's "Props changed" tooltip, then fix it. Audit the
   four handler props and wrap only the one that needs `useCallback`.
4. Add `useDeferredValue` to a client-side filter over a heavy list, with a
   dimmed stale state and `aria-busy`. Feel the difference while typing with
   the hook on and off.
5. Add a `useTransition` to a tab switch that renders an expensive panel, with
   a spinner on the pending tab, not a disabled button.
6. Virtualise a 200-row list with `useVirtualizer`, including `measureElement`
   for variable heights. Delete `measureElement`, scroll to the bottom, and
   watch the scrollbar drift.
7. Lazy-load one component behind a disclosure, generate a treemap with
   `rollup-plugin-visualizer`, and add a budget script that fails the build.
   Pick the number from a measurement.
8. Turn on the React Compiler, confirm the **✨ Memo ✨** badge, delete the
   memoisation from exercise 3, and re-profile.

---

## 14. References

Official documentation only: react.dev for React, and the TanStack Virtual
and Vite documentation for those tools.

**Measuring**
- [`<Profiler>`](https://react.dev/reference/react/Profiler)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Render and Commit](https://react.dev/learn/render-and-commit)

**Memoisation**
- [`memo`](https://react.dev/reference/react/memo)
- [`useMemo`](https://react.dev/reference/react/useMemo)
- [`useCallback`](https://react.dev/reference/react/useCallback)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)

**Structure**
- [Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

**Concurrent features**
- [`useTransition`](https://react.dev/reference/react/useTransition)
- [`startTransition`](https://react.dev/reference/react/startTransition)
- [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)

**Lists at scale**
- [TanStack Virtual — React adapter](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)
- [TanStack Virtual — Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)
- [TanStack Virtual — Dynamic (variable-height) example](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)

**Code splitting and the bundle**
- [`lazy`](https://react.dev/reference/react/lazy) · [`Suspense`](https://react.dev/reference/react/Suspense)
- [Vite — Building for Production](https://vite.dev/guide/build)
- [Vite — Dynamic Import](https://vite.dev/guide/features#dynamic-import)
- [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode)

**The React Compiler**
- [React Compiler](https://react.dev/learn/react-compiler)
- [React Compiler — Installation](https://react.dev/learn/react-compiler/installation)
- [React Compiler — Configuration](https://react.dev/reference/react-compiler/configuration)
- [Rules of React](https://react.dev/reference/rules)
- [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

---

**Previous:** [Module 14 — Routing & Application Architecture](../14-routing/)
**Next:** [Module 16 — Advanced Patterns, Error Boundaries & Portals](../16-advanced-patterns/)
