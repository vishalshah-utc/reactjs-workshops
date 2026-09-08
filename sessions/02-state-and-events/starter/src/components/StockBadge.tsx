import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
  stockQuantity: number;
  /** Below this, show the urgency badge rather than plain "In stock". */
  lowStockThreshold?: number;
}

/**
 * Three states from one number.
 *
 * This is `if / else if / else` written as early returns, and for three or
 * more branches that reads far better than nested ternaries inside JSX. The
 * moment you find yourself writing `a ? b : c ? d : e`, pull it out into a
 * component or a variable — Session 1 Lab 3 covers when each idiom fits.
 */
export function StockBadge({ stockQuantity, lowStockThreshold = 5 }: StockBadgeProps) {
  if (stockQuantity === 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }
  if (stockQuantity <= lowStockThreshold) {
    return <Badge variant="warning">Only {stockQuantity} left</Badge>;
  }
  return <Badge variant="secondary">In stock</Badge>;
}
