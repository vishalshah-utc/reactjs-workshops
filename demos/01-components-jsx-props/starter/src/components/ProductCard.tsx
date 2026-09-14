import { Card } from 'react-bootstrap';
import type { Product } from '../types';

/**
 * A minimal card: image and title. Lab 3.1 composes PriceTag, StockBadge and
 * a button into it — no new props needed, just the `product` it already has.
 */
// TODO(lab-3.1): compose the full card body
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="h-100">
      <Card.Img
        variant="top"
        src={product.thumbnail}
        alt=""
        loading="lazy"
        className="object-fit-contain bg-body-secondary p-2"
        style={{ height: 160 }}
      />
      <Card.Body>
        <Card.Title className="fs-6">{product.title}</Card.Title>
      </Card.Body>
    </Card>
  );
}
