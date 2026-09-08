import type { Product, SortKey } from '@/types';

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

/**
 * TODO(lab-2.1): Filter and sort the catalogue.
 *
 * Right now it only handles `categoryId` and ignores everything else. Add:
 *
 *   search       match against name + brandName + categoryName, case-insensitive
 *   inStockOnly  drop products with stockQuantity === 0
 *   onSaleOnly   keep only products with a compareAtPrice
 *   sort         featured (original order) | price-asc | price-desc | rating | name
 *
 * ⚠️ `Array.prototype.sort` sorts IN PLACE and returns the same array. Sorting
 * `products` directly scrambles the imported module for the life of the page,
 * and "Featured" order never comes back. Copy first: `[...filtered].sort(...)`.
 *
 * Note this is a plain function, not a hook and not state. Call it during
 * render and there is no second copy to go stale. Guide, Lab 2 step A.
 */
export function selectVisibleProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((product) => {
    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) return false;
    return true;
  });
}

/** Category chips, counted from whatever list you hand it. Given to you. */
export function buildCategories(products: Product[]) {
  const counts = new Map<string, { id: string; name: string; count: number }>();
  for (const product of products) {
    const existing = counts.get(product.categoryId);
    if (existing) existing.count += 1;
    else counts.set(product.categoryId, { id: product.categoryId, name: product.categoryName, count: 1 });
  }
  return [{ id: 'all', name: 'All', count: products.length }, ...counts.values()];
}
