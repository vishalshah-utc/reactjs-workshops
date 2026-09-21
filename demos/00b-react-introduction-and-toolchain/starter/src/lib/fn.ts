/**
 * Functions about functions. Nothing in here knows what a Product is — the
 * generics are what let these work on anything, and that is the point.
 */
import type { SortOrder } from './catalog';

/** A closure: `count` outlives the call that created it, private to the two functions that captured it. */
export function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    value: () => count,
  };
}

/**
 * The "stale value". Each call gets its OWN `count`; the function it returns
 * remembers that one forever. This is React's render model: every render is a
 * new call, every handler closes over that render's values.
 */
export function snapshot(count: number): () => string {
  return () => `count is ${count}`;
}

/**
 * Generic: `T` is whatever the array holds; `K` must be one of its keys; the
 * result is an array of that key's type. `pluck(products, 'price')` is `number[]`,
 * and `pluck(products, 'colour')` is a compile error.
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

/**
 * A higher-order function: takes a selector, RETURNS a comparator.
 * `[...products].sort(by((p) => p.price, 'desc'))`.
 */
export function by<T>(select: (item: T) => string | number, order: SortOrder = 'asc'): (a: T, b: T) => number {
  const direction = order === 'asc' ? 1 : -1;
  return (a, b) => {
    const left = select(a);
    const right = select(b);
    if (left < right) return -direction;
    if (left > right) return direction;
    return 0;
  };
}

/**
 * Generic over the ARGUMENT LIST: the debounced function has exactly the
 * parameters of the original, so a typo in a call is still caught.
 * `ReturnType<typeof setTimeout>` is `number` in the browser and an object in Node — this works in both.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
