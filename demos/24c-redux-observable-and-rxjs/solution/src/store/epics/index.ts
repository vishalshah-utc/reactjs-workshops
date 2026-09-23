import type { UnknownAction } from '@reduxjs/toolkit';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { catchError } from 'rxjs';
import { logger } from '../../config/logger';
import type { RootState } from '../rootReducer';
import { bulkRestockEpic, bulkUndoEpic } from './bulk';
import { epicDeps, type EpicDeps } from './deps';
import { feedEpic, feedLogEpic, flashClearEpic } from './feed';
import { loadEpic, saveStockEpic } from './inventory';
import { persistRecentEpic } from './persist';
import type { AppEpic } from './types';

export type { AppEpic } from './types';
export type { EpicDeps } from './deps';

/**
 * `combineEpics` is `combineReducers` for effects: it subscribes to every epic
 * with the same three arguments and merges their outputs into one stream. The
 * order of this list does not matter — they all run concurrently, and none of
 * them can see another's output except through the action stream, which is
 * exactly how they should talk to each other.
 *
 * Eight epics. Demo 24b's equivalent was two thunks, six `extraReducers` cases
 * of lifecycle bookkeeping and three listeners; the new two here are the ones
 * Demo 24b could not have written at all.
 */
export const rootEpic = combineEpics<UnknownAction, UnknownAction, RootState, EpicDeps>(
  // Half one — Demo 24b's effects, expressed as streams.
  loadEpic,
  saveStockEpic,
  bulkRestockEpic,
  bulkUndoEpic,
  persistRecentEpic,
  // Half two — what a thunk could not do.
  feedEpic,
  flashClearEpic,
  feedLogEpic,
);

/**
 * THE ROOT EPIC'S ERROR BOUNDARY, and the only thing in this file you must not
 * skip.
 *
 * An epic is ONE subscription, created once, for the lifetime of the store. If
 * an error escapes it — a `map` that reads a property of `undefined`, a
 * `catchError` you forgot on one request — RxJS tears the subscription down
 * and **every effect in the application stops for ever**. No more loading, no
 * more saving, no more feed. The UI keeps rendering, so it looks like a
 * mysterious hang rather than a crash, and this is by a distance the worst
 * failure mode in redux-observable.
 *
 * The documented mitigation is to catch at the root and RESUBSCRIBE by
 * returning the source. It is a safety net, not a design: an epic that lands
 * here has lost whatever state it was holding, and the log line below is the
 * only reason you will ever know. Put a `catchError` inside each epic, next to
 * the thing that can fail; this is what catches the one you missed.
 */
const resilientRootEpic: AppEpic = (action$, state$, deps) =>
  rootEpic(action$, state$, deps).pipe(
    catchError((error: unknown, source) => {
      logger.error('[epics] an epic threw and was restarted — a request may have been lost', error);
      return source;
    }),
  );

/**
 * The middleware itself.
 *
 * `dependencies` is Demo 24b's `thunk: { extraArgument }` under another name:
 * the object every epic gets as its third argument.
 *
 * Note that this is created but NOT started. `epicMiddleware.run(rootEpic)`
 * has to be called after `configureStore`, because the middleware needs the
 * store's `dispatch` and `getState` before it can build `action$` and `state$`
 * — and calling `run` before the store exists throws
 * *"EpicMiddleware.run(rootEpic) called before dispatching"*.
 */
export const epicMiddleware = createEpicMiddleware<UnknownAction, UnknownAction, RootState, EpicDeps>({
  dependencies: epicDeps,
});

/** Called once, from `src/store/index.ts`, immediately after the store is created. */
export function runEpics(): void {
  epicMiddleware.run(resilientRootEpic);
}
