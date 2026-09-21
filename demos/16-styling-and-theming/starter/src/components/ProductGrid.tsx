import type { Ref } from 'react';
import { Col, Row } from 'react-bootstrap';
import { BoxSeam } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { ProductCard } from './ProductCard';

// TODO(lab-4.1): type this from Row's own props — Pick<RowProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> — and tune per density:
// comfortable { xs: 1, sm: 2, lg: 3, xl: 4, xxl: 5 }, compact { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }. (Mirror comfortable in Skeletons.tsx.)
const COLUMNS: Record<Density, { xs: number; sm: number; md: number; xl: number }> = {
  comfortable: { xs: 1, sm: 2, md: 3, xl: 4 },
  compact: { xs: 2, sm: 3, md: 4, xl: 6 },
};

interface ProductGridProps {
  /** React 19: `ref` is a prop like any other. The parent gets the grid's root node — to scroll it into view, never to edit it. */
  ref?: Ref<HTMLDivElement>;
  products: Product[];
  density?: Density;
  wishlist?: number[];
  onToggleSave?: (id: number) => void;
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  /** The product whose mutation is in flight — dimmed and disabled. */
  busyId?: string | null;
}

export function ProductGrid({ ref, products, density = 'comfortable', wishlist = [], onToggleSave, onAddToCart, onEdit, onDelete, busyId = null }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div ref={ref} className="text-center text-muted rounded-3 border py-5" style={{ borderStyle: 'dashed' }}>
        <BoxSeam size={32} className="mb-2" />
        <p className="fw-medium mb-0">No products found</p>
        <p className="small mb-0">Try a different search or category.</p>
      </div>
    );
  }

  return (
    // scrollMarginTop: scrollIntoView() stops BELOW the sticky header instead of under it.
    <Row ref={ref} {...COLUMNS[density]} className="g-3" style={{ scrollMarginTop: '4.5rem' }}>
      {/* TODO(lab-4.3): the Col gets className="product-cell" — the CONTAINER for the card's container query (a container cannot query itself) */}
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard
            product={product}
            density={density}
            saved={wishlist.includes(product.id)}
            onToggleSave={onToggleSave}
            onAddToCart={onAddToCart}
            onEdit={onEdit}
            onDelete={onDelete}
            busy={String(product.id) === busyId}
          />
        </Col>
      ))}
    </Row>
  );
}
