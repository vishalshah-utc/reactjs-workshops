import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/index.css';

/**
 * The entry point. Three things happen here and nowhere else:
 *
 *  1. `createRoot` attaches React to the single <div id="root"> in index.html.
 *  2. `<StrictMode>` turns on extra development-only checks. It DOUBLE-INVOKES
 *     your component bodies to surface accidental side effects. That is why
 *     you may see a console.log twice — it is a feature, and Session 3 covers
 *     exactly what it catches. It does not happen in production builds.
 *  3. The stylesheet is imported as a module. Vite handles CSS as part of the
 *     graph; there is no <link> tag in the HTML.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
