import { Badge } from 'react-bootstrap';

/** Always says "In stock" — even for the product with stock: 0. Lab 2.3 fixes that. */
// TODO(lab-2.3): three branches — out of stock, low stock, in stock — as early returns
export function StockBadge() {
  return (
    <Badge bg="success-subtle" text="success-emphasis">
      In stock
    </Badge>
  );
}
