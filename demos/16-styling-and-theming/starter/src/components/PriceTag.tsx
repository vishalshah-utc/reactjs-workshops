import { discountedPrice, formatPrice } from '../lib/format';

export type PriceSize = 'sm' | 'md' | 'lg';

const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };

/** Exported: the five showcase variants in components/styling/ take exactly these props. */
export interface PriceTagProps {
  price: number;
  discountPercentage?: number;
  size?: PriceSize;
}

export function PriceTag({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  // DERIVED, not a prop. Two sources of truth would drift apart.
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className="d-flex flex-wrap align-items-baseline gap-2">
      {/* TODO(lab-2.1): clsx('fw-semibold', SIZES[size]) — no more template-string class names anywhere in the app */}
      <span className={`fw-semibold ${SIZES[size]}`}>{formatPrice(finalPrice)}</span>

      {hasDiscount && (
        <>
          <s className="text-muted small">{formatPrice(price)}</s>
          {/* TODO(lab-3.5): text-success → text-accent, OUR utility over a custom property that flips with data-bs-theme (src/index.css) */}
          <span className="text-success small fw-medium">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
