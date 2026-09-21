import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two plugins. React for JSX and Fast Refresh; Tailwind for the ONE file that imports src/tailwind.css
// (the showcase's PriceTag.tailwind.tsx). Bootstrap needs no plugin — it is plain CSS, imported in main.tsx.
//
// TODO(lab-5.4): add `visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true,
//   brotliSize: true })` from rollup-plugin-visualizer, behind `process.env.ANALYZE` so a normal build stays
//   fast. `@types/node` is already on in tsconfig.node.json, so `process.env` type-checks.
//
// TODO(lab-6.1): the React Compiler. @vitejs/plugin-react 6 dropped Babel: its `react({ compiler: true })`
//   runs the compiler through oxc and needs the optional `oxc-transform-react` package, which this workshop's
//   pinned set does not have. So write a fifteen-line `enforce: 'pre'` plugin that runs @babel/core's
//   `transformAsync` with `babel-plugin-react-compiler` over `/src/**/*.tsx?`. Both are declared in
//   types/babel-react-compiler.d.ts. Verify the build, then delete Lab 3's memoisation.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
});
