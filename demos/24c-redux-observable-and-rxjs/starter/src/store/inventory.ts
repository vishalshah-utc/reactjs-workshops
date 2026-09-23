import {
  createAction,
  createEntityAdapter,
  createSelector,
  createSlice,
  isAnyOf,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { ApiErrorInfo } from '../lib/errorInfo';
import type { StockTick } from '../lib/feedProtocol';
import type { Product } from '../types';
import { LOW_STOCK, PAGE_SIZE, selectLowStockOnly } from './filters';
import { signedOut } from './session';
import type { RootState } from './index';

// ------------------------------------------------------------------ adapter

/**
 * Unchanged from Demo 24b, and that is the point of today: the REDUCERS stay
 * exactly as they were. Only the layer that decides *when* to fetch is being
 * rewritten. If swapping a side-effect library forces you to rewrite your
 * reducers, the two were too tangled to compare.
 *
 * Still no `sortComparer`: the server owns the order.
 */
const productsAdapter = createEntityAdapter<Product, number>({
  selectId: (product) => product.id,
});

export interface RowState {
  status: 'saving' | 'error';
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

/** F1's status machine — four values, and no two of them can be true at once. */
export type InventoryStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface InventoryExtraState {
  status: InventoryStatus;
  error: ApiErrorInfo | null;
  total: number;
  page: number;
  rows: Record<number, RowState>;
  selectedIds: number[];
  snapshot: Record<number, number> | null;
  bulk: BulkState;
  /**
   * Which rows the live feed has just changed, and in which direction, so the
   * table can flash them. Cleared by an epic a moment later — see
   * `flashClearEpic`.
   */
  flashes: Record<number, 'up' | 'down'>;
}

const initialState = productsAdapter.getInitialState<InventoryExtraState>({
  status: 'idle',
  error: null,
  total: 0,
  page: 0,
  rows: {},
  selectedIds: [],
  snapshot: null,
  bulk: IDLE_BULK,
  flashes: {},
});

/**
 * WHAT IS NOT HERE ANY MORE, and why.
 *
 *   currentRequestId: string | null;   ← deleted
 *   pendingKey:       string | null;   ← deleted
 *   export const filtersKey = (f) => `${f.q}|${f.category}|…`;   ← deleted
 *
 * Those three were Demo 24b's hand-rolled latest-wins: a monotonic id stamped
 * on `pending`, compared again on `fulfilled` and on `rejected`, plus a
 * `condition` that refused a duplicate, plus an `addMatcher` to clear the key
 * afterwards. Eleven lines of state and bookkeeping to express "only the
 * newest request may write".
 *
 * `switchMap` is that sentence. It unsubscribes from the previous inner
 * Observable the instant a new one starts, so the previous request is
 * cancelled at the socket AND its result can never reach a reducer. There is
 * nothing left to discard, so there is nothing left to track.
 */

// ------------------------------------------------------------------ actions

/**
 * The thunks are gone. In their place: plain actions, one per event.
 *
 * `createAsyncThunk` bundled three actions and a function that ran the request.
 * Splitting them apart is what makes an epic possible — the action says WHAT
 * HAPPENED, the epic decides what to do about it, and the reducer decides what
 * it means. Three jobs, three places, and each one testable on its own.
 *
 * Note the tense. `inventoryRequested` is a request, not a command: the store
 * records that somebody asked. Whether a request goes out, how many, and
 * whether an earlier one is cancelled is entirely the epic's business.
 */

/** The console mounted. Starts the load epic and opens the feed. */
export const consoleOpened = createAction('inventory/consoleOpened');
/** The console unmounted. `takeUntil` hangs off this. */
export const consoleClosed = createAction('inventory/consoleClosed');
/** The Retry button, and the resynchronise after a feed reconnect. */
export const inventoryRetried = createAction('inventory/retried');

export const inventoryLoading = createAction('inventory/loading');
export const inventoryLoaded = createAction<{ products: Product[]; total: number; page: number }>(
  'inventory/loaded',
);
export const inventoryFailed = createAction<ApiErrorInfo>('inventory/failed');

/** F4. One row's optimistic edit: the request, and its two possible endings. */
export const stockSaveRequested = createAction<{ id: number; stock: number }>('inventory/stockSaveRequested');
export const stockSaveSucceeded = createAction<{ id: number; product: Product }>('inventory/stockSaveSucceeded');
export const stockSaveFailed = createAction<{ id: number; error: ApiErrorInfo }>('inventory/stockSaveFailed');

/**
 * The live feed's inbound messages, as actions.
 *
 * `at` is the SERVER's timestamp, carried in the payload rather than read from
 * `Date.now()` inside a reducer. A reducer that reads the clock is not a pure
 * function: replay it during time-travel and you get a different answer. Any
 * value that comes from outside belongs in the action.
 */
export const feedTicked = createAction<{ at: number; changes: StockTick[] }>('feed/ticked');
export const feedFlashCleared = createAction<number[]>('feed/flashCleared');

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

    /** F5. The reducer takes the snapshot; the epic runs the requests. */
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
      /**
       * TODO(lab-2.1): the load's three cases — and notice what is NOT here.
       *
       *   .addCase(inventoryLoading, (state) => { status = 'loading'; error = null; })
       *   .addCase(inventoryLoaded,  (state, action) => { setAll, total, page,
       *                                                   status = 'ready', rows = {}, flashes = {} })
       *   .addCase(inventoryFailed,  (state, action) => { status = 'error'; error = payload; })
       *
       * Compare each one with Demo 24b's. No `requestId` to stamp on pending,
       * no `requestId` to compare on fulfilled and rejected, no `pendingKey`,
       * no `meta.aborted` branch, and no `addMatcher` to clear the key
       * afterwards — because `switchMap` cancels the loser, so a cancelled
       * request never emits anything for a reducer to discard.
       *
       * The three fields those lines needed are already gone from
       * `InventoryExtraState` above. Look at it before you start.
       */

      /**
       * TODO(lab-3.2): the three save cases — unchanged in spirit from Demo
       * 24b, which is the point.
       *
       *   .addCase(stockSaveRequested, …)  the optimistic write. Record
       *       `previousStock` (the last moment the old value is knowable) and
       *       `updateOne` to the new one. Skip a row that is not loaded.
       *   .addCase(stockSaveSucceeded, …)  delete the row state and
       *       `upsertOne({ ...entity, ...product })` — PATCH returns the WHOLE
       *       MERGED product, verified against the live API.
       *   .addCase(stockSaveFailed, …)     put `previousStock` back and keep
       *       the server's own message on the row.
       *
       * Where Demo 24b had `saveStock.pending` / `.fulfilled` / `.rejected`,
       * you now have three plain actions with the same three jobs. Swapping
       * the effect layer did not change what the state MEANS.
       */

      /**
       * TODO(lab-5.4): the live feed's two cases.
       *
       *   .addCase(feedTicked, (state, action) => {
       *     for (const tick of action.payload.changes) { … }
       *   })
       *   .addCase(feedFlashCleared, (state, action) => { delete each flash })
       *
       * For each tick: skip a product that is not on this page, SKIP A ROW
       * THAT IS MID-SAVE (`state.rows[id]` — the user's intention outranks the
       * server's opinion about a number they are already changing), record
       * `flashes[id]` as 'up' or 'down', and `updateOne` the stock and, when
       * it is present, the price.
       *
       * F2 pays off here in a way Demo 24b never got to show. A tick touches
       * two rows out of twelve, so `updateOne` makes two new entity objects
       * and leaves the other ten as the same objects they were — exactly two
       * rows re-render. A nested array would have re-rendered all twelve,
       * four times a second, for ever.
       */

      // --- F7: one action, several slices ---------------------------------
      .addCase(signedOut, () => initialState)

      /**
       * A matcher, kept from Demo 24b for a different reason. Any terminal
       * outcome of a row save clears that row's flash, so the feed's highlight
       * never sticks to a row the user has just edited.
       */
      .addMatcher(isAnyOf(stockSaveSucceeded, stockSaveFailed), (state, action) => {
        delete state.flashes[action.payload.id];
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
 * F2/F3. The visible rows, as IDS — memoised, so the same state gives the same
 * array reference and `useSelector` does not loop.
 *
 * It has a second job today: the feed epic watches THIS selector to decide
 * which product ids to subscribe to. A memoised selector that only changes when
 * the visible set really changes is what keeps the outbound `subscribe` message
 * from being sent twice a second.
 */
export const selectVisibleIds = createSelector(
  [adapterSelectors.selectAll, selectLowStockOnly],
  (products, lowStockOnly) =>
    (lowStockOnly ? products.filter((product) => product.stock < LOW_STOCK) : products).map((product) => product.id),
);

export const selectVisibleCount = createSelector([selectVisibleIds], (ids) => ids.length);

export const selectPageCount = createSelector([selectInventoryTotal], (total) => Math.ceil(total / PAGE_SIZE));

export const selectUnitsOnPage = createSelector([adapterSelectors.selectAll], (products) =>
  products.reduce((sum, product) => sum + product.stock, 0),
);

const IDLE_ROW: RowState | undefined = undefined;

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

export const makeSelectFlash = () =>
  createSelector(
    [(state: RootState) => state.inventory.flashes, (_state: RootState, id: number) => id],
    (flashes, id) => flashes[id],
  );
