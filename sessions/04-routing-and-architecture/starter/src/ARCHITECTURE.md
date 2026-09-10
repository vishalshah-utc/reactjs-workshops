# How this app is laid out

Read this before Lab 4. It is the map of the codebase you will maintain for
the remaining six sessions.

## Where things are now

```
src/
├── main.tsx              app entry — mounts the router
├── router.tsx            every URL, in one file
├── types.ts              shared domain types
├── routes/               one file per route element
├── components/           EVERYTHING else, flat
│   └── ui/               vendored shadcn/ui primitives
├── hooks/                useDebounce, useLocalStorage, useProducts, …
└── lib/                  api, cart, pricing, filters, utils
```

This is the structure the course has grown into over three sessions, and it
has stopped working. `components/` holds twenty files with nothing to say
whether `ProductToolbar` belongs to the catalogue or the back-office, and
`hooks/` mixes `useDebounce` (generic, reusable anywhere) with `useProducts`
(catalogue-specific, useless elsewhere).

Nobody can answer "what would I delete if we dropped the cart?" from this
layout.

---

## TODO(lab-4.2): move to feature slices

Group by **feature**, not by file type:

```
src/
├── main.tsx
├── router.tsx
├── types.ts
├── routes/                       route elements only — thin
├── features/
│   ├── catalog/
│   │   ├── CategoryStrip.tsx
│   │   ├── ProductBoard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductGridSkeleton.tsx
│   │   ├── ProductImage.tsx
│   │   ├── ProductToolbar.tsx
│   │   ├── PriceTag.tsx
│   │   ├── Rating.tsx
│   │   ├── StockBadge.tsx
│   │   ├── filters.ts
│   │   ├── useProduct.ts
│   │   └── useProducts.ts
│   ├── cart/
│   │   ├── CartSheet.tsx
│   │   ├── cart.ts
│   │   └── pricing.ts
│   └── backoffice/
│       ├── BackOfficeProducts.tsx
│       └── ProductFormDialog.tsx
├── components/                   shared, feature-agnostic
│   ├── ui/                       vendored shadcn primitives
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── PageHeader.tsx
│   ├── RouteFallback.tsx
│   ├── SiteFooter.tsx
│   └── SiteHeader.tsx
├── hooks/                        genuinely generic only
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useOnlineStatus.ts
└── lib/                          framework-agnostic
    ├── api.ts
    └── utils.ts
```

**The test for `components/` vs `features/`:** could this component appear in a
completely different product? `<EmptyState>` could. `<ProductToolbar>` could
not — it knows what a product filter is.

**The test for `hooks/` vs a feature:** `useDebounce` debounces any value.
`useProducts` fetches products. Only the first is generic.

### Doing the move

`@/` aliases mean most imports do not change at all — `@/lib/api` is the same
string wherever the importing file lives. That is the payoff for having used
the alias since Session 1: a refactor of this size is mostly `git mv` plus
fixing the paths that genuinely moved.

Move the files, then let TypeScript find the breakage:

```bash
npm run typecheck
```

### Then enforce the boundary

A layout is a convention until a tool enforces it. Add this to
`eslint.config.js`, in a new block after the existing ones:

```js
{
  files: ['src/components/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@/features/*', '@/routes/*'],
        message:
          'Shared code must not import from a feature. If it needs feature ' +
          'knowledge it is not shared — move it into that feature.',
      }],
    }],
  },
},
```

Dependencies now point one way: `routes/` → `features/` → `components/`,
`hooks/`, `lib/`. The moment a shared `Button` imports from
`features/cart/`, "shared" has stopped being true — and now the build says so
instead of a reviewer having to notice.

Verify it works by adding a deliberately bad import to `components/EmptyState.tsx`:

```ts
import { cartReducer } from '@/features/cart/cart';   // should now be an error
```

Run `npm run lint`, see it fail, then delete the line.

Guide, Lab 4 steps A and B.
