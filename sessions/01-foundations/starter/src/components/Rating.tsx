import { cn } from '@/lib/utils';

interface RatingProps {
  /** 0–5. Zero means "no reviews yet", not "rated zero". */
  value: number;
  reviewCount?: number;
  className?: string;
}

// TODO(lab-2.3): Turn this into a star rating.
//
//   1. Early-return "No reviews yet" when `value === 0`.
//   2. Render five <StarIcon /> from lucide-react using
//      `Array.from({ length: 5 }).map(...)` — there is no for-loop in JSX.
//      Fill the first `Math.round(value)` of them.
//   3. Mark the stars aria-hidden and add one <span className="sr-only">
//      carrying the real sentence. Five icons announced one by one is noise.
//
// Guide, Lab 2 step C.
export function Rating({ value, reviewCount, className }: RatingProps) {
  return (
    <span className={cn('text-muted-foreground text-xs tabular-nums', className)}>
      {value.toFixed(1)}
      {reviewCount !== undefined && ` (${reviewCount})`}
    </span>
  );
}
