import type { ApiCategory, Product, User } from '../types';

/**
 * FACTORIES, not fixtures-as-constants.
 *
 * A shared `const product = {…}` is a shared mutable object: one test that
 * pushes onto `product.tags` changes what the next test sees. A factory hands
 * every test its own object, and the `overrides` argument means a test states
 * only the field it actually cares about — `makeProduct({ stock: 0 })` reads
 * as "an out-of-stock product", which is the test's whole point.
 */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id ?? 1;
  return {
    id,
    title: `Product ${id}`,
    description: `Description for product ${id}.`,
    category: 'beauty',
    price: 100,
    discountPercentage: 0,
    rating: 4.5,
    stock: 25,
    brand: 'ShopScope',
    thumbnail: `https://cdn.example.test/${id}.png`,
    availabilityStatus: 'In Stock',
    tags: ['test'],
    ...overrides,
  };
}

/** A catalogue big enough to page through: 24 products over two pages of twelve. */
export const CATALOGUE: Product[] = Array.from({ length: 24 }, (_, index) =>
  makeProduct({
    id: index + 1,
    title: index % 2 === 0 ? `Essence Mascara ${index + 1}` : `Calvin Klein Shirt ${index + 1}`,
    category: index % 2 === 0 ? 'beauty' : 'mens-shirts',
    price: 10 + index * 5,
    stock: index === 3 ? 0 : 10 + index,
    discountPercentage: index % 3 === 0 ? 15 : 0,
  }),
);

export const CATEGORIES: ApiCategory[] = [
  { slug: 'beauty', name: 'Beauty', url: 'https://dummyjson.com/products/category/beauty' },
  { slug: 'mens-shirts', name: 'Mens Shirts', url: 'https://dummyjson.com/products/category/mens-shirts' },
];

export const ADMIN_USER: User = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
  role: 'admin',
};
