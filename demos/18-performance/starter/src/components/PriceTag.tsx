import clsx from 'clsx';
import { discountedPrice, formatPrice } from '../lib/format';

export type PriceSize = 'sm' | 'md' | 'lg';

const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };

export interface PriceTagProps {
  price: number;
  discountPercentage?: number;
  size?: PriceSize;
}

/**
 * THE PriceTag — Bootstrap utilities, the way the app keeps. Its four siblings in
 * components/styling/ render the same thing four other ways, for the About page's showcase.
 */
export function PriceTag({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // DERIVED, not a prop. Two sources of truth would drift apart.
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className="d-flex flex-wrap align-items-baseline gap-2">
      <span className={clsx('fw-semibold', SIZES[size])}>{formatPrice(finalPrice)}</span>

      {hasDiscount && (
        <>
          <s className="text-muted small">{formatPrice(price)}</s>
          {/* text-accent is OURS (src/index.css): one custom property that changes with data-bs-theme. */}
          <span className="text-accent small fw-medium">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
