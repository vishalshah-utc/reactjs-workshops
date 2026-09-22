import { createListenerMiddleware, type TypedStartListening } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './index';

/** How many PATCHes are allowed in the air at once. */
export const BULK_CONCURRENCY = 4;

/**
 * `createListenerMiddleware` is RTK's answer to "where do side effects go?" —
 * the modern replacement for redux-saga and redux-observable, with no
 * generators and no second mental model.
 */
export const listenerMiddleware = createListenerMiddleware();

/** The typed `startListening`. Without it, `getState()` is `unknown`. */
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
export const startAppListening = listenerMiddleware.startListening as AppStartListening;

/**
 * TODO(lab-5.2): the bulk restock (F5).
 *
 * `startAppListening({ actionCreator: bulkRestockRequested, effect: … })`, and
 * in the effect:
 *  - `listenerApi.cancelActiveListeners()` — `takeLatest` in one line;
 *  - `listenerApi.fork(…)` so the work is a child task that cancellation reaches;
 *  - `mapWithConcurrency` (src/lib/concurrency.ts) over the selected ids, each
 *    dispatching `saveStock(...).unwrap()` so every row gets the SAME optimistic
 *    write, rollback and per-row error as an inline edit;
 *  - `bulkRestockFinished({ failed })` at the end — and nothing at all if the
 *    run was cancelled, because the run that cancelled it will report instead.
 *
 * TODO(lab-5.3): the undo listener and the persistence listener.
 *
 * Undo is not "put the old numbers back on screen" — the server was told, so it
 * is the reverse operation, sent the same way, reading the snapshot from
 * `listenerApi.getOriginalState()`.
 *
 * Persistence uses `matcher: isAnyOf(inspected, recentCleared, signedOut)` and
 * `listenerApi.getState()` — the state AFTER the reducers ran. Getting
 * `getState` and `getOriginalState` the wrong way round is the most common
 * listener bug.
 */
