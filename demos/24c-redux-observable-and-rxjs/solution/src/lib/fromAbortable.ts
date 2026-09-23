import { Observable } from 'rxjs';

/**
 * A promise-returning function that takes an `AbortSignal`, as an Observable
 * that really cancels.
 *
 * This is the single most important line of glue in this demo, and it exists
 * because of a trap:
 *
 *   from(listProducts({ q }))        // ← looks right, is not cancellable
 *
 * `from(promise)` unsubscribing does NOT abort the promise. A promise has no
 * cancellation channel — once it is running it runs to completion, and all
 * unsubscribing does is stop you hearing the answer. So `switchMap` over
 * `from(fetch(...))` gives you latest-wins in the STORE and leaves the request
 * running on the wire, which is the one thing you came for.
 *
 * An Observable, by contrast, hands you a teardown function. Call the API
 * inside the subscriber, keep the `AbortController`, and abort it in the
 * teardown — now `switchMap`'s unsubscribe reaches all the way down to axios,
 * and the cancelled request goes red in the Network tab.
 *
 * The `signal.aborted` guard on the error path matters too: an aborted axios
 * request rejects with a cancellation error, and forwarding that to
 * `subscriber.error` after teardown would be an error nobody is listening for.
 */
export function fromAbortable<T>(run: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const controller = new AbortController();

    run(controller.signal).then(
      (value) => {
        subscriber.next(value);
        subscriber.complete();
      },
      (error: unknown) => {
        // We caused this by unsubscribing. Nobody is listening; say nothing.
        if (controller.signal.aborted) return;
        subscriber.error(error);
      },
    );

    // The teardown. RxJS calls this on unsubscribe, on complete and on error —
    // including the unsubscribe that `switchMap` and `takeUntil` perform.
    return () => controller.abort();
  });
}
