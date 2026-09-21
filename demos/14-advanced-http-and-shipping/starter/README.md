# ShopScope — Demo 14 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 13, finished** — login, refresh queue, protected routes, roles, and a wishlist + cart in Zustand stores with a checkout action.

New stubs: `src/api/services/uploads.ts`, `src/components/Uploader.tsx`,
`src/lib/retry.ts`. New config: `VITE_UPLOAD_BASE_URL`, `env.upload`,
`uploadApi`. New file: `public/_redirects`.

## What you build

Search for `TODO(lab-` — seven markers.

| Marker | File |
|---|---|
| `lab-1.1`, `3.2` | `src/routes/ProductsPage.tsx` — optimistic delete; retry the loader's GET |
| `lab-2.1` | `src/components/Uploader.tsx` |
| `lab-2.2` | `src/api/services/uploads.ts` |
| `lab-2.3` | `src/routes/account/ProfilePage.tsx` — behind the feature flag |
| `lab-3.1` | `src/lib/retry.ts` |
| `lab-4.1` | `src/router.tsx` — lazy routes |

Lab 5 has no markers — it's `npm run build` and reading what comes out.

## Finished version

[`../solution/`](../solution/) — the complete ShopScope.

## Commands

```bash
npm run dev · npm run typecheck · npm run build · npm run build:staging · npm run preview · npm run lint
```

Node 22.22+.
