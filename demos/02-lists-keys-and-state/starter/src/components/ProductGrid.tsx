import { Col, Row } from 'react-bootstrap';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

/**
 * Renders ONE product, hard-coded. Twenty-four are passed in.
 * Lab 1.1 turns this into a .map(); Lab 1.2 handles the empty list.
 */
export function ProductGrid({ products }: ProductGridProps) {
  // TODO(lab-1.2): early-return an empty state when products.length === 0

  return (
    <Row xs={1} sm={2} md={3} xl={4} className="g-3">
      {/* TODO(lab-1.1): replace this single hard-coded card with products.map(...) — and give each a key */}
      <Col>
        <ProductCard product={products[0]} />
      </Col>
    </Row>
  );
}
