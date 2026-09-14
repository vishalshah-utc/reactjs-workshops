# ShopScope — Demo 9 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 8, finished** — real create/edit/delete, one `useApi` hook for every
fetch. One URL for the whole app.

New: `src/router.tsx`, `src/routes/RootLayout.tsx`, `src/routes/NotFoundPage.tsx`,
`src/routes/ProductDetailPage.tsx`, `src/hooks/useProductFilters.ts` (stubs);
`src/routes/AboutPage.tsx` (finished).

**Node 22.22+** — `react-router@8` requires it.

## What you build

Search for `TODO(lab-` — ten markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/router.tsx` — the route tree |
| `lab-1.2`, `2.3` | `src/routes/RootLayout.tsx` — scroll restoration, wishlist via Outlet context |
| `lab-1.3` | `src/main.tsx` — `RouterProvider` |
| `lab-1.4`, `4.2` | `src/App.tsx` → becomes `src/routes/ProductsPage.tsx`; URL filters |
| `lab-2.1` | `src/components/SiteHeader.tsx` — `NavLink` |
| `lab-2.2` | `src/routes/NotFoundPage.tsx` |
| `lab-3.1` | `src/routes/ProductDetailPage.tsx` |
| `lab-3.2` | `src/components/ProductCard.tsx` — links |
| `lab-4.1` | `src/hooks/useProductFilters.ts` — `useSearchParams` |

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../10-loaders-actions-and-error-boundaries/starter`](../../10-loaders-actions-and-error-boundaries/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
