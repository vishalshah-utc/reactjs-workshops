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
only.** No third-party blogs, no videos — everything cited is something the
React team maintains, so it stays correct as React moves.

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
| 14 | **[Routing & Application Architecture](./14-routing/)** | 2.5h | 📝 outline |
| 15 | **[Performance & Optimisation](./15-performance/)** | 2.5h | 📝 outline |
| 16 | **[Advanced Patterns, Error Boundaries & Portals](./16-advanced-patterns/)** | 2.5h | 📝 outline |

### Part 6 — Professional practice

| # | Module | Time | Status |
|---|---|---|---|
| 17 | **[TypeScript with React](./17-typescript-with-react/)** | 2.5h | 📝 outline |
| 18 | **[Testing React Applications](./18-testing/)** | 2.5h | 📝 outline |
| 19 | **[Server Components & Modern React 19](./19-server-components/)** | 2.5h | 📝 outline |
| 20 | **[Shipping to Production](./20-production/)** | 2h | 📝 outline |

**Status key:** ✅ full notes written · 📝 outline with objectives, topic
breakdown, exercises and references; prose and examples still to be written.

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
4. **Build the matching session lab** in [`../sessions/`](../sessions/).
5. **Keep react.dev open.** These notes are a curated path through it, not a
   replacement for it.

Two habits that separate people who get good at React quickly from people who
don't:

- **Use React DevTools from day one.** Components tab for props/state/hooks,
  Profiler for renders. Guessing is slower than looking.
- **Take `react-hooks/exhaustive-deps` seriously.** When the linter complains
  about an effect, it has found a real bug roughly nine times out of ten.

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
