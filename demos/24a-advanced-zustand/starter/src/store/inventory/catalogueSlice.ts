import { env } from '../../config/env';
import type { CatalogueSlice, SliceOf } from './types';

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

/**
 * Everything the console knows about the catalogue, and the one action that
 * talks to the network.
 *
 * TODO(lab-2.1): the status machine. `status` is a union of four, so `loading`
 * and `error` cannot both be true; `error` is non-null only while `status` is
 * `'error'`. Write `goToPage` and `retry` — two one-liners over `fetchPage`.
 *
 * TODO(lab-2.2): `fetchPage`. Bump a monotonic `requestId`, abort the previous
 * request through a MODULE-SCOPE AbortController (an AbortController is not
 * state — nothing renders from it), set `status: 'loading'`, await
 * `listProducts`, and then check `get().requestId` before writing anything.
 * Every `get()` after an `await` must be a fresh one.
 *
 * TODO(lab-3.1): the normalised write. `ids` is this page in the server's
 * order; `entities` accumulates every product seen, by id. Then `upsertProduct`
 * and `patchStock` — the nested updates that pay for the immer middleware.
 */
export const createCatalogueSlice: SliceOf<CatalogueSlice> = () => ({
  ...initialCatalogue,

  fetchPage: async () => {},
  goToPage: () => {},
  retry: () => {},
  upsertProduct: () => {},
  patchStock: () => {},
});
