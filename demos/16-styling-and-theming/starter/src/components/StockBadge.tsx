import { Badge } from 'react-bootstrap';

// TODO(lab-2.1): three returns → one. Derive a tone ('out' | 'low' | 'ok') from `stock`, look its classes up in a
// Record, and build the className with clsx — plus `pill` and `className` props that merge in. A plain <span className="badge …">.
// TODO(lab-2.3): the Record becomes badge({ tone, size, pill, className }) from src/lib/variants.ts; props extend
// Pick<BadgeVariants, 'size' | 'pill'>.

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
