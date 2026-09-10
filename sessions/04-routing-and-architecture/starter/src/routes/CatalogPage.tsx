import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { LayoutGridIcon, RowsIcon } from 'lucide-react';
import type { GridDensity, Product } from '@/types';
import { defaultFilters, isFiltered, toProductQuery, type ProductFilters } from '@/lib/filters';
import { getCategories } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { CategoryStrip } from '@/components/CategoryStrip';
import { PageHeader } from '@/components/PageHeader';
import { ProductBoard } from '@/components/ProductBoard';
import { ProductToolbar } from '@/components/ProductToolbar';
import type { OutletContext } from '@/routes/RootLayout';

/**
 * The storefront listing — everything Sessions 1–3 built, now behind a route.
 *
 * ── The one thing this session changes here ────────────────────────────────
 *
 * `filters` is currently `useState`. That is the bug Lab 3 fixes.
 *
 * Try it as it stands: filter to a category, sort by price, then reload the
 * page. Everything resets. Then try to send someone what you are looking at —
 * you cannot, because the address bar still says `/`.
 *
 * Filter state is not private component state. It describes WHAT THE USER IS
 * LOOKING AT, and that belongs in the URL, where it can be bookmarked,
 * refreshed, shared, and walked backwards with the back button. Lab 3 moves it.
 */
export function CatalogPage() {
  const { cartQuantities, addToCart, isOnline } = useOutletContext<OutletContext>();

  /*
   * TODO(lab-3.1): move `filters` from component state into the URL.
   *
   * Replace the `useState` below with React Router's `useSearchParams`, which
   * is a state hook whose storage happens to be the address bar:
   *
   *   const [searchParams, setSearchParams] = useSearchParams();
   *   const filters = parseFilters(searchParams);
   *
   *   function handleFilterChange(patch: Partial<ProductFilters>) {
   *     setSearchParams(filtersToSearchParams({ ...filters, ...patch }), {
   *       replace: true,
   *     });
   *   }
   *
   * Three things to understand about that call:
   *
   *  1. `filters` is now DERIVED from the URL, not stored. There is exactly
   *     one source of truth, so the address bar and the grid cannot disagree.
   *     This is the same "derive, do not duplicate" rule as any other state —
   *     the URL just happens to be the store.
   *
   *  2. `replace: true` matters more than it looks. Without it every keystroke
   *     in the search box pushes a new history entry, and the user has to
   *     press Back eleven times to escape "laptop". With it, typing REPLACES
   *     the current entry and Back goes to wherever they came from.
   *
   *     The judgement call: replace for continuous edits (typing, dragging a
   *     slider), push for discrete choices (picking a category, changing the
   *     sort) — because those are decisions a user may reasonably want to undo.
   *     Start with `replace: true` everywhere, then try it both ways in Lab 3
   *     and feel the difference.
   *
   *  3. `parseFilters` and `filtersToSearchParams` do not exist yet. They are
   *     TODO(lab-3.2) in src/lib/filters.ts — write those first.
   *
   * Guide, Lab 3 steps B and C.
   */
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

  function handleFilterChange(patch: Partial<ProductFilters>) {
    setFilters((previous) => ({ ...previous, ...patch }));
  }

  function handleResetFilters() {
    setFilters(defaultFilters);
  }

  // Density is genuinely a local display preference — nobody wants to share a
  // link to "the compact view". It stays in component state, and that contrast
  // is the point: not everything belongs in the URL.
  const [density, setDensity] = useState<GridDensity>('comfortable');

  /**
   * `filters.search` is what the INPUT shows and must update instantly.
   * `debouncedSearch` is what the QUERY uses. Session 3 Lab 2 built this.
   */
  const debouncedSearch = useDebounce(filters.search, 300);

  const query = toProductQuery({ ...filters, search: debouncedSearch });
  const { products, total, status, error, refetch } = useProducts(query);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([]);

  useEffect(() => {
    const controller = new AbortController();

    getCategories(controller.signal)
      .then((response) => {
        setCategories([
          { id: 'all', name: 'All', count: response.data.reduce((sum, c) => sum + c.count, 0) },
          ...response.data.map((c) => ({ id: c.id, name: c.name, count: c.count })),
        ]);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        // A failed category list is not worth blocking the page for — the grid
        // works without it. Degrade, don't collapse.
        setCategories([]);
      });

    return () => controller.abort();
  }, []);

  function handleAddToCart(product: Product) {
    addToCart({
      // Only the fields the cart needs, snapshotted now.
      id: product.id,
      slug: product.slug,
      name: product.name,
      brandName: product.brandName,
      price: product.price,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All products"
        description="Live from the ShopCrew API"
        actions={
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={density === 'comfortable' ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setDensity('comfortable')} aria-pressed={density === 'comfortable'}
            >
              <LayoutGridIcon />
              <span className="hidden sm:inline">Comfortable</span>
            </Button>
            <Button
              variant={density === 'compact' ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setDensity('compact')} aria-pressed={density === 'compact'}
            >
              <RowsIcon />
              <span className="hidden sm:inline">Compact</span>
            </Button>
          </div>
        }
      />

      <ProductToolbar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        resultCount={products.length}
        totalCount={total}
        isSearching={filters.search !== debouncedSearch}
      />

      {categories.length > 0 && (
        <CategoryStrip
          categories={categories}
          activeId={filters.categoryId}
          onSelect={(categoryId) => handleFilterChange({ categoryId })}
        />
      )}

      <ProductBoard
        status={status}
        error={error}
        products={products}
        density={density}
        onRetry={refetch}
        onAddToCart={handleAddToCart}
        cartQuantities={cartQuantities}
        isFiltered={isFiltered(filters)}
        isOnline={isOnline}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
