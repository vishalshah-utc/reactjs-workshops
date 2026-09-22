import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { env } from '../config/env';

export type SortKey = 'title' | 'price' | 'stock' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface FiltersState {
  /** Already debounced by the toolbar — the store holds the committed value. */
  q: string;
  /** '' means every category. */
  category: string;
  /** stock < LOW_STOCK. DummyJSON has no stock predicate, so this narrows on the client. */
  lowStockOnly: boolean;
  sortBy: SortKey;
  order: SortOrder;
  /** 0-based, like `skip`. */
  page: number;
  /**
   * DEV ONLY. The toolbar's "Simulated latency" select, in milliseconds.
   * It is part of the filters — and therefore part of the request identity —
   * so switching it re-requests and every later request is slow too. That is
   * what makes the race in Lab 2 reproducible without editing a URL by hand.
   */
  delayMs: number;
}

/** F3's "low stock" line. DummyJSON has no stock predicate, so this is applied
 *  in a selector over the loaded page — see Lab 3. */
export const LOW_STOCK = 20;

/** One number, read from the validated env (VITE_PAGE_SIZE, 12). */
export const PAGE_SIZE = env.pageSize;

const initialState: FiltersState = {
  q: '',
  category: '',
  lowStockOnly: false,
  sortBy: 'title',
  order: 'asc',
  page: 0,
  delayMs: 0,
};

/**
 * TODO(lab-1.1): your first slice.
 *
 * Fill in the six case reducers below. Write them the "mutating" way —
 * `createSlice` runs each one inside Immer, so `state.q = …` is recorded
 * against a draft and a new object comes out.
 *
 * Two rules to get right:
 *  - every FILTER change must also reset `page` to 0 (F3);
 *  - `sortChanged` takes TWO arguments and produces ONE payload, which is what
 *    a `prepare` callback is for.
 *
 * Then add the `extraReducers` builder that resets this slice on `signedOut`
 * (src/store/session.ts), and the `selectors` block.
 */
const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    searchChanged(_state, _action: PayloadAction<string>) {},
    categoryChanged(_state, _action: PayloadAction<string>) {},
    lowStockToggled(_state) {},
    sortChanged: {
      reducer(_state, _action: PayloadAction<{ sortBy: SortKey; order: SortOrder }>) {},
      prepare(sortBy: SortKey, order: SortOrder = 'asc') {
        return { payload: { sortBy, order } };
      },
    },
    pageChanged(_state, _action: PayloadAction<number>) {},
    /** Dev-only, and not a filter: changing it must not reset the page. */
    latencyChanged(state, action: PayloadAction<number>) {
      state.delayMs = action.payload;
    },
    filtersCleared() {
      return initialState;
    },
  },
  selectors: {
    selectFilters: (state) => state,
    selectPage: (state) => state.page,
    selectLowStockOnly: (state) => state.lowStockOnly,
  },
});

export const {
  searchChanged,
  categoryChanged,
  lowStockToggled,
  sortChanged,
  pageChanged,
  latencyChanged,
  filtersCleared,
} = filtersSlice.actions;

export const { selectFilters, selectPage, selectLowStockOnly } = filtersSlice.selectors;

export default filtersSlice.reducer;
