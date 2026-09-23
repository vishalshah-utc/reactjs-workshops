import { concat, defer, EMPTY, filter, from, map, merge, mergeMap, of, switchMap, take, tap } from 'rxjs';
import type { UnknownAction } from '@reduxjs/toolkit';
import {
  bulkProgressed,
  bulkRestockFinished,
  bulkRestockRequested,
  bulkSnapshotDropped,
  bulkUndoRequested,
  selectSnapshot,
  stockSaveFailed,
  stockSaveRequested,
  stockSaveSucceeded,
} from '../inventory';
import type { AppEpic } from './types';

/** F5. At most this many PATCHes in the air at once — identical to Demos 24a and 24b. */
const BULK_CONCURRENCY = 4;

type Failure = { id: number; reason: string };

/**
 * One row's contribution to a bulk run: ask for the save, then wait for that
 * row's own terminal action.
 *
 * This is the shape worth stealing. The epic does not call the API at all — it
 * emits `stockSaveRequested`, which `saveStockEpic` already knows how to
 * handle, and then listens to `action$` for the answer. Bulk is therefore not
 * a second code path: every row gets the same optimistic write, the same
 * rollback and the same per-row error as an inline edit, because it IS an
 * inline edit.
 *
 * `merge` subscribes to its sources left to right, so `done$` is listening
 * BEFORE the request action is emitted. Written as `concat(of(request), done$)`
 * it would subscribe to `done$` only after the request had been dispatched —
 * which works with a real network and loses the race against a synchronous
 * fake in a marble test. Subscribe first, then speak.
 */
function bulkRow$(
  action$: Parameters<AppEpic>[0],
  id: number,
  nextStock: number,
  failures: Failure[],
) {
  const done$ = action$.pipe(
    filter(
      (action): action is ReturnType<typeof stockSaveSucceeded> | ReturnType<typeof stockSaveFailed> =>
        (stockSaveSucceeded.match(action) || stockSaveFailed.match(action)) && action.payload.id === id,
    ),
    // One answer per row. Without `take(1)` this row would keep listening for
    // ever and the run would never finish.
    take(1),
    tap((action) => {
      if (stockSaveFailed.match(action)) failures.push({ id, reason: action.payload.error.message });
    }),
    map(() => bulkProgressed()),
  );

  return merge(done$, of(stockSaveRequested({ id, stock: nextStock })));
}

/**
 * F5. Bulk restock: bounded concurrency, honest partial failure, and a real undo.
 *
 * What this replaced, from Demo 24b:
 *   - `src/lib/concurrency.ts` — 49 lines: N workers over a shared cursor,
 *     a `SettledResult` type, and a per-item error normaliser;
 *   - `listenerApi.fork(...)`, `await task.result` and the three-way outcome
 *     check that stops a cancelled run from reporting;
 *   - `listenerApi.cancelActiveListeners()`.
 *
 * What replaced it: `switchMap` (cancellation), and `mergeMap`'s second
 * argument (concurrency). The second argument is the whole of
 * `mapWithConcurrency`. It is worth sitting with that for a moment.
 */
export const bulkRestockEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(bulkRestockRequested.match),

    /**
     * `takeLatest`, for free. Press the button twice and the first run's
     * remaining rows are never requested, its `done$` listeners unsubscribe,
     * and — crucially — it cannot report. Demo 24b needed
     * `cancelActiveListeners()` plus an `outcome.status !== 'ok'` guard to get
     * the same two properties.
     */
    switchMap((action) => {
      const { amount, ids } = action.payload;
      const entities = state$.value.inventory.entities;

      /**
       * `defer` gives every run its own `failures` array — without it the
       * closure would be created once and shared between runs.
       *
       * And yes, this is a mutable array inside a stream, which is not
       * idiomatic RxJS. The idiomatic version threads the failures through a
       * `scan` accumulator alongside the actions, and it is genuinely harder
       * to read for no behavioural gain. Where the functional version is worse,
       * say so and write the clear one.
       */
      return defer(() => {
        const failures: Failure[] = [];

        const rows$ = from(ids).pipe(
          mergeMap((id) => {
            const current = entities[id];
            // A row that vanished between the click and now. `EMPTY` completes
            // immediately and contributes nothing — the stream's way of
            // saying `return`.
            if (!current) return EMPTY;
            return bulkRow$(action$, id, current.stock + amount, failures);
          }, BULK_CONCURRENCY),
        );

        // `concat` runs the report only after every row has finished, and the
        // inner `defer` reads `failures` at that moment rather than at build time.
        return concat(rows$, defer(() => of(bulkRestockFinished({ failed: failures }))));
      });
    }),
  );

/**
 * F5's undo. The same shape, in reverse.
 *
 * Note what is NOT needed: `listenerApi.getOriginalState()`. An epic sees
 * `state$.value` after the reducers have run, and `bulkUndoRequested` clears
 * `bulk` but deliberately leaves `snapshot` alone, so the snapshot is still
 * there to read.
 *
 * If you ever DO need the previous state in an epic, redux-observable has no
 * `getOriginalState` — you build it: `state$.pipe(pairwise())`, set up before
 * the action arrives. That is a real ergonomic loss against the listener
 * middleware and it belongs in the comparison.
 */
export const bulkUndoEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(bulkUndoRequested.match),
    switchMap(() => {
      const snapshot = selectSnapshot(state$.value);
      if (!snapshot) return EMPTY;

      return defer(() => {
        const failures: Failure[] = [];

        const rows$ = from(Object.entries(snapshot)).pipe(
          mergeMap(
            ([id, stock]) => bulkRow$(action$, Number(id), stock, failures),
            BULK_CONCURRENCY,
          ),
        );

        // Undo is a real reverse operation — the server was told, so it is told
        // again — and then the snapshot goes away.
        return concat(rows$, of(bulkSnapshotDropped() as UnknownAction));
      });
    }),
  );
