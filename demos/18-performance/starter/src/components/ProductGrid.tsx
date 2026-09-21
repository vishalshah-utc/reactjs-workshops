import type { Ref } from 'react';
import { Col, Row, type RowProps } from 'react-bootstrap';
import { BoxSeam } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { ProductCard } from './ProductCard';

/** The six Bootstrap breakpoints, typed from Row's own props — `xxl: 7` is fine, `xxxl` is a compile error. */
type GridColumns = Pick<RowProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>;

// MOBILE-FIRST: `xs` is the default, each larger key overrides from that width UP. A breakpoint you leave out
// inherits the one below — comfortable has no `md` because three columns from lg is right; two from sm to lg is too.
// Bootstrap ships row-cols-*-1 to -6 and nothing above: `xxl: 8` type-checks and renders NOTHING. Six is the ceiling.
const COLUMNS: Record<Density, GridColumns> = {
  comfortable: { xs: 1, sm: 2, lg: 3, xl: 4, xxl: 5 },
  compact: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
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
      {/* product-cell is the CONTAINER for the card's container query (src/index.css) — the cell, not the card, because a container cannot query itself. */}
      {products.map((product) => (
        <Col key={product.id} className="product-cell">
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
