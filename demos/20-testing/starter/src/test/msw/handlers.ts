import type { RequestHandler } from 'msw';

/**
 * The DEFAULT world every test starts in: what the API says when nobody has
 * said otherwise. A test that needs a different answer overrides ONE handler
 * with `server.use(...)` and inherits the rest.
 */

// TODO(lab-4.1): write the handlers for every DummyJSON endpoint the app can reach —
// GET /products (honouring limit/skip/select/sortBy/order, and limit=0 meaning "all"),
// /products/search?q=, /products/categories, /products/category/:slug, /products/:id,
// POST /products/add, PATCH and DELETE /products/:id, /auth/login, /auth/refresh,
// /auth/me, GET /users and POST /carts/add. Register the specific paths BEFORE /products/:id.
export const handlers: RequestHandler[] = [];
