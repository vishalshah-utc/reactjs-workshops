import { ApiError } from './ApiError';

/**
 * The SERIALISABLE projection of an ApiError.
 *
 * `ApiError` is a class instance with a prototype, getters and a `cause` that
 * holds the original axios error — which holds the request, the response and a
 * socket. None of that belongs in a Redux store: the default middleware's
 * serializability check will say so out loud (Demo 24b Lab 2), and time-travel
 * cannot replay a value it cannot clone.
 *
 * So the API layer keeps the class, and the store keeps this: a plain object,
 * structurally clonable, JSON-able, and — deliberately — carrying exactly the
 * five fields `ErrorNotice` renders.
 */
export interface ApiErrorInfo {
  message: string;
  status: number;
  code: string;
  requestId?: string;
  isRetryable: boolean;
}

/** `unknown` in, a plain object out. The one place the class becomes data. */
export function toErrorInfo(error: unknown): ApiErrorInfo {
  const apiError = ApiError.from(error);
  return {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    requestId: apiError.requestId,
    isRetryable: apiError.isRetryable,
  };
}
