import type { SortKey } from '@/types';

/**
 * The filter state the toolbar drives.
 *
 * From Session 4 this shape has a second job: it is also what lives in the
 * URL. The two functions at the bottom of this file are the whole translation
 * layer, and keeping them here — rather than inline in a component — is what
 * makes the mapping testable and stops it being duplicated by the next person
 * who needs to build a link.
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

export const SORT_KEYS: SortKey[] = ['featured', 'price-asc', 'price-desc', 'rating', 'name'];

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

// ───────────────────────────────────────────────────────────────────────────
// URL ⇄ filters
//
// The URL is a string map. Our filters are typed. These two functions are the
// border crossing, and everything they do is about ONE fact:
//
//   Anything in a URL is untrusted input.
//
// A user can hand-edit it, a stale bookmark can carry a value you removed
// last sprint, and a search engine will absolutely try `?sort=` with garbage
// in it. `parseFilters` must never return an invalid `ProductFilters`, no
// matter what it is given.
// ───────────────────────────────────────────────────────────────────────────

/**
 * TODO(lab-3.2): read filters OUT of the URL.
 *
 * Turn a URLSearchParams into a fully-valid ProductFilters, falling back to
 * `defaultFilters` for anything missing or invalid.
 *
 *   export function parseFilters(params: URLSearchParams): ProductFilters {
 *     const sort = params.get('sort');
 *     return {
 *       search: params.get('q') ?? defaultFilters.search,
 *       categoryId: params.get('category') ?? defaultFilters.categoryId,
 *       // ↓ the important line: validate against the union, do not cast.
 *       sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : defaultFilters.sort,
 *       inStockOnly: params.get('inStock') === 'true',
 *       onSaleOnly: params.get('onSale') === 'true',
 *     };
 *   }
 *
 * Note what the `sort` line avoids. Writing `params.get('sort') as SortKey`
 * compiles, and is a lie: TypeScript now believes the value is one of five
 * strings while the actual value is whatever was in the address bar. Every
 * `switch` downstream then silently falls through its default. A cast at a
 * system boundary is how untyped data gets laundered into "typed" data —
 * validate instead.
 *
 * Guide, Lab 3 step B.
 */

/**
 * TODO(lab-3.2): write filters INTO the URL.
 *
 *   export function filtersToSearchParams(filters: ProductFilters): URLSearchParams {
 *     const params = new URLSearchParams();
 *     if (filters.search.trim()) params.set('q', filters.search.trim());
 *     if (filters.categoryId !== defaultFilters.categoryId) params.set('category', filters.categoryId);
 *     if (filters.sort !== defaultFilters.sort) params.set('sort', filters.sort);
 *     if (filters.inStockOnly) params.set('inStock', 'true');
 *     if (filters.onSaleOnly) params.set('onSale', 'true');
 *     return params;
 *   }
 *
 * OMIT DEFAULTS. This is the detail that separates a URL people will share
 * from one they will not:
 *
 *   /?q=&category=all&sort=featured&inStock=false&onSale=false     ✗
 *   /?q=laptop&sort=price-asc                                       ✓
 *
 * It is not only cosmetic. A URL that encodes defaults changes whenever a
 * default changes, so every old bookmark starts carrying a value the app no
 * longer means. Absent means "whatever the default is today".
 *
 * Guide, Lab 3 step B.
 */
