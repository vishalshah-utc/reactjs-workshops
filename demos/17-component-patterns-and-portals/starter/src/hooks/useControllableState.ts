interface UseControllableStateOptions<T> {
  /** Present → CONTROLLED: the parent owns the value. `undefined` → uncontrolled. */
  value: T | undefined;
  /** The starting value when uncontrolled. */
  defaultValue: T;
  /** Called on every change in BOTH modes. */
  onChange?: (next: T) => void;
}

// TODO(lab-2.1): the real thing — internal useState for the uncontrolled mode, `value` wins when present, `set` updates
// internal state only when uncontrolled and always calls onChange, and a dev-only warning (in an effect) when the mode switches
/** Placeholder: controlled-only. Every caller today passes `value`, so nothing breaks — and nothing is uncontrolled yet. */
export function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateOptions<T>): [T, (next: T) => void] {
  return [value ?? defaultValue, (next) => onChange?.(next)];
}
