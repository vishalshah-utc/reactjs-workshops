import clsx from 'clsx';
import { Button, Card } from 'react-bootstrap';
import { Heart, HeartFill, PencilSquare, Trash } from 'react-bootstrap-icons';
import { Link } from 'react-router';
import type { Density, Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

// TODO(lab-1.2): add `slow?: boolean` to these props, and call `spin()` from src/lib/slowMode.ts at the
//   very top of the component when it is true. Thread the same prop through ProductGrid to every card.
// TODO(lab-3.1): wrap the export in `memo(...)` — after you have proved with the Profiler that it helps.
// TODO(lab-6.2): and then delete that `memo` again, once the React Compiler is on.
interface ProductCardProps {
  product: Product;
  density?: Density;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  /** The card stays dumb: it reports the product, the page decides what "add" means. */
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  /** A mutation is in flight for this product: dim it and disable its actions. */
  busy?: boolean;
}

export function ProductCard({ product, density = 'comfortable', saved = false, onToggleSave, onAddToCart, onEdit, onDelete, busy = false }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const isCompact = density === 'compact';

  return (
    // clsx: falsy entries vanish — no `${cond ? 'x' : ''}` leaving a stray space, no "false" in the class list.
    // product-card / product-card__media are OUR names (src/index.css): the container query reads them.
    <Card className={clsx('product-card h-100', (isOutOfStock || busy) && 'opacity-50')} aria-busy={busy}>
      <Link to={`/products/${product.id}`} aria-hidden="true" tabIndex={-1} className="product-card__media">
        <Card.Img
          variant="top"
          src={product.thumbnail}
          alt=""
          loading="lazy"
          className="object-fit-contain bg-body-secondary p-2"
          // The ONE inline style left on this card: a value that depends on a prop. Everything else is a class.
          style={{ height: isCompact ? 110 : 160 }}
        />
      </Link>

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

      <Card.Body className={clsx('d-flex flex-column gap-2', isCompact && 'p-2')}>
        {!isCompact && <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>}
        <Card.Title className={clsx('mb-0', isCompact ? 'small text-truncate' : 'fs-6')}>
          {/* A real link: middle-click opens a tab, hover shows the URL, screen readers announce it */}
          <Link to={`/products/${product.id}`} className="text-decoration-none text-reset fw-semibold">
            {product.title}
          </Link>
        </Card.Title>
        {!isCompact && <span className="small text-muted">★ {product.rating.toFixed(1)}</span>}

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} size={isCompact ? 'sm' : 'md'} />

        {!isCompact && (
          <div className="mt-auto d-flex justify-content-between align-items-center gap-2 pt-2">
            <StockBadge stock={product.stock} />
            <div className="d-flex gap-1">
              {onEdit && (
                <Button size="sm" variant="outline-secondary" aria-label={`Edit ${product.title}`} onClick={() => onEdit(product)} disabled={busy}>
                  <PencilSquare />
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="outline-danger" aria-label={`Delete ${product.title}`} onClick={() => onDelete(product)} disabled={busy}>
                  <Trash />
                </Button>
              )}
              <Button size="sm" disabled={isOutOfStock || busy} variant={isOutOfStock ? 'secondary' : 'primary'} onClick={() => onAddToCart?.(product)}>
                {isOutOfStock ? 'Sold out' : 'Add to cart'}
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
