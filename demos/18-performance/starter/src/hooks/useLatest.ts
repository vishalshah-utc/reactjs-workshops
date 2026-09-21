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
// TODO(lab-6.1): enable `babel-plugin-react-compiler` in vite.config.ts, then come back and check this hook.
//   The compiler leaves refs alone by design; had the write happened during RENDER, this would have been the
//   first file it refused — and `react-hooks/refs`, which is the compiler's analysis running in ESLint, would
//   have said so long before. Check src/legacy/ too: class components are skipped, not compiled.
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
