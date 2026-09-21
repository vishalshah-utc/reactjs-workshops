import { useEffect, useRef, type RefObject } from 'react';

/**
 * A ref that always holds the latest `value`.
 *
 * Read it inside a callback that was created earlier — a timer, a window
 * listener, a debounced function — and you get today's value, not the one
 * from the render that created the callback. Demo 7's `useDebouncedCallback`
 * has done this since the day it was written; this is that idea with a name.
 *
 * Written in an effect, not during render: `react-hooks/refs` forbids touching
 * `.current` while rendering, and an effect with no dependency array runs after
 * every commit anyway.
 *
 * Which is also why the React Compiler (Demo 18 Lab 6) leaves this hook alone
 * and compiles everything that uses it. The compiler only caches values it can
 * prove are derived from its inputs; a ref is a mutable box it deliberately
 * never reasons about. Had the write happened during render, this file would
 * have been the first thing the compiler refused — and `react-hooks/refs`,
 * which is the compiler's own analysis running in ESLint, would have told you
 * long before that.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
