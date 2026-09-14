import type { CategoryOption, Product } from '../types';

/**
 * Pure helpers over the product list. No React, no state — just data in,
 * data out. That is what makes them trivially testable.
 */

/** Distinct categories with a count, sorted by name. Derived from the products, never stored. */
export function buildCategories(products: Product[]): CategoryOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, count]) => ({ id, name: id.replace(/-/g, ' '), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface ProductFilter {
  query?: string;
  category?: string;
}

/** Case-insensitive title match + category. Returns a NEW array; `filter` never mutates. */
export function filterProducts(products: Product[], { query = '', category = 'all' }: ProductFilter = {}): Product[] {
  const needle = query.trim().toLowerCase();
  return products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (needle === '' || p.title.toLowerCase().includes(needle)),
  );
}

/** "price-asc" | "price-desc" | "rating-desc" | "" — the sort select's values. */
export type SortKey = '' | 'price-asc' | 'price-desc' | 'rating-desc';

/**
 * Sort WITHOUT mutating. `Array.prototype.sort` sorts in place, so the spread
 * copy is not optional — without it you would reorder the caller's array and
 * "Default order" could never be restored.
 */
export function applySort(products: Product[], sort: SortKey): Product[] {
  if (!sort) return products;
  const [field, direction] = sort.split('-') as ['price' | 'rating', 'asc' | 'desc'];
  const sign = direction === 'desc' ? -1 : 1;
  return [...products].sort((a, b) => (a[field] - b[field]) * sign);
}

/** A neutral thumbnail for products created locally, so the card never shows a broken image. */
export const PLACEHOLDER_THUMBNAIL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6c757d">New product</text></svg>',
  );
