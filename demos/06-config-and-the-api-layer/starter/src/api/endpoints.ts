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
};