# ShopScope — Session 1 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the session guide](../README.md).** This file is just
how to run it.

## Where you are starting from

A Vite **vanilla-ts** project — no React, no Bootstrap, two dev dependencies.
`src/types.ts` (the DummyJSON-shaped `Product`), `src/data/sampleProducts.ts`
(three products) and `createCard` in `src/render.ts` are written for you.
Everything else in `src/lib/`, `src/api.ts`, `src/render.ts` and `src/main.ts`
is a stub that compiles and does nothing useful yet.

## What you build

Search the project for `TODO(lab-` — there are nineteen, numbered by lab.

| Marker | File |
|---|---|
| `lab-1.1`, `2.1` | `src/lib/format.ts` — `formatPrice`, `discountedPrice` |
| `lab-1.2` | `src/types.ts` — read `Product`, prove the type is load-bearing |
| `lab-1.3`, `4.3`, `6.4`, `7.2` | `src/main.ts` — each lab replaces the body below the markers |
| `lab-2.2`, `2.3` | `src/lib/catalog.ts` — literal unions, `as const`, `??` / `?.` |
| `lab-3.1`, `3.2` | `src/lib/catalog.ts` — `Pick`/`Partial`/`Omit`, the four immutable updates |
| `lab-4.1`, `4.2` | `src/lib/catalog.ts` — filter, sort, group, `Set`, `Map` |
| `lab-5.1`, `5.2` | `src/lib/fn.ts` — closures, `pluck`, `by`, `debounce` |
| `lab-6.1` … `6.3` | `src/api.ts` — `fetch` DummyJSON, typed promises, the `isApiError` guard |
| `lab-7.1` | `src/render.ts` — the imperative grid and the hearts |

**The app runs from the first minute.** `npm run dev` shows a toolbar that does
nothing yet and one line of text — every stub is a compiling placeholder.

## ⚠️ Don't re-click the starter link

Each click of a `/fork/` link creates a **fresh copy** — it does not reopen
your work. Once your project loads, the URL becomes `stackblitz.com/edit/…`;
bookmark that and return via the bookmark. Nothing is created on GitHub.

## Finished version

The next session's starter **is this session, finished** —
[`../../00b-react-introduction-and-toolchain/starter`](../../00b-react-introduction-and-toolchain/starter).
Diff against it when you're stuck.

## Commands

```bash
npm run dev
npm run typecheck   # tsc --noEmit — Vite does NOT typecheck while serving
npm run build       # tsc && vite build
npm run preview
```

Requires Node 22.22+ (`node -v`).
