# ShopScope — Demo 5 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 4, finished** — search, sort, wishlist, the field library and both
forms, delete — over 24 bundled products. Plus three stubs: `src/lib/errors.ts`,
`src/components/ErrorNotice.tsx`, `src/components/Skeletons.tsx`.

## The backend

[DummyJSON](https://dummyjson.com) — free, no key, CORS open. Try
`https://dummyjson.com/products?limit=3` in a tab. Append `&delay=2000` to
any request to slow it down; you'll do this constantly.

## What you build

Search for `TODO(lab-` — seven markers.

| Marker | File |
|---|---|
| `lab-1.1`, `2.1`, `3.2`, `4.1` | `src/App.tsx` — fetch, three states, retry, cancellation |
| `lab-2.2` | `src/components/ErrorNotice.tsx` |
| `lab-2.3` | `src/components/Skeletons.tsx` |
| `lab-3.1` | `src/lib/errors.ts` |

Lab 4 has you deliberately delete one working line to watch a race condition
happen, then put it back.

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../06-config-and-the-api-layer/starter`](../../06-config-and-the-api-layer/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
