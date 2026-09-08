import { useState } from 'react';
import { LayoutGridIcon, RowsIcon } from 'lucide-react';
import type { CartLine, GridDensity, Product, ProductDraft, View } from '@/types';
import { products as seedProducts } from '@/data/products';
import { buildCategories, defaultFilters, selectVisibleProducts, type ProductFilters } from '@/lib/filters';
import { calculateCart } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { BackOfficeProducts } from '@/components/BackOfficeProducts';
import { CartSheet } from '@/components/CartSheet';
import { CategoryStrip } from '@/components/CategoryStrip';
import { PageHeader } from '@/components/PageHeader';
import { ProductFormDialog } from '@/components/ProductFormDialog';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductToolbar } from '@/components/ProductToolbar';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ViewSwitcher } from '@/components/ViewSwitcher';

export default function App() {
  /**
   * The catalogue is STATE now, not an import.
   *
   * It has to be: React re-renders when state changes, and mutating an
   * imported array changes nothing React can see. The back-office is about to
   * add, edit and delete — none of which would appear on screen otherwise.
   */
  const [products, setProducts] = useState<Product[]>(seedProducts);

  const [density, setDensity] = useState<GridDensity>('comfortable');
  const [view, setView] = useState<View>('storefront');
  const [cartOpen, setCartOpen] = useState(false);
  const [promoDraft, setPromoDraft] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  /**
   * TODO(lab-1.2): The cart, as a plain useState to begin with.
   *
   * Lab 4 replaces this with `useReducer` once the number of operations makes
   * that the simpler option — but do it the obvious way first, so you can feel
   * why the change is worth making.
   */
  const [cartLines, setCartLines] = useState<CartLine[]>([]);

  /**
   * TODO(lab-2.3): Lift the filters up to here.
   *
   *   const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
   *
   * They live in App rather than in the toolbar because TWO components need
   * them: the toolbar renders the controls, and the grid renders the result.
   * The nearest common parent is the only place both can reach.
   */
  const filters: ProductFilters = defaultFilters;

  /**
   * DERIVED values — computed every render, never stored.
   *
   * Notice there is no `useState` for any of these. Each is a pure function of
   * state that already exists. Storing one gives you two copies of the same
   * truth, and the second goes stale the first time you forget to update it.
   */
  const categories = buildCategories(products);
  const visibleProducts = selectVisibleProducts(products, filters);
  const cartTotals = calculateCart(cartLines, products, null);
  const cartQuantities = Object.fromEntries(cartLines.map((line) => [line.productId, line.quantity]));

  /**
   * TODO(lab-1.2): Add to cart, WITHOUT mutating.
   *
   * The instinct is `cartLines.push(...)`. It will not work, and the way it
   * fails is the whole point of Lab 1: React compares the old value to the new
   * one with Object.is. Push it and both names point at the same array, so
   * nothing looks different and no render happens.
   *
   * Build a NEW array instead. Also handle the product already being in the
   * cart — bump its quantity rather than adding a second line.
   */
  function handleAddToCart(product: Product) {
    setCartLines([...cartLines, { productId: product.id, quantity: 1 }]);
    setCartOpen(true);
  }

  // TODO(lab-2.3): merge a partial patch into the filters, using the
  // functional updater: setFilters((previous) => ({ ...previous, ...patch }))
  function handleFilterChange(patch: Partial<ProductFilters>) {
    console.warn('filters not wired yet', patch);
  }

  /**
   * TODO(lab-3.3): Create or update a product from the form draft.
   *
   *   editing === null  → build a new Product and put it at the FRONT of the list
   *   editing !== null  → map over products and replace that one
   *
   * `draft.price` is a string in rupees; Product.price is an integer in paise.
   * Convert with Math.round(Number(draft.price) * 100).
   */
  function handleSubmitProduct(draft: ProductDraft) {
    console.warn('product form not wired yet', draft);
    setEditing(null);
  }

  /**
   * Delete removes it from the catalogue — and that part is done.
   *
   * TODO(lab-3.3): but add something to the cart, then delete it from the
   * back-office, and look at the cart badge. Fix what you find.
   *
   * Two lists that have to be kept in step by hand is exactly the problem
   * Session 5 solves by making the server the single source of truth.
   */
  function handleDeleteProduct(productId: string) {
    setProducts((previous) => previous.filter((product) => product.id !== productId));
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader cartCount={cartTotals.itemCount} onCartClick={() => setCartOpen(true)}>
        <ViewSwitcher view={view} onChange={setView} />
      </SiteHeader>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {view === 'storefront' ? (
          <div className="space-y-6">
            <PageHeader
              title="All products"
              description="Everything in the catalogue"
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
              onReset={() => handleFilterChange(defaultFilters)}
              resultCount={visibleProducts.length}
              totalCount={products.length}
            />

            <CategoryStrip
              categories={categories}
              activeId={filters.categoryId}
              onSelect={(categoryId) => handleFilterChange({ categoryId })}
            />

            <ProductGrid
              products={visibleProducts}
              density={density}
              cartQuantities={cartQuantities}
              onAddToCart={handleAddToCart}
            />
          </div>
        ) : (
          <BackOfficeProducts
            products={products}
            onAdd={() => { setEditing(null); setFormOpen(true); }}
            onEdit={(product) => { setEditing(product); setFormOpen(true); }}
            onDelete={handleDeleteProduct}
          />
        )}
      </main>

      <SiteFooter />

      {/*
        TODO(lab-4.2): Once the reducer exists, swap `cartLines`/`setCartLines`
        for `useReducer(cartReducer, initialCartState)` and pass `dispatch`
        down instead of the ad-hoc handlers.
      */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cartTotals}
        promoCode={null}
        dispatch={() => console.warn('cart reducer not wired yet')}
        promoDraft={promoDraft}
        onPromoDraftChange={setPromoDraft}
      />

      {/* Mounted only while open, so each open is a fresh mount and the form's
          useState initialiser runs again with the right product. */}
      {formOpen && (
        <ProductFormDialog
          open
          onOpenChange={setFormOpen}
          product={editing}
          categories={categories.filter((c) => c.id !== 'all')}
          onSubmit={handleSubmitProduct}
        />
      )}
    </div>
  );
}
