import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { env } from '../config/env';

const baseConfig: CreateAxiosDefaults = {
  baseURL: env.api.baseUrl,
  timeout: env.api.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

/** The app's HTTP client. Import THIS — never bare `axios`. */
export const api: AxiosInstance = axios.create(baseConfig);



/**
 * No interceptors, ever. Used by the token-refresh flow (Demo 11) so a
 * failing refresh can't re-enter the 401 handler that triggered it.
 */
export const bareApi: AxiosInstance = axios.create(baseConfig);