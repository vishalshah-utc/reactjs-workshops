import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 *
 * The cleanup is the whole hook. React runs the PREVIOUS effect's cleanup
 * before the next effect runs, so each keystroke cancels the timer the last
 * one set:
 *
 *   type 'l'      → set timer A
 *   type 'la'     → cancel A, set timer B
 *   type 'lap'    → cancel B, set timer C
 *   (300ms pass)  → only C fires
 *
 * Without it every keystroke's timer eventually fires and you get one request
 * per character, just slightly later. Session 3 Lab 2 built this.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
