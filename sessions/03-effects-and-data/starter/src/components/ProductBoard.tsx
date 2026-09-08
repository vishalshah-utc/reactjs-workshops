import type { GridDensity, Product } from '@/types';
import type { AsyncStatus } from '@/hooks/useProducts';
import type { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
  // TODO(lab-1.2): you will need three more props here — see below.
}

/**
 * One component that renders exactly one of the four async states.
 *
 * Keeping the switch in a single place means no call site can accidentally
 * render two of them at once, or none. Written as a chain of `&&`s spread
 * through a page component, that happens constantly.
 */
export function ProductBoard({
  status, error, products, density, onRetry, onAddToCart, cartQuantities,
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

      {/*
        TODO(lab-1.2): 'error' and 'empty' are collapsed into one branch here,
        and that is the real-world mistake this lab is about.
        
        "The request failed" and "your search matched nothing" are completely
        different events. One is our fault and needs a retry. The other is a
        normal, successful answer and needs a way to widen the search. Showing
        one message for both leaves the user unable to tell whether the site is
        broken or their filter is too narrow.

        Split it into two branches:

          status === 'error' → <ErrorState error={error} onRetry={onRetry}
                                           isOnline={isOnline} />
          status === 'empty' → <EmptyState ... /> with a message that depends
                               on `isFiltered`, and a Clear button calling
                               `onResetFilters` when filters are active

        Both components are already written — read them, they carry the
        reasoning (role="alert", the HTTP status, the offline case).

        You will need to add `isFiltered`, `isOnline` and `onResetFilters` to
        the props above, and pass them from App.tsx.
        Guide, Lab 1 step C.
      */}
      {(status === 'error' || status === 'empty') && (
        <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">Nothing to show</p>
          <p className="text-muted-foreground text-sm">{error?.message ?? 'No products matched.'}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>Reload</Button>
        </div>
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
