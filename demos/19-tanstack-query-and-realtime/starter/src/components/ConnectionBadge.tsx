/**
 * Two live signals in one badge: whether the browser has a network at all, and
 * whether the price feed is connected. Offline WINS — there is no point
 * reporting a live feed to somebody whose network is gone.
 */
// TODO(lab-6.4): render `useOnlineStatus()` and `usePriceTicker()` as one
// Bootstrap <Badge role="status">. Mount the ticker hook HERE and nowhere else:
// a second caller opens a second connection.
export function ConnectionBadge() {
  return null;
}
