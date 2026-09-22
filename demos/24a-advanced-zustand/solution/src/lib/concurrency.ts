/**
 * Run `worker` over `items`, never more than `limit` at a time, and report
 * EVERY outcome — the failures as well as the successes.
 *
 * Why not `Promise.all(items.map(worker))`? Two reasons, and both of them bite
 * in production. It starts every request at once, which is how a "select all"
 * button becomes a hundred parallel writes and a 429. And it rejects on the
 * first failure, throwing away the ninety-nine that worked.
 *
 * `Promise.allSettled` fixes the second. This fixes the first as well: `limit`
 * workers pull from a shared cursor until the list is empty, so there are never
 * more than `limit` requests open, and the results come back in INPUT order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
