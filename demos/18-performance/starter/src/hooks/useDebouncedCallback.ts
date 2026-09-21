import { useCallback, useEffect, useRef } from 'react';
import { useLatest } from './useLatest';

/**
 * Returns a stable function that calls `callback` only after `delay` ms have
 * passed without another call. Used to write the search box to the URL once
 * the user pauses — which, with loaders, means fetching once.
 *
 * Generic over the callback's arguments, so the returned function has the
 * same signature as the one you passed in.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay = 400,
): (...args: TArgs) => void {
  // The debounced function is created once (useCallback) but must call the NEWEST callback —
  // the one that closes over the current props. A ref that tracks the latest value is exactly that.
  const callbackRef = useLatest(callback);

  // Two more refs: a timer handle is not render state either. Nothing on screen changes when it does.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current); // don't fire after unmount
  }, []);

  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay, callbackRef],
  );
}
