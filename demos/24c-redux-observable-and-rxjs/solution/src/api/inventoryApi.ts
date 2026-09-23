import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';
import { endpoints } from './endpoints';
import type { Product, ProductListResponse } from '../types';
import { PAGE_SIZE, type FiltersState } from '../store/filters';

/** The shape the console renders. `transformResponse` produces it, so no component unwraps an envelope. */
export interface InventoryPage {
  products: Product[];
  total: number;
}

const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

/**
 * The same three requests as Labs 2–4, declared instead of written.
 *
 * `createApi` generates: a reducer, a middleware, one hook per endpoint, the
 * cache, the deduplication, the abort signals, the loading flags, the tag
 * graph and the devtools entries. The `/react` entry point is what adds the
 * hooks — `@reduxjs/toolkit/query` alone gives you the same API without them.
 */
export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: axiosBaseQuery,
  /**
   * The tag vocabulary. Declaring it up front is what makes a typo in
   * `invalidatesTags` a compile error rather than a refetch that never happens.
   */
  tagTypes: ['Product'],
  /** Equivalent of TanStack Query's `staleTime`, in SECONDS, and named for what it is. */
  keepUnusedDataFor: 120,
  endpoints: (build) => ({
    /**
     * F1/F3, in fourteen lines, including the race, the dedupe and the abort —
     * all of which you wrote by hand in Labs 2 and 3.
     */
    getInventory: build.query<InventoryPage, FiltersState>({
      query: (filters) => {
        const params: Record<string, string | number | undefined> = {
          limit: PAGE_SIZE,
          skip: filters.page * PAGE_SIZE,
          select: LIST_FIELDS,
          sortBy: filters.sortBy,
          order: filters.order,
          ...(filters.delayMs ? { delay: filters.delayMs } : {}),
        };

        let url = endpoints.products.list();
        if (filters.q) {
          url = endpoints.products.search();
          params.q = filters.q;
        } else if (filters.category) {
          url = endpoints.products.byCategory(filters.category);
        }

        return { url, params };
      },
      /** The envelope is the server's business, not the component's. */
      transformResponse: (response: ProductListResponse): InventoryPage => ({
        products: response.products,
        total: response.total,
      }),
      /**
       * "This entry contains these things." One tag per row plus a LIST tag —
       * the standard shape. Invalidating `{ type: 'Product', id: 7 }` refetches
       * every list that contains product 7 and nothing else.
       */
      providesTags: (result) =>
        result
          ? [
              ...result.products.map((product) => ({ type: 'Product' as const, id: product.id })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),

    /** F4, the RTK Query way. */
    setStock: build.mutation<Product, { id: number; stock: number; filters: FiltersState }>({
      query: ({ id, stock, filters }) => ({
        url: endpoints.products.update(id),
        method: 'PATCH',
        data: { stock },
        params: filters.delayMs ? { delay: filters.delayMs } : undefined,
      }),

      /**
       * The optimistic update. `updateQueryData` returns a patch with an
       * `undo()`, which is the whole rollback — Immer produced the patch, so
       * reversing it is exact rather than a snapshot-and-restore.
       *
       * `filters` is in the argument ONLY so this knows which cache entry to
       * edit. That is the tax RTK Query charges for an optimistic update on a
       * parameterised list, and it is worth knowing before you design the args.
       */
      async onQueryStarted({ id, stock, filters }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          inventoryApi.util.updateQueryData('getInventory', filters, (draft) => {
            const row = draft.products.find((product) => product.id === id);
            if (row) row.stock = stock;
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },

      /**
       * After it succeeds, this row is stale everywhere. Not `'LIST'`: that
       * would refetch every page of every filter combination in the cache to
       * correct one number.
       */
      invalidatesTags: (_result, error, { id }) => (error ? [] : [{ type: 'Product', id }]),
    }),
  }),
});

export const { useGetInventoryQuery, useSetStockMutation } = inventoryApi;
