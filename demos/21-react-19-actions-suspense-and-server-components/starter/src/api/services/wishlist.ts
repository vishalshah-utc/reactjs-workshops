/** The free plan's limit. A SERVER rule: the client can display it, it cannot enforce it. */
export const WISHLIST_LIMIT = 5;

/**
 * SIMULATED. DummyJSON has no wishlist endpoint, so this stands in for
 * `POST /me/wishlist` — a real round trip, minus the network.
 */
// TODO(lab-1.4): wait ~900 ms (long enough to SEE the optimistic flip), then REJECT with a
// readable Error when `saved && currentCount >= WISHLIST_LIMIT`, and resolve otherwise.
// An optimistic update against a server that can never say no teaches you nothing.
export function syncWishlist(_productId: number, _saved: boolean, _currentCount: number): Promise<{ productId: number; saved: boolean }> {
  return Promise.reject(new Error('syncWishlist is not implemented yet.'));
}
