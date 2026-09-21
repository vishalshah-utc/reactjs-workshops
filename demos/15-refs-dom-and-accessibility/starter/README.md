# ShopScope — Demo 15 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 14, finished** — the complete ShopScope SPA: loaders and actions,
JWT auth with a refresh queue, protected routes and roles, a theme and a
toast system in Context, a wishlist and a persisted cart in Zustand stores,
optimistic deletes, uploads behind a flag, retries, lazy routes and a build
that deploys. It works — with a mouse. Unplug it and you will find the gaps
this demo closes.

New stubs: `src/hooks/useRenderCount.ts`, `src/hooks/useLatest.ts`,
`src/hooks/useKeyboardShortcut.ts`, `src/hooks/useReducedMotion.ts`,
`src/components/RouteAnnouncer.tsx`, `src/components/PriceHistogram.tsx`,
`src/lib/histogram.ts`. New dependencies: **the whole Part 6 set** (TanStack
Query, Vitest, Testing Library, MSW, Playwright, axe, `clsx`, `cva`,
Tailwind, `react-error-boundary`, the React Compiler plugin…) — already in
`package.json`, installed once, used across Demos 15–23. Nothing in this demo
imports any of them.

## What you build

Search for `TODO(lab-` — nineteen markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/hooks/useRenderCount.ts` — the counter; `src/components/ProductToolbar.tsx` — call it |
| `lab-1.2` | `src/hooks/useLatest.ts` — the hook; `src/hooks/useDebouncedCallback.ts` — use it |
| `lab-1.3` | `src/routes/ProductsPage.tsx` — the "last reported search" ref |
| `lab-2.1` | `src/hooks/useKeyboardShortcut.ts` |
| `lab-2.2` | `src/components/ProductToolbar.tsx` — a ref on the search box, `/` focuses it |
| `lab-2.3` | `src/components/ProductForm.tsx` — a Map of refs; focus the first invalid field |
| `lab-2.4` | `src/components/RouteAnnouncer.tsx` |
| `lab-2.5` | `src/routes/RootLayout.tsx` — `<main>` + the announcer; `src/components/PageHeader.tsx` — a focusable `h1` |
| `lab-3.1` | `src/components/fields/TextField.tsx`, `fields/index.tsx` — `ref` as a prop, `useImperativeHandle` |
| `lab-3.2` | `src/components/ProductForm.tsx` — use the handle |
| `lab-3.3` | `src/components/ProductGrid.tsx`, `src/components/Pager.tsx` — a ref in, `scrollIntoView` out |
| `lab-3.4` | `src/routes/ProductsPage.tsx`, `src/hooks/useProductFilters.ts` — wire it; `preventScrollReset` |
| `lab-4.1` | `src/lib/histogram.ts` — a canvas "library" with no React in it |
| `lab-4.2` | `src/components/PriceHistogram.tsx` — the React wrapper; `useLayoutEffect` |
| `lab-4.3` | `src/routes/ProductsPage.tsx` — the Prices panel; `flushSync` |
| `lab-5.1` | `src/components/CartDrawer.tsx` — Escape, focus restore, labels |
| `lab-5.2` | `src/components/ProductToolbar.tsx` — the results count as a live region |
| `lab-5.3` | `src/hooks/useReducedMotion.ts`, `RootLayout.tsx`, `Pager.tsx`, `ProductsPage.tsx` — reduced motion |
| `lab-5.4` | `src/routes/RootLayout.tsx` — skip link; `src/components/SiteHeader.tsx` — a search box that searches |

## Finished version

The next starter: [`../../16-styling-and-theming/starter`](../../16-styling-and-theming/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint · npm test
```

Node 22.22+.
