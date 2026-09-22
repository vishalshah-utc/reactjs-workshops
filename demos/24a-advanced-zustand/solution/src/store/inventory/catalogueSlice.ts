import { listProducts } from '../../api/services/products';
import { ApiError } from '../../lib/ApiError';
import { env } from '../../config/env';
import type { CatalogueSlice, SliceOf } from './types';

/**
 * NOT state. Nothing renders from an AbortController, so putting one in the
 * store would only give immer something to freeze and devtools something
 * meaningless to serialise. A module-scope variable is the right home for a
 * handle the store needs but the UI never reads.
 */
let inFlight: AbortController | null = null;

export const initialCatalogue = {
  status: 'idle',
  error: null,
  ids: [],
  entities: {},
  total: 0,
  page: 0,
  limit: env.pageSize,
  requestId: 0,
} satisfies Omit<CatalogueSlice, 'fetchPage' | 'goToPage' | 'retry' | 'upsertProduct' | 'patchStock'>;

export const createCatalogueSlice: SliceOf<CatalogueSlice> = (set, get) => ({
  ...initialCatalogue,

  /**
   * The only async action in the slice, and the only place the console talks to
   * the network. Three things make it safe under overlapping calls:
   *
   *   1. a monotonic `requestId` — a response whose id is no longer the current
   *      one is DROPPED, whatever it says;
   *   2. an `AbortController` — the previous request is cancelled, so the
   *      browser stops waiting for bytes nobody wants;
   *   3. `get()` is read again AFTER every `await` — the state you read before
   *      an await is a photograph, and the world moved while you were gone.
   */
  fetchPage: async (page) => {
    const requestId = get().requestId + 1;

    // Cancel whatever was in flight BEFORE announcing the new request, so the
    // old one's catch block sees an aborted signal and returns quietly.
    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;

    set(
      (state) => {
        state.requestId = requestId;
        state.status = 'loading';
        state.error = null;
        if (page !== undefined) state.page = page;
      },
      false,
      'inventory/fetchPending',
    );

    // Read AFTER the set above: `page` has just been written, and this is the
    // last safe moment — everything below is on the other side of an await.
    const { filters, limit, page: current, debugDelayMs } = get();

    try {
      const data = await listProducts({
        q: filters.q,
        category: filters.category,
        sortBy: filters.sortBy,
        order: filters.order,
        page: current,
        limit,
        delayMs: debugDelayMs,
        signal: controller.signal,
      });

      // LATEST WINS. A slower earlier request can still resolve here: abort()
      // stops the transfer, but a response already parsed and sitting in the
      // microtask queue arrives anyway. The id is what actually decides.
      if (get().requestId !== requestId) return;

      set(
        (state) => {
          state.status = 'ready';
          state.error = null;
          state.total = data.total;
          // `ids` is THIS page, in the server's order.
          state.ids = data.products.map((product) => product.id);
          // `entities` accumulates: every product the console has ever seen,
          // looked up by id in O(1). See the diagram in Lab 3.
          for (const product of data.products) state.entities[product.id] = product;
        },
        false,
        'inventory/fetchFulfilled',
      );
    } catch (error) {
      // A cancellation is not a failure — it is us, doing our job.
      if (controller.signal.aborted) return;
      if (get().requestId !== requestId) return;

      set(
        (state) => {
          state.status = 'error';
          state.error = ApiError.from(error);
        },
        false,
        'inventory/fetchRejected',
      );
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  },

  goToPage: (page) => {
    void get().fetchPage(page);
  },

  retry: () => {
    void get().fetchPage();
  },

  /** One product in, one entity updated. Used by the edit and bulk slices. */
  upsertProduct: (product) =>
    set(
      (state) => {
        state.entities[product.id] = product;
      },
      false,
      `inventory/upsert:${product.id}`,
    ),

  /**
   * The nested write that justifies immer. Without it this is
   *   entities: { ...state.entities, [id]: { ...state.entities[id], stock } }
   * — correct, and one forgotten spread away from a silent shared reference.
   */
  patchStock: (id, stock) =>
    set(
      (state) => {
        const product = state.entities[id];
        if (product) product.stock = stock;
      },
      false,
      `inventory/patchStock:${id}`,
    ),
});
