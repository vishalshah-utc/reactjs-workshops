import type { Density, Product } from '../types';

interface EndlessGridProps {
  density?: Density;
  wishlist?: number[];
  onToggleSave?: (id: number) => void;
  onAddToCart?: (product: Product) => void;
  slow?: boolean;
}

/**
 * The same catalogue as the paged grid, loaded forwards.
 *
 * `useInfiniteQuery` stores ONE cache entry holding an ARRAY of pages —
 * `data.pages` — plus the params that produced them. That shape is why coming
 * back to this view restores every page you had loaded rather than the first.
 */
// TODO(lab-5.3): `useInfiniteQuery(productsInfiniteQuery(searchParams))`, a
// sentinel <div ref> after the cards watched by `useIntersection`, an effect
// that calls `fetchNextPage()` when it appears (guarded by `hasNextPage &&
// !isFetchingNextPage`), and a real "Load more" button for keyboard users.
export function EndlessGrid(_props: EndlessGridProps) {
  return null;
}
