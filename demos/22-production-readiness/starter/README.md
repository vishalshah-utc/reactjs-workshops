# ShopScope — Demo 21 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 20, finished** — ShopScope with a test suite underneath it.

- **The toolchain.** `vitest.config.ts` extends the real `vite.config.ts` with
  `mergeConfig`, so tests run through the same React Compiler transform the
  build uses. `environment: 'jsdom'`, `globals: true`, `setupFiles:
  ['./src/test/setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`, `exclude:
  ['e2e/**', …]`, a `coverage` block, and — the line without which nothing
  imports — `test.env` supplying `VITE_API_BASE_URL` and `VITE_PAGE_SIZE`,
  because Vitest does not read `.env.development`.
- **The test kit.** `src/test/setup.ts` (jest-dom matchers, the jsdom gaps:
  `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `scrollIntoView`,
  plus the MSW server lifecycle and `cleanup`), `src/test/utils.tsx`
  (`renderWithProviders` — a fresh `QueryClient` per test, `ThemeProvider`,
  `ToastProvider`, an optional `MemoryRouter`), and `src/test/fixtures.ts`
  (`makeProduct`, a 24-product `CATALOGUE`, `CATEGORIES`, `ADMIN_USER`).
- **The network, mocked at the boundary.** `src/test/msw/handlers.ts` answers
  every DummyJSON endpoint the app can reach — including `select=`, `limit=0`,
  `sortBy/order`, the search and category paths, the three writes, `/auth/*`,
  `/users` and `/carts/add` — and `src/test/msw/server.ts` starts one
  `setupServer` for the whole run. Nothing in `src/` is mocked.
- **95 tests in 9 files.** `ProductCard.test.tsx` (component behaviour);
  `validation`, `retry`, `reducers`, `store/cart`, `api/queries` (pure, no
  `render` at all); `routes/ProductsPage.test.tsx` (loading → results → empty →
  error through MSW); `api/interceptors/refresh.test.ts` (one refresh for six
  concurrent 401s, and the `ApiError` normaliser);
  `routes/routes.test.tsx` (`createRoutesStub` over `productDetailLoader`,
  `productsAction` and the `/account` → `/login?redirectTo=` middleware).
- **One E2E journey.** `playwright.config.ts` (a `webServer` that builds and
  serves `dist/` on port 4173) and `e2e/checkout.spec.ts`: sign in as `emilys`,
  add to cart, check out. Vitest is configured never to look in `e2e/`.
- **Scripts.** `npm test` · `npm run test:watch` · `npm run test:coverage` ·
  `npm run test:e2e`. The gate Demo 22 puts in GitHub Actions is already the
  four commands `typecheck → lint → test → build`.

> The Playwright browser is not installed in this repository. Run
> `npx playwright install chromium` once before `npm run test:e2e`, and
> `npm run test:coverage` will offer to install `@vitest/coverage-v8` on its
> first run. Everything else runs with the shared dependency set as it stands.

New dependencies: **none today** — React 19's Actions, `useActionState`,
`useFormStatus`, `useOptimistic`, `use` and `<Suspense>` are all in the
`react` you already have.

## What you build

Nothing yet: this tree has no `TODO(lab-…)` markers. The next author adds them.

## Finished version

The next starter: `../../22-production-readiness/starter`.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm test · npm run test:watch · npm run test:coverage · npm run test:e2e · npm run build · npm run check:bundle · npm run preview
```

Node 22.22+.
