/**
 * In-memory store with the indexes the API actually queries by.
 *
 * WHY IN-MEMORY: this backend has to boot inside a StackBlitz WebContainer.
 * SQLite (better-sqlite3) is a native module and simply will not load there.
 * A plain object graph costs ~65 MB, boots in ~350 ms, and resets instantly
 * — which is exactly what a workshop wants.
 */
import { buildSeed } from './seed.js';

/** @type {ReturnType<typeof buildSeed>} */
let db;
/** @type {Record<string, Map<string, any>>} */
let idx;

function buildIndexes(data) {
  const group = (rows, key) => {
    const map = new Map();
    for (const row of rows) {
      const k = row[key];
      let bucket = map.get(k);
      if (!bucket) map.set(k, (bucket = []));
      bucket.push(row);
    }
    return map;
  };
  const by = (rows, key) => new Map(rows.map((r) => [r[key], r]));

  return {
    productById: by(data.products, 'id'),
    productBySlug: by(data.products, 'slug'),
    userById: by(data.users, 'id'),
    userByEmail: new Map(data.users.map((u) => [u.email.toLowerCase(), u])),
    userByUsername: new Map(data.users.map((u) => [u.username.toLowerCase(), u])),
    orderById: by(data.orders, 'id'),
    ordersByUserId: group(data.orders, 'userId'),
    reviewsByProductId: group(data.reviews, 'productId'),
    addressesByUserId: group(data.addresses, 'userId'),
    categoryById: by(data.categories, 'id'),
    brandById: by(data.brands, 'id'),
    returnById: by(data.returns, 'id'),
    returnsByUserId: group(data.returns, 'userId'),
    promotionByCode: new Map(data.promotions.map((p) => [p.code.toUpperCase(), p])),
  };
}

export function reset(options) {
  db = buildSeed(options);
  idx = buildIndexes(db);
  return db.meta;
}

export function getDb() {
  if (!db) reset();
  return db;
}

export function getIdx() {
  if (!idx) reset();
  return idx;
}

/**
 * Keep an index in sync after a mutation. Called explicitly rather than via
 * proxies/observers — a workshop backend that a participant might read should
 * be boring and obvious, not clever.
 */
export const index = {
  addProduct(product) {
    db.products.unshift(product);
    idx.productById.set(product.id, product);
    idx.productBySlug.set(product.slug, product);
    for (const v of product.variants) db.variantsById.set(v.id, v);
  },
  removeProduct(product) {
    db.products = db.products.filter((p) => p.id !== product.id);
    idx.productById.delete(product.id);
    idx.productBySlug.delete(product.slug);
    for (const v of product.variants) db.variantsById.delete(v.id);
  },
  reslugProduct(product, oldSlug) {
    if (oldSlug !== product.slug) {
      idx.productBySlug.delete(oldSlug);
      idx.productBySlug.set(product.slug, product);
    }
  },
  addUser(user) {
    db.users.push(user);
    idx.userById.set(user.id, user);
    idx.userByEmail.set(user.email.toLowerCase(), user);
    idx.userByUsername.set(user.username.toLowerCase(), user);
  },
  addOrder(order) {
    db.orders.unshift(order);
    idx.orderById.set(order.id, order);
    const bucket = idx.ordersByUserId.get(order.userId) ?? [];
    bucket.unshift(order);
    idx.ordersByUserId.set(order.userId, bucket);
  },
  addReview(review) {
    db.reviews.unshift(review);
    const bucket = idx.reviewsByProductId.get(review.productId) ?? [];
    bucket.unshift(review);
    idx.reviewsByProductId.set(review.productId, bucket);
  },
  addAddress(address) {
    db.addresses.push(address);
    const bucket = idx.addressesByUserId.get(address.userId) ?? [];
    bucket.push(address);
    idx.addressesByUserId.set(address.userId, bucket);
  },
  removeAddress(address) {
    db.addresses = db.addresses.filter((a) => a.id !== address.id);
    idx.addressesByUserId.set(
      address.userId,
      (idx.addressesByUserId.get(address.userId) ?? []).filter((a) => a.id !== address.id),
    );
  },
  addReturn(ret) {
    db.returns.unshift(ret);
    idx.returnById.set(ret.id, ret);
    const bucket = idx.returnsByUserId.get(ret.userId) ?? [];
    bucket.unshift(ret);
    idx.returnsByUserId.set(ret.userId, bucket);
  },
};

/** Recompute a product's aggregate stock from its variants. */
export function recomputeStock(product) {
  product.stockQuantity = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  return product.stockQuantity;
}

/** Recompute a product's rating from its published reviews. */
export function recomputeRating(productId) {
  const product = idx.productById.get(productId);
  if (!product) return;
  const published = (idx.reviewsByProductId.get(productId) ?? []).filter((r) => r.status === 'PUBLISHED');
  product.reviewCount = published.length;
  product.rating = published.length
    ? Number((published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(2))
    : 0;
}

let auditSeq = 0;
/** Append an audit entry. Every admin mutation in this API writes one. */
export function audit(actor, action, entityType, entityId, result = 'SUCCESS', req = null) {
  auditSeq += 1;
  const entry = {
    id: `aud_live_${String(auditSeq).padStart(6, '0')}`,
    actorId: actor?.id ?? null,
    actorName: actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'system',
    actorEmail: actor?.email ?? null,
    action, entityType, entityId,
    ip: req?.ip ?? '127.0.0.1',
    userAgent: req?.get?.('user-agent') ?? 'api',
    result,
    createdAt: new Date().toISOString(),
  };
  db.auditLog.unshift(entry);
  return entry;
}
