/**
 * Back-office. Everything here needs a permission, and every mutation writes
 * an audit entry — which is both realistic and what makes the S9 audit-log
 * virtualization lab have real data to show.
 */
import { Router } from 'express';
import { getDb, getIdx, index, audit, recomputeStock } from '../db/store.js';
import { paginate, applySort } from '../lib/pagination.js';
import { notFound, validate, rules, unprocessable, conflict } from '../lib/errors.js';
import { requireAuth, requirePermission, requireStaff } from '../middleware/auth.js';
import { emit, EVENTS } from '../ws/index.js';
import { ORDER_STATUSES } from '../db/seed.js';

const router = Router();
router.use(requireAuth, requireStaff);

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---- catalog ---------------------------------------------------------------

router.get('/products', requirePermission('product:read'), (req, res, next) => {
  try {
    let rows = getDb().products;
    const q = String(req.query.q ?? '').trim().toLowerCase();
    if (q) rows = rows.filter((p) => `${p.name} ${p.sku} ${p.brandName}`.toLowerCase().includes(q));
    if (req.query.status) rows = rows.filter((p) => String(req.query.status).split(',').includes(p.status));
    if (req.query.category) rows = rows.filter((p) => p.categoryId === req.query.category || p.parentCategoryId === req.query.category);
    if (req.query.lowStock === 'true') rows = rows.filter((p) => p.stockQuantity <= Number(req.query.threshold ?? 10));

    const sorted = applySort(rows, req.query.sort, ['name', 'price', 'stockQuantity', 'createdAt', 'updatedAt', 'rating'], 'updatedAt:desc');
    const result = paginate(sorted, req.query, { defaultLimit: 25, maxLimit: 200 });
    res.json({
      data: result.data.map((p) => ({
        id: p.id, sku: p.sku, slug: p.slug, name: p.name, status: p.status,
        brandName: p.brandName, categoryName: p.categoryName, categoryId: p.categoryId,
        price: p.price, compareAtPrice: p.compareAtPrice, currency: p.currency,
        stockQuantity: p.stockQuantity, variantCount: p.variants.length,
        rating: p.rating, reviewCount: p.reviewCount,
        image: p.images[0], updatedAt: p.updatedAt,
      })),
      meta: result.meta,
    });
  } catch (err) { next(err); }
});

router.get('/products/:id', requirePermission('product:read'), (req, res, next) => {
  try {
    const product = getIdx().productById.get(req.params.id);
    if (!product) throw notFound('Product');
    res.json({ data: product });
  } catch (err) { next(err); }
});

const PRODUCT_RULES = {
  name: [rules.required('Name'), rules.minLen(3, 'Name'), rules.maxLen(140, 'Name')],
  sku: [rules.required('SKU'), rules.minLen(3, 'SKU')],
  categoryId: [rules.required('Category')],
  brandId: [rules.required('Brand')],
  price: [rules.required('Price'), rules.int('Price'), rules.min(1, 'Price')],
  description: [rules.optional(rules.maxLen(4000, 'Description'))],
};

router.post('/products', requirePermission('product:create'), (req, res, next) => {
  try {
    validate(req.body, PRODUCT_RULES);
    const db = getDb();
    const idx = getIdx();
    // Async unique-SKU validation in S7 Lab 4 hits this exact 422.
    if (db.products.some((p) => p.sku.toLowerCase() === String(req.body.sku).toLowerCase())) {
      throw unprocessable({ sku: 'That SKU is already in use' });
    }
    if (!idx.categoryById.get(req.body.categoryId)) throw unprocessable({ categoryId: 'Unknown category' });
    if (!idx.brandById.get(req.body.brandId)) throw unprocessable({ brandId: 'Unknown brand' });

    const category = idx.categoryById.get(req.body.categoryId);
    const parent = category.parentId ? idx.categoryById.get(category.parentId) : category;
    const brand = idx.brandById.get(req.body.brandId);
    const id = `prd_live_${Date.now().toString(36)}`;
    let slug = slugify(req.body.name);
    if (idx.productBySlug.has(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const variants = (Array.isArray(req.body.variants) && req.body.variants.length ? req.body.variants : [{ options: [], price: req.body.price, stockQuantity: req.body.stockQuantity ?? 0 }])
      .map((v, i) => ({
        id: `${id}_v${i + 1}`, productId: id,
        sku: v.sku ?? `${req.body.sku}-${i + 1}`,
        options: v.options ?? [],
        price: Number(v.price ?? req.body.price),
        stockQuantity: Number(v.stockQuantity ?? 0),
        active: v.active ?? true,
      }));

    const now = new Date().toISOString();
    const product = {
      id, sku: req.body.sku, slug, name: req.body.name,
      description: req.body.description ?? '',
      brandId: brand.id, brandName: brand.name,
      categoryId: category.id, categoryName: category.name,
      parentCategoryId: parent.id, parentCategoryName: parent.name,
      currency: 'INR',
      price: Number(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : null,
      stockQuantity: variants.reduce((s, v) => s + v.stockQuantity, 0),
      images: Array.isArray(req.body.images) && req.body.images.length ? req.body.images : [{ url: `/api/images/${slug}-1.svg`, alt: req.body.name }],
      rating: 0, reviewCount: 0,
      tags: req.body.tags ?? [],
      attributes: req.body.attributes ?? {},
      variants,
      status: req.body.status ?? 'DRAFT',
      createdAt: now, updatedAt: now,
    };
    index.addProduct(product);
    audit(req.user, 'product.created', 'product', product.id, 'SUCCESS', req);
    res.status(201).json({ data: product });
  } catch (err) { next(err); }
});

router.patch('/products/:id', requirePermission('product:update'), (req, res, next) => {
  try {
    const product = getIdx().productById.get(req.params.id);
    if (!product) throw notFound('Product');
    validate({ ...product, ...req.body }, PRODUCT_RULES);

    if (req.body.sku && req.body.sku !== product.sku
      && getDb().products.some((p) => p.id !== product.id && p.sku.toLowerCase() === String(req.body.sku).toLowerCase())) {
      throw unprocessable({ sku: 'That SKU is already in use' });
    }
    const oldSlug = product.slug;
    const priceChanged = req.body.price != null && Number(req.body.price) !== product.price;

    for (const field of ['name', 'sku', 'description', 'price', 'compareAtPrice', 'images', 'tags', 'attributes', 'status']) {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    }
    if (req.body.categoryId) {
      const category = getIdx().categoryById.get(req.body.categoryId);
      if (!category) throw unprocessable({ categoryId: 'Unknown category' });
      const parent = category.parentId ? getIdx().categoryById.get(category.parentId) : category;
      Object.assign(product, { categoryId: category.id, categoryName: category.name, parentCategoryId: parent.id, parentCategoryName: parent.name });
    }
    if (Array.isArray(req.body.variants)) {
      product.variants = req.body.variants.map((v, i) => ({
        id: v.id ?? `${product.id}_v${i + 1}`,
        productId: product.id,
        sku: v.sku ?? `${product.sku}-${i + 1}`,
        options: v.options ?? [],
        price: Number(v.price ?? product.price),
        stockQuantity: Number(v.stockQuantity ?? 0),
        active: v.active ?? true,
      }));
      for (const v of product.variants) getDb().variantsById.set(v.id, v);
      recomputeStock(product);
    }
    if (req.body.name) { product.slug = slugify(req.body.name); index.reslugProduct(product, oldSlug); }
    product.updatedAt = new Date().toISOString();

    audit(req.user, priceChanged ? 'price.changed' : 'product.updated', 'product', product.id, 'SUCCESS', req);
    emit(EVENTS.PRODUCT_UPDATED, { id: product.id, slug: product.slug, name: product.name, price: product.price, stockQuantity: product.stockQuantity });
    res.json({ data: product });
  } catch (err) { next(err); }
});

router.delete('/products/:id', requirePermission('product:delete'), (req, res, next) => {
  try {
    const product = getIdx().productById.get(req.params.id);
    if (!product) throw notFound('Product');
    // Archive rather than hard-delete when it has order history — the correct
    // behaviour, and a good thing for participants to see modelled.
    const hasOrders = getDb().orders.some((o) => o.items.some((i) => i.productId === product.id));
    if (hasOrders && req.query.force !== 'true') {
      product.status = 'ARCHIVED';
      product.updatedAt = new Date().toISOString();
      audit(req.user, 'product.archived', 'product', product.id, 'SUCCESS', req);
      return res.json({ data: product, archived: true, reason: 'Product has order history, so it was archived instead of deleted' });
    }
    index.removeProduct(product);
    audit(req.user, 'product.deleted', 'product', product.id, 'SUCCESS', req);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/products/bulk', requirePermission('product:update'), (req, res, next) => {
  try {
    validate(req.body, {
      ids: [(v) => (Array.isArray(v) && v.length ? null : 'Select at least one product')],
      action: [rules.required('Action'), rules.oneOf(['activate', 'archive', 'draft', 'adjustPrice', 'setTag'], 'Action')],
    });
    const idx = getIdx();
    const products = req.body.ids.map((id) => idx.productById.get(id)).filter(Boolean);
    if (!products.length) throw notFound('Products');

    for (const p of products) {
      switch (req.body.action) {
        case 'activate': p.status = 'ACTIVE'; break;
        case 'archive': p.status = 'ARCHIVED'; break;
        case 'draft': p.status = 'DRAFT'; break;
        case 'adjustPrice': {
          const pct = Number(req.body.percent ?? 0);
          p.price = Math.max(100, Math.round(p.price * (1 + pct / 100)));
          for (const v of p.variants) v.price = Math.max(100, Math.round(v.price * (1 + pct / 100)));
          break;
        }
        case 'setTag': if (req.body.tag && !p.tags.includes(req.body.tag)) p.tags.push(req.body.tag); break;
      }
      p.updatedAt = new Date().toISOString();
    }
    audit(req.user, `product.bulk_${req.body.action}`, 'product', `${products.length} products`, 'SUCCESS', req);
    res.json({ data: { updated: products.length, ids: products.map((p) => p.id) } });
  } catch (err) { next(err); }
});

// ---- inventory -------------------------------------------------------------

router.get('/inventory', requirePermission('inventory:read'), (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold ?? 10);
    const rows = [];
    for (const p of getDb().products) {
      for (const v of p.variants) {
        if (req.query.lowStock === 'true' && v.stockQuantity > threshold) continue;
        rows.push({
          productId: p.id, productName: p.name, productSlug: p.slug,
          variantId: v.id, sku: v.sku, options: v.options,
          stockQuantity: v.stockQuantity, price: v.price, active: v.active,
          status: v.stockQuantity === 0 ? 'OUT_OF_STOCK' : v.stockQuantity <= threshold ? 'LOW' : 'OK',
        });
      }
    }
    res.json(paginate(applySort(rows, req.query.sort, ['stockQuantity', 'sku', 'productName'], 'stockQuantity:asc'), req.query, { defaultLimit: 50, maxLimit: 500 }));
  } catch (err) { next(err); }
});

router.post('/inventory/:variantId/adjust', requirePermission('inventory:adjust'), (req, res, next) => {
  try {
    const variant = getDb().variantsById.get(req.params.variantId);
    if (!variant) throw notFound('Variant');
    const delta = Number(req.body?.delta);
    if (!Number.isInteger(delta)) throw unprocessable({ delta: 'Delta must be a whole number' });
    if (variant.stockQuantity + delta < 0) throw unprocessable({ delta: `Cannot go below zero (current stock is ${variant.stockQuantity})` });

    variant.stockQuantity += delta;
    const product = getIdx().productById.get(variant.productId);
    if (product) { recomputeStock(product); product.updatedAt = new Date().toISOString(); }

    audit(req.user, 'stock.adjusted', 'variant', variant.id, 'SUCCESS', req);
    emit(EVENTS.STOCK_CHANGED, { productId: variant.productId, productSlug: product?.slug, variantId: variant.id, stockQuantity: variant.stockQuantity, productStock: product?.stockQuantity });
    if (product && product.stockQuantity <= 5) {
      emit(EVENTS.LOW_STOCK, { productId: product.id, productName: product.name, sku: product.sku, stockQuantity: product.stockQuantity });
    }
    res.json({ data: { variantId: variant.id, stockQuantity: variant.stockQuantity, productStock: product?.stockQuantity } });
  } catch (err) { next(err); }
});

// ---- orders ----------------------------------------------------------------

/** Valid transitions. The admin UI renders exactly the buttons this allows. */
const TRANSITIONS = {
  CREATED: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PAID', 'CANCELLED', 'REJECTED'],
  PAID: ['PACKED', 'CANCELLED', 'REFUNDED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  REFUNDED: [], CANCELLED: [], REJECTED: [],
};

router.get('/orders', requirePermission('order:read'), (req, res, next) => {
  try {
    let rows = getDb().orders;
    if (req.query.status) { const w = String(req.query.status).split(','); rows = rows.filter((o) => w.includes(o.status)); }
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      rows = rows.filter((o) => `${o.orderNumber} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(q));
    }
    if (req.query.from) rows = rows.filter((o) => o.createdAt >= req.query.from);
    if (req.query.to) rows = rows.filter((o) => o.createdAt <= req.query.to);
    if (req.query.needsAction === 'true') rows = rows.filter((o) => ['CREATED', 'CONFIRMED', 'PAID', 'PACKED'].includes(o.status));

    const sorted = applySort(rows, req.query.sort, ['createdAt', 'totalAmount', 'status', 'orderNumber'], 'createdAt:desc');
    const result = paginate(sorted, req.query, { defaultLimit: 25, maxLimit: 200 });
    res.json({
      data: result.data.map((o) => ({
        id: o.id, orderNumber: o.orderNumber, status: o.status,
        customerName: o.customerName, customerEmail: o.customerEmail,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        totalAmount: o.totalAmount, currency: o.currency,
        paymentMethod: o.paymentMethod, shippingMethodName: o.shippingMethodName,
        city: o.shippingAddress?.city, placedAt: o.placedAt, createdAt: o.createdAt, updatedAt: o.updatedAt,
        allowedTransitions: TRANSITIONS[o.status] ?? [],
      })),
      meta: result.meta,
    });
  } catch (err) { next(err); }
});

router.get('/orders/:id', requirePermission('order:read'), (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    res.json({ data: { ...order, allowedTransitions: TRANSITIONS[order.status] ?? [] } });
  } catch (err) { next(err); }
});

router.post('/orders/:id/status', requirePermission('order:update_status'), (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    const to = req.body?.status;
    if (!ORDER_STATUSES.includes(to)) throw unprocessable({ status: `Unknown status "${to}"` });
    const allowed = TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(to)) {
      throw conflict(`Cannot go from ${order.status} to ${to}. Allowed: ${allowed.join(', ') || 'none'}`, 'INVALID_TRANSITION');
    }
    const from = order.status;
    order.status = to;
    order.updatedAt = new Date().toISOString();
    if (to === 'SHIPPED' && !order.trackingNumber) {
      order.trackingNumber = `TRK${Math.floor(10000000 + Math.random() * 89999999)}`;
    }
    if (req.body.note) order.notes.push({ at: order.updatedAt, by: req.user.username, text: req.body.note });

    audit(req.user, 'order.status_changed', 'order', order.id, 'SUCCESS', req);
    emit(EVENTS.ORDER_STATUS_CHANGED, { id: order.id, orderNumber: order.orderNumber, from, to, trackingNumber: order.trackingNumber });
    res.json({ data: { ...order, allowedTransitions: TRANSITIONS[to] ?? [] } });
  } catch (err) { next(err); }
});

router.post('/orders/:id/refund', requirePermission('order:refund'), (req, res, next) => {
  try {
    const order = getIdx().orderById.get(req.params.id);
    if (!order) throw notFound('Order');
    if (!['PAID', 'DELIVERED', 'RETURNED', 'SHIPPED'].includes(order.status)) {
      throw conflict(`An order that is ${order.status} cannot be refunded`, 'NOT_REFUNDABLE');
    }
    const amount = Number(req.body?.amount ?? order.totalAmount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > order.totalAmount) {
      throw unprocessable({ amount: `Enter an amount between 1 and ${order.totalAmount}` });
    }
    const from = order.status;
    order.status = 'REFUNDED';
    order.refundedAmount = amount;
    order.updatedAt = new Date().toISOString();
    order.notes.push({ at: order.updatedAt, by: req.user.username, text: req.body?.reason ?? `Refunded ${amount}` });
    audit(req.user, 'order.refunded', 'order', order.id, 'SUCCESS', req);
    emit(EVENTS.ORDER_STATUS_CHANGED, { id: order.id, orderNumber: order.orderNumber, from, to: 'REFUNDED' });
    res.json({ data: order });
  } catch (err) { next(err); }
});

export { TRANSITIONS };
export default router;
