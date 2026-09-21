import { describe, expect, it } from 'vitest';
import { listOptionsFrom, productKeys, productListQuery, productsInfiniteQuery } from './queries';
import type { ProductListResponse } from '../types';

const params = (search: string) => new URLSearchParams(search);

/**
 * Cache-key hygiene, tested as pure functions — because that is what they are.
 *
 * A wrong key is the most expensive bug in a cached app and the hardest to
 * see: nothing throws, the screen just refetches when it should not, or shows
 * one product's data under another's name.
 */
describe('listOptionsFrom', () => {
  it('reads the filters the catalogue is actually identified by', () => {
    expect(listOptionsFrom(params('?q=mascara&category=beauty&sort=price-desc&page=3'))).toEqual({
      q: 'mascara',
      category: 'beauty',
      sortBy: 'price',
      order: 'desc',
      page: 2, // the URL is 1-based for humans; the API is 0-based
      limit: 12,
    });
  });

  it('IGNORES the params that are about the UI, not about the data', () => {
    // ?edit opens a modal, ?flash shows a toast, ?view switches the grid. None
    // of them changes which twelve products the server would return, so none of
    // them may change the key — or opening a modal refetches the page.
    expect(listOptionsFrom(params('?page=2&edit=5&flash=Saved&view=endless'))).toEqual(listOptionsFrom(params('?page=2')));
  });

  it("treats the strip's 'all' and no category at all as the same request", () => {
    expect(listOptionsFrom(params('?category=all'))).toEqual(listOptionsFrom(params('')));
  });

  it('clamps a nonsense page rather than asking for a negative skip', () => {
    expect(listOptionsFrom(params('?page=0')).page).toBe(0);
    expect(listOptionsFrom(params('?page=-4')).page).toBe(0);
  });

  it('gives two URLs that mean the same thing the same query key', () => {
    // toEqual, not toBe: the keys are different arrays, and TanStack Query
    // hashes them structurally — which is exactly what this asserts.
    expect(productListQuery(params('?category=all&edit=9')).queryKey).toEqual(productListQuery(params('')).queryKey);
  });
});

describe('productKeys', () => {
  it('nests, so one invalidation can cover a whole family', () => {
    expect(productKeys.detail(5)).toEqual(['products', 'detail', '5']);
    // The prefix is real: invalidating ['products'] matches the line above.
    expect(productKeys.detail(5).slice(0, 1)).toEqual([...productKeys.all]);
  });

  it('keys a detail by STRING, so /products/5 and a numeric 5 share one entry', () => {
    expect(productKeys.detail(5)).toEqual(productKeys.detail('5'));
  });
});

describe('productsInfiniteQuery', () => {
  const { getNextPageParam, initialPageParam } = productsInfiniteQuery(params(''));
  const page = (skip: number, count: number, total = 24): ProductListResponse => ({
    products: Array.from({ length: count }, (_, index) => ({ id: skip + index }) as ProductListResponse['products'][number]),
    total,
    skip,
    limit: count,
  });

  it('starts at skip 0', () => {
    expect(initialPageParam).toBe(0);
  });

  it('asks for the next skip while there is more', () => {
    expect(getNextPageParam(page(0, 12), [page(0, 12)], 0, [0])).toBe(12);
  });

  it('returns undefined on the last page — which is what hasNextPage reads', () => {
    expect(getNextPageParam(page(12, 12), [], 12, [])).toBeUndefined();
  });

  it('stops on a short final page, not only on an exact multiple', () => {
    // It counts skip + received, not pages: a final page of eight ends the list
    // when 24 of 24 are loaded, and does not when 20 of 30 are. The off-by-one
    // here is the difference between "Load more" that never ends and one that
    // stops four products early.
    expect(getNextPageParam(page(16, 8, 24), [], 16, [])).toBeUndefined();
    expect(getNextPageParam(page(12, 8, 30), [], 12, [])).toBe(20);
  });

  it('drops the page number from the key: the infinite list is ONE entry', () => {
    expect(productsInfiniteQuery(params('?page=4')).queryKey).toEqual(productsInfiniteQuery(params('?page=1')).queryKey);
  });
});
