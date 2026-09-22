import type { EditSlice, SliceOf } from './types';

export const initialEdit = { rows: {} } satisfies Omit<EditSlice, 'commitStock' | 'dismissRowError'>;

/**
 * Per-ROW status. Twelve rows can be in twelve different states, so one global
 * `isSaving` flag is not a simplification — it is wrong.
 *
 * TODO(lab-4.1): `commitStock(id, stock)`, optimistically, in four beats:
 * snapshot the old value into a local `const` BEFORE overwriting it; write the
 * new one and mark the row pending; `await updateProduct(id, { stock })`; on
 * success take the server's answer and clear the row, on failure put the
 * snapshot back and hang `ApiError.from(error).message` on that row alone.
 * Then `dismissRowError`.
 */
export const createEditSlice: SliceOf<EditSlice> = () => ({
  ...initialEdit,

  commitStock: async () => {},
  dismissRowError: () => {},
});
