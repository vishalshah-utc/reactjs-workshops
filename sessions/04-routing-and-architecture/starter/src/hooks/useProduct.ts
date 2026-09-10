import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { ApiError, getProduct } from '@/lib/api';

type Status = 'loading' | 'error' | 'success';

/**
 * One product, by slug.
 *
 * The same four-state shape as `useProducts`, minus 'empty' — a single record
 * either exists or it does not, and "does not" is a 404, which is an error
 * with a specific status rather than an empty result.
 *
 * That distinction matters for the detail page: a 404 should render "we could
 * not find that product" and a 500 should render "something went wrong", and
 * `ApiError.status` is what tells them apart.
 */
export function useProduct(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    /* eslint-disable-next-line react-hooks/set-state-in-effect --
     * Same trade-off as useProducts: a fetch cannot start during render, so
     * something has to announce "loading" from the effect. Session 5 removes
     * this whole category of code. */
    setStatus('loading');
    setError(null);

    getProduct(slug, controller.signal)
      .then((response) => {
        setProduct(response.data);
        setStatus('success');
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught : new Error('Something went wrong'));
        setStatus('error');
      });

    return () => controller.abort();
  }, [slug]);

  return { product, status, error };
}
