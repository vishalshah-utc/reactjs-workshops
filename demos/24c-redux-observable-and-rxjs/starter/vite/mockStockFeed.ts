import type { Plugin } from 'vite';
import { WebSocketServer, type WebSocket } from 'ws';
import { FEED_PATH, type FeedClientMessage, type FeedServerMessage } from '../src/lib/feedProtocol.ts';

/**
 * A MOCK. DummyJSON has no WebSocket endpoint, no push channel of any kind,
 * and never will — it is a read-mostly REST fixture. So the feed the console
 * connects to is served by the Vite dev server itself, in this file, and it
 * exists on `npm run dev` and nowhere else.
 *
 * WHAT A REAL BACKEND WOULD SEND. The protocol in `src/lib/feedProtocol.ts` is
 * deliberately the shape a real one has: a `subscribe` frame carrying the ids
 * the client is looking at, a `tick` frame carrying only what changed, and a
 * server timestamp on every message. A production version would add a monotonic
 * sequence number so a reconnecting client can ask for the gap, an auth step on
 * connect (a token in the first frame or a `Sec-WebSocket-Protocol` header —
 * browsers cannot set `Authorization` on a WebSocket), and a heartbeat so a
 * connection dropped by a proxy is noticed rather than silently dead.
 *
 * WHAT HAPPENS IN A PRODUCTION BUILD. There is no server at `/__dev/feed`, the
 * handshake fails, `WebSocketSubject` errors, and the epic's `retry` backs off
 * to a 30-second ceiling while the badge reads *"Live feed unavailable"*.
 * Everything else on the page — loading, editing, bulk, undo — is untouched,
 * because the feed is merged into the epic output rather than gating it. That
 * degradation is not an accident; it is what `merge` buys you over a single
 * sequential effect.
 *
 * MODELLED ON DEMO 19, which shipped its price feed as a `Content-Type:
 * text/event-stream` middleware in the same place. Same idea, different
 * transport: SSE is one-directional and this demo needs to talk back.
 */
export function mockStockFeed(): Plugin {
  return {
    name: 'shopscope:mock-stock-feed',
    // `serve` only. A production build never sees this plugin, and `ws` is a
    // devDependency that is never bundled.
    apply: 'serve',

    configureServer(server) {
      // `noServer: true` means "do not listen on a port of your own" — we
      // borrow Vite's HTTP server and handle the upgrade ourselves.
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on('upgrade', (request, socket, head) => {
        // Vite's own HMR connection is a WebSocket on the SAME server. Claim
        // only our path and return silently for anything else — do NOT destroy
        // the socket, or hot reload stops working and you will blame React.
        if (!request.url?.startsWith(FEED_PATH)) return;

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });

      wss.on('connection', (ws: WebSocket) => {
        /** The ids this client asked for. Empty until the first `subscribe`. */
        let subscribed: number[] = [];

        const send = (message: FeedServerMessage) => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
        };

        send({
          type: 'hello',
          at: Date.now(),
          note: 'Mock stock feed — dev server only. DummyJSON has no WebSocket.',
        });

        ws.on('message', (raw) => {
          let message: FeedClientMessage;
          try {
            message = JSON.parse(String(raw)) as FeedClientMessage;
          } catch {
            return;
          }
          if (message.type === 'subscribe') subscribed = message.ids;
          if (message.type === 'unsubscribe') {
            subscribed = subscribed.filter((id) => !message.ids.includes(id));
          }
        });

        /**
         * One to three of the subscribed products move, roughly once a second.
         * Deliberately irregular so the buffering in the epic has something to
         * coalesce, and deliberately small so the numbers stay readable.
         */
        const timer = setInterval(() => {
          if (subscribed.length === 0) return;

          const count = 1 + Math.floor(Math.random() * Math.min(3, subscribed.length));
          const picked = [...subscribed].sort(() => Math.random() - 0.5).slice(0, count);

          send({
            type: 'tick',
            at: Date.now(),
            changes: picked.map((id) => ({
              // A random walk around a plausible number. The client does not
              // care where it came from; it only cares that it changed.
              stock: Math.max(0, Math.round(5 + Math.random() * 120)),
              id,
              ...(Math.random() < 0.3 ? { price: Number((1 + Math.random() * 200).toFixed(2)) } : {}),
            })),
          });
        }, 900);

        ws.on('close', () => clearInterval(timer));
        ws.on('error', () => clearInterval(timer));
      });

      // Restarting the dev server must not leave a listening socket behind.
      server.httpServer?.on('close', () => wss.close());

      server.config.logger.info(`  ➜  mock stock feed:  ws://localhost:${server.config.server.port ?? 5173}${FEED_PATH}`);
    },
  };
}
