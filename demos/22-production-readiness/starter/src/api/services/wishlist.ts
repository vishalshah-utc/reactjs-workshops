import { logger } from '../../config/logger';

/** The free plan's limit. A SERVER rule: the client can display it, it cannot enforce it. */
export const WISHLIST_LIMIT = 5;

/** How long the fake round trip takes. Long enough to see the optimistic flip, short enough to demo. */
const LATENCY_MS = 900;

/**
 * SIMULATED. DummyJSON has no wishlist endpoint, so this stands in for
 * `POST /me/wishlist` — a real network call, minus the network.
 *
 * It is written the way a real one behaves in the way that matters here: it
 * takes time, and it can say no. The rule it enforces (five saved items on the
 * free plan) is a SERVER rule — the button has no way to know it is about to
 * be broken, which is exactly the situation `useOptimistic` is for. An
 * optimistic update that can never fail teaches you nothing about rollback.
 *
 * @param currentCount what the server believes is already saved. A real
 *        endpoint reads this from the session; passing it in keeps the
 *        simulation honest about where the number comes from.
 */
export async function syncWishlist(productId: number, saved: boolean, currentCount: number): Promise<{ productId: number; saved: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  if (saved && currentCount >= WISHLIST_LIMIT) {
    logger.warn('[wishlist] rejected: limit reached', { productId, currentCount });
    throw new Error(`Your wishlist holds ${WISHLIST_LIMIT} items on the free plan. Remove one first.`);
  }

  return { productId, saved };
}
