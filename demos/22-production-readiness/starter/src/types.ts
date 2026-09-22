/**
 * Shaped EXACTLY like a DummyJSON product — https://dummyjson.com/products/1.
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
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  minimumOrderQuantity?: number;
  /** DummyJSON ships three reviews per product — the detail page's Reviews tab. */
  reviews?: Review[];
}

/** One entry in `product.reviews`. `date` is an ISO string; format it at the edge, never store a Date. */
export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

/** What a form produces: the editable subset of a Product. The id, rating etc. are the server's business. */
export type ProductDraft = Pick<Product, 'title' | 'price' | 'category' | 'stock' | 'description'>;

/** The envelope every DummyJSON list endpoint returns. */
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

export type Density = 'comfortable' | 'compact';

export interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}

// ------------------------------------------------------------------ auth

/** DummyJSON's three roles. A union, so `user.role === 'admn'` is a compile error. */
export type Role = 'admin' | 'moderator' | 'user';

/** The FULL profile from GET /auth/me. The login response is a SUBSET of this — it has no `role`. */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** POST /auth/login — tokens plus a few profile fields. Note what's missing: `role`. */
export type LoginResponse = AuthTokens & Pick<User, 'id' | 'username' | 'email' | 'firstName' | 'lastName' | 'image'>;

/** GET /users — the directory page. */
export interface DirectoryUser extends User {
  company?: { title?: string };
}

// ------------------------------------------------------------------ client state

/** One line in the shopping cart — a SNAPSHOT of the product, so the cart survives catalogue changes. */
export interface CartLine {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  qty: number;
}

/** One item in a POST /carts/add body. */
export interface CartItemInput {
  id: number;
  quantity: number;
}

/** GET /carts/user/:id, and what POST /carts/add returns */
export interface Cart {
  id: number;
  userId: number;
  totalProducts: number;
  totalQuantity: number;
  total: number;
  discountedTotal: number;
}

/** GET /products?select=id,stock — the polled slice of a product, and nothing else. */
export interface StockLevel {
  id: number;
  stock: number;
}

/** One message from the price feed (Lab 6's mock SSE endpoint). */
export interface PriceTick {
  id: number;
  price: number;
}
