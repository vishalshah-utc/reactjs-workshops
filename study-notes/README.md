# ReactJS Study Notes — Module-wise Curriculum

**Teaching React from scratch.** Twenty modules that go from "I have written
some JavaScript" to "I can reason about a production React codebase and defend
my architectural choices".

These are **study notes**: the reference and theory track. They are written to
be read on their own, revisited later, and used as a teaching script. The
hands-on labs live in [`../sessions/`](../sessions/) — same curriculum, built
as ten two-hour workshops against the ShopCrew product and API.

| | |
|---|---|
| 📚 **You are here** — `notes/` | Module-wise study notes. Read, understand, self-check |
| 🛠 **[`../sessions/`](../sessions/)** | Ten hands-on workshops. Build ShopCrew |
| 📋 **[`../PLAN.md`](../PLAN.md)** | The workshop curriculum plan |

**References are from the official React documentation ([react.dev](https://react.dev))
only** — and, in the Part 7 library modules, that library's own official docs.
No third-party blogs, no videos — everything cited is something its maintainers
keep correct as the software moves.

---

## The modules

### Part 0 — Before React

| # | Module | Time | Status |
|---|---|---|---|
| 1 | **[JavaScript Foundations for React](./01-javascript-foundations/)** | 4–6h | ✅ complete |

Everything in JavaScript that React assumes you know — and nothing that it
doesn't. Scope, closures, destructuring, spread, immutability, the array
methods, modules, promises, purity and referential identity. Every section ends
with **→ In React**, naming the exact place the concept resurfaces.

### Part 1 — Getting oriented

| # | Module | Time | Status |
|---|---|---|---|
| 2 | **[Introduction to React & Getting Started](./02-react-introduction/)** | 3–4h | ✅ complete |
| 3 | **[Rendering Architectures: CSR, SSR & SSG](./03-rendering-architectures/)** | 2–3h | ✅ complete |

What React is and the problem it solves; the four ideas it is built on; how it
updates the screen. Then the tooling decision in full: **Create React App is
deprecated** — what to use instead, and why (Vite, full-stack frameworks,
custom bundlers). Module 3 covers where and when your components become HTML,
the trade-offs of each strategy, mixing them per route, hydration and
streaming, and how to choose.

### Part 2 — The component model

| # | Module | Time | Status |
|---|---|---|---|
| 4 | **[Describing the UI: Components & JSX](./04-components-and-jsx/)** | 2–3h | ✅ complete |
| 5 | **[Props & Component Composition](./05-props-and-composition/)** | 2–3h | ✅ complete |
| 6 | **[Conditional Rendering & Lists](./06-conditional-rendering-and-lists/)** | 2h | ✅ complete |

Components and JSX from the ground up: what JSX compiles to and why each of its
rules exists; designing a component's props API and composing with `children`
and slots; and the two halves of every screen — conditional rendering (including
the falsy-`0` trap) and lists, with `key` treated as the correctness issue it is
rather than a warning to silence.

### Part 3 — State

| # | Module | Time | Status |
|---|---|---|---|
| 7 | **[State & Events](./07-state-and-events/)** | 3h | ✅ complete |
| 8 | **[Structuring State: Objects, Arrays, Lifting & Resetting](./08-state-structure/)** | 3h | ✅ complete |
| 9 | **[Reducers & Context](./09-reducers-and-context/)** | 3h | ✅ complete |
| 10 | **[Forms & Controlled Components](./10-forms/)** | 3h | ✅ complete |

`useState` and events, including the two things that confuse everyone —
state-as-a-snapshot and why three setter calls increment once. Then the
decisions that keep a codebase workable: immutable updates at every depth, a
state shape that cannot contradict itself, which component should own a value,
and controlling when React preserves state versus resets it. Module 9 adds
reducers (one testable pure function instead of scattered update rules) and
Context, including the re-render cost and the state/dispatch split that avoids
it.

### Part 4 — Escape hatches

| # | Module | Time | Status |
|---|---|---|---|
| 11 | **[Refs & the DOM](./11-refs-and-the-dom/)** | 2h | ✅ complete |
| 12 | **[Effects & Synchronisation](./12-effects/)** | 3.5h | ✅ complete |
| 13 | **[Data Fetching & Custom Hooks](./13-data-fetching-and-custom-hooks/)** | 3h | ✅ complete |

Forms end Part 3 — every input type, validation that is actually accessible,
and React 19 Actions. Then the escape hatches: refs for values React must not
re-render for and for the DOM nodes it does; effects, which is the module where
most React bugs are born and which spends as much space on deleting effects as
writing them; and data fetching, where hand-rolling stops being viable — build
`useFetch` correctly, then read the list of what it still cannot do.

### Part 5 — Applications

| # | Module | Time | Status |
|---|---|---|---|
| 14 | **[Routing & Application Architecture](./14-routing/)** | 2.5h | ✅ complete |
| 15 | **[Performance & Optimisation](./15-performance/)** | 2.5h | ✅ complete |
| 16 | **[Advanced Patterns, Error Boundaries & Portals](./16-advanced-patterns/)** | 2.5h | ✅ complete |

### Part 6 — Professional practice

| # | Module | Time | Status |
|---|---|---|---|
| 17 | **[TypeScript with React](./17-typescript-with-react/)** | 2.5h | ✅ complete |
| 18 | **[Testing React Applications](./18-testing/)** | 2.5h | ✅ complete |
| 19 | **[Server Components & Modern React 19](./19-server-components/)** | 2.5h | ✅ complete |
| 20 | **[Shipping to Production](./20-production/)** | 2h | ✅ complete |

### Part 7 — The application stack (written for the ShopScope demo track)

| # | Module | Time | Status |
|---|---|---|---|
| 21 | **[The API Layer: Configuration, axios & Advanced HTTP](./21-api-layer-and-advanced-http/)** | 3h | ✅ complete |
| 22 | **[Authentication & Protected Routes](./22-authentication-and-protected-routes/)** | 2.5h | ✅ complete |
| 23 | **[Client State Libraries: Zustand, Redux Toolkit & RxJS](./23-client-state-libraries/)** | 3.5h | ✅ complete |
| 24 | **[Server State: TanStack Query & Real-time Data](./24-server-state-tanstack-query-and-realtime/)** | 3h | ✅ complete |
| 25 | **[Styling & Theming in React](./25-styling-and-theming/)** | 2.5h | ✅ complete |
| 26 | **[Accessibility in React](./26-accessibility/)** | 2.5h | ✅ complete |
| 27 | **[Architecture, Legacy Code & Interview Readiness](./27-architecture-legacy-code-and-interviews/)** | 3h | ✅ complete |

Modules 1–20 are the React curriculum. Part 7 is the rest of a professional
front-end stack as the demo track uses it — the HTTP layer, auth, the state
libraries, the server-state cache, styling, accessibility, and how to organise
and defend the result. Where a module is about a library rather than React, its
references are that library's official documentation.

**Status key:** ✅ full notes written.

---

## Why the modules are in this order

The sequence is deliberate, and a few of the choices are worth stating.

**JavaScript first, in its own module.** Almost every early React confusion is a
JavaScript gap. Teaching `useState` to someone who is not comfortable with
closures and reference equality produces someone who can copy patterns but
cannot debug them.

**Architecture before syntax (Modules 2–3).** The CSR/SSR/SSG decision shapes
which framework you learn, where your data fetching lives, and what you can
promise about SEO and performance. Making that choice by accident — because a
tutorial said `npx create-react-app` — is how teams end up rewriting.

**Effects late, and last among the core hooks.** `useEffect` is the most
over-used hook in React. Teaching it *after* state structure, reducers and
derived values means most of the effects a beginner would have written never get
written — which is the actual goal.

**Server Components after the client model.** RSC is easier to reason about once
you know what state, effects and the client boundary cost. Module 3 introduces
the concept early so the vocabulary exists; Module 19 goes deep.

---

## How to study

1. **Read the module.** Skim the contents list first so you know the shape.
2. **Type the examples.** Reading code is not learning code.
3. **Do the self-check** at the end. If you cannot answer a question, that
   section did not land — go back to it before moving on.
4. **Build the matching demo** from the [demo track](../demos/) (or the session lab in [`../sessions/`](../sessions/)).
5. **Keep react.dev open.** These notes are a curated path through it, not a
   replacement for it.

Two habits that separate people who get good at React quickly from people who
don't:

- **Use React DevTools from day one.** Components tab for props/state/hooks,
  Profiler for renders. Guessing is slower than looking.
- **Take `react-hooks/exhaustive-deps` seriously.** When the linter complains
  about an effect, it has found a real bug roughly nine times out of ten.

---

## Mapping to the ShopScope demos

The [demo track](../demos/) builds one app, ShopScope, over 25 sessions. Each demo
guide opens with a **Pre-reading** section that names the modules below; this is the
same map in both directions. Several modules can feed one demo.

**Demo → study notes** (in session order)

| Demo | Read |
|---|---|
| [S1 · JavaScript & TypeScript for React](../demos/00a-javascript-and-typescript-for-react/) | [01](./01-javascript-foundations/) in full · [17](./17-typescript-with-react/) the tsconfig and typed-props sections |
| [S2 · React Introduction & the Toolchain](../demos/00b-react-introduction-and-toolchain/) | [02](./02-react-introduction/) in full · [03](./03-rendering-architectures/) in full |
| [Demo 1 · Components, JSX & Props](../demos/01-components-jsx-props/) | [04](./04-components-and-jsx/) in full · [05](./05-props-and-composition/) props, destructuring, defaults, `children` · [17](./17-typescript-with-react/) typing props |
| [Demo 2 · Lists, Keys & State](../demos/02-lists-keys-and-state/) | [06](./06-conditional-rendering-and-lists/) lists, `key`, deriving lists · [07](./07-state-and-events/) `useState`, state as a snapshot |
| [Demo 3 · Events, Forms & Lifting State](../demos/03-events-forms-and-lifting-state/) | [07](./07-state-and-events/) events, handlers, updater functions · [08](./08-state-structure/) lifting state, immutable updates, derived values · [10](./10-forms/) controlled inputs, the first form |
| [Demo 4 · Forms: Reusable Fields, Manual Validation & react-hook-form](../demos/04-forms-manual-and-react-hook-form/) | [10](./10-forms/) in full · [17](./17-typescript-with-react/) inference from zod schemas |
| [Demo 5 · Effects & the Network](../demos/05-effects-and-the-network/) | [12](./12-effects/) in full · [13](./13-data-fetching-and-custom-hooks/) the three states, cancellation, `useFetch` · [21](./21-api-layer-and-advanced-http/) axios vs `fetch`, `ApiError` |
| [Demo 6 · Configuration & the API Layer](../demos/06-config-and-the-api-layer/) | [21](./21-api-layer-and-advanced-http/) configuration, instances, services, interceptors · [02](./02-react-introduction/) §20 environment variables in Vite |
| [Demo 7 · Search, Filters & Pagination](../demos/07-search-filters-and-pagination/) | [21](./21-api-layer-and-advanced-http/) cancellation, debounce, parallel requests, pagination · [13](./13-data-fetching-and-custom-hooks/) request state and race conditions |
| [Demo 8 · Mutations & Custom Hooks](../demos/08-mutations-and-custom-hooks/) | [13](./13-data-fetching-and-custom-hooks/) custom hooks · [21](./21-api-layer-and-advanced-http/) mutations, `useApi` and its limits |
| [Demo 9 · Routing with React Router v8](../demos/09-routing-with-react-router/) | [14](./14-routing/) Data Mode, layouts, params, the URL as state |
| [Demo 10 · Loaders, Actions & Error Boundaries](../demos/10-loaders-actions-and-error-boundaries/) | [14](./14-routing/) loaders, actions, fetchers, pending UI · [16](./16-advanced-patterns/) error boundaries |
| [Demo 11 · Authentication & Protected Routes](../demos/11-auth-and-protected-routes/) | [22](./22-authentication-and-protected-routes/) in full · [14](./14-routing/) route middleware and `redirect` |
| [Demo 12 · Context & Reducers](../demos/12-context-and-reducers/) | [09](./09-reducers-and-context/) in full · [08](./08-state-structure/) state that cannot contradict itself |
| [Demo 13 · Client State with Zustand](../demos/13-client-state-with-zustand/) | [23](./23-client-state-libraries/) the decision and the Zustand half · [09](./09-reducers-and-context/) the re-render cost of Context |
| [Demo 14 · Advanced HTTP & Shipping](../demos/14-advanced-http-and-shipping/) | [21](./21-api-layer-and-advanced-http/) optimistic UI, upload progress, retries · [14](./14-routing/) lazy routes · [20](./20-production/) the production build and deploying a SPA |
| [Demo 15 · Refs, the DOM & Keyboard Accessibility](../demos/15-refs-dom-and-accessibility/) | [11](./11-refs-and-the-dom/) in full · [26](./26-accessibility/) keyboard navigation and focus management |
| [Demo 16 · Styling & Theming in React](../demos/16-styling-and-theming/) | [25](./25-styling-and-theming/) in full |
| [Demo 17 · Component Patterns, Portals & TypeScript Consolidation](../demos/17-component-patterns-and-portals/) | [16](./16-advanced-patterns/) patterns, portals · [17](./17-typescript-with-react/) generic components, discriminated unions, `satisfies` · [05](./05-props-and-composition/) composition patterns, as a refresher |
| [Demo 18 · Performance: Measure, then Fix](../demos/18-performance/) | [15](./15-performance/) in full |
| [Demo 19 · Server State with TanStack Query & Real-time Data](../demos/19-tanstack-query-and-realtime/) | [24](./24-server-state-tanstack-query-and-realtime/) in full · [13](./13-data-fetching-and-custom-hooks/) what a hand-rolled hook cannot do |
| [Demo 20 · Testing React Applications](../demos/20-testing/) | [18](./18-testing/) in full |
| [Demo 21 · React 19 Actions, Suspense & Server Components](../demos/21-react-19-actions-suspense-and-server-components/) | [19](./19-server-components/) in full · [03](./03-rendering-architectures/) the RSC vocabulary, as a refresher |
| [Demo 22 · Production Readiness](../demos/22-production-readiness/) | [20](./20-production/) in full · [26](./26-accessibility/) the audit and the screen-reader pass |
| [Demo 23 · Capstone: Architecture, Legacy Code & Interview Readiness](../demos/23-capstone-architecture-legacy-and-interviews/) | [27](./27-architecture-legacy-code-and-interviews/) in full |
| [Demo 24a · Advanced Zustand](../demos/24a-advanced-zustand/) | [23](./23-client-state-libraries/) the Zustand half and the comparison |
| [Demo 24b · Redux Toolkit](../demos/24b-redux-toolkit/) | [23](./23-client-state-libraries/) the Redux Toolkit half and the comparison |
| [Demo 24c · Redux-Observable, RxJS & a WebSocket Stream](../demos/24c-redux-observable-and-rxjs/) | [23](./23-client-state-libraries/) the RxJS half and the comparison |

**Study notes → demos**

| Module | Built in |
|---|---|
| 01 · JavaScript Foundations for React | [S1](../demos/00a-javascript-and-typescript-for-react/) |
| 02 · Introduction to React & Getting Started | [S2](../demos/00b-react-introduction-and-toolchain/) · [Demo 6](../demos/06-config-and-the-api-layer/) |
| 03 · Rendering Architectures: CSR, SSR & SSG | [S2](../demos/00b-react-introduction-and-toolchain/) · [Demo 21](../demos/21-react-19-actions-suspense-and-server-components/) |
| 04 · Describing the UI: Components & JSX | [Demo 1](../demos/01-components-jsx-props/) |
| 05 · Props & Component Composition | [Demo 1](../demos/01-components-jsx-props/) · [Demo 17](../demos/17-component-patterns-and-portals/) |
| 06 · Conditional Rendering & Lists | [Demo 2](../demos/02-lists-keys-and-state/) |
| 07 · State & Events | [Demo 2](../demos/02-lists-keys-and-state/) · [Demo 3](../demos/03-events-forms-and-lifting-state/) |
| 08 · Structuring State: Objects, Arrays, Lifting & Resetting | [Demo 3](../demos/03-events-forms-and-lifting-state/) · [Demo 12](../demos/12-context-and-reducers/) |
| 09 · Reducers & Context | [Demo 12](../demos/12-context-and-reducers/) · [Demo 13](../demos/13-client-state-with-zustand/) |
| 10 · Forms & Controlled Components | [Demo 3](../demos/03-events-forms-and-lifting-state/) · [Demo 4](../demos/04-forms-manual-and-react-hook-form/) |
| 11 · Refs & the DOM | [Demo 15](../demos/15-refs-dom-and-accessibility/) |
| 12 · Effects & Synchronisation | [Demo 5](../demos/05-effects-and-the-network/) |
| 13 · Data Fetching & Custom Hooks | [Demo 5](../demos/05-effects-and-the-network/) · [Demo 7](../demos/07-search-filters-and-pagination/) · [Demo 8](../demos/08-mutations-and-custom-hooks/) · [Demo 19](../demos/19-tanstack-query-and-realtime/) |
| 14 · Routing & Application Architecture | [Demo 9](../demos/09-routing-with-react-router/) · [Demo 10](../demos/10-loaders-actions-and-error-boundaries/) · [Demo 11](../demos/11-auth-and-protected-routes/) · [Demo 14](../demos/14-advanced-http-and-shipping/) |
| 15 · Performance & Optimisation | [Demo 18](../demos/18-performance/) |
| 16 · Advanced Patterns, Error Boundaries & Portals | [Demo 10](../demos/10-loaders-actions-and-error-boundaries/) · [Demo 17](../demos/17-component-patterns-and-portals/) |
| 17 · TypeScript with React | [S1](../demos/00a-javascript-and-typescript-for-react/) · [Demo 1](../demos/01-components-jsx-props/) · [Demo 4](../demos/04-forms-manual-and-react-hook-form/) · [Demo 17](../demos/17-component-patterns-and-portals/) |
| 18 · Testing React Applications | [Demo 20](../demos/20-testing/) |
| 19 · Server Components & Modern React 19 | [Demo 21](../demos/21-react-19-actions-suspense-and-server-components/) |
| 20 · Shipping to Production | [Demo 14](../demos/14-advanced-http-and-shipping/) · [Demo 22](../demos/22-production-readiness/) |
| 21 · The API Layer: Configuration, axios & Advanced HTTP | [Demo 5](../demos/05-effects-and-the-network/) · [Demo 6](../demos/06-config-and-the-api-layer/) · [Demo 7](../demos/07-search-filters-and-pagination/) · [Demo 8](../demos/08-mutations-and-custom-hooks/) · [Demo 14](../demos/14-advanced-http-and-shipping/) |
| 22 · Authentication & Protected Routes | [Demo 11](../demos/11-auth-and-protected-routes/) |
| 23 · Client State Libraries: Zustand, Redux Toolkit & RxJS | [Demo 13](../demos/13-client-state-with-zustand/) · [Demo 24a](../demos/24a-advanced-zustand/) · [Demo 24b](../demos/24b-redux-toolkit/) · [Demo 24c](../demos/24c-redux-observable-and-rxjs/) |
| 24 · Server State: TanStack Query & Real-time Data | [Demo 19](../demos/19-tanstack-query-and-realtime/) |
| 25 · Styling & Theming in React | [Demo 16](../demos/16-styling-and-theming/) |
| 26 · Accessibility in React | [Demo 15](../demos/15-refs-dom-and-accessibility/) · [Demo 22](../demos/22-production-readiness/) |
| 27 · Architecture, Legacy Code & Interview Readiness | [Demo 23](../demos/23-capstone-architecture-legacy-and-interviews/) |

---

## Mapping to the hands-on sessions

The notes are finer-grained than the workshops, so several modules feed one
session.

| Study notes | Hands-on session |
|---|---|
| 1 · JavaScript Foundations | pre-work |
| 2 · React Introduction · 3 · Rendering Architectures | pre-work / Session 1 intro |
| 4 · Components & JSX · 5 · Props · 6 · Lists | **Session 1** — Foundations & the Component Model |
| 7 · State & Events · 8 · State Structure · 9 · Reducers | **Session 2** — State, Events & Controlled UI |
| 11 · Refs · 12 · Effects · 13 · Custom Hooks | **Session 3** — Effects, the Network & Custom Hooks |
| 14 · Routing & Architecture | **Session 4** — Routing & Application Architecture |
| 13 · Data Fetching (server state) | **Session 5** — Server State with TanStack Query |
| 9 · Context · 14 · Protected routes | **Session 6** — Auth, RBAC & the Storefront/Back-office Split |
| 10 · Forms | **Session 7** — Production-Grade Forms |
| 9 · Reducers & Context · 16 · Patterns | **Session 8** — Global State, Real-Time & Notifications |
| 15 · Performance · 16 · Advanced Patterns | **Session 9** — Performance & Advanced Patterns |
| 17 · TypeScript · 18 · Testing · 20 · Production | **Session 10** — Testing, Quality Gates & Shipping |
| 19 · Server Components | beyond the ten sessions — the next step after the course |

---

## Version note

Written against **React 19**. Where React 19 changed something you will see in
older material, the notes say so explicitly — `forwardRef` no longer being
needed, Create React App being deprecated, Actions and Server Components
arriving, and the React Compiler reducing the need for hand-written
memoisation.
