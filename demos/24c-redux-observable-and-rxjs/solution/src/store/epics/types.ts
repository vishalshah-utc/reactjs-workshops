import type { UnknownAction } from '@reduxjs/toolkit';
import type { Epic } from 'redux-observable';
import type { RootState } from '../rootReducer';
import type { EpicDeps } from './deps';

/**
 * The typed `Epic` for this app. Write it once; every epic annotates itself
 * with it and nothing else.
 *
 * `Epic<Input, Output, State, Dependencies>` — four generics, and three of them
 * are the same in every epic you will ever write here:
 *
 *   (action$: Observable<Input>, state$: StateObservable<State>, deps: Dependencies)
 *       => Observable<Output>
 *
 * `Input` is `UnknownAction` because `action$` really does carry every action
 * in the app: yours, RTK Query's internal ones, and anything a future library
 * adds. Claiming a narrower union here would be a lie the compiler believes.
 *
 * THE CONSEQUENCE, and it is the first thing to know about `ofType`:
 *
 *   action$.pipe(ofType('inventory/loaded'), map((a) => a.payload))
 *                                                        ^^^^^^^
 *   Property 'payload' does not exist on type 'never'.
 *
 * `ofType<Input, Type, Output = Extract<Input, Action<Type>>>` narrows by
 * extracting from the input union — and `Extract<UnknownAction, Action<'x'>>`
 * is `never`, because `UnknownAction['type']` is `string`, not `'x'`. `ofType`
 * only narrows usefully when `Input` is a hand-maintained union of every action
 * type in your app, which is exactly the file that rots.
 *
 * Redux Toolkit already solved this. Every action creator carries a `.match`
 * type guard, and RxJS's `filter` narrows on a type guard:
 *
 *   action$.pipe(filter(inventoryLoaded.match), map((a) => a.payload.total))
 *                                                                   ^^^^^ number
 *
 * So: `ofType` is the redux-observable idiom you will read in every tutorial
 * and every codebase written before RTK, and it is worth recognising. In new
 * RTK code, `filter(creator.match)` and `filter(isAnyOf(a, b))` are strictly
 * better, and that is what the epics below use.
 */
export type AppEpic = Epic<UnknownAction, UnknownAction, RootState, EpicDeps>;
