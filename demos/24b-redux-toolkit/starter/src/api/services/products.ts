import { api } from '../client';
import { env } from '../../config/env';
import { endpoints } from '../endpoints';
import type { ApiCategory, Product, ProductDraft, ProductListResponse } from '../../types';

/** Only the fields the list UI renders — smaller payload, faster page. */
const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

interface RequestOptions {
  signal?: AbortSignal;
  /**
   * DEV ONLY. Appends DummyJSON's `?delay=` so a race, a pending state or a
   * rollback is slow enough to watch. It works on every verb, including PATCH,
   * and it delays the ERROR path too — a 404 still arrives after the wait.
   * Ignored outside development so it can never reach a real deployment.
   */
  delayMs?: number;
}

/** `?delay=` — only in development, only when asked for. */
const delayParam = (delayMs?: number) => (env.isDev && delayMs ? { delay: delayMs } : {});

export interface ListProductsOptions extends RequestOptions {
  q?: string;
  category?: string;
  /**
   * DummyJSON sorts on any field it stores; widened from Demo 14's
   * `'price' | 'rating'` because the Inventory Console sorts by title and by
   * stock too — both verified against the real API.
   */
  sortBy?: 'title' | 'price' | 'rating' | 'stock' | '';
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
  delayMs,
}: ListProductsOptions = {}): Promise<ProductListResponse> {
  const params: Record<string, string | number | undefined> = {
    limit,
    skip: page * limit,
    select: LIST_FIELDS,
    sortBy: sortBy || undefined,
    order: sortBy ? order : undefined,
    ...delayParam(delayMs),
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
export async function updateProduct(
  id: number | string,
  patch: Partial<ProductDraft>,
  { signal, delayMs }: RequestOptions = {},
): Promise<Product> {
  // VERIFIED against the live API: PATCH returns the WHOLE MERGED product, not
  // just the fields you sent. (POST /products/add only echoes what you sent —
  // the two are not the same, whatever the create helper's comment says.)
  const { data } = await api.patch<Product>(endpoints.products.update(id), patch, {
    signal,
    params: delayParam(delayMs),
  });
  return data;
}

/** DELETE. DummyJSON echoes the product with isDeleted: true and a deletedOn timestamp. */
export async function deleteProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product & { isDeleted: boolean; deletedOn: string }> {
  const { data } = await api.delete<Product & { isDeleted: boolean; deletedOn: string }>(endpoints.products.remove(id), { signal });
  return data;
}
