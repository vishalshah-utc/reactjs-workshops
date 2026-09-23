import { create } from 'zustand';
import { createBulkSlice } from './bulkSlice';
import { createCatalogueSlice } from './catalogueSlice';
import { createEditSlice } from './editSlice';
import { createFiltersSlice } from './filtersSlice';
import { createRecentSlice } from './recentSlice';
import type { InventoryStore } from './types';

export const INVENTORY_STORAGE_KEY = 'shopscope.inventory';
export const INVENTORY_PERSIST_VERSION = 2;

/**
 * ONE STORE, FIVE SLICES — and, today, no middleware at all.
 *
 * `(...args)` below is the whole of the slices pattern: every creator has the
 * same `(set, get, store)` signature, so spreading the arguments hands each of
 * them the SAME set and get. That is what will let `setFilter` in the filters
 * slice call `get().fetchPage(0)` in the catalogue slice.
 *
 * Four middlewares arrive over the rest of the day, one at a time, each when
 * something you are trying to do stops being possible without it. Every one of
 * them also adds an entry to `InventoryMutators` in `types.ts` — keep the two
 * in step, because the compiler reports the drift on a `set` call in a slice,
 * never on the middleware you changed.
 *
 * TODO(lab-2.1): `devtools`, OUTERMOST — because you are about to write a
 * request with three outcomes and no way to watch it happen. Wrap the create
 * call, name the instance, and gate it on `env.isDev`.
 *
 * TODO(lab-3.2): `immer`, INSIDE devtools — because the normalised entity
 * update you write in Lab 3 A is three nested spreads and one forgotten spread
 * away from a mutation bug.
 *
 * TODO(lab-6.2): `subscribeWithSelector`, INNERMOST — because the transient
 * subscription at the bottom of this file wants `subscribe(selector, listener)`
 * and the plain `subscribe` takes exactly one argument. Write the subscription
 * first, watch it fail to compile, then add the middleware.
 *
 * TODO(lab-6.3): `persist`, BETWEEN devtools and immer — because the recent
 * list has to survive a reload. Real options straight away: `storage`,
 * `version`, `partialize` (one key survives: `recent`), `migrate` from the
 * version 1 shape `{ recentlyViewed: [{ id, title }] }`, a `merge` that is not
 * shallow, and `onRehydrateStorage` for the "did it work?" question.
 *
 * TODO(lab-6.4): register the reset — and remember that `setState(next, true)`
 * REPLACES the state object, actions included.
 */
export const useInventoryStore = create<InventoryStore>()((...args) => ({
  ...createFiltersSlice(...args),
  ...createCatalogueSlice(...args),
  ...createEditSlice(...args),
  ...createBulkSlice(...args),
  ...createRecentSlice(...args),
}));
