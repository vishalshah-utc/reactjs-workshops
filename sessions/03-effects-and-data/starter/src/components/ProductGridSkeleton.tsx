import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { GridDensity } from '@/types';

/**
 * A loading placeholder shaped like the thing that is loading.
 *
 * Not a centred spinner. A skeleton the same shape as the real grid means the
 * page does not jump when data lands, and it tells the user what is coming
 * rather than just that something is happening. The measurable version of
 * this is Cumulative Layout Shift, which Session 10 puts a number on.
 */
export function ProductGridSkeleton({ count = 8, density = 'comfortable' }: { count?: number; density?: GridDensity }) {
  return (
    <ul
      // Hidden from screen readers: the live region on the real content
      // announces "loading" once, which is far better than a reader walking
      // through eight empty placeholder cards.
      aria-hidden="true"
      className={cn(
        'grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        density === 'compact' ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <Card className="overflow-hidden">
            <Skeleton className="aspect-square rounded-none" />
            <CardContent className="flex flex-col gap-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-9 w-full" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
