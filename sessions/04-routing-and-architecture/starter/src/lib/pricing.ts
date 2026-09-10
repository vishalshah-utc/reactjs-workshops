import type { CartLine, CartProductSnapshot } from '@/types';

/**
 * Cart maths, client-side — for now.
 *
 * Session 5 deletes this and asks the server for the total instead, and the
 * discussion in between is the point: a client that prices its own order is a
 * client that can be told to price it at zero. Anything a customer could
 * profit from getting wrong belongs on the server.
 *
 * Everything here is integers in paise. Never floats: 0.1 + 0.2 is
 * 0.30000000000000004, and that is a real bug in a real invoice.
 */

export const TAX_RATE = 0.18; // GST
export const FREE_SHIPPING_THRESHOLD = 149_900; // ₹1,499
export const STANDARD_SHIPPING = 4_900; // ₹49

export interface Promotion {
  code: string;
  label: string;
  kind: 'percentage' | 'fixed' | 'free-shipping';
  /** Percent for 'percentage', paise for 'fixed', ignored for 'free-shipping'. */
  value: number;
  minSubtotal: number;
  /** Cap on a percentage discount, in paise. */
  maxDiscount?: number;
}

export const PROMOTIONS: Promotion[] = [
  { code: 'WELCOME10', label: '10% off your order', kind: 'percentage', value: 10, minSubtotal: 99_900, maxDiscount: 200_000 },
  { code: 'FREESHIP', label: 'Free shipping', kind: 'free-shipping', value: 0, minSubtotal: 0 },
  { code: 'FLAT500', label: '₹500 off', kind: 'fixed', value: 50_000, minSubtotal: 499_900 },
];

export function findPromotion(code: string | null): Promotion | null {
  if (!code) return null;
  return PROMOTIONS.find((p) => p.code === code.trim().toUpperCase()) ?? null;
}

export interface CartItem {
  product: CartProductSnapshot;
  quantity: number;
  lineTotal: number;
}

export interface CartTotals {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  promotion: Promotion | null;
  /** Set when a code was entered but does not apply — shown under the input. */
  promoError: string | null;
  amountToFreeShipping: number;
}

/**
 * Turn cart lines into everything the UI needs to render.
 *
 * Note it no longer takes the catalogue. Each line carries its own product
 * snapshot, so the cart is completely independent of what page of the
 * catalogue happens to be loaded — or whether the product still exists.
 *
 * Still not state: computed from `lines` and `promoCode` on every render.
 */
export function calculateCart(lines: CartLine[], promoCode: string | null): CartTotals {
  const items: CartItem[] = lines.map((line) => ({
    product: line.product,
    quantity: line.quantity,
    lineTotal: line.product.price * line.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const promotion = findPromotion(promoCode);

  let discount = 0;
  let promoError: string | null = null;
  let freeShippingFromPromo = false;

  if (promoCode && !promotion) {
    promoError = 'That code is not recognised';
  } else if (promotion) {
    if (subtotal < promotion.minSubtotal) {
      promoError = `Spend ${formatPaise(promotion.minSubtotal)} to use ${promotion.code}`;
    } else if (promotion.kind === 'percentage') {
      discount = Math.min(Math.round((subtotal * promotion.value) / 100), promotion.maxDiscount ?? Infinity);
    } else if (promotion.kind === 'fixed') {
      discount = Math.min(promotion.value, subtotal);
    } else {
      freeShippingFromPromo = true;
    }
  }

  const qualifiesFreeShipping = freeShippingFromPromo || subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = items.length === 0 || qualifiesFreeShipping ? 0 : STANDARD_SHIPPING;

  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discount,
    tax,
    shipping,
    total: taxable + tax + shipping,
    promotion: promoError ? null : promotion,
    promoError,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}

/** Local helper so this file does not depend on the formatting module. */
function formatPaise(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}
