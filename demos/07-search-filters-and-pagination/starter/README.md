# ShopScope — Demo 7 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 6, finished** — validated config, axios instances, endpoints, a
service layer, `ApiError`, two interceptors. The UI still downloads all 194
products and filters them in the browser.

New stubs: `src/hooks/useDebouncedValue.ts`, `src/components/Pager.tsx`,
`src/components/ProductDetail.tsx`.

## What you build

Search for `TODO(lab-` — ten markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/hooks/useDebouncedValue.ts` |
| `lab-1.2` | `src/api/services/products.ts` — one function, three endpoints |
| `lab-1.3`, `2.1`, `3.1`, `4.3` | `src/App.tsx` — server-side filters, categories effect, paging, drawer state |
| `lab-2.2` | `src/components/CategoryStrip.tsx` — optional count |
| `lab-3.2` | `src/components/Pager.tsx` |
| `lab-4.1` | `src/components/ProductDetail.tsx` — fetch on select |
| `lab-4.2` | `src/components/ProductCard.tsx` — `onSelect` |

Open the Network tab before you start; most of this demo is visible there,
not on the screen.

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../08-mutations-and-custom-hooks/starter`](../../08-mutations-and-custom-hooks/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
