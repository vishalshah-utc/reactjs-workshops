/**
 * Public catalog: listing, faceting, search, PDP, reviews.
 *
 * The listing endpoint deliberately accepts exactly the query params that
 * Session 4's `useSearchParams` lab puts in the URL, so the URL and the API
 * contract are the same vocabulary:
 *
 *   /api/products?q=laptop&category=laptops&brand=aurelia,kestrel
 *                &minPrice=40000&maxPrice=120000&rating=4&inStock=true
 *                &sort=price:asc&page=2&limit=24
 */
import { Router } from 'express';
import { getDb, getIdx, index, recomputeRating } from '../db/store.js';
import { paginate, paginateCursor, applySort } from '../lib/pagination.js';
import { notFound, validate, rules, conflict } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { CURRENCY } from '../domain/catalog.js';

const router = Router();

const SORTABLE = ['price', 'name', 'rating', 'createdAt', 'reviewCount', 'stockQuantity'];
const csv = (v) => (v ? String(v).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : []);

/** The one filter function both the listing and the facet-count endpoint use. */
function filterProducts(all, query, { skipKey = null } = {}) {
  const q = String(query.q ?? '').trim().toLowerCase();
  const categories = csv(query.category);
  const brands = csv(query.brand);
  const tags = csv(query.tag);
  const minPrice = query.minPrice != null ? Number(query.minPrice) * CURRENCY.minorPerMajor : null;
  const maxPrice = query.maxPrice != null ? Number(query.maxPrice) * CURRENCY.minorPerMajor : null;
  const minRating = query.rating != null ? Number(query.rating) : null;
  const inStock = query.inStock === 'true';
  const onSale = query.onSale === 'true';

  return all.filter((p) => {
    if (p.status !== 'ACTIVE') return false;
    if (q && !(`${p.name} ${p.brandName} ${p.categoryName} ${p.sku}`.toLowerCase().includes(q))) return false;
    if (skipKey !== 'category' && categories.length
      && !categories.includes(p.categoryId) && !categories.includes(p.parentCategoryId)) return false;
    if (skipKey !== 'brand' && brands.length && !brands.includes(p.brandId)) return false;
    if (skipKey !== 'tag' && tags.length && !tags.some((t) => p.tags.includes(t))) return false;
    if (skipKey !== 'price' && minPrice != null && p.price < minPrice) return false;
    if (skipKey !== 'price' && maxPrice != null && p.price > maxPrice) return false;
    if (skipKey !== 'rating' && minRating != null && p.rating < minRating) return false;
    if (inStock && p.stockQuantity <= 0) return false;
    if (onSale && !p.compareAtPrice) return false;
    return true;
  });
}

/** Trim the PDP-only fields off list rows — smaller payload, and it makes the
 *  "list model vs detail model" distinction concrete for participants. */
const toListItem = (p) => ({
  id: p.id, sku: p.sku, slug: p.slug, name: p.name,
  brandId: p.brandId, brandName: p.brandName,
  categoryId: p.categoryId, categoryName: p.categoryName,
  parentCategoryId: p.parentCategoryId,
  currency: p.currency, price: p.price, compareAtPrice: p.compareAtPrice,
  rating: p.rating, reviewCount: p.reviewCount,
  stockQuantity: p.stockQuantity, inStock: p.stockQuantity > 0,
  image: p.images[0], tags: p.tags,
});

router.get('/products', (req, res, next) => {
  try {
    const filtered = filterProducts(getDb().products, req.query);
    const sorted = applySort(filtered, req.query.sort, SORTABLE, 'reviewCount:desc');
    const result = paginate(sorted, req.query, { defaultLimit: 24, maxLimit: 100 });
    res.json({ data: result.data.map(toListItem), meta: result.meta });
  } catch (err) { next(err); }
});

/** Cursor variant — what `useInfiniteQuery` talks to in Session 5 Lab 4. */
router.get('/products/cursor', (req, res, next) => {
  try {
    const filtered = filterProducts(getDb().products, req.query);
    const sorted = applySort(filtered, req.query.sort, SORTABLE, 'reviewCount:desc');
    const result = paginateCursor(sorted, req.query, { defaultLimit: 24, maxLimit: 100 });
    res.json({ data: result.data.map(toListItem), meta: result.meta });
  } catch (err) { next(err); }
});

/**
 * Facet counts for the filter sidebar.
 *
 * Each facet is counted against the OTHER active filters but not its own —
 * so ticking a second brand still shows how many products that brand has,
 * instead of collapsing to zero. Getting this wrong is the classic faceted
 * search bug, so the API models it correctly and the lab discusses why.
 */
router.get('/products/facets', (req, res, next) => {
  try {
    const all = getDb().products;
    const countBy = (rows, key) => {
      const map = new Map();
      for (const r of rows) map.set(r[key], (map.get(r[key]) ?? 0) + 1);
      return map;
    };
    const forCategory = filterProducts(all, req.query, { skipKey: 'category' });
    const forBrand = filterProducts(all, req.query, { skipKey: 'brand' });
    const forRating = filterProducts(all, req.query, { skipKey: 'rating' });
    const forPrice = filterProducts(all, req.query, { skipKey: 'price' });

    const catCounts = countBy(forCategory, 'categoryId');
    const parentCounts = countBy(forCategory, 'parentCategoryId');
    const brandCounts = countBy(forBrand, 'brandId');

    const prices = forPrice.map((p) => p.price).sort((a, b) => a - b);

    res.json({
      categories: getDb().categories.map((c) => ({
        id: c.id, name: c.name, parentId: c.parentId,
        count: (c.parentId ? catCounts.get(c.id) : parentCounts.get(c.id)) ?? 0,
      })).filter((c) => c.count > 0),
      brands: getDb().brands.map((b) => ({ id: b.id, name: b.name, count: brandCounts.get(b.id) ?? 0 }))
        .filter((b) => b.count > 0).sort((a, b) => b.count - a.count),
      ratings: [4, 3, 2, 1].map((r) => ({ rating: r, count: forRating.filter((p) => p.rating >= r).length })),
      price: {
        min: prices.length ? Math.floor(prices[0] / CURRENCY.minorPerMajor) : 0,
        max: prices.length ? Math.ceil(prices[prices.length - 1] / CURRENCY.minorPerMajor) : 0,
        currency: CURRENCY.code,
      },
      total: filterProducts(all, req.query).length,
    });
  } catch (err) { next(err); }
});

router.get('/products/:idOrSlug', (req, res, next) => {
  try {
    const idx = getIdx();
    const product = idx.productBySlug.get(req.params.idOrSlug) ?? idx.productById.get(req.params.idOrSlug);
    if (!product) throw notFound('Product');
    res.json({ data: { ...product, inStock: product.stockQuantity > 0 } });
  } catch (err) { next(err); }
});

router.get('/products/:idOrSlug/related', (req, res, next) => {
  try {
    const idx = getIdx();
    const product = idx.productBySlug.get(req.params.idOrSlug) ?? idx.productById.get(req.params.idOrSlug);
    if (!product) throw notFound('Product');
    const limit = Math.min(Number.parseInt(req.query.limit ?? '8', 10) || 8, 24);
    const related = getDb().products
      .filter((p) => p.id !== product.id && p.status === 'ACTIVE' && p.categoryId === product.categoryId)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit)
      .map(toListItem);
    res.json({ data: related });
  } catch (err) { next(err); }
});

router.get('/products/:idOrSlug/reviews', (req, res, next) => {
  try {
    const idx = getIdx();
    const product = idx.productBySlug.get(req.params.idOrSlug) ?? idx.productById.get(req.params.idOrSlug);
    if (!product) throw notFound('Product');
    let rows = (idx.reviewsByProductId.get(product.id) ?? []).filter((r) => r.status === 'PUBLISHED');
    if (req.query.rating) rows = rows.filter((r) => r.rating === Number(req.query.rating));
    const sorted = applySort(rows, req.query.sort, ['createdAt', 'rating', 'helpfulCount'], 'createdAt:desc');
    const result = paginate(sorted, req.query, { defaultLimit: 10, maxLimit: 50 });
    const histogram = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: (idx.reviewsByProductId.get(product.id) ?? []).filter((x) => x.status === 'PUBLISHED' && x.rating === r).length,
    }));
    res.json({ ...result, summary: { rating: product.rating, reviewCount: product.reviewCount, histogram } });
  } catch (err) { next(err); }
});

router.post('/products/:idOrSlug/reviews', requireAuth, (req, res, next) => {
  try {
    const idx = getIdx();
    const product = idx.productBySlug.get(req.params.idOrSlug) ?? idx.productById.get(req.params.idOrSlug);
    if (!product) throw notFound('Product');
    validate(req.body, {
      rating: [rules.required('Rating'), rules.int('Rating'), rules.min(1, 'Rating'),
        (v) => (Number(v) > 5 ? 'Rating must be between 1 and 5' : null)],
      title: [rules.required('Title'), rules.minLen(4, 'Title'), rules.maxLen(120, 'Title')],
      body: [rules.required('Review'), rules.minLen(20, 'Review'), rules.maxLen(2000, 'Review')],
    });
    const existing = (idx.reviewsByProductId.get(product.id) ?? []).find((r) => r.userId === req.user.id);
    if (existing) throw conflict('You have already reviewed this product', 'ALREADY_REVIEWED');

    const purchased = (idx.ordersByUserId.get(req.user.id) ?? [])
      .some((o) => o.items.some((i) => i.productId === product.id));

    const review = {
      id: `rev_live_${Date.now().toString(36)}`,
      productId: product.id,
      userId: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName[0] ?? ''}.`.trim(),
      rating: Number(req.body.rating),
      title: req.body.title,
      body: req.body.body,
      verifiedPurchase: purchased,
      helpfulCount: 0,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };
    index.addReview(review);
    recomputeRating(product.id);
    res.status(201).json({ data: review });
  } catch (err) { next(err); }
});

router.get('/categories', (_req, res) => {
  const db = getDb();
  const counts = new Map();
  for (const p of db.products) {
    if (p.status !== 'ACTIVE') continue;
    counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    counts.set(p.parentCategoryId, (counts.get(p.parentCategoryId) ?? 0) + 1);
  }
  const tops = db.categories.filter((c) => !c.parentId).map((c) => ({
    ...c, count: counts.get(c.id) ?? 0,
    children: db.categories.filter((x) => x.parentId === c.id).map((x) => ({ ...x, count: counts.get(x.id) ?? 0 })),
  }));
  res.json({ data: tops });
});

router.get('/brands', (_req, res) => {
  const db = getDb();
  const counts = new Map();
  for (const p of db.products) if (p.status === 'ACTIVE') counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);
  res.json({ data: db.brands.map((b) => ({ ...b, count: counts.get(b.id) ?? 0 })).sort((a, b) => b.count - a.count) });
});

export default router;
