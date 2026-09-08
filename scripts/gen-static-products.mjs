/**
 * Generates the static product list the Session 1 and 2 starters import.
 *
 * Sessions 1–2 have no backend on purpose — they are about the component model
 * and local state, and a network layer would be noise. But the shape here is
 * EXACTLY the API's list shape, so Session 3's switch from
 * `import { products }` to `fetch('/api/products')` changes the source of the
 * data and nothing else.
 *
 *   node scripts/gen-static-products.mjs > sessions/01-foundations/solution/src/data/products.ts
 */
import { buildSeed } from '../api/src/db/seed.js';

const db = buildSeed();

// A hand-picked spread: several categories, a few on sale, a couple out of
// stock, one with no reviews. Session 1 Lab 3's conditional-rendering work
// needs all of those cases to actually exist in the data.
const wanted = ['laptops', 'headphones', 'smartphones', 'footwear', 'coffee-tea', 'cookware', 'watches', 'board-games'];
const picked = [];
for (const category of wanted) {
  const inCategory = db.products
    .filter((p) => p.status === 'ACTIVE' && p.categoryId === category && p.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount);
  picked.push(...inCategory.slice(0, 3));
}

const rows = picked.slice(0, 24).map((p, i) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brandName: p.brandName,
  categoryId: p.categoryId,
  categoryName: p.categoryName,
  price: p.price,
  // Force a predictable spread of edge cases into the first eight rows so
  // every conditional in Lab 3 has something to render.
  compareAtPrice: i % 4 === 1 ? Math.round(p.price * 1.28) : p.compareAtPrice,
  currency: p.currency,
  rating: i === 5 ? 0 : p.rating,
  reviewCount: i === 5 ? 0 : p.reviewCount,
  stockQuantity: i === 2 ? 0 : i === 7 ? 3 : p.stockQuantity,
  tags: i % 6 === 0 ? ['bestseller'] : i % 6 === 3 ? ['new'] : p.tags,
}));

const lines = [
  '/**',
  ' * A snapshot of the catalogue, bundled with the app.',
  ' *',
  ' * Sessions 1 and 2 have no backend — they are about components and local',
  ' * state, and a network layer would only be noise. The shape below is exactly',
  ' * what `GET /api/products` returns, so in Session 3 you replace this import',
  ' * with a fetch and nothing else has to change.',
  ' *',
  ' * Prices are integers in PAISE (minor units), never floats. ₹1,299.00 is',
  ' * 129900. Money in floating point is how you end up billing someone',
  ' * ₹0.30000000000000004.',
  ' */',
  "import type { Product } from '@/types';",
  '',
  'export const products: Product[] = [',
];
for (const r of rows) {
  lines.push('  {');
  for (const [k, v] of Object.entries(r)) {
    lines.push(`    ${k}: ${JSON.stringify(v)},`);
  }
  lines.push('  },');
}
lines.push('];', '');
process.stdout.write(lines.join('\n'));
