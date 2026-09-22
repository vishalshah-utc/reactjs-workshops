import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { env } from '../config/env';
import { signedOut } from './session';

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
 * The first slice. `createSlice` takes a name, an initial state and a bag of
 * case reducers, and gives back a reducer AND one action creator per case —
 * so `filters/searchChanged` exists because the function below is called
 * `searchChanged`, and no action-type constant is ever written by hand.
 *
 * Every reducer here "mutates". None of them mutates: `createSlice` runs each
 * case inside Immer's `produce`, so `state.q = q` records a change against a
 * draft and Immer returns a new object with the untouched branches shared.
 * Write it the mutating way — it is shorter and it is what RTK expects.
 */
const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    /**
     * F3: any filter change resets to page 1. Putting that rule in the reducer
     * rather than in the component means no caller can forget it.
     */
    searchChanged(state, action: PayloadAction<string>) {
      state.q = action.payload;
      state.page = 0;
    },
    categoryChanged(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 0;
    },
    lowStockToggled(state) {
      state.lowStockOnly = !state.lowStockOnly;
      state.page = 0;
    },
    /**
     * A `prepare` callback: the caller passes two arguments, the action gets
     * one payload. This is where you normalise, add an id or stamp a time —
     * the reducer stays pure because the un-pure part happens out here.
     */
    sortChanged: {
      reducer(state, action: PayloadAction<{ sortBy: SortKey; order: SortOrder }>) {
        state.sortBy = action.payload.sortBy;
        state.order = action.payload.order;
        state.page = 0;
      },
      prepare(sortBy: SortKey, order: SortOrder = 'asc') {
        return { payload: { sortBy, order } };
      },
    },
    pageChanged(state, action: PayloadAction<number>) {
      state.page = Math.max(0, action.payload);
    },
    /** Dev-only, and not a filter: changing it must not reset the page. */
    latencyChanged(state, action: PayloadAction<number>) {
      state.delayMs = action.payload;
    },
    filtersCleared() {
      // Returning a value REPLACES the state. Returning nothing means "I edited
      // the draft". Do one or the other — never both in the same case.
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // F7: an action this slice does not own, handled anyway.
    builder.addCase(signedOut, () => initialState);
  },
  /**
   * Selectors declared on the slice are written against the SLICE's state and
   * `slice.selectors` exposes them against the root state — so the slice never
   * has to know it is mounted at `state.filters`.
   */
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
