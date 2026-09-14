import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  density?: Density;
}

// TODO(lab-2.2): make the heart CONTROLLED — take `saved` and `onToggleSave(id)` props, delete the useState
// TODO(lab-4.1): take an `onDelete(product)` prop and render a trash button in the footer
export function ProductCard({ product, density = 'comfortable' }: ProductCardProps) {
  // Each rendered card gets its OWN `saved`. useState is per component instance.
  const [saved, setSaved] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isCompact = density === 'compact';

  return (
    <Card className={`h-100 ${isOutOfStock ? 'opacity-75' : ''}`}>
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: isCompact ? 110 : 160 }}
      />

      <Button
        variant="light"
        size="sm"
        className="position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
        onClick={() => setSaved((wasSaved) => !wasSaved)}
      >
        {saved ? <HeartFill className="text-danger" /> : <Heart />}
      </Button>

      <Card.Body className={`d-flex flex-column gap-2 ${isCompact ? 'p-2' : ''}`}>
        {!isCompact && <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>}
        <Card.Title className={`mb-0 ${isCompact ? 'small text-truncate' : 'fs-6'}`}>{product.title}</Card.Title>
        {!isCompact && <span className="small text-muted">★ {product.rating.toFixed(1)}</span>}

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} size={isCompact ? 'sm' : 'md'} />

        {!isCompact && (
          <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
            <StockBadge stock={product.stock} />
            <Button size="sm" disabled={isOutOfStock} variant={isOutOfStock ? 'secondary' : 'primary'}>
              {isOutOfStock ? 'Sold out' : 'Add to cart'}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
