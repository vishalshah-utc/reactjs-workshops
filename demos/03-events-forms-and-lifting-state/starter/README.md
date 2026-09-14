# ShopScope — Demo 3 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 2, finished** — a 24-card grid, controlled category strip, density
toggle, per-card wishlist heart — plus three new files: `ProductToolbar.tsx`
(a search box that does nothing yet), `ProductForm.tsx` (a dialog with no
fields), and `ConfirmDialog.tsx` (finished, for Lab 4).

## What you build

Search for `TODO(lab-` — ten markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/components/ProductToolbar.tsx` — controlled search + sort |
| `lab-1.2` | `src/lib/catalog.ts` — `applySort` without mutation |
| `lab-1.3`, `2.1`, `3.2`, `4.2` | `src/App.tsx` — derived list, lifted wishlist, products as state, delete + flash |
| `lab-2.2` | `ProductGrid.tsx`, `ProductCard.tsx` — the heart becomes controlled |
| `lab-2.3` | `SiteHeader.tsx` — wishlist count badge |
| `lab-3.1` | `ProductForm.tsx` — controlled fields + validation |
| `lab-4.1` | `ProductCard.tsx` — delete button |

The cold open has you deliberately write the **mutating** `sort()` first so
you can watch it break in Lab 1 before fixing it.

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../04-forms-manual-and-react-hook-form/starter`](../../04-forms-manual-and-react-hook-form/starter)
is this demo, finished.

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
