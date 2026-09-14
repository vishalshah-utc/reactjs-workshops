import { formatPrice } from '../lib/format';

/**
 * Shows a price. Lab 2.2 teaches it about discounts — as a DERIVED value,
 * computed from `price` and `discountPercentage`, never passed in.
 */
// TODO(lab-2.2): derive the sale price and show the struck-through original + "% off"
export function PriceTag({ price }: { price: number }) {
  return <span className="fw-semibold fs-5">{formatPrice(price)}</span>;
}
