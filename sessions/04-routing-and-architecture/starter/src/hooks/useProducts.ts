import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/types';
import { ApiError, getProducts, type ProductQuery } from '@/lib/api';

/**
 * The four states of any async read.
 *
 * A boolean `loading` flag cannot express this. It leaves you writing
 * `if (!loading && !error && data.length === 0)` at every call site and
 * getting it subtly wrong — showing "no results" for half a second before the
 * first request lands is the classic version.
 *
 * A single `status` makes the four states mutually exclusive by construction.
 */
export type AsyncStatus = 'loading' | 'error' | 'empty' | 'success';

interface UseProductsResult {
  products: Product[];
  total: number;
  status: AsyncStatus;
  error: ApiError | Error | null;
  refetch: () => void;
}

export function useProducts(query: ProductQuery): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  /**
   * The query is serialised, and THAT string is the dependency.
   *
   * This one line is load-bearing. `query` is an object literal built during
   * the parent's render, so it is a brand-new object every time. An effect
   * depending on `[query]` compares by reference, sees a change on every
   * render, fetches, sets state, re-renders, builds a new object, and fetches
   * again — forever.
   *
   * Remember the name `queryKey`. Session 5 replaces this whole hook with
   * TanStack Query, whose central idea is exactly a serialisable key.
   */
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    const parsed = JSON.parse(queryKey) as ProductQuery;
    const controller = new AbortController();

    /* eslint-disable-next-line react-hooks/set-state-in-effect --
     * The linter is right, and it is worth reading rather than silencing.
     * Setting state synchronously in an effect costs a second render pass.
     * For a fetch there is no way around it — the request cannot start during
     * render, and something has to say "we are loading now". That is a flaw in
     * hand-rolled data fetching, not in your code, and it is exactly why
     * TanStack Query exists. Session 5 deletes this hook. */
    setStatus('loading');
    setError(null);

    getProducts(parsed, controller.signal)
      .then((response) => {
        setProducts(response.data);
        setTotal(response.meta.total);
        // An empty result is a SUCCESSFUL request that found nothing. It is a
        // different state from 'error', and the UI owes the user a different
        // message — Session 3 Lab 1.
        setStatus(response.data.length === 0 ? 'empty' : 'success');
      })
      .catch((caught: unknown) => {
        // An aborted request is not a failure. It means we asked a newer
        // question before this one came back. Rendering an error for it would
        // flash a red banner on every keystroke.
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught : new Error('Something went wrong'));
        setStatus('error');
      });

    // Cancels the in-flight request when the query changes or the component
    // unmounts. Without it a slow earlier response can land after a fast later
    // one and overwrite fresh data with stale data — Session 3 Lab 3.
    return () => controller.abort();
  }, [queryKey, reloadToken]);

  return { products, total, status, error, refetch };
}
