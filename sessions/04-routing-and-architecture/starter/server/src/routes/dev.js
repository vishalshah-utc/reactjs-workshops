/**
 * Workshop utilities. Not something you'd ship, entirely something a
 * workshop needs: a one-call reset when a lab goes sideways, a description of
 * the demo logins, and a simulator that fires real events so the S8 live
 * dashboard has traffic without anyone having to place orders by hand.
 */
import { Router } from 'express';
import { reset, getDb, getIdx } from '../db/store.js';
import { emit, EVENTS, connectionCount } from '../ws/index.js';
import { ROLE_PERMISSIONS } from '../lib/permissions.js';

const router = Router();

router.get('/health', (_req, res) => {
  const db = getDb();
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1048576),
    connections: connectionCount(),
    counts: {
      products: db.products.length, orders: db.orders.length, users: db.users.length,
      reviews: db.reviews.length, returns: db.returns.length, auditLog: db.auditLog.length,
    },
  });
});

router.post('/reset', (req, res) => {
  const meta = reset(req.body ?? {});
  res.json({ ok: true, meta });
});

/** Documented demo logins — the participant guide links straight here. */
router.get('/accounts', (_req, res) => {
  const idx = getIdx();
  const accounts = ['admin@shopcrew.dev', 'catalog@shopcrew.dev', 'fulfilment@shopcrew.dev', 'csr@shopcrew.dev', 'customer@shopcrew.dev']
    .map((email) => idx.userByEmail.get(email))
    .filter(Boolean)
    .map((u) => ({
      email: u.email, password: 'password', roles: u.roles,
      name: `${u.firstName} ${u.lastName}`.trim(),
      permissions: u.roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []).length,
      sees: u.roles.includes('CUSTOMER') && u.roles.length === 1 ? 'storefront + my account' : 'storefront + back-office',
    }));
  res.json({ data: accounts, note: 'Every seeded account uses the password "password".' });
});

/**
 * Fire synthetic events so Session 8's live wall has traffic during a lab
 * without ten people racing to place orders.
 *   POST /api/dev/simulate { events: 20, intervalMs: 800 }
 */
router.post('/simulate', (req, res) => {
  const total = Math.min(Number(req.body?.events ?? 10), 200);
  const intervalMs = Math.min(Math.max(Number(req.body?.intervalMs ?? 1000), 100), 10_000);
  const db = getDb();
  let fired = 0;

  const timer = setInterval(() => {
    const roll = Math.random();
    if (roll < 0.55) {
      const order = db.orders[Math.floor(Math.random() * Math.min(200, db.orders.length))];
      emit(EVENTS.ORDER_CREATED, {
        id: `ord_sim_${Date.now().toString(36)}`,
        orderNumber: `SC-9${String(Math.floor(Math.random() * 89999) + 10000)}`,
        status: 'CREATED', customerName: order.customerName,
        totalAmount: order.totalAmount, itemCount: order.items.length,
        placedAt: new Date().toISOString(), simulated: true,
      });
    } else if (roll < 0.85) {
      const product = db.products[Math.floor(Math.random() * db.products.length)];
      const variant = product.variants[0];
      emit(EVENTS.STOCK_CHANGED, {
        productId: product.id, productSlug: product.slug, variantId: variant.id,
        stockQuantity: Math.max(0, variant.stockQuantity - 1), productStock: Math.max(0, product.stockQuantity - 1), simulated: true,
      });
    } else {
      const order = db.orders[Math.floor(Math.random() * 200)];
      emit(EVENTS.ORDER_STATUS_CHANGED, { id: order.id, orderNumber: order.orderNumber, from: order.status, to: 'SHIPPED', simulated: true });
    }
    fired += 1;
    if (fired >= total) clearInterval(timer);
  }, intervalMs);
  timer.unref?.();

  res.json({ ok: true, scheduled: total, intervalMs, estimatedSeconds: Math.round((total * intervalMs) / 1000) });
});

router.post('/emit', (req, res) => {
  const event = emit(req.body?.type ?? 'debug.ping', req.body?.payload ?? {});
  res.json({ ok: true, event });
});

export default router;
