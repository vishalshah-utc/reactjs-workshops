import { cn } from '@/lib/utils';

/**
 * A loading placeholder. Unused in Session 1 — there is nothing to load yet —
 * but Session 3 reaches for it the moment real fetching arrives, and a
 * skeleton shaped like the real content beats a centred spinner every time.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />;
}
