# ShopScope — Demo 2 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

This is **Demo 1, finished**, plus two new files: `src/data/products.ts`
(24 DummyJSON-shaped products) and `src/lib/catalog.ts` (`buildCategories`).

## What you build

Search for `TODO(lab-` — six markers.

| Marker | File |
|---|---|
| `lab-1.1`, `1.2` | `src/components/ProductGrid.tsx` — `.map()` + keys, empty state |
| `lab-2.1` | `src/components/ProductCard.tsx` — wishlist heart with `useState` |
| `lab-3.1` | `src/components/CategoryStrip.tsx` — a controlled component |
| `lab-3.2`, `3.3` | `src/App.tsx` (+ `ProductGrid`, `ProductCard`) — lifted state, density toggle |

Lab 2 also has you deliberately break one working line to watch the
index-as-key bug happen, then undo it.

## ⚠️ Don't re-click the starter link

Each `/fork/` click creates a **fresh copy**. Bookmark the
`stackblitz.com/edit/…` URL once it loads.

## Finished version

The next demo's starter is this demo, finished:
[`../../03-events-forms-and-lifting-state/starter`](../../03-events-forms-and-lifting-state/starter).

## Commands

```bash
npm run dev
npm run typecheck   # Vite does NOT typecheck while serving — run this
npm run lint
npm run build       # tsc -b && vite build
```

Node 22.22+.
