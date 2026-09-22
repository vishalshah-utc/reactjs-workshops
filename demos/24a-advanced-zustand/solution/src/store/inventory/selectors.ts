import { LOW_STOCK, type InventoryStore, type RowState } from './types';
import type { Product } from '../../types';

/**
 * ATOMIC selectors. Each one returns a primitive or an existing reference, so
 * Zustand's `Object.is` comparison is meaningful and the component re-renders
 * only when that value really changed.
 */
export const selectStatus = (state: InventoryStore) => state.status;
export const selectError = (state: InventoryStore) => state.error;
export const selectTotal = (state: InventoryStore) => state.total;
export const selectPage = (state: InventoryStore) => state.page;
export const selectPageCount = (state: InventoryStore) => Math.ceil(state.total / state.limit);
export const selectSelectedCount = (state: InventoryStore) => state.selected.length;

/** A selector FACTORY: one row, one boolean, one subscription. */
export const selectProduct = (id: number) => (state: InventoryStore): Product | undefined => state.entities[id];
export const selectIsSelected = (id: number) => (state: InventoryStore) => state.selected.includes(id);

const IDLE_ROW: RowState = { pending: false, error: null };
/**
 * Note the shared IDLE_ROW constant. `?? { pending: false, error: null }` would
 * build a NEW object every call, Zustand would see a new reference every time,
 * and the row would re-render on every store change in the app. One frozen
 * constant, one stable reference, no renders.
 */
export const selectRowState = (id: number) => (state: InventoryStore): RowState => state.rows[id] ?? IDLE_ROW;

/**
 * THE derived list — and the one selector that cannot be atomic, because its
 * answer is a new array.
 *
 * `useInventoryStore((s) => s.ids.filter(…))` builds a new array on every call.
 * Zustand compares by reference, so every store change looks like a change to
 * this component, and React 19 says "The result of getSnapshot should be
 * cached" and then re-renders in a loop.
 *
 * The fix does not need a library. Remember the inputs and the answer; when the
 * inputs are identical by reference, hand the same array back. That is all
 * `reselect` does — this is eleven lines of it, and writing it once is the
 * fastest way to understand why memoisation is about REFERENCES, not values.
 */
let lastInputs: [number[], Record<number, Product>, boolean] | null = null;
let lastResult: number[] = [];

export function selectVisibleIds(state: InventoryStore): number[] {
  const inputs: [number[], Record<number, Product>, boolean] = [state.ids, state.entities, state.filters.lowStockOnly];

  if (lastInputs && inputs.every((input, index) => input === lastInputs![index])) return lastResult;

  lastInputs = inputs;
  lastResult = state.filters.lowStockOnly
    ? state.ids.filter((id) => (state.entities[id]?.stock ?? 0) < LOW_STOCK)
    : state.ids;
  return lastResult;
}

/** Tests and hot reloads need a clean slate; a module-level cache has to be resettable. */
export function resetVisibleIdsCache(): void {
  lastInputs = null;
  lastResult = [];
}
