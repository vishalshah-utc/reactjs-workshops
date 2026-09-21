import type { RequestStatus } from '../reducers/requestStatus';

// TODO(lab-6.1): the legacy <Fetch> render prop as a hook — useReducer(requestStatusReducer<T>), one effect keyed on `key`,
// an AbortController cancelled on cleanup, `load` read through useLatest
/** Placeholder: never loads. RelatedProducts still uses src/legacy/Fetch.tsx. */
export function useFetch<T>(_load: (signal: AbortSignal) => Promise<T>, _key: string): RequestStatus<T> {
  return { status: 'idle' };
}
