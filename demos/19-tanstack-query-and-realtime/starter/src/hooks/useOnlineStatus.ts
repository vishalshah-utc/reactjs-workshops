/**
 * Is the browser online?
 *
 * The `useState` + `useEffect` version has a real bug: the first render shows
 * the initial state, the effect runs after paint, and anything that changed in
 * between is displayed wrong for one frame. `useSyncExternalStore` exists for
 * exactly this — it reads the external value DURING render.
 */
// TODO(lab-6.4): implement with `useSyncExternalStore(subscribe, getSnapshot,
// getServerSnapshot)`. `subscribe` adds 'online'/'offline' listeners and returns
// the remover; `getSnapshot` is `() => navigator.onLine`. Both at MODULE scope —
// a new function per render re-subscribes on every render.
export function useOnlineStatus(): boolean {
  return true;
}
