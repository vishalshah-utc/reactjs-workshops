import { EMPTY } from 'rxjs';
import type { AppEpic } from './types';

/**
 * TODO(lab-4.3): F6 — persistence, as an epic. Four lines.
 *
 *   action$.pipe(
 *     filter(isAnyOf(inspected, recentCleared, signedOut)),
 *     map(() => state$.value.recent),     // AFTER the reducers: save what is true now
 *     tap(saveRecent),
 *     ignoreElements(),
 *   )
 *
 * Two things to be sure of.
 *
 * `ignoreElements()` is MANDATORY. An epic must return an Observable of
 * actions and everything it emits is dispatched, so an epic that emits the
 * action it listened for is an infinite loop — measured: six dispatches before
 * a deliberate guard stopped it, and in a browser it locks the tab.
 * `ignoreElements` says "this epic is a sink": it passes completion and errors
 * through and swallows every value. `EMPTY` would also compile and would be
 * wrong, because it completes immediately and the `tap` never runs.
 *
 * `tap` is where a side effect is allowed to live. Writing to `localStorage`
 * inside `map` works and lies about what `map` is for; a reader who sees `tap`
 * knows to look for an effect.
 */
export const persistRecentEpic: AppEpic = () => EMPTY;
