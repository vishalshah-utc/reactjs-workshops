# ShopCrew — Session 3 starter

```bash
npm install
npm run dev
```

**Two** processes start:

```
[api]   ShopCrew API · http://localhost:4000
[web]   VITE ready   · http://localhost:5173
```

Open **5173**. Vite proxies `/api` to the API, so the app fetches
`/api/products` with no host and no CORS.

**Your instructions are in [the session guide](../README.md).**

## ⚠️ Don't re-click the starter link

Each `/fork/` click creates a **fresh copy** — it does not reopen your work.
Bookmark the `stackblitz.com/edit/…` URL once it loads. Nothing is created on
GitHub.

## New this session: `server/`

The whole ShopCrew backend now ships with the app — 5,000 products, 12,000
orders, real search and filtering. It is a synced copy of the repo's `api/`
directory; **do not edit it**, your changes will be overwritten.

Its dependencies (`express`, `ws`, `multer`) live in the app's `package.json`
so one `npm install` covers both.

Read [`server/README.md`](./server/README.md) for the endpoint list.

### Teaching hooks — you will use these constantly

| Add to any `/api` URL | Effect |
|---|---|
| `?_delay=2000` | respond after 2 seconds |
| `?_fail=500` | force a server error |
| `?_fail=422` | force per-field validation errors |
| `/api/flaky?rate=0.4` | fails ~40% of the time |

They also work on the app itself — `http://localhost:5173/?_delay=3000`.

## What you build

Search for `TODO(lab-` — seven markers.

| Marker | File |
|---|---|
| `lab-1.1` | `src/hooks/useProducts.ts` — the `empty` state |
| `lab-1.2` | `src/components/ProductBoard.tsx`, `src/App.tsx` — split error from empty |
| `lab-2.2` | `src/hooks/useDebounce.ts` — the missing cleanup |
| `lab-2.3` | `src/App.tsx` — cancel the categories request |
| `lab-3.1` | `src/hooks/useProducts.ts` — `AbortController` |
| `lab-4.1` | `src/hooks/useLocalStorage.ts` — persistence |
| `lab-4.2` | `src/hooks/useOnlineStatus.ts` — subscribe and clean up |

**The app runs from the first minute**, and several of these are *bugs you can
watch happen* before you fix them. Open the network tab early.

Lab 2 also has you deliberately break one working line for sixty seconds, to
watch an infinite fetch loop happen and then undo it. That one is not a TODO —
the code is correct as shipped.

## Already done

`src/lib/api.ts` (read it — it is where `response.ok` is checked),
`ErrorState`, `EmptyState`, `ProductGridSkeleton`, and everything from
Sessions 1–2.

## Stuck?

Ask your trainer. The solution lands in this repo right after the session.

## Commands

```bash
npm run dev         # both processes
npm run dev:web     # just Vite
npm run dev:api     # just the API
npm run typecheck
npm run lint
```
