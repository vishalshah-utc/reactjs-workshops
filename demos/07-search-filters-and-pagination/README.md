# Demo 7 — Search, Filters & Pagination against the API

**Demo guide** · ~110 minutes · the 194-product download goes away

---

## Where you are starting from

The starter is **Demo 6, finished**: a layered API module — validated config,
axios instances, an endpoint registry, a service layer, `ApiError`, and two
interceptors. The UI still downloads all 194 products once and filters them
in the browser.

New stubs: `src/hooks/useDebouncedValue.ts`, `src/components/Pager.tsx`,
`src/components/ProductDetail.tsx`.

## What you ship today

Search, category and sort that run **on the server**, debounced so typing
"laptop" is one request rather than six; categories loaded in a separate
request with their own lifetime; twelve products per page with a pager; and a
detail drawer that fetches the full record when you click a card.

By the end you will be able to answer, without hesitating:

- Why you never build a query string with template literals, and what axios does with `undefined` params
- What debouncing is, why it's a `useEffect` cleanup, and why it *complements* cancellation rather than replacing it
- When two requests should share an effect and when they need their own
- Why "reset to page 1 when filters change" is a rule, and why it does **not** need a `useEffect`
- How to fetch-on-select without conditionally calling a hook

---

## Before the demo (5 minutes)

```
https://stackblitz.com/fork/github/vishalshah-utc/reactjs-workshops/tree/main/demos/07-search-filters-and-pagination/starter
```

> ⚠️ Click once, bookmark the `stackblitz.com/edit/…` URL.

Locally: `cd demos/07-search-filters-and-pagination/starter && npm install && npm run dev`.

Have these open in tabs — you'll compare against them:

- `https://dummyjson.com/products/search?q=phone&limit=3&select=title,price`
- `https://dummyjson.com/products/category/beauty?limit=3&select=title`
- `https://dummyjson.com/products?limit=3&skip=3&sortBy=price&order=desc&select=title,price`
- `https://dummyjson.com/products/categories`

---

## The cold open

Open the Network tab and reload. One request, **~60 KB**, 194 products. The
catalogue is small enough to get away with it — today.

Now imagine 50,000 products. Or 194 with images inlined. The browser cannot
download the whole catalogue to show twelve cards, and no real API lets it.
The search box, the category pills, the sort dropdown: **all of it has to move
to the server.** The UI won't look any different. Everything underneath it
changes.

---

## Lab 1 — Query params and debouncing (30 min)

### Problem

Every filter is applied in the browser to a list that's already downloaded.
Move filtering to the server and three things become true at once: the URL
needs a query string, typing a letter would fire a request, and two requests
can be in flight with the older one landing last.

### Concept

**Never build query strings by hand.**

```ts
// ✗ Breaks the moment a value contains a space, &, or #
api.get(`/products/search?q=${query}&limit=${limit}`);

// ✓ axios encodes each value correctly
api.get('/products/search', { params: { q: query, limit } });
```

`q = "t-shirt & jeans"` becomes `q=t-shirt%20%26%20jeans`. With a template
literal it becomes a broken URL with a phantom second parameter.

**`undefined` params are dropped; `null` and `""` are not.**

```ts
{ params: { limit: 12, sortBy: undefined } }   // → ?limit=12
{ params: { limit: 12, sortBy: '' } }          // → ?limit=12&sortBy=
```

That's a useful default: build the object unconditionally and let `undefined`
prune the empty filters — `sortBy: sortBy || undefined`.

**Debouncing: wait until typing pauses.** A request per keystroke is wasteful
and racy. The hook is ten lines, it's a `useEffect` cleanup, and it's
**generic** — `<T>` means it debounces a string today and a number tomorrow
without a second copy:

```ts
useEffect(() => {
  const id = setTimeout(() => setDebounced(value), delay);
  return () => clearTimeout(id);     // each new value cancels the pending timer
}, [value, delay]);
```

**Debouncing and cancellation are complements, not alternatives.** Debouncing
cuts the *number* of requests. Cancellation protects you from the ones that
still overlap — a user who types, pauses 400 ms, types again has two requests
in flight, and only the `AbortController` from Demo 5 stops the first one
from landing last.

### Steps

**A. `src/hooks/useDebouncedValue.ts` — `TODO(lab-1.1)`**

```ts
import { useEffect, useState } from 'react';

/** Generic: whatever type goes in comes out. `useDebouncedValue('x')` is a string, `useDebouncedValue(3)` a number. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
```

**B. `src/api/services/products.ts` — `TODO(lab-1.2)`** — one function, three
endpoints:

```ts
export interface ListProductsOptions extends RequestOptions {
  q?: string;
  category?: string;
  sortBy?: 'price' | 'rating' | '';
  order?: 'asc' | 'desc';
  /** 0-based. */
  page?: number;
  limit?: number;
}

export async function listProducts({
  q = '',
  category = '',
  sortBy = '',
  order = 'asc',
  page = 0,
  limit = 12,
  signal,
}: ListProductsOptions = {}): Promise<ProductListResponse> {
  // `| undefined` in the value type is the point: undefined params are DROPPED by axios
  const params: Record<string, string | number | undefined> = {
    limit,
    skip: page * limit,
    select: LIST_FIELDS,
    sortBy: sortBy || undefined,          // dropped when empty
    order: sortBy ? order : undefined,
  };

  let url = endpoints.products.list();
  if (q) {
    url = endpoints.products.search();
    params.q = q;
  } else if (category) {
    url = endpoints.products.byCategory(category);
  }

  const { data } = await api.get<ProductListResponse>(url, { params, signal });
  return data;
}
```

Search wins over category when both are given — a rule that lives in *one*
place, here, and that the UI will mirror in step C.

**C. `src/App.tsx` — `TODO(lab-1.3)`**

Four pieces of state — `query`, `sort`, `activeCategory`, and (in Lab 3)
`page` — always change *together* and are always sent *together*. Four
`useState`s let them disagree. One object can't:

```tsx
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { parseSort, PLACEHOLDER_THUMBNAIL, type SortKey } from './lib/catalog';

/** Everything the server needs to know about what the user is looking at. */
interface Filters {
  query: string;
  sort: SortKey;
  category: string;
}

const INITIAL_FILTERS: Filters = { query: '', sort: '', category: 'all' };   // above the component
// …
const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
const debouncedQuery = useDebouncedValue(filters.query, 400);

/** Change any filter. Partial<Filters>: pass only what changed. One function, so Lab 3 can add one rule to it. */
function updateFilters(patch: Partial<Filters>) {
  setFilters((current) => ({ ...current, ...patch }));
}
```

Delete the separate `query`, `sort` and `activeCategory` states. Replace the
product state with a full result envelope:

```tsx
const [result, setResult] = useState<ProductListResponse | null>(null);   // the whole envelope, or nothing yet
```

Rewrite the effect to send everything to the server:

```tsx
useEffect(() => {
  const controller = new AbortController();
  const { sortBy, order } = parseSort(filters.sort);   // SortKey → { sortBy: 'price' | 'rating' | ''; order: 'asc' | 'desc' }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listProducts({
        q: debouncedQuery,
        category: filters.category === 'all' ? '' : filters.category,
        sortBy,
        order,
        signal: controller.signal,
      });
      setResult(data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(ApiError.from(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  load();
  return () => controller.abort();
}, [debouncedQuery, filters.category, filters.sort, reloadKey]);
```

The dependency array is the contract: **when any of these change, fetch
again.** Note it depends on `debouncedQuery`, not `filters.query` — the input
updates instantly, the network sees the settled value.

Derive what the page renders, and delete the client-side helpers:

```tsx
const products = result?.products ?? [];
const total = result?.total ?? 0;
```

Delete the `filterProducts`/`applySort`/`buildCategories` imports and the
`visibleProducts` line. In `lib/catalog.ts`, delete those three functions and
add a small typed helper in their place — the server wants `sortBy` and `order`
as two params, and a `SortKey` is one string:

```ts
/** Split a SortKey into what the API wants. '' → no sort. */
export function parseSort(sort: SortKey): { sortBy: 'price' | 'rating' | ''; order: 'asc' | 'desc' } {
  if (!sort) return { sortBy: '', order: 'asc' };
  const [sortBy, order] = sort.split('-') as ['price' | 'rating', 'asc' | 'desc'];
  return { sortBy, order };
}
```

Keep `SortKey` and `PLACEHOLDER_THUMBNAIL`. Update `handleCreate`/`handleDelete` to update
`result.products` instead of `products`:

```tsx
setResult((current) => (current ? { ...current, products: [created, ...current.products] } : current));
// and
setResult((current) =>
  current ? { ...current, products: current.products.filter((p) => p.id !== product.id) } : current,
);
```

Wire the controls through `updateFilters`. Because search wins over category
in the service, a pill click also clears the query so the pill visibly takes
effect:

```tsx
<ProductToolbar
  query={filters.query}
  onQueryChange={(query) => updateFilters({ query })}
  sort={filters.sort}
  onSortChange={(sort) => updateFilters({ sort })}
  resultCount={total}
/>

<CategoryStrip
  categories={categories}
  activeId={filters.category}
  onSelect={(category) => updateFilters({ category, query: '' })}
/>
```

(`categories` is still the derived list for now; Lab 2 replaces it.)

### Verify

Open the Network tab. Type **laptop** quickly. **One request**, not six —
`search?q=laptop&…` — 400 ms after your last keystroke. Pick **Price: high to
low** — a request with `sortBy=price&order=desc`, and the first card is the
most expensive laptop. Clear the search, click a category pill — a request to
`/products/category/<slug>`.

Now throttle to **Slow 3G** and type slowly, a letter every second. Requests
appear and get marked **(canceled)** as each newer one supersedes it. That's
the `AbortController` from Demo 5, now doing the job debouncing can't.

### Watch out

**Depending on `query` instead of `debouncedQuery`.** Everything works; the
debounce just silently does nothing. Check the Network tab, not the screen.

**`params.q = q` even when empty.** `q=` on the *search* endpoint returns
everything, which looks fine and is a different endpoint than you meant. Pick
the URL *because* `q` is non-empty.

**Building `sortBy` and `order` inside the effect but forgetting `sort` in
the deps.** The lint rule catches it. Don't disable the lint rule.

### Challenge (2 min)

The `limit` default is `12` in the service and there's a `VITE_PAGE_SIZE` in
`.env.*` if you did Demo 6's challenge. Wire `env.pageSize` through — where
does the *default* belong, the service or the caller? Argue it in one line.

### In the real world

Server-side filtering is the point at which the "list" in your app stops being
*data you have* and becomes *a view of data you don't*. Every list you build
from now on will look like this: a query object, a request, a page of results,
a total. Get the shape right once and you'll reuse it for years.

---

## Lab 2 — Two requests, two lifetimes (20 min)

### Problem

The category strip is derived from `products` — so it only shows the
categories on the *current page*. Filter to "beauty" and the strip shrinks to
one pill. Categories need their own request to `GET /products/categories`.

### Concept

**Requests that don't depend on each other should not wait for each other.**
`Promise.all` runs them concurrently:

```ts
const [products, categories] = await Promise.all([listProducts(…), listCategories(…)]);
```

**But sharing an effect means sharing a lifetime.** Put categories in the
product effect and they re-fetch on every keystroke. They change roughly
never; the product page changes constantly. **Different change frequency →
different effect.** Each gets its own `AbortController`, its own error
handling, and — this is a design decision — its own *importance*.

**Not every failure deserves the same treatment.** A failed product list is a
broken page — show it loudly. A failed category list costs the user a filter
strip — log it and move on. Deciding which is which is product design, not
engineering.

### Steps

**A. `src/components/CategoryStrip.tsx` — `TODO(lab-2.2)`**

The API's category list has no counts. Make the badge optional:

```tsx
{category.count != null && (
  <Badge bg="secondary" pill className="ms-1">
    {category.count}
  </Badge>
)}
```

**B. `src/App.tsx` — `TODO(lab-2.1)`**

```tsx
import { listCategories, listProducts } from './api/services/products';
import { logger } from './config/logger';
import { ApiError } from './lib/ApiError';
import type { CategoryOption, Density, Product, ProductDraft, ProductListResponse } from './types';
// …
const [categories, setCategories] = useState<CategoryOption[]>([]);

useEffect(() => {
  const controller = new AbortController();

  listCategories({ signal: controller.signal })
    // ApiCategory { slug, name, url } → CategoryOption { id, name }: the translation the UI wants
    .then((list) => setCategories(list.map((c) => ({ id: c.slug, name: c.name }))))
    .catch((err: unknown) => {
      if (axios.isCancel(err)) return;
      // Deliberately NOT surfaced: the app is fully usable without the strip.
      logger.warn('Category list unavailable', ApiError.from(err).message);
    });

  return () => controller.abort();
}, []);
```

`[]` — once. `.map((c) => ({ id: c.slug, name: c.name }))` is the service-layer
*translation* idea leaking into the component; the Challenge asks you to move
it.

### Verify

Reload with the Network tab open. **Two requests start at the same instant**
— `products?…` and `products/categories`. The strip shows all 24 categories,
and stays that way while you filter. Type in the search box: the products
request re-fires; the categories request does **not**.

Break `endpoints.products.categories` (→ `'/categoriez'`). The strip is empty,
a `[warn]` line appears in the console, and the app works fine. Fix it.

### Watch out

**Putting `listCategories` inside the product effect.** Watch the Network tab:
categories re-fetch on every keystroke. Different lifetimes, different
effects.

**`Promise.all` fails fast.** One rejection rejects everything and you lose
the results that succeeded. When a side widget failing shouldn't blank the
page, either give it its own effect (as here) or use `Promise.allSettled`.

### Challenge (2 min)

Move the `{ id: c.slug, name: c.name }` translation into
`services/products.ts` so `listCategories()` returns the shape the UI wants.
That's what a service layer's translation boundary is *for*.

### In the real world

"Should these two requests be in one effect?" comes up weekly. The test is
*change frequency*: if they refetch for the same reasons, share; if not,
split. Getting this wrong in the shared direction is the source of most
"why is this fetching so much" bugs.

---

## Lab 3 — Pagination (25 min)

### Problem

Twelve products, a `total` of 194, and no way to see the other 182.

### Concept

**Pages are `limit` and `skip`.** Page 0 is `skip=0`; page 3 is
`skip=3*limit`. The API tells you `total`; `Math.ceil(total / limit)` is the
page count. All of this is derived — the only *state* is the page number.

**Filters reset the page.** You're on page 5 of "all products". You type
"laptop". There are 6 laptops — one page. If `page` stays at 5 you request
`skip=60` and get an empty list that looks like "no laptops". **Any filter
change must reset `page` to 0.**

**And that rule does not need an effect.** The tempting version —
`useEffect(() => setPage(0), [query, sort, category])` — is exactly what the
React docs call *"you might not need an effect"*: it reacts to a state change
with another state change, one render late. (The React Hooks lint rule flags
it: `set-state-in-effect`.) Since every filter change already goes through
`updateFilters`, the rule lives there, synchronously, in one line.

**The pager is a controlled component.** It's given `page` and `pageCount`
and reports `onChange(nextPage)`. It owns nothing.

### Steps

**A. `src/App.tsx` — `TODO(lab-3.1)`**

Add `page` to the filters, and the reset rule to `updateFilters`:

```tsx
import { env } from './config/env';
import { Pager } from './components/Pager';

const PAGE_SIZE = env.pageSize;                                    // above the component
// …
interface Filters {
  query: string;
  sort: SortKey;
  category: string;
  /** 0-based. */
  page: number;                                                    // ← NEW
}

const INITIAL_FILTERS: Filters = { query: '', sort: '', category: 'all', page: 0 };
// …
/**
 * A filter change invalidates the current page, so `page` goes back to 0 —
 * unless the patch IS a page change, which overrides it (spread order).
 */
function updateFilters(patch: Partial<Filters>) {
  setFilters((current) => ({ ...current, page: 0, ...patch }));
}
```

Read the spread order carefully: `page: 0` is applied, then `...patch`. A
patch of `{ query: 'laptop' }` leaves `page` at 0. A patch of `{ page: 3 }`
overrides it to 3. One line, and it can't be forgotten for a filter you add
next year.

Add `page` and `limit` to the `listProducts` call and `filters.page` to the
deps:

```tsx
const data = await listProducts({
  q: debouncedQuery,
  category: filters.category === 'all' ? '' : filters.category,
  sortBy,
  order,
  page: filters.page,
  limit: PAGE_SIZE,
  signal: controller.signal,
});
// …
}, [debouncedQuery, filters.category, filters.sort, filters.page, reloadKey]);
```

Derive the count and render the pager after the grid:

```tsx
const pageCount = Math.ceil(total / PAGE_SIZE);
// …
<Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page })} />
```

Also change `<CardSkeletons count={12} />` to `count={PAGE_SIZE}` so the
skeleton grid is the same size as the real one.

If you skipped Demo 6's challenge, add `pageSize: asNumber('VITE_PAGE_SIZE', 12)`
to `env.ts` and `VITE_PAGE_SIZE=12` to each `.env.*` file now.

**B. `src/components/Pager.tsx` — `TODO(lab-3.2)`**

```tsx
import { Pagination } from 'react-bootstrap';

interface PagerProps {
  /** 0-based, like `skip`. Displayed 1-based, like humans. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pager({ page, pageCount, onChange }: PagerProps) {
  if (pageCount <= 1) return null;

  return (
    <Pagination className="justify-content-center mt-4 mb-0">
      <Pagination.Prev disabled={page === 0} onClick={() => onChange(page - 1)} />
      <Pagination.Item disabled>
        Page {page + 1} of {pageCount}
      </Pagination.Item>
      <Pagination.Next disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)} />
    </Pagination>
  );
}
```

`page + 1` — humans count from one, `skip` counts from zero. Off-by-one bugs
live here; this is exactly the arithmetic worth a unit test.

### Verify

**Page 1 of 17.** Click Next — a request with `skip=12`, different products.
Go to page 5, then type "phone": the request has `skip=0` and you're on page
1 of the results. Pick a category with fewer than 12 products — the pager
disappears entirely.

### Watch out

**Forgetting `page: 0` in `updateFilters`.** Page 5 + a narrow filter = an
empty grid that looks like "no results". Users don't report this as "the page
didn't reset"; they report "search is broken".

**`skip: page * limit` with a 1-based `page`.** Page 1 skips 12 and you never
see the first twelve products. Keep `page` 0-based internally; add one for
display only.

**Resetting the page in each handler separately** — `onQueryChange`,
`onSortChange`, `onSelect` — instead of in `updateFilters`. Works today;
the fourth filter you add next quarter forgets it. One function, one rule.

### Challenge (2 min)

Turn the pager into "Load more": keep `page` but *append* to
`result.products` instead of replacing. What has to change in the effect? And
what breaks when the user then types a new search? (Hint: resetting `page`
isn't enough any more — what else has to reset?)

### In the real world

Every list API on earth exposes pagination as either offset (`skip`/`limit`,
as here) or a cursor (`after=eyJpZCI…`). The state and derivation you just
wrote are identical for both; only the request parameter differs. Learn it
once.

---

## Lab 4 — Fetch on select: the detail drawer (25 min)

### Problem

Cards show ten fields. The full record has twenty-two — images, reviews,
warranty, shipping, return policy. Clicking a card should show them — which
means a second request for a record you only partially have.

### Concept

**Fetch-on-select is the same effect, keyed on an id.** Same three states,
same `AbortController`, same `isCancel`. The only new idea is the guard:

```ts
useEffect(() => {
  if (id === null) return;         // nothing selected — don't fetch
  // …
  return () => controller.abort();
}, [id]);
```

**That early `return` is how you express "conditionally fetch" without
conditionally calling a hook.** The rules of hooks say `useEffect` must run on
every render; the *body* can bail out immediately. `if (id) useEffect(…)` is a
bug; `useEffect(() => { if (!id) return; … })` is the idiom.

**Clear the previous result before fetching the next.** Without
`setProduct(null)` you'd briefly show product A's description under product
B's title while B loads. Users notice.

**React Bootstrap's `Offcanvas`** handles the slide-in, the backdrop, focus
trapping, Escape-to-close and body-scroll locking. Render it unconditionally
and drive it with `show` — unmounting it would skip the slide-out animation.

### Steps

**A. `src/components/ProductDetail.tsx` — `TODO(lab-4.1)`**

```tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge, Offcanvas, Placeholder, Ratio, Stack } from 'react-bootstrap';
import { getProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import type { Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';
import { ErrorNotice } from './ErrorNotice';

interface ProductDetailProps {
  /** null = nothing selected, drawer closed. */
  id: number | null;
  onClose: () => void;
}

export function ProductDetail({ id, onClose }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (id === null) return;

    const controller = new AbortController();

    // `id` is `number | null` outside; passing it in as a parameter keeps it a plain `number` in here
    async function load(productId: number) {
      try {
        setLoading(true);
        setError(null);
        setProduct(null);                 // never show the PREVIOUS product under the new title
        setProduct(await getProduct(productId, { signal: controller.signal }));
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load(id);
    return () => controller.abort();
  }, [id]);

  return (
    <Offcanvas show={id !== null} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">{product?.title ?? `Product #${id}`}</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {loading && (
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} style={{ height: 200 }} className="mb-3 rounded" />
            <Placeholder xs={8} /> <Placeholder xs={5} /> <Placeholder xs={12} /> <Placeholder xs={10} />
          </Placeholder>
        )}

        <ErrorNotice error={error} />

        {product && !loading && (
          <Stack gap={3}>
            <Ratio aspectRatio="4x3">
              <img src={product.thumbnail} alt="" className="object-fit-contain bg-body-secondary rounded" />
            </Ratio>

            <div className="d-flex justify-content-between align-items-center">
              <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
              <StockBadge stock={product.stock} />
            </div>

            <p className="mb-0">{product.description}</p>

            <div className="d-flex flex-wrap gap-1">
              {product.tags?.map((tag) => (
                <Badge key={tag} bg="light" text="dark" className="border">{tag}</Badge>
              ))}
            </div>

            <dl className="row mb-0 small">
              <dt className="col-5 text-muted fw-normal">Brand</dt>
              <dd className="col-7">{product.brand ?? '—'}</dd>
              <dt className="col-5 text-muted fw-normal">Category</dt>
              <dd className="col-7 text-capitalize">{product.category}</dd>
              <dt className="col-5 text-muted fw-normal">Rating</dt>
              <dd className="col-7">★ {product.rating}</dd>
              <dt className="col-5 text-muted fw-normal">SKU</dt>
              <dd className="col-7 font-monospace">{product.sku}</dd>
              <dt className="col-5 text-muted fw-normal">Warranty</dt>
              <dd className="col-7">{product.warrantyInformation}</dd>
              <dt className="col-5 text-muted fw-normal">Shipping</dt>
              <dd className="col-7">{product.shippingInformation}</dd>
              <dt className="col-5 text-muted fw-normal">Returns</dt>
              <dd className="col-7">{product.returnPolicy}</dd>
            </dl>
          </Stack>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
```

`PriceTag` and `StockBadge` from Demo 1, reused unchanged. That's composition
paying rent.

**B. `src/components/ProductCard.tsx` — `TODO(lab-4.2)`** — add `onSelect`:

```tsx
interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onDelete?: (product: Product) => void;
  onSelect?: (id: number) => void;          // ← NEW
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onDelete, onSelect }: ProductCardProps) {
  // …
  <Card.Img
    // …
    style={{ height: isCompact ? 110 : 160, cursor: onSelect ? 'pointer' : undefined }}
    onClick={() => onSelect?.(product.id)}
  />
  // …
  <Card.Title className={`mb-0 ${isCompact ? 'small text-truncate' : 'fs-6'}`}>
    <button
      type="button"
      className="btn btn-link p-0 text-start text-decoration-none text-reset fw-semibold"
      onClick={() => onSelect?.(product.id)}
    >
      {product.title}
    </button>
  </Card.Title>
```

A real `<button>` for the title, not an `onClick` on a `<div>`: keyboard users
can reach it, screen readers announce it. Bootstrap's `btn-link text-reset`
makes it look like text.

Pass `onSelect` through `ProductGrid` the same way as `onDelete`.

**C. `src/App.tsx` — `TODO(lab-4.3)`**

```tsx
import { ProductDetail } from './components/ProductDetail';
// …
const [selectedId, setSelectedId] = useState<number | null>(null);   // null = drawer closed
// …
<ProductGrid … onSelect={setSelectedId} />
// …after </Container>:
<ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />
```

### Verify

Click a title. A drawer slides in from the right, shows a skeleton, then the
full product — tags, SKU, warranty, returns. **Escape** closes it. Click the
backdrop — closes. Tab through it — focus stays inside.

Throttle to Slow 3G. Click product A, then immediately product B. You see a
skeleton, then **B** — never A's details under B's title. Now comment out
`setProduct(null)` and repeat: A's description flashes under B's heading.
Uncomment it. Then comment out `return () => controller.abort()` and repeat
with the Network tab open: A's request completes *after* B's and — depending
on timing — overwrites it. Uncomment.

### Watch out

**`if (id) { useEffect(…) }`.** Rules of hooks: *"React has detected a change
in the order of Hooks"*. Guard inside the effect, never around it.

**`getProduct(id, …)` straight from the effect.** `id` is `number | null`, and
`getProduct` wants a number — the compiler refuses, even though you checked
`id === null` a few lines up (the check doesn't survive into the inner async
function). Passing it as a *parameter* — `load(id)` — carries the narrowed
`number` in cleanly. That's what the `productId` argument is for.

**`show={id}`** instead of `show={id !== null}`. `Offcanvas` wants a boolean —
and TypeScript says so — but note the *comparison*: `!!id` would be `false`
for a product with id `0`. `id !== null` says exactly what you mean.

**Forgetting `setProduct(null)`.** The drawer shows the *last* product for a
moment on every open. It looks like a caching feature. It's a bug.

### Challenge (2 min)

The drawer re-fetches a product you've already seen. Add a `Map` cache
(`useRef(new Map())`) so the second open of the same id is instant. What
should happen if the product was edited in between? You've just discovered
why cache invalidation is famous.

### In the real world

This drawer is the last time you'll write the three-state effect by hand.
Demo 8 extracts it into a hook; Demo 10 replaces the hook with a route loader.
But you'll *read* this shape in codebases for years — knowing every line of it
is what lets you spot the one that's missing.

---

## Wrap-up — what you can now do

- [x] Send filters as `params`, never as a hand-built string
- [x] Let `undefined` prune empty params
- [x] Debounce input with a `useEffect` cleanup, and explain why cancellation is still needed
- [x] Decide when requests share an effect and when they don't
- [x] Choose loud versus quiet failure per request
- [x] Keep filters that change together in one object, and reset the page in the one place they all pass through
- [x] Paginate with `limit`/`skip` and derive the page count
- [x] Fetch on select with a guarded effect and clear stale results first

**Count the effects in the app now:** three in `App`, one in `ProductDetail`.
Each is ~20 lines of identical ceremony. That's the signal Demo 8 acts on.

## Next demo

**Demo 8 — Mutations & Custom Hooks.** Add, edit and delete become real
requests — `POST`, `PATCH`, `DELETE` — with the five rules that separate a
real form from a demo. Then the four copy-pasted effects collapse into one
`useApi` hook.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A request per keystroke | Effect depends on `query`; use `debouncedQuery`. |
| Search results ignore the category pill | By design — search wins. Clear the query when a pill is clicked. |
| Empty grid after typing a search | Page didn't reset. Check `page: 0` is in `updateFilters`. |
| Never see the first 12 products | `page` is 1-based somewhere. Keep it 0-based; `+1` for display only. |
| Categories re-fetch on every keystroke | They're in the product effect. Give them their own. |
| Strip has one pill | Categories still derived from the current page. Use `listCategories`. |
| Drawer shows the previous product briefly | Missing `setProduct(null)` before the fetch. |
| *"change in the order of Hooks"* | `useEffect` inside an `if`. Move the `if` inside. |
