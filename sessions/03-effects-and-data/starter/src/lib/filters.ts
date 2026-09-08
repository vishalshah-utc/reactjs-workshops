import type { SortKey } from '@/types';

/**
 * The filter state the toolbar drives.
 *
 * Session 2 also had a `selectVisibleProducts` here that did the filtering in
 * the browser. It is gone: the server filters now. That is not just tidier —
 * it is the only thing that works once the catalogue is 5,000 products and
 * arrives one page at a time. You cannot filter what you have not downloaded.
 *
 * What is left is the shape of the query, and the mapping from that shape to
 * API parameters.
 */
export interface ProductFilters {
  search: string;
  categoryId: string;
  sort: SortKey;
  inStockOnly: boolean;
  onSaleOnly: boolean;
}

export const defaultFilters: ProductFilters = {
  search: '',
  categoryId: 'all',
  sort: 'featured',
  inStockOnly: false,
  onSaleOnly: false,
};

/** The API's sort vocabulary differs from ours. One place to map it. */
const SORT_TO_API: Record<SortKey, string | undefined> = {
  featured: 'reviewCount:desc',
  'price-asc': 'price:asc',
  'price-desc': 'price:desc',
  rating: 'rating:desc',
  name: 'name:asc',
};

/**
 * Turn UI filter state into an API query.
 *
 * Keeping this as a plain function — rather than building the query inline in
 * a component — means the mapping is testable, and Session 4 can reuse it when
 * the same values start living in the URL.
 */
export function toProductQuery(filters: ProductFilters, limit = 24) {
  return {
    q: filters.search.trim() || undefined,
    category: filters.categoryId === 'all' ? undefined : filters.categoryId,
    sort: SORT_TO_API[filters.sort],
    inStock: filters.inStockOnly || undefined,
    onSale: filters.onSaleOnly || undefined,
    limit,
  };
}

/** True when anything differs from the defaults. Derived, never stored. */
export function isFiltered(filters: ProductFilters) {
  return (
    filters.search !== defaultFilters.search ||
    filters.categoryId !== defaultFilters.categoryId ||
    filters.sort !== defaultFilters.sort ||
    filters.inStockOnly !== defaultFilters.inStockOnly ||
    filters.onSaleOnly !== defaultFilters.onSaleOnly
  );
}
