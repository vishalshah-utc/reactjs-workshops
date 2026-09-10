# Session 4 — Homework

Two tasks. The first is about reading the URL; the second is about acting on
intent before it becomes a click. Both are real features you would be asked
for on a production storefront.

Budget: 60–90 minutes. Do task 1 first — task 2 assumes it.

---

## 1. Breadcrumbs from the category tree

**Ship:** a breadcrumb trail on the product detail page and on a filtered
listing.

```
Home / Grocery / Beverages / Alder & Co Cold-Pressed 6-Pack
Home / Electronics                         ← on /?category=electronics
```

### What the API gives you

`GET /api/categories` returns a two-level tree:

```json
{ "data": [
  { "id": "grocery", "name": "Grocery", "count": 812,
    "children": [ { "id": "beverages", "name": "Beverages", "count": 143 } ] }
] }
```

And every product carries `categoryId`, `categoryName` and
`parentCategoryId` — check `src/types.ts`.

### Requirements

1. A `<Breadcrumbs />` component in `features/catalog/`.
2. On `/products/:slug`, build the trail from the product's category chain.
   The last crumb is the product name and is **not** a link.
3. On the catalogue with `?category=…` active, show `Home / <Category>`.
4. Every crumb except the last is a `<Link>`, and a category crumb links to
   the **filtered listing** — `/?category=beverages` — not to a category page
   that does not exist.
5. Use a `<nav aria-label="Breadcrumb">` wrapping an `<ol>`, and put
   `aria-current="page"` on the last item. This is a solved accessibility
   pattern; look it up rather than inventing markup.

### Think about

- **Where does the category tree come from?** `CatalogPage` already fetches it.
  Fetching it a second time in `ProductDetailPage` works and is wasteful.
  Options: lift it into `RootLayout` and pass it through the Outlet context,
  or accept the duplicate for now and let Session 5's cache remove it. Both
  are defensible — **write down which you chose and why**, and be ready to say
  it out loud. That reasoning is the actual exercise.
- **What renders while the tree is loading?** A breadcrumb that pops in after
  the page causes a layout shift. Reserve the space, or render the crumbs you
  already know from the product itself.

### Stretch

Add JSON-LD `BreadcrumbList` structured data to the detail page. It is what
makes Google show the trail under your search result — and it is a good
reminder of what a client-rendered app cannot do for SEO, which Session 4's
notes on CSR set up and a framework fixes.

---

## 2. Prefetch on hover

**Ship:** hovering a product card starts fetching that product, so the detail
page is instant on click.

### Why this works

A user's pointer arrives on a link roughly 100–300ms before the click lands.
That is enough time to have the request in flight. Done well, the page appears
to open with no loading state at all.

### Requirements

1. A `usePrefetch` hook, or a `prefetchProduct(slug)` function in
   `features/catalog/`.
2. Fire it on `onMouseEnter` **and** `onFocus` — keyboard users get the same
   benefit, and forgetting `onFocus` is the standard version of this bug.
3. **Cache the result** so the detail page uses it instead of refetching. A
   module-level `Map<string, Promise<Product>>` is enough:

   ```ts
   const cache = new Map<string, Promise<{ data: Product }>>();

   export function prefetchProduct(slug: string) {
     if (!cache.has(slug)) cache.set(slug, getProduct(slug));
     return cache.get(slug)!;
   }
   ```

4. `useProduct` should check the cache before starting a new request.
5. **Do not prefetch on touch devices.** `onMouseEnter` fires on tap on some
   mobile browsers, so you would double-fetch on the one connection that can
   least afford it. Guard with `window.matchMedia('(hover: hover)').matches`.

### Think about

- **When does the cache go stale?** Never, in this implementation. A price
  could change and the user would see the old one indefinitely. What would you
  do about it? (Session 5's answer: `staleTime`.)
- **How many requests can a fast mouse trigger?** Drag the pointer across the
  grid and count them in the network tab. Is that acceptable? Would a small
  delay before firing — say 80ms — help?
- **What happens if the user clicks before the prefetch resolves?** It should
  reuse the in-flight promise, not start a second request. The `Map` above
  gives you that for free, which is the reason it stores the *promise* rather
  than the resolved value. Make sure you understand why that matters.

### Stretch

Prefetch the **route chunk** as well as the data:

```jsx
onMouseEnter={() => import('@/routes/ProductDetailPage')}
```

Now both the code and the data are ready before the click. Watch it in the
network tab.

---

## Checking your work

```bash
npm run typecheck
npm run lint
npm run build
```

- Every breadcrumb crumb navigates without a full page reload
- Tab to a product card and confirm the prefetch fires on focus
- Throttle to Slow 3G in devtools and compare click-to-content with and
  without the prefetch
- Reload on a deep URL — `/products/<slug>` — and confirm it still works

## Bring to Session 5

Your answer to "where should the category tree live?" from task 1, and your
count of how many requests a fast mouse triggers in task 2.

Session 5 replaces both your hand-rolled cache and `useProducts` with TanStack
Query. Arriving with these two problems fresh in your mind is what makes that
session land — you will have felt every gap the library exists to fill.
