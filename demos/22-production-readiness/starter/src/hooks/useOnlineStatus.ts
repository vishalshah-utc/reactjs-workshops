import { useSyncExternalStore } from 'react';

/**
 * Subscribe: React hands you a callback and you call it whenever the value
 * MIGHT have changed. It returns the unsubscribe function, like an effect.
 *
 * Defined at module scope on purpose — a new function each render would make
 * React tear down and re-create the subscription on every render.
 */
function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

/** Read the current value, synchronously, during render. It must be cheap and it must not lie. */
const getSnapshot = () => navigator.onLine;

/** The SERVER's answer, used for the first render when there is no `navigator`. Assume online — the honest default. */
const getServerSnapshot = () => true;

/**
 * Is the browser online?
 *
 * The `useState` + `useEffect` version of this has a real bug: the first render
 * shows the initial state, the effect runs after paint, and anything that
 * changed in between is displayed wrong for one frame. `useSyncExternalStore`
 * exists for exactly this — it reads the external value DURING render and
 * keeps it consistent under concurrent rendering, where a render can be
 * interrupted and resumed.
 *
 * This is the same hook Zustand is built on (Demo 13). Any browser API with a
 * subscribe-and-read shape belongs here: `matchMedia`, `document.hidden`,
 * `localStorage` across tabs.
 *
 * **What it does not tell you.** `navigator.onLine` is false only when the OS
 * says there is no network at all. Captive portals, a dead API and aeroplane
 * Wi-Fi are all "online". Treat it as a hint, never as a health check.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
