import axios, { type AxiosInstance } from 'axios';
import { api } from '../client';
import { refreshTokens } from '../services/auth';
import { tokenStore } from '../../lib/tokenStore';
import { logger } from '../../config/logger';

/**
 * ONE refresh, shared by every request that 401s in the same window. Six
 * requests in flight when the token expires must NOT become six refresh
 * calls — most backends invalidate the old refresh token on use, so five of
 * them would fail and sign the user out.
 */
let refreshPromise: Promise<string> | null = null;

export function installRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);
      const original = error.config;

      const shouldTryRefresh =
        error.response?.status === 401 &&
        original !== undefined &&
        !original._retry && // (1) at most ONE retry per request — no infinite loop (typed in types/axios.d.ts)
        !original.url?.startsWith('/auth/'); // (3) never for the auth endpoints themselves

      if (!shouldTryRefresh) return Promise.reject(error);

      original._retry = true;

      try {
        // (2) the first 401 creates the promise; every other 401 awaits the SAME one
        refreshPromise ??= refreshTokens().finally(() => {
          refreshPromise = null; // the NEXT expiry starts fresh
        });

        const accessToken = await refreshPromise;
        logger.info('[auth] token refreshed; replaying request', original.url);

        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original); // replay the ORIGINAL request with the new token
      } catch {
        logger.warn('[auth] refresh failed; signing out');
        tokenStore.clear(); // fires AUTH_CHANGED — the UI reacts
        return Promise.reject(error); // the ORIGINAL 401: the honest answer to the question the caller asked
      }
    },
  );
}
