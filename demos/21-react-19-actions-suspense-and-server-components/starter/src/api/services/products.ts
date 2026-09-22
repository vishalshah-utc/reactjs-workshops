import { api } from '../client';
import { endpoints } from '../endpoints';
import type { ApiCategory, Product, ProductDraft, ProductListResponse, Review, StockLevel } from '../../types';

/** Only the fields the list UI renders — smaller payload, faster page. */
const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

interface RequestOptions {
  signal?: AbortSignal;
}

export interface ListProductsOptions extends RequestOptions {
  q?: string;
  category?: string;
  sortBy?: 'price' | 'rating' | '';
  order?: 'asc' | 'desc';
  /** 0-based. */
  page?: number;
  limit?: number;
}

/**
 * ONE entry point for the three list-shaped endpoints. Search wins over
 * category when both are given, which is what users expect.
 *
 * `undefined` params are DROPPED by axios (null and '' are not) — so we build
 * the object unconditionally and let undefined prune the empty filters.
 */
export async function listProducts({
  q = '',
  category = '',
  sortBy = '',
  order = 'asc',
  page = 0,
  limit = 12,
  signal,
}: ListProductsOptions = {}): Promise<ProductListResponse> {
  const params: Record<string, string | number | undefined> = {
    limit,
    skip: page * limit,
    select: LIST_FIELDS,
    sortBy: sortBy || undefined,
    order: sortBy ? order : undefined,
  };

  let url = endpoints.products.list();
  if (q) {
    url = endpoints.products.search();
    params.q = q;
  } else if (category) {
    url = endpoints.products.byCategory(category);
  }

  const { data } = await api.get<ProductListResponse>(url, { params, signal });
  return data;
}

/** Full record — no `select`; the detail view wants every field. */
export async function getProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.get<Product>(endpoints.products.detail(id), { signal });
  return data;
}

/** The reviews for one product, as a request of their OWN. */
// TODO(lab-2.1): GET the detail endpoint with `select: 'reviews'` and DummyJSON's own
// `delay` parameter, and return `data.reviews ?? []`. `delayMs` defaults to 0 — it is a
// teaching switch, so the caller has to ask for it.
export function getProductReviews(_id: number | string, _options: RequestOptions & { delayMs?: number } = {}): Promise<Review[]> {
  return Promise.resolve([]);
}

export async function listCategories({ signal }: RequestOptions = {}): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiCategory[]>(endpoints.products.categories(), { signal });
  return data;
}

// --- Writes. DummyJSON SIMULATES these: the response is real, persistence is not. ---

/**
 * POST — create. Returns the server's version: it has the real id.
 * The `Product` return type documents the contract a real API keeps; DummyJSON
 * only echoes the fields you sent, which is why the caller merges CARD_DEFAULTS.
 */
export async function createProduct(payload: ProductDraft, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.post<Product>(endpoints.products.create(), payload, { signal });
  return data;
}

/** PATCH — partial update. Only the fields you send change; never round-trip the whole object. */
export async function updateProduct(id: number | string, patch: Partial<ProductDraft>, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.patch<Product>(endpoints.products.update(id), patch, { signal });
  return data;
}

/** DELETE. DummyJSON echoes the product with isDeleted: true and a deletedOn timestamp. */
export async function deleteProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product & { isDeleted: boolean; deletedOn: string }> {
  const { data } = await api.delete<Product & { isDeleted: boolean; deletedOn: string }>(endpoints.products.remove(id), { signal });
  return data;
}

// --- Lab 6: the one field that is genuinely volatile. ---

/**
 * Stock for EVERY product, in one request.
 *
 * `select=id,stock` makes the payload about 4 kB instead of 400 — which is the
 * difference between a poll you can run every fifteen seconds and one you
 * cannot. Polling is not free; making the polled request small is most of what
 * makes it affordable.
 */
export async function listStock({ signal }: RequestOptions = {}): Promise<StockLevel[]> {
  const { data } = await api.get<{ products: StockLevel[] }>(endpoints.products.list(), {
    params: { limit: 0, select: 'id,stock' },
    signal,
  });
  return data.products;
}
