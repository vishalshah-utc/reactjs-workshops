import axios, { type AxiosInstance } from 'axios';
import { ApiError } from '../../lib/ApiError';
import { logger } from '../../config/logger';

/**
 * The boundary. Every rejection leaving the API layer is an ApiError — except
 * deliberate cancellations, which pass through untouched so callers can still
 * detect them with axios.isCancel() and ignore them.
 *
 * Register this LAST: it runs after any interceptor that needs the raw axios
 * error (the 401 refresh handler in Demo 11 does).
 */
export function installErrorNormalizer(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isCancel(error)) return Promise.reject(error);

      const apiError = ApiError.from(error);

      // One place for error reporting. Swap the logger for Sentry here.
      if (apiError.status >= 500 || apiError.isNetwork) {
        logger.error(`[api] ${apiError.code}: ${apiError.message}`, { requestId: apiError.requestId });
      }

      return Promise.reject(apiError);
    },
  );
}
