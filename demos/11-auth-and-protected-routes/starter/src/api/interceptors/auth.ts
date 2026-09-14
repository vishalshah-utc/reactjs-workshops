import type { AxiosInstance } from 'axios';

/** Does nothing yet. Lab 2.1: attach `Authorization: Bearer <token>` — except to the auth endpoints themselves. */
// TODO(lab-2.1): request interceptor reading tokenStore.getAccess() at REQUEST TIME; skip /auth/login and /auth/refresh
export function installAuthInterceptor(_instance: AxiosInstance) {}
