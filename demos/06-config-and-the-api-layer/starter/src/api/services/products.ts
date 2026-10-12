import { api } from '../client';
import { endpoints } from '../endpoints';
import type { ApiCategory, Product, ProductListResponse } from '../../types';

const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

/** Every read accepts a signal, so cancellation can be plumbed all the way through. */
interface RequestOptions {
  signal?: AbortSignal;
}

interface ListOptions extends RequestOptions {
  limit?: number;
  skip?: number;
}

/** @returns the envelope — a Promise<ProductListResponse>, never an AxiosResponse */
export async function listProducts({ limit = 0, skip = 0, signal }: ListOptions = {}): Promise<ProductListResponse> {
  const { data } = await api.get<ProductListResponse>(endpoints.products.list(), {
    params: { limit, skip, select: LIST_FIELDS },
    signal,
  });
  return data;
}



/** Full record — no `select`; a detail view wants every field. */
export async function getProduct(id: number | string, { signal }: RequestOptions = {}): Promise<Product> {
  const { data } = await api.get<Product>(endpoints.products.detail(id), { signal });
  return data;
}

export async function listCategories({ signal }: RequestOptions = {}): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiCategory[]>(endpoints.products.categories(), { signal });
  return data;
}