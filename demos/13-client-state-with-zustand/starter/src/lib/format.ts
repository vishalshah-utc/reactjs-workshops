/**
 * Small, pure helpers. No React in here — which is exactly why they are easy
 * to test and safe to reuse anywhere.
 */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 9.99 → "$9.99". Never format money with string concatenation. */
export function formatPrice(amount: number): string {
  return usd.format(amount);
}

/** DummyJSON gives a list price and a percentage; the sale price is DERIVED. */
export function discountedPrice(price: number, discountPercentage = 0): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}
