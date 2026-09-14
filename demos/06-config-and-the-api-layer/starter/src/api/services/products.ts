import type { AxiosResponse } from 'axios';
import { api } from '../client';
import { endpoints } from '../endpoints';
import type { ProductListResponse } from '../../types';

/**
 * Returns the raw axios RESPONSE. Lab 3.1 makes every function here return
 * domain data instead — no `.data` above this file, ever.
 */
// TODO(lab-3.1): return data not responses; add `select`; add getProduct() and listCategories(); forward `signal`
export async function listProducts({ signal }: { signal?: AbortSignal } = {}): Promise<AxiosResponse<ProductListResponse>> {
  return api.get<ProductListResponse>(endpoints.products.list(), { params: { limit: 0 }, signal });
}
