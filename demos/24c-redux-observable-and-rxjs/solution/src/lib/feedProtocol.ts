/**
 * The wire protocol of the mock stock feed.
 *
 * Imported by BOTH sides: the browser epic in `src/store/epics/feed.ts` and the
 * Vite dev-server plugin in `vite/mockStockFeed.ts`. One file, one contract, and
 * a change to a message shape is a compile error on both ends instead of a
 * silent mismatch at runtime.
 *
 * DummyJSON has no WebSocket endpoint. Everything here is a MOCK that exists
 * only on the dev server — see the plugin, and Lab 5 of the guide.
 */

/** The dev-only endpoint the plugin upgrades. Anything else goes to Vite's HMR socket. */
export const FEED_PATH = '/__dev/feed';

/** One product's numbers changing. `price` is optional: most ticks are stock-only. */
export interface StockTick {
  id: number;
  stock: number;
  price?: number;
}

/** Browser → server. */
export type FeedClientMessage =
  | { type: 'subscribe'; ids: number[] }
  | { type: 'unsubscribe'; ids: number[] };

/** Server → browser. */
export type FeedServerMessage =
  | { type: 'hello'; at: number; note: string }
  | { type: 'tick'; at: number; changes: StockTick[] };

/**
 * A type guard, because a socket hands you `unknown` and nothing more.
 *
 * The server is on your own machine today. In production the other end of a
 * socket is a system you do not control, on a version you did not deploy, and
 * a malformed frame must be dropped rather than crash the stream. Validate at
 * the boundary — this is the same rule `loadRecent` follows for localStorage.
 */
export function isFeedServerMessage(value: unknown): value is FeedServerMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as { type?: unknown; changes?: unknown };
  if (message.type === 'hello') return true;
  if (message.type !== 'tick') return false;
  return (
    Array.isArray(message.changes) &&
    message.changes.every(
      (change: unknown) =>
        typeof change === 'object' &&
        change !== null &&
        typeof (change as StockTick).id === 'number' &&
        typeof (change as StockTick).stock === 'number',
    )
  );
}
