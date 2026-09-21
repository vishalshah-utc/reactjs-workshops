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

/**
 * A MOCK price feed, on the dev server only.
 *
 * DummyJSON has no push channel, and Demo 19 Lab 6 needs one. `apply: 'serve'`
 * means this plugin does not exist in a build: `npm run preview` and every
 * deploy return 404 for /__dev/prices, the client's EventSource reports an
 * error, and the app carries on with polling — which is exactly how it should
 * degrade.
 *
 * The wire format is the spec, not ours: `data: <json>\n\n`. A real feed would
 * send the same `{ id, price }` from whatever publishes price changes.
 */
function mockPriceFeed(): Plugin {
  return {
    name: 'shopscope:mock-price-feed',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/prices', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        const timer = setInterval(() => {
          const id = 1 + Math.floor(Math.random() * 12); // the ids on page one of the catalogue
          const price = Math.round((5 + Math.random() * 200) * 100) / 100;
          res.write(`data: ${JSON.stringify({ id, price })}\n\n`);
        }, 3000);
        // The browser closing the tab, or React's cleanup calling source.close(), lands here.
        res.on('close', () => clearInterval(timer));
      });
    },
  };
}

// React for JSX and Fast Refresh; Tailwind for the ONE file that imports src/tailwind.css
// (the showcase's PriceTag.tailwind.tsx). Bootstrap needs no plugin — it is plain CSS, imported in main.tsx.
// The compiler runs first; the visualizer only when you ask for it (npm run build:analyze).
export default defineConfig({
  plugins: [
    reactCompilerPlugin(),
    react(),
    mockPriceFeed(),
    tailwindcss(),
    // A REPORT, not a transform: it reads the finished bundle and writes dist/stats.html.
    // Behind an env flag so a normal build stays fast and dist/ stays deployable.
    process.env.ANALYZE
      ? visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true })
      : null,
  ],
  server: { port: 5173, host: true },
});
