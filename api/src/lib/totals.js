/**
 * Cart/order money maths. Server-side, always.
 *
 * Session 2 has participants compute a cart total on the client; Session 5
 * replaces it with this. The discussion in between — "why can the client not
 * be trusted to price its own order?" — is the point.
 *
 * All amounts are integers in minor units (paise).
 */
export const TAX_RATE = 0.18;

export const SHIPPING_METHODS = [
  { id: 'standard', name: 'Standard (4–6 days)', price: 4900, etaDays: 5 },
  { id: 'express', name: 'Express (2 days)', price: 14900, etaDays: 2 },
  { id: 'sameday', name: 'Same day (metro only)', price: 29900, etaDays: 0 },
];

export const FREE_SHIPPING_THRESHOLD = 149900;

/**
 * @returns {{valid: boolean, reason?: string, discount: number, freeShipping: boolean}}
 */
export function evaluatePromotion(promo, { subtotal, categoryIds }) {
  if (!promo) return { valid: false, reason: 'No code applied', discount: 0, freeShipping: false };
  if (!promo.active) return { valid: false, reason: 'This code is no longer active', discount: 0, freeShipping: false };

  const now = Date.now();
  if (promo.startsAt && Date.parse(promo.startsAt) > now) return { valid: false, reason: 'This code is not active yet', discount: 0, freeShipping: false };
  if (promo.endsAt && Date.parse(promo.endsAt) < now) return { valid: false, reason: 'This code has expired', discount: 0, freeShipping: false };
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) return { valid: false, reason: 'This code has been fully redeemed', discount: 0, freeShipping: false };
  if (subtotal < promo.minSubtotal) {
    return { valid: false, reason: `Spend at least ₹${(promo.minSubtotal / 100).toLocaleString('en-IN')} to use this code`, discount: 0, freeShipping: false };
  }
  if (promo.appliesTo?.type === 'CATEGORY' && !categoryIds.includes(promo.appliesTo.categoryId)) {
    return { valid: false, reason: 'This code does not apply to anything in your cart', discount: 0, freeShipping: false };
  }

  if (promo.type === 'FREE_SHIPPING') return { valid: true, discount: 0, freeShipping: true };
  if (promo.type === 'PERCENTAGE') {
    const raw = Math.round((subtotal * promo.value) / 100);
    return { valid: true, discount: Math.min(raw, promo.maxDiscount ?? Infinity), freeShipping: false };
  }
  return { valid: true, discount: Math.min(promo.value, subtotal), freeShipping: false };
}

export function computeTotals({ items, promotion, shippingMethodId }) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const categoryIds = [...new Set(items.flatMap((i) => [i.categoryId, i.parentCategoryId]))].filter(Boolean);

  const promoResult = evaluatePromotion(promotion, { subtotal, categoryIds });
  const discount = promoResult.discount;

  const method = SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ?? SHIPPING_METHODS[0];
  const qualifiesFree = promoResult.freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = items.length === 0 ? 0 : qualifiesFree && method.id === 'standard' ? 0 : method.price;

  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE);

  return {
    subtotal, discount, tax, shipping,
    total: taxable + tax + shipping,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    shippingMethod: method.id,
    shippingMethodName: method.name,
    freeShippingApplied: shipping === 0 && items.length > 0,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    promotion: promotion ? { code: promotion.code, name: promotion.name, ...promoResult } : null,
  };
}
