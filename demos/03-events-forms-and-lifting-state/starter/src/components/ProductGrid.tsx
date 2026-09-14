import { Col, Row } from 'react-bootstrap';
import { BoxSeam } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { ProductCard } from './ProductCard';

const COLUMNS: Record<Density, { xs: number; sm: number; md: number; xl: number }> = {
  comfortable: { xs: 1, sm: 2, md: 3, xl: 4 },
  compact: { xs: 2, sm: 3, md: 4, xl: 6 },
};

interface ProductGridProps {
  products: Product[];
  density?: Density;
}

// TODO(lab-2.2): accept wishlist/onToggleSave (and later onDelete) and pass them to each card
export function ProductGrid({ products, density = 'comfortable' }: ProductGridProps) {
  // The empty state is a whole different view, so it is an early return —
  // not a ternary wrapped around the grid.
  if (products.length === 0) {
    return (
      <div className="text-center text-muted rounded-3 border py-5" style={{ borderStyle: 'dashed' }}>
        <BoxSeam size={32} className="mb-2" />
        <p className="fw-medium mb-0">No products found</p>
        <p className="small mb-0">Try a different category.</p>
      </div>
    );
  }

  return (
    <Row {...COLUMNS[density]} className="g-3">
      {products.map((product) => (
        // key goes on the OUTERMOST element the callback returns — the Col, not the card
        <Col key={product.id}>
          <ProductCard product={product} density={density} />
        </Col>
      ))}
    </Row>
  );
}
