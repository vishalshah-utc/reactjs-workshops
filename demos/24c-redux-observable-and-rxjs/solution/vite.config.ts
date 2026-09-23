import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockStockFeed } from './vite/mockStockFeed.ts';

/**
 * One plugin more than Demo 24b: the mock WebSocket feed, which exists on the
 * dev server and in no build (`apply: 'serve'` inside the plugin).
 *
 * The same trick Demo 19 used for its Server-Sent Events price stream — the
 * dev server you already run is the cheapest possible backend for a channel
 * the real API does not have.
 */
export default defineConfig({
  plugins: [react(), mockStockFeed()],
  server: { port: 5173, host: true },
});
