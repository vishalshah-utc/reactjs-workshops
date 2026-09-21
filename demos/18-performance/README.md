# Demo 18 — Performance: Measure, then Fix

**Demo guide** · ~120 minutes · the Profiler first, structure second, `memo` third — and then a compiler that deletes the third

---

## Where you are starting from

The starter is **Demo 17, finished**: a compound `<Tabs>` on the detail page,
a `Pager` and a `CategoryStrip` that work controlled *or* uncontrolled, a
polymorphic `<Text as>`, a generic `<DataTable<T>>`, a `createPortal` dialog
with a focus trap, `react-error-boundary` per widget, and `src/legacy/`'s HOC
and render prop rewritten as hooks.

It is also slow in all the usual ways, and nobody has measured any of them.
`ProductsPage` owns the search draft, so a keystroke re-renders twelve product
cards. It owns the price chart's disclosure, so opening a chart re-renders the
same twelve. `ProductCard` takes five optional handler props and every one of
them is a new function on every render. Today you measure first and fix second,
in that order, every time.

New stubs: `src/lib/slowMode.ts`, `src/components/RenderProfiler.tsx`,
`ProductsSurface.tsx`, `ProductRowList.tsx`, `scripts/check-bundle-size.mjs`.
Already there so you only write the interesting part:
`types/babel-react-compiler.d.ts` (ambient declarations for two untyped
packages) and a `tsconfig.node.json` that lets `vite.config.ts` read
`process.env`.

New dependencies: **`@tanstack/react-virtual@3.14.13`**,
**`rollup-plugin-visualizer@7.1.1`** and **`babel-plugin-react-compiler@1.0.0`**
— all three in `package.json` since Demo 15's Part 6 set, already installed,
imported for the first time today.

## What you ship today

A **profiled** product grid: a dev-only slow mode that makes a card cost 4.5 ms
instead of 0.05 ms, and a `<Profiler>` wrapper logging every commit through the
app's own logger. Three **structural** fixes that need no `memo` at all — the
search draft pushed down into the toolbar, the grid passed as `children` to the
component that owns the chart disclosure, and a split context proved rather than
assumed. A **`memo(ProductCard)`** broken on purpose with an inline object and
repaired with `useCallback`, plus the `useMemo` a filtered `DataTable` genuinely
needs. A quick filter on **`useDeferredValue`** and a tab switch on
**`useTransition`**, both with honest pending states. All 194 products
**virtualised** into eleven `<li>`. A **bundle treemap** and a **budget that
fails CI**. And the **React Compiler** on, with every hand-written line of
memoisation deleted again.

By the end you will be able to answer, without hesitating:

- What the Profiler's `actualDuration` and `baseDuration` mean, and what "render ≠ commit ≠ DOM update" costs you when you forget it
- The four things that cause a re-render, and which of them `memo` can stop
- Why passing content as `children` beats memoising it, and when you cannot
- Exactly what `memo` compares, and the one line of JSX that silently disables it
- When `useMemo` earns its dependency array and when it is a tax
- The difference between `useTransition` and `useDeferredValue`, and which one you reach for first
- What a virtualiser has to be told, and why `estimateSize` alone is not enough
- What the React Compiler assumes about your code, and the four problems it does not touch

> **Measure, then fix — and then measure again.** Every number in this guide
> came off a real machine; yours will differ and that is the point. 📖
> [study-notes 15](../../study-notes/15-performance/) is today's theory.

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/18-performance/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/18-performance/starter && npm install && npm run dev`.

Install the **React Developer Tools** extension before you start — the whole of
Lab 1 happens inside its **Profiler** tab, and there is no substitute. Sign in
as `emilys` / `emilyspass` (admin) so the grid has its edit and delete buttons;
Lab 3 needs the `/account/team` page, which is admin-only.

---

## The cold open

Open `src/components/ProductCard.tsx` and put one line at the top of the
component, above everything else:

```tsx
export function ProductCard({ product, density = 'comfortable', /* …unchanged… */ }: ProductCardProps) {
  for (let i = 0; i < 2e6; i++) {} // ← the cold open. Delete it after this section.
  const isOutOfStock = product.stock === 0;
  // …unchanged…
```

Save. The grid still looks fine. Now type `phone` in the search box, one letter
at a time, at a normal speed.

It is not fine. The caret lags behind your fingers. Five characters is five
renders of the page, each of which renders twelve cards, each of which runs two
million iterations before it can return any JSX. Nothing here is asynchronous
and nothing is waiting on the network — the loader has not even fired yet,
because the search box is debounced. This is pure main-thread arithmetic in
render.

Now stop. **Do not fix anything.** Open DevTools → **⚛️ Profiler** → the gear →
tick **"Record why each component rendered"**. Press ● and type `phone` again.
Press ■.

You are looking at one bar per commit. Click the tallest one. The flamegraph
shows `ProductsPage` at the top, then `ProductToolbar`, `CategoryStrip`,
`ProductGrid` and twelve `ProductCard`s underneath — all of them yellow, all of
them re-rendered, for a keystroke that changed one `<input>`'s value. Hover a
card and the tooltip says **"Why did this render? Parent component rendered."**

Not state. Not context. Not a key. *Parent rendered.* That is the most common
cause of a wasted render in any React application, and it is the one `memo` was
invented for — and also the one that composition fixes without `memo` at all.

Two more things. Switch the flamegraph to **Ranked**: the same commit, sorted by
cost, twelve identical bars. And notice what the Profiler never claims — that
the DOM changed. It didn't. React rendered twelve cards, diffed them against
twelve identical cards, and updated nothing. **Render ≠ commit ≠ DOM update**,
and all twelve renders were work thrown away.

Delete the loop. The six labs put a better version back, find each of these
problems with a measurement, and fix them in the order that pays: structure,
then memoisation, then the compiler that writes the memoisation for you.

---

## Lab 1 — Measure first (20 min)

### Problem

The cold open worked because you added the slowness yourself. Real slowness
arrives one component at a time, from somebody else, six months ago — and by
then the only honest question is *which* component. A loop you delete after the
demo cannot answer that. You need a switch you can leave in, and a number you
can read.

### Concept

**A re-render is not a DOM update, and there are exactly four reasons one
happens.** The **render** phase calls your components and builds a tree of
elements; the **commit** phase compares that tree with the last and touches the
DOM only where they differ. A component can render fifty times and cause zero
DOM writes — as it just did. Which is why "it re-rendered" is not a bug report
and "it was slow" is.

| Cause | What triggers it | What stops it |
|---|---|---|
| Its own state changed | `setState`, `dispatch`, a store selector's value changed | nothing — this one is the point |
| Its **parent** rendered | anything above it re-rendered, for any reason | `memo`, or the parent not owning that state, or receiving the child as `children` |
| A **context** it reads changed | the provider's `value` is a new object | splitting the context, or a stable value |
| Its **key** changed | you gave it a new `key` | that is a remount, and usually deliberate |

📖 [study-notes 15 §2](../../study-notes/15-performance/). Memorise the four:
the fix is different for each, and reaching for `memo` when the real cause is
number three is how codebases end up memoised everywhere and still slow.

**And `<Profiler>` is the API behind the DevTools tab.** It takes an `id` and an
`onRender` callback and calls it once per **commit** of its subtree — not once
per render. Two durations, and they are the whole game: `actualDuration` is what
this commit really cost and falls as children bail out; `baseDuration` is what
it would have cost with no memoisation anywhere — the ceiling. `actual` close to
`base` means nothing is being skipped; `actual` near zero against a large `base`
means your memoisation is working. One number is noise; the *shape* of the pair
over a lab is the signal.

### Steps

**A. `src/lib/slowMode.ts` — `TODO(lab-1.1)`**

```ts
/** Measured, not guessed: ~4.5 ms per call on an M-series laptop. */
export const SLOW_SPINS = 8_000_000;

// The total goes to a module-level sink ON PURPOSE. An empty
// `for (let i = 0; i < 2e6; i++) {}` is provably pointless, and both V8 and the
// React Compiler are allowed to delete it. A value that escapes cannot be deleted.
let sink = 0;

export function spin(iterations: number = SLOW_SPINS): void {
  let total = 0;
  for (let i = 0; i < iterations; i += 1) total += i % 7;
  sink = total;
}

/** Only so the sink is read somewhere, or it is an unused variable. */
export const lastSpin = () => sink;
```

The cold open's `2e6` measures ~1.2 ms on a fast laptop — enough to see in the
Profiler, not enough to feel. `8_000_000` is ~4.5 ms, so twelve cards cost
~55 ms, and the development build plus StrictMode's double render take that past
100 ms: the threshold where a click stops feeling instant. Turn it up if your
machine laughs at it.

**B. `src/components/ProductCard.tsx` and `ProductGrid.tsx` — `TODO(lab-1.2)`**

```tsx
interface ProductCardProps {
  // …unchanged…
  /** DEV ONLY (Lab 1): burn main-thread time in this render, so the grid is measurably slow. */
  slow?: boolean;
}

export function ProductCard({ product, /* …unchanged… */ slow = false }: ProductCardProps) {
  if (slow) spin(); // the one deliberately expensive line in this codebase: an instrument
  // …unchanged…
```

and in `ProductGrid`, the same prop passed straight through: `slow?: boolean`,
`slow = false`, `slow={slow}` on each `<ProductCard>`.

A prop, not a global and not a context read. A context read inside `ProductCard`
would re-render every card whenever that context changed — which goes straight
through `memo` and would quietly sabotage Lab 3. Two levels of prop drilling is
the honest choice here.

**C. `src/components/RenderProfiler.tsx` — `TODO(lab-1.3)`**

```tsx
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { logger } from '../config/logger';

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  logger.debug(`[profiler] ${id} · ${phase} · actual ${actualDuration.toFixed(1)}ms · base ${baseDuration.toFixed(1)}ms`);
};

export function RenderProfiler({ id, children }: RenderProfilerProps) {
  // `import.meta.env.DEV`, not `env.isDev`: Vite replaces the constant with `false` at build
  // time and the bundler deletes the branch. A property read on `env` cannot be eliminated.
  if (!import.meta.env.DEV) return children;

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
```

`phase` is `'mount'` the first time, `'update'` afterwards, and
`'nested-update'` when an effect inside the subtree set state and forced React
round a second time before painting. A steady stream of `nested-update` is a
bug, not a slow component.

**D. `src/components/ProductToolbar.tsx` and `src/routes/ProductsPage.tsx` — `TODO(lab-1.4)`**

In the page, one piece of state and one wrapper; in the toolbar, the switch:

```tsx
// ProductsPage — plain state, not a search param: flipping it must not re-run the loader.
const [slow, setSlow] = useState(false);
<ProductToolbar /* …unchanged… */ slow={slow} onSlowChange={setSlow} />
<RenderProfiler id="grid">
  <ProductGrid /* …unchanged… */ slow={slow} />
</RenderProfiler>

// ProductToolbar
{import.meta.env.DEV && (
  <Form.Check type="switch" id="slow-mode" label="Slow mode" checked={slow} onChange={(e) => onSlowChange(e.target.checked)} />
)}
```

`import.meta.env.DEV` again, and for the same reason: after `npm run build` the
switch is not in the bundle at all. (`VITE_LOG_LEVEL=debug` in
`.env.development` is what lets `logger.debug` through — the profiler lines are
silent in staging and production with no code change.)

### Verify

1. `npm run dev`, `/products`, console open. Flip **Slow mode** on.
2. Type one letter in the search box:
   `[profiler] grid · update · actual 118.4ms · base 119.1ms`. `actual ≈ base`
   means nothing is being skipped.
3. React DevTools → **Profiler** → gear → **"Record why each component
   rendered"**. Record, type three letters, stop: three commits, twelve yellow
   cards each, every tooltip reading **"Parent component rendered"**.
4. Switch **Flamegraph** to **Ranked**: the twelve cards are the whole chart.
5. Click the **Prices** disclosure. Another `grid` commit, another ~118 ms — for
   a chart nowhere near the grid.

### Watch out

**Profiling a production build.** `<Profiler>` is compiled out and the DevTools
Profiler refuses to record. Measure in development to find *which* component,
then confirm the win with the browser's Performance panel on a production build
— development is roughly 2–5× slower than what ships.

**Believing one number.** The first commit after a hot reload is always the
slowest. Record, discard the first bar, then read.

**Chasing render counts.** `useRenderCount` (Demo 15) tells you *how often*; the
Profiler tells you *how much*. Sixty renders at 0.02 ms each is not your
problem. Optimise milliseconds, not counts.

### In the real world

Every team eventually builds some version of `RenderProfiler` — wired to an
analytics endpoint, sampling one session in a thousand, reporting commits over
50 ms with their `id`. It is the only way to find out that your page is slow on
a four-year-old Android and fine on the laptops of everyone who writes it.

---

---

## Lab 2 — Structural fixes (20 min)

### Problem

Three measurements from Lab 1, all saying the same thing: the grid re-renders
because `ProductsPage` re-rendered, and `ProductsPage` re-renders because it
owns the search draft, the chart disclosure, and everything else on the page.
The obvious fix is `memo(ProductGrid)`. Do not do that yet. Every piece of state
you move is a `memo` you never write, a dependency array you never keep correct,
and a bug you never find.

### Concept

**Composition beats memoisation, because `children` is already a stable
element.** `<ProductGrid products={visible} />` becomes an object —
`{ type: ProductGrid, props: {…} }` — created during *that* render. If another
component re-renders and hands React the same object back, React compares it to
the previous tree, finds it identical, and skips the whole subtree. No `memo`,
no props comparison, no dependency array: the cheapest bail-out React has, and
you get it by moving state *down* or letting content arrive *from above*.

| Move | When | Cost |
|---|---|---|
| **Push state down** | only one component shows the value | free — a smaller blast radius |
| **Lift content into `children`** | the state's owner does not *read* the content | free — one prop, no comparison |
| **Split the context** | consumers want different parts at different rates | one extra provider |
| *`memo`* | *none of the above apply* | *a props comparison on every render, forever* |

📖 [study-notes 15 §7](../../study-notes/15-performance/).

### Steps

**A. `src/components/ProductToolbar.tsx` — `TODO(lab-2.1)`**

The search box's draft is shown by exactly one component: the search box.

```tsx
interface ProductToolbarProps {
  query: string;                             // what the URL carries; the box drafts from here
  onQueryCommit: (query: string) => void;    // called when the typing PAUSES, not per keystroke
  // …unchanged…
}

export function ProductToolbar({ query, onQueryCommit, /* …unchanged… */ }: ProductToolbarProps) {
  const [draft, setDraft] = useState(query);
  const commit = useDebouncedCallback(onQueryCommit, 400);

  // If `q` changes from OUTSIDE (back button, a shared link, a category click that clears it),
  // adopt it. "Adjusting state when a prop changes" — the React-docs pattern, no effect needed.
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    setDraft(query);
  }

  function handleChange(value: string) {
    setDraft(value);  // instant — this component and nothing else
    commit(value);    // 400 ms later — the URL, the loader, the network
  }
```

In `ProductsPage`, delete `queryDraft`, `commitQuery`, `seenQuery` and
`handleQueryChange`, then pass
`query={filters.query} onQueryCommit={(query) => updateFilters({ query })}`.
`CategoryStrip`'s handler loses its `setQueryDraft('')` too — clearing `q` in
the URL is enough now, because the toolbar adopts it. Four locals and one whole
concern left the page.

**B. `src/components/ProductsSurface.tsx` — `TODO(lab-2.2)`**

The chart disclosure is not shown by one component, so it cannot go down.
Instead move it *up, into something that receives the grid*:

```tsx
export function ProductsSurface({ title, description, actions, toolbar, products, children }: ProductsSurfaceProps) {
  const [showChart, setShowChart] = useState(false);
  const chartPanelRef = useRef<HTMLDivElement>(null);
  // toggleChart moves here unchanged — flushSync, then scrollIntoView (Demo 15).

  return (
    <>
      <PageHeader title={title} description={description} actions={<>{actions}<Button /* Prices */ /></>} />
      {toolbar}
      {showChart && <div ref={chartPanelRef} className="mb-3"><PriceHistogram products={products} /></div>}
      {children}
    </>
  );
}
```

`actions`, `toolbar` and `children` are elements `ProductsPage` created in a
render that `setShowChart` did not cause, so React gets the same three objects
back and skips all three subtrees. **Content passed in cannot be re-rendered by
state that lives here** — and `ProductsSurface` never learns what a grid is.

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-2.3)`**

```tsx
<ProductsSurface
  title="All products"
  description={`${total} products`}
  products={visible}
  actions={<>{/* density buttons, "Show all", "Add product" */}</>}
  toolbar={<><ProductToolbar … /><CategoryStrip … /></>}
>
  <RenderProfiler id="grid">
    <ProductGrid … />
  </RenderProfiler>
  <Pager … />
</ProductsSurface>
```

And the density toggle — the state you were told to push down. You cannot: the
toggle renders inside `PageHeader`'s `actions` and the value is read by
`ProductGrid`, two siblings whose only common ancestor is this page. So: should
the URL own it?

**No, and the reason is specific to this app.** React Router re-runs a route's
loader on *any* search-param change, so `?density=compact` would put an HTTP
request behind a purely visual switch. A shareable density is not worth a
round trip. The code says so, next to the state:

```tsx
// Density is a VIEW preference two siblings need — the toggle in the header and the grid below
// it — so it cannot be pushed down to either. It is not in the URL either, and deliberately:
// React Router re-runs this route's loader on any search-param change, so `?density=compact`
// would put a network request behind a purely visual switch.
const [density, setDensity] = useState<Density>('comfortable');
```

"We looked, and here is why it stays" is a result. Lab 4 makes the click feel
instant anyway, which is the honest fix for this one.

**D. `src/context/ToastContext.tsx` — `TODO(lab-2.4)`**

Nothing to build — Demo 12 already split this into `ToastStateContext` and
`ToastDispatchContext`. Today you *prove* it.

```tsx
<ToastDispatchContext value={dispatch}>
  {/* `children` is a PROP: the element was created by main.tsx, in a render that a toast does
      not cause. React compares it to itself and skips the whole app — including the grid's
      Profiler, which is how you can prove it. Only the viewport below reads the list. */}
  {children}
  <RenderProfiler id="toasts">
    <ToastViewport />
  </RenderProfiler>
</ToastDispatchContext>
```

`ProductsPage` calls `useToastDispatch()`, not `useToasts()`. `dispatch` from
`useReducer` is identity-stable for the provider's whole life, so that context's
value never changes and the page never re-renders for a toast. One context —
`value={{ toasts, dispatch }}`, a fresh object every push — would re-render every
consumer of either half, and `memo` would not help: **a context change goes
straight through `memo`**.

### Verify

1. Slow mode on. Type one letter in the search box. Before A:
   `[profiler] grid · update · actual ~118ms`. After A: nothing but
   `[render] ProductToolbar #n` — the grid does not commit until the 400 ms
   debounce fires and the loader returns.
2. Click **Prices**. Before B: a `grid` commit. After B: the chart appears and
   `grid` stays silent.
3. Delete a product as an admin (or let a flash toast fire):
   `[profiler] toasts · update`, and nothing from `grid`.
4. Profiler → record a keystroke: `ProductToolbar` is the only yellow component
   in the tree.

### Watch out

**`<ProductsSurface>{() => <Grid />}</ProductsSurface>`.** A render *function*
is called during `ProductsSurface`'s render, so the grid is rebuilt every time —
the opposite of what you wanted. The whole effect depends on `children` being
an element, created elsewhere, passed through untouched.

**Pushing down state that two siblings read.** You will lift it back within a
week, or duplicate it and watch the copies diverge. The test is "who *shows*
this value", not "who *changes* it".

**Assuming a split context works.** A surprising number of codebases have a
`useMemo` on a provider value whose dependencies are wrong. It is one Profiler
line to check.

### Challenge (2 min)

`RelatedProducts` renders four `ProductCard`s. Turn slow mode on
(`/products/1`), switch a tab, and watch: why does the related row re-render,
and which of the four causes is it?

### In the real world

"Composition over memoisation" is the highest-leverage habit on this list and
the least visible in review — nobody files a bug about a `memo` that was never
needed. The tell in an inherited codebase is a component with twelve `useState`
calls and a `memo` on every child: the state is in the wrong place, and the
`memo`s are scar tissue.

---

---

## Lab 3 — `memo`, `useMemo`, `useCallback` (25 min)

### Problem

Lab 2 stopped the grid re-rendering for the search box and the chart. It still
re-renders for everything else the page does: the density toggle, the delete
dialog opening, a toast's `?flash` param being cleaned up. Twelve cards, 118 ms,
for a modal that has nothing to do with them. There is no more state to move —
this is where `memo` earns its keep.

### Concept

**`memo` re-renders a component only when its props are not shallow-equal to
last time.** Shallow equality means `Object.is` on each prop, one level deep.
That is the entire mechanism, and the entire problem:

```js
Object.is(5, 5)                   // true  — numbers, strings, booleans, null: fine
Object.is('phone', 'phone')       // true
Object.is({}, {})                 // false — two different objects
Object.is([1], [1])               // false
Object.is(() => {}, () => {})     // false — every render creates a new function
```

Referential identity, from Session 1 Lab 5, is the whole of it. A `memo`'d
component receiving `style={{ height: 160 }}` or `onEdit={(p) => …}` re-renders
every single time, *plus* the cost of a comparison that was always going to
fail. **A broken `memo` is slower than no `memo`.**

`useCallback(fn, deps)` and `useMemo(() => value, deps)` give those props a
stable identity. They are the same function — `useCallback(fn, d)` is
`useMemo(() => fn, d)` — with the same three costs: a hook-list entry, a
dependency array to keep correct, and a comparison every render. Memoising
`a + b` is a net loss; memoising a 194-element sort that feeds a `memo`'d child
is a win. Between those, measure.

📖 [study-notes 15 §§4–6](../../study-notes/15-performance/).

### Steps

**A. `src/components/ProductCard.tsx` — `TODO(lab-3.1)`**

```tsx
import { memo } from 'react';

function ProductCardImpl({ product, /* …unchanged… */ }: ProductCardProps) {
  // …unchanged…
}

export const ProductCard = memo(ProductCardImpl);
```

Slow mode on, open the delete dialog. `[profiler] grid · update · actual 3.1ms ·
base 118.6ms`. `actual` collapsed, `base` did not: twelve cards were skipped and
the Profiler is telling you exactly how much that saved.

**B. Now break it on purpose.**

Add one harmless-looking line to `ProductGrid`'s `<ProductCard>` (and a
`style?: CSSProperties` to its props, which it does not have):

```tsx
<ProductCard product={product} style={{ marginBottom: 0 }} /* ← new object, every render, every card */ />
```

Open the dialog again: `actual 117.9ms`, and the Profiler's tooltip now reads
**"Props changed: style"**. One inline object, twelve cards, the whole
optimisation gone — while the codebase still *looks* optimised, which is why
this is the bug you will actually meet. Delete the `style` prop again.

**C. `src/routes/ProductsPage.tsx` — `TODO(lab-3.2)`**

The same failure is already in the page, just less obvious:

```tsx
<ProductGrid
  onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}
  onDelete={isAdmin ? setPendingDelete : undefined}
/>
```

`onDelete` is fine: `setPendingDelete` is a `useState` setter and React
guarantees those are stable. `onToggleSave` and `onAddToCart` are fine too —
Zustand returns the same function from the store every time. `onEdit` is a fresh
arrow every render, so `memo` fails on that prop alone.

```tsx
// `setSearchParams` is stable, so this is created once and never again — which is what
// memo(ProductCard) needs in order to skip anything at all.
const handleEdit = useCallback((product: Product) => setParam('edit', product.id), [setSearchParams]);
onEdit={isAdmin ? handleEdit : undefined}
```

Three of the four handlers needed nothing: `useCallback` everywhere is noise.
Look at what a prop actually *is* before you wrap it.

**And the `useCallback`s that have been here since Demo 8.**
`useDebouncedCallback` and `useControllableState` both wrap their returned
function, and neither has anything to do with `memo`: the function they return
is *somebody else's dependency*. `commit` would restart the debounce timer on
every keystroke if its identity changed; `set` sits in `Tabs`' `useMemo`
dependency list. `useCallback` has two jobs — feeding `memo`'d children, and
keeping dependency arrays honest. The second is older and far more common.

**D. `src/routes/account/TeamPage.tsx` — `TODO(lab-3.3)`**

`COLUMNS` on this page sits at **module scope** — the best kind of memoisation,
a value created once because it never depended on a render, and the reason
`DataTable`'s internal `useMemo([rows, columns, sort])` works today. Now add a
feature that breaks it: a directory filter that highlights the match.

```tsx
const [filter, setFilter] = useState('');
const needle = filter.trim().toLowerCase();
const rows = needle ? users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(needle)) : users;

// `render` now closes over `needle`, so this array cannot live at module scope any more.
const columns = useMemo(
  () =>
    [
      { key: 'name', header: 'Name', render: (row) => highlight(`${row.firstName} ${row.lastName}`, needle), sortValue: (row) => `${row.lastName} ${row.firstName}` },
      { key: 'email', header: 'Email', className: 'text-muted', render: (row) => highlight(row.email, needle), sortValue: (row) => row.email },
      // …image, company and role unchanged…
    ] satisfies Column<DirectoryUser>[],
  [needle],
);
```

**And TypeScript says** `satisfies` still belongs *inside* the callback, on the
array literal. Annotating the `useMemo` — `useMemo<Column<DirectoryUser>[]>` —
would widen every `key` back to `string` and lose the autocomplete that Demo 17
Lab 3 built the type for. `satisfies` checks and keeps.

Without the `useMemo`, clicking a column header — which only changes
`DataTable`'s own sort state, not this page's — hands `DataTable` a brand-new
`columns` array, its `useMemo` misses, and it re-sorts. With it, the array
changes when the filter changes and not otherwise.

### Verify

1. Slow mode on, `/products`, signed in as an admin. Open the delete dialog:
   `actual ~3ms`, `base ~118ms`. That gap is `memo` working.
2. Add the inline `style`, repeat: `actual ~118ms`, tooltip **"Props changed:
   style"**. Remove it.
3. `/account/team`: type in **Find a person**. Rows filter, matches highlight.
   Click **Name** to sort, then type again: one sort per keystroke, not two.

### Watch out

**`memo` on a component whose child is `children`.** `memo(Wrapper)` with
`<Wrapper><Grid /></Wrapper>` compares the `children` prop — a new element every
parent render — and never bails out. Lab 2 is the fix; `memo` cannot help.

**A context read inside a `memo`'d component.** `memo` compares props; a context
change bypasses it entirely. This is why `ProductCard` takes `slow` as a prop.

**`useCallback` with the wrong dependencies.** A stale closure is worse than a
slow render: the handler holds last week's `product`.
`react-hooks/exhaustive-deps` is not a suggestion.

**Memoising cheap things.** `useMemo(() => a + b, [a, b])` costs more than
`a + b` — a hook-list entry, a comparison, and a line somebody maintains. The
bar is "the Profiler says so".

### In the real world

Two failure modes, both expensive. One: no memoisation and a 400 ms typing lag.
The other: every component `memo`'d, every function `useCallback`'d, half the
dependency arrays wrong — and still slow, because the real cause was a context
value rebuilt every render. Lab 6 settles the argument.

---

---

## Lab 4 — Concurrent features (20 min)

### Problem

Two updates are left that no amount of structure or `memo` can fix, because in
both the expensive thing *is* what the user asked for.

A client-side filter over the products on screen: its value has to live above
the grid, because the grid renders the result, so every keystroke re-renders
twelve slow cards and the `<input>` cannot repaint until they are done. And the
density toggle: twelve cards re-laid out in ~100 ms, during which the button you
clicked has not visibly changed. The work is necessary. The *waiting* is not.

### Concept

**React runs on one thread, so the only question is what may interrupt what.**
Before React 18 every update was equally urgent: `setState` started a render
that ran to completion and the browser painted nothing until it finished.
Concurrent rendering lets you mark an update non-urgent; React then renders it
in the background, keeps the previous UI on screen, paints urgent updates
*during* it, and throws the work away and restarts if a newer update arrives.

Two APIs, and the difference is only where you put them:

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| You have | the **event** that causes the update | a **value** you are given |
| You write | `startTransition(() => setX(next))` | `const deferred = useDeferredValue(x)` |
| You get | `isPending` — a transition is running | `x !== deferred` — the screen is one step behind |
| Use it | in your own component, where you own the `setState` | when the state is a prop, or comes from a hook you do not control |

Both are about *perceived* speed. Neither makes the twelve cards render faster —
`actualDuration` will be the same. What changes is that the keystroke paints
first. 📖 [study-notes 15 §9](../../study-notes/15-performance/); the single
thread is Session 1 Lab 6.

### Steps

**A. The quick filter — `TODO(lab-4.1)` and `TODO(lab-4.2)`**

In `ProductToolbar`, a second input, controlled by the page:

```tsx
<InputGroup className={styles.search}>
  <InputGroup.Text><Funnel /></InputGroup.Text>
  <Form.Control
    type="search"
    placeholder="Filter these results (no reload)"
    aria-label="Filter the products on this page"
    value={quickFilter}
    onChange={(e) => onQuickFilterChange(e.target.value)}
  />
</InputGroup>
```

Note what this is *not*: it never touches the URL and never fetches. The search
box above it is debounced because it costs a request; this one costs a render —
a different problem with a different tool.

In `ProductsPage`:

```tsx
const [quickFilter, setQuickFilter] = useState('');
const deferredFilter = useDeferredValue(quickFilter);
// React renders twice: once urgently with the new input value and the OLD deferredFilter,
// then again in the background with the new one. While those disagree, the list on screen
// is one keystroke behind — so say so rather than pretending.
const filterIsStale = quickFilter !== deferredFilter;

// …after `products` is derived…
const needle = deferredFilter.trim().toLowerCase();
const visible = needle
  ? products.filter((p) => `${p.title} ${p.brand ?? ''} ${p.category}`.toLowerCase().includes(needle))
  : products;
```

and the grid, wrapped:

```tsx
<RenderProfiler id="grid">
  <div style={{ opacity: filterIsStale ? 0.55 : 1, transition: 'opacity 120ms linear' }} aria-busy={filterIsStale}>
    <ProductGrid products={visible} /* …unchanged… */ />
  </div>
</RenderProfiler>
```

The `opacity` is not decoration. Without it the list simply shows stale results
with no explanation, which reads as a bug. `aria-busy` is the same message for
anyone who is not looking at the pixels.

**The one line that matters** is `products.filter(… deferredFilter …)`. Filter
by the live `quickFilter` instead and you have written exactly the code you had
before, with an unused hook.

**B. `src/components/tabs/Tabs.tsx` and the density toggle — `TODO(lab-4.3)`**

`Tabs` owns the selection, so it owns the event, so it gets `useTransition`:

```tsx
// TWO updates from one click, on purpose:
//   `setRequested` is URGENT — it renders immediately, so the tab can show a spinner this frame.
//   `setSelected` is a TRANSITION — React may render the new panel in the background.
const [isPending, startTransition] = useTransition();
const [requested, setRequested] = useState<string | null>(null);

function select(next: string) {
  setRequested(next);
  startTransition(() => setSelected(next));
}

// `requested` outlives the transition, so it is only meaningful WHILE one is running.
const pending = isPending ? requested : null;

const context = useMemo(() => ({ value: selected, select, baseId, pending }), [selected, select, baseId, pending]);
```

`TabsContextValue` gains `pending: string | null`, and `Tabs.Tab` renders a
`<Spinner>` when `pending === value`. Then the same three lines on the density
toggle in `ProductsPage`:

```tsx
const [densityPending, startDensityTransition] = useTransition();
onClick={() => startDensityTransition(() => setDensity('compact'))}
{densityPending && <Spinner size="sm" role="status" aria-label="Re-laying out the grid" />}
```

A spinner, not a disabled button: the point of a transition is that the UI stays
interactive while it runs, and disabling the control you just made responsive
throws the win away.

### Verify

1. Slow mode on, `/products`. Type `pro` quickly into **Filter these results**:
   the input keeps up with your fingers, the grid dims, then catches up. Comment
   the hook out and the caret visibly lags.
2. The console prints one `[profiler] grid` line per *settled* value, not per
   keystroke — and `actualDuration` is unchanged. React did not make the render
   faster, it made it interruptible.
3. Click **Compact**: the button flips immediately, a spinner appears, the old
   grid stays for ~100 ms, then the new one replaces it in one commit.
4. `/products/1`, switch to **Reviews**. Honest answer: no spinner.
   `Tabs.Panel` keeps every panel mounted (Demo 17 Lab 1), so a switch is a
   cheap re-render of markup that already exists. Right mechanism, small payoff
   here — and the whole game in a codebase where a panel mounts a chart.

### Watch out

**`startTransition` around an `await`.** Only what runs *synchronously* inside
the callback is marked as a transition. `startTransition(async () => { await
x(); setY(v) })` marks nothing — the `setY` happens in a later task. Use
`startTransition` again after the await, or React 19's async transitions
deliberately.

**A transition on the input's own value.** The text you type is urgent, always.
Defer what is *derived* from it, never the controlled value, or the caret jumps.

**No stale indicator.** `useDeferredValue` with no visual feedback is worse than
none: the user sees results that do not match what they typed and concludes the
filter is broken.

**Expecting `actualDuration` to fall.** It will not. Transitions change *when*
work happens, not how much. Work that is simply too big gets virtualised — Lab 5.

**A `useMemo` whose dependency is now a new function.** `select` is created
fresh each render, so `Tabs`' context `useMemo` stops bailing out. A real
regression for exactly two labs — the compiler fixes it in Lab 6; if you stop
before then, wrap `select` in `useCallback`.

### In the real world

The rule that survives contact with a product: **urgent is what the user just
did; non-urgent is what you decided to show them because of it.** Typing,
clicking, dragging — urgent. The list, the chart, the preview, the route you are
navigating to — transitions. React Router 8 already wraps navigations in one,
which is why `useNavigation().state` exists at all.

---

---

## Lab 5 — Lists at scale and the bundle (20 min)

### Problem

Two costs you have not measured yet. The page shows twelve products out of 194
because `PAGE_SIZE` says so; render all 194 as cards and no amount of `memo`
saves you — 194 components, 194 sets of DOM nodes, one browser layout pass over
all of them. Every long list eventually hits this.

And the thing nobody profiles: `dist/assets/index-*.js` is 620 kB of JavaScript
to download, parse and execute *before* the first render. Nothing you do inside
React beats not shipping the code.

### Concept

**Virtualisation renders the rows you can see and lies convincingly about the
rest.** Three pieces: a scroll container with a fixed height; a spacer as tall
as every row added together, so the scrollbar is honest; and only the visible
rows, absolutely positioned where the virtualiser says. Scroll, and the same
eleven `<li>` elements are reused with different content.

`useVirtualizer` needs five things, and one of them is the one people miss:

| Option | What it is |
|---|---|
| `count` | how many items exist in total — not how many you render |
| `getScrollElement` | the node that actually scrolls |
| `estimateSize` | a guess, in pixels, used before a row has been measured |
| `overscan` | extra rows above and below, so a fast scroll does not show white |
| `measureElement` | how to measure a row **for real** — required for variable heights |

`estimateSize` alone gives a list where every row is the same height forever;
with `measureElement` and a `ref` on each row, a `ResizeObserver` replaces each
estimate with the real number as it scrolls past.

**And tree-shaking only works on what it can see.** A bundler drops an export
nobody imports — but only for ES modules, only without side effects, only for
static imports. `import moment from 'moment'` pulls in 70 kB because moment is
one CommonJS object with every locale attached. `Intl` costs nothing: it is
already in the browser. One careless dependency outweighs every `memo` here.

📖 [study-notes 15 §§8, 10](../../study-notes/15-performance/).

### Steps

**A. `src/components/ProductRowList.tsx` — `TODO(lab-5.1)`**

```tsx
export function ProductRowList({ slow = false }: ProductRowListProps) {
  // This request has its OWN lifetime — it belongs to a disclosure the user may never open, so it
  // does not belong in the route loader (Demo 7's rule). `limit: 0` is DummyJSON for "all of them".
  const request = useFetch((signal) => listProducts({ limit: 0, signal }), 'all-products');
  const products: Product[] = request.status === 'success' ? request.data.products : [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 96,
    overscan: 6,
    measureElement: (node) => node.getBoundingClientRect().height,
    getItemKey: (index) => products[index]?.id ?? index,
  });

  // …the error and loading branches return early…

  return (
    // 1. the viewport: fixed height, scrolls
    <div ref={scrollRef} style={{ height: 420, overflowY: 'auto' }} role="region" aria-label="All products, scrollable">
      {/* 2. the spacer: as tall as all 194 rows, so the scrollbar is honest */}
      <ul className="list-unstyled mb-0 position-relative" style={{ height: virtualizer.getTotalSize() }}>
        {/* 3. only the visible rows exist. data-index + ref is how measureElement knows which row it measured. */}
        {virtualizer.getVirtualItems().map((item) => (
          <li
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="border-bottom px-3 py-2 d-flex gap-3 align-items-start position-absolute w-100"
            style={{ top: 0, left: 0, transform: `translateY(${item.start}px)` }}
          >
            <ProductRow product={products[item.index]} slow={slow} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**A row list, not the card grid — a decision, not a shortcut.** Virtualising
`ProductGrid` means telling the virtualiser how many cards fit per row,
recomputing that on every resize, and keeping it in step with the six Bootstrap
breakpoints in `COLUMNS`. TanStack Virtual can (`lanes`), but the honest order
is: virtualise the one-dimensional thing first, and reach for a virtualised grid
only when a measurement says the grid is the problem. Here it is not — the grid
shows twelve.

The rows carry a wrapping description on purpose, so heights genuinely differ.
Delete `measureElement` and scroll to the bottom: the scrollbar drifts by
hundreds of pixels, because every row is still assumed to be 96 px.

**B. `src/routes/ProductsPage.tsx` — `TODO(lab-5.2)`**

```tsx
const [showAll, setShowAll] = useState(false);

// …in `actions`: a disclosure, so aria-expanded + aria-controls…
<Button size="sm" variant="outline-secondary" aria-expanded={showAll} aria-controls="all-products" onClick={() => setShowAll((open) => !open)}>
  <ListUl className="me-1" />{showAll ? 'Hide all' : `Show all ${total}`}
</Button>

// …in the children, after the Pager…
{showAll && (
  <div id="all-products" className="mt-4">
    <RenderProfiler id="virtual-list"><ProductRowList slow={slow} /></RenderProfiler>
  </div>
)}
```

**C. `src/components/ProductsSurface.tsx` — `TODO(lab-5.3)`**

The histogram is the only thing in the app that pulls in the canvas drawing
code, and it sits behind a disclosure most people never open:

```tsx
// `lazy` wants a module whose DEFAULT export is the component; this codebase uses named exports.
const PriceHistogram = lazy(() => import('./PriceHistogram').then((m) => ({ default: m.PriceHistogram })));

<Suspense fallback={<Placeholder as="div" animation="glow"><Placeholder xs={12} style={{ height: 150 }} className="rounded" /></Placeholder>}>
  <PriceHistogram products={products} />
</Suspense>
```

Route-level `lazy` from Demo 14 (`src/router.tsx`, the `/about` and `/account`
routes), applied one level down to a component. Same mechanism, same `Suspense`
requirement, smaller unit.

**D. `src/lib/format.ts`, `vite.config.ts`, `scripts/check-bundle-size.mjs` — `TODO(lab-5.4)`**

First the visualiser:

```ts
import { visualizer } from 'rollup-plugin-visualizer';

// A REPORT, not a transform: it reads the finished bundle and writes dist/stats.html.
plugins: [react(), tailwindcss(), process.env.ANALYZE ? visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true }) : null],
```

and in `package.json`:

```json
"build:analyze": "tsc -b && ANALYZE=1 vite build",
"check:bundle": "node scripts/check-bundle-size.mjs",
```

**Write it in that order or it silently does nothing.** `ANALYZE=1 tsc -b &&
vite build` sets the variable for `tsc` only — a shell assignment prefixes one
command, and `&&` starts another. The build succeeds, no `stats.html` appears,
and you spend twenty minutes on the plugin. Put the assignment on the command
that needs it.

`npm run build:analyze`, then open `dist/stats.html`: `react-dom` is the largest
single thing in the bundle and always will be, `react-bootstrap` second, then
`react-router`, `axios`, `zod` and `react-hook-form`. Find `PriceHistogram` — no
longer in the main chunk. Now search the treemap for a date library. There isn't
one, because of this:

```ts
// Constructed ONCE at module scope. `new Intl.DateTimeFormat(...)` per call is the expensive part.
const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

/** An ISO string from the API → "14 Apr 2025". Never store a Date; format at the edge. */
export const formatDate = (iso: string) => mediumDate.format(new Date(iso));
```

`ProductDetailPage` had its own `Intl.DateTimeFormat` for review dates; move it
here and import `formatDate`. Six lines, zero bytes shipped, against moment's
~70 kB.

Then the budget, because a treemap nobody looks at is not a control:

```js
/** Raw (unzipped) kilobytes, per JavaScript asset. Raw, because that is what the browser PARSES. */
const DEFAULT_MAX_KB = 680;

const rows = readdirSync(DIST).filter((f) => f.endsWith('.js'))
  .map((file) => ({ file, kb: statSync(join(DIST, file)).size / 1024 }))
  .sort((a, b) => b.kb - a.kb);

if (rows.some((row) => row.kb > maxKb)) process.exit(1); // …after printing every row
```

**680 is not a number from the internet.** It is what ShopScope measures today —
the entry chunk is 619.6 kB — plus about 9% headroom. That is the only honest
way to pick a budget: measure, add room, and move it deliberately when you add
something on purpose. Accept `--max-kb=` so anyone can try a tighter number
without editing the file.

### Verify

1. `/products` → **Show all 194**. Scroll, and count the `<li data-index>`
   nodes in Elements: about eleven, whatever the scroll position. The card
   header says so too.
2. Slow mode on, scroll again: `[profiler] virtual-list` commits stay in the
   tens of milliseconds. All 194 rendered as real cards would be nearly a
   second per commit.
3. `npm run build && npm run check:bundle` →

```
Bundle budget: 680 kB raw per JavaScript asset
  ✓    619.6 kB  index-BJleRzm1.js
  ✓     64.1 kB  endpoints-csBfRq--.js
  ✓      4.1 kB  PriceHistogram-C-1svMPe.js
  …  15 JavaScript assets, 752.3 kB in total.   Within budget.
```

4. Prove it bites: `node scripts/check-bundle-size.mjs --max-kb=500` exits 1 and
   names the file. That is what CI sees on the day somebody adds moment.
5. `npm run build:analyze`, open `dist/stats.html`. `PriceHistogram` and the
   account routes are their own boxes; the date library is absent.

### Watch out

**A virtualised row with no height.** Forget `position: absolute` or the
`transform` and every row stacks at the top. Viewport, spacer and positioned
rows only work together.

**`key={item.index}`.** Indices change as you scroll, so React reuses the wrong
DOM node. `getItemKey` plus `key={item.key}` gives each product a stable
identity.

**Virtualising a list of thirty.** A scroll container, a `ResizeObserver` and a
dependency, to save 0.4 ms — and find-in-page stops working. Virtualisation has
a real accessibility cost; pay it when the measurement says to.

**`gzipSize: true` reassuring you.** Gzip is what crosses the network; *raw* is
what the parser chews. A 200 kB gzipped bundle is still 620 kB of parsing on the
phone. Budget on raw.

### In the real world

Every team that has had a performance regression ends up with two things in CI:
a bundle budget that fails the build, and a Lighthouse or Web Vitals check on a
preview deploy. The budget catches the dependency somebody added at 5pm on a
Friday — the most common cause of a page getting slower, and the one no amount
of `memo` will ever fix.

---

---

## Lab 6 — The React Compiler (15 min)

### Problem

Look at what Lab 3 cost: a renamed component and a `memo` wrapper, a
`useCallback` with a dependency array to keep correct, a `useMemo` around a
columns array — and one inline `style` away from all of it being pointless.
Every line is mechanical, and a compiler works out which values depend on which
inputs far more reliably than a person reviewing a pull request at 5pm.

### Concept

**The compiler memoises everything it can prove is safe, and it decides that by
assuming you followed the Rules of React.** It reads each component and hook,
builds a dependency graph of every value inside, and emits a cache —
`react/compiler-runtime`'s `_c(n)` — so a value is recomputed only when
something it depends on changes. Props, JSX elements, callbacks, derived arrays:
all of them, at a granularity no human writes by hand.

What it assumes:

- **Components and hooks are pure.** Same props and state in, same JSX out, with
  no side effects during render.
- **You do not mutate props, state, or anything you got from a hook.**
- **Hooks are called unconditionally, at the top level.** The old rule, now with
  teeth.
- **Refs are not read or written during render** — a ref is a mutable box the
  compiler deliberately refuses to reason about.

It cannot verify all of that, which is why `eslint-plugin-react-hooks` 7 ships
the compiler's own analysis as lint rules — `react-hooks/refs`,
`set-state-in-effect`, `purity` — on since Demo 15. Clean lint, and the compiler
has what it needs.

What it does **not** do: restructure your components (Lab 2), virtualise a list
or shrink a bundle (Lab 5), or make a request faster (Demo 19). It removes the
mechanical category of work and leaves every architectural decision to you.

### Steps

**A. `vite.config.ts` — `TODO(lab-6.1)`**

First, verify rather than guess. `@vitejs/plugin-react` **6** dropped Babel: it
transforms with oxc, and its compiler switch is `react({ compiler: true })`.
Check the installed package before you type it:

```bash
grep -n "compiler" node_modules/@vitejs/plugin-react/dist/index.d.ts
node -e "console.log(require('./node_modules/@vitejs/plugin-react/package.json').peerDependencies)"
```

The types say `compiler?: boolean | ReactCompilerPluginOptions`; the peer
dependencies say it needs the optional `oxc-transform-react`, which is **not**
in this workshop's pinned set — and today's rule is that the set does not
change. So wire the Babel plugin yourself: fifteen lines, and the step is
visible rather than magic.

```ts
import { transformAsync } from '@babel/core';
import reactCompiler from 'babel-plugin-react-compiler';

function reactCompilerPlugin(): Plugin {
  const include = /\/src\/.*\.tsx?$/;

  return {
    name: 'shopscope:react-compiler',
    // BEFORE plugin-react, so we see the original TSX and hand back TSX; Vite does the rest.
    enforce: 'pre',
    async transform(code, id) {
      if (!include.test(id)) return null;

      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        // Babel has to be told the dialect: this project is TypeScript with JSX.
        parserOpts: { plugins: ['typescript', 'jsx'] },
        // target '19' — the compiler emits `react/compiler-runtime`, which React 19.3 ships.
        plugins: [[reactCompiler, { target: '19' }]],
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map as never };
    },
  };
}

export default defineConfig({
  plugins: [reactCompilerPlugin(), react(), tailwindcss(), /* …visualizer… */],
});
```

**And TypeScript says** neither package ships types, so
`types/babel-react-compiler.d.ts` declares both as narrowly as we use them — a
shim, not a port — and `tsconfig.node.json` includes that folder. Both are in
the starter. Note too that `@babel/core` is not a direct dependency: it arrives
with `eslint-plugin-react-hooks` 7, whose rules *are* the compiler. In a project
of your own, `npm i -D oxc-transform-react` and write `react({ compiler: true })`
— one line, and the route to prefer.

**B. Check what it touched, before you delete anything.**

```bash
npm run typecheck && npm run lint && npm run build
# then confirm the transform actually ran — a plugin that silently matched nothing
# is the failure mode here. `react/compiler-runtime`'s `c` compiles to useMemoCache.
grep -o "useMemoCache" dist/assets/*.js | sort | uniq -c
```

In dev, React DevTools puts a **✨ Memo ✨** badge next to every compiled
component in the Components tab — open `/products` and look at `ProductCard`.
Then the two files most likely to break:

- `src/hooks/useLatest.ts` — `TODO(lab-6.1)`. It writes `ref.current` in an
  *effect*, not during render, so the compiler compiles every component that
  uses it and leaves the ref alone. Had the write been in the render body, this
  would have been the first thing it refused — and `react-hooks/refs` would have
  told you long before that. The same reasoning covers `useDebouncedCallback`
  and `useRenderCount`.
- `src/legacy/withAuth.tsx` and `Fetch.tsx` — class components. The compiler
  **skips classes entirely**; it does not compile them and it does not break
  them. Load `/products/1` and confirm the related row still renders.

The compiler stays **on** for the finished app: the build, the typecheck and the
lint are all green, the legacy classes are untouched, and no component needed an
opt-out. If yours does, the escape hatches are `'use no memo'` as the first
statement in the offending function, or narrowing the plugin's `include` regex —
both are a note-to-self with a date on it, not a solution.

**C. Delete Lab 3 — `TODO(lab-6.2)`**

```tsx
// ProductCard.tsx — the memo() wrapper and the *Impl rename: gone
export function ProductCard({ product, /* …unchanged… */ }: ProductCardProps) { … }

// ProductsPage.tsx — the useCallback: gone
onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}

// TeamPage.tsx — the useMemo: gone
const columns = [ /* …unchanged… */ ] satisfies Column<DirectoryUser>[];
```

Three imports drop out with them. Then re-profile.

### Verify

1. Slow mode on. Open the delete dialog: `[profiler] grid · update · actual
   ~3ms · base ~118ms` — the same numbers Lab 3's hand-written `memo` produced,
   with none of the code.
2. Add the inline `style={{ marginBottom: 0 }}` back to `ProductGrid`'s card.
   `actual` stays low: the compiler caches the object too, so the trick that
   broke `memo` in Lab 3 cannot break this. That is the real argument for it.
3. `/account/team`: filter and sort. One sort per keystroke, with no `useMemo`.
4. React DevTools → Components → `ProductCard` carries **✨ Memo ✨**.
5. `npm run typecheck && npm run lint && npm run build` — green. `npm run
   check:bundle` — still within budget; the compiler runtime is about 1 kB.

### Watch out

**Deleting memoisation the compiler did not replace.** A `useMemo` around a
value whose *identity* something outside React depends on — a `ResizeObserver`
callback, an object handed to a non-React library — is doing a different job.
`PriceHistogram`'s `useCallback` ref callback is exactly that: leave it.

**Assuming it makes everything fast.** It removes wasted re-renders. It does not
touch the 194-row list, the 620 kB bundle, or a 400 ms request.

**Turning it on over a codebase the lint rules have never seen.** Lint first,
fix what it finds, then enable the compiler. In that order it is a config
change; in the other, a debugging session. And `'use no memo'` is a bug marker,
not a solution — fix the violation.

### In the real world

The compiler is how this chapter stops being a chapter. Teams that turn it on
delete thousands of lines of `memo`, `useCallback` and `useMemo` and stop
arguing about them in review — then find their remaining problems are all in
Labs 2 and 5: state in the wrong place, lists that render everything, bundles
nobody measured. Which is why those labs came first.

---

---

## Wrap-up — what you can now do

- [x] Record in the DevTools Profiler with "why did this render" on, read a flamegraph and a ranked chart, and say what `actualDuration` and `baseDuration` mean
- [x] Name the four causes of a re-render, identify which one you are looking at from the Profiler's tooltip, and pick the fix that matches it
- [x] Push state down to the one component that shows it, and pass expensive content as `children` so state above it cannot re-render it
- [x] Split a context into state and dispatch, and prove with a Profiler that dispatch-only consumers stay quiet
- [x] Apply `memo`, break it with one inline object, see the Profiler say "Props changed", and repair it with `useCallback` — and say when `useCallback` is about dependency arrays instead
- [x] Tell `useTransition` from `useDeferredValue`, and ship a stale indicator with the second one
- [x] Virtualise a variable-height list with `useVirtualizer`, `estimateSize`, `overscan` and `measureElement`, and argue for a row list over a grid
- [x] Wire a bundle treemap and a size budget that fails CI, and pick the budget's number from a measurement
- [x] Turn the React Compiler on, verify it against the installed plugin's real API, check what it skips, and delete the memoisation you wrote by hand

**The performance policy** — what to reach for, in this order, and where each
one is in the finished app:

| Symptom | Reach for | In ShopScope today |
|---|---|---|
| "It feels slow" | the **Profiler**, before any code | `RenderProfiler` on the grid, the virtual list, the toasts |
| One component renders and twelve go with it | move the state **down** | the search draft, in `ProductToolbar` |
| State's owner does not read the expensive content | pass it as **`children`** | `ProductsSurface`: actions, toolbar, grid |
| Consumers want different parts at different rates | **split the context** | `ToastContext` — state and dispatch, since Demo 12 |
| The state genuinely belongs above, and props are stable | **`memo`** + `useCallback` | deleted in Lab 6 — the compiler does it |
| A derived value is expensive, or feeds a memoised child | **`useMemo`** — or module scope, which is free | `DataTable`'s `sorted`; `ROLE_VARIANT`, `SORT_OPTIONS` |
| The work is necessary but the click must feel instant | **`useTransition`** | the density toggle, `Tabs` |
| A value you were handed drives an expensive render | **`useDeferredValue`** + a stale indicator | the quick filter over the loaded page |
| Hundreds of rows | **virtualise** | `ProductRowList` — 194 products, ~11 `<li>` |
| A component most people never open | **`lazy` + `Suspense`** | `PriceHistogram`; the `/about` and `/account` routes (Demo 14) |
| "Why is the first paint slow?" | **measure the bundle**, then budget it | `build:analyze`, `check:bundle` at 680 kB |
| Mechanical memoisation everywhere | the **React Compiler** | on, via a Vite plugin over `babel-plugin-react-compiler` |
| A request that is simply slow | none of the above | **Demo 19** |

## Next demo

**Demo 19 — Server State with TanStack Query & Real-time Data.** Open a
product, go back, open it again: the loader runs twice and the network tab shows
two identical requests. Loaders fetch; they do not remember. Demo 19 puts a
cache underneath them — `useQuery` with `staleTime`, `prefetchQuery` in the
loader for instant back/forward, mutations with invalidation replacing Demo 8's
hand-rolled rules, `useInfiniteQuery` for "load more", polling that pauses when
the tab is hidden, and a simulated price ticker over `EventSource`. Today's last
line is where it starts: the one thing performance work cannot fix is a request
you made twice.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The Profiler tab says "This page doesn't appear to be using React" or refuses to record | You are on a production build, where `<Profiler>` is compiled out. Measure in `npm run dev`. |
| No `[profiler]` lines in the console | `VITE_LOG_LEVEL` is not `debug`. `.env.development` sets it; staging and production deliberately do not. |
| Slow mode is on and nothing feels slow | `spin()` is still the stub, or `slow` is not reaching `ProductCard`. Check `ProductGrid` passes `slow={slow}` to every card. |
| The switch is missing after `npm run build && npm run preview` | By design — `import.meta.env.DEV` is `false` and the bundler removed the branch. |
| `actualDuration` never falls after adding `memo` | Some prop is a new object or function each render. Record with "why did this render" on: the tooltip names it. |
| `memo(ProductCard)` skips nothing, and no prop changed | A context read inside the component. `memo` compares props; context bypasses it. |
| Typing in the quick filter still lags | You filtered by `quickFilter` instead of `deferredFilter`. The live value is the one you are trying not to block on. |
| The caret jumps while typing in the quick filter | You deferred the `<input>`'s own `value`. Defer what is derived from it, never the controlled value. |
| The tab spinner never appears | Correct: `Tabs.Panel` keeps every panel mounted, so a switch is cheap. It appears when a panel mounts something expensive. |
| Every virtualised row is stacked at the top | The `<li>` lost `position-absolute`, or the `transform: translateY(...)` is missing. Viewport, spacer and positioned rows only work together. |
| The scrollbar drifts as you scroll the long list | `measureElement` (or the `data-index` attribute) is missing, so every row is still assumed to be `estimateSize()`. |
| `npm run build:analyze` produces no `dist/stats.html` | `ANALYZE=1 tsc -b && vite build` sets the variable for `tsc` only. Write `tsc -b && ANALYZE=1 vite build`. |
| `Property 'env' does not exist on type 'ImportMeta'`… in `vite.config.ts` | `tsconfig.node.json` needs `"types": ["vite/client", "node"]` for `process.env`. It is already set in the starter. |
| `Could not find a declaration file for module '@babel/core'` | `types/babel-react-compiler.d.ts` is not being included. `tsconfig.node.json`'s `include` must list `"types"`. |
| `React Compiler requires the optional 'oxc-transform-react' package` | You used `react({ compiler: true })`. It is the right API for plugin-react 6, but that package is not in this pinned set — use the Babel plugin from Lab 6 A. |
| The build passes but no component shows **✨ Memo ✨** | The plugin's `include` regex did not match. Check it against a real `id` — they are absolute paths, so `/src/` needs the leading slash. |
