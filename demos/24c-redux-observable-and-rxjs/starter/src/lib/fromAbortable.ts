import { from, Observable } from 'rxjs';

/**
 * TODO(lab-1.1): make this request actually cancellable.
 *
 * The body below COMPILES, passes every marble test, and is wrong in the one
 * way that matters. `from(promise)` unsubscribing does NOT abort the promise:
 * a promise has no cancellation channel, so all unsubscribing does is stop you
 * hearing the answer. `switchMap` over this gives you latest-wins in the STORE
 * and leaves the request running on the wire.
 *
 * Measured, not argued: over five overlapping requests, the version below
 * aborts NONE of them; the version you are about to write aborts four.
 *
 * Replace it with the Observable form:
 *
 *   return new Observable<T>((subscriber) => {
 *     const controller = new AbortController();
 *     run(controller.signal).then(
 *       (value) => { subscriber.next(value); subscriber.complete(); },
 *       (error) => { if (!controller.signal.aborted) subscriber.error(error); },
 *     );
 *     return () => controller.abort();          // ← the teardown IS the cancel
 *   });
 *
 * Two details worth the extra minute. The returned function is RxJS's teardown
 * — it runs on unsubscribe, on complete and on error, which includes the
 * unsubscribe `switchMap` and `takeUntil` perform. And the `signal.aborted`
 * guard stops you reporting an error you caused yourself to a subscriber that
 * has already gone.
 */
export function fromAbortable<T>(run: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return from(run(new AbortController().signal));
}
