import { Skeleton } from '@/components/ui/skeleton';

/**
 * What fills the Outlet while a lazily-loaded route's chunk is downloading.
 *
 * Two rules for a route-level fallback, and both are about not making a fast
 * app feel slow:
 *
 *  1. **Match the shape of what is coming.** A spinner in the middle of an
 *     empty page causes a layout jump when the real content lands. A skeleton
 *     with roughly the right blocks does not.
 *
 *  2. **Keep it calm.** This is usually on screen for 100–300ms on a warm
 *     connection. Anything animated or attention-grabbing reads as an error.
 */
export function RouteFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
