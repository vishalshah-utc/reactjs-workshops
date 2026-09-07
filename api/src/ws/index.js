/**
 * Real-time channel for Session 8.
 *
 * Two transports on purpose:
 *   - WebSocket at /ws          (the lab)
 *   - Server-Sent Events at /api/events (the fallback)
 *
 * The SSE endpoint is not padding. WebSocket upgrades through a dev-server
 * proxy inside a browser-based container are the one part of this stack that
 * can fail for environment reasons rather than code reasons, and a workshop
 * that dead-ends on infrastructure is a wasted session. Same event shapes on
 * both, so Session 8's lab swaps transport in one file.
 *
 * Event shape: { type, payload, at }
 */
import { WebSocketServer } from 'ws';

const clients = new Set();
const sseClients = new Set();
let heartbeat = null;

export const EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  STOCK_CHANGED: 'stock.changed',
  LOW_STOCK: 'stock.low',
  PRODUCT_UPDATED: 'product.updated',
  RETURN_REQUESTED: 'return.requested',
  REVIEW_CREATED: 'review.created',
};

/** Broadcast to every connected client on both transports. */
export function emit(type, payload) {
  const event = { type, payload, at: new Date().toISOString() };
  const frame = JSON.stringify(event);

  for (const socket of clients) {
    if (socket.readyState === 1) socket.send(frame);
  }
  for (const res of sseClients) {
    res.write(`event: ${type}\ndata: ${frame}\n\n`);
  }
  return event;
}

export function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    clients.add(socket);
    socket.isAlive = true;
    socket.send(JSON.stringify({
      type: 'connected',
      payload: { clients: clients.size, transport: 'websocket' },
      at: new Date().toISOString(),
    }));

    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('message', (raw) => {
      // Only ping/pong is supported — this is a broadcast channel, not an RPC.
      try {
        if (JSON.parse(raw.toString())?.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', payload: {}, at: new Date().toISOString() }));
        }
      } catch { /* ignore malformed frames */ }
    });
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });

  // Drop half-open connections so the client's reconnect-with-backoff logic
  // in Session 8 Lab 3 has something real to react to.
  heartbeat = setInterval(() => {
    for (const socket of clients) {
      if (!socket.isAlive) { socket.terminate(); clients.delete(socket); continue; }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);
  heartbeat.unref?.();

  return wss;
}

/** SSE endpoint — same events, no upgrade handshake required. */
export function sseHandler(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', payload: { transport: 'sse' }, at: new Date().toISOString() })}\n\n`);

  sseClients.add(res);
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25_000);
  req.on('close', () => { clearInterval(keepAlive); sseClients.delete(res); });
}

export const connectionCount = () => ({ websocket: clients.size, sse: sseClients.size });

export function closeAll() {
  if (heartbeat) clearInterval(heartbeat);
  for (const s of clients) s.terminate();
  clients.clear();
  for (const r of sseClients) r.end();
  sseClients.clear();
}
