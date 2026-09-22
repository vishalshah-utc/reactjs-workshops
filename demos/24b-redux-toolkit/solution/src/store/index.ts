import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { inventoryApi } from '../api/inventoryApi';
import { env } from '../config/env';
import { extra } from './extra';
import filtersReducer from './filters';
import inventoryReducer from './inventory';
import { listenerMiddleware } from './listeners';
import recentReducer, { loadRecent } from './recent';

/**
 * ONE store, created once, at module scope.
 *
 * `configureStore` is `createStore` plus every decision a real app makes
 * anyway: `combineReducers` over the slice map, `redux-thunk` installed, the
 * development-only immutability and serializability checks, and the Redux
 * DevTools connection. Each of those was a separate package and four lines of
 * boilerplate in 2018; this is why "Redux" and "Redux Toolkit" are not the
 * same conversation.
 */
export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    inventory: inventoryReducer,
    recent: recentReducer,
    // A slice like any other — RTK Query's cache IS Redux state, which is why
    // you can see it in the devtools and why time-travel includes it.
    [inventoryApi.reducerPath]: inventoryApi.reducer,
  },

  /**
   * F6's hydration. `preloadedState` runs ONCE, before the first render, which
   * is why there is no flash of an empty list and no `useEffect` to rehydrate.
   * The keys must match the reducer map exactly.
   */
  preloadedState: {
    recent: loadRecent(),
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * The `extra` argument, reaching every thunk as `thunkApi.extra`. One
       * line here replaces an import in every thunk — and is what lets a test
       * hand the store a fake API (Lab 7).
       */
      thunk: { extraArgument: extra },

      /**
       * The two development-only checks. Both are ON by default; both are
       * stripped from a production build.
       *
       * `serializableCheck` walks every action and the whole state after it,
       * and warns about anything that is not plain data. It is the reason
       * `rejectWithValue(toErrorInfo(error))` exists: put the `ApiError`
       * instance in and you get
       *   "A non-serializable value was detected in the state, in the path:
       *    `inventory.error`."
       * The WRONG fix is to add that path to `ignoredPaths` — the check is
       * right, and time-travel really would break. The right fix is to store
       * data.
       */
      serializableCheck: {
        // RTK Query's internal actions carry a promise-shaped meta that is
        // intentionally exempt. This is the ONE ignore list that is not a smell.
        ignoredActions: ['inventoryApi/executeQuery/pending'],
      },
      immutableCheck: true,
    })
      /**
       * ORDER. `prepend` puts the listener middleware BEFORE the thunk
       * middleware so a listener sees an action before a thunk dispatched from
       * it can run; `concat` puts the API middleware last, where it belongs.
       * Both return a new typed tuple — never build the array by hand.
       */
      .prepend(listenerMiddleware.middleware)
      .concat(inventoryApi.middleware),

  /**
   * F8. `false` in production — the extension hook would otherwise let any
   * script on the page read your whole store.
   */
  devTools: env.isDev && {
    name: `ShopScope · ${env.mode}`,
    // Where an action was dispatched from, in the devtools' Trace tab. It costs
    // a stack capture per action, so it is a development luxury only.
    trace: true,
    traceLimit: 20,
  },
});

/**
 * `refetchOnFocus` / `refetchOnReconnect` need somebody to tell them the window
 * regained focus. This is that somebody — one call, and it returns its own
 * unsubscribe.
 */
setupListeners(store.dispatch);

/**
 * The two types every other file imports.
 *
 * They are DERIVED from the store, never declared by hand: add a slice to the
 * reducer map and `RootState` grows a key with no further edits, and a selector
 * that reads a slice you deleted stops compiling.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
