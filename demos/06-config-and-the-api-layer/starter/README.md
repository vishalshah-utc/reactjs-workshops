# ShopScope — Demo 6 starter

```bash
npm install
npm run dev              # mode: development
npm run dev:staging      # mode: staging
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 5, finished** — 194 products from DummyJSON, skeletons, human error
messages, retry, cancellation — with axios called directly from `App.tsx`.

New, all stubs (working minimal versions): `src/config/env.ts`,
`src/config/logger.ts`, `src/api/client.ts`, `src/api/endpoints.ts`,
`src/api/services/products.ts`, `src/lib/ApiError.ts`,
`src/api/interceptors/{logging,errorNormalizer,index}.js`.

Also new: `.env.development`, `.env.staging`, `.env.production`, `.env.example`.
Same keys, different values. (This repo git-ignores `.env`, so per-mode files
carry the base URL.)

## What you build

Search for `TODO(lab-` — eleven markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/config/env.ts` — validated, frozen config |
| `lab-1.2` | `src/config/logger.ts` — level-gated logging |
| `lab-2.1` | `src/api/client.ts` — instances from config |
| `lab-2.2` | `src/api/endpoints.ts` — every URL, as functions |
| `lab-3.1` | `src/api/services/products.ts` — return data, not responses |
| `lab-3.2` | `src/App.tsx` — call the service |
| `lab-4.1` | `src/lib/ApiError.ts` — the one error type |
| `lab-4.2`, `4.3` | `src/api/interceptors/logging.ts`, `errorNormalizer.ts` |
| `lab-4.4` | `src/api/interceptors/index.ts`, `src/main.tsx` — install, in order |
| `lab-4.5` | `src/components/ErrorNotice.tsx` — read the `ApiError` |

Nothing on screen changes in this demo. That's the point.

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../07-search-filters-and-pagination/starter`](../../07-search-filters-and-pagination/starter).

## Commands

```bash
npm run dev · npm run dev:staging · npm run typecheck · npm run build · npm run build:staging · npm run lint
```

Node 22.22+.
