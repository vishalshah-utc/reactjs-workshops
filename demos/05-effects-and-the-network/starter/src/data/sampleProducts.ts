/**
 * Three products for Demo 1.
 *
 * Shaped EXACTLY like a DummyJSON product (https://dummyjson.com/products), so
 * that when the network arrives in Demo 5 the swap is a one-line change.
 * Two stock values were edited by hand so the UI has every branch to show:
 * id 3 is out of stock, id 5 is nearly gone.
 */
import type { Product } from '../types';

export const sampleProducts: Product[] = [
  {
    "id": 1,
    "title": "Essence Mascara Lash Princess",
    "description": "The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula.",
    "category": "beauty",
    "price": 9.99,
    "discountPercentage": 10.48,
    "rating": 2.56,
    "stock": 99,
    "brand": "Essence",
    "thumbnail": "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
    "availabilityStatus": "In Stock",
    "tags": [
      "beauty",
      "mascara"
    ]
  },
  {
    "id": 3,
    "title": "Powder Canister",
    "description": "The Powder Canister is a finely milled setting powder designed to set makeup and control shine. With a lightweight and translucent formula, it provides a smooth and matte finish.",
    "category": "beauty",
    "price": 14.99,
    "discountPercentage": 9.84,
    "rating": 4.64,
    "stock": 0,
    "brand": "Velvet Touch",
    "thumbnail": "https://cdn.dummyjson.com/product-images/beauty/powder-canister/thumbnail.webp",
    "availabilityStatus": "Out of Stock",
    "tags": [
      "beauty",
      "face powder"
    ]
  },
  {
    "id": 5,
    "title": "Red Nail Polish",
    "description": "The Red Nail Polish offers a rich and glossy red hue for vibrant and polished nails. With a quick-drying formula, it provides a salon-quality finish at home.",
    "category": "beauty",
    "price": 8.99,
    "discountPercentage": 11.44,
    "rating": 4.32,
    "stock": 3,
    "brand": "Nail Couture",
    "thumbnail": "https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/thumbnail.webp",
    "availabilityStatus": "Low Stock",
    "tags": [
      "beauty",
      "nail polish"
    ]
  }
];
