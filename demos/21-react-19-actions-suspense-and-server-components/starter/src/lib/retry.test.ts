import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { isRetryable, withRetry } from './retry';

function httpError(status: number): AxiosError {
  const error = new AxiosError('boom', 'ERR_BAD_RESPONSE');
  error.response = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } };
  return error;
}

describe('isRetryable', () => {
  it.each([
    [0, true], // no response at all — the request never left, or never came back
    [408, true],
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [401, false],
    [404, false],
    [422, false],
  ])('status %i → %s', (status, expected) => {
    expect(isRetryable(new ApiError({ message: 'x', status }))).toBe(expected);
  });

  it('reads the status off a raw axios error too', () => {
    expect(isRetryable(httpError(503))).toBe(true);
    expect(isRetryable(httpError(404))).toBe(false);
  });

  it('never retries a cancellation', () => {
    // The caller navigated away. Retrying would be work for a page nobody is on.
    expect(isRetryable(new CanceledError('cancelled'))).toBe(false);
  });

  it('treats anything it does not recognise as a network failure — status 0', () => {
    expect(isRetryable(new Error('TypeError: Failed to fetch'))).toBe(true);
  });
});

describe('withRetry', () => {
  // Fake timers, because the thing under test SLEEPS. Real timers would mean a
  // test that takes 1.6 seconds to prove something that takes no time at all.
  afterEach(() => vi.useRealTimers());

  it('returns the first success without sleeping', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries a 503 and returns the eventual success', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValueOnce(httpError(503)).mockRejectedValueOnce(httpError(503)).mockResolvedValue('ok');

    const promise = withRetry(fn, { attempts: 3, baseDelayMs: 400 });
    // advanceTimersByTimeAsync also lets the awaited promises in between settle.
    // The plain advanceTimersByTime does not, and the test hangs forever.
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up after `attempts` and rethrows the LAST error', async () => {
    vi.useFakeTimers();
    const last = httpError(500);
    const fn = vi.fn().mockRejectedValueOnce(httpError(503)).mockRejectedValue(last);

    // Subscribe to the rejection BEFORE advancing the clock. Advance first and
    // the promise rejects with nobody listening, which Node reports as an
    // unhandled rejection — a passing test with a red run around it.
    const settled = expect(withRetry(fn, { attempts: 2, baseDelayMs: 400 })).rejects.toBe(last);
    await vi.advanceTimersByTimeAsync(5_000);
    await settled;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 404 — repeating it cannot change the answer', async () => {
    const fn = vi.fn().mockRejectedValue(httpError(404));
    await expect(withRetry(fn, { attempts: 3 })).rejects.toMatchObject({ response: { status: 404 } });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('stops when the caller has gone away', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn().mockRejectedValue(httpError(503));

    const settled = expect(withRetry(fn, { attempts: 3, signal: controller.signal })).rejects.toBeInstanceOf(AxiosError);
    await vi.advanceTimersByTimeAsync(5_000);
    await settled;
    expect(fn).toHaveBeenCalledOnce();
  });

  it('doubles the delay each time, and jitters it', async () => {
    vi.useFakeTimers();
    const sleeps = vi.spyOn(globalThis, 'setTimeout');
    const fn = vi.fn().mockRejectedValueOnce(httpError(503)).mockRejectedValueOnce(httpError(503)).mockResolvedValue('ok');

    const promise = withRetry(fn, { attempts: 3, baseDelayMs: 400 });
    await vi.advanceTimersByTimeAsync(5_000);
    await promise;

    const delays = sleeps.mock.calls.map((call) => Number(call[1]));
    // 400 + jitter, then 800 + jitter. The jitter is why these are ranges: it is
    // what stops every client that failed together from retrying together.
    expect(delays[0]).toBeGreaterThanOrEqual(400);
    expect(delays[0]).toBeLessThan(600);
    expect(delays[1]).toBeGreaterThanOrEqual(800);
    expect(delays[1]).toBeLessThan(1_000);
  });
});
