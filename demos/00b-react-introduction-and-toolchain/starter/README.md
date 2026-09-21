# ShopScope — Session 2 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the session guide](../README.md).** This file is just
how to run it.

## Where you are starting from

**Session 1, finished** — the ShopScope catalogue in plain TypeScript: a
DummyJSON-shaped `Product`, `format.ts`, `catalog.ts` (filter, sort, group,
immutable updates), `fn.ts` (closures, generics), a live `fetch` of 194
products in `api.ts`, and an imperatively rendered grid in `render.ts` +
`main.ts` whose wishlist hearts you keep in sync by hand.

There are **no `TODO(lab-` markers** in this project. Session 2's cold open
edits it (a sort select — and a bug); Session 2's lab does not touch it at all.

## What you build

A **new** project, next to this one: `npm create vite@latest shopscope --
--template react-ts`, then the exact set of changes that turn Vite's template
into Demo 1's starter — pinned `package.json`, strict `tsconfig`, ESLint with
`react-hooks` + `react-refresh`, Bootstrap, `<StrictMode>`, and three files
ported from this project: `src/types.ts`, `src/lib/format.ts`,
`src/data/sampleProducts.ts`.

## Finished version

**Finished version: [`../../01-components-jsx-props/starter`](../../01-components-jsx-props/starter)
(you build it in the lab).** When your `diff -r` against it is empty, you are done.

## Commands

```bash
npm run dev
npm run typecheck   # tsc --noEmit — Vite does NOT typecheck while serving
npm run build       # tsc && vite build
npm run preview
```

Requires Node 22.22+ (`node -v`).
