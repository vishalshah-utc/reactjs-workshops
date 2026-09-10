import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    port: 5173,
    host: true,
    /**
     * Send /api and /ws to the ShopCrew API on :4000.
     *
     * This is why the app can `fetch('/api/products')` with no host and no
     * CORS: to the browser it is all one origin, and Vite forwards it behind
     * the scenes. In production the same job is done by nginx or your CDN —
     * Session 10 sets that up.
     */
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:4000', ws: true },
    },
  },
});
