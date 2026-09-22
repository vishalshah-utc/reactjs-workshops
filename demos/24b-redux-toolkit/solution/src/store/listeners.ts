import { createListenerMiddleware, isAnyOf, type TypedStartListening } from '@reduxjs/toolkit';
import { logger } from '../config/logger';
import { mapWithConcurrency } from '../lib/concurrency';
import { toErrorInfo } from '../lib/errorInfo';
import {
  bulkProgressed,
  bulkRestockFinished,
  bulkRestockRequested,
  bulkSnapshotDropped,
  bulkUndoRequested,
  saveStock,
  selectSnapshot,
} from './inventory';
import { inspected, recentCleared, saveRecent } from './recent';
import { signedOut } from './session';
import type { AppDispatch, RootState } from './index';

/** How many PATCHes are allowed in the air at once. */
const BULK_CONCURRENCY = 4;

/**
 * `createListenerMiddleware` is RTK's answer to "where do side effects go?".
 *
 * It is the modern replacement for redux-saga and redux-observable, and unlike
 * both it needs no generators, no operators and no second mental model: a
 * listener is an async function that gets `listenerApi`. What you gain over
 * doing the same work in a component is that the effect lives next to the
 * state it maintains, runs whether or not anything is mounted, and can be
 * cancelled.
 */
export const listenerMiddleware = createListenerMiddleware();

/**
 * The typed `startListening`. Without this, `getState()` is `unknown` and
 * `dispatch` will not accept a thunk.
 */
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

// --------------------------------------------------------- F5: bulk restock

startAppListening({
  actionCreator: bulkRestockRequested,
  effect: async (action, listenerApi) => {
    const { amount, ids } = action.payload;

    /**
     * `takeLatest`, in one line. Every listener started by an earlier
     * `bulkRestockRequested` is cancelled — its `await`s reject with a
     * `TaskAbortError` and its forks stop. Press the button twice and the first
     * run does not keep writing over the second one's results.
     */
    listenerApi.cancelActiveListeners();

    const entities = listenerApi.getState().inventory.entities;

    /**
     * `fork` runs work as a child task of this listener, so cancelling the
     * listener cancels it too — and `pause` inside it would be cancellable at
     * every await. `mapWithConcurrency` keeps at most three PATCHes in flight,
     * because twelve at once is how you get rate-limited.
     *
     * Each item dispatches `saveStock`, which means every row gets the SAME
     * optimistic write, rollback and per-row error as an inline edit. Bulk is
     * not a second code path.
     */
    const task = listenerApi.fork(async () => {
      const results = await mapWithConcurrency(
        ids,
        BULK_CONCURRENCY,
        async (id) => {
          const current = entities[id];
          if (!current) return;
          // `.unwrap()` turns a rejected thunk into a thrown error, which is
          // what the concurrency helper needs to count a failure.
          await listenerApi.dispatch(saveStock({ id, stock: current.stock + amount })).unwrap();
          listenerApi.dispatch(bulkProgressed());
        },
        (error) => toErrorInfo(error).message,
      );

      return results
        .filter((result) => !result.ok)
        .map((result) => ({ id: result.item, reason: result.reason ?? 'Unknown error' }));
    });

    const outcome = await task.result;

    // A cancelled run must not report anything: the run that cancelled it will.
    if (outcome.status !== 'ok') {
      logger.debug(`[bulk] run cancelled (${outcome.status})`);
      return;
    }

    listenerApi.dispatch(bulkRestockFinished({ failed: outcome.value }));
    logger.info(`[bulk] +${amount} to ${ids.length} rows · ${outcome.value.length} failed`);
  },
});

// ------------------------------------------------------------------ F5: undo

startAppListening({
  actionCreator: bulkUndoRequested,
  effect: async (_action, listenerApi) => {
    const snapshot = selectSnapshot(listenerApi.getOriginalState());
    if (!snapshot) return;

    /**
     * Undo is not "put the old numbers back on screen" — the server was told.
     * It is the reverse operation, sent the same way, which is why it reuses
     * `saveStock` and gets the same optimistic feedback and the same rollback.
     */
    await mapWithConcurrency(
      Object.entries(snapshot).map(([id, stock]) => ({ id: Number(id), stock })),
      BULK_CONCURRENCY,
      async ({ id, stock }) => {
        await listenerApi.dispatch(saveStock({ id, stock })).unwrap();
      },
      (error) => toErrorInfo(error).message,
    );

    listenerApi.dispatch(bulkSnapshotDropped());
  },
});

// ----------------------------------------------------------- F6: persistence

startAppListening({
  /**
   * `matcher` rather than `actionCreator`: three different actions change the
   * recent list, and all three have to reach the disk. `isAnyOf` builds the
   * type guard and keeps `action` narrowed.
   */
  matcher: isAnyOf(inspected, recentCleared, signedOut),
  effect: (_action, listenerApi) => {
    /**
     * The effect runs AFTER the reducers, so `getState()` is the new state —
     * `getOriginalState()` is the one from before, which is what the undo
     * listener above needed. Getting these two the wrong way round is the most
     * common listener bug.
     */
    saveRecent(listenerApi.getState().recent);
  },
});
