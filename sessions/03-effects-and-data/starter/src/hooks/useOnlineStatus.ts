import { useState } from 'react';

/**
 * TODO(lab-4.2): report whether the browser has a network connection.
 *
 * The textbook subscribe-and-clean-up effect: add listeners for the window
 * 'online' and 'offline' events, and remove BOTH in the cleanup. Forget the
 * removal and every mount leaks a listener that keeps calling setState on a
 * component that no longer exists.
 *
 * Right now it reads `navigator.onLine` once and never updates. Turn your wifi
 * off and nothing happens. Guide, Lab 4 step B.
 */
export function useOnlineStatus() {
  const [isOnline] = useState(() => navigator.onLine);
  return isOnline;
}
