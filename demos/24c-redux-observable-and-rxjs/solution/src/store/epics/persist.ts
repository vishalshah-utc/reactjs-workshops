import { isAnyOf } from '@reduxjs/toolkit';
import { filter, ignoreElements, map, tap } from 'rxjs';
import { inspected, recentCleared, saveRecent } from '../recent';
import { signedOut } from '../session';
import type { AppEpic } from './types';

/**
 * F6. Persistence, as an epic. Four lines, and it is the clearest like-for-like
 * in the whole demo: Demo 24b's listener was four lines too.
 *
 * Two things are worth pointing at.
 *
 * **`ignoreElements()` is mandatory.** An epic MUST return an Observable of
 * actions, and everything it emits is dispatched. An epic that emits the
 * action it listened for is an infinite loop — the single most common
 * redux-observable mistake, and it locks the tab. `ignoreElements` says "this
 * epic is a sink": it passes completion and errors through and swallows every
 * value. `EMPTY` would also type-check and would be wrong, because it
 * completes immediately and the `tap` would never run.
 *
 * **`tap` is where a side effect is allowed to live.** Writing to
 * `localStorage` inside `map` would work and would be a lie about what `map`
 * is for. `tap` exists to say "I am doing something the stream does not care
 * about", and a reader who sees `tap` knows to look for an effect.
 */
export const persistRecentEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isAnyOf(inspected, recentCleared, signedOut)),
    // `state$.value` is the state AFTER the reducers ran, which is what
    // persistence wants: save what is true now.
    map(() => state$.value.recent),
    tap(saveRecent),
    ignoreElements(),
  );
