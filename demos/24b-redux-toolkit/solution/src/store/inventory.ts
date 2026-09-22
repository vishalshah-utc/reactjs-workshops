import { createEntityAdapter, createSelector, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { toErrorInfo, type ApiErrorInfo } from '../lib/errorInfo';
import type { Product } from '../types';
import { createAppAsyncThunk } from './createAppAsyncThunk';
import { LOW_STOCK, PAGE_SIZE, selectFilters, selectLowStockOnly, type FiltersState } from './filters';
import { signedOut } from './session';
import type { RootState } from './index';

// ------------------------------------------------------------------ adapter

/**
 * `createEntityAdapter` is F2 in one line: it owns `ids: number[]` and
 * `entities: Record<number, Product>` and gives you the six writes you would
 * otherwise hand-roll — `setAll`, `addOne`, `upsertMany`, `updateOne`,
 * `removeOne`, `removeAll` — each keeping the two halves in step.
 *
 * NO `sortComparer`, on purpose. A comparer makes the adapter the authority on
 * order, which would quietly throw away the server's `sortBy`/`order` — the
 * list would come back sorted by price and render alphabetically. Reach for
 * one when the CLIENT owns the order (`sortComparer: (a, b) => a.title.localeCompare(b.title)`);
 * leave it off when the server does.
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
  `${filters.q}|${filters.category}|${filters.sortBy}|${filters.order}|${filters.page}|${filters.delayMs}`;

// ------------------------------------------------------------------- thunks

interface LoadResult {
  products: Product[];
  total: number;
}

/**
 * F1/F3. Everything interesting about `createAsyncThunk` is in this one call.
 *
 * - it reads the filters from `getState()` rather than taking them as an
 *   argument, so no caller can dispatch a load for filters the store does not
 *   have;
 * - `extra` is the API layer (src/store/extra.ts) — the thunk imports no axios;
 * - `signal` is the thunk's own AbortSignal, forwarded to the existing service;
 * - `rejectWithValue` carries a SERIALISABLE error, never the class instance;
 * - `condition` refuses to start a second identical request.
 */
export const loadInventory = createAppAsyncThunk<LoadResult, FiltersState>(
  'inventory/load',
  async (filters, { extra, signal, rejectWithValue }) => {
    try {
      const response = await extra.listProducts({
        q: filters.q,
        category: filters.category,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page,
        limit: PAGE_SIZE,
        signal,
        delayMs: filters.delayMs,   // dev-only; ignored in a build
      });
      return { products: response.products, total: response.total };
    } catch (error) {
      // `throw` would give you `action.error`, a stringified copy with no
      // status and no code. `rejectWithValue` gives you `action.payload`,
      // typed, and the reducer can then decide what a 404 means.
      return rejectWithValue(toErrorInfo(error));
    }
  },
  {
    /**
     * Runs BEFORE `pending`. Return false and nothing is dispatched at all —
     * no pending, no fulfilled, no spinner — and the returned promise resolves
     * with a rejected action carrying `meta.condition: true`.
     */
    condition: (filters, { getState }) => {
      // `getState` is typed as RootState because createAppAsyncThunk said so —
      // `state.inventory` autocompletes, and a typo is a compile error.
      return getState().inventory.pendingKey !== filtersKey(filters);
    },
  },
);

/** F4. One row, one PATCH. The optimistic write and the rollback live in the reducers. */
export const saveStock = createAppAsyncThunk<Product, { id: number; stock: number }>(
  'inventory/saveStock',
  async ({ id, stock }, { getState, extra, signal, rejectWithValue }) => {
    try {
      return await extra.updateProduct(id, { stock }, { signal, delayMs: selectFilters(getState()).delayMs });
    } catch (error) {
      return rejectWithValue(toErrorInfo(error));
    }
  },
);

// -------------------------------------------------------------------- slice

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
     * F5. The reducer takes the SNAPSHOT and nothing else — the twelve PATCHes
     * are a side effect, and side effects belong in the listener middleware
     * (src/store/listeners.ts), never in a reducer.
     */
    bulkRestockRequested: {
      reducer(state, action: PayloadAction<{ amount: number; ids: number[] }>) {
        const { ids } = action.payload;
        state.snapshot = Object.fromEntries(ids.map((id) => [id, state.entities[id]?.stock ?? 0]));
        state.bulk = { status: 'running', done: 0, total: ids.length, failed: [] };
      },
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
    /** Dispatched by the UI; the listener replays the reverse PATCHes. */
    bulkUndoRequested(state) {
      state.bulk = IDLE_BULK;
    },
    bulkSnapshotDropped(state) {
      state.snapshot = null;
      state.bulk = IDLE_BULK;
    },
  },

  extraReducers: (builder) => {
    builder
      // --- F1: the load ---------------------------------------------------
      .addCase(loadInventory.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        // `meta` is free: requestId, arg and the abort flag are on every one of
        // the three lifecycle actions, which is what makes latest-wins possible.
        state.currentRequestId = action.meta.requestId;
        // `meta.arg` is exactly what the thunk was dispatched with — the filters.
        state.pendingKey = filtersKey(action.meta.arg);
      })
      .addCase(loadInventory.fulfilled, (state, action) => {
        // F3, LATEST WINS. A slow page-1 answer arriving after a fast page-2
        // answer has a requestId nobody is waiting for any more. Drop it.
        if (state.currentRequestId !== action.meta.requestId) return;
        productsAdapter.setAll(state, action.payload.products);
        state.total = action.payload.total;
        state.page = action.meta.arg.page;
        state.status = 'ready';
        state.error = null;
        state.rows = {};
      })
      .addCase(loadInventory.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        // An abort is not a failure: the user changed the filters, that is all.
        if (action.meta.aborted) return;
        state.status = 'error';
        state.error = action.payload ?? { message: 'Could not load the catalogue.', status: 0, code: 'UNKNOWN', isRetryable: true };
      })

      // --- F4: the optimistic inline edit ---------------------------------
      .addCase(saveStock.pending, (state, action) => {
        const { id, stock } = action.meta.arg;
        const current = state.entities[id];
        if (!current) return;
        state.rows[id] = { status: 'saving', previousStock: current.stock };
        // The UI changes NOW. The request has not even left the tab.
        productsAdapter.updateOne(state, { id, changes: { stock } });
      })
      .addCase(saveStock.fulfilled, (state, action) => {
        const { id } = action.meta.arg;
        delete state.rows[id];
        // The server had the last word, and here it says a lot: DummyJSON's
        // PATCH returns the WHOLE MERGED product, not just the field you sent.
        // So merge the response over the entity rather than picking `stock` out
        // of it — if the server clamped the value, renamed the row or bumped a
        // rating, this is where you find out.
        productsAdapter.upsertOne(state, { ...state.entities[id], ...action.payload });
      })
      .addCase(saveStock.rejected, (state, action) => {
        const { id } = action.meta.arg;
        const previous = state.rows[id]?.previousStock;
        if (previous !== undefined) productsAdapter.updateOne(state, { id, changes: { stock: previous } });
        state.rows[id] = { status: 'error', error: action.payload?.message ?? 'Could not save that change.' };
      })

      // --- F7: one action, several slices ---------------------------------
      .addCase(signedOut, () => initialState)

      /**
       * A MATCHER runs for every action it matches, after the cases above.
       * `isAnyOf` builds the type guard, so `action` is still narrowed inside.
       * One rule — "the in-flight key is only meaningful while a request is in
       * flight" — written once instead of in three places.
       */
      .addMatcher(isAnyOf(loadInventory.fulfilled, loadInventory.rejected), (state, action) => {
        if (state.currentRequestId === action.meta.requestId) state.pendingKey = null;
      });
  },
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

/**
 * The adapter's own selectors, bound to where this slice is mounted. Pass the
 * root-state accessor once and `selectAll`, `selectById`, `selectIds`,
 * `selectEntities` and `selectTotal` all take a `RootState`.
 */
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
 * F2/F3. The visible rows, as IDS.
 *
 * Two things are happening here and both matter.
 *
 * 1. **Memoisation.** `createSelector` remembers its inputs. `.filter().map()`
 *    builds a NEW array every call, so a raw
 *    `useSelector((s) => s.inventory.ids.filter(…))` returns a new reference on
 *    every store notification, `useSelector`'s reference check fails every
 *    time, and the component re-renders for ever. With `createSelector` the
 *    array is rebuilt only when `selectAll` or `lowStockOnly` actually change.
 * 2. **Ids, not objects.** The table maps over ids and each row selects its own
 *    entity. Editing one row's stock then re-renders ONE row, because the other
 *    rows' `selectProductById` results are unchanged.
 */
export const selectVisibleIds = createSelector(
  [adapterSelectors.selectAll, selectLowStockOnly],
  (products, lowStockOnly) =>
    (lowStockOnly ? products.filter((product) => product.stock < LOW_STOCK) : products).map((product) => product.id),
);

export const selectVisibleCount = createSelector([selectVisibleIds], (ids) => ids.length);

export const selectPageCount = createSelector([selectInventoryTotal], (total) => Math.ceil(total / PAGE_SIZE));

/** Units on this page — a derived number, computed, never stored. */
export const selectUnitsOnPage = createSelector([adapterSelectors.selectAll], (products) =>
  products.reduce((sum, product) => sum + product.stock, 0),
);

const IDLE_ROW: RowState | undefined = undefined;

/**
 * A selector FACTORY, for per-row state.
 *
 * The classic problem: one shared `createSelector` has a cache of size 1, so
 * twelve rows calling it with twelve different ids evict each other and nothing
 * is memoised. A factory gives each row its own instance — call it inside a
 * `useMemo` so the row keeps the same one across renders.
 *
 * Reselect 5 (which RTK 2 ships) defaults to `weakMapMemoize`, whose cache is
 * keyed by the arguments, so a shared selector would in fact work here. The
 * factory is still the pattern to recognise: you will meet it in every codebase
 * written before 2024, and it is still what you want when the extra argument is
 * an object rather than a number.
 */
export const makeSelectRowState = () =>
  createSelector(
    [(state: RootState) => state.inventory.rows, (_state: RootState, id: number) => id],
    (rows, id) => rows[id] ?? IDLE_ROW,
  );

export const makeSelectIsSelected = () =>
  createSelector(
    [selectSelectedIds, (_state: RootState, id: number) => id],
    (selectedIds, id) => selectedIds.includes(id),
  );
