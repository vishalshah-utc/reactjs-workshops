import { cn, formatPrice } from '@/lib/utils';

interface PriceTagProps {
  /** Integer, in paise. 129900 = ₹1,299.00 */
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// TODO(lab-2.2): Right now this ignores `compareAtPrice` and `size`.
//
//   1. Compute the saving with `discountPercent(price, compareAtPrice ?? null)`
//      — DERIVE it, do not add a prop for it.
//   2. When there is a saving, also render the old price in an <s> and a
//      "N% off" flash. Two siblings need a Fragment: <>...</>
//   3. Make `size` pick a text class from a `{ sm, md, lg }` lookup.
//
// Guide, Lab 2 step B.
export function PriceTag({ price, currency = 'INR', className }: PriceTagProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className="font-semibold tabular-nums">{formatPrice(price, currency)}</span>
    </div>
  );
}
