import { listProducts } from '@/lib/dummyjson';
import { quantityOf, totalItems } from '@/lib/cart';
import { AddToCartButton } from './AddToCartButton';

/**
 * The cart lives in this process's memory, so the page cannot be cached as
 * static HTML — it has to be rendered per request. Delete the cart and this
 * line goes too, and Next will render the page once at build time.
 */
export const dynamic = 'force-dynamic';

/**
 * AN ASYNC SERVER COMPONENT.
 *
 * Read the two words in the signature. `async` — a component may await, which
 * React has never allowed on the client. `default export` — App Router routes
 * are default exports, unlike everything else in the ShopScope codebase.
 *
 * What is NOT here is the point:
 *   no useEffect, no useState, no loading flag, no error flag
 *   no axios instance, no interceptor, no ApiError
 *   no TanStack Query, no cache key, no loader, no router
 *   and NONE of this function's code in the browser's bundle
 *
 * What you give up, on the same page: this component cannot use state, an
 * effect, an event handler, a context provider or a browser API. The moment a
 * pixel of it needs one, that pixel becomes a Client Component — which is the
 * next file.
 */
export default async function ProductsPage() {
  const products = await listProducts(12);
  const count = totalItems();

  return (
    <main>
      <h1>ShopScope — products</h1>
      <p className="muted">
        Rendered on the server from DummyJSON. {count} item{count === 1 ? '' : 's'} in the cart.
      </p>

      <ul className="grid">
        {products.map((product) => (
          <li key={product.id} className="card">
            {/* A plain <img>: next/image is a Client Component with its own runtime, and this
                page is trying to ship as little JavaScript as it can. */}
            <img src={product.thumbnail} alt="" />
            <span className="title">{product.title}</span>
            <span className="muted">
              ${product.price.toFixed(2)} · {product.category}
            </span>

            {/* The boundary, in one line. Everything above this is server-only;
                this button and what it imports are the whole client bundle. */}
            <AddToCartButton productId={product.id} inCart={quantityOf(product.id)} />
          </li>
        ))}
      </ul>
    </main>
  );
}
