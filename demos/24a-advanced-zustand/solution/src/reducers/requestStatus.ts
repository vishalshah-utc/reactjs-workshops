import type { ApiError } from '../lib/ApiError';

/**
 * One request's status as a STATE MACHINE. A discriminated union: `status` decides which
 * other fields exist, so `data` is only reachable on success. Four states, not eight.
 */
export type RequestStatus<T> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

/** Everything that can HAPPEN to a request. An action names an event, not a field to set. */
export type RequestAction<T> =
  | { type: 'start' }
  | { type: 'succeed'; data: T }
  | { type: 'fail'; error: ApiError }
  | { type: 'reset' };

/**
 * PURE: same state + same action → same result; no side effects, no mutation; exhaustive.
 * A state machine, not a setter: a result that arrives when the request is no longer
 * pending (the user pressed reset) is ignored — that transition isn't defined.
 */
export function requestStatusReducer<T>(state: RequestStatus<T>, action: RequestAction<T>): RequestStatus<T> {
  switch (action.type) {
    case 'start':
      return { status: 'pending' };
    case 'succeed':
      return state.status === 'pending' ? { status: 'success', data: action.data } : state;
    case 'fail':
      return state.status === 'pending' ? { status: 'error', error: action.error } : state;
    case 'reset':
      return { status: 'idle' };
    default: {
      // Every action type is handled above, so here `action` has type `never`.
      // Add a new type to RequestAction without a case and THIS line is the compile error.
      const unhandled: never = action;
      throw new Error(`Unhandled request action: ${JSON.stringify(unhandled)}`);
    }
  }
}
