import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom'; // v8: RouterProvider lives in react-router/dom; everything else in react-router
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { installInterceptors } from './api/interceptors';
import { router } from './router';

installInterceptors();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
