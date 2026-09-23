import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { inventoryApi } from '../api/inventoryApi';
import { env } from '../config/env';
import { loadRecent } from './recent';
import { rootReducer } from './rootReducer';

/**
 * ONE store, created once, at module scope — unchanged from Demo 24b except
 * for one middleware and one new slice.
 *
 * That is the headline of this demo. Swapping the entire side-effect layer of
 * an application touched `reducer` (one line, for the feed) and `middleware`
 * (one line, for the epics). Reducers, selectors, components and the RTK Query
 * cache all carried on as they were. A side-effect library that demanded more
 * than this would be too entangled to evaluate.
 */
export const store = configureStore({
  /**
   * The slice map now lives in `rootReducer.ts`, because `RootState` has to be
   * knowable WITHOUT the store — the epic middleware is typed against it, and
   * the store is typed against the middleware. See that file for the cycle and
   * the one-line fix.
   */
  reducer: rootReducer,

  preloadedState: {
    recent: loadRecent(),
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * `thunk` stays ON, and that is a deliberate statement rather than an
       * oversight. RTK Query is built on thunks, so turning them off would
       * break the cache — and, more usefully, thunks and epics coexist
       * happily: an app can adopt epics for the streams and leave a one-shot
       * thunk exactly where it is. You are not signing up for a rewrite.
       *
       * What is GONE is `extraArgument`. The epics take their dependencies
       * through `createEpicMiddleware({ dependencies })` instead, and
       * `src/store/extra.ts` was deleted with the thunks that used it.
       */
      serializableCheck: {
        ignoredActions: ['inventoryApi/executeQuery/pending'],
      },
      immutableCheck: true,
    })
      /**
       * TODO(lab-1.4): add the epic middleware, and then start it.
       *
       *   .concat(epicMiddleware)          // ← here, BEFORE the api middleware
       *
       * ORDER, and it is different from Demo 24b's. The listener middleware
       * was PREPENDED so a listener could see an action before a thunk
       * dispatched from it ran. The epic middleware must be CONCATENATED,
       * after the thunk middleware.
       *
       * Prove it to yourself rather than believing it: log every value the
       * epic's `action$` emits, then dispatch a thunk. With `.concat` the
       * epic sees `["inventory/loaded"]`; with `.prepend` it sees
       * `["inventory/loaded", <a function>]` — the raw thunk, travelling down
       * the chain before anything has turned it into actions.
       *
       * The practical rule: epics see plain actions, after the reducers have
       * already handled them, which is why `state$.value` inside an epic is
       * always the state AFTER the action it is reacting to.
       */
      .concat(inventoryApi.middleware),

  devTools: env.isDev && {
    name: `ShopScope · ${env.mode}`,
    trace: true,
    traceLimit: 20,
  },
});

/**
 * TODO(lab-1.4): and `runEpics();` goes HERE, after the store.
 *
 * AFTER the store, never before, and this is the first thing that goes wrong
 * for everybody.
 *
 * `createEpicMiddleware` builds `action$` and `state$` out of the store's
 * `dispatch` and `getState`, and it only has those once `configureStore` has
 * installed it. Call `run()` first and — verified against 3.0.0-rc.3, not
 * assumed — nothing throws. You get a console warning:
 *
 *   redux-observable | WARNING: epicMiddleware.run(rootEpic) called before the
 *   middleware has been setup by redux. Provide the epicMiddleware instance to
 *   createStore() first.
 *
 * …and then every epic is silently inert for the life of the application. A
 * warning in a noisy console and an app where nothing loads: worse than a
 * throw, and worth recognising on sight.
 */
setupListeners(store.dispatch);

/**
 * `RootState` is re-exported from here so that every other file in the app can
 * keep importing it from `src/store` exactly as it did in Demo 24b. Its
 * DEFINITION moved to `rootReducer.ts`; its meaning did not change.
 */
export type { RootState } from './rootReducer';
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
