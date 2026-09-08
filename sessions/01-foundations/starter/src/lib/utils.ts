import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` — the single most-used helper in a shadcn/ui codebase.
 *
 * It does two jobs:
 *  1. `clsx` turns conditionals into a class string:
 *     cn('p-2', isActive && 'bg-primary')  ->  "p-2 bg-primary"
 *  2. `twMerge` resolves Tailwind CONFLICTS, last one winning:
 *     cn('p-2', 'p-4')  ->  "p-4"     (plain string concat would give both,
 *                                      and CSS order, not call order, decides)
 *
 * That second job is why every component takes a `className` prop and passes
 * it through `cn` — it lets a caller override styling without `!important`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format paise as Indian rupees.
 *
 * Money arrives as an integer in MINOR units (paise). 129900 is ₹1,299.00.
 * `Intl.NumberFormat` with the `en-IN` locale also gives correct Indian digit
 * grouping — ₹1,52,999 with a lakh separator, not ₹152,999.
 */
export function formatPrice(paise: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** Percentage saved, rounded. Returns null when there is no discount. */
export function discountPercent(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
