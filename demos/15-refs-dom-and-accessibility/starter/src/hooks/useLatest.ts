import { useRef, type RefObject } from 'react';

/** Lab 1.2: a ref that always holds the latest `value` — Demo 7's `callbackRef`, with a name. This stub never updates. */
// TODO(lab-1.2): write `value` into ref.current in an effect with no dependency array (never during render — react-hooks/refs forbids it)
export function useLatest<T>(value: T): RefObject<T> {
  return useRef(value);
}
