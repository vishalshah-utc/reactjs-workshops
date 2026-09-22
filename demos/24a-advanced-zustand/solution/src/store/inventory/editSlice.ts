import { updateProduct } from '../../api/services/products';
import { ApiError } from '../../lib/ApiError';
import type { EditSlice, SliceOf } from './types';

export const initialEdit = { rows: {} } satisfies Omit<EditSlice, 'commitStock' | 'dismissRowError'>;

export const createEditSlice: SliceOf<EditSlice> = (set, get) => ({
  ...initialEdit,

  /**
   * Optimistic, in four beats:
   *
   *   1. SNAPSHOT the value you are about to destroy — before you destroy it;
   *   2. WRITE the new value, so the table is correct one frame later;
   *   3. ASK the server;
   *   4. on rejection, PUT THE SNAPSHOT BACK and say why.
   *
   * The snapshot is a local `const`, not state. It lives exactly as long as
   * this call, which is exactly as long as it can possibly be needed.
   */
  commitStock: async (id, stock) => {
    const previous = get().entities[id]?.stock;
    if (previous === undefined || previous === stock) return;

    set(
      (state) => {
        state.rows[id] = { pending: true, error: null };
      },
      false,
      `inventory/editPending:${id}`,
    );
    get().patchStock(id, stock);

    try {
      // DummyJSON SIMULATES this: the response is real and correct, and nothing
      // is stored. Patch a product that does not exist (id 9999) and it answers
      // 404 with a real message — which is how Verify forces the rollback.
      const updated = await updateProduct(id, { stock });

      // The server is the authority on what it stored. Take its answer, not ours.
      get().upsertProduct({ ...get().entities[id], ...updated });
      set(
        (state) => {
          delete state.rows[id];
        },
        false,
        `inventory/editFulfilled:${id}`,
      );
    } catch (error) {
      const apiError = ApiError.from(error);
      // ROLLBACK. The row goes back to exactly what it was, and the message
      // sits on that row — not in a global banner that says nothing about which.
      get().patchStock(id, previous);
      set(
        (state) => {
          state.rows[id] = { pending: false, error: apiError.message };
        },
        false,
        `inventory/editRejected:${id}`,
      );
    }
  },

  dismissRowError: (id) =>
    set(
      (state) => {
        delete state.rows[id];
      },
      false,
      `inventory/dismissRowError:${id}`,
    ),
});
