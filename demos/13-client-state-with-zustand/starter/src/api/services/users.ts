import { api } from '../client';
import { endpoints } from '../endpoints';
import type { Cart, DirectoryUser } from '../../types';

interface RequestOptions {
  signal?: AbortSignal;
}

/** Team directory — used by the admin-only page. */
export async function listUsers({ limit = 12, signal }: RequestOptions & { limit?: number } = {}): Promise<DirectoryUser[]> {
  const { data } = await api.get<{ users: DirectoryUser[] }>(endpoints.users.list(), {
    params: { limit, select: 'id,username,firstName,lastName,email,image,role,company' },
    signal,
  });
  return data.users;
}

/** A user's carts — user-scoped data for the account area. */
export async function listCartsForUser(userId: number | string, { signal }: RequestOptions = {}): Promise<Cart[]> {
  const { data } = await api.get<{ carts: Cart[] }>(endpoints.users.cartsFor(userId), { signal });
  return data.carts;
}
