import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductForm } from './components/ProductForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ErrorNotice } from './components/ErrorNotice';
import { CardSkeletons } from './components/Skeletons';
import { applySort, buildCategories, filterProducts, PLACEHOLDER_THUMBNAIL } from './lib/catalog';
import type { SortKey } from './lib/catalog';
import type { Density, Product, ProductDraft, ProductListResponse } from './types';

/** Only the fields the cards render — a smaller payload is a faster page. */
const LIST_FIELDS = 'id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail';

export default function App() {
  // Seeded from the network now. Empty until the first response lands.
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); // true from the start: a request WILL happen
  const [error, setError] = useState<unknown>(null); // a catch block hands you `unknown`; keep it honest
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [density, setDensity] = useState<Density>('comfortable');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // TODO(lab-3.2): call listProducts({ signal }) from the service layer instead of axios directly
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        // The generic types `response.data` — a CLAIM, not a runtime check (Demo 6 says more).
        const { data } = await axios.get<ProductListResponse>('https://dummyjson.com/products', {
          params: { limit: 0, select: LIST_FIELDS }, // limit=0 → every product
          signal: controller.signal,
        });
        setProducts(data.products);
      } catch (err) {
        if (axios.isCancel(err)) return; // a cancelled request is not a failure
        setError(err);
      } finally {
        // If a NEWER request cancelled this one, it owns the loading flag now.
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const categories = buildCategories(products);
  const visibleProducts = applySort(filterProducts(products, { query, category: activeCategory }), sort);

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function handleCreate(payload: ProductDraft) {
    const created: Product = { ...payload, id: Date.now(), rating: 0, discountPercentage: 0, thumbnail: PLACEHOLDER_THUMBNAIL };
    setProducts((current) => [created, ...current]);
    setShowForm(false);
    setFlash(`“${created.title}” added (locally — the server learns about it in Demo 8).`);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setProducts((current) => current.filter((p) => p.id !== product.id));
    setWishlist((current) => current.filter((id) => id !== product.id));
    setPendingDelete(null);
    setFlash(`“${product.title}” deleted (locally).`);
  }

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      <Container className="py-4">
        <PageHeader
          title="All products"
          description={loading ? 'Loading the catalogue…' : `${visibleProducts.length} of ${products.length} products`}
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
              <Button size="sm" onClick={() => setShowForm(true)} disabled={loading}>
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

        <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />

        <ProductToolbar
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          resultCount={visibleProducts.length}
        />

        <CategoryStrip categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />

        {loading ? (
          <CardSkeletons count={12} />
        ) : (
          <ProductGrid
            products={visibleProducts}
            density={density}
            wishlist={wishlist}
            onToggleSave={toggleWishlist}
            onDelete={setPendingDelete}
          />
        )}
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
