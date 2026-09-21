import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { transformAsync } from '@babel/core';
import reactCompiler from 'babel-plugin-react-compiler';

/**
 * The React Compiler, run over src/ before Vite's own transform.
 *
 * @vitejs/plugin-react 6 has a first-class `react({ compiler: true })` — it
 * runs the compiler through oxc and needs the optional `oxc-transform-react`
 * package, which this workshop's pinned dependency set does not include. So we
 * wire the Babel plugin ourselves, in fifteen lines, which also makes the step
 * visible: parse, compile, hand the code back to Vite.
 *
 * `enforce: 'pre'` puts us BEFORE plugin-react, so we see the original TSX and
 * hand back TSX; Vite still does the TypeScript and JSX work afterwards.
 */
function reactCompilerPlugin(): Plugin {
  const include = /\/src\/.*\.tsx?$/;

  return {
    name: 'shopscope:react-compiler',
    enforce: 'pre',
    async transform(code, id) {
      if (!include.test(id)) return null;

      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        // Babel has to be told the dialect: this project is TypeScript with JSX.
        parserOpts: { plugins: ['typescript', 'jsx'] },
        // target '19' — the compiler emits `react/compiler-runtime`, which React 19.3 ships.
        plugins: [[reactCompiler, { target: '19' }]],
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map as never };
    },
  };
}

// TODO(lab-6.3): a `mockPriceFeed(): Plugin` here, with `apply: 'serve'` so it
// exists on the dev server and in no build. `configureServer(server)` →
// `server.middlewares.use('/__dev/prices', …)`, a 200 with
// `Content-Type: text/event-stream`, a `setInterval` writing
// `data: {"id":…,"price":…}\n\n`, and `res.on('close')` to clear it. Add it to
// the plugins array below. DummyJSON has no push channel — this is a MOCK, and
// the guide says so out loud.

// React for JSX and Fast Refresh; Tailwind for the ONE file that imports src/tailwind.css
// (the showcase's PriceTag.tailwind.tsx). Bootstrap needs no plugin — it is plain CSS, imported in main.tsx.
// The compiler runs first; the visualizer only when you ask for it (npm run build:analyze).
export default defineConfig({
  plugins: [
    reactCompilerPlugin(),
    react(),
    tailwindcss(),
    // A REPORT, not a transform: it reads the finished bundle and writes dist/stats.html.
    // Behind an env flag so a normal build stays fast and dist/ stays deployable.
    process.env.ANALYZE
      ? visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true })
      : null,
  ],
  server: { port: 5173, host: true },
});
