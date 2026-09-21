# ShopScope — the 25-session ReactJS Developer Program

**Status: proposal for review (v2).** One app, *ShopScope*, built across 25
sessions: two language-and-orientation sessions, the 13 shipped demos plus one
new demo slotted into the chain, and nine professional-practice sessions that
each add a slice to the finished app.

Every session keeps the track's rules: TypeScript `strict: true` from line one,
Vite, React Bootstrap, axios, react-hook-form + zod, React Router 8, Zustand,
DummyJSON, a guide in the *Problem → Concept → Steps → Verify → Watch out →
Challenge → In the real world* format, `TODO(lab-x.y)` markers, and **the
starter of session N+1 is session N finished**.

Priority key: **Core** = expected of any React developer · **Recommended** =
expected of a mid-level hire · **Optional** = stretch.

---

## The 25 sessions

| Session | Demo | Title | Lab time | Status | Priority |
|---|---|---|---|---|---|
| **Part 0 — Before React** | | | | | |
| S01 | — | JavaScript & TypeScript for React | 150 min | NEW | Core |
| S02 | — | React Introduction, Rendering Architectures & the Toolchain | 120 min | NEW | Core |
| **Part 1 — The component model & local state** | | | | | |
| S03 | 01 | Components, JSX & Props | 75 min | shipped | Core |
| S04 | 02 | Lists, Keys & State | 85 min | shipped | Core |
| S05 | 03 | Events, Forms & Lifting State | 90 min | shipped | Core |
| S06 | 04 | Forms: Reusable Fields, Manual Validation & react-hook-form | 110 min | shipped | Core |
| **Part 2 — Effects, the network & the API layer** | | | | | |
| S07 | 05 | Effects & the Network | 90 min | shipped | Core |
| S08 | 06 | Configuration & the API Layer | 100 min | shipped | Core |
| S09 | 07 | Search, Filters & Pagination | 100 min | shipped | Core |
| S10 | 08 | Mutations & Custom Hooks | 100 min | shipped | Core |
| **Part 3 — Routing, route data & auth** | | | | | |
| S11 | 09 | Routing with React Router v8 | 110 min | shipped | Core |
| S12 | 10 | Loaders, Actions & Error Boundaries | 120 min | shipped | Core |
| S13 | 11 | Authentication & Protected Routes | 120 min | shipped | Core |
| **Part 4 — State at scale** | | | | | |
| S14 | **12** | **Context & Reducers** | 110 min | **NEW** (inserted) | Core |
| S15 | 13 | Client State with Zustand *(was 12)* | 85 min | shipped · renumber | Core |
| **Part 5 — Shipping the SPA** | | | | | |
| S16 | 14 | Advanced HTTP & Shipping *(was 13)* | 90 min | shipped · renumber | Core |
| **Part 6 — Professional practice** (each starts from the finished app) | | | | | |
| S17 | 15 | Refs, the DOM & Keyboard Accessibility | 110 min | NEW | Core |
| S18 | 16 | Styling & Theming in React | 110 min | NEW | Recommended |
| S19 | 17 | Component Patterns, Portals & TypeScript Consolidation | 130 min | NEW | Recommended |
| S20 | 18 | Performance — Measure, then Fix | 120 min | NEW | Core |
| S21 | 19 | Server State with TanStack Query & Real-time Data | 130 min | NEW | Recommended |
| S22 | 20 | Testing React Applications | 130 min | NEW | Core |
| S23 | 21 | React 19 Actions, Suspense & Server Components | 130 min | NEW | Recommended |
| S24 | 22 | Production Readiness | 130 min | NEW | Core |
| S25 | 23 | Capstone: Architecture, Legacy Code & Interview Readiness | 120 min | NEW | Core |

### Why this order

- **Language first, in TypeScript from the start (S01).** The demos are `.tsx`
  with `strict: true` from Demo 1; teaching JavaScript in `.js` and then
  "adding types" would make learners unlearn habits. TypeScript is a thin
  layer over each JavaScript concept, so one session carries both.
- **Architecture before syntax (S02).** The CSR/SSR/SSG choice explains why
  ShopScope is a Vite SPA, what that costs, and where Next.js enters (S23).
- **Context & reducers *before* Zustand (S14 → S15).** Demo 13 (Zustand)
  argues "why a library". That argument only lands if the learner has built the
  same wishlist with Context + a reducer and watched the Profiler.
- **Styling before patterns before performance (S18 → S20).** The design-system
  arc: how to style, how to shape a component API, how to keep it fast. The
  structural fixes in Performance *are* the composition patterns from S19.
- **TanStack Query after the SPA is finished (S21).** Loaders don't cache; the
  learner has felt that by S16. The service layer from Demo 6 plugs in as-is.
- **Testing, then React 19, then Production, then Capstone (S22–S25).** Tests
  exist before CI needs them; React 19 Actions and RSC are shown once the
  client model is fully owned; Production readiness closes the SPA; the
  capstone refactors, reads legacy code and drills interviews.

### Renumbering (one-time)

Inserting Demo 12 means: rename `12-client-state-with-zustand` →
`13-client-state-with-zustand`, `13-advanced-http-and-shipping` →
`14-advanced-http-and-shipping`; update the two READMEs' *Where you are
starting from* and *Next demo*; update `demos/README.md`, the StackBlitz links,
the study-guide cross-references, and `scripts/verify-demos.mjs`. Demo 13's
Lab 1 changes from "replace Outlet context" to "replace the
`WishlistProvider`" — a stronger before/after.

### Dependencies in Part 6

The track's "install once" rule holds because every starter pins the same
dependency set. Part 6 adds libraries, so **Demo 15's starter pre-installs the
whole Part 6 set** (`react-error-boundary`, `clsx`, `@tanstack/react-query`,
`@tanstack/react-query-devtools`, `@tanstack/react-virtual`, `vitest`, `jsdom`,
`@testing-library/react`, `@testing-library/user-event`,
`@testing-library/jest-dom`, `msw`, `@playwright/test`,
`rollup-plugin-visualizer`, `@axe-core/react`, `babel-plugin-react-compiler`).
S23's Next.js mini-demo is its own folder (`21-…/next-mini/`) and is the only
exception.

---

## Part 0 — Before React

### S01 · JavaScript & TypeScript for React — 150 min + pre-reading

**Cold open.** Open `demos/01/starter/src/lib/format.ts` and
`data/sampleProducts.ts`. "By the end of today you will have written both of
these yourself, and a product grid with no React in it."

**You ship.** A Vite `vanilla-ts` project holding the ShopScope catalogue in
plain TypeScript: the `Product` type shaped like DummyJSON, `format.ts`,
`catalog.ts` (filter, sort, group, derive discounts), a live fetch of 194
products, and an imperatively rendered card grid with a wishlist heart that
you have to keep in sync by hand. S02 rewrites it in React.

**Pre-reading.** [study-notes 01](../study-notes/01-javascript-foundations/)
in full. The session teaches the subset React assumes; the notes carry the
rest (classes §20, npm/semver §23, cheat sheet §25).

| Lab | Min | JavaScript | TypeScript layered on top | Study-notes 01 |
|---|---|---|---|---|
| 1 · The language you'll write JSX in | 20 | `npm create vite -- --template vanilla-ts`; `let`/`const`, block scope, arrow functions & `this`, template literals, **expressions vs statements** | First annotations; `type Product` shaped like DummyJSON; `type` vs `interface`; optional `?`, `readonly`; `strict: true`; `npm run typecheck` vs Vite serving | §2–5 |
| 2 · Truthiness, unions and narrowing | 20 | The eight falsy values, `===`, `&&`/`||` short-circuit (the `0 &&` bug JSX will show you), `?.`, `??`, `||=`/`??=` | Literal unions `'asc' | 'desc'`, `as const` vs `enum`, `typeof`/`in` narrowing, `keyof`, indexed access `Product['category']` | §6–7 |
| 3 · Shapes: destructuring, spread, immutability | 25 | Object/array/parameter destructuring, spread and rest, shallow copy, reference vs value, **the four state updates you'll write constantly** | `Readonly<T>`, `Partial`, `Pick`, `Omit`, `Record` — each on `Product` | §8–11 |
| 4 · The array toolbox on 194 products | 25 | `map`/`filter`/`find`/`some`/`every`/`reduce`, `[...a].sort()` vs `sort()`, `slice` vs `splice`, `flatMap`, chaining; `Map`/`Set` | Callback inference, `Record<Category, Product[]>` from `reduce`, `noUncheckedIndexedAccess` and what `products[0]` really is | §12, 21 |
| 5 · Closures, purity, identity, generics | 20 | The stale-value counter, functions as values, calling vs referencing, higher-order functions, referential identity (`{} !== {}`) | Generic functions: `pluck<T, K extends keyof T>`, `debounce<A extends unknown[]>`; constraints, inference, when to write `<T>` and when not | §13–14, 22 |
| 6 · Modules & async | 25 | `import`/`export`, dynamic `import()`, promises, `async`/`await`, `Promise.all` vs sequential, `fetch` DummyJSON, `AbortController`, the event loop in one page, `try`/`catch` | `Promise<ProductListResponse>`, `unknown` in `catch`, a hand-written type guard `isApiError(e: unknown): e is …`, `Awaited<ReturnType<…>>`, `import type` | §15–18 |
| 7 · The DOM, imperatively | 15 | `document.createElement`, event delegation, `dataset`, the wishlist heart that must be re-synced on every filter — the code React replaces | `HTMLInputElement`, `HTMLElement | null`, `querySelector<T>` | §19 |

**Deferred to where it lands in the demos** (not front-loaded here): generics
in components (Demo 4, 8), `z.infer` (Demo 4), module augmentation (Demo 6),
discriminated unions for request state (Demo 12/13), `satisfies` (Demo 6),
`ComponentProps` and polymorphic types (Demo 17).

### S02 · React Introduction, Rendering Architectures & the Toolchain — 120 min + pre-reading

**Cold open.** Add a "sort by price" select to S01's vanilla grid. Watch the
wishlist hearts fall out of sync. "Every bug in this file is the same bug:
the DOM and the data disagree. React's one job is to make that impossible."

**You ship.** The exact `demos/01/starter`, scaffolded live from
`npm create vite`, with S01's `types.ts`, `format.ts` and `sampleProducts.ts`
ported in and one `<App>` component rendering the product names. `diff -r`
against the shipped starter is empty.

**Pre-reading.** [study-notes 02](../study-notes/02-react-introduction/) and
[03](../study-notes/03-rendering-architectures/) in full; both are complete.

| Block | Min | Covers | Source |
|---|---|---|---|
| 1 · Why React | 20 | The S01 pain → declarative UI; the four ideas (components, JSX, one-way data flow, state); what React is *not* (not a framework, no router, no fetching) | 02 §1–4, 6 |
| 2 · How React updates the screen | 15 | Trigger → render → commit; reconciliation and the "virtual DOM" as a diffing strategy; why components must be pure; a preview of `key`; React DevTools installed | 02 §5 |
| 3 · Where components become HTML | 25 | CSR vs SSR vs SSG; hydration; streaming; islands / ISR / PPR vocabulary; the e-commerce worked example; the metrics (LCP, INP, TTFB); the decision worksheet. **Verdict: ShopScope is a Vite CSR app** — what that costs (SEO, first paint) and when the answer flips (S23) | 03 §1–13 |
| 4 · The ecosystem in 2026 | 15 | CRA is deprecated; Vite vs Next.js / React Router framework mode vs custom bundlers; React 19 and the Compiler in one slide; **the libraries this program chose and why** (axios, RHF + zod, RR8 Data Mode, Zustand, React Bootstrap, DummyJSON) | 02 §7–13 |
| 5 · Lab: scaffold ShopScope | 45 | `npm create vite -- --template react-ts`; `tsconfig.app.json` strict; ESLint with `react-hooks` + `react-refresh` (what each rule catches); `bootstrap` + `react-bootstrap`, CSS import order; `index.html` → `main.tsx` boot sequence; `<StrictMode>` and the double `console.log`; port S01's files into `src/`; `<App>` renders `products.map(p => p.title)`; `npm run build` / `preview`; `.env` and the `VITE_` prefix in one minute (Demo 6 goes deep) | 02 §14–22 |

---

## Parts 1–3 — the shipped demos (Demos 1–11, S03–S13)

Scope unchanged. Nine small concepts are **absent from the whole track** and
fit as a *Concept* paragraph or a 2-minute *Challenge* in an existing lab:

| Concept | Where it fits | Why |
|---|---|---|
| `<Fragment>` / `<>` and why it exists | Demo 1 Lab 3 | Used but never explained |
| `React.memo` exists — and why you don't need it yet | Demo 2 Lab 2 (24 cards) | Plants the seed for S20 |
| `useId` for label/input/error wiring | Demo 4 Lab 1, `FieldShell` | The field library hand-rolls ids; `useId` is the correct tool and an interview staple |
| `React.ComponentProps<'input'>` for wrapper components | Demo 4 Lab 1, `TextField` | The idiomatic way to forward native props |
| `eslint-plugin-react-hooks` — what each rule catches | Demo 5 Lab 4 | Only Demo 8 mentions `exhaustive-deps`; learners should trust the linter from the first effect |
| `satisfies` on the validated config object | Demo 6 Lab 1 | The operator in its natural home |
| Path aliases (`@/`) in `tsconfig` + `vite.config` | Demo 6 Lab 2 | Every real codebase has them |
| `dangerouslySetInnerHTML` and XSS, in one paragraph | Demo 9 Lab 3 (product description) | Security awareness before S24 |
| Focus lands on the heading after navigation | Demo 9 Lab 3 | Bridges to S17 |

---

## Part 4 — State at scale

### S14 · Demo 12 (NEW) · Context & Reducers — 110 min — **Core**

**Cold open.** Open the products page, the detail page and the account page
in three tabs. Save something on each. Three different "saved!" messages, in
three different places, written three different ways. Then open
`ProductForm.tsx`: `saving`, `error`, `saved` — three booleans, eight states,
five of them impossible.

**You ship.** A `useReducer`-driven product form whose status cannot
contradict itself; a `ThemeContext` with a `useTheme()` hook that the header
consumes; a `ToastProvider` that every action and fetcher in the app reports
through; and the wishlist moved from Outlet context into a `WishlistProvider`
— with the Profiler open, so the re-render bill is on screen when the next
demo swaps it for Zustand.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · From three booleans to one reducer | 25 | `ProductForm` status as `{ status: 'idle' | 'saving' | 'error'; error?: ApiError }` driven by `useReducer`; the cart-line quantity math as a pure reducer function (used again by Zustand next demo) | `useReducer`, actions, reducers must be pure, reducers as state machines, discriminated-union state, exhaustive `switch`, `useState` vs `useReducer` |
| 2 · React Context, properly | 25 | `ThemeContext` (`'light' | 'dark'`), `<ThemeProvider>` in `main.tsx`, `useTheme()` that throws outside a provider, `SiteHeader` toggle | `createContext`/`useContext`, default value, provider placement, custom-hook-as-public-API. **React's `createContext` vs React Router's from Demo 11**: same name, different import, different mechanism |
| 3 · Reducer + Context: one toast system | 30 | `ToastProvider` = reducer + two contexts (state, dispatch); `useToasts()`; every router action/fetcher reports through it; the three per-page flash messages deleted | The standard reducer + context pattern, the state/dispatch split and why, Context re-renders every consumer |
| 4 · The wishlist in Context — and the bill | 30 | Move the wishlist from Outlet context into `WishlistProvider`; the detail page can finally save a product; open the Profiler and count what re-renders on one heart click | Context re-render cost, splitting contexts, `useMemo` on the provider value, what Context is *not* for → the exact hand-off to Demo 13 |

### S15 · Demo 13 · Client State with Zustand *(shipped as 12)* — 85 min

Unchanged except Lab 1's before/after: the store replaces `WishlistProvider`,
not Outlet context. Add one Concept paragraph: "selectors are what Context
cannot give you". Lab 2 reuses the cart reducer function from Demo 12 Lab 1
inside the store — one testable function, two homes.

## Part 5 — Shipping the SPA

### S16 · Demo 14 · Advanced HTTP & Shipping *(shipped as 13)* — 90 min

Unchanged. The *Where this leaves you* table now points forward to S17–S25
instead of "TanStack Query / TypeScript / Testing".

---

## Part 6 — Professional practice (Demos 15–23, S17–S25)

Every session starts from `14-…/solution` plus the previous Part 6 slice.

### S17 · Demo 15 · Refs, the DOM & Keyboard Accessibility — 110 min — **Core**

**Cold open.** Unplug the mouse. Try to get from the search box to the cart
drawer and back. Then submit the product form with two errors and ask "where
is my cursor?"

**You ship.** `/` focuses search from anywhere; failed submits focus the
first invalid field; route changes announce and focus the page heading;
`TextField` exposes `focus()`; the cart drawer closes on Escape and returns
focus to the button that opened it; a price-distribution chart drawn by a
non-React library into a `<canvas>`.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · A box that doesn't re-render | 15 | "Last search term" tracker; a render counter | What a ref is, refs vs state, when `ref.current` is populated, the mutable-box mental model — the `useRef` from Demos 7/10/14 finally explained |
| 2 · DOM refs and focus | 30 | `/` shortcut; focus the first invalid field on failed submit; focus + `aria-live` announce on route change in `RootLayout` | `useRef<HTMLInputElement>(null)`, ref callbacks, a `Map` of refs for a list, what you may and may not do to a node (read, focus, scroll, measure — never mutate what React renders) |
| 3 · `ref` as a prop and imperative handles | 20 | `TextField` accepts `ref` and exposes `{ focus, select }`; `Pager` scrolls the grid to top | React 19 `ref` as a prop; legacy `forwardRef` for reading old code; `useImperativeHandle` and why it should be rare |
| 4 · Measuring and third-party widgets | 25 | Price-distribution chart via a tiny canvas library into a ref; a tooltip positioned from `getBoundingClientRect()` | `useLayoutEffect` vs `useEffect` (the flicker you can see), `flushSync`, integrating non-React code with cleanup |
| 5 · The keyboard pass | 20 | Tab order, Escape closes the drawer and restores focus, `aria-pressed` on the density toggle, `prefers-reduced-motion` on the progress bar | Accessibility as correctness; the checklist S24 automates |

### S18 · Demo 16 · Styling & Theming in React — 110 min — **Recommended**

**Cold open.** "This app has zero lines of custom CSS. Your next job will not.
Here are the five ways teams do it, and you'll ship each one once."

**You ship.** The same `PriceTag` styled five ways (then the best one kept); a
`StockBadge` with `clsx`/`cva` variants; a dark theme wired to `ThemeContext`
from Demo 12 via Bootstrap's `data-bs-theme`, persisted, with no flash of the
wrong theme; a responsive product grid; and a one-page comparison of
styled vs headless component libraries.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · The five ways to style | 30 | `PriceTag` in plain CSS, CSS Modules, inline `style`, Tailwind (one component, via the Vite plugin), React Bootstrap utilities | Global vs scoped, specificity, `className` vs `style` (and why `style` objects are camelCase), when each is right, the cost of a CSS-in-JS runtime |
| 2 · Conditional classes and variants | 20 | `StockBadge` with `clsx`; a `cva`-style variant map for `Button` sizes/tones | Class composition, variant APIs, no string concatenation |
| 3 · Theming with CSS variables | 30 | `data-bs-theme` toggled by `useTheme()`, `prefers-color-scheme` default, persisted, an inline script in `index.html` to avoid the flash | CSS custom properties, Bootstrap 5.3 theming, system preference, FOUC |
| 4 · Responsive layout | 15 | `Row`/`Col` breakpoints for the grid, `Stack` for the toolbar, one container query | Mobile-first with a component library |
| 5 · Styled vs headless libraries | 15 | Swap `ConfirmDialog` to a headless dialog primitive and back | React Bootstrap vs shadcn/ui vs Radix / Base UI; how the ShopCrew sessions chose Tailwind + shadcn; what "headless" buys you (S19 builds one) |

### S19 · Demo 17 · Component Patterns, Portals & TypeScript Consolidation — 130 min — **Recommended**

**Cold open.** Open `ProductDetailPage.tsx`. It wants tabs (details, reviews,
shipping). Sketch the props for a `<Tabs>` that takes an array of
`{ label, content }`. Now add an icon to one tab, disable another, and make
the third lazy. Watch the props explode.

**You ship.** A compound `<Tabs>`; a `Pager` that works controlled *or*
uncontrolled; a polymorphic `<Text as="h2">`; a generic `<DataTable<T>>` on
the team page and a `<Select<T>>` that rejects a mismatched `onChange`; your
own `createPortal` dialog built once (then the library put back);
`react-error-boundary` around the cart drawer and the uploader with a real
"try again"; one render-prop and one HOC converted to hooks.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · Compound components | 25 | `<Tabs>` / `<Tabs.List>` / `<Tabs.Tab>` / `<Tabs.Panel>` on the detail page, arrow-key navigation | Implicit shared state via context, when the API is worth it, `useId` for `aria-controls` |
| 2 · Controlled *and* uncontrolled | 15 | `Pager` and `CategoryStrip` accept `value` **or** `defaultValue` | The `onChange` contract, supporting both modes, the "state reducer" idea |
| 3 · Polymorphic and generic components | 30 | `<Text as="h2">` typed; `<DataTable<T>>` for `/account/team`; `<Select<T>>` | `as`-prop typing with `ComponentPropsWithoutRef<T>`, generic components in `.tsx`, discriminated-union props (`variant: 'link'` requires `href`), `ReactNode` vs `ReactElement` vs `JSX.Element`, `PropsWithChildren` — **the TypeScript-with-React consolidation** |
| 4 · Portals and an accessible dialog | 30 | Replace `ConfirmDialog`'s Bootstrap `Modal` with your own `createPortal` dialog: focus trap, Escape, focus restore, `aria-modal`; then compare with native `<dialog>`; then put the library back | `createPortal`, events bubble through the React tree not the DOM, why you adopt a headless library rather than hand-roll |
| 5 · Component-level error boundaries | 15 | `react-error-boundary` around `CartDrawer` and `Uploader` with `resetKeys` and a retry | What boundaries catch and don't (event handlers, async, the boundary itself); why they're still classes; per-widget vs per-route (Demo 10) |
| 6 · Reading the old patterns | 15 | Convert one render-prop `<Fetch render={…}>` and one `withAuth` HOC from a `legacy/` folder into hooks | Render props, HOCs, why hooks won, how to read them in an inherited codebase |

### S20 · Demo 18 · Performance — Measure, then Fix — 120 min — **Core**

**Cold open.** Add `for (let i = 0; i < 2e6; i++) {}` to `ProductCard`. Type
in the search box. Now open the Profiler *before* touching any code.

**You ship.** A profiled and fixed product grid; a `memo`'d card broken on
purpose and repaired; deferred search and a transition on the account tabs; a
virtualised 194-item list; a bundle visualisation with a budget; the React
Compiler turned on and the hand-written memoisation deleted.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · Measure first | 20 | Profiler on the grid; "why did this render"; a `<Profiler>` wrapper logging commit durations | Render ≠ DOM update; the four causes of a re-render (state, parent, context, key); flamegraph vs ranked |
| 2 · Structural fixes | 20 | Push the density toggle state down; pass the grid as `children` of the toolbar; split `ToastContext` state/dispatch (Demo 12) | Composition beats memoisation; colocate state; the patterns from S19 as performance tools |
| 3 · `memo`, `useMemo`, `useCallback` | 25 | `memo(ProductCard)`; break it with an inline `style={{}}`; fix with `useMemo`/`useCallback`; the `useCallback` already in Demos 8–10 explained | Shallow equality, stable identities, referential identity (S01 Lab 5), the cost of memoising cheap things |
| 4 · Concurrent features | 20 | `useDeferredValue` on a client-side filter over the full list; `useTransition` on the account tab switch with a pending indicator | Urgent vs non-urgent updates, interruptible rendering, the single thread (S01 Lab 6) |
| 5 · Lists at scale and the bundle | 20 | `@tanstack/react-virtual` on the grid; `rollup-plugin-visualizer`; a size budget in `vite.config` | Virtualisation, tree-shaking, the cost of one dependency (`moment` vs `Intl`), route-level `lazy` (Demo 14) recap |
| 6 · The React Compiler | 15 | Enable `babel-plugin-react-compiler`; delete Lab 3's memoisation; re-profile | What the compiler assumes (Rules of React), what it doesn't remove the need for (structure, virtualisation, network) |

### S21 · Demo 19 · Server State with TanStack Query & Real-time Data — 130 min — **Recommended**

**Cold open.** Open a product, go back, open it again. Loader runs twice.
Network tab shows two identical requests. "Loaders fetch. They don't
remember."

**You ship.** Categories via `useQuery` with a visible cache; loader
`prefetchQuery` + component `useQuery` for instant back/forward on product
pages; mutations with invalidation replacing Demo 8's hand-rolled rules;
optimistic wishlist sync the TanStack way; "load more" via `useInfiniteQuery`;
stock levels polling only while the tab is visible; a simulated price ticker
over `EventSource` pushing into the cache; and a decision table for where each
kind of state lives.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · Server state is not client state | 20 | `QueryClientProvider`; `useQuery` for categories (Demo 7's "own lifetime" request); devtools | Cache, `queryKey`, `staleTime` vs `gcTime`, background refetch, dedupe |
| 2 · Queries alongside loaders | 25 | `queryClient.prefetchQuery` in the product loader + `useQuery` in the page; instant back/forward | Loaders don't cache; the loader + query pattern; `ensureQueryData` |
| 3 · Mutations and invalidation | 25 | Add/edit/delete via `useMutation`, `invalidateQueries`, use the server's response | Replaces Demo 8 Lab 2's five rules with two |
| 4 · Optimistic, the TanStack way | 15 | Wishlist sync with `onMutate` snapshot / `onError` rollback | Compare with Demo 14 Lab 1 (fetcher optimistic UI) |
| 5 · Infinite queries | 15 | "Load more" on the grid via `useInfiniteQuery` + `IntersectionObserver` | `getNextPageParam`, `skip/limit` paging |
| 6 · Keeping data fresh: polling, SSE, `useSyncExternalStore` | 20 | Stock levels with `refetchInterval`, paused when hidden; a simulated `PriceTicker` over `EventSource` writing `setQueryData`; `useOnlineStatus()` via `useSyncExternalStore` | Polling vs push, connection lifecycle in an effect with reconnect, subscribing to browser APIs without effects. **DummyJSON has no push channel** — the guide ships a 20-line mock SSE endpoint via a Vite dev-server plugin and says so |
| 7 · Where every kind of state lives | 10 | The decision table: URL · loader · TanStack Query · Zustand · react-hook-form · `useState` | Completes Demo 13's "four kinds of state" |

### S22 · Demo 20 · Testing React Applications — 130 min — **Core**

**Cold open.** Rename `onAdd` to `onAddToCart` in `ProductCard`. `npm run
typecheck` passes. The button does nothing. "Types caught the shape. Nothing
caught the behaviour."

**You ship.** Vitest + Testing Library wired into the Vite project; component
tests for `ProductCard`; pure tests for validation, retry, the Demo 12
reducers and the Zustand cart store; MSW handlers driving the products page
through loading/results/error/empty and the refresh-queue interceptor; router
tests with `createRoutesStub`; one Playwright journey; and a `test` script
that S24 puts in CI.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · The toolchain | 15 | `vitest` + `jsdom` + RTL + `user-event` + `jest-dom`; `vitest.config` sharing `vite.config` | The testing trophy; what is worth testing (behaviour and contracts, not implementation) |
| 2 · Testing a component | 25 | `ProductCard`: renders price/discount, toggles wishlist, calls `onAdd` once, disabled when out of stock | `render`/`screen`, query priority (`getByRole` first — it *is* an a11y check), `getBy`/`queryBy`/`findBy`, `userEvent` over `fireEvent` |
| 3 · Testing pure logic | 15 | `validation.ts`, `retry.ts`, the product-form reducer, the cart store (`store.setState` reset in `beforeEach`) | No `render` at all; reducers are trivially testable; testing Zustand outside React |
| 4 · Mocking the network with MSW | 30 | Products page: skeleton → results, error with retry, empty; the auth interceptor's refresh queue under six concurrent 401s | Handlers not `fetch` mocks; the four data states; testing interceptors and the `ApiError` normaliser |
| 5 · Testing routes | 20 | `createRoutesStub` for loaders, actions, middleware redirects (`/account` → `/login?redirectTo=`) | Testing the router layer without a browser; `useLoaderData` in tests |
| 6 · One E2E journey | 25 | Playwright: login as `emilys` → add to cart → checkout, against DummyJSON | What deserves E2E; flakiness and `await expect(...)`; the gate: typecheck → lint → test → build |

### S23 · Demo 21 · React 19 Actions, Suspense & Server Components — 130 min — **Recommended**

**Cold open.** Open `SignupForm.tsx` (react-hook-form) and `LoginPage.tsx`
(router `<Form>` + action). "React 19 shipped a third way. Here is when each
of the three wins."

**You ship.** The sign-up form re-done with `<form action>` +
`useActionState`, a `useFormStatus` submit button and a `useOptimistic`
wishlist toggle; product detail via `<Suspense>` + `use(promise)`; per-route
`<title>`/`<meta>`; and a Next.js mini-project rendering ShopScope's product
list as an async Server Component with a single client island — bundle
compared side by side.

| Block | Min | Builds | Concepts |
|---|---|---|---|
| 1 · React Actions in the SPA | 30 | Sign-up with `<form action>` + `useActionState`; nested submit button with `useFormStatus`; wishlist toggle with `useOptimistic` and automatic rollback | React Actions vs router actions (Demo 10) vs react-hook-form (Demo 4): when each |
| 2 · Suspense for data and `use` | 25 | Product detail: loader returns `{ product, reviews: promise }`; `<Suspense>` around reviews with `use(reviews)`; `<Await>` compared | Boundary placement, avoiding waterfalls, streaming a slow section, `useDeferredValue` initial value |
| 3 · Other React 19 changes | 15 | `<title>` / `<meta>` per route; `ref` as prop (S17) recap; stylesheet precedence; improved hydration errors | React 19 release notes, what to delete from old code (`forwardRef`, `defaultProps`) |
| 4 · Server Components, conceptually | 25 | Whiteboard: the server/client boundary, `'use client'` as a *boundary* not a file switch, serialisable props, `children` across the boundary, `'use server'` and Server Functions, caching/revalidation vocabulary, when RSC is *not* the answer | study-notes 03 → 19 |
| 5 · Mini-demo in Next.js | 35 | `21-…/next-mini/`: `/products` as an `async` Server Component calling DummyJSON directly; `AddToCartButton` as the one `'use client'` island; add-to-cart as a Server Function; compare `next build` output with the Vite bundle | Seeing the boundary once, hands-on; the framework tax and payoff |

### S24 · Demo 22 · Production Readiness — 130 min — **Core**

**Cold open.** Run `npx @axe-core/cli` on the deployed preview from Demo 14.
Then `curl -I` it and read the headers. "Deployed is not done."

**You ship.** Zero `axe` violations; a sanitised description renderer and a
CSP; per-route metadata and an honest note on what a crawler sees; locale-aware
prices and dates; an error-reporting SDK behind Demo 6's logger with source
maps uploaded not served; Web Vitals reported; a GitHub Actions gate
(typecheck → lint → test → build → bundle budget → preview deploy); Prettier +
Husky + lint-staged; a printable release checklist.

| Lab | Min | Builds | Concepts |
|---|---|---|---|
| 1 · Accessibility audit | 25 | `@axe-core/react` in dev, `vitest-axe` in tests, fix every finding, one screen-reader pass | Semantic HTML first; focus on route change (S17); contrast; automated checks as the floor, not the ceiling |
| 2 · Security | 25 | Sanitise a rendered description (`DOMPurify`); CSP header on `vite preview`/host config; `npm audit`; the `localStorage` vs `httpOnly` cookie trade-off revisited with CSRF | XSS, `dangerouslySetInnerHTML`, CSP, CSRF for cookie auth, "anything in the bundle is public", never trusting the client |
| 3 · SEO and metadata | 15 | Per-route `<title>`/`<meta>`/canonical/Open Graph (S23 Block 3); `curl` the page and see an empty `<div id="root">` | What Module 3's rendering choice already decided; sitemap/robots; when to move to SSR/SSG |
| 4 · Internationalisation | 15 | `formatPrice` → `Intl.NumberFormat` by locale; `Intl.DateTimeFormat` for order dates; `Intl.PluralRules` for "3 items"; a `t()` stub and a language switch | `Intl`, message extraction, RTL awareness, why `moment` is gone |
| 5 · Observability | 20 | An error-reporting SDK (Sentry-style) behind the Demo 6 logger; boundaries report; source maps uploaded but not served; `web-vitals` reporting LCP/INP/CLS | Structured logging, real-user monitoring vs Lighthouse, meaningful failure states |
| 6 · The quality gate | 30 | `.github/workflows/ci.yml`: typecheck → lint → test → build → bundle budget → preview deploy per PR; Prettier + Husky + lint-staged; `size-limit` | CI/CD, preview deployments, failing on regressions, coverage as a signal not a target |

### S25 · Demo 23 · Capstone: Architecture, Legacy Code & Interview Readiness — 120 min — **Core**

**Cold open.** `find src -name '*.tsx' | wc -l`. Sixty files in `components/`
and `routes/`. "Where does the next feature go? If the answer takes more than
five seconds, the architecture is already costing you."

**You ship.** `src/` refactored into feature folders with a documented
dependency direction and one ADR; a `legacy/` folder of class components,
HOCs, Redux `connect` and React Router v5 code read and mapped to what you
would write today; a capstone brief; and an interview drill keyed to the
ShopScope code.

| Block | Min | Builds | Concepts |
|---|---|---|---|
| 1 · Architecture for the next 12 months | 40 | Refactor into `features/catalog`, `features/account`, `features/cart`, `components/ui`, `lib`, `api`; `eslint-plugin-boundaries` or `import/no-restricted-paths` for dependency direction; path aliases; barrel-file trade-offs; one ADR | study-notes 14 §10; feature vs type folders; where types live; what a new hire should find in five seconds |
| 2 · Reading legacy React | 30 | A `legacy/` folder: a class `ProductList` with `componentDidMount`/`componentDidUpdate`/`componentWillUnmount`, an error-boundary class, a `connect()`-ed Redux container, `react-router-dom` v5 `<Switch>`/`withRouter`, `PropTypes`; map each to hooks / RR8 / TypeScript | Lifecycle → `useEffect` mapping, `this.setState` → `useState`, why boundaries are still classes, how to read what you'll inherit |
| 3 · Capstone brief | 15 | Learners extend ShopScope end-to-end with one feature (orders history, product reviews, or a back-office table): types → service → loader/query → route → store → tests → CI | The whole program in one feature; assessment rubric |
| 4 · Interview drill | 35 | One question per session, answered from the ShopScope code: why `key` matters; state as a snapshot; why not fetch in an effect; Context vs Zustand vs TanStack Query; `memo` vs the Compiler; what Actions replace; `'use client'` as a boundary; how you'd test the refresh queue | Consolidation; the ability to *defend* every architectural choice in the app |

---

## Coverage check against the study notes

| Study-notes module | Covered by |
|---|---|
| 01 JavaScript Foundations | S01 + pre-reading |
| 02 React Introduction | S02 |
| 03 Rendering Architectures | S02, S23 |
| 04 Components & JSX · 05 Props · 06 Conditional & Lists | S03–S04 (Demos 1–2) |
| 07 State & Events · 08 State Structure | S04–S05, S10 (Demos 2–3, 8) |
| 09 Reducers & Context | **S14 (Demo 12, NEW)**, S15 |
| 10 Forms | S05–S06, S12 (Demos 3–4, 10); React Actions in S23 |
| 11 Refs & the DOM | **S17 (Demo 15, NEW)** |
| 12 Effects | S07, S09, S10 (Demos 5, 7, 8); `useSyncExternalStore` in S21 |
| 13 Data Fetching & Custom Hooks | S07–S10 (Demos 5–8); TanStack Query in **S21 (NEW)** |
| 14 Routing & Architecture | S11–S13, S16 (Demos 9–11, 14); architecture in **S25 (NEW)** |
| 15 Performance | **S20 (Demo 18, NEW)** |
| 16 Advanced Patterns, Error Boundaries & Portals | S12 (route boundaries); **S19 (Demo 17, NEW)** |
| 17 TypeScript with React | **S01 (NEW)**; woven through Demos 1–14; consolidated in **S19** |
| 18 Testing | **S22 (Demo 20, NEW)** |
| 19 Server Components & React 19 | **S23 (Demo 21, NEW)** |
| 20 Production | S16 (Demo 14); **S24 (Demo 22, NEW)** |

## Build order (for authoring the new material)

1. **S14 · Demo 12 Context & Reducers** — the only change inside the chain;
   do the renumbering at the same time.
2. **S01, S02** — Part 0; S02's lab must diff to zero against Demo 1's starter.
3. **S17 → S20** in order (refs, styling, patterns, performance) — each starter
   is the previous one finished.
4. **S21, S22** — TanStack Query + real-time, then testing.
5. **S23, S24, S25** — React 19 / Next.js mini, production, capstone.

## Short-course cuts

- **Core only (19 sessions):** S01–S17, S20, S22, S24, S25 — drop S18, S19,
  S21, S23. Move `useId`, `ComponentProps` and `react-error-boundary` into
  S17 as challenges so nothing hiring-critical is lost.
- **Add back in order of hiring value:** S21 (TanStack Query) → S19
  (patterns) → S23 (React 19 / RSC) → S18 (styling).
