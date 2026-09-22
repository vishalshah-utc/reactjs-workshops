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
 * THE line that causes most of Zustand's TypeScript pain.
 *
 * A slice creator has to declare every middleware applied ABOVE it, in the
 * order they were applied, or `set` loses the abilities those middlewares add:
 * immer's draft recipe, devtools' third "action name" argument. Declare it
 * once, here, and every slice writes `SliceOf<XSlice>`.
 *
 * Keep this list in the same order as the wrapping in `index.ts`. If you add or
 * remove a middleware there and forget here, the error lands on `set`, not on
 * the middleware — which is why it is worth a named alias.
 */
export type InventoryMutators = [
  ['zustand/devtools', never],
  ['zustand/persist', unknown],
  ['zustand/immer', never],
  ['zustand/subscribeWithSelector', never],
];

export type SliceOf<T> = StateCreator<InventoryStore, InventoryMutators, [], T>;

/** Below this, a row is "low stock". One constant, used by the selector and the badge. */
export const LOW_STOCK = 20;
