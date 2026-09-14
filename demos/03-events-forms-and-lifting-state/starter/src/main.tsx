import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // ← must come before ./index.css
import './index.css';
import App from './App';

/**
 * The entry point. Three things happen here and nowhere else:
 *
 *  1. `createRoot` attaches React to the single <div id="root"> in index.html.
 *     The `!` tells TypeScript "this element exists" — getElementById returns
 *     `HTMLElement | null`, and we know index.html has it.
 *  2. `<StrictMode>` turns on development-only checks. It DOUBLE-INVOKES your
 *     component bodies and effects to surface accidental side effects. That is
 *     why a console.log may appear twice — it is a feature, and Demo 5 covers
 *     exactly what it catches. It does not happen in production builds.
 *  3. Stylesheets are imported as modules. Vite handles CSS as part of the
 *     graph; there is no <link> tag in the HTML.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
