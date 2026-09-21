/**
 * Functions about functions. Nothing in here knows what a Product is — the
 * generics are what let these work on anything, and that is the point.
 */

// TODO(lab-5.1): makeCounter (a closure), snapshot (the stale value), pluck<T, K extends keyof T>

// TODO(lab-5.2): by<T> — a comparator factory; debounce<A extends unknown[]> with a real timer
export function debounce<A extends unknown[]>(fn: (...args: A) => void, _ms: number): (...args: A) => void {
  return fn; // no delay yet
}
