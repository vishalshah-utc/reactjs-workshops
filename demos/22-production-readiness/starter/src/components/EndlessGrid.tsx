import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button, Spinner } from 'react-bootstrap';
import { useSearchParams } from 'react-router';
import { productsInfiniteQuery } from '../api/queries';
import { useIntersection } from '../hooks/useIntersection';
import { ApiError } from '../lib/ApiError';
import type { Density, Product } from '../types';
import { ErrorNotice } from './ErrorNotice';
import { ProductGrid } from './ProductGrid';
import { Text } from './Text';

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
 * `data.pages` — plus the params that produced them. That shape is why going
 * back to this view restores every page you had loaded rather than the first
 * one: the entry was never split up.
 */
export function EndlessGrid({ density = 'comfortable', wishlist = [], onToggleSave, onAddToCart, slow = false }: EndlessGridProps) {
  // The same filters as the paged view — the key differs only in its 'infinite' segment.
  const [searchParams] = useSearchParams();
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery(productsInfiniteQuery(searchParams));

  // The sentinel: an empty div after the last card. When it comes into view, load more.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sentinelVisible = useIntersection(sentinelRef, { enabled: hasNextPage });

  useEffect(() => {
    // `isFetchingNextPage` is the guard that matters: the sentinel stays visible
    // while the new page renders, and without this you fire four requests in a row.
    if (sentinelVisible && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [sentinelVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error) return <ErrorNotice error={ApiError.from(error)} />;

  // flatMap over pages — the ONE place an infinite query costs you something a plain list does not.
  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <>
      <ProductGrid products={products} density={density} wishlist={wishlist} onToggleSave={onToggleSave} onAddToCart={onAddToCart} slow={slow} />

      <div ref={sentinelRef} className="text-center py-4">
        {isPending || isFetchingNextPage ? (
          <>
            <Spinner size="sm" role="status" className="me-2" />
            <Text as="span" variant="muted">
              Loading more…
            </Text>
          </>
        ) : hasNextPage ? (
          // The button is not a fallback for the observer — it is the accessible path.
          // Keyboard and screen-reader users never "scroll something into view".
          <Button variant="outline-secondary" onClick={() => void fetchNextPage()}>
            Load more ({products.length} of {total})
          </Button>
        ) : (
          <Text as="span" variant="muted">
            All {total} products loaded.
          </Text>
        )}
      </div>
    </>
  );
}
