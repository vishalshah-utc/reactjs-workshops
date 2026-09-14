import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ApiError } from '../lib/ApiError';

export interface UseApiOptions<T> {
  /** Don't fetch (yet). The early `return` you'd otherwise write inside the effect. */
  skip?: boolean;
  initialData?: T | null;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  /** Mutations need to update the list without a round trip. */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Runs `fetcher(signal)` whenever `deps` change. The one fetch effect the
 * whole app shares — loading / error / abort / isCancel / the aborted-guard,
 * written once. Generic: `data` is whatever the fetcher resolves to.
 *
 * @param fetcher  MUST forward the signal to the service
 * @param deps     if the fetcher closes over a value, it goes here — the lint rule can't see through the spread
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  { skip = false, initialData = null }: UseApiOptions<T> = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (skip) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setData(await fetcher(controller.signal));
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err)); // unknown in, ApiError out
        setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, skip]);

  return { data, loading: loading && !skip, error, reload, setData };
}
