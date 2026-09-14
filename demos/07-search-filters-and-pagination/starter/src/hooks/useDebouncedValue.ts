/**
 * Returns `value` unchanged — so every keystroke still fires a request.
 * Lab 1.1 makes it wait until typing pauses.
 */
// TODO(lab-1.1): generic <T>; useState + useEffect with a setTimeout that the cleanup clears
export function useDebouncedValue<T>(value: T): T {
  return value;
}
