/**
 * Shaped EXACTLY like a DummyJSON product — https://dummyjson.com/products/1.
 * The bundled data and, from Demo 5, the live API both produce this type,
 * so components written against it never need to change when the network arrives.
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
  /** Nine of the sample products have no brand — hence optional. */
  brand?: string;
  thumbnail: string;
  availabilityStatus?: string;
  tags?: string[];
}
