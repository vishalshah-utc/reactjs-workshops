# ShopScope — Demo 12 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 11, finished** — login, refresh queue, protected routes, roles. The
wishlist lives in `RootLayout` and travels through Outlet context; the cart
badge is a hardcoded `3`; the profile page tracks one request with three
flags; and three pages show a "done!" message three different ways.

New stubs: `src/reducers/requestStatus.ts`, `src/lib/cartMath.ts`,
`src/context/ThemeContext.tsx`, `src/context/ToastContext.tsx`,
`src/context/WishlistContext.tsx`. New dependency: none (`zustand` is
installed for Demo 13, not used yet).

## What you build

Search for `TODO(lab-` — fourteen markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/reducers/requestStatus.ts` — the request state machine |
| `lab-1.2` | `src/routes/account/ProfilePage.tsx` — `useReducer` replaces three flags |
| `lab-1.3` | `src/lib/cartMath.ts`, `src/types.ts` — the cart's rules as a pure reducer; `CartLine` |
| `lab-2.1` | `src/context/ThemeContext.tsx` — `ThemeProvider`, `useTheme()` |
| `lab-2.2`, `3.2`, `4.2` | `src/main.tsx` — providers around `<RouterProvider>` |
| `lab-2.3`, `4.3` | `src/components/SiteHeader.tsx` — the theme toggle; the wishlist count from context |
| `lab-3.1` | `src/context/ToastContext.tsx` — reducer + two contexts + `ToastProvider` |
| `lab-3.3`, `4.3` | `src/routes/ProductsPage.tsx` — toasts instead of alerts; `useWishlist()` |
| `lab-3.4` | `src/components/SignupForm.tsx` — toast instead of `welcome` |
| `lab-4.1` | `src/context/WishlistContext.tsx` — `WishlistProvider`, `useWishlist()` |
| `lab-4.2` | `src/routes/RootLayout.tsx` — delete the Outlet-context wishlist |
| `lab-4.4` | `src/routes/ProductDetailPage.tsx` — the Save button |

## Finished version

The next starter: [`../../13-client-state-with-zustand/starter`](../../13-client-state-with-zustand/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint
```

Node 22.22+.
