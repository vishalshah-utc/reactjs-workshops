/**
 * MARBLE TESTS.
 *
 * An epic is a pure function: actions and state in, actions out. No React, no
 * store, no network — and, with `TestScheduler`, no clock either. Inside
 * `scheduler.run(...)` RxJS swaps its schedulers for a virtual one, so a
 * 400 ms debounce and an 800 ms retry backoff cost nothing and resolve
 * deterministically.
 *
 * Reading a marble string: every character is ONE MILLISECOND.
 *
 *   'a'          a value at frame 0
 *   '-'          one empty frame
 *   ' 99ms '     ninety-nine empty frames (whitespace is ignored, so the
 *                spaces are only for your eyes)
 *   '|'          the stream completes
 *   '#'          the stream errors
 *   '^'          in a subscription marble: subscribed here
 *   '!'          in a subscription marble: unsubscribed here
 *
 * `expectSubscriptions` is the one to reach for when the assertion is about
 * CANCELLATION: it records when the test asked the inner Observable for
 * values and when it stopped, which is exactly the claim `switchMap` makes.
 */
import { StateObservable } from 'redux-observable';
import { NEVER, Observable, Subject, of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { Product, ProductListResponse } from '../../types';
import { categoryChanged, searchChanged } from '../filters';
import {
  consoleClosed,
  consoleOpened,
  feedFlashCleared,
  feedTicked,
  inventoryFailed,
  inventoryLoaded,
  inventoryLoading,
  stockSaveFailed,
  stockSaveRequested,
  stockSaveSucceeded,
} from '../inventory';
import { rootReducer, type RootState } from '../rootReducer';
import { bulkRestockEpic } from './bulk';
import type { EpicDeps } from './deps';
import { flashClearEpic } from './feed';
import { loadEpic, saveStockEpic } from './inventory';

// ------------------------------------------------------------------ fixtures

const product = (id: number, stock: number): Product => ({
  id,
  title: `P${id}`,
  description: '',
  category: 'beauty',
  price: 10,
  discountPercentage: 0,
  rating: 4,
  stock,
  thumbnail: '',
});

const PAGE: ProductListResponse = { products: [product(1, 5), product(2, 50)], total: 2, skip: 0, limit: 12 };

/** A real root state, built by the real reducers — no hand-written fake shape. */
function stateWith(...actions: UnknownAction[]): RootState {
  return actions.reduce<RootState>(
    (state, action) => rootReducer(state, action),
    rootReducer(undefined, { type: '@@INIT' }),
  );
}

/** `state$` never emits in these tests; every epic here reads `state$.value`. */
const stateOf = (state: RootState) => new StateObservable(NEVER, state);

const noDeps = (over: Partial<EpicDeps> = {}): EpicDeps => ({
  listProducts: () => of(PAGE),
  updateProduct: (id, patch) => of(product(id, patch.stock)),
  openFeed: () => {
    throw new Error('not used in this test');
  },
  ...over,
});

let scheduler: TestScheduler;

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  // The retry backoff has jitter, on purpose (see `loadBackoffMs`). Pin it so
  // the marble frames are exact.
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --------------------------------------------------------------- the load

describe('loadEpic', () => {
  it('loads once when the console opens', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const action$ = hot<UnknownAction>('a', { a: consoleOpened() });
      const response$ = cold('--r|', { r: PAGE });
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      expectObservable(out$).toBe('l-d', {
        l: inventoryLoading(),
        d: inventoryLoaded({ products: PAGE.products, total: 2, page: 0 }),
      });
    });
  });

  it('debounces a burst of keystrokes into ONE request', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      // Four characters typed 100 ms apart, then silence.
      const action$ = hot<UnknownAction>('o 99ms a 99ms b 99ms c 99ms d', {
        o: consoleOpened(),
        a: searchChanged('l'),
        b: searchChanged('li'),
        c: searchChanged('lip'),
        d: searchChanged('lips'),
      });
      const response$ = cold('--r|', { r: PAGE });
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      // Frame 0: the open-the-console load. Frame 800: 400 ms after the LAST
      // keystroke at frame 400 — one request for four characters.
      expectObservable(out$).toBe('l-d 797ms l-d', {
        l: inventoryLoading(),
        d: inventoryLoaded({ products: PAGE.products, total: 2, page: 0 }),
      });
    });
  });

  it('CANCELS the in-flight request when a new filter arrives (switchMap)', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const action$ = hot<UnknownAction>('o 49ms c', { o: consoleOpened(), c: categoryChanged('beauty') });
      // A slow request: 100 ms. The second one starts at frame 50.
      const response$ = cold('100ms r|', { r: PAGE });
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      // Two subscriptions. The FIRST is unsubscribed at frame 50 — before it
      // ever emitted — which is the whole claim: the request is cancelled, not
      // merely ignored. Demo 24b needed a request id to ignore it and an
      // AbortController to cancel it; this is one operator.
      expectSubscriptions(response$.subscriptions).toBe(['^ 49ms !', '50ms ^ 100ms !']);

      expectObservable(out$).toBe('l 49ms l 99ms d', {
        l: inventoryLoading(),
        d: inventoryLoaded({ products: PAGE.products, total: 2, page: 0 }),
      });
    });
  });

  it('retries twice with exponential backoff, then reports the failure', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const action$ = hot<UnknownAction>('o', { o: consoleOpened() });
      // Fails after 10 ms, every time.
      const response$ = cold<ProductListResponse>('10ms #', {}, new Error('boom'));
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      // attempt 1 at 0 (fails at 10) → wait 400 → attempt 2 at 410 (fails at
      // 420) → wait 800 → attempt 3 at 1220 (fails at 1230) → give up.
      expectSubscriptions(response$.subscriptions).toBe([
        '^ 9ms !',
        '410ms ^ 9ms !',
        '1220ms ^ 9ms !',
      ]);

      // ONE `inventoryLoading`, at frame 0 — because `startWith` sits AFTER
      // `retry`. Move it above and the spinner restarts on every attempt.
      //
      // And no `|`: the epic does NOT complete when a request fails. It is
      // still subscribed, still waiting for the next filter change. An epic
      // that completes is an epic that has stopped working for ever.
      expectObservable(out$).toBe('l 1229ms f', {
        l: inventoryLoading(),
        f: inventoryFailed({ message: 'boom', status: 0, code: 'CLIENT', requestId: undefined, isRetryable: true }),
      });
    });
  });

  it('does NOT retry a failure that cannot succeed (a 404)', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const action$ = hot<UnknownAction>('o', { o: consoleOpened() });
      const notFound = Object.assign(new Error("Product with id '9999' not found"), {
        isAxiosError: true,
        response: { status: 404, data: { message: "Product with id '9999' not found" } },
        config: {},
        toJSON: () => ({}),
      });
      const response$ = cold<ProductListResponse>('10ms #', {}, notFound);
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      // One attempt only: the `delay` callback rethrows for a non-retryable
      // status, which is how you say "stop" to `retry`.
      expectSubscriptions(response$.subscriptions).toBe(['^ 9ms !']);
      expectObservable(out$).toBe('l 9ms f', {
        l: inventoryLoading(),
        f: inventoryFailed({
          // DummyJSON's own message, carried through the error normaliser —
          // exactly as Demo 24b's `rejectWithValue(toErrorInfo(error))` did.
          message: "Product with id '9999' not found",
          status: 404,
          code: 'HTTP_404',
          requestId: undefined,
          isRetryable: false,
        }),
      });
    });
  });

  it('stops everything when the console closes (takeUntil) and restarts when it reopens', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const action$ = hot<UnknownAction>('o 49ms x 49ms o', {
        o: consoleOpened(),
        x: consoleClosed(),
      });
      const response$ = cold('100ms r|', { r: PAGE });
      const state$ = stateOf(stateWith());

      const out$ = loadEpic(action$, state$, noDeps({ listProducts: () => response$ }));

      // Cancelled at 50 by `consoleClosed`; a brand-new subscription at 100
      // because the OUTER switchMap rebuilt the stream. Remove that outer
      // switchMap and this second subscription never happens.
      expectSubscriptions(response$.subscriptions).toBe(['^ 49ms !', '100ms ^ 100ms !']);

      expectObservable(out$).toBe('l 99ms l 99ms d', {
        l: inventoryLoading(),
        d: inventoryLoaded({ products: PAGE.products, total: 2, page: 0 }),
      });
    });
  });
});

// ------------------------------------------------------- the per-row write

describe('saveStockEpic', () => {
  it('runs two rows CONCURRENTLY and cancels neither (mergeMap, not switchMap)', () => {
    scheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const action$ = hot<UnknownAction>('a 9ms b', {
        a: stockSaveRequested({ id: 1, stock: 42 }),
        b: stockSaveRequested({ id: 2, stock: 99 }),
      });
      const slow$ = cold('50ms p|', { p: product(1, 42) });
      const state$ = stateOf(stateWith());

      const out$ = saveStockEpic(action$, state$, noDeps({ updateProduct: () => slow$ }));

      // Both subscriptions run to completion. Under `switchMap` the first
      // would read '^ 9ms !' and row 1 would sit on "saving" for ever.
      expectSubscriptions(slow$.subscriptions).toBe(['^ 50ms !', '10ms ^ 50ms !']);

      expectObservable(out$).toBe('50ms a 9ms b', {
        a: stockSaveSucceeded({ id: 1, product: product(1, 42) }),
        b: stockSaveSucceeded({ id: 2, product: product(1, 42) }),
      });
    });
  });

  it('turns one row’s failure into one row’s action, and keeps the epic alive', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const action$ = hot<UnknownAction>('a 9ms b', {
        a: stockSaveRequested({ id: 1, stock: 42 }),
        b: stockSaveRequested({ id: 2, stock: 99 }),
      });
      const state$ = stateOf(stateWith());
      let call = 0;

      const out$ = saveStockEpic(
        action$,
        state$,
        noDeps({
          updateProduct: (id, patch) => {
            call += 1;
            return call === 1 ? cold('5ms #', {}, new Error('nope')) : cold('5ms p|', { p: product(id, patch.stock) });
          },
        }),
      );

      // Without the inner `catchError`, the first error would kill the epic and
      // the second row would never be heard from again.
      expectObservable(out$).toBe('5ms a 9ms b', {
        a: stockSaveFailed({
          id: 1,
          error: { message: 'nope', status: 0, code: 'CLIENT', requestId: undefined, isRetryable: true },
        }),
        b: stockSaveSucceeded({ id: 2, product: product(2, 99) }),
      });
    });
  });
});

// --------------------------------------------------------------- the flash

describe('flashClearEpic', () => {
  it('clears each tick’s highlight 1.2 s later, independently (mergeMap, not switchMap)', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<UnknownAction>('a 299ms b', {
        a: feedTicked({ at: 1, changes: [{ id: 1, stock: 5 }] }),
        b: feedTicked({ at: 2, changes: [{ id: 2, stock: 9 }] }),
      });

      const out$ = flashClearEpic(action$, stateOf(stateWith()), noDeps());

      // Two clears, 300 ms apart, each 1200 ms after its own tick. Under
      // `switchMap` the first would be cancelled and row 1 would glow for ever.
      expectObservable(out$).toBe('1200ms a 299ms b', {
        a: feedFlashCleared([1]),
        b: feedFlashCleared([2]),
      });
    });
  });
});

// ----------------------------------------------------------------- the bulk

describe('bulkRestockEpic', () => {
  /**
   * Not a marble test. This one asserts CONCURRENCY, and the clearest way to
   * see a concurrency limit is to count how many requests are open at once —
   * so the epic runs against a real action stream and a fake API that never
   * answers until it is told to.
   */
  it('keeps at most four rows in flight, then reports honestly', async () => {
    const ids = [1, 2, 3, 4, 5, 6];
    const loaded = inventoryLoaded({ products: ids.map((id) => product(id, 10)), total: 6, page: 0 });

    const action$ = new Subject<UnknownAction>();
    const state$ = stateOf(stateWith(loaded));

    let inFlight = 0;
    let peak = 0;
    const resolvers: (() => void)[] = [];

    const deps = noDeps({
      updateProduct: (id, patch) =>
        new Observable<Product>((subscriber) => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          resolvers.push(() => {
            inFlight -= 1;
            subscriber.next(product(id, patch.stock));
            subscriber.complete();
          });
        }),
    });

    const emitted: UnknownAction[] = [];

    // The real wiring in miniature: the bulk epic emits `stockSaveRequested`,
    // the save epic answers it, and both outputs go back into `action$`. That
    // loop is how bulk reuses the per-row path instead of duplicating it.
    const sub = bulkRestockEpic(action$, state$, deps).subscribe((action) => {
      emitted.push(action);
      action$.next(action);
    });
    const saveSub = saveStockEpic(action$, state$, deps).subscribe((action) => {
      emitted.push(action);
      action$.next(action);
    });

    action$.next({ type: 'inventory/bulkRestockRequested', payload: { amount: 10, ids } } as UnknownAction);

    expect(peak).toBe(4);

    // Let them all finish, four at a time.
    while (resolvers.length) resolvers.shift()!();
    await Promise.resolve();

    expect(emitted.filter((a) => a.type === 'inventory/bulkProgressed')).toHaveLength(6);
    const finished = emitted.find((a) => a.type === 'inventory/bulkRestockFinished');
    expect(finished).toMatchObject({ payload: { failed: [] } });

    sub.unsubscribe();
    saveSub.unsubscribe();
  });

  it('reports a partial failure by id and reason rather than dying on the first one', async () => {
    const ids = [1, 2];
    const loaded = inventoryLoaded({ products: ids.map((id) => product(id, 10)), total: 2, page: 0 });

    const action$ = new Subject<UnknownAction>();
    const state$ = stateOf(stateWith(loaded));

    const deps = noDeps({
      updateProduct: (id, patch) =>
        id === 1 ? throwError(() => new Error("Product with id '9999' not found")) : of(product(id, patch.stock)),
    });

    const emitted: UnknownAction[] = [];
    const subs = [bulkRestockEpic, saveStockEpic].map((epic) =>
      epic(action$, state$, deps).subscribe((action) => {
        emitted.push(action);
        action$.next(action);
      }),
    );

    action$.next({ type: 'inventory/bulkRestockRequested', payload: { amount: 10, ids } } as UnknownAction);

    const finished = emitted.find((a) => a.type === 'inventory/bulkRestockFinished');
    expect(finished).toMatchObject({
      payload: { failed: [{ id: 1, reason: "Product with id '9999' not found" }] },
    });
    // The row that worked still worked.
    expect(emitted.filter((a) => a.type === 'inventory/stockSaveSucceeded')).toHaveLength(1);

    for (const sub of subs) sub.unsubscribe();
  });
});
