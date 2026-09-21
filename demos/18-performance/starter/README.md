# ShopScope — Demo 18 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 17, finished** — ShopScope with a compound `<Tabs>` on the detail page,
a `Pager` and a `CategoryStrip` that work controlled *or* uncontrolled through
`useControllableState`, a polymorphic `<Text as>`, a generic `<DataTable<T>>`
on the team page, a `<SelectField<T>>`, a `createPortal` `Dialog` with a focus
trap, `react-error-boundary` around the cart body and the uploader, and
`src/legacy/`'s HOC and render prop converted to hooks.

It is also, quietly, slow in all the usual ways. `ProductsPage` owns the search
draft, so every keystroke re-renders twelve product cards. It owns the price
chart's disclosure, so opening a chart re-renders the same twelve. `ProductCard`
takes five optional handler props, every one of them rebuilt on each render.
`ProductGrid` renders one card per product and nothing skips anything. Nobody
has measured any of it — which is the first thing you will do.

**Already here, so you only write the interesting part:**
`types/babel-react-compiler.d.ts` (ambient declarations for `@babel/core` and
`babel-plugin-react-compiler`, neither of which ships types) and
`tsconfig.node.json` with `"types": ["vite/client", "node"]`, so `vite.config.ts`
may read `process.env.ANALYZE`.

New dependencies: **`@tanstack/react-virtual@3.14.13`**,
**`rollup-plugin-visualizer@7.1.1`** and **`babel-plugin-react-compiler@1.0.0`**
— all three arrived with the Part 6 set in Demo 15 and are already installed.
Labs 5 and 6 import them for the first time.

## What you build

Search for `TODO(lab-` — twenty markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/lib/slowMode.ts` — the dev instrument: `SLOW_SPINS`, `spin()`, and the sink that stops it being deleted |
| `lab-1.2` | `src/components/ProductCard.tsx`, `ProductGrid.tsx` — the `slow` prop, and the spin inside the card's render |
| `lab-1.3` | `src/components/RenderProfiler.tsx` — `<Profiler onRender>` logging every commit through `src/config/logger.ts` |
| `lab-1.4` | `src/components/ProductToolbar.tsx`, `src/routes/ProductsPage.tsx` — the dev-only Slow mode switch; `<RenderProfiler id="grid">` |
| `lab-2.1` | `src/components/ProductToolbar.tsx`, `src/routes/ProductsPage.tsx` — the search draft moves down into the toolbar |
| `lab-2.2` | `src/components/ProductsSurface.tsx` — the chart disclosure owns its state; the grid arrives as `children` |
| `lab-2.3` | `src/routes/ProductsPage.tsx` — render through `<ProductsSurface>`; why density is neither pushed down nor in the URL |
| `lab-2.4` | `src/context/ToastContext.tsx` — profile the already-split context and prove dispatch consumers stay quiet |
| `lab-3.1` | `src/components/ProductCard.tsx` — `memo`, broken on purpose, then repaired |
| `lab-3.2` | `src/routes/ProductsPage.tsx` — `useCallback` for the handlers the cards receive |
| `lab-3.3` | `src/routes/account/TeamPage.tsx` — a directory filter with highlighting, and the `useMemo` its `columns` now need |
| `lab-4.1` | `src/components/ProductToolbar.tsx` — the client-side quick-filter input |
| `lab-4.2` | `src/routes/ProductsPage.tsx` — `useDeferredValue` and the stale-list dimming |
| `lab-4.3` | `src/components/tabs/Tabs.tsx`, `src/routes/ProductsPage.tsx` — `useTransition` with a pending indicator |
| `lab-5.1` | `src/components/ProductRowList.tsx` — `useVirtualizer` over all 194 products, with `measureElement` |
| `lab-5.2` | `src/routes/ProductsPage.tsx` — the "Show all 194" disclosure |
| `lab-5.3` | `src/components/ProductsSurface.tsx` — `lazy` + `Suspense` for the price histogram |
| `lab-5.4` | `src/lib/format.ts`, `vite.config.ts`, `scripts/check-bundle-size.mjs` — `Intl` over a date library, the visualiser, the budget |
| `lab-6.1` | `vite.config.ts`, `src/hooks/useLatest.ts` — the React Compiler through a Vite plugin; what it skips |
| `lab-6.2` | `src/components/ProductCard.tsx`, `src/routes/ProductsPage.tsx`, `src/routes/account/TeamPage.tsx` — delete Lab 3, re-profile |

## Finished version

The next starter: [`../../19-tanstack-query-and-realtime/starter`](../../19-tanstack-query-and-realtime/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:analyze · npm run check:bundle · npm run preview · npm run lint · npm test
```

Node 22.22+.
