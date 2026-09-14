import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // ← must come before ./index.css
import './index.css';
import { installInterceptors } from './api/interceptors';
import App from './App';
// TODO(lab-1.3): render <RouterProvider router={router} /> from 'react-router/dom' instead of <App />

/**
 * The entry point. Interceptors are installed here, explicitly and in order,
 * before anything can make a request. See api/interceptors/index.ts.
 */
installInterceptors();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
