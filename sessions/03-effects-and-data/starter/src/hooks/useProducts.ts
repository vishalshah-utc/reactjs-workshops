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
   * TODO(lab-1.1): set `status` to 'empty' when the response has no rows.
   * Right now everything that succeeds is 'success', so a search with no
   * matches renders an empty grid instead of a designed empty state.
   *
   * TODO(lab-2.1): the dependency array below is `[query, reloadToken]` and
   * that is an INFINITE LOOP. `query` is an object literal built during the
   * parent's render, so it is a new object every time and the effect can
   * never see it as unchanged: fetch → setState → render → new object →
   * fetch. Open the network tab and watch.
   *
   *   Fix it by depending on the query's VALUE rather than its identity:
   *     const queryKey = JSON.stringify(query);
   *   then depend on [queryKey, reloadToken] and JSON.parse inside.
   *
   *   Remember that name. Session 5 replaces this whole hook with TanStack
   *   Query, whose central idea is exactly a serialisable key.
   *
   * TODO(lab-3.1): there is no cancellation. Type fast in the search box and
   * an earlier, slower response can land after a later one and overwrite it.
   * Create an AbortController, pass `controller.signal` to getProducts, and
   * return `() => controller.abort()` as the cleanup.
   *
   *   Then handle the abort in .catch — an aborted request is not a failure,
   *   and rendering an error for it flashes a red banner on every keystroke.
   */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
     * The linter is right, and it is worth reading rather than silencing.
     * Setting state synchronously in an effect costs a second render pass.
     * For a fetch there is no way around it — the request cannot start during
     * render, and something has to say "we are loading now". That is a flaw in
     * hand-rolled data fetching, not in your code, and it is exactly why
     * TanStack Query exists. Session 5 deletes this hook. */
    setStatus('loading');
    setError(null);

    getProducts(query)
      .then((response) => {
        setProducts(response.data);
        setTotal(response.meta.total);
        setStatus('success');
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught : new Error('Something went wrong'));
        setStatus('error');
      });
  }, [query, reloadToken]);

  return { products, total, status, error, refetch };
}
