import { api } from '../client';
import { endpoints } from '../endpoints';
import type { ApiCategory, Product, ProductListResponse } from '../../types';

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
// TODO(lab-1.1): createProduct(payload), updateProduct(id, patch), deleteProduct(id) — POST / PATCH / DELETE, returning data
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

export async function listCategories({ signal }: RequestOptions = {}): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiCategory[]>(endpoints.products.categories(), { signal });
  return data;
}
