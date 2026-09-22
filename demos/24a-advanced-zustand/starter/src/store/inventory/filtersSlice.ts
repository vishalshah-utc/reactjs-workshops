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
 * TODO(lab-1.2): write the three actions. `setFilter` is generic over the key,
 * so `setFilter('sortBy', 'stock')` type-checks and `setFilter('sortBy', 'stok')`
 * does not. Give every `set` a devtools action name as its third argument.
 *
 * TODO(lab-2.3): once `fetchPage` exists, `setFilter` and `clearFilters` must
 * also refetch — always from page 0, because page 3 of "phone" is not page 3 of
 * "phones". They reach it with `get().fetchPage(0)`: one `get`, all five slices.
 */
export const createFiltersSlice: SliceOf<FiltersSlice> = (set) => ({
  ...initialFiltersState,

  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () => set({ filters: initialFilters }),

  setDebugDelay: (ms) => set({ debugDelayMs: ms }),
});
