import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logger } from '../config/logger';
import { signedOut } from './session';
import type { RootState } from './index';

export const RECENT_KEY = 'shopscope.inventory.recent';
export const RECENT_VERSION = 2;
const MAX_RECENT = 8;

export interface RecentState {
  /** Most recent first. At most MAX_RECENT. */
  ids: number[];
}

const initialState: RecentState = { ids: [] };

/**
 * What version 2 looks like on disk.
 *
 * Version 1 was `{ recentlyViewed: [{ id, title }] }` — no version field, and
 * it cached the TITLE, which is the mistake that made v2 necessary: a title is
 * the catalogue's, it changes without telling you, and a persisted copy shows a
 * name that was edited three weeks ago. v2 keeps ids and nothing else.
 */
interface PersistedV1 {
  recentlyViewed: { id: number; title?: string }[];
}

interface PersistedV2 {
  version: number;
  ids: number[];
}

/**
 * F6. Read what is on disk, whatever shape it is in, and return state this
 * build understands. Three rules, and they are the whole of persistence:
 *
 * 1. **Never trust storage.** It is a string another tab, an older build or a
 *    user with devtools open may have written. Parse, then validate.
 * 2. **Never throw.** A corrupt entry means "no history", not a white screen.
 * 3. **Migrate forwards only.** Recognise the old shape, convert it, and move
 *    on. Deleting it is also a valid migration — say so in the code.
 */
export function loadRecent(): RecentState {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return initialState;

    const parsed: unknown = JSON.parse(raw);

    // v1 → v2. No version field, and an array of objects that cached the title.
    // Keep the ids, drop the titles, and let the next save rewrite the entry.
    const v1 = parsed as Partial<PersistedV1>;
    if (Array.isArray(v1?.recentlyViewed)) {
      logger.info('[recent] migrating v1 (recentlyViewed) → v2 (ids only)');
      return {
        ids: v1.recentlyViewed
          .map((entry) => entry?.id)
          .filter((id): id is number => typeof id === 'number')
          .slice(0, MAX_RECENT),
      };
    }

    const candidate = parsed as Partial<PersistedV2>;
    if (candidate?.version === RECENT_VERSION && Array.isArray(candidate.ids)) {
      return { ids: candidate.ids.filter((id): id is number => typeof id === 'number').slice(0, MAX_RECENT) };
    }

    // A version from the future, or something else entirely. Start over.
    logger.warn(`[recent] unknown persisted shape (version ${String(candidate?.version)}) — discarding`);
    return initialState;
  } catch (error) {
    logger.warn('[recent] could not read localStorage', error);
    return initialState;
  }
}

/** Called by the listener middleware, never by a reducer — writing to disk is a side effect. */
export function saveRecent(state: RecentState): void {
  try {
    const payload: PersistedV2 = { version: RECENT_VERSION, ids: state.ids };
    localStorage.setItem(RECENT_KEY, JSON.stringify(payload));
  } catch (error) {
    // Safari in private mode, a full quota, a blocked origin. Not fatal.
    logger.warn('[recent] could not write localStorage', error);
  }
}

const recentSlice = createSlice({
  name: 'recent',
  initialState,
  reducers: {
    /** Most recent first, de-duplicated, capped. The rule lives here, once. */
    inspected(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.ids = [id, ...state.ids.filter((existing) => existing !== id)].slice(0, MAX_RECENT);
    },
    recentCleared(state) {
      state.ids = [];
    },
  },
  extraReducers: (builder) => {
    // F7 again. `recent` is user-scoped, so signing out empties it.
    builder.addCase(signedOut, () => initialState);
  },
});

export const { inspected, recentCleared } = recentSlice.actions;

export const selectRecentIds = (state: RootState) => state.recent.ids;

/** The ids that are also on the current page, so the strip can show titles. */
export const selectRecentProducts = createSelector(
  [selectRecentIds, (state: RootState) => state.inventory.entities],
  (ids, entities) => ids.map((id) => ({ id, title: entities[id]?.title })),
);

export default recentSlice.reducer;
