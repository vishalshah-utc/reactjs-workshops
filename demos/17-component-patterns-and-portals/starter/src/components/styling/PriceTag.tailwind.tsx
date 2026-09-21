import { discountedPrice, formatPrice } from '../../lib/format';
import type { PriceSize, PriceTagProps } from '../PriceTag';
// Tailwind's stylesheet — imported HERE, not in main.tsx, so it ships only with the chunk that uses it (the lazy About page).
import '../../tailwind.css';

// Tailwind scans source files for COMPLETE class names. `tw:text-${x}` would generate nothing; a lookup table of full names works.
const TEXT_SIZE: Record<PriceSize, string> = { sm: 'tw:text-base', md: 'tw:text-xl', lg: 'tw:text-3xl' };

/**
 * Way 4 — Tailwind v4, prefixed `tw:` so it can live next to Bootstrap. Utilities like Bootstrap's, with a
 * finer scale, a design-token theme, and variants (`hover:`, `dark:`, `md:`) in the class name itself.
 */
export function PriceTagTailwind({ price, discountPercentage = 0, size = 'md' }: PriceTagProps) {
  const hasDiscount = discountPercentage >= 1;
  const finalPrice = hasDiscount ? discountedPrice(price, discountPercentage) : price;

  return (
    <div className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
      {/* tw:hover:text-blue-600 — a pseudo-class as a variant. tw:dark: follows Bootstrap's data-bs-theme (see tailwind.css). */}
      <span className={`tw:font-semibold tw:hover:text-blue-600 tw:dark:hover:text-blue-400 ${TEXT_SIZE[size]}`}>{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className="tw:text-sm tw:text-slate-500 tw:dark:text-slate-400">{formatPrice(price)}</s>
          <span className="tw:text-sm tw:font-medium tw:text-emerald-600 tw:dark:text-emerald-400">{Math.round(discountPercentage)}% off</span>
        </>
      )}
    </div>
  );
}
