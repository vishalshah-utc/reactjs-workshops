import type { GridDensity, Product } from '@/types';
import type { AsyncStatus } from '@/hooks/useProducts';
import type { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductGridSkeleton } from '@/components/ProductGridSkeleton';

interface ProductBoardProps {
  status: AsyncStatus;
  error: ApiError | Error | null;
  products: Product[];
  density: GridDensity;
  onRetry: () => void;
  onAddToCart: (product: Product) => void;
  cartQuantities: Record<string, number>;
  isFiltered: boolean;
  isOnline: boolean;
  onResetFilters: () => void;
}

/**
 * One component that renders exactly one of the four async states.
 *
 * Keeping the switch in a single place means no call site can accidentally
 * render two of them at once, or none. Written as a chain of `&&`s spread
 * through a page component, that happens constantly.
 *
 * Note that 'error' and 'empty' are separate branches. "The request failed"
 * and "your search matched nothing" are completely different events — one is
 * our fault and needs a retry, the other is a normal successful answer and
 * needs a way to widen the search. Session 3 Lab 1 split them.
 */
export function ProductBoard({
  status, error, products, density, onRetry, onAddToCart, cartQuantities,
  isFiltered, isOnline, onResetFilters,
}: ProductBoardProps) {
  return (
    <div
      // Announce state changes without interrupting. `polite` waits for a
      // screen reader to finish its current sentence; `assertive` would cut in
      // on every keystroke of a search.
      aria-live="polite"
      aria-busy={status === 'loading'}
    >
      {status === 'loading' && (
        <>
          <span className="sr-only">Loading products</span>
          <ProductGridSkeleton density={density} />
        </>
      )}

      {status === 'error' && (
        <ErrorState error={error} onRetry={onRetry} isOnline={isOnline} />
      )}

      {status === 'empty' && (
        <EmptyState
          title={isFiltered ? 'No products match those filters' : 'No products yet'}
          description={
            isFiltered
              ? 'Try a broader search, or clear the filters to see the whole catalogue.'
              : 'The catalogue is empty. Add a product from the back-office to get started.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={onResetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {status === 'success' && (
        <ProductGrid
          products={products}
          density={density}
          onAddToCart={onAddToCart}
          cartQuantities={cartQuantities}
        />
      )}
    </div>
  );
}
