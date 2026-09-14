# ShopScope — Demo 4 starter

```bash
npm install
npm run dev
```

**Your instructions are in [the demo guide](../README.md).**

## Where you are starting from

**Demo 3, finished** — search, sort, wishlist, an add-product dialog with
hand-rolled validation over raw controls, delete with confirmation.

New: `src/components/fields/` (`TextField.tsx` and `Field.tsx` are stubs;
`FieldShell.tsx` and `index.tsx` — a component per input type — are finished),
`src/components/SignupForm.tsx` (stub), `src/lib/validation.ts` (option lists
done; validator and schema are stubs). `react-hook-form`, `zod` and
`@hookform/resolvers` are installed.

## What you build

Search for `TODO(lab-` — nine markers.

| Marker | File |
|---|---|
| `lab-1.1`, `1.2`, `1.3` | `src/components/fields/TextField.tsx` — built from scratch |
| `lab-2.1`, `4.1` | `src/lib/validation.ts` — `validateProduct()`, then `signupSchema` |
| `lab-2.2` | `src/components/ProductForm.tsx` — manual validation on the field library |
| `lab-3.1` | `src/components/fields/Field.tsx` — the react-hook-form bridge |
| `lab-3.2` | `src/components/SignupForm.tsx` — react-hook-form over the same fields |
| `lab-3.3` | `src/components/SiteHeader.tsx` — the Sign up button |

## ⚠️ Don't re-click the starter link

Bookmark the `stackblitz.com/edit/…` URL once it loads.

## Finished version

[`../../05-effects-and-the-network/starter`](../../05-effects-and-the-network/starter).

## Commands

```bash
npm run dev · npm run typecheck · npm run lint · npm run build
```

Node 22.22+.
