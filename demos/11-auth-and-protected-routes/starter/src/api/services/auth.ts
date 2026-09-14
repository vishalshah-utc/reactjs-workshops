import { api } from '../client';
import { endpoints } from '../endpoints';
import type { User } from '../../types';

/** Lab 1.2: login stores tokens then fetches the FULL profile (the login response has no `role`). */
// TODO(lab-1.2): login({ username, password }) → tokens + getMe(); refreshTokens() via bareApi; logout()
export async function getMe({ signal }: { signal?: AbortSignal } = {}): Promise<User> {
  const { data } = await api.get<User>(endpoints.auth.me(), { signal });
  return data;
}

export async function login(_credentials: { username: string; password: string }): Promise<User> {
  throw new Error('login() is not implemented yet — Lab 1.2');
}

export async function refreshTokens(): Promise<string> {
  throw new Error('refreshTokens() is not implemented yet — Lab 1.2');
}

export function logout() {}
