/**
 * "My Account" — the customer-facing dashboard behind the S6 fork.
 * Addresses, returns, wishlist, and the reviews I've written.
 */
import { Router } from 'express';
import { getDb, getIdx, index, audit } from '../db/store.js';
import { paginate, applySort } from '../lib/pagination.js';
import { notFound, validate, rules, unprocessable, conflict, forbidden } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { emit, EVENTS } from '../ws/index.js';

const router = Router();
router.use(requireAuth);

// ---- addresses -------------------------------------------------------------

const ADDRESS_RULES = {
  label: [rules.optional(rules.maxLen(24, 'Label'))],
  fullName: [rules.required('Full name'), rules.minLen(2, 'Full name')],
  line1: [rules.required('Address line 1'), rules.minLen(4, 'Address line 1')],
  city: [rules.required('City')],
  state: [rules.required('State')],
  postalCode: [rules.required('PIN code'), (v) => (/^\d{6}$/.test(String(v ?? '')) ? null : 'PIN code must be 6 digits')],
  phone: [rules.required('Phone'), (v) => (/^[+\d][\d\s-]{7,}$/.test(String(v ?? '')) ? null : 'Enter a valid phone number')],
};

router.get('/addresses', (req, res) => {
  const rows = getIdx().addressesByUserId.get(req.user.id) ?? [];
  res.json({ data: rows.slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault)) });
});

router.post('/addresses', (req, res, next) => {
  try {
    validate(req.body, ADDRESS_RULES);
    const existing = getIdx().addressesByUserId.get(req.user.id) ?? [];
    const isDefault = Boolean(req.body.isDefault) || existing.length === 0;
    if (isDefault) for (const a of existing) a.isDefault = false;

    const address = {
      id: `adr_live_${Date.now().toString(36)}`,
      userId: req.user.id,
      label: req.body.label || 'Home',
      fullName: req.body.fullName,
      line1: req.body.line1,
      line2: req.body.line2 ?? '',
      city: req.body.city, state: req.body.state,
      country: req.body.country ?? 'India',
      postalCode: String(req.body.postalCode),
      phone: req.body.phone,
      isDefault,
    };
    index.addAddress(address);
    res.status(201).json({ data: address });
  } catch (err) { next(err); }
});

router.patch('/addresses/:id', (req, res, next) => {
  try {
    const rows = getIdx().addressesByUserId.get(req.user.id) ?? [];
    const address = rows.find((a) => a.id === req.params.id);
    if (!address) throw notFound('Address');
    validate({ ...address, ...req.body }, ADDRESS_RULES);
    if (req.body.isDefault === true) for (const a of rows) a.isDefault = false;
    Object.assign(address, req.body, { id: address.id, userId: address.userId });
    res.json({ data: address });
  } catch (err) { next(err); }
});

router.delete('/addresses/:id', (req, res, next) => {
  try {
    const rows = getIdx().addressesByUserId.get(req.user.id) ?? [];
    const address = rows.find((a) => a.id === req.params.id);
    if (!address) throw notFound('Address');
    index.removeAddress(address);
    const remaining = getIdx().addressesByUserId.get(req.user.id) ?? [];
    if (address.isDefault && remaining.length) remaining[0].isDefault = true;
    res.status(204).end();
  } catch (err) { next(err); }
});

// ---- returns ---------------------------------------------------------------

const RETURN_WINDOW_DAYS = 30;

router.get('/returns', (req, res) => {
  const rows = getIdx().returnsByUserId.get(req.user.id) ?? [];
  res.json(paginate(applySort(rows, req.query.sort, ['createdAt', 'status'], 'createdAt:desc'), req.query, { defaultLimit: 10 }));
});

router.post('/returns', (req, res, next) => {
  try {
    validate(req.body, {
      orderId: [rules.required('Order')],
      reason: [rules.required('Reason'), rules.oneOf(
        ['Wrong size', 'Damaged on arrival', 'Not as described', 'Changed my mind', 'Faulty', 'Late delivery'], 'Reason')],
      comment: [rules.optional(rules.maxLen(1000, 'Comment'))],
    });
    const order = getIdx().orderById.get(req.body.orderId);
    if (!order) throw notFound('Order');
    if (order.userId !== req.user.id) throw forbidden('That is not your order');
    if (order.status !== 'DELIVERED') throw conflict('Only delivered orders can be returned', 'NOT_RETURNABLE');

    const ageDays = (Date.now() - Date.parse(order.placedAt)) / 86400000;
    if (ageDays > RETURN_WINDOW_DAYS) {
      throw unprocessable({ orderId: `The ${RETURN_WINDOW_DAYS}-day return window for this order has closed` });
    }
    const existing = (getIdx().returnsByUserId.get(req.user.id) ?? []).find((r) => r.orderId === order.id);
    if (existing) throw conflict('A return is already open for this order', 'RETURN_EXISTS');

    const wantedIds = Array.isArray(req.body.orderItemIds) && req.body.orderItemIds.length
      ? req.body.orderItemIds : order.items.map((i) => i.id);
    const items = order.items.filter((i) => wantedIds.includes(i.id));
    if (!items.length) throw unprocessable({ orderItemIds: 'Choose at least one item to return' });

    const ret = {
      id: `ret_live_${Date.now().toString(36)}`,
      rmaNumber: `RMA-${String(50000 + getDb().returns.length)}`,
      orderId: order.id, orderNumber: order.orderNumber,
      userId: req.user.id, customerName: order.customerName,
      items: items.map((i) => ({ orderItemId: i.id, productName: i.productName, sku: i.sku, quantity: i.quantity, refundAmount: i.lineTotal })),
      reason: req.body.reason,
      comment: req.body.comment ?? '',
      photos: Array.isArray(req.body.photos) ? req.body.photos.slice(0, 5) : [],
      status: 'REQUESTED',
      refundAmount: items.reduce((s, i) => s + i.lineTotal, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    index.addReturn(ret);
    audit(req.user, 'return.requested', 'return', ret.id, 'SUCCESS', req);
    emit(EVENTS.RETURN_REQUESTED, { id: ret.id, rmaNumber: ret.rmaNumber, orderNumber: ret.orderNumber, customerName: ret.customerName, refundAmount: ret.refundAmount });
    res.status(201).json({ data: ret });
  } catch (err) { next(err); }
});

router.get('/returns/:id', (req, res, next) => {
  try {
    const ret = getIdx().returnById.get(req.params.id);
    if (!ret) throw notFound('Return');
    if (ret.userId !== req.user.id) throw forbidden('That is not your return');
    res.json({ data: ret });
  } catch (err) { next(err); }
});

// ---- wishlist --------------------------------------------------------------

const wishlists = new Map();
const wishlistFor = (userId) => {
  if (!wishlists.has(userId)) wishlists.set(userId, new Set());
  return wishlists.get(userId);
};

router.get('/wishlist', (req, res) => {
  const idx = getIdx();
  const data = [...wishlistFor(req.user.id)]
    .map((id) => idx.productById.get(id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id, slug: p.slug, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice,
      image: p.images[0], rating: p.rating, reviewCount: p.reviewCount, inStock: p.stockQuantity > 0,
    }));
  res.json({ data });
});

router.post('/wishlist/:productId', (req, res, next) => {
  try {
    if (!getIdx().productById.get(req.params.productId)) throw notFound('Product');
    wishlistFor(req.user.id).add(req.params.productId);
    res.status(201).json({ data: { productId: req.params.productId, saved: true } });
  } catch (err) { next(err); }
});

router.delete('/wishlist/:productId', (req, res) => {
  wishlistFor(req.user.id).delete(req.params.productId);
  res.status(204).end();
});

// ---- my reviews ------------------------------------------------------------

router.get('/reviews', (req, res) => {
  const rows = getDb().reviews.filter((r) => r.userId === req.user.id);
  res.json(paginate(applySort(rows, req.query.sort, ['createdAt', 'rating'], 'createdAt:desc'), req.query, { defaultLimit: 10 }));
});

export default router;
