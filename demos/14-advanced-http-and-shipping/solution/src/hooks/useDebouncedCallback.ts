import { useCallback, useEffect, useRef } from 'react';

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
  // Keep the latest callback in a ref so the debounced fn never goes stale.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current); // don't fire after unmount
  }, []);

  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );
}
