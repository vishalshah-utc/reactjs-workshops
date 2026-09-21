import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two plugins. React for JSX and Fast Refresh; Tailwind for the ONE file that imports src/tailwind.css
// (the showcase's PriceTag.tailwind.tsx). Bootstrap needs no plugin — it is plain CSS, imported in main.tsx.
// The Tailwind plugin looks at every CSS file and leaves the ones without Tailwind directives untouched.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
});
