import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

/** The shape the console renders. `transformResponse` produces it, so no component unwraps an envelope. */
export interface InventoryPage {
  products: import('../types').Product[];
  total: number;
}

/**
 * TODO(lab-6.2): the same three requests as Labs 2–4, declared instead of
 * written.
 *
 * `createApi` generates a reducer, a middleware, one hook per endpoint, the
 * cache, the deduplication, the abort signals, the loading flags, the tag graph
 * and the devtools entries. The `/react` entry point is what adds the hooks.
 *
 * Add:
 *  - `tagTypes: ['Product']` — declaring the vocabulary makes a typo in
 *    `invalidatesTags` a compile error rather than a refetch that never happens;
 *  - `keepUnusedDataFor` — TanStack Query's `staleTime`, in SECONDS;
 *  - a `getInventory` query whose ARGUMENT is the filters object, with
 *    `transformResponse` unwrapping the envelope and `providesTags` returning
 *    one tag per row plus a `'LIST'` tag;
 *  - TODO(lab-6.3): a `setStock` mutation with an `onQueryStarted` optimistic
 *    update through `inventoryApi.util.updateQueryData` (whose returned patch
 *    has an `undo()` — that is the whole rollback) and an `invalidatesTags`
 *    that names the ONE row, not the list.
 *
 * Then export the generated hooks:
 * `export const { useGetInventoryQuery, useSetStockMutation } = inventoryApi;`
 */
export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: axiosBaseQuery,
  endpoints: () => ({}),
});
