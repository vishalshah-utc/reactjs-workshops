# ShopCrew — Session 2 starter

```bash
npm install
npm run dev        # http://localhost:5173
```

**Your instructions are in [the session guide](../README.md).**

## ⚠️ Don't re-click the starter link

Each click of a `/fork/` link creates a **fresh copy** — it does not reopen
your work. Once your project loads the URL becomes `stackblitz.com/edit/…`;
bookmark that and return through the bookmark. Nothing is created on GitHub.

## Where this came from

This is Session 1's finished code plus today's scaffolding. **If you missed
Session 1 you are not behind** — everything from it is already here.

## What you build

Search the project for `TODO(lab-` — ten markers, numbered by lab.

| Marker | File |
|---|---|
| `lab-1.2` | `src/App.tsx` — cart state, added without mutating |
| `lab-2.1` | `src/lib/filters.ts` — search, sort, stock and sale filters |
| `lab-2.2` | `src/components/ProductToolbar.tsx` — controlled sort + checkboxes |
| `lab-2.3` | `src/App.tsx` — lift the filters, derive the visible list |
| `lab-3.1` `lab-3.2` | `src/components/ProductFormDialog.tsx` — controlled fields, validation |
| `lab-3.3` | `src/App.tsx` — create, edit, delete |
| `lab-4.1` | `src/lib/cart.ts` — the reducer |
| `lab-4.2` | `src/App.tsx` — swap `useState` for `useReducer` |
| `lab-4.3` | `src/components/CartSheet.tsx` — wire dispatch |

**The app runs from the first minute.** Every stub is a working minimal
version, and one example of each pattern is done for you — the search input is
controlled, the `name` field is wired, `cart/add` is written. Copy the shape.

## What is already done

Session 1's components, the `ui/` primitives (now with dialog, select,
checkbox, label and table), `lib/pricing.ts`, `BackOfficeProducts`,
`ViewSwitcher`, and all the types in `src/types.ts` — worth reading, the
`CartAction` union is Lab 4's whole design.

## Stuck?

Ask your trainer — they have the finished version of every file. The solution
lands in this repo right after the session.

## Commands

```bash
npm run dev
npm run typecheck   # Vite does NOT typecheck during dev — run this
npm run lint
npm run build
```
