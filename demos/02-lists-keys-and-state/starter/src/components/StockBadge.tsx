import { Badge } from 'react-bootstrap';

interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
}

export function StockBadge({ stock, lowStockThreshold = 5 }: StockBadgeProps) {
  if (stock === 0) return <Badge bg="danger">Out of stock</Badge>;
  if (stock <= lowStockThreshold) {
    return (
      <Badge bg="warning" text="dark">
        Only {stock} left
      </Badge>
    );
  }
  return (
    <Badge bg="success-subtle" text="success-emphasis">
      In stock
    </Badge>
  );
}
