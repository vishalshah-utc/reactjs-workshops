import type { StateCreator } from 'zustand';
import type { ApiError } from '../../lib/ApiError';
import type { Product } from '../../types';

/**
 * The console's state, as TYPES first. Every slice below is a piece of one
 * store, so the whole shape lives here and nothing has to import a slice to
 * know what another slice holds.
 */

/** Four states, and no two of them can be true at once — that is the point of a union. */
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SortKey = 'title' | 'stock' | 'price';

export interface InventoryFilters {
  q: string;
  category: string;
  /** `stock < LOW_STOCK`. DummyJSON has no predicate for this, so it is applied in a selector. */
  lowStockOnly: boolean;
  sortBy: SortKey;
  order: 'asc' | 'desc';
}

export interface FiltersSlice {
  filters: InventoryFilters;
  /** Dev-only: adds `&delay=` to the next request, so a race is reproducible. */
  debugDelayMs: number;
  setFilter: <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => void;
  clearFilters: () => void;
  setDebugDelay: (ms: number) => void;
}

export interface CatalogueSlice {
  status: LoadStatus;
  /** Only ever non-null while `status === 'error'`. */
  error: ApiError | null;
  /** The CURRENT page, in order. The server decided this order; do not re-sort it. */
  ids: number[];
  /** Every product the console has seen, by id. Accumulates across pages. */
  entities: Record<number, Product>;
  total: number;
  /** 0-based, like `skip`. */
  page: number;
  limit: number;
  /** Monotonic. Only the newest request is allowed to write a result. */
  requestId: number;
  fetchPage: (page?: number) => Promise<void>;
  goToPage: (page: number) => void;
  retry: () => void;
  upsertProduct: (product: Product) => void;
  patchStock: (id: number, stock: number) => void;
}

/** Per ROW, never one global flag — twelve rows can be in twelve different states. */
export interface RowState {
  pending: boolean;
  error: string | null;
}

export interface EditSlice {
  rows: Record<number, RowState>;
  commitStock: (id: number, stock: number) => Promise<void>;
  dismissRowError: (id: number) => void;
}

export interface BulkFailure {
  id: number;
  message: string;
}

export interface BulkReport {
  attempted: number;
  succeeded: number[];
  failed: BulkFailure[];
}

export interface BulkSlice {
  selected: number[];
  bulkStatus: 'idle' | 'running';
  bulkReport: BulkReport | null;
  /** id → the stock value before the bulk ran. The whole of "undo". */
  undoSnapshot: Record<number, number> | null;
  toggleSelected: (id: number) => void;
  selectMany: (ids: number[]) => void;
  clearSelection: () => void;
  bulkRestock: (amount: number) => Promise<void>;
  undoBulk: () => void;
  dismissReport: () => void;
}

/** Nested ON PURPOSE: `partialize` persists this one key and nothing else. */
export interface RecentSlice {
  recent: { ids: number[] };
  inspect: (id: number) => void;
  clearRecent: () => void;
}

/** One store, five slices. An intersection type, so `get()` sees all of it. */
export type InventoryStore = FiltersSlice & CatalogueSlice & EditSlice & BulkSlice & RecentSlice;

/**
 * THE BARE FORM. A slice creator over the whole store: the first parameter is
 * the WHOLE store (so `get()` sees every slice), the last is what this creator
 * RETURNS. The two lists in the middle are mutators — the middlewares applied
 * above this creator, and the ones it applies itself. Both are empty today,
 * because `index.ts` wraps the slices in nothing at all.
 *
 * Every middleware you add from Lab 2 on changes what `set` can do, and a slice
 * creator that does not declare it loses that ability. So this alias grows one
 * entry at a time, in step with the stack in `index.ts`:
 *
 * TODO(lab-2.1): `devtools` arrives, so `set` gains a third "action name"
 * argument. Introduce an `InventoryMutators` tuple whose single entry is
 * `['zustand/devtools', never]`, and build `SliceOf<T>` on it.
 *
 * TODO(lab-3.2): `immer` arrives, INSIDE devtools, so `set` gains the draft
 * recipe. Append `['zustand/immer', never]`.
 *
 * TODO(lab-6.2): `subscribeWithSelector` arrives, innermost. Append
 * `['zustand/subscribeWithSelector', never]`.
 *
 * TODO(lab-6.3): `persist` arrives, between devtools and immer. Insert
 * `['zustand/persist', unknown]` in that position — `unknown`, not `never`,
 * because persist is the one of the four that contributes a store type.
 *
 * The order is the order of application, outside-in — the same order as the
 * nesting in `index.ts`, which is the source of truth for this list.
 */
export type SliceOf<T> = StateCreator<InventoryStore, [], [], T>;

/** Below this, a row is "low stock". One constant, used by the selector and the badge. */
export const LOW_STOCK = 20;
