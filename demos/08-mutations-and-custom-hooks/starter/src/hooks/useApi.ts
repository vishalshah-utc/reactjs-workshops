import type { ApiError } from '../lib/ApiError';

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Does nothing yet: returns whatever initialData you gave it and never
 * fetches. Lab 4.1 turns it into the one fetch effect the whole app shares.
 */
// TODO(lab-4.1): generic <T>; loading / error / data / reload / setData; abortable; ignores axios.isCancel; guards setLoading
export function useApi<T>(
  _fetcher: (signal: AbortSignal) => Promise<T>,
  _deps: unknown[] = [],
  { initialData = null }: { skip?: boolean; initialData?: T | null } = {},
): UseApiResult<T> {
  return { data: initialData, loading: false, error: null, reload: () => {}, setData: () => {} };
}
