import { useEffect, useReducer, useState } from 'react';
import { LayoutGridIcon, RowsIcon, WifiOffIcon } from 'lucide-react';
import type { CartState, GridDensity, Product, View } from '@/types';
import { defaultFilters, toProductQuery, type ProductFilters } from '@/lib/filters';
import { calculateCart } from '@/lib/pricing';
import { cartReducer, initialCartState } from '@/lib/cart';
import { getCategories } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/CartSheet';
import { CategoryStrip } from '@/components/CategoryStrip';
import { PageHeader } from '@/components/PageHeader';
import { ProductBoard } from '@/components/ProductBoard';
import { ProductToolbar } from '@/components/ProductToolbar';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ViewSwitcher } from '@/components/ViewSwitcher';

export default function App() {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [density, setDensity] = useState<GridDensity>('comfortable');
  const [view, setView] = useState<View>('storefront');
  const [cartOpen, setCartOpen] = useState(false);
  const [promoDraft, setPromoDraft] = useState('');

  const isOnline = useOnlineStatus();

  /**
   * Two separate values, on purpose. `filters.search` is what the INPUT shows
   * and must update instantly — a search box that lags your fingers feels
   * broken. `debouncedSearch` is what the QUERY uses.
   *
   * The wiring here is correct. `useDebounce` itself is not — see
   * TODO(lab-2.2) in src/hooks/useDebounce.ts.
   */
  const debouncedSearch = useDebounce(filters.search, 300);

  const query = toProductQuery({ ...filters, search: debouncedSearch });
  const { products, total, status, error, refetch } = useProducts(query);

  /**
   * The cart, persisted.
   *
   * `useLocalStorage` gives back a normal state tuple, so it composes with
   * `useReducer` — the stored value seeds the reducer, and an effect writes
   * every change back. The reducer itself stays pure and knows nothing about
   * storage, which is what keeps it testable.
   */
  const [storedCart, setStoredCart] = useLocalStorage<CartState>('shopcrew.cart', initialCartState);
  const [cart, dispatch] = useReducer(cartReducer, storedCart);

  useEffect(() => {
    setStoredCart(cart);
  }, [cart, setStoredCart]);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([]);

  /**
   * Categories are fetched once and never again — hence the empty dependency
   * array. An effect with `[]` runs on mount and on nothing else.
   *
   * TODO(lab-2.3): there is no cleanup here. In development StrictMode mounts,
   * unmounts and remounts every component precisely to shake out this kind of
   * bug — so you will see TWO requests in the network tab, and the first can
   * resolve after the component has already gone.
   *
   * Add an AbortController, pass its signal, and return `() => controller.abort()`.
   */
  useEffect(() => {
    getCategories()
      .then((response) => {
        setCategories([
          { id: 'all', name: 'All', count: response.data.reduce((sum, c) => sum + c.count, 0) },
          ...response.data.map((c) => ({ id: c.id, name: c.name, count: c.count })),
        ]);
      })
      .catch(() => {
        // A failed category list is not worth blocking the page for — the grid
        // works without it. Degrade, don't collapse.
        setCategories([]);
      });
  }, []);

  const cartTotals = calculateCart(cart.lines, cart.promoCode);
  const cartQuantities = Object.fromEntries(cart.lines.map((line) => [line.productId, line.quantity]));

  function handleFilterChange(patch: Partial<ProductFilters>) {
    setFilters((previous) => ({ ...previous, ...patch }));
  }

  function handleAddToCart(product: Product) {
    dispatch({
      type: 'cart/add',
      // Only the fields the cart needs, snapshotted now.
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brandName: product.brandName,
        price: product.price,
        currency: product.currency,
        stockQuantity: product.stockQuantity,
      },
    });
    setCartOpen(true);
  }

  return (
    <div className="flex min-h-full flex-col">
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 px-4 py-1.5 text-sm" role="status">
          <WifiOffIcon className="size-4" />
          You are offline — showing the last thing we loaded
        </div>
      )}

      <SiteHeader cartCount={cartTotals.itemCount} onCartClick={() => setCartOpen(true)}>
        <ViewSwitcher view={view} onChange={setView} />
      </SiteHeader>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {view === 'storefront' ? (
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
              onReset={() => setFilters(defaultFilters)}
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

            {/* TODO(lab-1.2): once you split error from empty, ProductBoard
                also needs isFiltered={isFiltered(filters)} (import it from
                @/lib/filters), isOnline={isOnline}
                and onResetFilters={() => setFilters(defaultFilters)}. */}
            <ProductBoard
              status={status}
              error={error}
              products={products}
              density={density}
              onRetry={refetch}
              onAddToCart={handleAddToCart}
              cartQuantities={cartQuantities}
            />
          </div>
        ) : (
          <PageHeader
            title="Back-office"
            description="Moves to the API in Session 5, and gets locked down in Session 6."
          />
        )}
      </main>

      <SiteFooter />

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cartTotals}
        promoCode={cart.promoCode}
        dispatch={dispatch}
        promoDraft={promoDraft}
        onPromoDraftChange={setPromoDraft}
      />
    </div>
  );
}
