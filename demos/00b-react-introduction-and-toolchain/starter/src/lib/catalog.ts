/**
 * Pure functions over the catalogue. No DOM, no fetch, no React — data in,
 * new data out. That is exactly why Session 2's React app can import these
 * unchanged, and why they are trivial to test.
 */
import type { Product } from '../types';
import { formatPrice } from './format';

// ------------------------------------------------------------ unions & narrowing

/** `as const` freezes the array AND narrows its element type from `string` to the two literals. */
export const SORT_ORDERS = ['asc', 'desc'] as const;
/** Derived FROM the value, so the type and the runtime list can never drift apart. */
export type SortOrder = (typeof SORT_ORDERS)[number];

/** A hand-picked subset of `keyof Product` — the fields a user may sort by. */
export type SortKey = 'price' | 'rating' | 'title';

/** Indexed access: "whatever type `category` has on `Product`". Today `string`; if that changes, this follows. */
export type Category = Product['category'];

export type StockLabel = 'Out of stock' | 'Low stock' | 'In stock';

/** A `<select>` hands you a `string`; the rest of the code wants a `SortOrder`. `===` narrows. */
export function parseSortOrder(value: string): SortOrder {
  return value === 'desc' ? 'desc' : 'asc';
}

/** The return type is a literal union: a typo in a branch is a compile error, not a wrong badge. */
export function stockLabel(product: Product): StockLabel {
  if (product.stock === 0) return 'Out of stock';
  if (product.stock < 10) return 'Low stock';
  return 'In stock';
}

/** `??` defaults for null/undefined ONLY. `||` would also swallow '' — and 0, which is the bug JSX will show you. */
export function brandLabel(product: Product): string {
  return product.brand ?? 'Unbranded';
}

/** `?.` stops at the first missing link and yields undefined; `??` then supplies the fallback. */
export function tagLine(product: Product): string {
  return product.tags?.join(', ') ?? '';
}

// ------------------------------------------------------- shapes & immutability

/** What a card needs — nothing more. `Pick` names the subset once. */
export type ProductPreview = Pick<Product, 'id' | 'title' | 'thumbnail' | 'price'>;

/** What an edit form may send: any subset of these three fields. */
export type ProductPatch = Partial<Pick<Product, 'price' | 'stock' | 'discountPercentage'>>;

/** The list shape without the long text — what a list endpoint might return. */
export type ProductSummary = Omit<Product, 'description'>;

/** Destructure in the parameter list; `Readonly<Product>` promises the caller we will not touch it. */
export function toPreview({ id, title, thumbnail, price }: Readonly<Product>): ProductPreview {
  return { id, title, thumbnail, price };
}

/** A default INSIDE the destructuring pattern — `brand` is optional on Product, so it needs one. */
export function describeProduct({ title, brand = 'Unbranded', price }: Product): string {
  return `${title} by ${brand} — ${formatPrice(price)}`;
}

// The four updates you will write constantly. None of them touches its input:
// each hands back a NEW array, which is what a React state setter needs to see.

export function addProduct(products: readonly Product[], product: Product): Product[] {
  return [...products, product];
}

export function removeProduct(products: readonly Product[], id: number): Product[] {
  return products.filter((p) => p.id !== id);
}

/** Spread, then the patch: later keys win, so the patch overrides. Untouched items are the SAME objects. */
export function updateProduct(products: readonly Product[], id: number, patch: ProductPatch): Product[] {
  return products.map((p) => (p.id === id ? { ...p, ...patch } : p));
}

/** Toggle membership in a list of ids — the wishlist. */
export function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

// ------------------------------------------------------------- the array toolbox

export function filterByCategory(products: readonly Product[], category: Category | 'all'): Product[] {
  return category === 'all' ? [...products] : products.filter((p) => p.category === category);
}

export function searchProducts(products: readonly Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...products];
  return products.filter((p) => p.title.toLowerCase().includes(q) || p.category.includes(q));
}

/** `a[key]` is `string | number`; `typeof` narrows to the branch that can compare it. */
function compare(left: string | number, right: string | number): number {
  if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right);
  return Number(left) - Number(right);
}

/** `.sort()` MUTATES. Copy first — the caller's array is not ours to reorder. */
export function sortProducts(products: readonly Product[], key: SortKey, order: SortOrder = 'asc'): Product[] {
  const direction = order === 'asc' ? 1 : -1;
  return [...products].sort((a, b) => compare(a[key], b[key]) * direction);
}

/** `noUncheckedIndexedAccess`: `[0]` is `Product | undefined` — the type now says what the runtime always did. */
export function cheapest(products: readonly Product[]): Product | undefined {
  return sortProducts(products, 'price')[0];
}

/** `reduce` into an object keyed by category. `??=` creates the bucket on first sight — and satisfies the checker. */
export function groupByCategory(products: readonly Product[]): Record<Category, Product[]> {
  return products.reduce<Record<Category, Product[]>>((groups, product) => {
    (groups[product.category] ??= []).push(product);
    return groups;
  }, {});
}

/** A Set keeps one of each; spreading it back gives an array. */
export function categoriesOf(products: readonly Product[]): Category[] {
  return [...new Set(products.map((p) => p.category))];
}

/** `flatMap` = map + flatten one level: 194 arrays of tags → one array of tags. */
export function allTags(products: readonly Product[]): string[] {
  return [...new Set(products.flatMap((p) => p.tags ?? []))].sort();
}

export function totalStock(products: readonly Product[]): number {
  return products.reduce((sum, p) => sum + p.stock, 0);
}

/** A Map for O(1) lookup by id. `new Map(pairs)` — the constructor's signature gives the arrow its `[key, value]` tuple context. */
export function byId(products: readonly Product[]): Map<number, Product> {
  return new Map(products.map((p) => [p.id, p]));
}
