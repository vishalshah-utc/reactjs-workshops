# ShopCrew — Session 1 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the session guide](../README.md).** This file is
just how to run it.

## What is already done

Configuration, design tokens, the `ui/` primitives, `ProductImage`,
`CategoryStrip`, `SiteFooter`, the `Product` type, the 24-product dataset and
the `cn` / `formatPrice` helpers.

## What you build

Search the project for `TODO(lab-` — there are twelve, numbered by lab.

| Marker | File |
|---|---|
| `lab-1.1` … `1.4` | `src/components/SiteHeader.tsx`, `src/App.tsx` |
| `lab-2.1` … `2.4` | `PageHeader`, `PriceTag`, `Rating`, `StockBadge` |
| `lab-3.1` … `3.5` | `ProductCard`, `ProductGrid`, `src/App.tsx` |
| `lab-4.1` … `4.5` | `SiteHeader`, `src/App.tsx`, React DevTools |

**The app runs from the first minute.** Every stub is a working minimal
version, not an empty shell — you improve things rather than fill in blanks,
and you can see the effect of every change immediately.

## Stuck?

`../solution/` has the finished version of every file. Copy the one you are
stuck on and keep going. Falling behind on Lab 2 and missing Lab 3 is much
worse than copying a file.

## Commands

```bash
npm run dev         # dev server with hot reload
npm run typecheck   # Vite does NOT typecheck during dev — run this
npm run lint
npm run build
```

Requires Node 20.19+ or 22.12+.
