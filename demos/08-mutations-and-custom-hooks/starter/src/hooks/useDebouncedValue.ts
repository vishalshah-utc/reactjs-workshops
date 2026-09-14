import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 * Each new value cancels the previous timer, so a burst of keystrokes
 * produces ONE update — and therefore one request.
 *
 * Generic: whatever type goes in comes out.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // the cleanup IS the debounce
  }, [value, delay]);

  return debounced;
}
