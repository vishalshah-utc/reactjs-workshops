import type { RecentSlice, SliceOf } from './types';

/** Eight. A list you can scan, not a history you have to search. */
export const RECENT_LIMIT = 8;

export const initialRecent = { recent: { ids: [] } } satisfies Omit<RecentSlice, 'inspect' | 'clearRecent'>;

/**
 * The ONE slice that survives a reload — see `partialize` in `index.ts`.
 *
 * It holds IDS, not products. A persisted product is a lie with a long shelf
 * life: its price and stock were true on the day it was written and are read
 * back months later as if they were current. An id cannot go stale; the worst
 * that happens is that it no longer resolves, and the UI simply skips it.
 */
export const createRecentSlice: SliceOf<RecentSlice> = (set) => ({
  ...initialRecent,

  inspect: (id) =>
    set(
      (state) => {
        // Most recent first, no duplicates, capped. Three rules, one place.
        const without = state.recent.ids.filter((existing) => existing !== id);
        state.recent.ids = [id, ...without].slice(0, RECENT_LIMIT);
      },
      false,
      `inventory/inspect:${id}`,
    ),

  clearRecent: () =>
    set(
      (state) => {
        state.recent.ids = [];
      },
      false,
      'inventory/clearRecent',
    ),
});
