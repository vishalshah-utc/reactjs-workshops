import type { AxiosInstance } from 'axios';

/** Does nothing yet. Lab 2.2: on 401, refresh ONCE (shared promise), replay the original request. */
// TODO(lab-2.2): _retry flag (typed in types/axios.d.ts), module-level refreshPromise ??=, skip /auth/ URLs, clear tokens when refresh fails
export function installRefreshInterceptor(_instance: AxiosInstance) {}
