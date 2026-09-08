import { cn } from '@/lib/utils';
import { discountPercent, formatPrice } from '@/lib/utils';

interface PriceTagProps {
  /** Integer, in paise. */
  price: number;
  /** The "was" price, or null when not on sale. */
  compareAtPrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Displays a price, and the struck-through original plus a saving when the
 * product is discounted.
 *
 * Two things worth noticing:
 *
 *  - It renders MARKUP, not just text. `<s>` is not decoration — it tells a
 *    screen reader the old price no longer applies. A `line-through` class
 *    alone would look identical and mean nothing.
 *  - The discount is DERIVED, never passed in. Anything you can compute from
 *    the props you already have should be computed, not accepted as another
 *    prop that can drift out of sync. Session 2 makes this a rule.
 */
export function PriceTag({ price, compareAtPrice, currency = 'INR', size = 'md', className }: PriceTagProps) {
  const saving = discountPercent(price, compareAtPrice ?? null);

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  } as const;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold tabular-nums', sizes[size])}>
        {formatPrice(price, currency)}
      </span>

      {saving !== null && (
        <>
          <s className="text-muted-foreground text-xs tabular-nums">
            {formatPrice(compareAtPrice!, currency)}
          </s>
          <span className="text-success text-xs font-medium">{saving}% off</span>
        </>
      )}
    </div>
  );
}
