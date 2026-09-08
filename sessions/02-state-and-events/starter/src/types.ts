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

/**
 * The sort options the toolbar offers.
 *
 * A union of string literals, not `string`. TypeScript then rejects
 * `setSort('cheapest')` at compile time, and every `switch` over it is checked
 * for exhaustiveness — add a new option and the compiler shows you every place
 * that needs updating. That is most of the value of typing this at all.
 */
export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name';

export interface SortOption {
  value: SortKey;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'Name A–Z' },
];

/** One line in the cart. Quantity lives here; price is read from the product. */
export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CartState {
  lines: CartLine[];
  /** Uppercase code, or null. Validated against PROMOTIONS. */
  promoCode: string | null;
}

/**
 * Everything the cart can be asked to do.
 *
 * A discriminated union: TypeScript narrows on `type`, so inside
 * `case 'cart/setQuantity'` it knows `action.quantity` exists and that
 * `action.code` does not. Miss a case in the reducer and the compiler says so.
 */
export type CartAction =
  | { type: 'cart/add'; productId: string; quantity?: number }
  | { type: 'cart/remove'; productId: string }
  | { type: 'cart/setQuantity'; productId: string; quantity: number }
  | { type: 'cart/applyPromo'; code: string }
  | { type: 'cart/clearPromo' }
  | { type: 'cart/clear' };

/** A product draft as the Add/Edit form holds it — strings, because inputs
 *  deal in strings. Converted to a Product on submit. */
export interface ProductDraft {
  name: string;
  brandName: string;
  categoryId: string;
  /** Major units as typed by the user, e.g. "1299". Converted to paise. */
  price: string;
  stockQuantity: string;
  tags: string[];
}

export interface ProductDraftErrors {
  name?: string;
  brandName?: string;
  categoryId?: string;
  price?: string;
  stockQuantity?: string;
}

/** Which surface is on screen. Session 4 replaces this with real routing. */
export type View = 'storefront' | 'backoffice';
