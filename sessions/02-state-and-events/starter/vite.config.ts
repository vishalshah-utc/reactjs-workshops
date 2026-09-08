import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Tailwind v4 is a Vite plugin now. There is no tailwind.config.js and no
  // postcss.config.js — the design tokens live in src/index.css under @theme.
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/components/...` instead of `../../../components/...`. Session 4
    // leans on this hard when the folder structure grows.
    //
    // Vite resolves a leading `/` against the project root, so this needs no
    // `node:path` import and no `@types/node`. The same alias is declared in
    // tsconfig.app.json under `paths` — Vite resolves it at build time and
    // TypeScript resolves it in your editor, and BOTH have to know about it.
    alias: { '@': '/src' },
  },
  server: { port: 5173, host: true },
});
