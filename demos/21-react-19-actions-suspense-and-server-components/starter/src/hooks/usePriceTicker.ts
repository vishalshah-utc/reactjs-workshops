import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { productKeys } from '../api/queries';
import { logger } from '../config/logger';
import type { PriceTick, Product, ProductListResponse } from '../types';

export type TickerStatus = 'off' | 'connecting' | 'live' | 'retrying';

/** Where the mock feed lives. A real deployment would put this behind the API gateway, on the API's origin. */
const FEED_URL = '/__dev/prices';

/**
 * PUSH, not poll: the server decides when there is news.
 *
 * `EventSource` is HTTP — one long-lived GET, `text/event-stream`, messages
 * separated by blank lines — so it needs no new protocol, passes proxies, and
 * reconnects by itself. What it cannot do is send anything upstream; that is
 * when you reach for a WebSocket.
 *
 * ⚠️ **This feed is a mock.** DummyJSON has no push channel, so the endpoint is
 * ~20 lines of Vite dev-server middleware in `vite.config.ts` emitting random
 * prices. A real one would send the same shape — `{ id, price }` — from
 * whatever publishes price changes, and the client code below would not change
 * by one character. In a production build the endpoint does not exist, so the
 * hook does nothing at all.
 */
export function usePriceTicker(): TickerStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TickerStatus>(import.meta.env.DEV ? 'connecting' : 'off');

  useEffect(() => {
    // A compile-time constant, so the whole body is removed from the production bundle.
    if (!import.meta.env.DEV) return;

    const source = new EventSource(FEED_URL);

    source.addEventListener('open', () => setStatus('live'));

    // EventSource reconnects on its own with a backoff; `error` fires each time it drops.
    // Do NOT close the connection here — closing is how you turn the reconnection off.
    source.addEventListener('error', () => setStatus(source.readyState === EventSource.CLOSED ? 'off' : 'retrying'));

    // The DEFAULT event name. A server may name its events (`event: price`), and then you
    // listen for that name — but TypeScript's `EventSourceEventMap` only knows 'message',
    // 'open' and 'error', so a named listener costs you a cast to get `MessageEvent` back.
    source.addEventListener('message', (event) => {
      // Anything off a socket is `unknown`. Parse, then narrow — never trust the shape.
      const tick = parseTick(event.data);
      if (!tick) return;
      applyPrice(tick);
    });

    /**
     * WRITE INTO THE CACHE, don't invalidate it.
     *
     * Invalidating on every message would turn a push feed into a request
     * storm — the exact thing push exists to avoid. The message already
     * carries the new value, so `setQueryData` puts it where the cache would
     * have put it, and every component watching that key re-renders with it.
     */
    function applyPrice(tick: PriceTick) {
      queryClient.setQueryData<Product>(productKeys.detail(tick.id), (old) => (old ? { ...old, price: tick.price } : old));

      // Every cached list page that happens to contain this product. `setQueriesData` takes the
      // same filters as `invalidateQueries`, so one prefix covers all of them.
      queryClient.setQueriesData<ProductListResponse>({ queryKey: productKeys.lists() }, (old) =>
        old ? { ...old, products: old.products.map((p) => (p.id === tick.id ? { ...p, price: tick.price } : p)) } : old,
      );

      logger.debug(`[ticker] product ${tick.id} → ${tick.price}`);
    }

    // The cleanup is the lab. Without it, StrictMode's second mount opens a
    // SECOND connection, every navigation opens another, and the server runs
    // out of sockets — the classic leak, and the browser's network panel is
    // where you see it.
    return () => source.close();
  }, [queryClient]);

  return status;
}

/** `event.data` is a string. Narrow it here, once, so the caller can trust the result. */
function parseTick(data: unknown): PriceTick | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { id, price } = parsed as Record<string, unknown>;
    return typeof id === 'number' && typeof price === 'number' ? { id, price } : null;
  } catch {
    return null;
  }
}
