/**
 * Deterministic seed generator for the ShopCrew store.
 *
 * Everything here is derived from one fixed RNG seed, so every participant
 * sees identical data. Sizes are configurable through env vars so a
 * constrained environment can shrink the data set without code changes.
 *
 * MONEY: all amounts are integers in **minor units** (paise). Never floats.
 * Half the money bugs in real commerce code come from `0.1 + 0.2`.
 */
import { createRng, makeHelpers } from '../lib/rng.js';
import { hashPassword } from '../lib/password.js';
import {
  CATEGORIES, BRANDS, NAMING, PRICE_BANDS, VARIANT_AXES,
  REVIEW_TITLES, REVIEW_BODIES, CURRENCY, NOUN_PRICE_SCALE,
} from '../domain/catalog.js';

export const ROLES = ['CUSTOMER', 'CSR', 'CATALOG_MANAGER', 'FULFILMENT', 'ADMIN'];

/** Superset of the Java workshop's OrderStatus. First three names match it exactly. */
export const ORDER_STATUSES = [
  'CREATED', 'CONFIRMED', 'REJECTED',
  'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
];

export const RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'];

const DEMO_PASSWORD = 'password';

const FIRST_NAMES = ['Aarav','Diya','Rohan','Ananya','Kabir','Meera','Arjun','Isha','Vikram','Priya','Neha','Karan','Saanvi','Aditya','Riya','Nikhil','Tara','Farhan','Zoya','Rahul','Sneha','Aryan','Lakshmi','Imran','Divya','Manav','Pooja','Siddharth','Nandini','Vivek'];
const LAST_NAMES = ['Sharma','Iyer','Patel','Nair','Reddy','Gupta','Singh','Menon','Desai','Kulkarni','Banerjee','Chopra','Rao','Joshi','Malhotra','Pillai','Verma','Shah','Bose','Kaur'];
const CITIES = [
  { city: 'Bengaluru', state: 'Karnataka', pin: '560' }, { city: 'Mumbai', state: 'Maharashtra', pin: '400' },
  { city: 'Pune', state: 'Maharashtra', pin: '411' }, { city: 'Hyderabad', state: 'Telangana', pin: '500' },
  { city: 'Chennai', state: 'Tamil Nadu', pin: '600' }, { city: 'Delhi', state: 'Delhi', pin: '110' },
  { city: 'Gurugram', state: 'Haryana', pin: '122' }, { city: 'Kolkata', state: 'West Bengal', pin: '700' },
  { city: 'Ahmedabad', state: 'Gujarat', pin: '380' }, { city: 'Kochi', state: 'Kerala', pin: '682' },
  { city: 'Jaipur', state: 'Rajasthan', pin: '302' }, { city: 'Indore', state: 'Madhya Pradesh', pin: '452' },
];
const STREETS = ['MG Road','Residency Road','Church Street','Linking Road','FC Road','Banjara Hills','Anna Salai','Connaught Place','Park Street','CG Road','Marine Drive','Brigade Road'];
const AUDIT_ACTIONS = [
  'product.created','product.updated','product.archived','price.changed','stock.adjusted',
  'order.status_changed','order.refunded','order.cancelled','promotion.created','promotion.disabled',
  'user.role_changed','user.invited','user.deactivated','return.approved','return.rejected',
  'settings.updated','feature_flag.toggled','login.succeeded','login.failed','export.generated',
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const toMinor = (major) => Math.round(major * CURRENCY.minorPerMajor);

/** Prices ending in 99 read as retail prices; round ones read as test data. */
function retailRound(major) {
  if (major >= 10000) return Math.round(major / 1000) * 1000 - 1;
  if (major >= 1000) return Math.round(major / 100) * 100 - 1;
  return Math.max(29, Math.round(major / 10) * 10 - 1);
}

export function buildSeed(options = {}) {
  const counts = {
    products: Number(process.env.SEED_PRODUCTS ?? options.products ?? 5000),
    customers: Number(process.env.SEED_CUSTOMERS ?? options.customers ?? 2000),
    orders: Number(process.env.SEED_ORDERS ?? options.orders ?? 12000),
    reviews: Number(process.env.SEED_REVIEWS ?? options.reviews ?? 20000),
    audit: Number(process.env.SEED_AUDIT ?? options.audit ?? 50000),
  };

  const h = makeHelpers(createRng());
  const { int, pick, chance, weighted, pastDate, sample, shuffle } = h;

  // ---- categories & brands -------------------------------------------------
  const categories = [];
  for (const top of CATEGORIES) {
    categories.push({ id: top.slug, slug: top.slug, name: top.name, parentId: null });
    for (const child of top.children) {
      categories.push({ id: child.slug, slug: child.slug, name: child.name, parentId: top.slug });
    }
  }
  const subcategories = CATEGORIES.flatMap((t) => t.children.map((c) => ({ ...c, parent: t })));
  const brands = BRANDS.map((name) => ({ id: slugify(name), slug: slugify(name), name }));

  // ---- users ---------------------------------------------------------------
  // One hash, reused. Hashing 2,000 accounts individually costs ~20s of boot
  // time in a browser tab and buys nothing — every demo account shares the
  // same password anyway.
  const sharedHash = hashPassword(DEMO_PASSWORD);
  const users = [];
  let userSeq = 0;
  const addUser = (username, email, roles, extra = {}) => {
    userSeq += 1;
    const user = {
      id: `usr_${String(userSeq).padStart(6, '0')}`,
      username, email,
      passwordHash: sharedHash,
      roles,
      firstName: extra.firstName ?? username,
      lastName: extra.lastName ?? '',
      phone: extra.phone ?? `+91 9${int(100000000, 999999999)}`,
      avatarUrl: null,
      active: extra.active ?? true,
      createdAt: extra.createdAt ?? pastDate(900, 400),
      lastLoginAt: extra.lastLoginAt ?? pastDate(30),
    };
    users.push(user);
    return user;
  };

  const staff = [
    addUser('admin', 'admin@shopcrew.dev', ['ADMIN'], { firstName: 'Asha', lastName: 'Menon' }),
    addUser('catalog', 'catalog@shopcrew.dev', ['CATALOG_MANAGER'], { firstName: 'Rohit', lastName: 'Verma' }),
    addUser('fulfilment', 'fulfilment@shopcrew.dev', ['FULFILMENT'], { firstName: 'Nisha', lastName: 'Rao' }),
    addUser('csr', 'csr@shopcrew.dev', ['CSR'], { firstName: 'Imran', lastName: 'Sheikh' }),
  ];
  const demoCustomer = addUser('customer', 'customer@shopcrew.dev', ['CUSTOMER'], { firstName: 'Priya', lastName: 'Sharma' });

  for (let i = 0; i < counts.customers; i += 1) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const username = `${first.toLowerCase()}.${last.toLowerCase()}${i}`;
    addUser(username, `${username}@example.com`, ['CUSTOMER'], {
      firstName: first, lastName: last,
      active: chance(0.97),
      createdAt: pastDate(900, 1),
    });
  }
  const customers = users.filter((u) => u.roles.includes('CUSTOMER'));

  // ---- addresses -----------------------------------------------------------
  const addresses = [];
  let addrSeq = 0;
  const addAddress = (userId, isDefault) => {
    addrSeq += 1;
    const loc = pick(CITIES);
    const user = users.find((u) => u.id === userId);
    const address = {
      id: `adr_${String(addrSeq).padStart(6, '0')}`,
      userId,
      label: pick(['Home', 'Work', 'Other']),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      line1: `${int(1, 480)}, ${pick(STREETS)}`,
      line2: chance(0.4) ? `${pick(['Apt', 'Flat', 'Unit'])} ${int(1, 40)}${pick(['A', 'B', 'C', ''])}` : '',
      city: loc.city, state: loc.state, country: 'India',
      postalCode: `${loc.pin}${int(100, 999)}`,
      phone: user.phone,
      isDefault,
    };
    addresses.push(address);
    return address;
  };
  addAddress(demoCustomer.id, true);
  addAddress(demoCustomer.id, false);
  for (const c of customers) {
    if (c.id === demoCustomer.id) continue;
    if (chance(0.85)) addAddress(c.id, true);
    if (chance(0.2)) addAddress(c.id, false);
  }

  // ---- products & variants -------------------------------------------------
  const products = [];
  const variantsById = new Map();
  const usedSlugs = new Set();
  for (let i = 0; i < counts.products; i += 1) {
    const sub = pick(subcategories);
    const naming = NAMING[sub.slug];
    const brand = pick(brands);
    const line = pick(naming.line);
    const model = pick(naming.model);
    const noun = pick(naming.noun);
    const name = [brand.name, line, model, noun].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${i}`;
    usedSlugs.add(slug);

    const [lo, hi] = PRICE_BANDS[sub.slug];
    const nounScale = NOUN_PRICE_SCALE[noun] ?? 1;
    const basePriceMajor = retailRound((lo + (hi - lo) * Math.pow(h.rng(), 1.8)) * nounScale);
    const price = toMinor(basePriceMajor);
    const onSale = chance(0.22);
    const compareAtPrice = onSale ? toMinor(retailRound(basePriceMajor * (1 + h.float(0.12, 0.45)))) : null;

    const axes = VARIANT_AXES[sub.slug];
    const variants = [];
    const id = `prd_${String(i + 1).padStart(6, '0')}`;
    if (axes) {
      // Cartesian product of the axes, capped so a 5×4 apparel item doesn't
      // explode the seed. The admin variant matrix in S7 edits exactly this.
      let combos = [[]];
      for (const axis of axes) {
        combos = combos.flatMap((combo) => axis.values.map((v) => [...combo, { name: axis.name, value: v }]));
      }
      for (const [vi, combo] of shuffle(combos).slice(0, 12).entries()) {
        const delta = toMinor(int(-3, 8) * Math.max(1, Math.round(basePriceMajor * 0.02)));
        variants.push({
          id: `${id}_v${vi + 1}`,
          productId: id,
          sku: `${brand.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(5, '0')}-${vi + 1}`,
          options: combo,
          price: Math.max(toMinor(29), price + delta),
          stockQuantity: weighted([[0, 1], [int(1, 4), 2], [int(5, 40), 6], [int(41, 220), 3]]),
          active: chance(0.95),
        });
      }
    } else {
      variants.push({
        id: `${id}_v1`, productId: id,
        sku: `${brand.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(5, '0')}-1`,
        options: [], price,
        stockQuantity: weighted([[0, 1], [int(1, 4), 2], [int(5, 60), 6], [int(61, 300), 3]]),
        active: true,
      });
    }
    for (const v of variants) variantsById.set(v.id, v);

    const createdAt = pastDate(720, 1);
    products.push({
      id,
      sku: `${brand.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(5, '0')}`,
      slug, name,
      description:
        `${name} from ${brand.name}. ${pick([
          'Designed for everyday use and built to last.',
          'A considered update to a long-running favourite.',
          'Balanced performance at a sensible price.',
          'Straightforward, well made, and easy to live with.',
          'Chosen by our buyers for its finish and durability.',
        ])} ${pick([
          'Ships in recyclable packaging.',
          'Covered by a two-year manufacturer warranty.',
          'Free returns within 30 days.',
          'Dispatched within 24 hours on weekdays.',
        ])}`,
      brandId: brand.id, brandName: brand.name,
      categoryId: sub.slug, categoryName: sub.name,
      parentCategoryId: sub.parent.slug, parentCategoryName: sub.parent.name,
      currency: CURRENCY.code,
      price, compareAtPrice,
      stockQuantity: variants.reduce((sum, v) => sum + v.stockQuantity, 0),
      images: Array.from({ length: int(1, 4) }, (_, k) => ({
        url: `/api/images/${slug}-${k + 1}.svg`,
        alt: `${name} — view ${k + 1}`,
      })),
      rating: 0, reviewCount: 0,
      tags: sample(['new', 'bestseller', 'eco', 'limited', 'staff-pick', 'clearance'], int(0, 2)),
      attributes: { warranty: pick(['1 year', '2 years', '6 months', 'None']), origin: pick(['India', 'Vietnam', 'China', 'Germany', 'Japan']) },
      variants,
      status: weighted([['ACTIVE', 92], ['DRAFT', 5], ['ARCHIVED', 3]]),
      createdAt, updatedAt: createdAt,
    });
  }
  const activeProducts = products.filter((p) => p.status === 'ACTIVE');

  // ---- reviews -------------------------------------------------------------
  // Reviews cluster on popular products in a real store. A flat spread gives
  // every product ~4 reviews, which makes the PDP review section look fake and
  // gives the S5 pagination lab nothing to paginate.
  const hotProducts = sample(activeProducts, Math.min(300, activeProducts.length));
  const reviews = [];
  for (let i = 0; i < counts.reviews; i += 1) {
    const product = chance(0.55) ? pick(hotProducts) : pick(activeProducts);
    const author = pick(customers);
    // Real rating distributions are heavily left-skewed toward 5.
    const rating = weighted([[5, 50], [4, 26], [3, 12], [2, 7], [1, 5]]);
    reviews.push({
      id: `rev_${String(i + 1).padStart(6, '0')}`,
      productId: product.id,
      userId: author.id,
      authorName: `${author.firstName} ${author.lastName[0] ?? ''}.`.trim(),
      rating,
      title: pick(REVIEW_TITLES),
      body: pick(REVIEW_BODIES),
      verifiedPurchase: chance(0.72),
      helpfulCount: weighted([[0, 6], [int(1, 5), 3], [int(6, 40), 1]]),
      status: weighted([['PUBLISHED', 94], ['PENDING', 4], ['REJECTED', 2]]),
      createdAt: pastDate(540, 1),
    });
  }
  // Roll ratings up onto products.
  const agg = new Map();
  for (const r of reviews) {
    if (r.status !== 'PUBLISHED') continue;
    const cur = agg.get(r.productId) ?? { sum: 0, n: 0 };
    cur.sum += r.rating; cur.n += 1;
    agg.set(r.productId, cur);
  }
  for (const p of products) {
    const a = agg.get(p.id);
    p.rating = a ? Number((a.sum / a.n).toFixed(2)) : 0;
    p.reviewCount = a ? a.n : 0;
  }

  // ---- promotions ----------------------------------------------------------
  const promotions = [
    { id: 'pro_000001', code: 'WELCOME10', name: 'Welcome 10%', type: 'PERCENTAGE', value: 10, minSubtotal: toMinor(999), maxDiscount: toMinor(2000), active: true, startsAt: pastDate(400, 300), endsAt: null, usageLimit: null, usageCount: int(400, 900), appliesTo: { type: 'ALL' } },
    { id: 'pro_000002', code: 'FREESHIP', name: 'Free shipping over ₹1,499', type: 'FREE_SHIPPING', value: 0, minSubtotal: toMinor(1499), maxDiscount: null, active: true, startsAt: pastDate(400, 300), endsAt: null, usageLimit: null, usageCount: int(900, 2000), appliesTo: { type: 'ALL' } },
    { id: 'pro_000003', code: 'TECH500', name: '₹500 off electronics', type: 'FIXED', value: toMinor(500), minSubtotal: toMinor(4999), maxDiscount: null, active: true, startsAt: pastDate(120, 60), endsAt: null, usageLimit: 5000, usageCount: int(100, 800), appliesTo: { type: 'CATEGORY', categoryId: 'electronics' } },
    { id: 'pro_000004', code: 'DIWALI25', name: 'Festive 25%', type: 'PERCENTAGE', value: 25, minSubtotal: toMinor(2500), maxDiscount: toMinor(5000), active: false, startsAt: pastDate(320, 300), endsAt: pastDate(299, 280), usageLimit: 10000, usageCount: int(3000, 9000), appliesTo: { type: 'ALL' } },
    { id: 'pro_000005', code: 'BOOKS15', name: '15% off books', type: 'PERCENTAGE', value: 15, minSubtotal: 0, maxDiscount: toMinor(400), active: true, startsAt: pastDate(200, 100), endsAt: null, usageLimit: null, usageCount: int(50, 400), appliesTo: { type: 'CATEGORY', categoryId: 'books-media' } },
  ];

  // ---- orders --------------------------------------------------------------
  const SHIPPING_METHODS = [
    { id: 'standard', name: 'Standard (4–6 days)', price: toMinor(49) },
    { id: 'express', name: 'Express (2 days)', price: toMinor(149) },
    { id: 'sameday', name: 'Same day (metro only)', price: toMinor(299) },
  ];
  const TAX_RATE = 0.18; // GST

  const orders = [];
  for (let i = 0; i < counts.orders; i += 1) {
    // Weight the demo customer heavily so their order history is worth looking at.
    const customer = chance(0.003) ? demoCustomer : pick(customers);
    const custAddresses = addresses.filter((a) => a.userId === customer.id);
    const shipTo = custAddresses.length ? pick(custAddresses) : addAddress(customer.id, true);

    const lineCount = weighted([[1, 45], [2, 28], [3, 15], [4, 8], [5, 4]]);
    const items = [];
    let subtotal = 0;
    for (let li = 0; li < lineCount; li += 1) {
      const product = pick(activeProducts);
      const variant = pick(product.variants);
      const quantity = weighted([[1, 70], [2, 20], [3, 7], [4, 3]]);
      const unitPrice = variant.price;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      items.push({
        id: `oit_${String(orders.length + 1).padStart(6, '0')}_${li + 1}`,
        productId: product.id, productName: product.name, productSlug: product.slug,
        variantId: variant.id, sku: variant.sku,
        options: variant.options,
        imageUrl: product.images[0].url,
        quantity, unitPrice, discount: 0, lineTotal,
      });
    }

    const promo = chance(0.28) ? pick(promotions.filter((p) => p.active)) : null;
    let discount = 0;
    if (promo && subtotal >= promo.minSubtotal) {
      if (promo.type === 'PERCENTAGE') discount = Math.min(Math.round((subtotal * promo.value) / 100), promo.maxDiscount ?? Infinity);
      else if (promo.type === 'FIXED') discount = Math.min(promo.value, subtotal);
    }
    const shippingMethod = pick(SHIPPING_METHODS);
    const shipping = promo?.type === 'FREE_SHIPPING' && subtotal >= promo.minSubtotal ? 0 : shippingMethod.price;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * TAX_RATE);
    const totalAmount = taxable + tax + shipping;

    // Skewed, not uniform: a real store's order history thickens toward the
    // present, and a uniform spread over 540 days leaves ~20 orders in flight
    // — not enough for the S8 live-orders wall or an admin "needs action" queue.
    const ageDays = 540 * Math.pow(h.rng(), 2.6);
    const createdAt = new Date(Date.now() - ageDays * 86400000).toISOString();
    // Recent orders are still in flight; old ones have settled.
    const status = ageDays < 1
      ? weighted([['CREATED', 4], ['CONFIRMED', 3], ['PAID', 3]])
      : ageDays < 4
        ? weighted([['PAID', 3], ['PACKED', 4], ['SHIPPED', 4], ['CANCELLED', 1]])
        : ageDays < 10
          ? weighted([['SHIPPED', 4], ['DELIVERED', 10], ['CANCELLED', 1], ['REJECTED', 1]])
          : weighted([['DELIVERED', 40], ['RETURNED', 3], ['REFUNDED', 2], ['CANCELLED', 2], ['REJECTED', 1]]);

    orders.push({
      id: `ord_${String(i + 1).padStart(6, '0')}`,
      orderNumber: `SC-${String(100000 + i)}`,
      userId: customer.id,
      customerUsername: customer.username,
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      status,
      items,
      currency: CURRENCY.code,
      subtotal, discount, tax, shipping, totalAmount,
      promotionCode: discount > 0 || shipping === 0 ? promo?.code ?? null : null,
      shippingAddress: { ...shipTo },
      billingAddress: { ...shipTo },
      shippingMethod: shippingMethod.id,
      shippingMethodName: shippingMethod.name,
      paymentMethod: weighted([['CARD', 5], ['UPI', 6], ['NETBANKING', 2], ['COD', 2]]),
      trackingNumber: ['SHIPPED', 'DELIVERED', 'RETURNED'].includes(status) ? `TRK${int(10000000, 99999999)}` : null,
      placedAt: createdAt,
      createdAt,
      updatedAt: pastDate(Math.max(0.1, ageDays)),
      notes: [],
    });
  }
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ---- returns -------------------------------------------------------------
  const returns = [];
  const returnable = orders.filter((o) => ['DELIVERED', 'RETURNED', 'REFUNDED'].includes(o.status));
  for (const [i, order] of sample(returnable, Math.min(600, returnable.length)).entries()) {
    const item = pick(order.items);
    returns.push({
      id: `ret_${String(i + 1).padStart(6, '0')}`,
      rmaNumber: `RMA-${String(50000 + i)}`,
      orderId: order.id, orderNumber: order.orderNumber,
      userId: order.userId, customerName: order.customerName,
      items: [{ orderItemId: item.id, productName: item.productName, sku: item.sku, quantity: 1, refundAmount: item.unitPrice }],
      reason: pick(['Wrong size', 'Damaged on arrival', 'Not as described', 'Changed my mind', 'Faulty', 'Late delivery']),
      comment: pick(['Please arrange a pickup.', 'Box was crushed.', 'Colour differs from the photos.', '', 'Stopped working after two days.']),
      photos: chance(0.5) ? [`/api/images/return-${i + 1}.svg`] : [],
      status: weighted([['REQUESTED', 3], ['APPROVED', 3], ['RECEIVED', 2], ['REFUNDED', 4], ['REJECTED', 1]]),
      refundAmount: item.unitPrice,
      createdAt: pastDate(200, 0),
      updatedAt: pastDate(30, 0),
    });
  }

  // ---- audit log -----------------------------------------------------------
  const auditLog = [];
  for (let i = 0; i < counts.audit; i += 1) {
    const actor = pick(staff);
    const action = pick(AUDIT_ACTIONS);
    auditLog.push({
      id: `aud_${String(i + 1).padStart(7, '0')}`,
      actorId: actor.id, actorName: `${actor.firstName} ${actor.lastName}`.trim(), actorEmail: actor.email,
      action,
      entityType: action.split('.')[0],
      entityId: action.startsWith('product') ? pick(products).id
        : action.startsWith('order') ? pick(orders).id
        : action.startsWith('user') ? pick(customers).id
        : null,
      ip: `10.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
      userAgent: pick(['Chrome/141 macOS', 'Firefox/144 Windows', 'Safari/26 macOS', 'Edge/141 Windows']),
      result: weighted([['SUCCESS', 94], ['FAILURE', 6]]),
      createdAt: pastDate(365, 0),
    });
  }
  auditLog.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    meta: { seededAt: new Date().toISOString(), counts, demoPassword: DEMO_PASSWORD, currency: CURRENCY },
    categories, brands, users, addresses, products, variantsById,
    reviews, promotions, orders, returns, auditLog,
    carts: new Map(), refreshTokens: new Map(), uploads: new Map(),
    shippingMethods: SHIPPING_METHODS, taxRate: TAX_RATE,
  };
}
