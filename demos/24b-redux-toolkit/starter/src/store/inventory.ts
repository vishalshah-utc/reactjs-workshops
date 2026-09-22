import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ApiErrorInfo } from '../lib/errorInfo';
import type { Product } from '../types';
import { createAppAsyncThunk } from './createAppAsyncThunk';
import { type FiltersState } from './filters';
import type { RootState } from './index';

/**
 * TODO(lab-3.1): `createEntityAdapter` — F2 in one line.
 *
 * It owns `ids: number[]` and `entities: Record<number, Product>` and gives you
 * `setAll`, `upsertOne`, `updateOne`, `removeOne` and the rest, each keeping
 * the two halves in step. Give it a `selectId`, and think hard before you give
 * it a `sortComparer` — the lab explains why this adapter does not have one.
 */
const productsAdapter = createEntityAdapter<Product, number>({
  selectId: (product) => product.id,
});

/** Per-row state for F4. One entry per row being saved — never one global flag. */
export interface RowState {
  status: 'saving' | 'error';
  /** What the stock was before the optimistic write, so `rejected` can put it back. */
  previousStock?: number;
  error?: string;
}

export interface BulkState {
  status: 'idle' | 'running' | 'done';
  done: number;
  total: number;
  failed: { id: number; reason: string }[];
}

const IDLE_BULK: BulkState = { status: 'idle', done: 0, total: 0, failed: [] };

export interface InventoryExtraState {
  /** F1's status machine. Four values, and no two of them can be true at once. */
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiErrorInfo | null;
  total: number;
  page: number;
  /** F3: the id of the request whose answer we will accept. Anything else is stale. */
  currentRequestId: string | null;
  /** F3: what the in-flight request is FOR, so `condition` can dedupe it. */
  pendingKey: string | null;
  rows: Record<number, RowState>;
  selectedIds: number[];
  /** F5: stock by id, as it was before the bulk operation. `null` = nothing to undo. */
  snapshot: Record<number, number> | null;
  bulk: BulkState;
}

const initialState = productsAdapter.getInitialState<InventoryExtraState>({
  status: 'idle',
  error: null,
  total: 0,
  page: 0,
  currentRequestId: null,
  pendingKey: null,
  rows: {},
  selectedIds: [],
  snapshot: null,
  bulk: IDLE_BULK,
});

/** The identity of a request: same filters, same key, same answer. */
export const filtersKey = (filters: FiltersState) =>
  `${filters.q}|${filters.category}|${filters.sortBy}|${filters.order}|${filters.page}`;

interface LoadResult {
  products: Product[];
  total: number;
}

/**
 * TODO(lab-2.2): `loadInventory` — F1 and F3.
 *
 * In the payload creator:
 *  - call `extra.listProducts({ …filters, limit: PAGE_SIZE, signal })` — the
 *    `signal` is the thunk's own, and the service has taken one since Demo 5;
 *  - return `{ products, total }` on success;
 *  - `return rejectWithValue(toErrorInfo(error))` on failure. Not `throw`:
 *    `throw` gives you `action.error`, a stringified copy with no status and no
 *    code, and the class instance would trip the serializability check anyway.
 *
 * In the options object, add `condition` so a second request for filters that
 * are already in flight never starts.
 */
export const loadInventory = createAppAsyncThunk<LoadResult, FiltersState>(
  'inventory/load',
  async (_filters, { extra: _extra, signal: _signal, rejectWithValue: _rejectWithValue }) => {
    return { products: [], total: 0 };
  },
);

/**
 * TODO(lab-4.1): `saveStock` — F4. One row, one PATCH through
 * `extra.updateProduct(id, { stock }, { signal })`, with the same
 * `rejectWithValue(toErrorInfo(error))` treatment. The optimistic write and the
 * rollback do NOT live here — they live in the reducers below.
 */
export const saveStock = createAppAsyncThunk<Product, { id: number; stock: number }>(
  'inventory/saveStock',
  async (_arg, { extra: _extra, rejectWithValue: _rejectWithValue }) => {
    throw new Error('TODO: lab-4.1');
  },
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    rowSelectionToggled(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id];
    },
    allSelectionToggled(state, action: PayloadAction<number[]>) {
      const visible = action.payload;
      const allSelected = visible.length > 0 && visible.every((id) => state.selectedIds.includes(id));
      state.selectedIds = allSelected ? [] : visible;
    },
    selectionCleared(state) {
      state.selectedIds = [];
    },
    rowErrorDismissed(state, action: PayloadAction<number>) {
      delete state.rows[action.payload];
    },

    /**
     * TODO(lab-5.2): F5's snapshot. Record the CURRENT stock of every selected
     * id, and set `bulk` to running. The twelve PATCHes are a side effect and
     * belong in the listener middleware, never in a reducer.
     */
    bulkRestockRequested: {
      reducer(_state, _action: PayloadAction<{ amount: number; ids: number[] }>) {},
      prepare(amount: number, ids: number[]) {
        return { payload: { amount, ids } };
      },
    },
    bulkProgressed(state) {
      state.bulk.done += 1;
    },
    bulkRestockFinished(state, action: PayloadAction<{ failed: { id: number; reason: string }[] }>) {
      state.bulk.status = 'done';
      state.bulk.failed = action.payload.failed;
    },
    bulkUndoRequested(state) {
      state.bulk = IDLE_BULK;
    },
    bulkSnapshotDropped(state) {
      state.snapshot = null;
      state.bulk = IDLE_BULK;
    },
  },

  /**
   * TODO(lab-2.3): the load's lifecycle.
   *
   * `pending`   → status 'loading', clear the error, remember
   *               `action.meta.requestId` and `filtersKey(action.meta.arg)`.
   * `fulfilled` → **discard the answer if `action.meta.requestId` is not the
   *               one you are waiting for** (F3, latest-wins), otherwise
   *               `productsAdapter.setAll(state, action.payload.products)`.
   * `rejected`  → an abort (`action.meta.aborted`) is not a failure; anything
   *               else sets status 'error' and stores `action.payload`.
   *
   * TODO(lab-4.2): the three `saveStock` cases — the optimistic
   * `updateOne` in `pending` (remembering `previousStock`), the confirmation in
   * `fulfilled`, and the rollback in `rejected`.
   *
   * TODO(lab-5.4): `signedOut` — one action this slice does not own, handled
   * anyway, resetting it to `initialState`.
   *
   * Then add a `.addMatcher(isAnyOf(loadInventory.fulfilled,
   * loadInventory.rejected), …)` that clears `pendingKey`.
   */
  extraReducers: (_builder) => {},
});

export const {
  rowSelectionToggled,
  allSelectionToggled,
  selectionCleared,
  rowErrorDismissed,
  bulkRestockRequested,
  bulkProgressed,
  bulkRestockFinished,
  bulkUndoRequested,
  bulkSnapshotDropped,
} = inventorySlice.actions;

export default inventorySlice.reducer;

// ---------------------------------------------------------------- selectors

const adapterSelectors = productsAdapter.getSelectors((state: RootState) => state.inventory);

export const selectProductIds = adapterSelectors.selectIds;
export const selectProductEntities = adapterSelectors.selectEntities;
export const selectProductById = adapterSelectors.selectById;

export const selectInventoryStatus = (state: RootState) => state.inventory.status;
export const selectInventoryError = (state: RootState) => state.inventory.error;
export const selectInventoryTotal = (state: RootState) => state.inventory.total;
export const selectSelectedIds = (state: RootState) => state.inventory.selectedIds;
export const selectBulk = (state: RootState) => state.inventory.bulk;
export const selectHasSnapshot = (state: RootState) => state.inventory.snapshot !== null;
export const selectSnapshot = (state: RootState) => state.inventory.snapshot;

/**
 * TODO(lab-3.2): the memoised selectors.
 *
 *  - `selectVisibleIds` — `createSelector` over `adapterSelectors.selectAll`
 *    and `selectLowStockOnly`, returning IDS. A raw
 *    `useSelector((s) => s.inventory.ids.filter(…))` builds a new array every
 *    call, fails `useSelector`'s reference check every time and re-renders for
 *    ever; this is the fix.
 *  - `selectVisibleCount`, `selectPageCount`, `selectUnitsOnPage` — derived
 *    numbers, computed, never stored.
 *  - `makeSelectRowState` / `makeSelectIsSelected` — selector FACTORIES for
 *    per-row state, one instance per mounted row.
 */
export const selectVisibleIds = (_state: RootState): number[] => [];
export const selectVisibleCount = (_state: RootState) => 0;
export const selectPageCount = (_state: RootState) => 0;
export const selectUnitsOnPage = (_state: RootState) => 0;
export const makeSelectRowState = () => (_state: RootState, _id: number): RowState | undefined => undefined;
export const makeSelectIsSelected = () => (_state: RootState, _id: number): boolean => false;
