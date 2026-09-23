import { combineReducers } from '@reduxjs/toolkit';
import { inventoryApi } from '../api/inventoryApi';
import feedReducer from './feed';
import filtersReducer from './filters';
import inventoryReducer from './inventory';
import recentReducer from './recent';

/**
 * The slice map, extracted into its own file — and this is a change Demo 24b
 * did not need.
 *
 * In Demo 24b, `RootState` was `ReturnType<typeof store.getState>`, derived
 * straight from `configureStore`. That works right up to the moment a piece of
 * middleware has to be TYPED against the state it will see. Today one does:
 *
 *   epicMiddleware : Middleware<{}, RootState>          ← needs RootState
 *   store          : configureStore({ middleware: […epicMiddleware] })
 *   RootState      = ReturnType<typeof store.getState>  ← needs the store
 *
 * A real cycle, and TypeScript says so in plain words:
 * *"Type alias 'RootState' circularly references itself."*
 *
 * The fix is to give the state a definition that does not go through the
 * store. `combineReducers` produces the same shape the slice map would have
 * produced, so `RootState` is unchanged for every other file in the app — but
 * it now depends only on the slices, and the middleware and the store can both
 * depend on it.
 *
 * This is the standard answer whenever typed middleware meets an inferred
 * `RootState`, and it costs one file.
 */
export const rootReducer = combineReducers({
  filters: filtersReducer,
  inventory: inventoryReducer,
  recent: recentReducer,
  feed: feedReducer,
  [inventoryApi.reducerPath]: inventoryApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
