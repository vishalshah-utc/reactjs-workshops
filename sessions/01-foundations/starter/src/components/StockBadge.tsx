import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
  stockQuantity: number;
  lowStockThreshold?: number;
}

// TODO(lab-2.4): Three states, not one.
//   stockQuantity === 0            -> <Badge variant="destructive">Out of stock</Badge>
//   <= lowStockThreshold (5)       -> <Badge variant="warning">Only N left</Badge>
//   otherwise                      -> <Badge variant="secondary">In stock</Badge>
//
// Write it as three early returns, not nested ternaries. Guide, Lab 2 step D.
export function StockBadge({ stockQuantity }: StockBadgeProps) {
  return <Badge variant="secondary">In stock ({stockQuantity})</Badge>;
}
