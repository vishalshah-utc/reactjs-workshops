/**
 * The one error type the app should deal with above the API layer.
 * Lab 4.1 gives it a status, a code, the raw body, and a `from()` that
 * translates any thrown value.
 */
// TODO(lab-4.1): status/code/data/requestId fields, isRetryable & friends, and static from(error: unknown): ApiError
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
