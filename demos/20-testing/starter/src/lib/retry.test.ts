// TODO(lab-3.2): test isRetryable (a status table, a raw AxiosError, a cancellation, an
// unknown throw) and withRetry under FAKE timers — the eventual success, giving up after
// `attempts` with the LAST error, no retry for a 404, an aborted signal, and the doubling
// backoff read off a setTimeout spy.
describe('isRetryable', () => {
  it.todo('decides by status: 0, 408, 429 and 5xx yes; 4xx no');
  it.todo('never retries a cancellation');
});

describe('withRetry', () => {
  it.todo('returns the first success without sleeping');
  it.todo('retries a 503 and returns the eventual success');
  it.todo('gives up after `attempts` and rethrows the LAST error');
  it.todo('does not retry a 404 — repeating it cannot change the answer');
  it.todo('stops when the caller has gone away');
  it.todo('doubles the delay each time, and jitters it');
});
