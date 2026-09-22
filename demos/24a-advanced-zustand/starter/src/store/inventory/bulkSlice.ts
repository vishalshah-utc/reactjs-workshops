import type { BulkSlice, SliceOf } from './types';

export const initialBulk = {
  selected: [],
  bulkStatus: 'idle',
  bulkReport: null,
  undoSnapshot: null,
} satisfies Omit<BulkSlice, 'toggleSelected' | 'selectMany' | 'clearSelection' | 'bulkRestock' | 'undoBulk' | 'dismissReport'>;

/**
 * Selection, the bulk write, and undo.
 *
 * TODO(lab-5.2): the selection actions first — `toggleSelected`, `selectMany`,
 * `clearSelection` — then `bulkRestock(amount)`:
 *   · take ONE snapshot of `id → stock` before anything is sent; it is the
 *     whole of undo;
 *   · apply every optimistic change in ONE `set`, so subscribers render once;
 *   · run the requests through `mapWithConcurrency` (Lab 5 A) at four at a time;
 *   · split the settled results into `succeeded` and `failed`, keep the
 *     winners, roll the losers back, and report BOTH numbers honestly;
 *   · `undoBulk` writes the snapshot back — it does not replay requests.
 */
export const createBulkSlice: SliceOf<BulkSlice> = () => ({
  ...initialBulk,

  toggleSelected: () => {},
  selectMany: () => {},
  clearSelection: () => {},
  bulkRestock: async () => {},
  undoBulk: () => {},
  dismissReport: () => {},
});
