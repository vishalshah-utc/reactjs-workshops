import axios, { type AxiosInstance } from 'axios';
import { logger } from '../../config/logger';

export function installLoggingInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', crypto.randomUUID());   // AxiosHeaders has .set/.get — typed, unlike bracket access
    config.metadata = { startedAt: performance.now() };        // our field — typed by the module augmentation below
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, { params: config.params });
    return config;                                    // ← never forget
  });

  instance.interceptors.response.use(
    (response) => {
      const ms = Math.round(performance.now() - (response.config.metadata?.startedAt ?? 0));
      logger.debug(`← ${response.status} ${response.config.url} (${ms}ms)`);
      return response;                                // ← never forget
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const ms = Math.round(performance.now() - (error.config?.metadata?.startedAt ?? 0));
        logger.warn(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} ${error.response?.status ?? error.code} (${ms}ms)`);
      }
      return Promise.reject(error);                   // ← never forget
    },
  );
}