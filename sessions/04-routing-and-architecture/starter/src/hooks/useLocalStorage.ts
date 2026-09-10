import { useCallback, useEffect, useState } from 'react';

/**
 * `useState`, but it survives a reload.
 *
 * Three things this gets right, each for a reason:
 *
 *  1. **A lazy initialiser.** `useState(() => read())` runs `read` once, on
 *     mount. Written `useState(read())` it would hit localStorage and parse
 *     JSON on every render and throw the result away every time but the first.
 *
 *  2. **try/catch around every access.** localStorage throws in Safari private
 *     mode, on quota errors, and when the stored JSON is corrupt. A storage
 *     helper that crashes the app is worse than no storage.
 *
 *  3. **A `storage` event listener.** Fired by OTHER tabs of the same origin,
 *     never by the one that made the change. It is what makes two open tabs
 *     agree — Session 6 uses exactly this to log you out everywhere.
 *
 * Session 3 Lab 4 built this.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded, or storage disabled. The app still works in memory;
      // losing persistence is not worth taking the page down for.
    }
  }, [key, value]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return;
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        // Another tab wrote something we cannot parse. Keep what we have.
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const clear = useCallback(() => {
    setValue(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // See above.
    }
  }, [key, initialValue]);

  return [value, setValue, clear] as const;
}
