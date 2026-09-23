import type { FiltersSlice, InventoryFilters, SliceOf } from './types';

export const initialFilters: InventoryFilters = {
  q: '',
  category: '',
  lowStockOnly: false,
  sortBy: 'title',
  order: 'asc',
};

export const initialFiltersState = {
  filters: initialFilters,
  debugDelayMs: 0,
} satisfies Omit<FiltersSlice, 'setFilter' | 'clearFilters' | 'setDebugDelay'>;

/**
 * The simplest slice in the store: what the user asked for, and nothing about
 * what the server said.
 *
 * TODO(lab-1.1): write the three actions, with the PLAIN `set` — no middleware
 * exists yet, so a recipe returns a new (partial) state and there is no third
 * argument. `setFilter` is generic over the key, so `setFilter('sortBy',
 * 'stock')` type-checks and `setFilter('sortBy', 'stok')` does not.
 *
 * TODO(lab-2.2): `devtools` is on now, so `set` takes a third argument: the
 * name the timeline will show. Name all three — `inventory/setFilter:${key}`,
 * `inventory/clearFilters`, `inventory/setDebugDelay` — and keep the second
 * argument, `replace`, `false`.
 *
 * TODO(lab-2.5): once `fetchPage` exists, `setFilter` and `clearFilters` must
 * also refetch — always from page 0, because page 3 of "phone" is not page 3 of
 * "phones". They reach it with `get().fetchPage(0)`: one `get`, all five slices.
 */
export const createFiltersSlice: SliceOf<FiltersSlice> = () => ({
  ...initialFiltersState,

  setFilter: () => {},

  clearFilters: () => {},

  setDebugDelay: () => {},
});
