import type { InventoryStore } from './types';

/**
 * ATOMIC selectors. Each returns a primitive or an existing reference, so
 * Zustand's `Object.is` comparison is meaningful and a component re-renders
 * only when that one value really changed.
 */
export const selectStatus = (state: InventoryStore) => state.status;
export const selectError = (state: InventoryStore) => state.error;
export const selectTotal = (state: InventoryStore) => state.total;
export const selectPage = (state: InventoryStore) => state.page;
export const selectPageCount = (state: InventoryStore) => Math.ceil(state.total / state.limit);
export const selectSelectedCount = (state: InventoryStore) => state.selected.length;

/**
 * TODO(lab-3.2): the rest of the selector layer, and the discipline behind it.
 *
 *   · `selectProduct(id)`, `selectIsSelected(id)` and `selectRowState(id)` —
 *     selector FACTORIES, one row, one subscription. `selectRowState` must
 *     return a SHARED constant for the idle case: `?? { pending: false, error:
 *     null }` builds a new object every call, and every store change anywhere
 *     then looks like a change to that row.
 *   · `selectVisibleIds(state)` — the derived list, with `lowStockOnly`
 *     applied. `state.ids.filter(…)` returns a new array every call; Zustand
 *     compares by reference, and React 19 answers with "The result of
 *     getSnapshot should be cached". Memoise it on its INPUTS in about ten
 *     lines, and export a reset for the tests.
 *
 * Until then, the visible list is simply the page — no filter, no allocation.
 */
export function selectVisibleIds(state: InventoryStore): number[] {
  return state.ids;
}
