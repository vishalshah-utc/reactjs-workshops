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

/**
 * What the cart stores about a product it holds.
 *
 * A SNAPSHOT, copied at the moment of adding — not a lookup.
 *
 * Two reasons, and the second is the real one:
 *
 *  1. The catalogue now lives on the server and arrives one page at a time.
 *     A cart line for a product that is not in the current page has nothing
 *     to look up.
 *  2. More importantly, the price a customer agreed to is the price they saw.
 *     If the catalogue price changes while something sits in a cart, the cart
 *     must not silently change with it. Real stores snapshot for exactly this
 *     reason, and Session 5 shows the server doing the same.
 *
 * It also quietly fixes Session 2's ghost line: deleting a product from the
 * back-office can no longer strand a cart entry, because the cart was never
 * depending on the catalogue.
 */
export type CartProductSnapshot = Pick<
  Product,
  'id' | 'slug' | 'name' | 'brandName' | 'price' | 'currency' | 'stockQuantity'
>;

/** One line in the cart. */
export interface CartLine {
  productId: string;
  quantity: number;
  product: CartProductSnapshot;
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
  | { type: 'cart/add'; product: CartProductSnapshot; quantity?: number }
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
