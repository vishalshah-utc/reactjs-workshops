import { Button, Card } from 'react-bootstrap';
import { Heart, HeartFill, PencilSquare, Trash } from 'react-bootstrap-icons';
import type { Density, Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onSelect?: (id: number) => void;
}

// TODO(lab-3.2): the image and title become <Link to={`/products/${product.id}`}>; drop onSelect
export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onEdit, onDelete, onSelect }: ProductCardProps) {
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
        style={{ height: isCompact ? 110 : 160, cursor: onSelect ? 'pointer' : undefined }}
        onClick={() => onSelect?.(product.id)}
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
        <Card.Title className={`mb-0 ${isCompact ? 'small text-truncate' : 'fs-6'}`}>
          <button
            type="button"
            className="btn btn-link p-0 text-start text-decoration-none text-reset fw-semibold"
            onClick={() => onSelect?.(product.id)}
          >
            {product.title}
          </button>
        </Card.Title>
        {!isCompact && <span className="small text-muted">★ {product.rating.toFixed(1)}</span>}

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} size={isCompact ? 'sm' : 'md'} />

        {!isCompact && (
          <div className="mt-auto d-flex justify-content-between align-items-center gap-2 pt-2">
            <StockBadge stock={product.stock} />
            <div className="d-flex gap-1">
              {onEdit && (
                <Button size="sm" variant="outline-secondary" aria-label={`Edit ${product.title}`} onClick={() => onEdit(product)}>
                  <PencilSquare />
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="outline-danger" aria-label={`Delete ${product.title}`} onClick={() => onDelete(product)}>
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
