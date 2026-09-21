/**
 * Pure functions over the catalogue. No DOM, no fetch, no React — data in,
 * new data out. That is exactly why Session 2's React app can import these
 * unchanged, and why they are trivial to test.
 */
import type { Product } from '../types';

// ------------------------------------------------------------ unions & narrowing

// TODO(lab-2.2): SORT_ORDERS as const → SortOrder; SortKey; Category = Product['category']; parseSortOrder
export type SortOrder = 'asc' | 'desc';
export type Category = string;

export function parseSortOrder(_value: string): SortOrder {
  return 'asc';
}

// TODO(lab-2.3): stockLabel with a literal-union return type; brandLabel with ??; tagLine with ?.
export function stockLabel(_product: Product): string {
  return 'In stock';
}

export function brandLabel(product: Product): string {
  return String(product.brand);
}

// ------------------------------------------------------- shapes & immutability

// TODO(lab-3.1): ProductPreview, ProductPatch, ProductSummary via Pick/Partial/Omit; toPreview and describeProduct with destructuring

// TODO(lab-3.2): the four immutable updates — addProduct, removeProduct, updateProduct, toggleId

// ------------------------------------------------------------- the array toolbox

// TODO(lab-4.1): filterByCategory, searchProducts, sortProducts (copy, THEN sort), cheapest → Product | undefined
export function filterByCategory(products: readonly Product[], _category: Category | 'all'): Product[] {
  return [...products];
}

export function searchProducts(products: readonly Product[], _query: string): Product[] {
  return [...products];
}

// TODO(lab-4.2): groupByCategory with reduce + ??=; categoriesOf with Set; allTags with flatMap; totalStock; byId with Map
export function categoriesOf(_products: readonly Product[]): Category[] {
  return [];
}
