import { EMPTY } from 'rxjs';
import type { AppEpic } from './types';

/** F5. At most this many PATCHes in the air at once — identical to Demos 24a and 24b. */
export const BULK_CONCURRENCY = 4;

export type Failure = { id: number; reason: string };

/**
 * TODO(lab-4.1): `bulkRestockEpic` — and `mapWithConcurrency` goes in the bin.
 *
 * Demo 24b needed `src/lib/concurrency.ts` (N workers over a shared cursor, a
 * `SettledResult` type, a per-item error normaliser), `listenerApi.fork`,
 * `await task.result`, a three-way outcome check and
 * `cancelActiveListeners()`. Two operators replace all of it: `switchMap`
 * (cancellation) and `mergeMap`'s SECOND ARGUMENT (concurrency).
 *
 * The shape worth stealing is the per-row one. The epic does not call the API
 * at all — it emits `stockSaveRequested`, which `saveStockEpic` already knows
 * how to handle, and then listens to `action$` for that row's answer. Bulk is
 * therefore not a second code path: every row gets the same optimistic write,
 * the same rollback and the same per-row error as an inline edit.
 *
 *   function bulkRow$(action$, id, nextStock, failures) {
 *     const done$ = action$.pipe(
 *       filter((a) => (stockSaveSucceeded.match(a) || stockSaveFailed.match(a))
 *                      && a.payload.id === id),
 *       take(1),                                   // one answer per row
 *       tap((a) => { if (stockSaveFailed.match(a)) failures.push({ id, reason: … }); }),
 *       map(() => bulkProgressed()),
 *     );
 *     return merge(done$, of(stockSaveRequested({ id, stock: nextStock })));
 *   }
 *
 * `merge` subscribes to its sources LEFT TO RIGHT, so `done$` is listening
 * before the request is emitted. Written as `concat(of(request), done$)` it
 * would subscribe afterwards and lose the race against a synchronous fake in
 * Lab 7's test. Subscribe first, then speak.
 *
 * Then the epic:
 *
 *   action$.pipe(
 *     filter(bulkRestockRequested.match),
 *     switchMap((action) => defer(() => {           // defer ⇒ a fresh `failures` per run
 *       const failures: Failure[] = [];
 *       const rows$ = from(ids).pipe(
 *         mergeMap((id) => entities[id] ? bulkRow$(…) : EMPTY, BULK_CONCURRENCY),
 *       );
 *       return concat(rows$, defer(() => of(bulkRestockFinished({ failed: failures }))));
 *     })),
 *   )
 *
 * Yes, `failures` is a mutable array inside a stream. The idiomatic version
 * threads it through a `scan` and is harder to read for no behavioural gain.
 * Where the functional version is worse, write the clear one and say so.
 */
export const bulkRestockEpic: AppEpic = () => EMPTY;

/**
 * TODO(lab-4.2): `bulkUndoEpic` — the same shape, in reverse.
 *
 * Read the snapshot from `selectSnapshot(state$.value)` and run `bulkRow$`
 * over `Object.entries(snapshot)` at the same concurrency, then emit
 * `bulkSnapshotDropped()`.
 *
 * Note what you do NOT need: `listenerApi.getOriginalState()`. An epic sees
 * `state$.value` after the reducers have run, and `bulkUndoRequested` clears
 * `bulk` but deliberately leaves `snapshot` alone.
 *
 * And note the real ergonomic loss, because it belongs in the comparison: if
 * you ever DO need the previous state in an epic, redux-observable has no
 * `getOriginalState`. You build it with `state$.pipe(pairwise())`, set up
 * before the action arrives.
 */
export const bulkUndoEpic: AppEpic = () => EMPTY;
