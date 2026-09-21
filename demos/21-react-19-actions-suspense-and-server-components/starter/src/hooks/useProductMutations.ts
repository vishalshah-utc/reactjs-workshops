import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productKeys } from '../api/queries';
import { deleteProduct } from '../api/services/products';
import { ApiError } from '../lib/ApiError';
import type { ProductListResponse } from '../types';

/** What `onMutate` hands to `onError`: everything needed to put the world back. */
interface DeleteContext {
  /** Every list entry we touched, as it was. A Map would not survive structural sharing — an array of pairs does. */
  snapshots: [readonly unknown[], ProductListResponse][];
}

/**
 * Delete one product.
 *
 * A mutation is not a query: it has no key, it is never cached and it never
 * runs on its own. What it has is a LIFECYCLE — `onMutate` before the request,
 * `onSuccess` / `onError` after it, `onSettled` either way — and that lifecycle
 * is where cache maintenance belongs, not in the component.
 *
 * Demo 8 wrote five rules by hand for this: keep the list in state, remove the
 * row, remember what you removed, put it back on failure, and refetch when you
 * are unsure. Here they are three callbacks, and only one of them is about
 * this feature.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),

    /**
     * OPTIMISTIC, step 1: run BEFORE the request and edit the cache as if it
     * had already succeeded.
     *
     * `cancelQueries` first, and it is not optional: a refetch that is already
     * in flight will land AFTER this edit and overwrite it with the old list.
     * Then snapshot, then write. Whatever this returns arrives as the third
     * argument of `onError` and `onSettled`.
     */
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      const snapshots = queryClient.getQueriesData<ProductListResponse>({ queryKey: productKeys.lists() });

      queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
        old
          ? { ...old, products: old.products.filter((p) => String(p.id) !== String(id)), total: Math.max(0, old.total - 1) }
          : old,
      );

      // `getQueriesData` returns [key, data | undefined][] — drop the entries that had no data to restore.
      return { snapshots: snapshots.filter((pair): pair is [readonly unknown[], ProductListResponse] => pair[1] !== undefined) };
    },

    /** OPTIMISTIC, step 2: the request failed, so put every snapshot back exactly as it was. */
    onError: (_error, _id, context: DeleteContext | undefined) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
    },

    /**
     * OPTIMISTIC, step 3: whatever happened, the server is now the authority.
     * `invalidateQueries` marks every matching key stale and refetches the ones
     * being watched — so the optimistic edit is replaced by the truth, and a
     * rollback that guessed wrong is corrected too.
     *
     * The key is the PREFIX `['products']`: the list, the detail, "show all"
     * and the infinite pages all hang off it, and one call covers them.
     */
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

/** `error` from a mutation is `unknown`. Normalise it at the boundary, once — never render `String(error)`. */
export function asApiError(error: unknown): ApiError | null {
  return error ? ApiError.from(error) : null;
}
