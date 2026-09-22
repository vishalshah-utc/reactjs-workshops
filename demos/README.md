# ShopScope — the demo track

A **25-session ReactJS Developer program** that builds **one app** — *ShopScope*,
a product explorer — from "what is a variable" to a routed, authenticated,
tested, profiled, production-ready app. Two language-and-orientation sessions,
twenty-one incremental demos, and a capstone — plus a two-demo state-management
set that builds one feature in Zustand and again in Redux Toolkit, then takes it
into RxJS streams. TypeScript,
Vite and `strict: true` from the first file.

The full curriculum, with every lab, its minutes and the reasoning behind the
order, is in **[COURSE-OUTLINE.md](./COURSE-OUTLINE.md)**.

This track is deliberately different from the [ten-session ShopCrew
curriculum](../sessions/):

| | Sessions (ShopCrew) | Demos (ShopScope) |
|---|---|---|
| Purpose | A cohort course with labs, homework, held-back solutions | **Topic-wise demos** to run live, or to practise from |
| Language | TypeScript | **TypeScript** (`.tsx`, `strict: true`) — the same setup as the sessions, types introduced one at a time |
| UI | Tailwind v4 + shadcn/ui | **React Bootstrap** — no custom CSS at all |
| Backend | The bundled ShopCrew API | **[DummyJSON](https://dummyjson.com)** — free, no key, real JWT + refresh |
| HTTP | `fetch` → TanStack Query | **axios** — instances, interceptors, one `ApiError` |
| Forms | React Hook Form + Zod | Hand-rolled first, then **react-hook-form + zod** over the same field components |
| Routing | React Router 7 | **React Router 8** (Data Mode, middleware) |
| Client state | Zustand | **Zustand** — stores as hooks, selectors, `persist`, the store outside React |

Every demo has a **guide** (`README.md`, in the *Problem → Concept → Steps →
Verify → Watch out* format) and a **starter** that opens in StackBlitz with
one click or runs locally with `npm install && npm run dev`. Starter files
carry `TODO(lab-x.y)` markers that the guide walks through in order.

**The starter of demo N+1 is demo N, finished.** Miss one, join at the next.
Demo 14 ships the finished SPA in `14-…/solution/`; the final demo, 23, ships
the finished *program* app in `23-…/solution/`.

## The sessions

### Part 0 — Before React

| # | Session | You build | Open |
|---|---|---|---|
| S1 | [JavaScript & TypeScript for React](./00a-javascript-and-typescript-for-react/) | The ShopScope catalogue in plain TypeScript: the `Product` type, `format.ts`, `catalog.ts`, a live DummyJSON fetch and an imperative card grid whose wishlist you sync by hand | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/00a-javascript-and-typescript-for-react/starter) |
| S2 | [React Introduction, Rendering Architectures & the Toolchain](./00b-react-introduction-and-toolchain/) | What React is and how it updates the screen; CSR/SSR/SSG and why ShopScope is a Vite SPA; then scaffold Demo 1's starter live from `npm create vite` | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/00b-react-introduction-and-toolchain/starter) |

### Parts 1–5 — The SPA (Demos 1–14)

| # | Demo | You build | Open |
|---|---|---|---|
| 1 | [Components, JSX & Props](./01-components-jsx-props/) | Header, price tag, stock badge, a composed product card — and the `Product` type they all take | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/01-components-jsx-props/starter) |
| 2 | [Lists, Keys & State](./02-lists-keys-and-state/) | 24-card grid, category strip, density toggle, the index-key bug on demand | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/02-lists-keys-and-state/starter) |
| 3 | [Events, Forms & Lifting State](./03-events-forms-and-lifting-state/) | Search, sort, a wishlist that survives filtering, add/delete with validation | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/03-events-forms-and-lifting-state/starter) |
| 4 | [Forms: Reusable Fields, Manual Validation & react-hook-form](./04-forms-manual-and-react-hook-form/) | `TextField` from scratch, a field library, the product form hand-rolled, a sign-up form with react-hook-form + zod — same components | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/04-forms-manual-and-react-hook-form/starter) |
| 5 | [Effects & the Network](./05-effects-and-the-network/) | axios, three states, human errors, cancellation, StrictMode explained | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/05-effects-and-the-network/starter) |
| 6 | [Configuration & the API Layer](./06-config-and-the-api-layer/) | `.env` profiles, validated config, instances, endpoints, services, `ApiError`, interceptors | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/06-config-and-the-api-layer/starter) |
| 7 | [Search, Filters & Pagination](./07-search-filters-and-pagination/) | Server-side filters, debounce, parallel requests, paging, a detail drawer | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/07-search-filters-and-pagination/starter) |
| 8 | [Mutations & Custom Hooks](./08-mutations-and-custom-hooks/) | `POST`/`PATCH`/`DELETE`, a form that keeps its input, `useApi` | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/08-mutations-and-custom-hooks/starter) |
| 9 | [Routing with React Router v8](./09-routing-with-react-router/) | Layouts, pages, params, Outlet context, filters in the URL | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/09-routing-with-react-router/starter) |
| 10 | [Loaders, Actions & Error Boundaries](./10-loaders-actions-and-error-boundaries/) | Data before render, `<Form>` + actions, fetchers, pending UI, scoped boundaries | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/10-loaders-actions-and-error-boundaries/starter) |
| 11 | [Authentication & Protected Routes](./11-auth-and-protected-routes/) | JWT login, refresh queue, middleware guards, roles | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/11-auth-and-protected-routes/starter) |
| 12 | [Context & Reducers](./12-context-and-reducers/) | A `useReducer` form status that cannot contradict itself, a theme context, one toast system for the whole app, and the wishlist in a provider — with the re-render bill on screen | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/12-context-and-reducers/starter) |
| 13 | [Client State with Zustand](./13-client-state-with-zustand/) | A wishlist store that replaces the provider, a real cart with a drawer, `persist`, and a checkout action that reads the store outside React | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/13-client-state-with-zustand/starter) |
| 14 | [Advanced HTTP & Shipping](./14-advanced-http-and-shipping/) | Optimistic UI, upload progress, retries, lazy routes, deploying an SPA | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/14-advanced-http-and-shipping/starter) · [finished SPA](./14-advanced-http-and-shipping/solution/) |

### Part 6 — Professional practice (Demos 15–23)

Each starts from the finished SPA and adds a slice. Demo 15's starter carries
the extra dependencies the whole part uses, so you still install once.

| # | Demo | You build | Open |
|---|---|---|---|
| 15 | [Refs, the DOM & Keyboard Accessibility](./15-refs-dom-and-accessibility/) | `/` focuses search, failed submits focus the first error, route changes announce, `TextField` exposes `focus()`, a canvas chart drawn by a non-React library, a keyboard pass | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/15-refs-dom-and-accessibility/starter) |
| 16 | [Styling & Theming in React](./16-styling-and-theming/) | The same component styled five ways, `clsx` variants, a persisted dark theme on `data-bs-theme` with no flash, responsive layout, styled vs headless libraries | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/16-styling-and-theming/starter) |
| 17 | [Component Patterns, Portals & TypeScript Consolidation](./17-component-patterns-and-portals/) | Compound `<Tabs>`, controlled-or-uncontrolled `Pager`, polymorphic `<Text as>`, generic `<DataTable<T>>`, a `createPortal` dialog, component-level error boundaries, HOC → hook | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/17-component-patterns-and-portals/starter) |
| 18 | [Performance — Measure, then Fix](./18-performance/) | Profiler first, structural fixes, `memo`/`useMemo`/`useCallback`, `useDeferredValue` + `useTransition`, a virtualised grid, a bundle budget, the React Compiler | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/18-performance/starter) |
| 19 | [Server State with TanStack Query & Real-time Data](./19-tanstack-query-and-realtime/) | Cached queries beside loaders, mutations with invalidation, optimistic updates, infinite queries, polling, a mock SSE ticker, `useSyncExternalStore` | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/19-tanstack-query-and-realtime/starter) |
| 20 | [Testing React Applications](./20-testing/) | Vitest + Testing Library, pure tests for reducers and stores, MSW for the four data states and the refresh queue, `createRoutesStub`, one Playwright journey | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/20-testing/starter) |
| 21 | [React 19 Actions, Suspense & Server Components](./21-react-19-actions-suspense-and-server-components/) | `useActionState`/`useFormStatus`/`useOptimistic`, `<Suspense>` + `use`, per-route metadata, and a Next.js mini-project with one client island | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/21-react-19-actions-suspense-and-server-components/starter) |
| 22 | [Production Readiness](./22-production-readiness/) | `axe` to zero, sanitising + CSP, SEO metadata and the CSR limit, `Intl`, error reporting + Web Vitals, a GitHub Actions gate with a bundle budget | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/22-production-readiness/starter) |
| 23 | [Capstone: Architecture, Legacy Code & Interview Readiness](./23-capstone-architecture-legacy-and-interviews/) | Feature-folder refactor with enforced dependency direction, a legacy folder read and mapped to today's React, the capstone brief, the interview drill | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/23-capstone-architecture-legacy-and-interviews/starter) · [finished app](./23-capstone-architecture-legacy-and-interviews/solution/) |

### Part 7 — State management in depth (a parallel pair)

Three demos. The first two build **one feature in two libraries**; the third
takes the Redux version further into reactive side effects. Both start from the finished SPA and
build the same admin Inventory Console: products loaded through the store,
normalised entities, debounced filters that must discard a stale response,
optimistic edits that roll back, bulk updates with undo, persistence with a
migration, and working DevTools time-travel. Neither is a chain link — each
ships its own starter and solution, and the main track is untouched.

Teach 24a or 24b alone, or both back to back, which turns "which state library
should we use" from an argument into a measurement. 24c continues from 24b
finished, and is the one chain link in the set. Both guides carry ASCII flow
diagrams and deep links to the official documentation.

| # | Demo | You build | Open |
|---|---|---|---|
| 24a | [Advanced Zustand](./24a-advanced-zustand/) | Slices and the middleware stack, async in the store with cancellation and a request id, immer, `subscribeWithSelector`, `persist` with migrations, selector discipline, a reset registry — and the honest limits that send you to TanStack Query | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24a-advanced-zustand/starter) · [finished](./24a-advanced-zustand/solution/) |
| 24b | [Redux Toolkit](./24b-redux-toolkit/) | `createSlice`, `createAsyncThunk` in full, `createEntityAdapter`, memoised selectors, `createListenerMiddleware`, then RTK Query rebuilt on a custom axios `baseQuery` over the existing API layer, with tags and optimistic updates | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24b-redux-toolkit/starter) · [finished](./24b-redux-toolkit/solution/) |
| 24c | [Redux-Observable, RxJS & a WebSocket Stream](./24c-redux-observable-and-rxjs/) | A persistent WebSocket as a stream — opened on mount, torn down with `takeUntil`, reconnecting with backoff via `retry` — plus the debounced search rebuilt as an epic, where `switchMap` / `mergeMap` / `concatMap` / `exhaustMap` become four visible behaviours, and marble tests | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/24c-redux-observable-and-rxjs/starter) · [finished](./24c-redux-observable-and-rxjs/solution/) |

## Running a demo

**One click, no account:** the ▶ starter link. It boots into a running app.

> ⚠️ Click it **once per demo**, then bookmark the tab. Every click of a
> `/fork/` link creates a *fresh copy*. After it loads, the address bar becomes
> `stackblitz.com/edit/…` — that URL is your project.

**Locally:**

```bash
git clone https://github.com/vishalshah-utc/reactjs-workshops.git
cd reactjs-workshops/demos/01-components-jsx-props/starter
npm install && npm run dev
```

**Node 22.22+** (`react-router@8` requires it). Every starter in Demos 1–14
pins the *same* dependency set, so you install once and `npm run dev`
anywhere; Demos 15–23 share a second, larger set (added at Demo 15), so Part 6
is one more install. Session 1 is a plain Vite + TypeScript project. `npm run
typecheck` runs the compiler — Vite doesn't while serving; `npm run build` is
`tsc -b && vite build`, so a type error fails the build.

## The backend

[DummyJSON](https://dummyjson.com): 194 products, search, categories,
pagination, a JWT login with refresh-token rotation, and user roles. No key,
no signup, CORS open. **Reads are real; writes are simulated** — a `POST`
returns a proper response with a new id, but nothing persists. The guides are
written around that.

Append `&delay=2000` to any request to slow it down — you'll use it constantly.

| Username | Password | Role |
|---|---|---|
| `emilys` | `emilyspass` | admin |
| `averyp` | `averyppass` | user |

## For trainers

Each starter is the previous demo finished, so you can demo any topic in
isolation: open starter N, follow the guide, and starter N+1 is your answer
key. Types grow the same way — `src/types.ts` gains an interface when the
demo that needs it arrives, never before. The long-form reference for everything in demos 5–11 and 14 is the
[Axios, HTTP & Routing study guide](../study-guides/React-Axios-HTTP-and-Routing-Study-Guide.md);
the theory track for the whole program is the [study notes](../study-notes/).
The session-by-session plan, including the reasoning for the order and a
19-session core-only cut, is [COURSE-OUTLINE.md](./COURSE-OUTLINE.md).

```bash
node scripts/verify-demos.mjs   # structure checks: markers, pins, StackBlitz config
```
