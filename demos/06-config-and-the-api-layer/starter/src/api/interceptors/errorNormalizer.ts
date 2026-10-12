import axios, { type AxiosInstance } from 'axios';
import { ApiError } from '../../lib/ApiError';
import { logger } from '../../config/logger';

export function installErrorNormalizer(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isCancel(error)) return Promise.reject(error);   // expected; pass through untouched

      const apiError = ApiError.from(error);

      if (apiError.status >= 500 || apiError.isNetwork) {
        logger.error(`[api] ${apiError.code}: ${apiError.message}`, { requestId: apiError.requestId });
      }

      return Promise.reject(apiError);
    },
  );
}