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
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
