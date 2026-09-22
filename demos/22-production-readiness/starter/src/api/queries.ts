import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { parseSort, type SortKey } from '../lib/catalog';
import { env } from '../config/env';
import { getProduct, getProductReviews, listCategories, listProducts, listStock, type ListProductsOptions } from './services/products';
import type { CategoryOption, Product } from '../types';

/**
 * Every query key the app uses, built by ONE factory.
 *
 * A key is the cache's identity: two components asking for `['products',
 * 'detail', '5']` share one entry and one request. Hand-writing keys means one
 * file says `['product', id]` and another says `['products', id]`, and you get
 * two entries, two requests and a cache you cannot invalidate.
 *
 * Keys are HIERARCHICAL and the prefixes are real: invalidating
 * `productKeys.lists()` matches every list regardless of its filters, and
 * `productKeys.all` matches everything about products. `as const` keeps the
 * tuples literal, so a typo in a level is a compile error rather than a miss.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (options: ListProductsOptions) => [...productKeys.lists(), options] as const,
  infinite: (options: ListProductsOptions) => [...productKeys.all, 'infinite', options] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...productKeys.details(), String(id)] as const,
  reviews: (id: number | string) => [...productKeys.detail(id), 'reviews'] as const,
  related: (category: string, id: number | string) => [...productKeys.all, 'related', category, String(id)] as const,
  everything: () => [...productKeys.all, 'everything'] as const,
  stock: () => [...productKeys.all, 'stock'] as const,
  categories: () => ['categories'] as const,
};

/**
 * `queryOptions()` is not decoration. It ties a key to the function that fills
 * it, so the loader that PREFETCHES and the component that READS cannot drift
 * apart — and it carries the types through, so `useQuery(productQuery(id))`
 * knows it returns a `Product` without a single annotation.
 */
export function productQuery(id: number | string) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    // The signal comes from TanStack Query, not the router: it aborts when the
    // last observer of this key goes away. Every service already takes one.
    queryFn: ({ signal }) => getProduct(id, { signal }),
  });
}

/**
 * The reviews for one product — its own key, because it is its own request.
 *
 * `['products','detail','5','reviews']` sits UNDER the detail key, so
 * invalidating `productKeys.detail(5)` after an edit takes the reviews with
 * it. Hierarchy is not decoration; it is what makes one invalidation enough.
 *
 * `staleTime` is generous: reviews are the least volatile thing on the page,
 * and the second visit to a product should not pay the delay again.
 */
export function productReviewsQuery(id: number | string, delayMs = 0) {
  return queryOptions({
    queryKey: productKeys.reviews(id),
    queryFn: ({ signal }) => getProductReviews(id, { signal, delayMs }),
    staleTime: 5 * 60_000,
  });
}

/** The filters that identify a page of the catalogue — and NOTHING else the URL happens to carry. */
export function listOptionsFrom(searchParams: URLSearchParams): ListProductsOptions {
  const { sortBy, order } = parseSort((searchParams.get('sort') ?? '') as SortKey);
  const page = Math.max(0, Number(searchParams.get('page') ?? '1') - 1);
  const category = searchParams.get('category') ?? '';
  return {
    q: searchParams.get('q') ?? '',
    // 'all' is the CategoryStrip's word for "no filter"; the API's word is ''.
    category: category === 'all' ? '' : category,
    sortBy,
    order,
    page,
    limit: env.pageSize,
  };
}

/**
 * One page of the catalogue. The key is the OPTIONS object, not the URL:
 * `?edit=5` opens a modal and must not be a cache miss, and `?category=all`
 * and no category at all are the same request.
 */
export function productListQuery(searchParams: URLSearchParams) {
  const options = listOptionsFrom(searchParams);
  return queryOptions({
    queryKey: productKeys.list(options),
    queryFn: ({ signal }) => listProducts({ ...options, signal }),
  });
}

/** "More in this category" — its own key, because it is its own request with its own lifetime. */
export function relatedQuery(product: Product, limit = 5) {
  return queryOptions({
    queryKey: productKeys.related(product.category, product.id),
    queryFn: ({ signal }) => listProducts({ category: product.category, limit, signal }),
    // The four cards under a product page do not need to be minute-fresh.
    staleTime: 5 * 60_000,
    select: (response) => response.products.filter((p) => p.id !== product.id).slice(0, 4),
  });
}

/** All 194 products in one response — `limit: 0` is DummyJSON for "no limit". */
export function everythingQuery() {
  return queryOptions({
    queryKey: productKeys.everything(),
    queryFn: ({ signal }) => listProducts({ limit: 0, signal }),
    staleTime: 5 * 60_000,
  });
}

/**
 * The category list changes about once a quarter. `staleTime: Infinity` says
 * so: fetched once per page load, never re-fetched, and every loader run after
 * the first is a synchronous cache read.
 */
export function categoriesQuery() {
  return queryOptions({
    queryKey: productKeys.categories(),
    queryFn: ({ signal }) => listCategories({ signal }),
    staleTime: Infinity,
    select: (categories): CategoryOption[] => categories.map((c) => ({ id: c.slug, name: c.name })),
  });
}

/**
 * Stock for every product, polled. `select` narrows 194 rows to ONE number, so
 * a component using it re-renders when its own product's stock changes and not
 * when any of the other 193 do (Demo 18's lesson, applied to a cache).
 */
export function stockQuery() {
  return queryOptions({
    queryKey: productKeys.stock(),
    queryFn: ({ signal }) => listStock({ signal }),
    /** Stock is the one number on the page that is genuinely volatile. Fifteen seconds, and fresh for ten of them. */
    staleTime: 10_000,
    refetchInterval: 15_000,
    /**
     * The flag that makes polling defensible. A hidden tab is a tab nobody is
     * looking at; `false` (the default, spelled out here because it matters)
     * stops the timer until the tab is visible again, and the first thing that
     * happens on return is one catch-up refetch.
     */
    refetchIntervalInBackground: false,
  });
}

/**
 * The same catalogue, paged FORWARD instead of jumped around.
 *
 * `pageParam` is whatever you choose it to be — here a `skip`, because that is
 * what DummyJSON's API takes. `getNextPageParam` receives the LAST page and
 * returns the next param, or `undefined` to say "that was the end"; that
 * `undefined` is what `hasNextPage` reports.
 */
export function productsInfiniteQuery(searchParams: URLSearchParams) {
  const options = listOptionsFrom(searchParams);
  const limit = options.limit ?? env.pageSize;

  return infiniteQueryOptions({
    queryKey: productKeys.infinite({ ...options, page: 0 }),
    queryFn: ({ pageParam, signal }) => listProducts({ ...options, page: pageParam / limit, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.skip + lastPage.products.length;
      return loaded < lastPage.total ? loaded : undefined;
    },
  });
}
