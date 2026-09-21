import { useQuery } from '@tanstack/react-query';
import { Col, Placeholder, Row } from 'react-bootstrap';
import { relatedQuery } from '../api/queries';
import { ApiError } from '../lib/ApiError';
import type { Product } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { ProductCard } from './ProductCard';
import { Text } from './Text';

interface RelatedProductsProps {
  /** The product being viewed — its category is the query, its id is excluded from the results. */
  product: Product;
}

/**
 * "More in this category" under the detail page. It has had three homes: a
 * `<Fetch load render>` render prop (Demo 17), `useFetch` (Demo 17 Lab 6), and
 * now a CACHE.
 *
 * Nothing about the JSX changed. What changed is that leaving this page and
 * coming back within five minutes issues no request at all, and that two
 * components asking for the same category at the same time issue ONE.
 */
export function RelatedProducts({ product }: RelatedProductsProps) {
  // `data` is already the four cards: relatedQuery's `select` filtered the
  // current product out and sliced. The cache still holds all five — `select`
  // shapes what THIS component sees, never what is stored.
  const { data: related, isPending, error } = useQuery(relatedQuery(product));

  if (related && related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-4">
      <Text as="h2" id="related-heading" variant="subtitle" className="mb-3">
        More in {product.category}
      </Text>

      {/* `error` is `unknown` at this boundary, exactly as a catch block is — ApiError.from narrows it. */}
      {error && <ErrorNotice error={ApiError.from(error)} />}

      <Row xs={2} md={4} className="g-3">
        {related && !isPending
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
