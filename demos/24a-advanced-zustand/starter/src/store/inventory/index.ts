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
 * One store, five slices — and, from Lab 1 C, four middlewares.
 *
 * TODO(lab-1.3): wrap the slices in the stack, outside-in:
 *
 *   devtools( persist( immer( subscribeWithSelector( slices ) ) ) )
 *
 * devtools outermost (or it never sees what rehydration did), immer innermost
 * of the four (or the middlewares above it are handed a draft instead of a
 * state). Name the devtools instance and gate it on `env.isDev`. Then go back
 * to `types.ts` and make `SliceOf` list these four mutators in this order.
 *
 * TODO(lab-6.2): the `persist` options — `storage`, `version`, `partialize`
 * (one key survives: `recent`), `migrate` from the version 1 shape
 * `{ recentlyViewed: [{ id, title }] }`, a `merge` that is not shallow, and
 * `onRehydrateStorage` for the "did it work?" question.
 *
 * TODO(lab-6.3): register the reset — and remember that `setState(next, true)`
 * REPLACES the state object, actions included.
 *
 * TODO(lab-6.1): the transient `subscribe(selector, listener)` that
 * `subscribeWithSelector` exists for — a side effect outside React, with no
 * component subscribed and no render caused.
 */
export const useInventoryStore = create<InventoryStore>()((...args) => ({
  ...createFiltersSlice(...args),
  ...createCatalogueSlice(...args),
  ...createEditSlice(...args),
  ...createBulkSlice(...args),
  ...createRecentSlice(...args),
}));
