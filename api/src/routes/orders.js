import { Router } from 'express';
import { getDb, getIdx, index, audit, recomputeStock } from '../db/store.js';
import { paginate, applySort } from '../lib/pagination.js';
import { notFound, validate, rules, unprocessable, forbidden, conflict } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { computeTotals, SHIPPING_METHODS } from '../lib/totals.js';
import { hydrateCart, loadCart } from './cart.js';
import { emit, EVENTS } from '../ws/index.js';

const router = Router();

function validateAddress(address, field) {
  const fieldErrors = {};
  const require = (key, label) => {
    if (!address?.[key] || String(address[key]).trim() === '') fieldErrors[`${field}.${key}`] = `${label} is required`;
  };
  require('fullName', 'Full name');
  require('line1', 'Address line 1');
  require('city', 'City');
  require('state', 'State');
  require('postalCode', 'PIN code');
  if (address?.postalCode && !/^\d{6}$/.test(String(address.postalCode))) {
    fieldErrors[`${field}.postalCode`] = 'PIN code must be 6 digits';
  }
  if (address?.phone && !/^[+\d][\d\s-]{7,}$/.test(String(address.phone))) {
    fieldErrors[`${field}.phone`] = 'Enter a valid phone number';
  }
  return fieldErrors;
}

/**
 * Checkout. Deliberately strict, because Session 7's wizard needs a server
 * that pushes back: it re-prices from live data (never trusting client totals),
 * re-checks stock, and returns per-field 422s that map onto wizard steps.
 */
router.post('/checkout', requireAuth, (req, res, next) => {
  try {
    const cart = loadCart(req, { create: false });
    const hydrated = cart ? hydrateCart(cart) : null;
    if (!hydrated || hydrated.items.length === 0) throw conflict('Your cart is empty', 'CART_EMPTY');

    const fieldErrors = {
      ...validateAddress(req.body?.shippingAddress, 'shippingAddress'),
      ...(req.body?.billingSameAsShipping ? {} : validateAddress(req.body?.billingAddress, 'billingAddress')),
    };
    if (!req.body?.paymentMethod) fieldErrors.paymentMethod = 'Choose a payment method';
    else if (!['CARD', 'UPI', 'NETBANKING', 'COD'].includes(req.body.paymentMethod)) {
      fieldErrors.paymentMethod = 'Unsupported payment method';
    }
    if (req.body?.shippingMethodId && !SHIPPING_METHODS.some((m) => m.id === req.body.shippingMethodId)) {
      fieldErrors.shippingMethodId = 'Unsupported shipping method';
    }
    // A COD order over ₹50,000 is refused — gives the wizard a cross-field
    // rule that only the server can enforce.
    if (req.body?.paymentMethod === 'COD' && hydrated.total > 5_000_000) {
      fieldErrors.paymentMethod = 'Cash on delivery is not available for orders over ₹50,000';
    }
    if (Object.keys(fieldErrors).length) throw unprocessable(fieldErrors);

    const db = getDb();
    // Re-check stock at the last possible moment. Between "add to cart" and
    // "pay", someone else may have bought the last one — this is where the
    // S8 "optimistic update disagrees with reality" discussion comes from.
    const shortfalls = {};
    for (const item of hydrated.items) {
      const variant = db.variantsById.get(item.variantId);
      if (!variant || variant.stockQuantity < item.quantity) {
        shortfalls[`items.${item.id}`] = variant
          ? `Only ${variant.stockQuantity} of "${item.productName}" left`
          : `"${item.productName}" is no longer available`;
      }
    }
    if (Object.keys(shortfalls).length) throw unprocessable(shortfalls, 'Some items are no longer available');

    if (req.body.shippingMethodId) cart.shippingMethodId = req.body.shippingMethodId;
    const priced = hydrateCart(cart);

    const idx = getIdx();
    const orderSeq = db.orders.length + 1;
    const orderId = `ord_live_${Date.now().toString(36)}`;
    const shippingAddress = req.body.shippingAddress;
    const order = {
      id: orderId,
      orderNumber: `SC-${String(100000 + orderSeq)}`,
      userId: req.user.id,
      customerUsername: req.user.username,
      customerEmail: req.user.email,
      customerName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      status: 'CREATED',
      items: priced.items.map((i, n) => ({
        id: `oit_${orderId}_${n + 1}`,
        productId: i.productId, productName: i.productName, productSlug: i.productSlug,
        variantId: i.variantId, sku: i.sku, options: i.options, imageUrl: i.imageUrl,
        quantity: i.quantity, unitPrice: i.unitPrice, discount: 0, lineTotal: i.lineTotal,
      })),
      currency: 'INR',
      subtotal: priced.subtotal, discount: priced.discount, tax: priced.tax,
      shipping: priced.shipping, totalAmount: priced.total,
      promotionCode: priced.promotion?.valid ? priced.promotion.code : null,
      shippingAddress,
      billingAddress: req.body.billingSameAsShipping ? shippingAddress : req.body.billingAddress,
      shippingMethod: priced.shippingMethod,
      shippingMethodName: priced.shippingMethodName,
      paymentMethod: req.body.paymentMethod,
      trackingNumber: null,
      placedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
    };

    for (const item of order.items) {
      const variant = db.variantsById.get(item.variantId);
      variant.stockQuantity -= item.quantity;
      const product = idx.productById.get(item.productId);
      if (product) {
        recomputeStock(product);
        emit(EVENTS.STOCK_CHANGED, { productId: product.id, productSlug: product.slug, variantId: variant.id, stockQuantity: variant.stockQuantity, productStock: product.stockQuantity });
        if (product.stockQuantity <= 5) {
          emit(EVENTS.LOW_STOCK, { productId: product.id, productName: product.name, sku: product.sku, stockQuantity: product.stockQuantity });
        }
      }
    }

    index.addOrder(order);
    const promo = order.promotionCode ? idx.promotionByCode.get(order.promotionCode) : null;
    if (promo) promo.usageCount += 1;

    cart.items = [];
    cart.promotionCode = null;

    // The event the S8 admin live-orders wall listens for.
    emit(EVENTS.ORDER_CREATED, {
      id: order.id, orderNumber: order.orderNumber, status: order.status,
      customerName: order.customerName, totalAmount: order.totalAmount,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      placedAt: order.placedAt,
    });

    res.status(201).json({ data: order });
  } catch (err) { next(err); }
});

/** The signed-in customer's own orders. */
router.get('/orders', requireAuth, (req, res, next) => {
  try {
    let rows = getIdx().ordersByUserId.get(req.user.id) ?? [];
    if (req.query.status) {
      const wanted = String(req.query.status).split(',');
      rows = rows.filter((o) => wanted.includes(o.status));
    }
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      rows = rows.filter((o) => o.orderNumber.toLowerCase().includes(q)
        || o.items.some((i) => i.productName.toLowerCase().includes(q)));
    }
    const sorted = applySort(rows, req.query.sort, ['createdAt', 'totalAmount', 'status'], 'createdAt:desc');
    res.json(paginate(sorted, req.query, { defaultLimit: 10, maxLimit: 50 }));
  } catch (err) { next(err); }
});

router.get('/orders/:id', requireAuth, (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    // A customer may only read their own. Staff read anything.
    if (order.userId !== req.user.id && !req.user.roles.some((r) => r !== 'CUSTOMER')) {
      throw forbidden('That is not your order');
    }
    res.json({ data: order });
  } catch (err) { next(err); }
});

const CANCELLABLE = ['CREATED', 'CONFIRMED', 'PAID'];

router.post('/orders/:id/cancel', requireAuth, (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    if (order.userId !== req.user.id && !req.user.roles.some((r) => r !== 'CUSTOMER')) throw forbidden('That is not your order');
    if (!CANCELLABLE.includes(order.status)) {
      throw conflict(`An order that is ${order.status} can no longer be cancelled`, 'NOT_CANCELLABLE');
    }
    const previous = order.status;
    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();
    order.notes.push({ at: order.updatedAt, by: req.user.username, text: req.body?.reason ?? 'Cancelled by customer' });

    // Put the stock back.
    const db = getDb();
    for (const item of order.items) {
      const variant = db.variantsById.get(item.variantId);
      if (!variant) continue;
      variant.stockQuantity += item.quantity;
      const product = getIdx().productById.get(item.productId);
      if (product) recomputeStock(product);
    }
    audit(req.user, 'order.cancelled', 'order', order.id, 'SUCCESS', req);
    emit(EVENTS.ORDER_STATUS_CHANGED, { id: order.id, orderNumber: order.orderNumber, from: previous, to: order.status });
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.get('/orders/:id/tracking', requireAuth, (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    if (order.userId !== req.user.id && !req.user.roles.some((r) => r !== 'CUSTOMER')) throw forbidden('That is not your order');

    const flow = ['CREATED', 'CONFIRMED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED'];
    const reached = flow.indexOf(order.status);
    res.json({
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        steps: flow.map((step, i) => ({
          step,
          done: reached >= 0 && i <= reached,
          current: i === reached,
        })),
        terminal: ['CANCELLED', 'REJECTED', 'RETURNED', 'REFUNDED'].includes(order.status) ? order.status : null,
      },
    });
  } catch (err) { next(err); }
});

export default router;
