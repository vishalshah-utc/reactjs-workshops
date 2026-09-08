import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 *
 * This version is BROKEN, and Lab 2 is about why.
 *
 * TODO(lab-2.2): the effect sets a timer and never clears it.
 *
 * Every keystroke schedules another `setDebounced`, and every one of them
 * eventually fires. Type "laptop" and six timers land 300ms apart — you get
 * six requests, just slightly later than before. The debounce achieves
 * nothing except confusion.
 *
 * The fix is one line: return a cleanup that clears the timer.
 *
 *   return () => clearTimeout(timer);
 *
 * React runs the PREVIOUS effect's cleanup before the next effect, so each
 * keystroke cancels the timer the last one set:
 *
 *   type 'l'      → set timer A
 *   type 'la'     → cancel A, set timer B
 *   type 'lap'    → cancel B, set timer C
 *   (300ms pass)  → only C fires
 *
 * Watch it fail first — network tab open, type a word — then fix it.
 * Guide, Lab 2 step B.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    setTimeout(() => setDebounced(value), delay);
    // TODO(lab-2.2): capture that timer id and clear it in a cleanup:
    //   const timer = setTimeout(...)
    //   return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
