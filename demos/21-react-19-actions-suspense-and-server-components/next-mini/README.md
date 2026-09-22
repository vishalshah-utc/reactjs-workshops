# ShopScope — Next.js mini (Demo 21, Block 5)

The ShopScope product list, rendered on the **server**, with one client island
and one Server Function. Roughly 200 lines, and the only folder in this
repository that is not a Vite app.

It is a **sibling** of `starter/`, never inside it: the Vite project's
`tsconfig`, `vitest` and bundle-budget scripts all point at `starter/src`, and
`next` is not in the track's shared dependency set. This folder installs its
own dependencies and is invisible to `scripts/verify-demos.mjs`.

```bash
cd demos/21-react-19-actions-suspense-and-server-components/next-mini
npm install          # ~28 packages, about 15 seconds
npm run dev          # http://localhost:3000/products
npm run build        # then `npm start` to serve the production build
npm run typecheck
```

Node 22.22+. Requires network access to `https://dummyjson.com` **from Node**,
not just from the browser — see Troubleshooting in
[the demo guide](../README.md).

## What is where

| File | What it demonstrates |
|---|---|
| `app/products/page.tsx` | An `async` Server Component that `await`s DummyJSON directly. No effect, no loading flag, no client code. |
| `app/products/AddToCartButton.tsx` | The one `'use client'` island: `useOptimistic`, `useFormStatus`, a `<form action>`. |
| `app/products/actions.ts` | `'use server'` — a Server Function that validates its argument and calls `revalidatePath`. |
| `app/products/loading.tsx` | The `<Suspense>` boundary the framework writes for you. |
| `lib/dummyjson.ts` | `fetch` with `next: { revalidate: 300 }` — the data cache. |
| `lib/cart.ts` | A module-scope `Map` standing in for a session store, and honest about it. |

## The measurements

Taken with `next build` + `next start`, summing the chunks the served HTML
actually asks for:

| Build | Chunks | Raw | Gzip |
|---|---|---|---|
| `/products` as shipped | 8 | 567.1 kB | 169.9 kB |
| the same page with `<AddToCartButton>` removed | 6 | 565.7 kB | 170.1 kB |

**The island costs 1.3 kB.** Everything else is the framework, and it is there
whether you write a client component or not. That is the honest shape of the
RSC trade: it does not remove JavaScript, it removes *your* JavaScript — the
data fetching, the cache, the loading states, the rendering of 12 product
cards, all of which ship in the Vite app and none of which ship here.
