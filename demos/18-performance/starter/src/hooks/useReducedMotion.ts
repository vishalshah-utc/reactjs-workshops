import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** For event handlers: read the OS preference right now. `scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })`. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/**
 * For render: the preference as STATE, so flipping the OS setting re-renders
 * the animated bits. The listener is an external subscription — the one thing
 * an effect is for — and setState runs in its callback, never in the effect body.
 * (Demo 19 shows `useSyncExternalStore`, the purpose-built hook for this shape.)
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
