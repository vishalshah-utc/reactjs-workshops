import { useMutation } from '@tanstack/react-query';
import { deleteProduct } from '../api/services/products';

/**
 * Delete one product.
 *
 * A mutation is not a query: it has no key, it is never cached and it never
 * runs on its own. What it has is a LIFECYCLE — `onMutate` before the request,
 * `onSuccess` / `onError` after it, `onSettled` either way — and that lifecycle
 * is where cache maintenance belongs, not in the component.
 */
export function useDeleteProduct() {
  // TODO(lab-3.1): take the `queryClient` from `useQueryClient()` and add
  // `onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all })`
  // — one prefix covers the list, the detail and "show all".
  // TODO(lab-4.1): then make it optimistic — `onMutate` cancels in-flight
  // refetches, snapshots every cached list and removes the product; `onError`
  // restores the snapshots; `onSettled` still has the last word.
  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
  });
}
