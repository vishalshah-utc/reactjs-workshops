# ShopScope — Demo 1 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the demo guide](../README.md).** This file is just
how to run it.

## What is already done

Vite + React + Bootstrap wiring, `src/lib/format.ts` (`formatPrice`,
`discountedPrice`), and three DummyJSON-shaped products in
`src/data/sampleProducts.ts`.

## What you build

Search the project for `TODO(lab-` — there are eight, numbered by lab.

| Marker | File |
|---|---|
| `lab-1.1` … `1.3` | `src/components/SiteHeader.tsx`, `src/App.tsx` |
| `lab-2.1` … `2.3` | `PageHeader.tsx`, `PriceTag.tsx`, `StockBadge.tsx` |
| `lab-3.1`, `3.2` | `ProductCard.tsx`, `src/App.tsx` |

**The app runs from the first minute.** Every stub is a working minimal
version, not an empty shell — you improve things rather than fill in blanks.

## ⚠️ Don't re-click the starter link

Each click of a `/fork/` link creates a **fresh copy** — it does not reopen
your work. Once your project loads, the URL becomes `stackblitz.com/edit/…`;
bookmark that and return via the bookmark. Nothing is created on GitHub.

## Finished version

The next demo's starter **is this demo, finished** —
[`../../02-lists-keys-and-state/starter`](../../02-lists-keys-and-state/starter).
Diff against it when you're stuck.

## Commands

```bash
npm run dev
npm run typecheck   # Vite does NOT typecheck while serving — run this
npm run lint
npm run build       # tsc -b && vite build
```

Requires Node 22.22+ (`node -v`).
