import { updateProduct } from '../../api/services/products';
import { ApiError } from '../../lib/ApiError';
import { mapWithConcurrency } from '../../lib/concurrency';
import type { BulkFailure, BulkSlice, SliceOf } from './types';

/** Four at a time. Enough to be quick, few enough that DummyJSON never says 429. */
const CONCURRENCY = 4;

export const initialBulk = {
  selected: [],
  bulkStatus: 'idle',
  bulkReport: null,
  undoSnapshot: null,
} satisfies Omit<BulkSlice, 'toggleSelected' | 'selectMany' | 'clearSelection' | 'bulkRestock' | 'undoBulk' | 'dismissReport'>;

export const createBulkSlice: SliceOf<BulkSlice> = (set, get) => ({
  ...initialBulk,

  toggleSelected: (id) =>
    set(
      (state) => {
        const at = state.selected.indexOf(id);
        if (at === -1) state.selected.push(id);
        else state.selected.splice(at, 1);
      },
      false,
      `inventory/toggleSelected:${id}`,
    ),

  selectMany: (ids) =>
    set(
      (state) => {
        state.selected = ids;
      },
      false,
      'inventory/selectMany',
    ),

  clearSelection: () =>
    set(
      (state) => {
        state.selected = [];
      },
      false,
      'inventory/clearSelection',
    ),

  /**
   * Add `amount` to every selected row's stock.
   *
   * The snapshot is taken ONCE, before anything is sent, and it is the whole of
   * undo: id → the number that was there. Undo does not replay requests; it
   * writes those numbers back. (Which is honest about what it is: a client-side
   * undo of a client-side change. On a real backend you would send the reverse
   * patch — and you would still need this snapshot to know what to send.)
   */
  bulkRestock: async (amount) => {
    const { selected, entities } = get();
    if (selected.length === 0 || get().bulkStatus === 'running') return;

    const snapshot: Record<number, number> = {};
    for (const id of selected) {
      const stock = entities[id]?.stock;
      if (stock !== undefined) snapshot[id] = stock;
    }
    const ids = Object.keys(snapshot).map(Number);

    set(
      (state) => {
        state.bulkStatus = 'running';
        state.bulkReport = null;
        state.undoSnapshot = snapshot;
        // Optimistic, all of them, in one notification.
        for (const id of ids) {
          const product = state.entities[id];
          if (product) product.stock = snapshot[id] + amount;
          state.rows[id] = { pending: true, error: null };
        }
      },
      false,
      `inventory/bulkPending:${ids.length}`,
    );

    const outcomes = await mapWithConcurrency(ids, CONCURRENCY, (id) =>
      updateProduct(id, { stock: snapshot[id] + amount }),
    );

    const succeeded: number[] = [];
    const failed: BulkFailure[] = [];
    outcomes.forEach((outcome, index) => {
      const id = ids[index];
      if (outcome.status === 'fulfilled') succeeded.push(id);
      else failed.push({ id, message: ApiError.from(outcome.reason).message });
    });

    set(
      (state) => {
        state.bulkStatus = 'idle';
        state.bulkReport = { attempted: ids.length, succeeded, failed };
        // PARTIAL FAILURE, told honestly: the ones that worked keep the new
        // number, the ones that did not go back to theirs, each with its reason.
        for (const id of succeeded) delete state.rows[id];
        for (const failure of failed) {
          const product = state.entities[failure.id];
          if (product) product.stock = snapshot[failure.id];
          state.rows[failure.id] = { pending: false, error: failure.message };
        }
      },
      false,
      `inventory/bulkSettled:${succeeded.length}/${ids.length}`,
    );
  },

  /** Time travel, the cheap kind: put the numbers back and forget the snapshot. */
  undoBulk: () =>
    set(
      (state) => {
        if (!state.undoSnapshot) return;
        for (const [key, stock] of Object.entries(state.undoSnapshot)) {
          const product = state.entities[Number(key)];
          if (product) product.stock = stock;
          delete state.rows[Number(key)];
        }
        state.undoSnapshot = null;
        state.bulkReport = null;
      },
      false,
      'inventory/undoBulk',
    ),

  dismissReport: () =>
    set(
      (state) => {
        state.bulkReport = null;
        state.undoSnapshot = null;
      },
      false,
      'inventory/dismissReport',
    ),
});
