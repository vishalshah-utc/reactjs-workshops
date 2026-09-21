import { Col, Placeholder, Row } from 'react-bootstrap';
import { listProducts } from '../api/services/products';
import { Fetch } from '../legacy/Fetch';
import type { Product } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  /** The product being viewed — its category is the query, its id is excluded from the results. */
  product: Product;
}

const LIMIT = 5; // one more than shown, so excluding the current product still leaves four

/**
 * "More in this category" under the detail page — written the 2018 way, with the request inside a RENDER PROP
 * component from src/legacy/. Read it before you rewrite it: the whole UI is one callback.
 */
export function RelatedProducts({ product }: RelatedProductsProps) {
  // TODO(lab-6.1): replace <Fetch load deps render> with `const request = useFetch(load, key)` and plain JSX below it
  return (
    <Fetch
      load={(signal) => listProducts({ category: product.category, limit: LIMIT, signal })}
      deps={[product.category, product.id]}
      render={(request) => {
        const related = request.status === 'success' ? request.data.products.filter((p) => p.id !== product.id).slice(0, 4) : [];
        if (request.status === 'success' && related.length === 0) return null;

        return (
          <section aria-labelledby="related-heading" className="mt-4">
            <h2 id="related-heading" className="h6 text-muted mb-3">
              More in {product.category}
            </h2>

            {request.status === 'error' && <ErrorNotice error={request.error} />}

            <Row xs={2} md={4} className="g-3">
              {request.status === 'success'
                ? related.map((item) => (
                    <Col key={item.id}>
                      <ProductCard product={item} density="compact" />
                    </Col>
                  ))
                : Array.from({ length: 4 }, (_, i) => (
                    <Col key={i}>
                      <Placeholder as="div" animation="glow">
                        <Placeholder xs={12} style={{ height: 150 }} className="rounded" />
                      </Placeholder>
                    </Col>
                  ))}
            </Row>
          </section>
        );
      }}
    />
  );
}
