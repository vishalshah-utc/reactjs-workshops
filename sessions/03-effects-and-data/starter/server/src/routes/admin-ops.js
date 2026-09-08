/**
 * Back-office part two: people, promotions, returns, audit, reports, settings.
 *
 * The audit endpoint is the S9 virtualization target — 50,000 rows, filterable
 * and sortable, deliberately returnable in pages of up to 1,000 so a naive
 * render is visibly slow before `@tanstack/react-virtual` fixes it.
 */
import { Router } from 'express';
import { getDb, getIdx, audit } from '../db/store.js';
import { paginate, applySort } from '../lib/pagination.js';
import { notFound, validate, rules, unprocessable, conflict, forbidden } from '../lib/errors.js';
import { requireAuth, requirePermission, requireStaff, publicUser, revokeAllForUser } from '../middleware/auth.js';
import { ROLE_PERMISSIONS } from '../lib/permissions.js';
import { RETURN_STATUSES } from '../db/seed.js';

const router = Router();
router.use(requireAuth, requireStaff);

// ---- customers -------------------------------------------------------------

router.get('/customers', requirePermission('customer:read'), (req, res, next) => {
  try {
    const idx = getIdx();
    let rows = getDb().users.filter((u) => u.roles.includes('CUSTOMER') && u.roles.length === 1);
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      rows = rows.filter((u) => `${u.firstName} ${u.lastName} ${u.email} ${u.username}`.toLowerCase().includes(q));
    }
    if (req.query.active) rows = rows.filter((u) => String(u.active) === req.query.active);

    const enriched = rows.map((u) => {
      const orders = idx.ordersByUserId.get(u.id) ?? [];
      const paid = orders.filter((o) => !['CANCELLED', 'REJECTED'].includes(o.status));
      return {
        id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email, username: u.username,
        phone: u.phone, active: u.active, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
        orderCount: paid.length,
        lifetimeValue: paid.reduce((s, o) => s + o.totalAmount, 0),
        lastOrderAt: orders[0]?.createdAt ?? null,
      };
    });
    const sorted = applySort(enriched, req.query.sort, ['name', 'createdAt', 'orderCount', 'lifetimeValue', 'lastOrderAt'], 'lifetimeValue:desc');
    res.json(paginate(sorted, req.query, { defaultLimit: 25, maxLimit: 200 }));
  } catch (err) { next(err); }
});

router.get('/customers/:id', requirePermission('customer:read'), (req, res, next) => {
  try {
    const idx = getIdx();
    const user = idx.userById.get(req.params.id);
    if (!user) throw notFound('Customer');
    const orders = idx.ordersByUserId.get(user.id) ?? [];
    res.json({
      data: {
        ...publicUser(user),
        addresses: idx.addressesByUserId.get(user.id) ?? [],
        stats: {
          orderCount: orders.length,
          lifetimeValue: orders.filter((o) => !['CANCELLED', 'REJECTED'].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0),
          returnCount: (idx.returnsByUserId.get(user.id) ?? []).length,
          reviewCount: getDb().reviews.filter((r) => r.userId === user.id).length,
        },
        recentOrders: orders.slice(0, 10).map((o) => ({
          id: o.id, orderNumber: o.orderNumber, status: o.status, totalAmount: o.totalAmount, createdAt: o.createdAt,
        })),
      },
    });
  } catch (err) { next(err); }
});

// ---- staff & roles ---------------------------------------------------------

router.get('/users', requirePermission('user:read'), (req, res, next) => {
  try {
    let rows = getDb().users.filter((u) => u.roles.some((r) => r !== 'CUSTOMER'));
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      rows = rows.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
    }
    if (req.query.role) rows = rows.filter((u) => u.roles.includes(req.query.role));
    res.json(paginate(rows.map((u) => publicUser(u)), req.query, { defaultLimit: 25 }));
  } catch (err) { next(err); }
});

router.get('/roles', requirePermission('user:read'), (_req, res) => {
  res.json({ data: Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({ role, permissions })) });
});

router.patch('/users/:id/roles', requirePermission('user:update_role'), (req, res, next) => {
  try {
    const user = getIdx().userById.get(req.params.id);
    if (!user) throw notFound('User');
    const roles = req.body?.roles;
    if (!Array.isArray(roles) || roles.length === 0) throw unprocessable({ roles: 'Choose at least one role' });
    const unknown = roles.filter((r) => !ROLE_PERMISSIONS[r]);
    if (unknown.length) throw unprocessable({ roles: `Unknown role(s): ${unknown.join(', ')}` });
    // Nobody demotes themselves out of admin — a real guard rail, and it gives
    // the UI a 403 worth rendering.
    if (user.id === req.user.id && user.roles.includes('ADMIN') && !roles.includes('ADMIN')) {
      throw forbidden('You cannot remove your own admin role');
    }
    user.roles = roles;
    revokeAllForUser(user.id);
    audit(req.user, 'user.role_changed', 'user', user.id, 'SUCCESS', req);
    res.json({ data: publicUser(user) });
  } catch (err) { next(err); }
});

router.patch('/users/:id/active', requirePermission('user:deactivate'), (req, res, next) => {
  try {
    const user = getIdx().userById.get(req.params.id);
    if (!user) throw notFound('User');
    if (user.id === req.user.id) throw forbidden('You cannot deactivate your own account');
    user.active = Boolean(req.body?.active);
    if (!user.active) revokeAllForUser(user.id);
    audit(req.user, user.active ? 'user.activated' : 'user.deactivated', 'user', user.id, 'SUCCESS', req);
    res.json({ data: publicUser(user) });
  } catch (err) { next(err); }
});

// ---- promotions ------------------------------------------------------------

const PROMO_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];

router.get('/promotions', requirePermission('promotion:read'), (req, res) => {
  const rows = getDb().promotions;
  res.json(paginate(applySort(rows, req.query.sort, ['code', 'usageCount', 'startsAt'], 'startsAt:desc'), req.query, { defaultLimit: 25 }));
});

router.post('/promotions', requirePermission('promotion:create'), (req, res, next) => {
  try {
    validate(req.body, {
      code: [rules.required('Code'), rules.minLen(3, 'Code'), rules.maxLen(24, 'Code')],
      name: [rules.required('Name'), rules.minLen(3, 'Name')],
      type: [rules.required('Type'), rules.oneOf(PROMO_TYPES, 'Type')],
      value: [rules.optional(rules.int('Value')), rules.optional(rules.min(0, 'Value'))],
    });
    const code = String(req.body.code).toUpperCase();
    if (getIdx().promotionByCode.has(code)) throw unprocessable({ code: 'That code already exists' });
    if (req.body.type === 'PERCENTAGE' && (Number(req.body.value) < 1 || Number(req.body.value) > 90)) {
      throw unprocessable({ value: 'A percentage discount must be between 1 and 90' });
    }
    if (req.body.startsAt && req.body.endsAt && Date.parse(req.body.endsAt) <= Date.parse(req.body.startsAt)) {
      throw unprocessable({ endsAt: 'End date must be after the start date' });
    }
    const promo = {
      id: `pro_live_${Date.now().toString(36)}`,
      code, name: req.body.name, type: req.body.type,
      value: Number(req.body.value ?? 0),
      minSubtotal: Number(req.body.minSubtotal ?? 0),
      maxDiscount: req.body.maxDiscount != null ? Number(req.body.maxDiscount) : null,
      active: req.body.active ?? true,
      startsAt: req.body.startsAt ?? new Date().toISOString(),
      endsAt: req.body.endsAt ?? null,
      usageLimit: req.body.usageLimit != null ? Number(req.body.usageLimit) : null,
      usageCount: 0,
      appliesTo: req.body.appliesTo ?? { type: 'ALL' },
    };
    getDb().promotions.push(promo);
    getIdx().promotionByCode.set(code, promo);
    audit(req.user, 'promotion.created', 'promotion', promo.id, 'SUCCESS', req);
    res.status(201).json({ data: promo });
  } catch (err) { next(err); }
});

router.patch('/promotions/:id', requirePermission('promotion:update'), (req, res, next) => {
  try {
    const promo = getDb().promotions.find((p) => p.id === req.params.id);
    if (!promo) throw notFound('Promotion');
    for (const f of ['name', 'value', 'minSubtotal', 'maxDiscount', 'active', 'startsAt', 'endsAt', 'usageLimit', 'appliesTo']) {
      if (req.body[f] !== undefined) promo[f] = req.body[f];
    }
    audit(req.user, req.body.active === false ? 'promotion.disabled' : 'promotion.updated', 'promotion', promo.id, 'SUCCESS', req);
    res.json({ data: promo });
  } catch (err) { next(err); }
});

router.delete('/promotions/:id', requirePermission('promotion:delete'), (req, res, next) => {
  try {
    const db = getDb();
    const promo = db.promotions.find((p) => p.id === req.params.id);
    if (!promo) throw notFound('Promotion');
    db.promotions = db.promotions.filter((p) => p.id !== promo.id);
    getIdx().promotionByCode.delete(promo.code);
    audit(req.user, 'promotion.deleted', 'promotion', promo.id, 'SUCCESS', req);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ---- returns ---------------------------------------------------------------

router.get('/returns', requirePermission('return:read'), (req, res) => {
  let rows = getDb().returns;
  if (req.query.status) { const w = String(req.query.status).split(','); rows = rows.filter((r) => w.includes(r.status)); }
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    rows = rows.filter((r) => `${r.rmaNumber} ${r.orderNumber} ${r.customerName}`.toLowerCase().includes(q));
  }
  res.json(paginate(applySort(rows, req.query.sort, ['createdAt', 'refundAmount', 'status'], 'createdAt:desc'), req.query, { defaultLimit: 25 }));
});

router.patch('/returns/:id', requirePermission('return:approve'), (req, res, next) => {
  try {
    const ret = getIdx().returnById.get(req.params.id);
    if (!ret) throw notFound('Return');
    const to = req.body?.status;
    if (!RETURN_STATUSES.includes(to)) throw unprocessable({ status: `Unknown status "${to}"` });
    if (ret.status === 'REFUNDED') throw conflict('This return has already been refunded', 'ALREADY_REFUNDED');
    if (to === 'REJECTED' && !req.body?.reason) throw unprocessable({ reason: 'Give a reason when rejecting a return' });

    ret.status = to;
    ret.reviewNote = req.body?.reason ?? ret.reviewNote ?? '';
    ret.updatedAt = new Date().toISOString();
    audit(req.user, to === 'APPROVED' ? 'return.approved' : to === 'REJECTED' ? 'return.rejected' : `return.${to.toLowerCase()}`, 'return', ret.id, 'SUCCESS', req);
    res.json({ data: ret });
  } catch (err) { next(err); }
});

// ---- audit log — the S9 virtualization target ------------------------------

router.get('/audit', requirePermission('audit:read'), (req, res) => {
  let rows = getDb().auditLog;
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    rows = rows.filter((a) => `${a.actorName} ${a.action} ${a.entityId ?? ''} ${a.ip}`.toLowerCase().includes(q));
  }
  if (req.query.action) { const w = String(req.query.action).split(','); rows = rows.filter((a) => w.includes(a.action)); }
  if (req.query.actorId) rows = rows.filter((a) => a.actorId === req.query.actorId);
  if (req.query.result) rows = rows.filter((a) => a.result === req.query.result);
  if (req.query.from) rows = rows.filter((a) => a.createdAt >= req.query.from);
  if (req.query.to) rows = rows.filter((a) => a.createdAt <= req.query.to);

  const sorted = applySort(rows, req.query.sort, ['createdAt', 'action', 'actorName'], 'createdAt:desc');
  // maxLimit is 1000 on purpose: participants must be able to ask for enough
  // rows that a naive <tr> render is visibly janky.
  res.json(paginate(sorted, req.query, { defaultLimit: 100, maxLimit: 1000 }));
});

router.get('/audit/actions', requirePermission('audit:read'), (_req, res) => {
  const counts = new Map();
  for (const a of getDb().auditLog) counts.set(a.action, (counts.get(a.action) ?? 0) + 1);
  res.json({ data: [...counts].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count) });
});

// ---- reports ---------------------------------------------------------------

router.get('/reports/summary', requirePermission('report:read'), (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const since = Date.now() - days * 86400000;
  const orders = getDb().orders.filter((o) => Date.parse(o.createdAt) >= since);
  const revenueOrders = orders.filter((o) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(o.status));
  const revenue = revenueOrders.reduce((s, o) => s + o.totalAmount, 0);

  const prevOrders = getDb().orders.filter((o) => {
    const t = Date.parse(o.createdAt);
    return t >= since - days * 86400000 && t < since;
  }).filter((o) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(o.status));
  const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);

  const pct = (now, before) => (before === 0 ? null : Number((((now - before) / before) * 100).toFixed(1)));

  res.json({
    data: {
      periodDays: days,
      revenue, revenueChangePct: pct(revenue, prevRevenue),
      orderCount: revenueOrders.length, orderCountChangePct: pct(revenueOrders.length, prevOrders.length),
      averageOrderValue: revenueOrders.length ? Math.round(revenue / revenueOrders.length) : 0,
      unitsSold: revenueOrders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
      cancellationRate: orders.length ? Number(((orders.filter((o) => o.status === 'CANCELLED').length / orders.length) * 100).toFixed(1)) : 0,
      returnRate: orders.length ? Number(((orders.filter((o) => ['RETURNED', 'REFUNDED'].includes(o.status)).length / orders.length) * 100).toFixed(1)) : 0,
      needsAction: getDb().orders.filter((o) => ['CREATED', 'CONFIRMED', 'PAID', 'PACKED'].includes(o.status)).length,
      lowStockCount: getDb().products.filter((p) => p.status === 'ACTIVE' && p.stockQuantity <= 10).length,
      openReturns: getDb().returns.filter((r) => ['REQUESTED', 'APPROVED', 'RECEIVED'].includes(r.status)).length,
    },
  });
});

router.get('/reports/revenue-series', requirePermission('report:read'), (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), { date: '', revenue: 0, orders: 0, units: 0 });
  }
  for (const [date, b] of buckets) b.date = date;
  for (const o of getDb().orders) {
    if (['CANCELLED', 'REJECTED', 'REFUNDED'].includes(o.status)) continue;
    const key = o.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += o.totalAmount;
    bucket.orders += 1;
    bucket.units += o.items.reduce((s, i) => s + i.quantity, 0);
  }
  res.json({ data: [...buckets.values()] });
});

router.get('/reports/top-products', requirePermission('report:read'), (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const since = Date.now() - days * 86400000;
  const tally = new Map();
  for (const o of getDb().orders) {
    if (Date.parse(o.createdAt) < since || ['CANCELLED', 'REJECTED'].includes(o.status)) continue;
    for (const i of o.items) {
      const row = tally.get(i.productId) ?? { productId: i.productId, name: i.productName, slug: i.productSlug, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += i.lineTotal;
      tally.set(i.productId, row);
    }
  }
  const limit = Math.min(Number(req.query.limit ?? 10), 100);
  res.json({ data: [...tally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit) });
});

router.get('/reports/by-category', requirePermission('report:read'), (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const since = Date.now() - days * 86400000;
  const idx = getIdx();
  const tally = new Map();
  for (const o of getDb().orders) {
    if (Date.parse(o.createdAt) < since || ['CANCELLED', 'REJECTED'].includes(o.status)) continue;
    for (const i of o.items) {
      const product = idx.productById.get(i.productId);
      if (!product) continue;
      const row = tally.get(product.parentCategoryId) ?? { categoryId: product.parentCategoryId, name: product.parentCategoryName, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += i.lineTotal;
      tally.set(product.parentCategoryId, row);
    }
  }
  res.json({ data: [...tally.values()].sort((a, b) => b.revenue - a.revenue) });
});

// ---- settings & feature flags ----------------------------------------------

const settings = {
  storeName: 'ShopCrew',
  supportEmail: 'support@shopcrew.dev',
  currency: 'INR',
  freeShippingThreshold: 149900,
  returnWindowDays: 30,
  taxRate: 0.18,
};

const flags = {
  'checkout.express-lane': { enabled: true, description: 'Skip the review step for returning customers' },
  'pdp.reviews': { enabled: true, description: 'Show reviews on the product page' },
  'pdp.related-products': { enabled: true, description: 'Show related products' },
  'storefront.wishlist': { enabled: true, description: 'Enable the wishlist' },
  'admin.bulk-actions': { enabled: true, description: 'Bulk edit in the product grid' },
  'storefront.live-stock': { enabled: false, description: 'Live stock counts over WebSocket' },
};

router.get('/settings', (_req, res) => res.json({ data: settings }));

router.patch('/settings', requirePermission('settings:update'), (req, res, next) => {
  try {
    for (const key of Object.keys(settings)) if (req.body[key] !== undefined) settings[key] = req.body[key];
    audit(req.user, 'settings.updated', 'settings', null, 'SUCCESS', req);
    res.json({ data: settings });
  } catch (err) { next(err); }
});

router.get('/flags', (_req, res) => {
  res.json({ data: Object.entries(flags).map(([key, v]) => ({ key, ...v })) });
});

router.patch('/flags/:key', requirePermission('flag:toggle'), (req, res, next) => {
  try {
    if (!flags[req.params.key]) throw notFound('Feature flag');
    flags[req.params.key].enabled = Boolean(req.body?.enabled);
    audit(req.user, 'feature_flag.toggled', 'flag', req.params.key, 'SUCCESS', req);
    res.json({ data: { key: req.params.key, ...flags[req.params.key] } });
  } catch (err) { next(err); }
});

export { flags as featureFlags, settings as storeSettings };
export default router;
