import { useState } from 'react';
import { Alert, Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductForm } from './components/ProductForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { products as initialProducts } from './data/products';
import { applySort, buildCategories, filterProducts, PLACEHOLDER_THUMBNAIL } from './lib/catalog';
import type { SortKey } from './lib/catalog';
import type { Density, Product, ProductDraft } from './types';

export default function App() {
  // The catalogue is STATE now — the form adds to it and the trash button removes from it.
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // What the user is looking at
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [density, setDensity] = useState<Density>('comfortable');

  // Lifted from ProductCard: ONE list of ids, so filtering a card away can't lose it
  const [wishlist, setWishlist] = useState<number[]>([]);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // DERIVED on every render — none of these are stored
  const categories = buildCategories(products);
  const visibleProducts = applySort(filterProducts(products, { query, category: activeCategory }), sort);

  function toggleWishlist(id: number) {
    // Immutable update: filter() and spread both return NEW arrays
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function handleCreate(payload: ProductDraft) {
    const created: Product = {
      ...payload,
      id: Date.now(), // good enough until the server hands out ids in Demo 8
      rating: 0,
      discountPercentage: 0,
      thumbnail: PLACEHOLDER_THUMBNAIL,
      tags: [],
    };
    setProducts((current) => [created, ...current]); // prepend a NEW array
    setShowForm(false);
    setFlash(`“${created.title}” added.`);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setProducts((current) => current.filter((p) => p.id !== product.id));
    setWishlist((current) => current.filter((id) => id !== product.id));
    setPendingDelete(null);
    setFlash(`“${product.title}” deleted.`);
  }

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      <Container className="py-4">
        <PageHeader
          title="All products"
          description={`${visibleProducts.length} of ${products.length} products`}
          actions={
            <>
              <ButtonGroup size="sm" aria-label="Grid density">
                <Button
                  variant={density === 'comfortable' ? 'secondary' : 'outline-secondary'}
                  aria-pressed={density === 'comfortable'}
                  onClick={() => setDensity('comfortable')}
                >
                  <Grid className="me-1" />
                  Comfortable
                </Button>
                <Button
                  variant={density === 'compact' ? 'secondary' : 'outline-secondary'}
                  aria-pressed={density === 'compact'}
                  onClick={() => setDensity('compact')}
                >
                  <Grid3x3Gap className="me-1" />
                  Compact
                </Button>
              </ButtonGroup>
              <Button size="sm" onClick={() => setShowForm(true)}>
                <PlusLg className="me-1" />
                Add product
              </Button>
            </>
          }
        />

        {flash && (
          <Alert variant="success" dismissible onClose={() => setFlash(null)}>
            {flash}
          </Alert>
        )}

        <ProductToolbar
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          resultCount={visibleProducts.length}
        />

        <CategoryStrip categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />

        <ProductGrid
          products={visibleProducts}
          density={density}
          wishlist={wishlist}
          onToggleSave={toggleWishlist}
          onDelete={setPendingDelete}
        />
      </Container>

      <ProductForm show={showForm} categories={categories} onCreate={handleCreate} onClose={() => setShowForm(false)} />

      <ConfirmDialog
        show={!!pendingDelete}
        title="Delete product"
        body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
