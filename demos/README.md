# ShopScope — the demo track

Thirteen incremental demos that build **one app** — *ShopScope*, a product
explorer — from "what is a component" to a routed, authenticated app with
loaders, actions, protected routes, a global client-state store and a production API layer. TypeScript,
Vite and `strict: true` from the first file.

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
The last demo also ships the complete app in `13-…/solution/`.

## The demos

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
| 12 | [Client State with Zustand](./12-client-state-with-zustand/) | A wishlist store that replaces Outlet context, a real cart with a drawer, `persist`, and a checkout action that reads the store outside React | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/12-client-state-with-zustand/starter) |
| 13 | [Advanced HTTP & Shipping](./13-advanced-http-and-shipping/) | Optimistic UI, upload progress, retries, lazy routes, deploying an SPA | [▶ starter](https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/13-advanced-http-and-shipping/starter) · [finished app](./13-advanced-http-and-shipping/solution/) |

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

**Node 22.22+** (`react-router@8` requires it). Every starter pins the *same*
dependency set, so you install once and `npm run dev` anywhere. `npm run
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
demo that needs it arrives, never before. The long-form reference for everything in demos 5–11 and 13 is the
[Axios, HTTP & Routing study guide](../study-guides/React-Axios-HTTP-and-Routing-Study-Guide.md).

```bash
node scripts/verify-demos.mjs   # structure checks: markers, pins, StackBlitz config
```
