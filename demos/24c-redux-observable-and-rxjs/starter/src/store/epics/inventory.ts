import { EMPTY } from 'rxjs';
import type { AppEpic } from './types';

/** How long the search box is allowed to keep typing before we fetch. */
export const SEARCH_DEBOUNCE_MS = 400;
/** Two retries on top of the first attempt, so three tries in total. */
export const LOAD_RETRIES = 2;

/**
 * 400 ms, then 800 ms, plus up to 200 ms of jitter.
 *
 * Written for you, and given a NAME on purpose: the jitter is what stops every
 * client that failed together from retrying together, and a named function is
 * something Lab 7's marble test can stub so the frames stay deterministic.
 */
export const loadBackoffMs = (attempt: number) => 400 * 2 ** (attempt - 1) + Math.random() * 200;

/**
 * TODO(lab-2.2): `loadEpic` — the load, as a stream.
 *
 * Start from the OUTSIDE.
 *
 *   action$.pipe(
 *     ofType(consoleOpened.type),          // one session per visit
 *     switchMap(() => …),                  // ← the outer switchMap
 *   )
 *
 * That outer `switchMap` is the one everybody leaves out. Put the
 * `takeUntil(consoleClosed)` from lab-2.4 at the TOP level instead and the epic
 * COMPLETES the first time the console unmounts — a completed Observable never
 * emits again, so the console works once and is silently dead on the second
 * visit.
 *
 * Inside it, build "when to load":
 *
 *   merge(
 *     action$.pipe(filter(searchChanged.match), debounceTime(SEARCH_DEBOUNCE_MS)),
 *     action$.pipe(filter(isAnyOf(categoryChanged, lowStockToggled, sortChanged,
 *                                 pageChanged, latencyChanged, filtersCleared,
 *                                 inventoryRetried))),
 *   ).pipe(
 *     startWith(null),                     // fetch page one on open
 *     map(() => selectFilters(state$.value)),
 *     switchMap((filters) => …the request…),
 *   )
 *
 * Read the filters from `state$.value`, not from the action: by the time an
 * epic sees an action the reducers have already handled it, so the filters are
 * current and `page = 0` has already been applied.
 *
 * The inner `switchMap` is F3. It unsubscribes from the previous request the
 * instant a new one starts, which — because `deps.listProducts` is built on
 * `fromAbortable` — really aborts it. That is `currentRequestId`, `pendingKey`,
 * `filtersKey`, `condition` and the `addMatcher` from Demo 24b, all at once.
 * `mergeMap` would bring every one of those bugs back; `concatMap` would queue
 * stale searches; `exhaustMap` would ignore what the user typed.
 *
 *
 * TODO(lab-2.3): retry with backoff, and the two operators around it.
 *
 * Inside the inner `switchMap`, after `map(...)` to `inventoryLoaded`:
 *
 *   retry({
 *     count: LOAD_RETRIES,
 *     delay: (error, attempt) => {
 *       if (!toErrorInfo(error).isRetryable) throw error;   // a 404 will not improve
 *       return timer(loadBackoffMs(attempt));               // an OBSERVABLE, not a number
 *     },
 *   }),
 *   catchError((error) => of(inventoryFailed(toErrorInfo(error)))),
 *   startWith(inventoryLoading()),
 *
 * Three things to get right and they are all about ORDER.
 *  - `catchError` must RETURN an Observable, never rethrow. An error that
 *    escapes an epic kills its subscription for the lifetime of the store.
 *  - `startWith` goes AFTER `retry`, so the spinner appears once per user
 *    action rather than once per attempt.
 *  - the `delay` callback returns an Observable, which is why the backoff can
 *    be `timer()`, or `fromEvent(window, 'online')`, or a race between them.
 *
 *
 * TODO(lab-2.4): `takeUntil(consoleClosed)`, at the END of the INNER pipe.
 *
 * On unmount this unsubscribes the whole inner stream: the request aborts, the
 * debounce timer is dropped, and (after Lab 5) the WebSocket closes. There is
 * no cleanup function to forget, because the cleanup IS the stream ending.
 */
export const loadEpic: AppEpic = () => EMPTY;

/**
 * TODO(lab-3.1): `saveStockEpic` — and the flattening operator IS the lab.
 *
 *   action$.pipe(
 *     filter(stockSaveRequested.match),
 *     mergeMap((action) =>
 *       deps.updateProduct(id, { stock }, selectFilters(state$.value).delayMs).pipe(
 *         map((product) => stockSaveSucceeded({ id, product })),
 *         catchError((error) => of(stockSaveFailed({ id, error: toErrorInfo(error) }))),
 *       ),
 *     ),
 *   )
 *
 * Before you write `mergeMap`, be able to say why the other three are wrong:
 *
 *   switchMap   editing row 8 would CANCEL row 3's in-flight save, and row 3
 *               would sit on "saving" for ever with no terminal action;
 *   exhaustMap  the second edit is silently dropped while the first runs —
 *               right for a login button, wrong for a grid;
 *   concatMap   correct but pessimistic: twelve edits become twelve sequential
 *               round trips;
 *   mergeMap    correct here, because rows are independent.
 *
 * The `catchError` is INSIDE the inner pipe on purpose. Outside it, one row's
 * 404 would end the epic and no row would ever save again.
 */
export const saveStockEpic: AppEpic = () => EMPTY;
