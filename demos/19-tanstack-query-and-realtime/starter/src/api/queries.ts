/**
 * Every query key the app uses, and the options that go with each one.
 *
 * A key is the cache's identity: two components asking for `['products',
 * 'detail', '5']` share one entry and one request. Hand-written keys drift —
 * one file says `['product', id]`, another says `['products', id]` — and you
 * get two entries, two requests and a cache you cannot invalidate. One factory,
 * here, and nowhere else.
 */

// TODO(lab-1.3): grow this into the full hierarchy — lists(), list(options),
// detail(id), related(category, id), everything(), stock(), categories() —
// with `as const` so each level stays a literal tuple.
export const productKeys = {
  all: ['products'] as const,
};

// TODO(lab-1.3): relatedQuery(product) and everythingQuery(), both through
// `queryOptions()`, passing TanStack Query's `signal` to the service.

// TODO(lab-2.1): productQuery(id) — the ONE definition the loader prefetches
// with and the component reads with, so they cannot drift apart.

// TODO(lab-2.3): listOptionsFrom(searchParams), productListQuery(searchParams)
// and categoriesQuery() — the list key is the FILTERS, not the whole URL.

// TODO(lab-5.1): productsInfiniteQuery(searchParams) via `infiniteQueryOptions`,
// with `initialPageParam` and `getNextPageParam` over DummyJSON's skip/limit.

// TODO(lab-6.1): stockQuery() — `refetchInterval`, and
// `refetchIntervalInBackground: false` so a hidden tab stops polling.
