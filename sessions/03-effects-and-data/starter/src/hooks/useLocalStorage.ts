import { useCallback, useEffect, useState } from 'react';

/**
 * TODO(lab-4.1): `useState`, but it survives a reload.
 *
 * Three things to get right, and each has a reason:
 *
 *  1. **A lazy initialiser.** `useState(() => read())` runs `read` once, on
 *     mount. Written `useState(read())` it hits localStorage and parses JSON
 *     on EVERY render and throws the result away every time but the first.
 *
 *  2. **try/catch around every access.** localStorage throws in Safari private
 *     mode, on quota errors, and when the stored JSON is corrupt. A storage
 *     helper that crashes the app is worse than no storage.
 *
 *  3. **A `storage` event listener.** Fired by OTHER tabs of the same origin,
 *     never by the one that made the change. It is what makes two open tabs
 *     agree — Session 6 uses exactly this to log you out everywhere.
 *
 * Right now it is plain useState with no persistence at all. Guide, Lab 4 step A.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // TODO(lab-4.1): write `value` to localStorage under `key`, in a try/catch.
  }, [key, value]);

  // TODO(lab-4.1): a second effect subscribing to the window 'storage' event,
  // with a cleanup that removes the listener. Forget the cleanup and every
  // mount leaks a listener that calls setState on a dead component.

  const clear = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [value, setValue, clear] as const;
}
