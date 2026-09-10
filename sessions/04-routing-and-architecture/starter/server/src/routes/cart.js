/**
 * Cart — the endpoint behind Session 8's central question:
 * "is the cart client state or server state?"
 *
 * The answer this API models, and the one real stores use:
 *   - a GUEST cart lives client-side, keyed by an `X-Cart-Id` the browser
 *     generates and stores;
 *   - a LOGGED-IN cart lives server-side, keyed by user id;
 *   - logging in MERGES the guest cart into the user cart (POST /cart/merge).
 *
 * That merge is Session 6 Lab 4, and it is the kind of problem tutorials
 * never show but every commerce frontend has to solve.
 */
import { Router } from 'express';
import { getDb, getIdx } from '../db/store.js';
import { computeTotals, SHIPPING_METHODS } from '../lib/totals.js';
import { notFound, badRequest, validate, rules, unprocessable } from '../lib/errors.js';

const router = Router();

const emptyCart = (key) => ({ key, items: [], promotionCode: null, shippingMethodId: 'standard', updatedAt: new Date().toISOString() });

/** A logged-in user's cart wins; otherwise fall back to the guest cart id. */
function cartKey(req) {
  if (req.user) return `user:${req.user.id}`;
  const guestId = req.get('x-cart-id');
  if (!guestId) return null;
  return `guest:${guestId}`;
}

function loadCart(req, { create = true } = {}) {
  const key = cartKey(req);
  if (!key) return null;
  const carts = getDb().carts;
  let cart = carts.get(key);
  if (!cart && create) { cart = emptyCart(key); carts.set(key, cart); }
  return cart ?? null;
}

/** Re-reads live price and stock every time — a cart is a wish, not a contract. */
function hydrate(cart) {
  const db = getDb();
  const idx = getIdx();
  const items = [];
  for (const line of cart.items) {
    const variant = db.variantsById.get(line.variantId);
    const product = variant ? idx.productById.get(variant.productId) : null;
    if (!variant || !product) continue;
    items.push({
      id: line.id,
      productId: product.id, productName: product.name, productSlug: product.slug,
      variantId: variant.id, sku: variant.sku, options: variant.options,
      imageUrl: product.images[0].url,
      categoryId: product.categoryId, parentCategoryId: product.parentCategoryId,
      unitPrice: variant.price,
      quantity: line.quantity,
      lineTotal: variant.price * line.quantity,
      availableStock: variant.stockQuantity,
      inStock: variant.stockQuantity > 0,
      // Surfaced so the cart page can warn "only 2 left" — a real pattern,
      // and a good excuse for conditional rendering in Session 1.
      quantityExceedsStock: line.quantity > variant.stockQuantity,
    });
  }
  const promotion = cart.promotionCode ? idx.promotionByCode.get(cart.promotionCode.toUpperCase()) : null;
  const totals = computeTotals({ items, promotion, shippingMethodId: cart.shippingMethodId });
  return { id: cart.key, items, ...totals, updatedAt: cart.updatedAt };
}

const touch = (cart) => { cart.updatedAt = new Date().toISOString(); };

router.get('/cart', (req, res) => {
  const cart = loadCart(req, { create: false });
  if (!cart) return res.json({ data: { id: null, items: [], ...computeTotals({ items: [], shippingMethodId: 'standard' }) } });
  res.json({ data: hydrate(cart) });
});

router.get('/cart/shipping-methods', (_req, res) => res.json({ data: SHIPPING_METHODS }));

router.post('/cart/items', (req, res, next) => {
  try {
    validate(req.body, {
      variantId: [rules.required('Variant')],
      quantity: [rules.optional(rules.int('Quantity')), rules.optional(rules.min(1, 'Quantity'))],
    });
    const cart = loadCart(req);
    if (!cart) throw badRequest('Send an X-Cart-Id header (or log in) to use a cart', 'NO_CART_ID');

    const variant = getDb().variantsById.get(req.body.variantId);
    if (!variant) throw notFound('Variant');

    const quantity = Number(req.body.quantity ?? 1);
    const existing = cart.items.find((i) => i.variantId === variant.id);
    const nextQty = (existing?.quantity ?? 0) + quantity;

    if (nextQty > variant.stockQuantity) {
      throw unprocessable(
        { quantity: variant.stockQuantity === 0 ? 'This item is out of stock' : `Only ${variant.stockQuantity} left in stock` },
        'Not enough stock',
      );
    }
    if (existing) existing.quantity = nextQty;
    else cart.items.push({ id: `cli_${Date.now().toString(36)}_${cart.items.length}`, variantId: variant.id, quantity });

    touch(cart);
    res.status(201).json({ data: hydrate(cart) });
  } catch (err) { next(err); }
});

router.patch('/cart/items/:itemId', (req, res, next) => {
  try {
    const cart = loadCart(req, { create: false });
    if (!cart) throw notFound('Cart');
    const line = cart.items.find((i) => i.id === req.params.itemId);
    if (!line) throw notFound('Cart item');

    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) throw unprocessable({ quantity: 'Quantity must be 0 or more' });

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.id !== line.id);
    } else {
      const variant = getDb().variantsById.get(line.variantId);
      if (quantity > variant.stockQuantity) throw unprocessable({ quantity: `Only ${variant.stockQuantity} left in stock` });
      line.quantity = quantity;
    }
    touch(cart);
    res.json({ data: hydrate(cart) });
  } catch (err) { next(err); }
});

router.delete('/cart/items/:itemId', (req, res, next) => {
  try {
    const cart = loadCart(req, { create: false });
    if (!cart) throw notFound('Cart');
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.id !== req.params.itemId);
    if (cart.items.length === before) throw notFound('Cart item');
    touch(cart);
    res.json({ data: hydrate(cart) });
  } catch (err) { next(err); }
});

router.delete('/cart', (req, res) => {
  const cart = loadCart(req, { create: false });
  if (cart) { cart.items = []; cart.promotionCode = null; touch(cart); }
  res.json({ data: cart ? hydrate(cart) : { id: null, items: [], ...computeTotals({ items: [], shippingMethodId: 'standard' }) } });
});

router.post('/cart/promotion', (req, res, next) => {
  try {
    validate(req.body, { code: [rules.required('Promo code')] });
    const cart = loadCart(req);
    if (!cart) throw badRequest('Send an X-Cart-Id header (or log in) to use a cart', 'NO_CART_ID');

    const promo = getIdx().promotionByCode.get(String(req.body.code).toUpperCase());
    // 422 with the error ON THE `code` FIELD — this is the exact response
    // Session 7 Lab 4 maps onto the promo input with RHF's setError.
    if (!promo) throw unprocessable({ code: 'That promo code is not recognised' });

    cart.promotionCode = promo.code;
    touch(cart);
    const hydrated = hydrate(cart);
    if (hydrated.promotion && !hydrated.promotion.valid) {
      cart.promotionCode = null;
      throw unprocessable({ code: hydrated.promotion.reason });
    }
    res.json({ data: hydrated });
  } catch (err) { next(err); }
});

router.delete('/cart/promotion', (req, res, next) => {
  try {
    const cart = loadCart(req, { create: false });
    if (!cart) throw notFound('Cart');
    cart.promotionCode = null;
    touch(cart);
    res.json({ data: hydrate(cart) });
  } catch (err) { next(err); }
});

router.patch('/cart/shipping-method', (req, res, next) => {
  try {
    validate(req.body, { shippingMethodId: [rules.required('Shipping method'), rules.oneOf(SHIPPING_METHODS.map((m) => m.id), 'Shipping method')] });
    const cart = loadCart(req);
    if (!cart) throw badRequest('Send an X-Cart-Id header (or log in) to use a cart', 'NO_CART_ID');
    cart.shippingMethodId = req.body.shippingMethodId;
    touch(cart);
    res.json({ data: hydrate(cart) });
  } catch (err) { next(err); }
});

/**
 * Merge a guest cart into the signed-in user's cart. Called right after login.
 * Quantities are summed and clamped to stock; the guest cart is then dropped.
 */
router.post('/cart/merge', (req, res, next) => {
  try {
    if (!req.user) throw badRequest('Log in first', 'NOT_AUTHENTICATED');
    const guestId = req.body?.cartId ?? req.get('x-cart-id');
    if (!guestId) throw badRequest('cartId is required', 'NO_CART_ID');

    const carts = getDb().carts;
    const guestCart = carts.get(`guest:${guestId}`);
    const userKey = `user:${req.user.id}`;
    let userCart = carts.get(userKey);
    if (!userCart) { userCart = emptyCart(userKey); carts.set(userKey, userCart); }

    let merged = 0;
    if (guestCart) {
      for (const line of guestCart.items) {
        const variant = getDb().variantsById.get(line.variantId);
        if (!variant) continue;
        const existing = userCart.items.find((i) => i.variantId === line.variantId);
        if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, variant.stockQuantity);
        else userCart.items.push({ id: `cli_${Date.now().toString(36)}_${userCart.items.length}`, variantId: line.variantId, quantity: Math.min(line.quantity, variant.stockQuantity) });
        merged += 1;
      }
      if (!userCart.promotionCode && guestCart.promotionCode) userCart.promotionCode = guestCart.promotionCode;
      carts.delete(`guest:${guestId}`);
    }
    touch(userCart);
    res.json({ data: hydrate(userCart), merged });
  } catch (err) { next(err); }
});

export { hydrate as hydrateCart, loadCart, cartKey };
export default router;
