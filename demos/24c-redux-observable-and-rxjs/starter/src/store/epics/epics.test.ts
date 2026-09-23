/**
 * TODO(lab-7.1): marble tests for the epics.
 *
 * An epic is a pure function — actions and state in, actions out — so there is
 * no React, no store and no network here. `TestScheduler` removes the clock
 * too: inside `scheduler.run(...)` RxJS swaps its schedulers for a virtual
 * one, so a 400 ms debounce and an 800 ms retry backoff cost nothing and
 * resolve deterministically.
 *
 * Reading a marble string — every character is ONE MILLISECOND:
 *
 *   'a'          a value at frame 0
 *   '-'          one empty frame
 *   ' 99ms '     ninety-nine empty frames (whitespace is ignored)
 *   '|'          the stream completes
 *   '#'          the stream errors
 *   '^' / '!'    in a subscription marble: subscribed / unsubscribed here
 *
 * The harness you need, in four pieces:
 *
 *   const scheduler = new TestScheduler((actual, expected) => {
 *     expect(actual).toEqual(expected);
 *   });
 *   const state$ = new StateObservable(NEVER, someRootState);   // from redux-observable
 *   const deps: EpicDeps = { listProducts: () => cold('--r|', { r: PAGE }), … };
 *   scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => { … });
 *
 * Build the root state by folding real actions through `rootReducer` rather
 * than hand-writing a fake shape — a fake shape is a test that passes after
 * you break the reducer.
 *
 * `expectSubscriptions` is the one to reach for when the claim is about
 * CANCELLATION: it records when the test subscribed to the inner Observable
 * and when it stopped, which is precisely what `switchMap` promises.
 *
 * One gotcha you will hit: `loadBackoffMs` has deliberate jitter, so pin it
 * with `vi.spyOn(Math, 'random').mockReturnValue(0)` in a `beforeEach`.
 *
 * Turn each `it.todo` into a real test. `npm test` is green now because a todo
 * is not a failure — it will stay green, with more in it, as you go.
 */
import { describe, it } from 'vitest';

describe('loadEpic', () => {
  it.todo('loads once when the console opens');
  it.todo('debounces a burst of keystrokes into ONE request');
  it.todo('CANCELS the in-flight request when a new filter arrives (switchMap)');
  it.todo('retries twice with exponential backoff, then reports the failure');
  it.todo('does NOT retry a failure that cannot succeed (a 404)');
  it.todo('stops on consoleClosed (takeUntil) and restarts when it reopens');
});

describe('saveStockEpic', () => {
  it.todo('runs two rows concurrently and cancels neither (mergeMap, not switchMap)');
  it.todo('turns one row’s failure into one row’s action, and keeps the epic alive');
});

describe('flashClearEpic', () => {
  it.todo('clears each tick’s highlight 1.2 s later, independently');
});

describe('bulkRestockEpic', () => {
  it.todo('keeps at most four rows in flight, then reports honestly');
  it.todo('reports a partial failure by id and reason rather than dying on the first');
});
