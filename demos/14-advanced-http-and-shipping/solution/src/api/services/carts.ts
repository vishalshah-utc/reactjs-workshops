import { api } from '../client';
import { endpoints } from '../endpoints';
import type { Cart, CartItemInput } from '../../types';

/**
 * POST /carts/add — DummyJSON simulates it: it computes totals and returns a
 * cart with a new id, and persists nothing. No `signal`: a mutation is never
 * cancelled on unmount — the server may already have committed it.
 */
export async function createCart(userId: number, products: CartItemInput[]): Promise<Cart> {
  const { data } = await api.post<Cart>(endpoints.carts.create(), { userId, products });
  return data;
}
