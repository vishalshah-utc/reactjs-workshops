# ShopScope — Demo 12 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 11, finished** — login, refresh queue, protected routes, roles. The
wishlist lives in `RootLayout` and travels through Outlet context; the cart
badge is a hardcoded `3`; "Add to cart" does nothing.

New stubs: `src/store/wishlist.ts`, `src/store/cart.ts`,
`src/components/CartDrawer.tsx`, `src/api/services/carts.ts`,
`src/routes/account/checkout.ts`. New dependency: `zustand@5.0.15`.

## What you build

Search for `TODO(lab-` — sixteen markers.

| Marker | File |
|---|---|
| `lab-1.1`, `3.2` | `src/store/wishlist.ts` — the store; then `persist` |
| `lab-1.2`, `2.4` | `src/routes/RootLayout.tsx` — delete the Outlet-context wishlist; render `<CartDrawer />` |
| `lab-1.3`, `2.4` | `src/components/SiteHeader.tsx` — counts from the stores; the cart button opens the drawer |
| `lab-1.4` | `src/routes/ProductsPage.tsx` — wishlist and `add` from the stores |
| `lab-2.1`, `3.1`, `4.5` | `src/store/cart.ts` — the store; `persist` + `partialize`; `subscribe` |
| `lab-2.2` | `src/components/ProductCard.tsx`, `ProductGrid.tsx` — `onAddToCart` |
| `lab-2.3`, `4.4` | `src/components/CartDrawer.tsx` — the drawer; the checkout form |
| `lab-2.5` | `src/routes/ProductDetailPage.tsx` — Add to cart and Save |
| `lab-4.1` | `src/api/endpoints.ts`, `src/api/services/carts.ts` |
| `lab-4.2` | `src/routes/account/checkout.ts` — the action-only route |
| `lab-4.3` | `src/router.tsx` |

## Finished version

The next starter: [`../../13-advanced-http-and-shipping/starter`](../../13-advanced-http-and-shipping/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint
```

Node 22.22+.
