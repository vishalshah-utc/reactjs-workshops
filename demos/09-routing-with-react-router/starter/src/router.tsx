import { createBrowserRouter } from 'react-router';
import App from './App';

/**
 * One route that renders the whole app — a router in name only.
 * Lab 1.1 builds the real tree: a layout, pages, a redirect, and a 404.
 */
// TODO(lab-1.1): RootLayout with children — index redirect, products, about, and a "*" NotFoundPage
export const router = createBrowserRouter([{ path: '*', Component: App }]);
