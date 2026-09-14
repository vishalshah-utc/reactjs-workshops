import { Button, Card } from 'react-bootstrap';
import { Heart, HeartFill, Trash } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onDelete?: (product: Product) => void;
}

/**
 * Fully CONTROLLED. The card owns no state: whether it is saved, and what
 * happens on delete, are decided by whoever renders it.
 */
export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onDelete }: ProductCardProps) {
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
        onClick={() => onToggleSave?.(product.id)}
      >
        {saved ? <HeartFill className="text-danger" /> : <Heart />}
      </Button>

      <Card.Body className={`d-flex flex-column gap-2 ${isCompact ? 'p-2' : ''}`}>
        {!isCompact && <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>}
        <Card.Title className={`mb-0 ${isCompact ? 'small text-truncate' : 'fs-6'}`}>{product.title}</Card.Title>
        {!isCompact && <span className="small text-muted">★ {product.rating.toFixed(1)}</span>}

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} size={isCompact ? 'sm' : 'md'} />

        {!isCompact && (
          <div className="mt-auto d-flex justify-content-between align-items-center gap-2 pt-2">
            <StockBadge stock={product.stock} />
            <div className="d-flex gap-1">
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  aria-label={`Delete ${product.title}`}
                  onClick={() => onDelete(product)}
                >
                  <Trash />
                </Button>
              )}
              <Button size="sm" disabled={isOutOfStock} variant={isOutOfStock ? 'secondary' : 'primary'}>
                {isOutOfStock ? 'Sold out' : 'Add to cart'}
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
