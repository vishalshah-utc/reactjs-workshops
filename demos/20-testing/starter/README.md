# ShopScope — Demo 20 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 19, finished** — ShopScope with a server-state cache underneath it.

- **One cache, at module scope.** `src/lib/queryClient.ts` creates the
  `QueryClient` (`staleTime: 30 s`, `gcTime: 10 min`, a `retry` predicate that
  reuses `isRetryable` from `lib/retry.ts`, `mutations: { retry: false }`).
  `src/main.tsx` publishes it through `QueryClientProvider`; the **loaders**
  import the same object directly, because a loader has no hooks.
- **Every key in one factory.** `src/api/queries.ts` holds `productKeys` and
  every `queryOptions()` the app uses — including `listOptionsFrom`, which
  decides what a "page of the catalogue" is identified by.
- **Loaders fill the cache, pages read it back.** `productsLoader` and
  `productDetailLoader` call `ensureQueryData`; the pages call `useQuery` with
  the loader's value as `initialData`.
- **Forms post to actions, buttons call mutations.** `productsAction` for
  create/update; `useDeleteProduct()` for the optimistic delete.
- **Infinite, polled and pushed.** `EndlessGrid`, `LiveStockBadge`,
  `usePriceTicker` over a mock SSE endpoint, `useOnlineStatus`.

And **nothing here is tested.** `npm run typecheck` is happy, `npm run lint`
is happy, and not one line proves that the wishlist button toggles, that the
refresh queue holds under six concurrent 401s, or that the optimistic delete
rolls back.

New dependencies: **none today** — `vitest`, `jsdom`, `@testing-library/react`,
`@testing-library/user-event`, `@testing-library/jest-dom`, `msw` and
`@playwright/test` all arrived with the Part 6 set in Demo 15 and are already
installed. `package.json` already has `test` and `test:watch` scripts pointing
at Vitest; there is no Vitest configuration yet, which is Lab 1.

> `npm test` fails in this tree, on purpose. That is where Lab 1 starts.

## What you build

| Marker | File |
|---|---|
| `TODO(lab-1.1)` | `src/test/setup.ts` — matchers, the jsdom gaps, RTL cleanup |
| `TODO(lab-1.2)` | `src/test/utils.tsx` — `renderWithProviders` |
| `TODO(lab-2.1)` | `src/components/ProductCard.test.tsx` |
| `TODO(lab-3.1)` | `src/lib/validation.test.ts` |
| `TODO(lab-3.2)` | `src/lib/retry.test.ts` |
| `TODO(lab-3.3)` | `src/reducers/reducers.test.ts` — all three reducers |
| `TODO(lab-3.4)` | `src/store/cart.test.ts` — Zustand outside React |
| `TODO(lab-3.5)` | `src/api/queries.test.ts` — cache-key hygiene |
| `TODO(lab-4.1)` | `src/test/msw/handlers.ts` |
| `TODO(lab-4.2)` | `src/test/msw/server.ts` |
| `TODO(lab-4.3)` | `src/routes/ProductsPage.test.tsx` — the four data states |
| `TODO(lab-4.4)` | `src/api/interceptors/refresh.test.ts` |
| `TODO(lab-5.1)` | `src/routes/routes.test.tsx` — loader, action, middleware |

Three files have no marker because they do not exist yet — you create them
whole: `vitest.config.ts` (Lab 1), `playwright.config.ts` and
`e2e/checkout.spec.ts` (Lab 6). `src/test/fixtures.ts` is given to you
complete: it is data, not a lesson.

## Finished version

The next starter: `../../21-react-19-actions-suspense-and-server-components/starter`.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm test · npm run test:watch · npm run build · npm run check:bundle · npm run preview
```

Node 22.22+.
