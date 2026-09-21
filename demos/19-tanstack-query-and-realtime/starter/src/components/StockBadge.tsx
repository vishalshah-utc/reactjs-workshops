import { badge, type BadgeVariants } from '../lib/variants';

/** The states a stock level can be in — names first; which classes a name wears is variants.ts's business. */
type StockTone = 'ok' | 'low' | 'out';

const LABELS: Record<StockTone, (stock: number) => string> = {
  out: () => 'Out of stock',
  low: (stock) => `Only ${stock} left`,
  ok: () => 'In stock',
};

/** Pick the VARIANT axes this component exposes; `tone` stays derived from `stock`, never a prop. */
interface StockBadgeProps extends Pick<BadgeVariants, 'size' | 'pill'> {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}

function toneFor(stock: number, threshold: number): StockTone {
  if (stock === 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'ok';
}

/** Three returns became one: data → name → classes → element. Add a fourth state and you add a row, not a branch. */
export function StockBadge({ stock, lowStockThreshold = 5, size, pill, className }: StockBadgeProps) {
  const tone = toneFor(stock, lowStockThreshold);
  return <span className={badge({ tone, size, pill, className })}>{LABELS[tone](stock)}</span>;
}
