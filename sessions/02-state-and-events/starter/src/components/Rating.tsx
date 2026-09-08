import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  /** 0–5. Zero means "no reviews yet", not "rated zero". */
  value: number;
  reviewCount?: number;
  className?: string;
}

/**
 * Star rating.
 *
 * `Array.from({ length: 5 })` is the idiomatic way to render a fixed number of
 * things in JSX — there is no `for` loop inside JSX, because JSX takes
 * EXPRESSIONS and a for loop is a statement. `.map()` returns an array, and
 * React renders arrays.
 *
 * The stars are `aria-hidden` and the real information is in one piece of
 * text. Five separate star icons announced individually is noise; "Rated 4.1
 * out of 5 from 48 reviews" is the actual content.
 */
export function Rating({ value, reviewCount, className }: RatingProps) {
  if (value === 0) {
    return <span className={cn('text-muted-foreground text-xs', className)}>No reviews yet</span>;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={cn(
              'size-3.5',
              index < Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/40',
            )}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">
        {value.toFixed(1)}
        {reviewCount !== undefined && ` (${reviewCount})`}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{reviewCount !== undefined && ` from ${reviewCount} reviews`}
      </span>
    </div>
  );
}
