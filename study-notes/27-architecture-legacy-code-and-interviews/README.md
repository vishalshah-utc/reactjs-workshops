# Module 27 — Architecture, Legacy Code & Interview Readiness

**Study notes** · ~3 hours
**The closing module. Everything before it is assumed.**

> **Goal.** Three skills that separate a developer who can *write* React from
> one a team can *hand a codebase to*: organising a project so the next
> feature has an obvious home, reading the React that was written before hooks
> and mapping it to what you would write today, and defending every
> architectural choice in the app you built — out loud, in three to six
> sentences, with the code that proves it.

**Prerequisites:** the whole program, but specifically
[Module 4 §4](../04-components-and-jsx/#4-organising-components-in-a-real-project)
(the seed of the architecture half),
[Module 12 §8](../12-effects/#8-think-synchronise-not-lifecycle) (the seed of
the legacy half), Module 14 — Routing & Application Architecture, and Module 16
— Advanced Patterns, Error Boundaries & Portals.

---

## Contents

**Part A — Architecture for the next twelve months**

1. [The five-second test](#1-the-five-second-test)
2. [Feature folders vs type folders](#2-feature-folders-vs-type-folders)
3. [Dependency direction, and enforcing it](#3-dependency-direction-and-enforcing-it)
4. [Path aliases](#4-path-aliases)
5. [Barrel files and their cost](#5-barrel-files-and-their-cost)
6. [Where things live: types, services, stores, routes, tests](#6-where-things-live-types-services-stores-routes-tests)
7. [Writing an ADR](#7-writing-an-adr)
8. [When to split a package or an app](#8-when-to-split-a-package-or-an-app)

**Part B — Reading legacy React**

9. [How to read a codebase you inherit](#9-how-to-read-a-codebase-you-inherit)
10. [Class components → functions: the lifecycle mapping](#10-class-components--functions-the-lifecycle-mapping)
11. [Error boundaries: why they are still classes](#11-error-boundaries-why-they-are-still-classes)
12. [HOCs and render props → hooks](#12-hocs-and-render-props--hooks)
13. [Redux `connect()` → hooks, or a store hook](#13-redux-connect--hooks-or-a-store-hook)
14. [React Router v5 → v8 Data Mode](#14-react-router-v5--v8-data-mode)
15. [PropTypes → TypeScript](#15-proptypes--typescript)
16. [The removed and the unsafe](#16-the-removed-and-the-unsafe)
17. [Migrating incrementally](#17-migrating-incrementally)

**Part C — The capstone and the interview**

18. [The capstone brief](#18-the-capstone-brief)
19. [The interview drill: one question per session](#19-the-interview-drill-one-question-per-session)
20. [System-design questions for a React front end](#20-system-design-questions-for-a-react-front-end)
21. [Self-assessment rubric](#21-self-assessment-rubric)
22. [Self-check](#22-self-check)
23. [References](#23-references)

**Hands-on.** This module is the theory track for
[Demo 23 — Capstone: Architecture, Legacy Code & Interview Readiness](../../demos/23-capstone-architecture-legacy-and-interviews/).
The demo refactors the finished ShopScope SPA (Demo 14's `solution/`) into
feature folders with an enforced dependency direction and one ADR, ships a
`legacy/` folder to read and map, sets the capstone brief, and runs the
interview drill. Sections marked **→ In the demos** name the block that
implements them.

---

## 1. The five-second test

Run this in the finished SPA:

```bash
find src -name '*.tsx' | wc -l     # ~60
ls src/components src/routes
```

Sixty files, split into `components/` and `routes/`. Both names describe
*what kind of file* something is, not *what it is for*. Now ask the question
the next hire will ask on their first day:

> "Where does the orders-history feature go?"

If the honest answer involves opening four folders and reading three files,
the structure is already costing you — every day, on every ticket, for every
person on the team. The test for an architecture is not whether it is
elegant; it is whether a competent stranger can answer *where does X live* and
*what may X import* in about five seconds, from the folder tree alone.

The whole of Part A is in service of passing that test.

---

## 2. Feature folders vs type folders

### Type folders: the default that stops scaling

```
src/
├── components/     47 files — ProductCard, CartDrawer, SignupForm, Uploader…
├── routes/         14 files — ProductsPage, LoginPage, account/TeamPage…
├── hooks/
├── store/
├── context/
├── reducers/
└── lib/
```

This is what ShopScope looks like after Demo 14, and it was the right shape
to *teach* with — every demo added one file to the folder for its concept.
It is the wrong shape to *maintain*, for one reason: **the cart is in six
folders.** `CartDrawer.tsx` in `components/`, `cart.ts` in `store/`,
`cartMath.ts` in `lib/`, `checkout.ts` in `routes/account/`, `carts.ts` in
`api/services/`, and the `Cart` type in `types.ts`. Deleting the cart means a
`grep`. Understanding it means a tour.

### Feature folders: group by capability

```
src/
├── app/                       boot and wiring: main.tsx, router.tsx, providers.tsx,
│                              RootLayout, RootErrorBoundary, AppBootSplash
├── features/
│   ├── catalog/               ProductsPage, ProductDetailPage, ProductCard, ProductGrid,
│   │                          ProductToolbar, CategoryStrip, ProductForm, useProductFilters,
│   │                          catalog.ts, loaders.ts, routes.tsx, *.test.tsx
│   ├── cart/                  CartDrawer, store.ts, cartMath.ts, checkout.ts, routes.tsx
│   ├── wishlist/              store.ts
│   ├── auth/                  LoginPage, SignupForm, tokenStore.ts, middleware.ts, routes.tsx
│   └── account/               AccountLayout, ProfilePage, CartsPage, TeamPage, routes.tsx
├── components/
│   ├── ui/                    PriceTag, StockBadge, Pager, ConfirmDialog, Skeletons,
│   │                          ErrorNotice, fields/ — feature-agnostic, no data fetching
│   └── layout/                SiteHeader, PageHeader
├── api/                       client.ts, endpoints.ts, interceptors/, services/
├── lib/                       format.ts, retry.ts, validation.ts, ApiError.ts
├── config/                    env.ts, logger.ts
├── types/                     Product, User, Cart… and axios.d.ts
└── test/                      msw/, setup.ts, renderWithProviders.tsx
```

Now the cart is `features/cart/`. Deleting it is `rm -r`. Understanding it is
`ls`. A new hire asked "where do orders go?" answers `features/orders/`
without opening anything.

### The decision rule for each file

| Ask | If yes | If no |
|---|---|---|
| Does it know about a business concept (product, cart, user)? | `features/<that concept>/` | keep asking |
| Is it a visual primitive any feature could use? | `components/ui/` | keep asking |
| Does it talk HTTP? | `api/` | keep asking |
| Is it framework-free logic (formatting, retry, validation)? | `lib/` | keep asking |
| Does it wire the app together (providers, the route table)? | `app/` | it is probably a type → `types/` |

Two honest caveats. First, a feature folder is a *boundary*, not a size
target: `features/wishlist/` holding one file is fine. Second, the catalogue
feature is large because it *is* the app; if it grows past ~25 files, split
it by sub-capability (`catalog/list`, `catalog/detail`, `catalog/edit`), not
by file type again.

📖 [react.dev — Thinking in React](https://react.dev/learn/thinking-in-react) — the component tree is drawn from the data, and so is the folder tree

**→ In the demos:** Demo 23, Block 1 *Architecture for the next 12 months* —
the refactor into `features/catalog`, `features/account`, `features/cart`,
`components/ui`, `lib`, `api`.

---

## 3. Dependency direction, and enforcing it

[Module 4 §4](../04-components-and-jsx/#4-organising-components-in-a-real-project)
stated the rule in one line: *point dependencies one way*. Here is the
direction for ShopScope, drawn as layers. Imports go **down** only.

```
app          ── may import anything below
features     ── may import components, api, lib, config, types — and NOT other features
components   ── may import lib, types — and NOT features, api
api          ── may import lib, config, types
lib, config, types ── import nothing from src/ above them
```

Three rules do the real work:

1. **A feature never imports another feature.** If `cart` needs the
   `Product` type, that type lives in `types/`. If `cart` needs
   `ProductCard`, either the card is a UI primitive (move it to
   `components/ui`) or the two features are one feature (merge them). The
   moment features reach into each other, you have type folders with extra
   steps.
2. **`components/ui` knows nothing about the domain.** A `Pager` takes
   `page`, `pageCount`, `onChange`. It does not import `useProductFilters`.
3. **`api/` and `lib/` never import React.** They are testable with no
   `render` at all — exactly what Demo 20 Lab 3 relied on.

### Enforcing it: `eslint-plugin-boundaries`

A rule that lives in a README is a suggestion. A rule that fails `npm run
lint` is architecture. `eslint-plugin-boundaries` classifies files into
*elements* by path, then lets you write policies about which element may
import which.

```ts
// eslint.config.js (flat config, eslint-plugin-boundaries 7.x)
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  // …the existing react-hooks / react-refresh block…
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app',        pattern: 'src/app/*' },
        { type: 'feature',    pattern: 'src/features/*' },   // one element per feature folder
        { type: 'components', pattern: 'src/components/*' },
        { type: 'api',        pattern: 'src/api/*' },
        { type: 'shared',     pattern: ['src/lib/*', 'src/config/*', 'src/types/*'] },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        policies: [
          { from: { element: { type: 'app' } },
            allow: { to: { element: { types: { anyOf: ['feature', 'components', 'api', 'shared'] } } } } },
          { from: { element: { type: 'feature' } },
            allow: { to: { element: { types: { anyOf: ['components', 'api', 'shared'] } } } } },
          { from: { element: { type: 'components' } },
            allow: { to: { element: { type: 'shared' } } } },
          { from: { element: { type: 'api' } },
            allow: { to: { element: { type: 'shared' } } } },
        ],
      }],
    },
  },
);
```

Because each `features/*` folder is one *element*, imports between files
inside the same feature are internal and never checked; an import from
`features/cart` into `features/catalog` is a dependency between two
`feature` elements, which no policy allows, so it fails. (Before version 7
the rule was called `boundaries/element-types`; it still works as a
deprecated alias.)

### The lighter alternative: `import/no-restricted-paths`

If you already run `eslint-plugin-import`, its `no-restricted-paths` rule
expresses the same thing as *zones* — "files in `target` may not import from
`from`" — with no element classification:

```ts
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/components', from: './src/features',
      message: 'components/ is feature-agnostic — move the component or the dependency' },
    { target: './src/components', from: './src/api' },
    { target: './src/features/cart', from: './src/features', except: ['./cart'],
      message: 'features do not import each other; share via types/, lib/ or components/' },
    { target: ['./src/lib', './src/api'], from: './src/features' },
  ],
}],
```

It is less expressive (every feature pair needs its own zone, so this
scales badly past five features) but it is one rule in a plugin you may
already have. Either way, the point is the same: **the direction is checked
by a machine on every commit**, and the error message tells the developer
where the thing should have gone. Add `import/no-cycle` too; it catches the
barrel-file cycles from [§5](#5-barrel-files-and-their-cost).

**→ In the demos:** Demo 23, Block 1 — `eslint-plugin-boundaries` or
`import/no-restricted-paths` for dependency direction.

---

## 4. Path aliases

Relative imports encode the file's position, which is exactly the thing a
refactor changes:

```ts
import { formatPrice } from '../../../lib/format';     // ✗ breaks when the file moves
import { formatPrice } from '@/lib/format';            // ✓ survives any move
```

Two places must agree — TypeScript resolves types, Vite resolves the bundle:

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

(Vitest shares `vite.config.ts`, so tests resolve the alias for free.)

Two conventions keep aliases useful rather than noisy:

- **One alias, `@/`, pointing at `src/`.** Per-folder aliases (`@ui`,
  `@features`, `@api`) look tidy and then need updating in two config files
  and the lint plugin every time a folder is added. `@/features/cart/store`
  says everything `@cart/store` would, and the path is also the dependency
  direction, visible in the import line.
- **Inside a feature, stay relative.** `./ProductCard` says "same feature"
  at a glance; `@/features/catalog/ProductCard` from inside
  `features/catalog` hides that.

---

## 5. Barrel files and their cost

A barrel is an `index.ts` that re-exports a folder:

```ts
// components/ui/index.ts
export { PriceTag } from './PriceTag';
export { StockBadge } from './StockBadge';
export { Pager } from './Pager';
export * from './fields';
```

so that consumers write `import { PriceTag, Pager } from '@/components/ui'`.
Nice to read. Here is the bill:

| Cost | Why it happens |
|---|---|
| Slower dev server and cold builds | Importing one export evaluates the whole barrel, which imports every module in the folder — and their imports |
| Worse tree-shaking | `export *` chains defeat the bundler's ability to prove a module is unused, especially with side-effectful imports (CSS, `installInterceptors()`) |
| Import cycles | `features/cart/index.ts` → `CartDrawer` → `@/features/cart` (the barrel) → `CartDrawer`… The symptom is `undefined is not a function` at module load, hours from the cause |
| Fake encapsulation | A barrel *looks* like a public API but nothing stops `import … from '@/features/cart/internal/thing'` |
| Slower test runs | Every test file that imports the barrel pays the full folder's load time |

The rule that balances it: **a barrel marks a public surface, and only a
public surface.** Two legitimate uses in ShopScope:

- `components/ui/index.ts` — a stable design-system API that every feature
  consumes.
- `features/<name>/index.ts` — the *only* file another layer (in practice,
  `app/router.tsx`) may import from a feature. Everything not re-exported is
  private by convention, and `boundaries/dependencies` can make it private by
  rule (`mode: 'full'` on the element plus a policy allowing imports only to
  the `index.ts` file).

Nowhere else. Not `lib/index.ts`, not `hooks/index.ts`, not one per folder
because it feels consistent.

**→ In the demos:** Demo 23, Block 1 — barrel-file trade-offs.

---

## 6. Where things live: types, services, stores, routes, tests

### Types

| Kind of type | Lives in | Example |
|---|---|---|
| Domain entity used by more than one feature | `types/` | `Product`, `User`, `Cart`, `Role` |
| Feature-private shape | next to its feature | `ProductFilters` in `features/catalog/types.ts` |
| Raw API response | `api/services/<x>.ts`, not exported beyond `api/` | `ProductListResponse` |
| A component's props | the component file, exported only if a sibling needs it | `interface ProductCardProps` |
| Ambient / module augmentation | `types/*.d.ts` | `axios.d.ts` adding `_retry` to the request config |

The one that bites: a *response* type is not a *domain* type. DummyJSON's
`{ products, total, skip, limit }` is the API's business; the app works with
`Product[]` and a page count. The service maps one to the other, which is
why `types/` never imports from `api/`.

### Services, stores, routes

- **Services stay in `api/services/`**, not in features. They are the
  app's contract with the server, and three features call
  `products.ts`. A feature-local service would be imported across
  features within a week.
- **A store belongs to the feature that owns the data.**
  `features/cart/store.ts`, `features/wishlist/store.ts`. A store that
  several features read is still one feature's store — the others import
  the hook through that feature's public `index.ts`, which is the one
  cross-feature import worth allowing explicitly, as a named policy.
- **Routes are declared by the feature and assembled by `app/`.** Each
  feature exports its route objects; `app/router.tsx` composes them. The
  route table stays readable and the feature owns its own loaders, actions
  and boundaries:

```ts
// features/catalog/routes.tsx
import type { RouteObject } from 'react-router';
import { ProductsPage, productsLoader, productsAction } from './ProductsPage';
import { ProductDetailPage, productDetailLoader } from './ProductDetailPage';
import { ProductErrorBoundary } from './ProductErrorBoundary';

export const catalogRoutes: RouteObject[] = [
  { path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction },
  { path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader,
    ErrorBoundary: ProductErrorBoundary },
];
```

```ts
// app/router.tsx
import { createBrowserRouter, redirect } from 'react-router';
import { catalogRoutes } from '@/features/catalog';
import { authRoutes } from '@/features/auth';
import { accountRoutes } from '@/features/account';

export const router = createBrowserRouter([
  {
    id: 'root', path: '/', Component: RootLayout, loader: rootLoader,
    ErrorBoundary: RootErrorBoundary, HydrateFallback: AppBootSplash,
    children: [
      { index: true, loader: () => redirect('/products') },
      ...catalogRoutes,
      ...authRoutes,
      ...accountRoutes,          // keeps its lazy() and middleware from Demo 14
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
```

### Tests: colocate

```
features/catalog/
├── ProductCard.tsx
├── ProductCard.test.tsx         ← next to the thing it tests
├── ProductsPage.tsx
└── ProductsPage.test.tsx
```

A `__tests__/` tree that mirrors `src/` is a second folder structure to keep
in sync, and it hides the fact that `Uploader.tsx` has no test. Colocation
makes the gap visible in `ls`. The only test files that are *not* colocated
are the shared fixtures — MSW handlers, `renderWithProviders`, `setup.ts` —
which live in `src/test/` because every test imports them.

Vitest needs nothing special: `include: ['src/**/*.test.{ts,tsx}']`, and
`tsc -b` excludes them from the production build via a `tsconfig.app.json`
`exclude` entry.

**→ In the demos:** Demo 23, Block 1 — where types live; what a new hire
should find in five seconds.

---

## 7. Writing an ADR

An **Architecture Decision Record** is a one-page file that says what you
decided, what you considered, and why — written *when* the decision is made,
by the people making it. Its value is not the decision; it is the
*rejected* options, because in a year someone will propose one of them
again, and the record turns a forty-minute argument into a two-minute read.

ShopScope's first ADR records this module's decision, in the MADR shape
(Markdown Architectural Decision Records, from the ADR GitHub organisation):

```markdown
# 0001 — Feature folders with a one-way dependency direction

**Status:** accepted · **Date:** 2026-10-12 · **Deciders:** the front-end team

## Context and problem statement

`src/` has 60 files in `components/` and `routes/`. The cart spans six
folders. New features have no obvious home, and `components/ui/Button`
has started importing from the cart.

## Decision drivers

- A new hire must find a feature in five seconds from the tree alone
- Deleting a feature must not need a grep
- The import graph must be checkable in CI, not by review

## Considered options

1. Keep type folders; add a CONTRIBUTING section describing where things go
2. Feature folders, direction documented in the README
3. Feature folders, direction enforced by `eslint-plugin-boundaries`

## Decision outcome

Option 3. `app → features → components | api → lib | config | types`.
Features never import each other; sharing moves the shared thing down.
`components/ui` and each feature's `index.ts` are the only barrels.

### Consequences

- Good: lint fails on a wrong-direction import with a message naming the fix
- Good: `features/<x>` can be deleted or extracted to a package as a unit
- Bad: one more ESLint plugin and ~40 lines of config to maintain
- Bad: a one-off refactor of 60 files, done in one PR with no behaviour change

## Pros and cons of the options

**Option 1** — zero cost; nobody reads CONTRIBUTING; the cart stays in six folders.
**Option 2** — cheap; the README is wrong within a quarter.
**Option 3** — the only one where the rule outlives the people who wrote it.
```

Conventions that make ADRs work: number them, never edit an accepted one
(write a new one that *supersedes* it), keep them in the repo at
`docs/adr/`, and link the ADR from the lint rule's `message` so the error
explains itself. Decisions worth an ADR in this program: the CSR verdict
(Module 3), `localStorage` tokens over cookies (Module 22), Zustand over
Context for the wishlist (Module 23), loaders plus TanStack Query (Module
24). Decisions not worth one: tab width.

**→ In the demos:** Demo 23, Block 1 — one ADR.

---

## 8. When to split a package or an app

Feature folders are the right unit *inside* one app. Two further steps
exist, and both are reached by evidence, not ambition.

| Signal | Step | What it looks like |
|---|---|---|
| A second app needs `components/ui` or `api/` | **A workspace package** | A monorepo (`npm` / `pnpm` workspaces): `packages/ui`, `packages/api-client`, `apps/shop`, `apps/back-office`; each package has its own `package.json`, `tsconfig`, tests |
| Different deploy cadence, auth domain or team | **A separate app** | `apps/back-office` ships weekly behind SSO; `apps/shop` ships daily to the public. Different hosts, different CSPs (Module 20), different error budgets |
| Different rendering needs | **A separate app, different framework** | The catalogue moves to Next.js for SEO (Module 19); the account area stays a Vite SPA behind login |

And the signals that are **not** reasons to split: a folder feels big; two
developers edit the same file; "microfrontends" came up in a meeting. A
split adds a versioning boundary, a second CI pipeline, and a type contract
that now needs publishing. Pay that only when the signals above are real.
`features/` with enforced boundaries gets you 90% of the modularity at 10% of
the cost — and when the time comes, a feature that never imported its
neighbours is already a package in all but `package.json`.

---

## 9. How to read a codebase you inherit

The React you will be handed in your first job was mostly written between
2016 and 2020: classes, lifecycles, HOCs, `connect()`, React Router v5 and
PropTypes. None of it is wrong — it still runs on React 19 — but all of it
has a direct modern equivalent, and your value in the first month is
knowing both. Here is the reading order:

1. **`package.json` first.** `react` version, `react-router-dom` version,
   `react-redux` version, `prop-types`, `typescript` present or not. Each
   one tells you which of the sections below apply.
2. **The root.** `ReactDOM.render` or `createRoot`? `<StrictMode>` present?
   `<Provider store>`? `<BrowserRouter>`? The root tells you the era and the
   stack in ten lines.
3. **One class component, in full**, with the mapping table in
   [§10](#10-class-components--functions-the-lifecycle-mapping) open.
4. **The data path for one screen**: route → container → `connect` → action
   → reducer → selector → props. Draw it. The modern app has the same path
   with fewer hops.
5. **Only then** look at the folders.

What you are building is a **mental translation layer**, not a rewrite plan.
Rewrites are decided by the evidence in [§17](#17-migrating-incrementally),
not by distaste.

**→ In the demos:** Demo 23, Block 2 *Reading legacy React* — the `legacy/`
folder.

---

## 10. Class components → functions: the lifecycle mapping

Here is Demo 23's `legacy/ProductList.js`, the way it would have been
written against React 16 in 2018:

```jsx
// legacy/ProductList.js — React 16.x, plain JavaScript
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { fetchProducts } from '../api/products';

class ProductList extends Component {
  constructor(props) {
    super(props);
    this.state = { products: [], loading: true, error: null };
    this.handleRetry = this.handleRetry.bind(this);   // `this` is not bound on class methods
    this.cancelled = false;
  }

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.category !== this.props.category) {
      this.load();                                     // re-run when the "dependency" changes
    }
  }

  componentWillUnmount() {
    this.cancelled = true;                             // the "cleanup"
  }

  load() {
    this.setState({ loading: true, error: null });     // setState MERGES into the object
    fetchProducts(this.props.category).then(
      (products) => { if (!this.cancelled) this.setState({ products, loading: false }); },
      (error)    => { if (!this.cancelled) this.setState({ error, loading: false }); },
    );
  }

  handleRetry() { this.load(); }

  render() {
    const { products, loading, error } = this.state;
    if (loading) return <p>Loading…</p>;
    if (error) return <button onClick={this.handleRetry}>Retry</button>;
    return <ul>{products.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
  }
}

ProductList.propTypes = { category: PropTypes.string };
ProductList.defaultProps = { category: 'all' };

export default ProductList;
```

Read the three lifecycle methods as *one effect*. Mount, update-when-
`category`-changes, and unmount are not three events; they are one
synchronisation — "while this component is on screen with *this* category,
a request for that category's products should exist" — which is exactly the
reframing in [Module 12 §8](../12-effects/#8-think-synchronise-not-lifecycle).

```tsx
// features/catalog/ProductList.tsx — React 19.3, TypeScript 5.9
import { useEffect, useState } from 'react';
import { fetchProducts } from '@/api/services/products';
import type { Product } from '@/types';
import type { ApiError } from '@/lib/ApiError';

type Request =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; products: Product[] };

export function ProductList({ category = 'all' }: { category?: string }) {
  const [request, setRequest] = useState<Request>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);              // "retry" = change a dependency

  useEffect(() => {
    const controller = new AbortController();           // the cleanup, as a real cancel
    setRequest({ status: 'loading' });
    fetchProducts(category, controller.signal).then(
      (products) => setRequest({ status: 'success', products }),
      (error: ApiError) => { if (!controller.signal.aborted) setRequest({ status: 'error', error }); },
    );
    return () => controller.abort();
  }, [category, attempt]);

  if (request.status === 'loading') return <p>Loading…</p>;
  if (request.status === 'error') return <button onClick={() => setAttempt((n) => n + 1)}>Retry</button>;
  return <ul>{request.products.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

And then — as [Module 12 §11](../12-effects/#11-data-fetching-in-an-effect)
and [Module 13 §6](../13-data-fetching-and-custom-hooks/#6-everything-usefetch-still-gets-wrong)
argued — the honest modern answer is not this effect at all but a loader or
`useQuery`. The function version above is the *faithful translation*; the
*right* code in ShopScope is `productsLoader` or `useQuery(['products', category])`.

### The mapping table

| Class (React 16/17) | Function (React 19) | Note |
|---|---|---|
| `constructor` / `this.state = {…}` | `useState` / `useReducer` initial values | Lazy initialiser `useState(() => …)` for expensive values |
| `componentDidMount` | `useEffect(…, [])` **only if** it synchronises with something external | Data fetching → loader or query, not an effect |
| `componentDidUpdate(prevProps, prevState)` with an `if` | `useEffect(…, [theThingCompared])` | The `if` becomes the dependency array |
| `componentWillUnmount` | the effect's cleanup return | One effect holds setup *and* teardown — no shared instance field |
| `this.setState({ a })` (shallow merge) | `setA(a)` — **no merge** | Separate `useState` per concern, or `setState(prev => ({ ...prev, a }))` |
| `this.setState(prev => …)` | updater function | Identical semantics |
| `this.setState(…, callback)` | an effect on the value, or nothing (read it next render) | There is no "after this state is applied" hook |
| `static getDerivedStateFromProps` | compute during render; or `key` to reset; or store the previous prop in state | [Module 8 §9](../08-state-structure/#9-derived-state), [§16](../08-state-structure/#16-the-key-reset-in-practice) |
| `shouldComponentUpdate` / `PureComponent` | `memo(Component)` — or the React Compiler | Module 15 |
| `getSnapshotBeforeUpdate` | no direct equivalent; `useLayoutEffect` reading the DOM plus a ref holding the previous value | Rare in practice |
| `componentDidCatch` / `getDerivedStateFromError` | **still a class** | [§11](#11-error-boundaries-why-they-are-still-classes) |
| `this.props.children` | the `children` prop | — |
| `static defaultProps` | a default parameter value | `defaultProps` on functions is removed in 19 |
| `static contextType` / `<Ctx.Consumer>` | `useContext(Ctx)` or `use(Ctx)` | Legacy `contextTypes` is removed in 19 |
| `React.createRef()` / `this.inputRef` | `useRef<HTMLInputElement>(null)` | — |
| Instance fields (`this.timer`, `this.cancelled`) | `useRef` | The mutable box that survives renders, Module 11 |
| Methods bound in the constructor | functions declared in the body | No `this`, so nothing to bind |
| `this.forceUpdate()` | nothing — derive from state | If you need it, something is outside React's state |

📖 [react.dev — `Component`: migrating a component with lifecycle methods from a class to a function](https://react.dev/reference/react/Component#migrating-a-component-with-lifecycle-methods-from-a-class-to-a-function)
📖 [react.dev — `Component`: migrating a component with state from a class to a function](https://react.dev/reference/react/Component#migrating-a-simple-component-from-a-class-to-a-function)
📖 [react.dev — `PureComponent`](https://react.dev/reference/react/PureComponent)

**→ In the demos:** Demo 23, Block 2 — a class `ProductList` with
`componentDidMount` / `componentDidUpdate` / `componentWillUnmount`, mapped to
hooks.

---

## 11. Error boundaries: why they are still classes

```tsx
// Still the only way to write one by hand, in React 19.3
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/config/logger';

interface Props { fallback: ReactNode; children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };                 // render the fallback on the NEXT render
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[boundary]', error, info.componentStack);   // report; do not swallow
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

There is no `useErrorBoundary`, and the reason is mechanical. A boundary
catches an error thrown **during the render of a descendant** and must
*replace its own output* in the same commit. A function component's hooks
run inside the render that is failing; there is no hook slot that runs
"instead of" a throwing render. The class lifecycle gives React two static
and instance entry points — `getDerivedStateFromError` to compute the
fallback state, `componentDidCatch` to report — that exist outside the
render path. The React team has said a hook form will come when the
semantics are settled; until then, every boundary is a class, including the
one inside `react-error-boundary`.

Two things boundaries do **not** catch, which every interviewer asks: errors
in event handlers (use `try`/`catch`) and errors in asynchronous code
(rejected promises, `setTimeout`). Both happen outside render. React 19
adds `onCaughtError` / `onUncaughtError` options to `createRoot` for
*reporting* every error in one place, but they report; they do not render a
fallback.

In ShopScope the hand-written class is replaced by `react-error-boundary`
around `CartDrawer` and `Uploader` (Demo 17 Lab 5), and by route-level
`ErrorBoundary` entries in the route table (Demo 10). Both are classes under
the hood.

📖 [react.dev — Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
📖 [react.dev — `createRoot` options: `onCaughtError`, `onUncaughtError`](https://react.dev/reference/react-dom/client/createRoot#parameters)

**→ In the demos:** Demo 23, Block 2 — an error-boundary class; why
boundaries are still classes.

---

## 12. HOCs and render props → hooks

Before hooks, stateful logic could only live in a class, so *sharing* it
meant wrapping components. Two patterns did the wrapping.

### Higher-order components

A HOC is a function that takes a component and returns a new one with extra
props injected. Demo 17's `legacy/withAuth.tsx` is one:

```jsx
// legacy, React 16 era — the shape, in JavaScript
export function withAuth(Wrapped, { role } = {}) {
  return class WithAuth extends Component {
    static displayName = `withAuth(${Wrapped.displayName || Wrapped.name})`;
    state = { user: tokenStore.getUser() };
    handleAuthChange = () => this.setState({ user: tokenStore.getUser() });
    componentDidMount()    { window.addEventListener(AUTH_CHANGED, this.handleAuthChange); }
    componentWillUnmount() { window.removeEventListener(AUTH_CHANGED, this.handleAuthChange); }
    render() {
      const { user } = this.state;
      if (!user || (role && user.role !== role)) return null;
      return <Wrapped {...this.props} user={user} />;
    }
  };
}

export default withAuth(EditProductLink, { role: 'admin' });
```

The tells of a HOC: `displayName` arithmetic so DevTools is readable, prop
arithmetic (`Omit<P, keyof Injected>`) once TypeScript arrives, a wrapper
component per use in the tree, and **name collisions** when two HOCs inject
the same prop. The hook has none of it:

```tsx
// features/auth/useAuthUser.ts — React 19
import { useSyncExternalStore } from 'react';
import { AUTH_CHANGED, tokenStore } from './tokenStore';

const subscribe = (cb: () => void) => {
  window.addEventListener(AUTH_CHANGED, cb);
  return () => window.removeEventListener(AUTH_CHANGED, cb);
};

export function useAuthUser() {
  return useSyncExternalStore(subscribe, () => tokenStore.getUser());
}

// at the use site — no wrapper, no cast, no displayName
export function EditProductLink({ id }: { id: number }) {
  const user = useAuthUser();
  if (user?.role !== 'admin') return null;
  return <Link to={`/products/${id}?edit=1`}>Edit</Link>;
}
```

### Render props

A render prop is a component that owns some logic and calls a function prop
to produce its UI. Demo 17's `legacy/Fetch.tsx`:

```jsx
<Fetch load={(signal) => fetchRelated(id, signal)} deps={[id]}
       render={(state) => state.status === 'success' ? <Related items={state.data} /> : <Skeleton />} />
```

The component is a class because it needs `componentDidMount` /
`componentDidUpdate(deps)` / `componentWillUnmount` — which is to say, it is
an effect with a `render` callback bolted on. The hook form is the effect
alone:

```tsx
const related = useFetch(() => fetchRelated(id), [id]);   // Module 13 §5
return related.status === 'success' ? <Related items={related.data} /> : <Skeleton />;
```

### Why hooks won

| | HOC | Render prop | Hook |
|---|---|---|---|
| Where the logic lives | a wrapper component | a wrapper component | the consuming component |
| Tree depth | +1 per use | +1 per use | +0 |
| Composition of two | `withA(withB(C))` — order and name collisions | callback inside callback ("pyramid") | two lines, any order |
| TypeScript | prop arithmetic and a cast | generic over the render argument | plain function types |
| Static analysis | opaque | opaque | `rules-of-hooks` and `exhaustive-deps` see inside |

Render props are **not dead** for one job: when the *caller* genuinely
needs to decide the markup for something the component computes per item
(a virtualiser's `renderRow`, a table's `cell: (row) => …`). That is a
callback prop that returns JSX, and it is fine. What hooks replaced is
render props *for sharing stateful logic*.

📖 [react.dev — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
📖 [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

---

## 13. Redux `connect()` → hooks, or a store hook

The pre-hooks Redux shape is a **container**: a component that knows nothing
about the store, wrapped by `connect`, which maps store state and action
creators to props. React Redux 7 (2019), JavaScript:

```jsx
// legacy/WishlistButtonContainer.js — react-redux 7, JavaScript
import { connect } from 'react-redux';
import { toggleWishlist } from '../store/wishlist/actions';
import { WishlistButton } from '../components/WishlistButton';

const mapStateToProps = (state, ownProps) => ({
  saved: state.wishlist.ids.includes(ownProps.productId),
  count: state.wishlist.ids.length,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggle: () => dispatch(toggleWishlist(ownProps.productId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WishlistButton);
```

`connect` is a HOC with everything from [§12](#12-hocs-and-render-props--hooks)
— a wrapper in the tree, injected props, prop arithmetic — plus its own
semantics: `mapStateToProps` runs on *every* store update and the wrapper
re-renders only if the mapped object's values changed shallowly.

### If the app stays on Redux: the hooks API

React Redux 7.1 added `useSelector` and `useDispatch`; React Redux 9.3
marked `connect` deprecated (it still works). The translation is mechanical
— each `mapStateToProps` key becomes a `useSelector`, each dispatcher a
function closing over `useDispatch()`:

```tsx
// features/wishlist/WishlistButton.tsx — Redux Toolkit, TypeScript
import { useAppSelector, useAppDispatch } from '@/app/hooks';     // typed wrappers (Module 23)
import { toggleWishlist } from './wishlistSlice';

export function WishlistButton({ productId }: { productId: number }) {
  const saved = useAppSelector((s) => s.wishlist.ids.includes(productId));
  const dispatch = useAppDispatch();
  return <button aria-pressed={saved} onClick={() => dispatch(toggleWishlist(productId))}>♥</button>;
}
```

One behavioural difference matters: `useSelector` re-renders when the
*selected value* changes by `Object.is` (one value per selector), where
`connect` shallow-compared a whole mapped object. Returning a fresh object
from `useSelector` re-renders on every store update — use several
selectors, or `shallowEqual` as the second argument.

### If the app is moving: a store hook

ShopScope's answer, from Demo 13, is a Zustand store, where the store *is*
the hook and the selector is the argument:

```tsx
import { useWishlistStore, selectIsSaved } from '@/features/wishlist';

export function WishlistButton({ productId }: { productId: number }) {
  const saved = useWishlistStore(selectIsSaved(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  return <button aria-pressed={saved} onClick={() => toggle(productId)}>♥</button>;
}
```

Same subscription-to-a-slice idea as `useSelector`; no `<Provider>`, no
action creators, no reducer indirection. Module 23 — Client State
Libraries: Zustand, Redux Toolkit & RxJS has the full comparison; the point
here is that *reading* a `connect` container is reading three things —
what it selects, what it dispatches, and what it injects — and all three
map onto the modern form line by line.

**→ In the demos:** Demo 23, Block 2 — a `connect()`-ed Redux container,
mapped to hooks.

---

## 14. React Router v5 → v8 Data Mode

React Router v5 (2019) routed by *rendering components*; everything was a
component, matching was first-wins, and route data was fetched by the page
after it mounted.

```jsx
// legacy/App.js — react-router-dom 5, JavaScript
import { BrowserRouter, Switch, Route, Redirect, withRouter, useHistory } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <Switch>                                       {/* first match wins, so order matters */}
        <Route exact path="/" render={() => <Redirect to="/products" />} />
        <Route exact path="/products" component={ProductsPage} />
        <Route path="/products/:productId" component={ProductDetailPage} />
        <Route path="/account" render={({ location }) =>
          tokenStore.getUser() ? <AccountLayout /> : <Redirect to={{ pathname: '/login', state: { from: location } }} />
        } />
        <Route component={NotFoundPage} />
      </Switch>
    </BrowserRouter>
  );
}

class ProductDetailPage extends Component {
  componentDidMount() { this.load(this.props.match.params.productId); }   // injected by the router
  componentDidUpdate(prev) {
    if (prev.match.params.productId !== this.props.match.params.productId) this.load(this.props.match.params.productId);
  }
  // …
}
export default withRouter(ProductDetailPage);        // injects history, location, match

function LoginForm() {
  const history = useHistory();                     // v5.1 hooks
  const onSuccess = () => history.push('/account');
}
```

The modern ShopScope router (Demo 9–14, react-router 8.3) is a **route
table** with loaders, actions, middleware and boundaries; data arrives
*before* the page renders, and guards are declarative:

```tsx
// app/router.tsx — react-router 8.3, TypeScript (abridged from Demo 14)
import { createBrowserRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';

export const router = createBrowserRouter([
  { id: 'root', path: '/', Component: RootLayout, loader: rootLoader, ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, loader: () => redirect('/products') },
      { path: 'products', Component: ProductsPage, loader: productsLoader, action: productsAction },
      { path: 'products/:productId', Component: ProductDetailPage, loader: productDetailLoader },
      { path: 'account', middleware: [authMiddleware], lazy: () => import('@/features/account/AccountLayout'),
        children: [/* … */] },
      { path: '*', Component: NotFoundPage },
    ] },
]);
```

### The mapping

| v5 (`react-router-dom@5`) | v8 Data Mode (`react-router@8`) |
|---|---|
| `<BrowserRouter>` + `<Switch>` + `<Route component>` | `createBrowserRouter([...])` + `<RouterProvider>` |
| First-match `<Switch>`, `exact` | Best-match ranking; no `exact` |
| `<Redirect to>` | `redirect()` from a loader, or `<Navigate to>` in JSX |
| `<Route render={({ location }) => …}>` guard | `middleware: [authMiddleware]` on the route |
| `withRouter(Component)` → `history`, `location`, `match` | `useNavigate()`, `useLocation()`, `useParams()` — no wrapper |
| `this.props.match.params.id` | `useParams()`, or `params` in the loader |
| `useHistory().push('/x')` / `.replace` | `useNavigate()('/x')` / `navigate('/x', { replace: true })` |
| `useRouteMatch()` | `useMatch()` |
| `<NavLink exact activeClassName>` | `<NavLink end className={({ isActive }) => …}>` |
| Fetch in `componentDidMount` after navigation | `loader` runs before render; `useLoaderData()` |
| `<form onSubmit>` + `history.push` | `<Form method="post">` + `action` + `useFetcher` |
| Error handling per page by hand | `ErrorBoundary` per route; `useRouteError()` |
| `import … from 'react-router-dom'` | `import … from 'react-router'`; `RouterProvider` from `react-router/dom` |

### The upgrade is three majors, one at a time

The official guides are versioned, and each is a self-contained step: **v5 →
v6** (`<Switch>` → `<Routes>`, `component` → `element`, `useHistory` →
`useNavigate`, `withRouter` deleted in favour of hooks), **v6 → v7** (turn on
the six `future` flags one by one, then `react-router-dom` → `react-router`),
**v7 → v8** (`v8_middleware` and the other flags, Node 22.22+, `react-router-dom`
removed). Enable a flag, fix what breaks, commit, next flag. Nobody jumps
three majors in one PR and keeps the back button working.

**→ In the demos:** Demo 23, Block 2 — `react-router-dom` v5
`<Switch>` / `withRouter`, mapped to React Router 8.

---

## 15. PropTypes → TypeScript

```jsx
// legacy, JavaScript — runtime checks, development only
import PropTypes from 'prop-types';

function ProductCard({ product, onAdd, dense }) { /* … */ }

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    stock: PropTypes.number,
  }).isRequired,
  onAdd: PropTypes.func,
  dense: PropTypes.bool,
};
ProductCard.defaultProps = { dense: false };
```

```tsx
// today — compile-time, everywhere, and the editor knows it
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAdd?: (id: number) => void;
  dense?: boolean;
}

export function ProductCard({ product, onAdd, dense = false }: ProductCardProps) { /* … */ }
```

What changes, concretely:

| PropTypes | TypeScript |
|---|---|
| Checked at runtime, in development, after the wrong value arrived | Checked at compile time, before the code runs |
| `PropTypes.shape({...})` duplicated per component | one `Product` type imported everywhere |
| `PropTypes.oneOf(['sm', 'md'])` | `size: 'sm' \| 'md'` |
| `PropTypes.func` — any function | `(id: number) => void` — the signature |
| `.isRequired` | the default; `?` marks optional |
| `defaultProps` | a default in the destructuring |
| Nothing for the callback's *return* or for generics | `DataTable<T>`, `Select<T>` (Module 17) |

**React 19 removed `propTypes` checking for function components entirely**
— the assignment is silently ignored. A legacy codebase on React 19 with
`prop-types` still installed has no prop validation at all, which is the
strongest possible argument for the migration. The official codemod,
`npx codemod@latest react/prop-types-typescript`, does the mechanical part;
`Module 17 — TypeScript with React` does the rest.

📖 [react.dev — React 19 upgrade guide: removed `propTypes` and `defaultProps`](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-proptypes-and-defaultprops)
📖 [Module 5 §18 — Documenting and validating props](../05-props-and-composition/#18-documenting-and-validating-props)

**→ In the demos:** Demo 23, Block 2 — `PropTypes`, mapped to TypeScript.

---

## 16. The removed and the unsafe

### `UNSAFE_` lifecycles

React 16.3 deprecated three lifecycles that ran *before* render and were
unsafe once rendering could be interrupted and retried; 16.9 renamed them
with a prefix and React 17 removed the unprefixed names:

| Old name | Prefixed name | Why unsafe | Modern home |
|---|---|---|---|
| `componentWillMount` | `UNSAFE_componentWillMount` | Runs before render, may run more than once, no cleanup | Initial state (`useState` initialiser); effects for anything external |
| `componentWillReceiveProps(next)` | `UNSAFE_componentWillReceiveProps` | Set state from props → the derived-state bug | Derive during render; `key`; `getDerivedStateFromProps` as the class stop-gap |
| `componentWillUpdate` | `UNSAFE_componentWillUpdate` | Side effects before a commit that may not happen | `componentDidUpdate` / an effect |

Seeing `UNSAFE_` in a codebase is information, not an emergency: it says
"someone ran the `rename-unsafe-lifecycles` codemod and stopped there".

### Removed in React 19

| Removed | Replacement |
|---|---|
| `ReactDOM.render(<App />, el)` | `createRoot(el).render(<App />)` |
| `ReactDOM.hydrate` | `hydrateRoot` |
| `ReactDOM.unmountComponentAtNode(el)` | `root.unmount()` |
| `ReactDOM.findDOMNode(this)` | a ref on the element |
| String refs `ref="input"` + `this.refs.input` | `createRef` / `useRef` / ref callbacks |
| Legacy context: `contextTypes`, `childContextTypes`, `getChildContext` | `createContext` + `static contextType` / `useContext` |
| `propTypes` and `defaultProps` on function components | TypeScript; default parameters |
| `React.createFactory` | JSX |
| Module-pattern factories (`function C() { return { render() {} } }`) | plain function components |

```jsx
// legacy/index.js — React 16/17
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));
```

```tsx
// app/main.tsx — React 19
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
```

`createRoot` is not a rename. It opts the tree into **concurrent rendering**
— interruptible renders, automatic batching outside event handlers,
transitions, Suspense for data. Code that assumed `setState` is synchronous
outside a handler (common in 2018 tests and `setTimeout` callbacks) was
already relying on an accident; under `createRoot` it is simply wrong.

### StrictMode-unsafe patterns

`<StrictMode>` in React 19 double-invokes, in development only: component
bodies, `useState` / `useMemo` / `useReducer` initialisers and callbacks,
class `constructor` / `render` / `shouldComponentUpdate`, every effect
(mount → cleanup → mount), and ref callbacks. Legacy code that breaks under
it is code that was never safe under concurrent rendering:

| Pattern | What StrictMode exposes | Fix |
|---|---|---|
| Subscribe in `constructor` or `componentWillMount` | two subscriptions, one cleanup | Subscribe in `componentDidMount` / an effect, with a matching cleanup |
| `useEffect` with a `hasRun` ref guard | the guard hides a missing cleanup | Write the cleanup ([Module 12 §5](../12-effects/#5-strict-modes-double-invoke)) |
| A module-scope counter incremented during render (`id = nextId++`) | ids skip | `useId`, or generate at creation time in a handler |
| `this.timer = setInterval(…)` in `componentDidMount` with no `clearInterval` | two intervals | Clear it in `componentWillUnmount` |
| Mutating a prop or an imported object in render | the mutation applies twice | Treat render as pure ([Module 4 §15](../04-components-and-jsx/#15-components-must-be-pure)) |
| A one-shot `fetch` in an effect with no abort and no ignore flag | two requests, possibly two state updates in the wrong order | `AbortController`, as in Demo 5 Lab 4 |

The wrong fix is removing `<StrictMode>`. It is the one tool that reproduces,
on your machine, bugs that otherwise appear only under load.

📖 [react.dev — Legacy React APIs](https://react.dev/reference/react/legacy)
📖 [react.dev — `render` (deprecated)](https://react.dev/reference/react-dom/render)
📖 [react.dev — `createRoot`](https://react.dev/reference/react-dom/client/createRoot)
📖 [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode)
📖 [react.dev — React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

## 17. Migrating incrementally

Nobody rewrites a working app. The strategy is the **strangler pattern**:
new code is written the modern way, old code is converted *when it is
touched for another reason*, and the two coexist for as long as it takes.
React makes this unusually easy because it does not care — a class can
render a function component, a function can render a class, hooks can read a
Redux store, and the router does not know which era a page came from.

### The order that works

1. **Upgrade React itself first**, on the old code, with the codemods.
   `npx codemod@latest react/19/migration-recipe` runs the whole set:
   `ReactDOM.render` → `createRoot`, string refs → callbacks, `act` import,
   and the `prop-types` → TypeScript transform. Commit when the tests pass.
   Everything after this is optional and incremental; this step is neither.
2. **Turn on `<StrictMode>` on a subtree**, not the root. Wrap one feature,
   fix what it exposes, widen the wrapper.
3. **Router, one major per PR** — v5 → v6 → v7 → v8, using each version's
   `future` flags as the stepping stones ([§14](#14-react-router-v5--v8-data-mode)).
   This is the migration most likely to break deep links and the back
   button, so it gets its own commits and its own E2E run.
4. **`connect` → hooks, component by component**, leaves first.
   `connect` is deprecated but not removed, so there is no deadline; convert
   a container when you next edit it. Introduce typed `useAppSelector` /
   `useAppDispatch` wrappers on day one so every conversion is identical.
5. **Classes → functions, leaves first, data fetching last.** A leaf class
   with `componentDidMount` that adds a listener is a ten-minute conversion.
   A page class that fetches in `componentDidMount` should become a *loader*
   or a *query*, not an effect — which means it waits for step 3.
6. **TypeScript, file by file.** `allowJs: true`, `checkJs: false`, rename
   one file to `.tsx`, fix it, repeat. Start `strict: false` only if the
   codebase is large, and ratchet one flag at a time
   (`noImplicitAny` → `strictNullChecks` → `strict`). The alternative —
   `strict: true` on 400 files at once — produces a branch nobody can
   merge.

### Interop you will actually write

```tsx
// A class that needs a hook: wrap the hook in a function component and render that.
function WithTheme({ children }: { children: (theme: Theme) => ReactNode }) {
  return <>{children(useTheme())}</>;
}

class LegacyHeader extends Component {
  render() { return <WithTheme>{(theme) => <header data-bs-theme={theme}>…</header>}</WithTheme>; }
}
```

A render prop, used deliberately, as a bridge — and deleted when
`LegacyHeader` becomes a function.

### Measure, do not guess

Before converting anything for its own sake, count: how many classes, how
many `connect` calls, how many `withRouter`, how many `UNSAFE_`. A
`grep -c` per pattern is the migration dashboard. Convert what blocks the
next feature; leave what does not. A class component that works, is tested
and is never edited has a migration priority of zero.

**→ In the demos:** Demo 23, Block 2 — how to read what you will inherit.

---

## 18. The capstone brief

**Extend ShopScope end-to-end with one feature.** Choose one:

| Option | The feature | What it forces |
|---|---|---|
| **A · Orders history** | `/account/orders`: the signed-in user's carts from DummyJSON (`/carts/user/:id`) as orders, a detail view per order, re-order into the cart | A new feature folder; a loader + `useQuery`; cross-feature sharing done through `types/` and the cart's public `index.ts` |
| **B · Product reviews** | Reviews on the detail page: list, add (admin-free), optimistic add with rollback, a `<Suspense>` boundary so the product paints before the reviews | `useOptimistic` or a fetcher; Suspense placement; an action; the four data states |
| **C · Back-office table** | `/account/inventory`: a `<DataTable<Product>>` with sort, filter in the URL, inline stock edit with rollback, admin-only | Generic components; URL state; `requireRole`; optimistic edit; a virtualised list if it grows |

Whichever you choose, the chain is the same, in this order, and each link
is a commit:

```
types/      → the entity and its API response, separately
api/        → the service: typed, one ApiError, cancellable
features/x/ → loader or query (decide, and say why in a comment)
            → the route objects, composed in app/router.tsx
            → the store, only if something must outlive the screen
            → colocated tests: pure logic, one component, one route via createRoutesStub, one MSW failure
ci          → the gate stays green: typecheck → lint (boundaries included) → test → build → budget
docs/adr/   → one ADR for the one decision you argued about
```

Done means: the feature works signed in as `emilys` and degrades correctly
for `averyp`; `npm run lint` passes with the boundaries rule on; the tests
cover the four data states; the bundle budget holds; and you can defend
every choice in the chain with a sentence from [§19](#19-the-interview-drill-one-question-per-session).

**→ In the demos:** Demo 23, Block 3 *Capstone brief* — types → service →
loader/query → route → store → tests → CI; the assessment rubric is
[§21](#21-self-assessment-rubric).

---

## 19. The interview drill: one question per session

One question per program session, each answered **from the ShopScope code**.
A model answer is three to six sentences; the *proof* is the demo you can
open to show it. Practise them aloud. An interviewer is not checking whether
you know the fact; they are checking whether you can connect it to
something you built.

**S01 · JavaScript & TypeScript — Why does `{} !== {}` matter in React?**
Because every comparison React makes is `Object.is`: effect dependencies,
`memo` props, `useSelector` results, Zustand selectors. An object literal in
render is a new reference every time, so it re-runs the effect, defeats the
memo and re-renders the subscriber. The fix is never "compare deeper"; it is
to create the value once (`useMemo`, module scope, a selector returning a
primitive) or to pass the primitive it was built from. *Proof:* Demo 18 Lab
3 breaks `memo(ProductCard)` with an inline `style={{}}` and repairs it.

**S02 · Introduction & toolchain — Why is ShopScope a Vite CSR app, and what did that decide?**
It is a product explorer behind interaction, not a content site, so first
paint and SEO were traded for a simpler deploy — one static bundle, a
`_redirects` fallback, no server. The cost is visible: `curl` returns an
empty `<div id="root">` and crawlers see nothing without JS. That decision
flips when SEO revenue or time-to-first-product matters, which is Demo 21's
Next.js mini-project. *Proof:* Demo 22 Lab 3's `curl`; Module 3 §6.

**S03 · Demo 1 — What is a component, and why must you not call `ProductCard()` directly?**
A component is a function returning JSX, but React only treats it as a
component when it is used as `<ProductCard />`: that gives it a position in
the tree, its own state and hooks, and a DevTools entry. Calling it as a
function inlines its hooks into the caller, which breaks the Rules of Hooks
the moment the call is conditional. *Proof:* Demo 1's composed card;
[Module 4 §1](../04-components-and-jsx/#1-what-a-component-actually-is).

**S04 · Demo 2 — Why does `key` matter?**
`key` is how React matches list items across renders; without a stable one it
falls back to position. Sort the grid with `key={index}` and the wishlist
hearts — state held by the card at position 3 — stay at position 3 while
the product moves. A stable `product.id` moves the state with the item.
It is a correctness issue, not a warning to silence. *Proof:* Demo 2 Lab 2
reproduces the bug on demand; [Module 6 §9](../06-conditional-rendering-and-lists/#9-key-the-bug-you-must-see-once).

**S05 · Demo 3 — State is a snapshot: why do three `setCount(count + 1)` calls add one?**
A render sees one fixed value of `count`; the setter schedules a re-render
with a new value but does not change the variable in the current closure.
Three calls each compute `count + 1` from the same snapshot. The updater
form, `setCount((n) => n + 1)`, queues functions that React applies in
order. Same reason an event handler fired after an `await` sees old state.
*Proof:* Demo 3's lifted wishlist; [Module 7 §11](../07-state-and-events/#11-state-as-a-snapshot).

**S06 · Demo 4 — When do you hand-roll a form and when do you reach for react-hook-form + zod?**
Hand-rolled controlled inputs are right for one or two fields where the
value drives the UI live. Past that, a library gives you registration,
per-field validation, touched/dirty state and submit handling without a
`useState` per field; `zod` makes the schema the single source of both the
type and the rules. ShopScope's field components are the same either way,
which is the point. *Proof:* Demo 4 builds both over the same `TextField`.

**S07 · Demo 5 — Why does StrictMode run your effect twice, and what does it catch?**
In development it mounts, unmounts and remounts every component, running
the effect's cleanup between. An effect whose cleanup is missing or wrong
shows a duplicated request or listener immediately — which is exactly the
bug that otherwise appears only when the user navigates away and back.
The fix is a real cleanup (`controller.abort()`), never a `hasRun` ref.
*Proof:* Demo 5 Lab 4 — the cancelled first request in the Network tab.

**S08 · Demo 6 — Why an API layer, and what does one `ApiError` buy you?**
Every screen needs the same base URL, auth header, timeout, error shape and
logging; an axios instance plus interceptors applies them once. `ApiError`
normalises a 404, a network failure, a timeout and a validation 422 into one
type with a human message, so components never read `error.response?.data`.
It is also the seam MSW tests against and the seam TanStack Query plugs
into. *Proof:* Demo 6's `client.ts`, `errorNormalizer.ts`; Module 21.

**S09 · Demo 7 — How do you prevent a race in search-as-you-type?**
A slow response for "key" can arrive after a fast one for "keyboard" and
overwrite it. Each effect run creates an `AbortController`, the cleanup
aborts it, and the handler ignores `axios.isCancel` errors — so only the
latest request can set state. Debouncing reduces requests; it does not fix
ordering. A query library does this by key for free. *Proof:* Demo 7 on
Slow 3G.

**S10 · Demo 8 — Why not fetch in an effect?**
An effect fires after first paint, so the user sees a spinner before the
request even starts; it runs on the client only; it has no cache, so
back/forward refetches; and a correct one needs an abort, an ignore flag,
race handling and error normalisation that every component then
duplicates. Loaders fetch before render and in parallel with the route's
code; TanStack Query adds the cache, dedupe and invalidation. ShopScope
kept `useApi` for one thing: a mutation from a form that keeps its input.
*Proof:* Demo 8's `useApi` next to Demo 10's loaders; [Module 12 §11](../12-effects/#11-data-fetching-in-an-effect).

**S11 · Demo 9 — What belongs in the URL?**
Anything a user might share, bookmark or press Back to undo: search, category,
sort, page, which product is open. `useSearchParams` makes it state that
survives refresh and lands in the loader. What stays local: grid density, a
pending delete, a disclosure — nobody sends a link to a density toggle.
*Proof:* Demo 9's filters in the URL; Demo 19 Lab 7 moving `?view=`.

**S12 · Demo 10 — What does a loader change, and what does a route `ErrorBoundary` catch?**
With a loader the page never renders in a loading state: the router runs
loaders for every matched route in parallel, then renders with the data.
A thrown `Response` or error in a loader, action or component lands in the
nearest route `ErrorBoundary`, so a 404 product shows the product boundary,
not a blank app. It does not catch handler or async errors. *Proof:* Demo 10
Lab 4's scoped `ProductErrorBoundary`.

**S13 · Demo 11 — Walk me through the refresh queue.**
When the access token expires, six in-flight requests all 401 at once. The
interceptor keeps one module-scope `refreshPromise`: the first 401 creates
it, the other five `await` the same one, so there is one refresh call — most
backends rotate the refresh token on use, so six calls would sign the user
out. Each request replays once (`_retry`), never for `/auth/*`, and a
failed refresh clears the store so the UI reacts. *Proof:*
`api/interceptors/refresh.ts`; Module 22.

**S14 · Demo 12 — When is Context the wrong tool?**
Context is a dependency-injection mechanism, not a store: every consumer
re-renders when the value changes, and there is no way to subscribe to a
slice. It is right for things that rarely change and everyone needs — theme,
the current user, a toast dispatcher. It is wrong for the wishlist, where one
heart click re-rendered every card. *Proof:* Demo 12 Lab 4's Profiler bill;
[Module 9 §12](../09-reducers-and-context/#12-context-re-render-behaviour).

**S15 · Demo 13 — Context vs Zustand vs TanStack Query?**
Ask who owns the data. If the server owns it — products, stock, prices — it
is server state and goes in TanStack Query, which caches, dedupes and
invalidates. If the client owns it and it outlives a screen — wishlist, cart,
theme — a Zustand store: subscribe to a slice, no provider, persisted.
Context remains for injecting rarely-changing values. The wishlist is
Zustand because there is no endpoint; the day there is one, it becomes a
query. *Proof:* Demo 13 Lab 1 replacing `WishlistProvider`; Demo 19 Lab 7's table.

**S16 · Demo 14 — Which requests may be retried, and why does a static host 404 on refresh?**
Retry only idempotent requests — `GET`, and `PUT`/`DELETE` where the
backend treats them so — with backoff and a cap; retrying a `POST` can
create two orders. Separately, a static host serves files, and
`/products/42` is not a file: without a fallback rewrite to `index.html`
the server 404s before React loads. Dev never shows it because Vite's dev
server has the fallback built in. *Proof:* Demo 14 Labs 3 and 5.

**S17 · Demo 15 — When is a ref the right tool?**
For a value that must survive renders without causing one (a timer id, the
last search term, an `AbortController`) and for a DOM node React renders but
you must command (focus, scroll, measure, hand to a canvas library). Reading
`ref.current` during render is a bug; writing to state from a ref in an
effect is usually a sign the value should be state. *Proof:* Demo 15 — `/`
focuses search; the first invalid field gets focus on failed submit.

**S18 · Demo 16 — How do you ship a dark theme without a flash of the wrong one?**
The theme is a CSS variable switch on `data-bs-theme`, persisted in
`localStorage`, defaulting to `prefers-color-scheme`. The flash happens
because React applies the attribute after hydration; the fix is a tiny
inline script in `index.html` that reads the stored value and sets the
attribute before the first paint. *Proof:* Demo 16 Lab 3; Module 25.

**S19 · Demo 17 — Why are error boundaries still classes, and why did hooks replace HOCs?**
A boundary must replace its own output when a descendant's render throws,
and only the class lifecycle (`getDerivedStateFromError`,
`componentDidCatch`) runs outside the failing render. HOCs shared logic by
wrapping — an extra tree level, injected props, name collisions, prop
arithmetic in TypeScript — while a hook puts the logic in the component
with none of that and lets the linter see inside. *Proof:* Demo 17 Lab 5's
`react-error-boundary`; Lab 6's `withAuth` → `useAuthUser`.

**S20 · Demo 18 — `memo` vs the React Compiler?**
`memo` skips a re-render when props are shallow-equal, which only works if
every prop has a stable identity — so it drags `useMemo` and `useCallback`
with it, and one inline object breaks the chain. The Compiler does that
analysis at build time and memoises what it can prove safe, assuming the
Rules of React hold. It removes the hand-written memoisation; it does not
remove the need for structure, virtualisation or fewer network calls.
*Proof:* Demo 18 Lab 3 then Lab 6 — the memoisation deleted, the Profiler
unchanged.

**S21 · Demo 19 — Why doesn't a loader cache, and what does TanStack Query add?**
A loader runs on every navigation to its route; open a product, go back,
open it again and the Network tab shows two identical requests. A query
keyed by `['product', id]` is served from the cache instantly and refetched
in the background when stale. The loader stays, calling `ensureQueryData`,
so the route still never renders without data. Add mutations with
`invalidateQueries` and the five hand-written refresh rules become two.
*Proof:* Demo 19 Lab 2; Module 24.

**S22 · Demo 20 — How would you test the refresh queue?**
Not by mocking the interceptor — that deletes the thing under test. MSW
handles `/auth/refresh` and a protected endpoint; the test expires the
token, fires six requests concurrently, and asserts the refresh handler was
hit once and all six resolved with the replayed token. A second case makes
the refresh fail and asserts the token store is cleared. It is an
integration test of `src/api` with no React rendered. *Proof:* Demo 20 Lab
4's "six concurrent 401s"; Module 18.

**S23a · Demo 21 — What do React Actions replace?**
The hand-written pending/error/success bookkeeping around a submit:
`<form action={fn}>` with `useActionState` gives the result and the pending
flag, `useFormStatus` lets a nested button disable itself, and
`useOptimistic` shows the expected result with automatic rollback. They
replace neither router actions, which own navigation and revalidation, nor
react-hook-form, which owns field-level validation — the three coexist, each
for a different form. *Proof:* Demo 21 Block 1's sign-up form beside Demo
10's `LoginPage` and Demo 4's `SignupForm`.

**S23b · Demo 21 — `'use client'` is a boundary, not a file switch — what does that mean?**
The directive marks where the server tree ends: that module and everything
it imports become client code and enter the bundle, whether or not they
carry the directive. One `'use client'` on a page turns the whole page into
a client component. So the discipline is to push it to the leaves — the
`AddToCartButton`, not the product list — and to pass server-rendered
`children` through it rather than importing server components into it.
*Proof:* Demo 21 Block 5's bundle comparison with one island.

**S24 · Demo 22 — Where do you store the token, and what is the trade-off?**
ShopScope keeps tokens in `localStorage` because DummyJSON issues them in a
JSON body: readable by any XSS, which is why the app sanitises rendered
HTML and ships a CSP. The alternative, an `httpOnly` cookie, is invisible to
script but sent automatically, so it needs CSRF protection and a same-site
backend. Neither is "secure"; each moves the risk, and the choice is an ADR.
*Proof:* Demo 22 Lab 2; Demo 11 Lab 1.

**S25 · Demo 23 — Where does the next feature go?**
`features/<name>/`, importing from `components/ui`, `api`, `lib` and
`types` and never from another feature; its routes are composed in
`app/router.tsx`. The direction is enforced by `eslint-plugin-boundaries`,
so a wrong import fails lint with a message naming the fix, and the decision
is written down in ADR 0001. *Proof:* Demo 23 Block 1; this module, §2–§7.

**→ In the demos:** Demo 23, Block 4 *Interview drill*.

---

## 20. System-design questions for a React front end

Front-end system design is not boxes and arrows for a database; it is
**where state lives, how data moves, what happens when it fails, and what
you measure**. Use the same frame for every question: clarify the scale →
the data and who owns it → the state layer → rendering and loading → failure
and degradation → performance budget and how you would know. Then draw it.

| Question | A strong answer covers |
|---|---|
| **Design the catalogue for 100,000 products with filters** | Server-side filtering and paging with the filters in the URL; a query per filter-set key with `keepPreviousData`; virtualised rows or "load more" via `useInfiniteQuery`; debounced input, cancelled stale requests; a budget for LCP on the grid; what is prefetched on hover |
| **Design authentication for a SPA** | Short-lived access token plus refresh; one refresh in flight (the queue); where the token lives and the XSS/CSRF trade-off; route middleware, not component guards; `redirectTo` with an open-redirect check; sign-out clearing every user-scoped store; what the server still enforces regardless |
| **Live stock levels on 200 visible cards** | Polling with `refetchInterval` paused when hidden, versus SSE/WebSocket pushing into the query cache with `setQueryData`; subscribe only to visible ids; reconnect with backoff; per-card subscription to a slice so one update re-renders one card |
| **A back-office table: 10,000 rows, inline edit, admin only** | Role middleware; sort/filter/page in the URL; a generic `<DataTable<T>>`; virtualisation; optimistic edit with snapshot/rollback; bulk edits with limited concurrency and honest partial failure; where normalisation earns its place |
| **Three brands on one storefront** | A monorepo: `packages/ui` with theme tokens as CSS variables, `apps/<brand>` with its own config and deploy; the dependency direction becomes package boundaries; what is shared (API client, UI) and what is not (copy, routes, feature flags) |
| **Move the catalogue to SSR for SEO without rewriting the account area** | Module 3's decision worksheet applied per route; the catalogue as Server Components in Next.js with client islands; the account area stays a SPA behind login; the shared `api/` and `types/` packages as the seam; what the metrics gain and what the framework costs |

Two habits make these answers land. **Say the trade-off out loud** — "I
would poll here, because the data changes every minute and a socket costs
an infrastructure team we do not have." And **name the failure state before
being asked** — the empty result, the 500, the lost connection, the
rejected optimistic edit. A design that only describes the happy path is a
demo, not a design.

---

## 21. Self-assessment rubric

Score yourself honestly on each row. *Junior* ships; *mid* ships and can
explain; *senior* ships, explains, and chose it over the alternatives for a
reason they can state.

| Dimension | Junior | Mid | Senior |
|---|---|---|---|
| **Component model** | Writes working components; sometimes defines them inside others or fetches in render | Pure components, correct `key`s, state in the right owner, `children` for composition | Designs the component API first; compound and generic components where the props would otherwise explode |
| **State** | `useState` for everything, including server data | Knows the five homes (URL, loader/query, store, form, local) and uses each | Can justify each placement and knows when a reason has expired and the decision should move |
| **Effects** | Effects for derived values and fetching; `hasRun` guards | Effects only for external systems, with cleanups that survive StrictMode | Deletes effects on sight; reaches for `useSyncExternalStore`, loaders, queries, event handlers first |
| **Data and errors** | Fetches in effects; `error.message` in the UI | A service layer, one error type, four data states designed | Caching, invalidation, optimistic updates with rollback, retries only where idempotent |
| **Architecture** | Type folders; imports go anywhere | Feature folders; direction documented | Direction enforced in lint; an ADR for every argued decision; knows when a package split is evidence-driven |
| **Legacy** | Avoids class components | Reads a class and maps each lifecycle to a hook | Plans an incremental migration, in the right order, with codemods and a grep dashboard |
| **Quality** | Tests the happy path, or not at all | Behaviour tests with Testing Library, MSW for the network, a CI gate | Chooses what *not* to test; E2E for the one journey that pays the bills; budgets that fail the build |
| **Communication** | Describes what the code does | Explains why, with the demo that proves it | Argues the trade-off, names the failure modes, and can be talked out of it by evidence |

A credible mid-level hire is *mid* in every row and *senior* in two. If a
row is *junior*, the module that moves it is named in
[§19](#19-the-interview-drill-one-question-per-session)'s proofs.

---

## 22. Self-check

1. State the five-second test, and name the two questions it must answer.
2. The cart is in six folders of the type-folder layout. List them, then
   give the one folder it lives in afterwards and what moves to `types/`.
3. Write the dependency direction for ShopScope as a list of "X may import
   Y". Which three rules carry most of the weight?
4. A developer imports `useProductFilters` from `features/catalog` inside
   `features/cart/CartDrawer.tsx`. What does the lint rule say, and what
   are the two legitimate fixes?
5. Why is one `@/` alias better than `@ui`, `@api`, `@features`? Where do you
   deliberately *not* use the alias?
6. List four costs of barrel files and the two places a barrel is justified.
7. Where does each live: the `Product` type · DummyJSON's list response type
   · `ProductCardProps` · the cart store · the catalogue's route objects ·
   `ProductCard.test.tsx` · the MSW handlers?
8. Name the MADR sections. Why is the "considered options" section worth more
   than the decision itself?
9. Give three evidence-based signals for splitting a package or app, and
   three non-reasons.
10. Rewrite `componentDidMount` + `componentDidUpdate(prevProps)` with an `if`
    + `componentWillUnmount` as one effect. What became the dependency array?
11. `this.setState({ loading: true })` versus `setRequest({ status: 'loading' })`
    — what did the class version do that the hook version does not?
12. What replaces each: `getDerivedStateFromProps` · `shouldComponentUpdate` ·
    `static defaultProps` · `this.timer` · `createRef` · `forceUpdate`?
13. Why can an error boundary not be written as a hook? Name the two kinds of
    error a boundary does not catch.
14. Convert `withAuth(EditProductLink, { role: 'admin' })` to a hook. List
    four things the hook version no longer needs.
15. When is a render prop still the right API?
16. Translate a `connect(mapStateToProps, mapDispatchToProps)` container to
    `useSelector`/`useDispatch`, then to a Zustand store hook. Name the one
    re-render difference between `connect` and `useSelector`.
17. Map each to v8: `<Switch>` · `exact` · `<Redirect>` · `withRouter` ·
    `useHistory().push` · `this.props.match.params` · a `render`-prop guard ·
    `react-router-dom`.
18. Why must the router upgrade go v5 → v6 → v7 → v8 rather than in one PR?
19. What happens to `ProductCard.propTypes = {…}` on React 19?
20. Name the three `UNSAFE_` lifecycles and the modern home for each.
21. `ReactDOM.render` → `createRoot` is not a rename. What does the new root
    opt the tree into, and what 2018 assumption does that break?
22. Give four StrictMode-unsafe legacy patterns and the fix for each.
23. Put the migration steps in order and say why React itself goes first and
    data-fetching classes go last.
24. Write the capstone chain from `types/` to `docs/adr/` and say what "done"
    means.
25. Answer S04, S10, S13, S15, S20 and S23b from
    [§19](#19-the-interview-drill-one-question-per-session) aloud, without
    notes, naming the demo for each.
26. Pick one system-design question from [§20](#20-system-design-questions-for-a-react-front-end)
    and give the failure states before the happy path.

### Practical

1. Refactor Demo 14's `solution/src` into the tree in [§2](#2-feature-folders-vs-type-folders)
   with no behaviour change: `npm run build` and the Demo 20 test suite pass
   before and after, in one PR.
2. Add `eslint-plugin-boundaries` with the policies from [§3](#3-dependency-direction-and-enforcing-it).
   Break the rule on purpose from `components/ui`; read the message; fix it
   by moving the dependency, not by editing the config.
3. Write ADR 0001 in MADR form. Then write ADR 0002 for the `localStorage`
   token decision from Demo 11, with the cookie option honestly argued.
4. Convert `legacy/ProductList.js` to a function component twice: once as a
   faithful effect, once as a loader. Diff the two and list what the loader
   version no longer needs.
5. Convert `legacy/withAuth` and `legacy/Fetch` from Demo 17 to hooks and
   delete the `legacy/` imports; keep the files with a `@deprecated` banner.
6. Rewrite `legacy/App.js` (v5) as a v8 route table. Prove deep links, the
   back button and the `/account` redirect still work with a Playwright
   journey.
7. Run `npx codemod@latest react/19/migration-recipe --dry-run` against a
   React 17 project (any old tutorial repo will do) and read every change it
   proposes before accepting one.
8. Build your capstone option, then record yourself answering the six
   questions in self-check 25. Listen back for the sentence where you stopped
   explaining and started describing.

---

## 23. References

**Architecture**
- [react.dev — Thinking in React](https://react.dev/learn/thinking-in-react)
- [react.dev — Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)
- [react.dev — Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)
- [`eslint-plugin-boundaries` — README](https://github.com/javierbrea/eslint-plugin-boundaries) · [rules reference](https://www.jsboundaries.dev/docs/rules/)
- [`eslint-plugin-import` — `no-restricted-paths`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md)
- [Architectural Decision Records — the ADR GitHub organisation](https://adr.github.io/) · [templates](https://adr.github.io/adr-templates/) · [MADR](https://adr.github.io/madr/)

**Legacy React — reference pages on react.dev**
- [Legacy React APIs](https://react.dev/reference/react/legacy) — the index, with the list of what React 19 removed
- [`Component`](https://react.dev/reference/react/Component) — every lifecycle method, the error-boundary section and the class-to-function migration recipes
- [`PureComponent`](https://react.dev/reference/react/PureComponent)
- [`forwardRef`](https://react.dev/reference/react/forwardRef) — and [Module 11 §9](../11-refs-and-the-dom/#9-ref-as-a-prop--and-legacy-forwardref) for `ref` as a prop
- [`createElement`](https://react.dev/reference/react/createElement) · [`cloneElement`](https://react.dev/reference/react/cloneElement) · [`Children`](https://react.dev/reference/react/Children) · [`createRef`](https://react.dev/reference/react/createRef)
- [`render` (deprecated)](https://react.dev/reference/react-dom/render) · [`createRoot`](https://react.dev/reference/react-dom/client/createRoot) · [`hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot)
- [`StrictMode`](https://react.dev/reference/react/StrictMode)
- [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) — removed APIs and the codemods

**Modern equivalents**
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Compiler](https://react.dev/learn/react-compiler)
- [`'use client'`](https://react.dev/reference/rsc/use-client) · [Server Components](https://react.dev/reference/rsc/server-components)
- [Rules of React](https://react.dev/reference/rules)

**React Router — official upgrade guides, one major each**
- [Upgrading from v5 (v6 docs)](https://reactrouter.com/v6/upgrading/v5)
- [Upgrading from v6 (v7 docs)](https://reactrouter.com/v7/upgrading/v6)
- [Updating from v7 (v8 docs)](https://reactrouter.com/upgrading/v7)
- [Future changes](https://reactrouter.com/upgrading/future)

**React Redux — official API reference, for reading `connect`**
- [`connect()`](https://redux.js.org/react-redux/api/connect) — marked deprecated in React Redux 9.3, hooks recommended

**Earlier modules this one closes**
- [Module 4 §4 — Organising components in a real project](../04-components-and-jsx/#4-organising-components-in-a-real-project)
- [Module 12 §8 — Think "synchronise", not "lifecycle"](../12-effects/#8-think-synchronise-not-lifecycle)
- Module 14 — Routing & Application Architecture · Module 16 — Advanced Patterns, Error Boundaries & Portals · Module 17 — TypeScript with React · Module 18 — Testing React Applications · Module 19 — Server Components & Modern React 19 · Module 20 — Shipping to Production
- Module 21 — The API Layer · Module 22 — Authentication & Protected Routes · Module 23 — Client State Libraries · Module 24 — Server State · Module 25 — Styling & Theming · Module 26 — Accessibility in React

---

**Previous:** [Module 26 — Accessibility in React](../26-accessibility/)
**Back to:** [the module index](../)
