import { Button, Card } from 'react-bootstrap';
import type { Product } from '../types';
import { PriceTag } from './PriceTag';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
}

// TODO(lab-3.3): accept a `density` prop (the Density union from types.ts) and tighten the card when compact
export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  // TODO(lab-2.1): a wishlist heart with its own useState, top-right of the image

  return (
    <Card className={`h-100 ${isOutOfStock ? 'opacity-75' : ''}`}>
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 160 }}
      />
      <Card.Body className="d-flex flex-column gap-2">
        <div className="text-muted small text-uppercase">{product.brand ?? product.category}</div>
        <Card.Title className="fs-6 mb-0">{product.title}</Card.Title>
        <span className="small text-muted">★ {product.rating.toFixed(1)}</span>

        <PriceTag price={product.price} discountPercentage={product.discountPercentage} />

        <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
          <StockBadge stock={product.stock} />
          <Button size="sm" disabled={isOutOfStock} variant={isOutOfStock ? 'secondary' : 'primary'}>
            {isOutOfStock ? 'Sold out' : 'Add to cart'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
