/**
 * Calls the callback immediately — no debounce yet. Lab 1.4 makes it wait
 * until calls stop for `delay` ms, so typing writes the URL once, not per key.
 */
// TODO(lab-1.4): generic over the callback's args; a timer in a ref; each call clears and restarts it; cleanup on unmount
export function useDebouncedCallback<TArgs extends unknown[]>(callback: (...args: TArgs) => void): (...args: TArgs) => void {
  return callback;
}
