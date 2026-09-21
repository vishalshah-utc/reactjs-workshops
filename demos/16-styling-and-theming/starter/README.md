# ShopScope — Demo 16 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 15, finished** — the complete ShopScope SPA plus the keyboard pass:
`/` focuses search, a failed submit focuses its first invalid field, route
changes move focus to the heading and announce it, `TextField` exposes
`{ focus, select }` through `ref`, the Pager scrolls the grid back into view,
a price histogram drawn on a `<canvas>`, the cart drawer closes on Escape and
hands focus back, and animation honours `prefers-reduced-motion`. And **zero
lines of custom CSS** — `src/index.css` is a comment. Today that rule becomes
a policy.

New stubs: `src/components/styling/` (five `PriceTag.*.tsx` variants,
`pricetag.css`, `PriceTag.module.css`, `StylingShowcase.tsx`,
`DialogComparison.tsx`), `src/tailwind.css`, `src/lib/variants.ts`,
`src/components/ProductToolbar.module.css`,
`src/components/ConfirmDialog.headless.tsx`, `ConfirmDialog.module.css`.
New dependencies: **none today** — `clsx@2.1.1`,
`class-variance-authority@0.7.1`, `tailwindcss@4.3.3` and
`@tailwindcss/vite@4.3.3` arrived with the Part 6 set in Demo 15 and are
already installed.

## What you build

Search for `TODO(lab-` — nineteen markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/components/styling/PriceTag.plain.tsx`, `pricetag.css` — plain, global CSS |
| `lab-1.2` | `src/components/styling/PriceTag.module.tsx`, `PriceTag.module.css` — CSS Modules |
| `lab-1.3` | `src/components/styling/PriceTag.inline.tsx` — a `CSSProperties` object |
| `lab-1.4` | `src/components/styling/PriceTag.tailwind.tsx`, `src/tailwind.css`, `vite.config.ts` — Tailwind v4 next to Bootstrap |
| `lab-1.5` | `src/components/styling/PriceTag.bootstrap.tsx`, `StylingShowcase.tsx`; `src/routes/AboutPage.tsx` — the five side by side |
| `lab-2.1` | `src/components/StockBadge.tsx`, `ProductCard.tsx`, `PriceTag.tsx` — `clsx` replaces every template-string class |
| `lab-2.2` | `src/lib/variants.ts` — `badge` and `button` maps with `cva`, `VariantProps` |
| `lab-2.3` | `StockBadge.tsx`, `SiteHeader.tsx`, `CartDrawer.tsx`, `src/routes/ProductDetailPage.tsx` — use the maps |
| `lab-3.1` | `src/context/ThemeContext.tsx` — `'system'`, `matchMedia` through `useSyncExternalStore` |
| `lab-3.2` | `src/context/ThemeContext.tsx` — persist under `shopscope.theme` |
| `lab-3.3` | `src/components/SiteHeader.tsx` — a three-way segmented control |
| `lab-3.4` | `index.html` — the inline script that stops the flash (marker also in `ThemeContext.tsx`) |
| `lab-3.5` | `src/index.css`, `src/components/PriceTag.tsx` — theme tokens as custom properties, `.text-accent` |
| `lab-4.1` | `src/components/ProductGrid.tsx`, `Skeletons.tsx` — breakpoints per density, typed from `RowProps` |
| `lab-4.2` | `src/components/ProductToolbar.tsx`, `ProductToolbar.module.css` — a mobile-first toolbar |
| `lab-4.3` | `src/index.css`, `ProductGrid.tsx`, `ProductCard.tsx` — one container query |
| `lab-5.1` | `src/components/ConfirmDialog.headless.tsx`, `ConfirmDialog.module.css` — a native `<dialog>` in 40 lines |
| `lab-5.2` | `src/routes/ProductsPage.tsx` — swap it in, then back |
| `lab-5.3` | `src/components/styling/DialogComparison.tsx` — both dialogs on the About page |

## Finished version

The next starter: [`../../17-component-patterns-and-portals/starter`](../../17-component-patterns-and-portals/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint · npm test
```

Node 22.22+.
