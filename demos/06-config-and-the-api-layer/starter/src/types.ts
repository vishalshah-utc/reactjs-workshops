/**
 * Shaped EXACTLY like a DummyJSON product — https://dummyjson.com/products/1.
 * The bundled data (Demos 1–4) and the live API both produce this type,
 * so components written against it never needed to change when the network arrived.
 */
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail: string;
  availabilityStatus?: string;
  tags?: string[];
  /** Detail-only fields (GET /products/:id). */
  sku?: string;
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  images?: string[];
}

/** What a form produces: the editable subset of a Product. The id, rating etc. are the server's business. */
export type ProductDraft = Pick<Product, 'title' | 'price' | 'category' | 'stock' | 'description'>;

/** The envelope every DummyJSON list endpoint returns. Memorise it — you destructure it constantly. */
export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** GET /products/categories */
export interface ApiCategory {
  slug: string;
  name: string;
  url: string;
}

/** A union, not a string: `setDensity('banana')` is a compile error. */
export type Density = 'comfortable' | 'compact';

/** A category as the UI renders it. `count` was derived from the bundled products; the API gives none. */
export interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}
