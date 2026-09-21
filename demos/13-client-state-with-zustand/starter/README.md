# ShopScope — Demo 13 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 12, finished** — login, refresh queue, protected routes, roles, a
`ThemeProvider`, a `ToastProvider` every action reports through, a
reducer-driven request status, and `cartLinesReducer` in `src/lib/cartMath.ts`.
The wishlist lives in `WishlistProvider` and reaches components through
`useWishlist()`; the cart badge is a hardcoded `3`; "Add to cart" does nothing.

New stubs: `src/store/wishlist.ts`, `src/store/cart.ts`,
`src/components/CartDrawer.tsx`, `src/api/services/carts.ts`,
`src/routes/account/checkout.ts`. New dependency: `zustand@5.0.15`.

## What you build

Search for `TODO(lab-` — sixteen markers.

| Marker | File |
|---|---|
| `lab-1.1`, `3.2` | `src/store/wishlist.ts` — the store; then `persist` |
| `lab-1.2` | `src/main.tsx` — delete `<WishlistProvider>` (and `src/context/WishlistContext.tsx`) |
| `lab-1.3`, `2.4` | `src/components/SiteHeader.tsx` — counts from the stores; the cart button opens the drawer |
| `lab-1.4` | `src/routes/ProductsPage.tsx` — wishlist and `add` from the stores |
| `lab-2.1`, `3.1`, `4.5` | `src/store/cart.ts` — the store over `cartLinesReducer`; `persist` + `partialize`; `subscribe` |
| `lab-2.4` | `src/routes/RootLayout.tsx` — render `<CartDrawer />` |
| `lab-2.2` | `src/components/ProductCard.tsx`, `ProductGrid.tsx` — `onAddToCart` |
| `lab-2.3`, `4.4` | `src/components/CartDrawer.tsx` — the drawer; the checkout form |
| `lab-2.5` | `src/routes/ProductDetailPage.tsx` — Add to cart; Save from the store instead of the provider |
| `lab-4.1` | `src/api/endpoints.ts`, `src/api/services/carts.ts` |
| `lab-4.2` | `src/routes/account/checkout.ts` — the action-only route |
| `lab-4.3` | `src/router.tsx` |

## Finished version

The next starter: [`../../14-advanced-http-and-shipping/starter`](../../14-advanced-http-and-shipping/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint
```

Node 22.22+.
