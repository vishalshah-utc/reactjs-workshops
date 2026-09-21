import { Col, Placeholder, Row } from 'react-bootstrap';
import { listProducts } from '../api/services/products';
import { useFetch } from '../hooks/useFetch';
import type { Product } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { ProductCard } from './ProductCard';
import { Text } from './Text';

interface RelatedProductsProps {
  /** The product being viewed — its category is the query, its id is excluded from the results. */
  product: Product;
}

const LIMIT = 5; // one more than shown, so excluding the current product still leaves four

/**
 * "More in this category" under the detail page. Until Lab 6 the request lived in `<Fetch load render>` from
 * src/legacy/ and this component was one long render-prop callback. Now the request is a hook and the JSX is JSX.
 */
export function RelatedProducts({ product }: RelatedProductsProps) {
  const request = useFetch((signal) => listProducts({ category: product.category, limit: LIMIT, signal }), `related:${product.category}:${product.id}`);

  const related = request.status === 'success' ? request.data.products.filter((p) => p.id !== product.id).slice(0, 4) : [];
  if (request.status === 'success' && related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-4">
      <Text as="h2" id="related-heading" variant="subtitle" className="mb-3">
        More in {product.category}
      </Text>

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
}
