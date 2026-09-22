import { create } from 'zustand';
import { createJSONStorage, devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { registerReset } from '../registry';
import { createBulkSlice, initialBulk } from './bulkSlice';
import { createCatalogueSlice, initialCatalogue } from './catalogueSlice';
import { createEditSlice, initialEdit } from './editSlice';
import { createFiltersSlice, initialFiltersState } from './filtersSlice';
import { RECENT_LIMIT, createRecentSlice, initialRecent } from './recentSlice';
import type { InventoryStore } from './types';

/** What the persisted slice looks like on disk. Exported so the test can build one. */
export interface PersistedInventory {
  recent: { ids: number[] };
}

/** The shape version 1 wrote. Kept so `migrate` has something to be typed against. */
interface PersistedInventoryV1 {
  recentlyViewed?: { id: number; title: string }[];
}

export const INVENTORY_STORAGE_KEY = 'shopscope.inventory';
export const INVENTORY_PERSIST_VERSION = 2;

/**
 * THE MIDDLEWARE STACK, and its order:
 *
 *   devtools( persist( immer( subscribeWithSelector( slices ) ) ) )
 *
 * Read it outside-in — that is the order an update travels through.
 *   devtools               sees the finished next state, and the action name
 *   persist                writes the partialized slice after it settles
 *   immer                  turns your draft recipe into an immutable next state
 *   subscribeWithSelector  hands the result to selector-aware subscribers
 *
 * devtools OUTERMOST or it never sees what persist's rehydration did. immer
 * INNERMOST (of the four) or the middlewares above it are handed a draft
 * instead of a state. Change the order here and you must change
 * `InventoryMutators` in types.ts to match.
 */
export const useInventoryStore = create<InventoryStore>()(
  devtools(
    persist(
      immer(
        subscribeWithSelector((...args) => ({
          // `(...args)` is not a trick, it is the point: each slice creator has
          // the same (set, get, store) signature, so spreading the arguments
          // hands every slice the SAME set and get. That is what makes
          // `get().fetchPage()` work from inside the filters slice.
          ...createFiltersSlice(...args),
          ...createCatalogueSlice(...args),
          ...createEditSlice(...args),
          ...createBulkSlice(...args),
          ...createRecentSlice(...args),
        })),
      ),
      {
        name: INVENTORY_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        version: INVENTORY_PERSIST_VERSION,

        /**
         * WHAT NOT TO PERSIST is the whole of this option. Products are the
         * server's and go stale; `status`, `error` and `requestId` describe a
         * request that ended long ago; `selected` and `rows` describe a screen
         * nobody is looking at any more. One key survives.
         */
        partialize: (state) => ({ recent: state.recent }) satisfies PersistedInventory,

        /**
         * Version 1 stored `recentlyViewed: [{ id, title }]` — product
         * snapshots, which were true the day they were written and wrong ever
         * after. Version 2 keeps ids only. Without this function, every user
         * who ever opened version 1 loses their list silently.
         */
        migrate: (persisted, version) => {
          if (version >= INVENTORY_PERSIST_VERSION) return persisted as PersistedInventory;
          const old = (persisted ?? {}) as PersistedInventoryV1;
          const ids = (old.recentlyViewed ?? []).map((entry) => entry.id).slice(0, RECENT_LIMIT);
          logger.info(`[inventory] migrated persisted state v${version} → v${INVENTORY_PERSIST_VERSION} (${ids.length} ids)`);
          return { recent: { ids } } satisfies PersistedInventory;
        },

        /**
         * The default merge is SHALLOW, and `recent` is a nested object — so a
         * stored `{ recent: { ids: [1] } }` would replace the whole `recent`
         * object rather than its `ids`. It happens to be equivalent here; it
         * stops being equivalent the day `recent` gains a second key, and that
         * day is not a good day to discover it.
         */
        merge: (persisted, current) => {
          const stored = (persisted ?? {}) as Partial<PersistedInventory>;
          return { ...current, recent: { ...current.recent, ...stored.recent } };
        },

        /**
         * Runs BEFORE rehydration; the function it returns runs after, with the
         * state or the error. The classic use is exactly this: know when the
         * store is trustworthy, and never fail a render because storage did.
         */
        onRehydrateStorage: () => (state, error) => {
          if (error) logger.warn('[inventory] rehydration failed — starting empty', error);
          else logger.debug(`[inventory] rehydrated ${state?.recent.ids.length ?? 0} recent ids`);
        },
      },
    ),
    { name: 'ShopScope · inventory', enabled: env.isDev },
  ),
);

/**
 * F7. `setState(next, true)` REPLACES the state object — and the actions live
 * in that object, so a replace deletes `fetchPage` along with the data. Merge
 * the initial DATA back in and leave the functions where they are.
 */
registerReset(() => {
  useInventoryStore.setState(
    { ...initialFiltersState, ...initialCatalogue, ...initialEdit, ...initialBulk, ...initialRecent },
    false,
    'inventory/reset',
  );
});

/**
 * A TRANSIENT subscription — the thing `subscribeWithSelector` exists for.
 * It runs a side effect when one slice of state changes, outside React, with no
 * component subscribed and no render caused. `persist` already writes the list
 * to storage; this only reports it.
 */
if (env.isDev) {
  useInventoryStore.subscribe(
    (state) => state.recent.ids,
    (ids) => logger.debug(`[inventory] recently inspected: ${ids.join(', ') || '(none)'}`),
  );
}
