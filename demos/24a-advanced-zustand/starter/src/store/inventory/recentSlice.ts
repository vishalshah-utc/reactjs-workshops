import type { RecentSlice, SliceOf } from './types';

/** Eight. A list you can scan, not a history you have to search. */
export const RECENT_LIMIT = 8;

export const initialRecent = { recent: { ids: [] } } satisfies Omit<RecentSlice, 'inspect' | 'clearRecent'>;

/**
 * The ONE slice that survives a reload — see `partialize` in `index.ts`.
 *
 * TODO(lab-6.1): `inspect(id)` puts the id at the FRONT, removes any earlier
 * copy of it, and caps the list at RECENT_LIMIT — three rules, one place. Note
 * what it stores: ids, not products. A persisted product is a price that was
 * true in March being read back in November.
 */
export const createRecentSlice: SliceOf<RecentSlice> = () => ({
  ...initialRecent,

  inspect: () => {},
  clearRecent: () => {},
});
