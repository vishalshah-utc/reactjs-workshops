import type { FiltersSlice, InventoryFilters, SliceOf } from './types';

export const initialFilters: InventoryFilters = {
  q: '',
  category: '',
  lowStockOnly: false,
  sortBy: 'title',
  order: 'asc',
};

/**
 * The simplest slice in the store: it holds what the user asked for, and
 * nothing about what the server said. Splitting it out is what makes the rule
 * below possible — "any filter change starts again at page one" lives in ONE
 * place, instead of in five onChange handlers.
 *
 * Note the shape of a slice creator: `(set, get) => ({ … })`. It is the same
 * function you already pass to `create()` in `store/cart.ts` — the only
 * difference is that it returns PART of the state, and `get()` can see all of
 * it. That is why `setFilter` below can call `fetchPage`, which belongs to a
 * different slice entirely.
 */
export const initialFiltersState = {
  filters: initialFilters,
  debugDelayMs: 0,
} satisfies Omit<FiltersSlice, 'setFilter' | 'clearFilters' | 'setDebugDelay'>;

export const createFiltersSlice: SliceOf<FiltersSlice> = (set, get) => ({
  ...initialFiltersState,

  setFilter: (key, value) => {
    // immer's draft: assign to it. `filters` is replaced immutably for you.
    // The third argument is the name devtools shows — `inventory/setFilter:q`
    // reads in a time-travel list; `anonymous` does not.
    set(
      (state) => {
        state.filters[key] = value;
      },
      false,
      `inventory/setFilter:${key}`,
    );
    // Page 3 of "phone" is not page 3 of "phones". Always restart at page one.
    void get().fetchPage(0);
  },

  clearFilters: () => {
    set(
      (state) => {
        state.filters = initialFilters;
      },
      false,
      'inventory/clearFilters',
    );
    void get().fetchPage(0);
  },

  setDebugDelay: (ms) =>
    set(
      (state) => {
        state.debugDelayMs = ms;
      },
      false,
      'inventory/setDebugDelay',
    ),
});
