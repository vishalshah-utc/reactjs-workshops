import type { RefObject } from 'react';

interface UseIntersectionOptions {
  /** Fire early: '200px' starts the next page while the sentinel is still one screen below the fold. */
  rootMargin?: string;
  /** Stop observing entirely — e.g. when there is no next page to load. */
  enabled?: boolean;
}

/**
 * Is this element on screen?
 *
 * The scroll-handler version is a `scroll` listener that runs every frame, reads
 * `getBoundingClientRect()` (a layout flush) and needs its own throttle.
 * `IntersectionObserver` asks the browser to tell YOU, off the main thread, only
 * when the answer changes.
 */
// TODO(lab-5.2): `useState` for the answer, one effect that creates an
// IntersectionObserver over `ref.current`, and a cleanup that disconnects it —
// an observer that outlives its node keeps the node alive.
export function useIntersection(_ref: RefObject<Element | null>, _options: UseIntersectionOptions = {}): boolean {
  return false;
}
