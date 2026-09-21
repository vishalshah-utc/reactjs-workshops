import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately minimal. Bootstrap ships as plain CSS (imported in main.tsx),
// so there is no CSS plugin, no PostCSS, no tailwind.config — one plugin.
// TODO(lab-1.4): import tailwindcss from '@tailwindcss/vite' and add tailwindcss() after react(). (The marker the
// verifier counts for this step lives in src/tailwind.css — this file is outside src/.)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
