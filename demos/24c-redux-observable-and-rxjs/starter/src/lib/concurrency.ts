/**
 * Run `task` over every item, at most `limit` at a time, and report EVERY
 * outcome — successes and failures alike.
 *
 * `Promise.all` is the wrong shape for a bulk operation: it rejects on the
 * first failure and throws away the results that already succeeded, so a bulk
 * restock of twelve rows where row seven 404s would tell you nothing about the
 * other eleven. `Promise.allSettled` fixes that but fires all twelve requests
 * at once. This does both jobs: bounded parallelism, and an honest result per
 * item.
 */
export interface SettledResult<T> {
  item: T;
  ok: boolean;
  /** Present when `ok` is false. Already normalised by the caller. */
  reason?: string;
}

export async function mapWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
  onError: (error: unknown) => string,
): Promise<SettledResult<T>[]> {
  const results: SettledResult<T>[] = [];
  let cursor = 0;

  // `limit` workers share one cursor. Each takes the next index and loops
  // until the list runs out — no batching, so a slow item never stalls a whole
  // batch of otherwise-idle workers.
  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;

      const item = items[index];
      try {
        await task(item);
        results[index] = { item, ok: true };
      } catch (error) {
        results[index] = { item, ok: false, reason: onError(error) };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
