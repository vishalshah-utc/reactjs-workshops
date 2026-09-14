/** Calls fn once. Lab 3.1: retry idempotent failures with exponential backoff + jitter. */
// TODO(lab-3.1): attempts, isRetryable(err) (network / 408 / 429 / 5xx), never on cancel, backoff = base * 2^attempt + jitter
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}
