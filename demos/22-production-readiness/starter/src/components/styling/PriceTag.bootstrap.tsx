import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceSize, PriceTagProps } from '../PriceTag';

const SIZES: Record<PriceSize, string> = { sm: 'fs-6', md: 'fs-5', lg: 'fs-3' };

/**
 * Way 5 — Bootstrap utilities: the PriceTag this app has shipped since Demo 1, frozen here for comparison.
 * No file of ours to maintain; the vocabulary is the framework's; the theme is data-bs-theme.
 * (src/components/PriceTag.tsx is the live one — it grows clsx and a custom accent later today.)
 */
export function PriceTagBootstrap({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className="d-flex flex-wrap align-items-baseline gap-2">
      <span className={`fw-semibold ${SIZES[size]}`}>{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className="text-muted small">{formatPrice(price)}</s>
          <span className="text-success small fw-medium">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
