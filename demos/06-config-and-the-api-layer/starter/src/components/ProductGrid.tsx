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
  /** Product ids on the wishlist — the grid asks `includes`, the header asks `length`. */
  wishlist?: number[];
  onToggleSave?: (id: number) => void;
  onDelete?: (product: Product) => void;
}

export function ProductGrid({ products, density = 'comfortable', wishlist = [], onToggleSave, onDelete }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted rounded-3 border py-5" style={{ borderStyle: 'dashed' }}>
        <BoxSeam size={32} className="mb-2" />
        <p className="fw-medium mb-0">No products found</p>
        <p className="small mb-0">Try a different search or category.</p>
      </div>
    );
  }

  return (
    <Row {...COLUMNS[density]} className="g-3">
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard
            product={product}
            density={density}
            saved={wishlist.includes(product.id)}
            onToggleSave={onToggleSave}
            onDelete={onDelete}
          />
        </Col>
      ))}
    </Row>
  );
}
