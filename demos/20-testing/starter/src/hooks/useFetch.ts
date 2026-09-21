import { useEffect, useReducer } from 'react';
import { ApiError } from '../lib/ApiError';
import { requestStatusReducer, type RequestStatus } from '../reducers/requestStatus';
import { useLatest } from './useLatest';

/**
 * The legacy <Fetch> render prop as a hook: one request, cancelled on unmount or when `key` changes, its status
 * as the same four-state machine (`requestStatusReducer`, Demo 12). Where <Fetch> needed three lifecycle methods,
 * a class field for the controller and a render-prop callback, this is one effect and a return value.
 *
 * `key` is a STRING that names the request (`related:beauty:1`) — like a query key — so the dependency list is
 * literal and the linter can check it. `load` is read through useLatest: the effect never depends on the
 * function's identity, so callers pass an inline arrow without useCallback.
 *
 * NOTHING CALLS THIS ANY MORE. Demo 19 moved both of its callers onto `useQuery`, and it stays in the tree
 * for the same reason `src/legacy/` does: it is the before-picture. Read the two side by side and the list of
 * things a cache gives you — dedupe, `gcTime`, background refetch, invalidation, `select` — is exactly the list
 * of things this file would have to grow. That is the honest argument for the dependency.
 */
export function useFetch<T>(load: (signal: AbortSignal) => Promise<T>, key: string): RequestStatus<T> {
  const [request, dispatch] = useReducer(requestStatusReducer<T>, { status: 'idle' });
  const loadRef = useLatest(load);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'start' });
    loadRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) dispatch({ type: 'succeed', data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) dispatch({ type: 'fail', error: ApiError.from(error) });
      });
    return () => controller.abort();
    // `key` is the whole dependency by design; loadRef is a stable ref.
  }, [key, loadRef]);

  return request;
}
