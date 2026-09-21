/** Lab 1.1: how many times has this component rendered? Counted in a ref, logged in an effect, never shown. */
// TODO(lab-1.1): const count = useRef(0); increment it in an effect with no deps and logger.debug(`[render] ${label} #…`) in dev — never read .current during render
export function useRenderCount(_label: string): void {}
