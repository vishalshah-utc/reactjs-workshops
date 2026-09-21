/**
 * The network boundary. Everything that crosses it is `unknown` until we say
 * otherwise, and every promise says what it resolves to. Demo 6 grows this
 * file into an axios instance with interceptors; the shapes stay.
 */
import type { Product } from './types';

export const API_BASE = 'https://dummyjson.com';

/** Exactly what GET /products returns — https://dummyjson.com/products?limit=2 */
export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** GET /products/categories returns these, not strings. */
export interface CategorySummary {
  slug: string;
  name: string;
  url: string;
}

/** An Error with the HTTP status attached. Demo 6 turns this into a class; the guard below keeps working. */
export interface ApiError extends Error {
  status: number;
}

export function apiError(status: number, message: string): ApiError {
  return Object.assign(new Error(message), { status });
}

/**
 * A TYPE GUARD. The return type `e is ApiError` tells TypeScript: when this
 * returns true, treat `e` as an ApiError from here on. `instanceof` and `in`
 * each narrow one step.
 */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && 'status' in e && typeof e.status === 'number';
}

interface ListOptions {
  /** 0 means "all of them" on DummyJSON. */
  limit?: number;
  skip?: number;
  signal?: AbortSignal;
}

export async function fetchProducts({ limit = 0, skip = 0, signal }: ListOptions = {}): Promise<ProductListResponse> {
  // URL + searchParams: no string concatenation, no forgotten encoding.
  const url = new URL('/products', API_BASE);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('skip', String(skip));

  const response = await fetch(url, { signal });
  // fetch only rejects on NETWORK failure. A 404 is a fulfilled promise — you check `ok` yourself.
  if (!response.ok) throw apiError(response.status, `GET ${url.pathname} failed`);

  // `json()` resolves to `any`. Naming the type here is a promise WE make about the
  // server, not a check. Demo 4's zod schemas turn the promise into a check.
  return (await response.json()) as ProductListResponse;
}

export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`, { signal });
  if (!response.ok) throw apiError(response.status, `Product ${id} not found`);
  return (await response.json()) as Product;
}

export async function fetchCategories(signal?: AbortSignal): Promise<CategorySummary[]> {
  const response = await fetch(`${API_BASE}/products/categories`, { signal });
  if (!response.ok) throw apiError(response.status, 'GET /products/categories failed');
  return (await response.json()) as CategorySummary[];
}

/** Two INDEPENDENT requests — start both, wait once. Sequential awaits would add the two latencies. */
export async function fetchCatalogue(signal?: AbortSignal) {
  const [list, categories] = await Promise.all([fetchProducts({ signal }), fetchCategories(signal)]);
  return { products: list.products, total: list.total, categories };
}

/** Derived from the function, so the type can never disagree with what the function returns. */
export type Catalogue = Awaited<ReturnType<typeof fetchCatalogue>>;
