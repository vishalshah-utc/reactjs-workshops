import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from './filters';
import inventoryReducer from './inventory';
import recentReducer from './recent';

/**
 * TODO(lab-1.2): one store, created once, at module scope.
 *
 * `configureStore` already does what four packages and forty lines of
 * boilerplate used to: `combineReducers` over the map below, redux-thunk
 * installed, the development-only immutability and serializability checks, and
 * the DevTools connection.
 *
 * TODO(lab-2.4): add `middleware: (getDefaultMiddleware) => getDefaultMiddleware({…})`
 * with `thunk: { extraArgument: extra }` so every thunk is handed the API
 * layer, and read the serializability warning the lab tells you to provoke.
 *
 * TODO(lab-6.4): mount the RTK Query slice — `[inventoryApi.reducerPath]:
 * inventoryApi.reducer`, `.concat(inventoryApi.middleware)` — and call
 * `setupListeners(store.dispatch)`.
 *
 * TODO(lab-7.1): turn the DevTools connection off in production and give it a
 * name and a trace in development.
 *
 * Lab 5 also adds `.prepend(listenerMiddleware.middleware)` and the
 * `preloadedState: { recent: loadRecent() }` that hydrates F6.
 */
export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    inventory: inventoryReducer,
    recent: recentReducer,
  },
});

/**
 * The two types every other file imports. They are DERIVED from the store,
 * never declared by hand: add a slice and `RootState` grows a key with no
 * further edits.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
