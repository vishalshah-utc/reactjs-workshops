import { api } from '../client';
import { installLoggingInterceptor } from './logging';
import { installErrorNormalizer } from './errorNormalizer';

/**
 * Called once, from main.tsx, before the app renders.
 *
 * ORDER MATTERS. Response interceptors run in registration order, so:
 *   1. logging         — sees the raw axios error: status, timing
 *   2. (auth refresh)  — Demo 11; needs error.config to replay the request
 *   3. errorNormalizer — LAST; converts to ApiError, after which the earlier
 *                        handlers' assumptions about the error shape no longer hold
 *
 * An explicit call, not import side effects: import order is whatever the
 * bundler decides, which makes ordering bugs non-reproducible. This is
 * ordered, greppable, and skippable in tests.
 */
export function installInterceptors() {
  installLoggingInterceptor(api);
  installErrorNormalizer(api);
}
