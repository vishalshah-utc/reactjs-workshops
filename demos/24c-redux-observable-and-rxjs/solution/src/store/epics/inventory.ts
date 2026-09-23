import { isAnyOf } from '@reduxjs/toolkit';
import { ofType } from 'redux-observable';
import { catchError, debounceTime, filter, map, merge, mergeMap, of, retry, startWith, switchMap, takeUntil, timer } from 'rxjs';
import { toErrorInfo } from '../../lib/errorInfo';
import {
  categoryChanged,
  filtersCleared,
  latencyChanged,
  lowStockToggled,
  pageChanged,
  searchChanged,
  selectFilters,
  sortChanged,
  PAGE_SIZE,
} from '../filters';
import {
  consoleClosed,
  consoleOpened,
  inventoryFailed,
  inventoryLoaded,
  inventoryLoading,
  inventoryRetried,
  stockSaveFailed,
  stockSaveRequested,
  stockSaveSucceeded,
} from '../inventory';
import type { AppEpic } from './types';

/** How long the search box is allowed to keep typing before we fetch. */
const SEARCH_DEBOUNCE_MS = 400;
/** Two retries on top of the first attempt, so three tries in total. */
const LOAD_RETRIES = 2;

/**
 * 400 ms, then 800 ms, plus up to 200 ms of jitter.
 *
 * The jitter matters and is the reason this is a named function rather than an
 * expression inside the operator: without it, every client that failed together
 * retries together and floors the server again. With it, a marble test would be
 * non-deterministic — so the test stubs `Math.random`, which it can only do
 * because the randomness has a name.
 */
export const loadBackoffMs = (attempt: number) => 400 * 2 ** (attempt - 1) + Math.random() * 200;

// -------------------------------------------------------------- F1/F3: load

/**
 * ONE epic, replacing: the `loadInventory` thunk, its `condition`, its three
 * `extraReducers` cases' request-id bookkeeping, the `useDebouncedCallback`
 * hook in the toolbar, and the dispatch-and-abort effect in the page.
 *
 * Read it from the outside in.
 *
 *   consoleOpened
 *     └─ switchMap ─ the whole session, restarted if the console reopens
 *          ├─ merge(debounced search, immediate filters, retry) ─ WHEN to load
 *          ├─ switchMap ─ LATEST WINS, and the loser is cancelled
 *          │    └─ the request, with retry + backoff and a startWith
 *          └─ takeUntil(consoleClosed) ─ everything stops on unmount
 */
export const loadEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    /**
     * `ofType` — the redux-observable idiom, used here where it is safe: we
     * never touch this action's payload, so its `never` output costs nothing.
     * Every other filter below uses RTK's `.match`, which narrows properly.
     * See `types.ts` for why.
     */
    ofType(consoleOpened.type),

    /**
     * The OUTER `switchMap` is the one people leave out, and leaving it out is
     * the classic redux-observable bug. Put `takeUntil(consoleClosed)` at the
     * top level of the epic instead and the epic COMPLETES on the first
     * unmount — it is a single long-lived subscription, and a completed
     * Observable never emits again. The console would work once and be dead on
     * the second visit, with no error anywhere.
     *
     * With the outer `switchMap`, `takeUntil` ends only the inner stream, and
     * the next `consoleOpened` builds a fresh one.
     */
    switchMap(() =>
      merge(
        /**
         * The search box, debounced IN THE EFFECT LAYER.
         *
         * Demo 24b debounced in the component, with `useDebouncedCallback`: a
         * 33-line hook, a ref for the timer, a ref for the latest callback, a
         * cleanup effect, plus a local draft in the toolbar and an
         * adjust-during-render block to reconcile it. About 45 lines to stop
         * one request per keystroke.
         *
         * Here the store records every keystroke — which is arguably more
         * honest, and definitely noisier in the devtools log — and exactly one
         * request goes out. The trade is named in the guide; it is not free.
         */
        action$.pipe(filter(searchChanged.match), debounceTime(SEARCH_DEBOUNCE_MS)),

        /** Everything else refetches immediately. No debounce; nobody types a dropdown. */
        action$.pipe(
          filter(
            isAnyOf(
              categoryChanged,
              lowStockToggled,
              sortChanged,
              pageChanged,
              latencyChanged,
              filtersCleared,
              inventoryRetried,
            ),
          ),
        ),
      ).pipe(
        /**
         * The first load. `startWith(null)` makes the merged stream fire once
         * on subscribe, which is "the console just opened, fetch page one".
         */
        startWith(null),

        /**
         * Read the filters from `state$.value`, not from the action.
         *
         * `state$` is a `BehaviorSubject`-shaped `StateObservable`: `.value` is
         * always the state AFTER the reducers have handled the action that got
         * us here. So `searchChanged('lip')` has already been applied, and its
         * `page = 0` rule with it. This is the epic equivalent of the listener
         * middleware's `getState()`.
         */
        map(() => selectFilters(state$.value)),

        /**
         * F3, THE RACE — and the entire reason to reach for RxJS.
         *
         * `switchMap` unsubscribes from the previous inner Observable the
         * moment a new one arrives. `fromAbortable`'s teardown runs, the
         * `AbortController` fires, axios cancels, and the request goes red in
         * the Network tab. A response that was already on the wire cannot
         * reach a reducer either, because nothing is subscribed to it.
         *
         * Demo 24b needed `currentRequestId`, `pendingKey`, `filtersKey`, a
         * `condition` and an `addMatcher` to get the second half of that.
         * `mergeMap` here would reintroduce every one of those bugs;
         * `concatMap` would queue stale searches behind each other; `exhaustMap`
         * would ignore everything the user typed while a request was running.
         */
        switchMap((filters) =>
          deps
            .listProducts({
              q: filters.q,
              category: filters.category,
              sortBy: filters.sortBy,
              order: filters.order,
              page: filters.page,
              limit: PAGE_SIZE,
              delayMs: filters.delayMs,
            })
            .pipe(
              map((response) =>
                inventoryLoaded({ products: response.products, total: response.total, page: filters.page }),
              ),

              /**
               * `retry` with exponential backoff, in one operator.
               *
               * `src/lib/retry.ts` is the hand-written version this replaces:
               * 40 lines, a loop, an attempt counter, a retryability predicate,
               * a jittered `setTimeout` and an abort check. It is still in the
               * project because the public catalogue's route loader uses it —
               * a loader is not an epic — so nothing was deleted here. What was
               * deleted is the need to write it again.
               *
               * The `delay` callback returns an OBSERVABLE, and that is the
               * clever part: `retry` waits for it to emit. `timer(n)` is a
               * backoff; `fromEvent(window, 'online')` would be "retry when the
               * network comes back"; `race(timer(5000), userPressedRetry$)`
               * would be "retry in five seconds, or sooner if they ask". None
               * of those is expressible in a `for` loop.
               */
              retry({
                count: LOAD_RETRIES,
                delay: (error, attempt) => {
                  const info = toErrorInfo(error);
                  // A 404 is not going to become a 200. Rethrow and stop.
                  if (!info.isRetryable) throw error;
                  return timer(loadBackoffMs(attempt));
                },
              }),

              /**
               * `catchError` has to return an OBSERVABLE, not throw. Returning
               * `of(action)` turns the failure into an ordinary action and the
               * stream keeps running; letting the error escape kills the epic
               * for the lifetime of the store and takes every other feature in
               * it with it. This is redux-observable's sharpest edge.
               */
              catchError((error: unknown) => of(inventoryFailed(toErrorInfo(error)))),

              /**
               * Placed AFTER `retry`, so the spinner appears once per user
               * action rather than once per attempt. Operator order is
               * semantics, not style.
               */
              startWith(inventoryLoading()),
            ),
        ),

        /**
         * F3's cancellation, and the leak that cannot happen.
         *
         * On `consoleClosed` this whole inner stream unsubscribes: the
         * in-flight request aborts, the debounce timer is dropped, and the feed
         * epic's socket (same operator, next file) closes. There is no
         * `useEffect` cleanup to forget, because the cleanup IS the stream
         * ending.
         */
        takeUntil(action$.pipe(filter(consoleClosed.match))),
      ),
    ),
  );

// ------------------------------------------------- F4: the optimistic write

/**
 * One row's stock, saved. The optimistic write and the rollback are still in
 * the reducers, exactly as in Demo 24b — this epic only runs the request.
 *
 * THE FLATTENING OPERATOR IS THE WHOLE DESIGN DECISION.
 *
 *   switchMap   WRONG. Editing row 8 would cancel row 3's in-flight save, and
 *               row 3 would sit on 'saving' for ever with no terminal action
 *               to clear it. A screen full of independent writes is the one
 *               place switchMap is actively harmful.
 *   exhaustMap  WRONG. The second edit is silently dropped while the first
 *               runs. Right for a login button, wrong for a grid.
 *   concatMap   Correct but pessimistic: twelve edits go out one at a time, so
 *               the twelfth waits for eleven round trips. Use it when the
 *               server cannot take concurrent writes, or when order matters.
 *   mergeMap    Correct here. Rows are independent, so their requests are.
 *
 * The honest caveat: two fast edits to the SAME row can land out of order under
 * `mergeMap`, and the later response wins by luck rather than by design. The
 * precise fix is `groupBy((a) => a.payload.id)` and then `switchMap` INSIDE
 * each group — latest-wins per row, parallel across rows. It is three more
 * lines and it needs one more action (a "superseded" case) so a cancelled row
 * does not stay on 'saving'. The guide's Lab 3 walks through it; the shipped
 * code keeps `mergeMap` because the extra machinery is not worth it for a
 * number that a human types.
 */
export const saveStockEpic: AppEpic = (action$, state$, deps) =>
  action$.pipe(
    filter(stockSaveRequested.match),
    mergeMap((action) => {
      const { id, stock } = action.payload;
      return deps.updateProduct(id, { stock }, selectFilters(state$.value).delayMs).pipe(
        map((product) => stockSaveSucceeded({ id, product })),
        // Per-row error, per-row recovery. One row's 404 cannot end the epic.
        catchError((error: unknown) => of(stockSaveFailed({ id, error: toErrorInfo(error) }))),
      );
    }),
  );
