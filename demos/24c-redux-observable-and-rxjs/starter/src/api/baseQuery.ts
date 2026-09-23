import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig } from 'axios';
import { api } from './client';
import { toErrorInfo, type ApiErrorInfo } from '../lib/errorInfo';

/** What an endpoint's `query` returns. Deliberately axios-shaped, minus the parts nobody needs. */
export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  params?: AxiosRequestConfig['params'];
  data?: unknown;
}

/**
 * RTK Query on top of the API layer Demos 5–8 built.
 *
 * The documented starting point is `fetchBaseQuery`, and every RTK Query
 * tutorial uses it. Adopting it here would mean throwing away — for the
 * inventory endpoints only, so the app would then have two ways of talking to
 * the same server:
 *
 *   - the auth interceptor that attaches the access token;
 *   - the refresh interceptor and its 401 queue (Demo 11);
 *   - the request-id and timing logger;
 *   - the error normaliser, and with it the single `ApiError` type;
 *   - the timeout, the base URL and the validated env behind them.
 *
 * A `baseQuery` is just a function: args in, `{ data }` or `{ error }` out. So
 * it can be axios, and RTK Query gets the cache, the hooks, the tags and the
 * devtools while the transport stays exactly what it was.
 *
 * Two rules it must follow:
 *  1. **Never throw.** A rejection here is an unhandled error in the middleware,
 *     not a rejected query. Catch everything and return `{ error }`.
 *  2. **The error must be serialisable.** It lands in the store, so it goes
 *     through `toErrorInfo` exactly like a thunk's `rejectWithValue`.
 */
export const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiErrorInfo> = async (
  { url, method = 'GET', params, data },
  { signal },
) => {
  try {
    // `signal` is RTK Query's: it aborts when the last subscriber of this cache
    // entry unmounts, or when the query is superseded. axios has taken one
    // since Demo 5, so there is nothing to build.
    const response = await api.request({ url, method, params, data, signal });
    return { data: response.data };
  } catch (error) {
    return { error: toErrorInfo(error) };
  }
};
