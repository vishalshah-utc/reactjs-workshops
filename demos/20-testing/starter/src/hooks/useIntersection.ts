import { useEffect, useState, type RefObject } from 'react';

interface UseIntersectionOptions {
  /** Fire early: '200px' starts the next page while the sentinel is still one screen below the fold. */
  rootMargin?: string;
  /** Stop observing entirely — e.g. when there is no next page to load. */
  enabled?: boolean;
}

/**
 * Is this element on screen?
 *
 * The scroll-handler version of this is a `scroll` listener that runs on every
 * frame, reads `getBoundingClientRect()` (a layout flush) and needs its own
 * throttle. `IntersectionObserver` asks the browser to tell YOU, off the main
 * thread, only when the answer changes.
 *
 * The ref is a `RefObject<Element | null>` because React fills refs AFTER the
 * render that created them — the effect is the first place the node exists,
 * which is exactly where the observer is created.
 */
export function useIntersection(ref: RefObject<Element | null>, { rootMargin = '200px', enabled = true }: UseIntersectionOptions = {}): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    // Disconnecting on cleanup is the whole reason this is an effect: an observer
    // that outlives its node keeps the node alive, and that is a leak you cannot see.
    return () => observer.disconnect();
  }, [ref, rootMargin, enabled]);

  return isIntersecting;
}
