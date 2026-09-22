/** The five fields this page renders. `select=` keeps the payload to those. */
export interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
  category: string;
  thumbnail: string;
}

const FIELDS = 'id,title,price,stock,category,thumbnail';

/**
 * Called from a SERVER Component, so this `fetch` runs on the server.
 *
 * Three consequences worth saying out loud:
 *  1. No CORS. The browser is not making this request.
 *  2. No API key in the bundle. If DummyJSON needed one it would live in
 *     `process.env` and never reach the client — the Vite app cannot do this,
 *     because everything in a `VITE_` variable ships.
 *  3. No loading state. The component awaits; the HTML arrives with the data
 *     already in it.
 *
 * `next: { revalidate: 300 }` is Next's data cache: the first request in any
 * five-minute window hits DummyJSON, the rest are served from the cache. It is
 * the framework's vocabulary, not React's — 📖 study-notes 19 §9.
 */
export async function listProducts(limit = 12): Promise<Product[]> {
  const response = await fetch(`https://dummyjson.com/products?limit=${limit}&select=${FIELDS}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`DummyJSON answered ${response.status}`);

  const body = (await response.json()) as { products: Product[] };
  return body.products;
}
