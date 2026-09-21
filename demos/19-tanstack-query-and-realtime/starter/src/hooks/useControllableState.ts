import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../config/logger';

interface UseControllableStateOptions<T> {
  /** Present → CONTROLLED: the parent owns the value and this hook only reports. `undefined` → uncontrolled. */
  value: T | undefined;
  /** The starting value when uncontrolled. Read once, on mount — like `useState`'s initial argument. */
  defaultValue: T;
  /** Called on every change in BOTH modes — that is the contract: the parent may listen without owning. */
  onChange?: (next: T) => void;
}

/**
 * One state, two owners. A component that accepts `value` OR `defaultValue` needs this exact logic, and
 * every component that writes it by hand gets one branch wrong. So it is written once.
 *
 * Controlled:   `value` is the truth; `set()` calls `onChange` and changes nothing itself — the parent re-renders us.
 * Uncontrolled: internal state is the truth; `set()` updates it AND calls `onChange` (the parent may still want to know).
 *
 * The mode is decided by whether `value` is `undefined` — the same rule the DOM's <input> uses. A component may
 * not switch mode after mount: the two sources of truth would diverge silently. In development, we say so.
 */
export function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;

  // Remember the mode we STARTED in. A ref, not state: it is a fact about the component, not something to render.
  // Read in an effect — `react-hooks/refs` forbids `.current` during render — which is where a warning belongs anyway.
  const initialMode = useRef(isControlled);
  useEffect(() => {
    if (!import.meta.env.DEV || initialMode.current === isControlled) return;
    logger.warn(
      `[useControllableState] switched from ${initialMode.current ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}. ` +
        'Decide once: pass `value` for the whole lifetime, or never.',
    );
    initialMode.current = isControlled; // warn once per switch, not once per render
  }, [isControlled]);

  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [isControlled ? value : internal, set];
}
