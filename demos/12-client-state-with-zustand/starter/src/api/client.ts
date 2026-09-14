import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { env } from '../config/env';

/** Shared settings, so the instances can't drift apart. */
const baseConfig: CreateAxiosDefaults = {
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs, // axios's default is 0 = wait forever. Never ship that.
  headers: { 'Content-Type': 'application/json' },
};

/**
 * The app's HTTP client. Import THIS — never bare `axios`.
 * Interceptors are attached in api/interceptors/index.ts, explicitly, in order.
 */
export const api: AxiosInstance = axios.create(baseConfig);

/**
 * No interceptors, ever. Used by the token-refresh flow (Demo 11) so a failing
 * refresh can't re-enter the 401 handler that triggered it.
 */
export const bareApi: AxiosInstance = axios.create(baseConfig);

