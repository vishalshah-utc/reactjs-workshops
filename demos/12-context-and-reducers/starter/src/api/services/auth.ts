import { api, bareApi } from '../client';
import { endpoints } from '../endpoints';
import { tokenStore } from '../../lib/tokenStore';
import type { AuthTokens, LoginResponse, User } from '../../types';

/**
 * Deliberately SHORT, so the refresh flow is easy to watch: sign in, wait a
 * minute, click "Who am I?" and see 401 → refresh → 200 in the Network tab.
 * A real app would use the backend's default.
 */
const TOKEN_LIFETIME_MINS = 1;

interface RequestOptions {
  signal?: AbortSignal;
}

/** Requires a valid access token — the request interceptor supplies it. */
export async function getMe({ signal }: RequestOptions = {}): Promise<User> {
  const { data } = await api.get<User>(endpoints.auth.me(), { signal });
  return data;
}

export async function login({ username, password }: { username: string; password: string }): Promise<User> {
  const { data } = await api.post<LoginResponse>(endpoints.auth.login(), {
    username,
    password,
    expiresInMins: TOKEN_LIFETIME_MINS,
  });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });

  // The login response is a SUBSET of the user — LoginResponse has no `role`.
  // Fetch the full profile once and store it, so the header and role checks have it.
  const user = await getMe();
  tokenStore.set({ user });
  return user;
}

/**
 * Uses bareApi — NO interceptors — so a failing refresh can't re-enter the
 * 401 handler that called it. See interceptors/refresh.ts.
 */
export async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await bareApi.post<AuthTokens>(endpoints.auth.refresh(), {
    refreshToken,
    expiresInMins: TOKEN_LIFETIME_MINS,
  });

  // DummyJSON rotates BOTH tokens on refresh — store both.
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

export function logout() {
  tokenStore.clear();
}
