import { useEffect, useState } from 'react';

/**
 * Whether the browser currently has a network connection.
 *
 * The textbook subscribe-and-clean-up effect: add the listeners on mount,
 * remove BOTH on unmount. Forget the removal and every mount leaks a listener
 * that keeps calling setState on a component that no longer exists.
 *
 * Session 3 Lab 4 built this.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
