import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { logger } from '../../config/logger';

/**
 * Tags every request with a unique id and logs its lifecycle.
 *
 * The id goes out as X-Request-Id and comes back on ApiError.requestId, so a
 * user's screenshot of an error maps to exactly one line in the backend logs.
 * The cheapest observability win available to a frontend.
 */
export function installLoggingInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', crypto.randomUUID());
    config.metadata = { startedAt: performance.now() }; // typed by our module augmentation (types/axios.d.ts)
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, { params: config.params });
    return config; // ← forget this and EVERY request fails
  });

  instance.interceptors.response.use(
    (response) => {
      const ms = Math.round(performance.now() - (response.config.metadata?.startedAt ?? 0));
      logger.debug(`← ${response.status} ${response.config.url} (${ms}ms)`);
      return response; // ← forget this and every response is undefined
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const ms = Math.round(performance.now() - (error.config?.metadata?.startedAt ?? 0));
        logger.warn(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} ${error.response?.status ?? error.code} (${ms}ms)`);
      }
      return Promise.reject(error); // ← forget this and failures silently SUCCEED
    },
  );
}
