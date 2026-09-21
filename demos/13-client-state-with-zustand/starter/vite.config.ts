import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately minimal. Bootstrap ships as plain CSS (imported in main.tsx),
// so there is no CSS plugin, no PostCSS, no tailwind.config — one plugin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
