import type { UnknownAction } from '@reduxjs/toolkit';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { EMPTY } from 'rxjs';
import type { RootState } from '../rootReducer';
import { epicDeps, type EpicDeps } from './deps';
import type { AppEpic } from './types';

export type { AppEpic } from './types';
export type { EpicDeps } from './deps';

/** A placeholder so `combineEpics` has something to combine before Lab 2. */
const noopEpic: AppEpic = () => EMPTY;

/**
 * TODO(lab-1.3): the root epic, and its error boundary.
 *
 * `combineEpics` is `combineReducers` for effects: it subscribes to every epic
 * with the same three arguments and merges their outputs into one stream.
 * Order does not matter — they run concurrently and can only talk to each
 * other through the action stream, which is how they should.
 *
 * List them as you write them:
 *
 *   export const rootEpic = combineEpics<UnknownAction, UnknownAction, RootState, EpicDeps>(
 *     loadEpic, saveStockEpic,             // Lab 2, Lab 3
 *     bulkRestockEpic, bulkUndoEpic,       // Lab 4
 *     persistRecentEpic,                   // Lab 4
 *     feedEpic, flashClearEpic, feedLogEpic,   // Labs 5–6
 *   );
 *
 * Then wrap it, and do not skip this part. An epic is ONE subscription for the
 * lifetime of the store. Let an error escape it — a `map` that reads a
 * property of `undefined`, one missing `catchError` — and RxJS tears the
 * subscription down and EVERY effect in the application stops for ever.
 * Measured: with two epics and an error in the first, the second stops ticking
 * immediately and never recovers. The UI keeps rendering, so it reads as a
 * mysterious hang rather than a crash.
 *
 *   const resilientRootEpic: AppEpic = (action$, state$, deps) =>
 *     rootEpic(action$, state$, deps).pipe(
 *       catchError((error, source) => {
 *         logger.error('[epics] an epic threw and was restarted', error);
 *         return source;                   // ← resubscribe
 *       }),
 *     );
 *
 * It is a safety net, not a design. An epic that lands here has lost whatever
 * it was holding. Put a `catchError` inside each epic, next to the thing that
 * can fail; this catches the one you missed.
 */
export const rootEpic = combineEpics<UnknownAction, UnknownAction, RootState, EpicDeps>(noopEpic);

/**
 * The middleware. `dependencies` is Demo 24b's `thunk: { extraArgument }`
 * under another name — written for you, because there is nothing to learn from
 * typing it twice.
 */
export const epicMiddleware = createEpicMiddleware<UnknownAction, UnknownAction, RootState, EpicDeps>({
  dependencies: epicDeps,
});

/** Called once, from `src/store/index.ts`, immediately AFTER the store exists. */
export function runEpics(): void {
  epicMiddleware.run(rootEpic);
}
