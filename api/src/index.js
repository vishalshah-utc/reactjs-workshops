import { createServer } from 'node:http';
import { createApp } from './app.js';
import { reset, getDb } from './db/store.js';
import { attachWebSocket } from './ws/index.js';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';

const started = Date.now();
reset();
const db = getDb();

const server = createServer(createApp());
attachWebSocket(server);

server.listen(PORT, HOST, () => {
  const seedMs = Date.now() - started;
  console.log(`
  ShopCrew API  ·  http://localhost:${PORT}
  ─────────────────────────────────────────────────────
  ${db.products.length.toLocaleString()} products   ${db.orders.length.toLocaleString()} orders   ${db.users.length.toLocaleString()} users
  ${db.reviews.length.toLocaleString()} reviews    ${db.auditLog.length.toLocaleString()} audit rows
  ready in ${seedMs}ms  ·  node ${process.version}

  Health    GET  /api/dev/health
  Logins    GET  /api/dev/accounts     (password: "password")
  Reset     POST /api/dev/reset
  Live      ws://localhost:${PORT}/ws   ·   GET /api/events (SSE)

  Teaching hooks:  ?_delay=1500   ?_fail=422   /api/flaky
  `);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { server.close(() => process.exit(0)); });
}
