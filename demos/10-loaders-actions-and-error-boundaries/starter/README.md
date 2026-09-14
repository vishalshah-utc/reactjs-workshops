# ShopScope — Demo 10 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 9, finished** — a routed app with a layout, a detail page, and every
filter in the URL. Pages still fetch after render with `useApi`.

New: `src/hooks/useDebouncedCallback.ts`, `src/routes/RootErrorBoundary.tsx`,
`src/routes/ProductErrorBoundary.tsx` (stubs); `src/routes/AppBootSplash.tsx`
(finished).

## What you build

Search for `TODO(lab-` — twelve markers.

| Marker | File |
|---|---|
| `lab-1.1`, `3.2`, `4.1` | `src/routes/ProductsPage.tsx` — loader, action, fetcher |
| `lab-1.2` | `src/routes/ProductDetailPage.tsx` — loader, 404 → `data()` |
| `lab-1.3`, `2.2`, `5.3` | `src/router.tsx` — wire loaders/actions, `HydrateFallback`, boundaries |
| `lab-1.4` | `src/hooks/useDebouncedCallback.ts` |
| `lab-2.1` | `src/routes/RootLayout.tsx` — `useNavigation` progress bar |
| `lab-3.1` | `src/components/ProductForm.tsx` — the router's `<Form>` |
| `lab-5.1`, `5.2` | `RootErrorBoundary.tsx`, `ProductErrorBoundary.tsx` |

**DummyJSON simulates writes.** After a create the list revalidates — and
doesn't include the new product. The flash message says so; the guide
explains why that's the router working correctly.

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../11-auth-and-protected-routes/starter`](../../11-auth-and-protected-routes/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
