/** Lab 5.3: the OS "reduce motion" preference. Both return false until then. */
// TODO(lab-5.3): prefersReducedMotion() reads window.matchMedia('(prefers-reduced-motion: reduce)').matches; useReducedMotion() holds it in state and subscribes to the 'change' event
export function prefersReducedMotion(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return false;
}
