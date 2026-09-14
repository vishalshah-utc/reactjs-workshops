import type { AxiosInstance } from 'axios';
import { tokenStore } from '../../lib/tokenStore';

/** Endpoints that must NEVER carry an Authorization header. */
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];

/**
 * Reads the token AT REQUEST TIME. Compare with setting
 * api.defaults.headers.common.Authorization once: that must be updated on
 * login, on logout and after every refresh, and any request already built
 * keeps the stale value. The interceptor has no stale state to get wrong.
 */
export function installAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path));
    const token = tokenStore.getAccess();

    if (token && !isPublic) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  });
}
