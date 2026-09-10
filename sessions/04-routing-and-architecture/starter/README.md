# Session 4 starter — Routing & Application Architecture

This is **Session 3, finished**: the debounce clears its timer, `useProducts`
aborts in-flight requests and tells empty apart from error, the cart persists,
and the online indicator subscribes and cleans up.

Your job this session is to give it URLs.

## Run it

```bash
npm install
npm run dev
```

One command starts both:

- **web** — Vite on <http://localhost:5173>
- **api** — the ShopCrew API on <http://localhost:4000>

Vite proxies `/api` and `/ws` to :4000, so the app can `fetch('/api/products')`
with no host and no CORS.

## Scripts

```bash
npm run dev         # api + web together
npm run build       # typecheck + production build
npm run preview     # serve the real build
npm run lint        # eslint
npm run typecheck   # tsc, no emit
```

Node 20.19+ or 22.12+.

## What to open first

1. [`src/ARCHITECTURE.md`](./src/ARCHITECTURE.md) — the map of this codebase,
   and Lab 4's brief.
2. `src/router.tsx` — every URL the app answers to.
3. `src/main.tsx` — where Lab 1 starts.

## Finding your work

Every task is a marked TODO. To see what is left:

```bash
grep -rn "TODO(lab" src/
```

| Marker | File | Lab |
|---|---|---|
| `lab-1.1` | `src/main.tsx` | Mount the router |
| `lab-1.2` | `src/router.tsx` | Index route |
| `lab-1.3` | `src/components/SiteHeader.tsx` | `Link` and `NavLink` |
| `lab-2.1` | `src/router.tsx` | `products/:slug` |
| `lab-2.2` | `src/router.tsx` | Cart route + 404 splat |
| `lab-2.3` | `src/routes/RouteError.tsx` | `useRouteError` |
| `lab-2.4` | `src/routes/ProductDetailPage.tsx` | `useParams` |
| `lab-3.1` | `src/routes/CatalogPage.tsx` | `useSearchParams` as state |
| `lab-3.2` | `src/lib/filters.ts` | URL ⇄ filters |
| `lab-4.1` | `src/router.tsx` | `lazy` + `Suspense` |
| `lab-4.2` | `src/ARCHITECTURE.md` | Feature slices + lint boundary |

The guide is [../README.md](../README.md). The one-pager is
[../CHEATSHEET.md](../CHEATSHEET.md).

## Expected state before Lab 1

The app renders a placeholder saying "No router yet". That is correct —
`src/main.tsx` has not mounted the router. It typechecks, lints and builds
cleanly in that state:

```bash
npm run typecheck && npm run lint && npm run build
```
