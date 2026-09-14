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
