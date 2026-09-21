import { api } from '../client';
import { installAuthInterceptor } from './auth';
import { installLoggingInterceptor } from './logging';
import { installRefreshInterceptor } from './refresh';
import { installErrorNormalizer } from './errorNormalizer';

/**
 * Called once, from main.tsx, before the app renders.
 *
 * ORDER MATTERS. Response interceptors run in registration order:
 *   1. logging          — sees the raw axios error: status, timing
 *   2. refresh          — needs the RAW error: error.config to replay, error.response.status to decide
 *   3. errorNormalizer  — LAST; converts to ApiError, after which config/response are gone
 *
 * Swap 2 and 3 and the refresh handler receives an ApiError with no config to
 * replay — a 401 just signs the user out. That is not a gentle bug.
 */
export function installInterceptors() {
  installAuthInterceptor(api); // request side: attaches the token
  installLoggingInterceptor(api);
  installRefreshInterceptor(api);
  installErrorNormalizer(api);
}
