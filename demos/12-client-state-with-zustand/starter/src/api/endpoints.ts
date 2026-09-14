/**
 * Every URL the app can hit, in one place. Paths are relative to the instance
 * baseURL — never absolute.
 *
 * FUNCTIONS, not string constants: a path param can't be forgotten (the
 * compiler insists on it), and it is always encoded. Interpolating raw user
 * input into a URL is how a category called "home & garden" becomes a broken request.
 */
const enc = (value: string | number) => encodeURIComponent(String(value));

export const endpoints = {
  products: {
    list: () => '/products',
    search: () => '/products/search',
    byCategory: (slug: string) => `/products/category/${enc(slug)}`,
    categories: () => '/products/categories',
    detail: (id: number | string) => `/products/${enc(id)}`,
    create: () => '/products/add',
    update: (id: number | string) => `/products/${enc(id)}`,
    remove: (id: number | string) => `/products/${enc(id)}`,
  },
  auth: {
    login: () => '/auth/login',
    refresh: () => '/auth/refresh',
    me: () => '/auth/me',
  },
  users: {
    list: () => '/users',
    cartsFor: (userId: number | string) => `/carts/user/${enc(userId)}`,
  },
  // TODO(lab-4.1): carts: { create: () => '/carts/add' }
};
