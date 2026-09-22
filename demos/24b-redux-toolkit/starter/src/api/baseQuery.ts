import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig } from 'axios';
import type { ApiErrorInfo } from '../lib/errorInfo';

/** What an endpoint's `query` returns. Deliberately axios-shaped, minus the parts nobody needs. */
export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  params?: AxiosRequestConfig['params'];
  data?: unknown;
}

/**
 * TODO(lab-6.1): RTK Query on top of the API layer Demos 5–8 built.
 *
 * Every RTK Query tutorial starts with `fetchBaseQuery`. Using it here would
 * throw away — for the inventory endpoints only, so the app would then have two
 * ways of talking to the same server — the auth interceptor, the refresh queue
 * and its 401 handling, the request-id logger, the error normaliser and with it
 * the single `ApiError` type, and the timeout and base URL behind them.
 *
 * A `baseQuery` is just a function: args in, `{ data }` or `{ error }` out. So
 * call `api.request({ url, method, params, data, signal })` and obey two rules:
 *  1. NEVER throw — a rejection here is an unhandled error in the middleware,
 *     not a rejected query;
 *  2. the error must be SERIALISABLE — `toErrorInfo(error)`, exactly like a
 *     thunk's `rejectWithValue`.
 */
export const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiErrorInfo> = async () => ({
  error: { message: 'TODO(lab-6.1)', status: 0, code: 'UNKNOWN', isRetryable: false },
});
