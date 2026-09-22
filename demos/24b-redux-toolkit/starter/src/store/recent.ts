import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logger } from '../config/logger';
import type { RootState } from './index';

export const RECENT_KEY = 'shopscope.inventory.recent';
export const RECENT_VERSION = 2;

export interface RecentState {
  /** Most recent first. At most eight. */
  ids: number[];
}

const initialState: RecentState = { ids: [] };

/**
 * TODO(lab-5.1): F6 — read what is on disk, whatever shape it is in.
 *
 * Version 1 was `{ recentlyViewed: [{ id, title }] }` — no version field, and
 * it cached the TITLE, which is the mistake that made v2 necessary: a title is
 * the catalogue's, it changes without telling you, and a persisted copy shows a
 * name that was edited three weeks ago.
 * Version 2 is `{ version: 2, ids: number[] }` — ids and nothing else.
 *
 * Three rules, and they are the whole of persistence:
 *  1. never trust storage — parse, then validate;
 *  2. never throw — a corrupt entry means "no history", not a white screen;
 *  3. migrate forwards only, and say so in the code when a migration is a
 *     deletion.
 */
export function loadRecent(): RecentState {
  logger.debug('[recent] TODO(lab-5.1)');
  return initialState;
}

/** Called by the listener middleware, never by a reducer — writing to disk is a side effect. */
export function saveRecent(_state: RecentState): void {
  // TODO(lab-5.3): write `{ version: RECENT_VERSION, ids }` and swallow the
  // failure — Safari in private mode, a full quota, a blocked origin.
}

const recentSlice = createSlice({
  name: 'recent',
  initialState,
  reducers: {
    /** TODO(lab-5.1): most recent first, de-duplicated, capped at eight. */
    inspected(_state, _action: PayloadAction<number>) {},
    recentCleared(state) {
      state.ids = [];
    },
  },
  /** TODO(lab-5.4): `signedOut` empties this slice too. */
  extraReducers: (_builder) => {},
});

export const { inspected, recentCleared } = recentSlice.actions;

export const selectRecentIds = (state: RootState) => state.recent.ids;

/** TODO(lab-5.6): pair each id with its title, when the product is on the page. */
export const selectRecentProducts = (_state: RootState): { id: number; title?: string }[] => [];

export default recentSlice.reducer;
