/**
 * Run `worker` over `items`, never more than `limit` at a time, and report
 * EVERY outcome — the failures as well as the successes.
 *
 * TODO(lab-5.1): implement it. `Promise.all(items.map(worker))` is wrong twice
 * over: it opens every request at once, and it throws away the ninety-nine that
 * worked as soon as one rejects. `Promise.allSettled` fixes the second problem.
 * Fix the first with `limit` workers pulling from one shared cursor, and write
 * each result back at its INPUT index so the caller can line results up with
 * ids.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  _limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  return Promise.allSettled(items.map(worker));
}
