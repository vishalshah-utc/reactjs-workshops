import axios from 'axios';
import { ApiError } from './ApiError';

/**
 * Is this failure worth trying again? Only when repeating can't make things
 * worse: no response at all, a timeout, rate limiting, or a server error.
 * A 4xx (other than 408/429) means the request itself is wrong — retrying
 * won't change the answer.
 */
export function isRetryable(error: unknown): boolean {
  if (axios.isCancel(error)) return false;
  const status = error instanceof ApiError ? error.status : axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  /** Stop retrying once the caller has gone away (a loader's request.signal). */
  signal?: AbortSignal;
}

/**
 * Retry an IDEMPOTENT operation with exponential backoff and jitter.
 *
 * Never wrap a POST in this: a POST that timed out may have succeeded with
 * only the response lost — retrying creates a duplicate.
 */
export async function withRetry<T>(fn: () => Promise<T>, { attempts = 3, baseDelayMs = 400, signal }: RetryOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const lastAttempt = attempt >= attempts - 1;
      if (lastAttempt || !isRetryable(error) || signal?.aborted) throw error;

      // Exponential backoff + jitter. The jitter matters: without it every client
      // that failed together retries together and floors the server again.
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
