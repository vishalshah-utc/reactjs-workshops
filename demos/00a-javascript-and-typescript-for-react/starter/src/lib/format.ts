/**
 * Small, pure helpers. No React in here — which is exactly why they are easy
 * to test and safe to reuse anywhere.
 */

// TODO(lab-1.1): formatPrice — one Intl.NumberFormat at module scope, and a typed function that uses it
export function formatPrice(amount: number): string {
  return String(amount);
}

// TODO(lab-2.1): discountedPrice — DERIVE the sale price from price + percentage (default 0), rounded to cents
export function discountedPrice(price: number, _discountPercentage = 0): number {
  return price;
}
