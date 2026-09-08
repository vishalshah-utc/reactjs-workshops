/**
 * Shared domain types.
 *
 * These mirror what `GET /api/products` returns, exactly. Sessions 1–2 import
 * a bundled snapshot; from Session 3 the same objects arrive over the network,
 * and because the type is identical nothing downstream changes.
 */

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  /** Integer, in paise. 129900 = ₹1,299.00 */
  price: number;
  /** The struck-through "was" price, or null when not on sale. */
  compareAtPrice: number | null;
  currency: string;
  /** 0 to 5, one decimal. 0 means "no reviews yet", not "rated zero". */
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  tags: string[];
}

/** How densely the product grid is packed. Session 1 Lab 4 toggles this. */
export type GridDensity = 'comfortable' | 'compact';
