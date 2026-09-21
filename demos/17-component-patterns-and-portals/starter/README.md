# ShopScope — Demo 17 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 16, finished** — ShopScope with a styling policy: React Bootstrap first,
CSS Modules where utilities cannot express a rule, `src/index.css` for theme
tokens and the product card's container query, `clsx` and `cva` variant maps in
`src/lib/variants.ts`, a three-way theme persisted under `shopscope.theme`, a
responsive grid, and the About page's styling showcase with a styled-vs-headless
dialog comparison. The product detail page lists details, warranty, shipping
and returns in one column and shows no reviews; `Pager` and `CategoryStrip` are
controlled-only; `TeamPage` is a hand-written `<Table>`; `SelectField` hands
back `string`.

**Not stubs, but new:** `src/legacy/withAuth.tsx` (a class-based HOC) and
`src/legacy/Fetch.tsx` (a class-based render prop), written in the 2018 style
and already wired into the detail page through `src/components/EditProductLink.tsx`
(the admin "Edit in catalogue" link) and `RelatedProducts.tsx` ("More in this
category"). Lab 6 reads them, then replaces them with hooks.

New stubs: `src/components/tabs/Tabs.tsx`, `src/hooks/useControllableState.ts`,
`src/components/Text.tsx`, `LinkOrButton.tsx`, `DataTable.tsx`,
`fields/SelectField.tsx`, `dialog/Dialog.tsx`, `src/hooks/useFocusTrap.ts`,
`WidgetBoundary.tsx`, `src/hooks/useFetch.ts`, `useAuthUser.ts`.
New dependency: **none today** — `react-error-boundary@6.1.5` arrived with the
Part 6 set in Demo 15 and is already installed; Lab 5 imports it for the first
time.

## What you build

Search for `TODO(lab-` — twenty markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/components/tabs/Tabs.tsx` — the compound component: private context, `useId`, `Tabs.List` / `Tabs.Tab` / `Tabs.Panel` |
| `lab-1.2` | `src/components/tabs/Tabs.tsx` — roving tabindex: ArrowLeft / ArrowRight / Home / End |
| `lab-1.3` | `src/types.ts` (`Review`, `reviews`, weight, dimensions), `src/routes/ProductDetailPage.tsx` — Details / Reviews / Shipping tabs |
| `lab-2.1` | `src/hooks/useControllableState.ts` — `value` or `defaultValue`, `onChange` in both modes, a dev warning on a mode switch |
| `lab-2.2` | `src/components/tabs/Tabs.tsx`, `Pager.tsx` — onto the hook; `Pager` gains `value` / `defaultValue` |
| `lab-2.3` | `src/components/CategoryStrip.tsx`, `src/routes/ProductsPage.tsx` — `value` / `defaultValue` / `onChange`; the page stays controlled |
| `lab-3.1` | `src/components/Text.tsx`, `PageHeader.tsx`, `src/routes/ProductDetailPage.tsx` — the polymorphic `as` prop |
| `lab-3.2` | `src/components/LinkOrButton.tsx`, `SiteHeader.tsx`, `CartDrawer.tsx` — a discriminated union of props |
| `lab-3.3` | `src/components/DataTable.tsx`, `src/routes/account/TeamPage.tsx` — `<DataTable<T>>`, columns with `satisfies` |
| `lab-3.4` | `src/components/fields/SelectField.tsx`, `fields/index.tsx`, `ProductForm.tsx` — `<SelectField<T>>` with `NoInfer` |
| `lab-4.1` | `src/components/dialog/Dialog.tsx` (marker also in `index.html`) — `createPortal` into `#dialog-root`, `aria-modal`, Escape, scroll lock |
| `lab-4.2` | `src/hooks/useFocusTrap.ts` — trap, wrap, restore |
| `lab-4.3` | `src/components/ConfirmDialog.tsx` — rebuild over `Dialog`, verify, put `Modal` back |
| `lab-4.4` | `src/components/styling/DialogComparison.tsx` — the third dialog and the bubbling counter |
| `lab-5.1` | `src/components/WidgetBoundary.tsx` — `react-error-boundary` with a fallback, `resetKeys`, `onReset`, `onError` |
| `lab-5.2` | `src/components/CartDrawer.tsx`, `src/routes/account/ProfilePage.tsx` — around the cart body and the uploader |
| `lab-5.3` | `src/components/WidgetBoundary.tsx` — the dev-only "Break this widget" button and the `Bomb` |
| `lab-6.1` | `src/hooks/useFetch.ts`, `src/components/RelatedProducts.tsx` — the render prop becomes a hook |
| `lab-6.2` | `src/hooks/useAuthUser.ts`, `src/components/EditProductLink.tsx` — the HOC becomes a hook |
| `lab-6.3` | `src/legacy/Fetch.tsx`, `src/legacy/withAuth.tsx` — `@deprecated` banners; the folder stays |

## Finished version

The next starter: [`../../18-performance/starter`](../../18-performance/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint · npm test
```

Node 22.22+.
