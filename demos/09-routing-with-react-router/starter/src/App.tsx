import { useCallback, useState } from 'react';
import { Alert, Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from './api/services/products';
import { env } from './config/env';
import { useApi } from './hooks/useApi';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { SiteHeader } from './components/SiteHeader';
import { PageHeader } from './components/PageHeader';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductGrid } from './components/ProductGrid';
import { ProductForm } from './components/ProductForm';
import { ProductDetail } from './components/ProductDetail';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ErrorNotice } from './components/ErrorNotice';
import { CardSkeletons } from './components/Skeletons';
import { Pager } from './components/Pager';
import { ApiError } from './lib/ApiError';
import { parseSort, PLACEHOLDER_THUMBNAIL, type SortKey } from './lib/catalog';
import type { CategoryOption, Density, Product, ProductDraft } from './types';

const PAGE_SIZE = env.pageSize;

interface Filters {
  query: string;
  sort: SortKey;
  category: string;
  page: number;
}

const INITIAL_FILTERS: Filters = { query: '', sort: '', category: 'all', page: 0 };

/** DummyJSON's create response echoes only what you sent — fill the fields a card needs to render. */
const CARD_DEFAULTS: Pick<Product, 'rating' | 'discountPercentage' | 'thumbnail'> = {
  rating: 0,
  discountPercentage: 0,
  thumbnail: PLACEHOLDER_THUMBNAIL,
};

// TODO(lab-1.4): this whole component becomes routes/ProductsPage.tsx — the header and Container move to RootLayout
// TODO(lab-4.2): replace the filters useState with useProductFilters(); the URL becomes the source of truth
export default function App() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [density, setDensity] = useState<Density>('comfortable');
  const debouncedQuery = useDebouncedValue(filters.query, 400);

  // --- Reads: two hooks replace two hand-written effects ---
  const { sortBy, order } = parseSort(filters.sort);
  const fetchProducts = useCallback(
    (signal: AbortSignal) =>
      listProducts({
        q: debouncedQuery,
        category: filters.category === 'all' ? '' : filters.category,
        sortBy,
        order,
        page: filters.page,
        limit: PAGE_SIZE,
        signal,
      }),
    [debouncedQuery, filters.category, filters.page, sortBy, order],
  );
  const {
    data: result,
    loading,
    error,
    reload,
    setData: setResult,
  } = useApi(fetchProducts, [debouncedQuery, filters.category, filters.page, sortBy, order]);

  const { data: categories } = useApi<CategoryOption[]>(
    (signal) => listCategories({ signal }).then((list) => list.map((c) => ({ id: c.slug, name: c.name }))),
    [],
    { initialData: [] },
  );

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, page: 0, ...patch }));
  }

  const products = result?.products ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(product: Product) {
    setEditing(product);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  /**
   * Runs INSIDE the form's try/catch: throw here and the form shows the error
   * and keeps the user's input. Only on success do we merge and close.
   */
  async function handleSave(payload: ProductDraft) {
    const saved = editing ? await updateProduct(editing.id, payload) : await createProduct(payload);

    // Use what the SERVER returned — it has the real id and any computed fields.
    setResult((current) => {
      if (!current) return current;
      const exists = current.products.some((p) => p.id === saved.id);
      return {
        ...current,
        products: exists
          ? current.products.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
          : [{ ...CARD_DEFAULTS, ...saved }, ...current.products],
        total: exists ? current.total : current.total + 1,
      };
    });
    closeForm();
    setFlash(`“${saved.title}” ${editing ? 'updated' : 'created'}. DummyJSON simulates writes — a refresh restores the original data.`);
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const product = pendingDelete;
    try {
      setDeleting(true);
      await deleteProduct(product.id); // do NOT cancel a mutation on unmount — the server may already have committed
      setResult((current) =>
        current
          ? { ...current, products: current.products.filter((p) => p.id !== product.id), total: current.total - 1 }
          : current,
      );
      setWishlist((current) => current.filter((id) => id !== product.id));
      setFlash(`“${product.title}” deleted.`);
    } catch (err) {
      setFlash(null);
      setDeleteError(ApiError.from(err));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <SiteHeader cartCount={3} wishlistCount={wishlist.length} />

      <Container className="py-4">
        <PageHeader
          title="All products"
          description={loading && !result ? 'Loading the catalogue…' : `${total} products`}
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
              <Button size="sm" onClick={openCreate}>
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

        <ErrorNotice error={error} onRetry={reload} />
        <ErrorNotice error={deleteError} title="Couldn't delete" onRetry={() => setDeleteError(null)} />

        <ProductToolbar
          query={filters.query}
          onQueryChange={(query) => updateFilters({ query })}
          sort={filters.sort}
          onSortChange={(sort) => updateFilters({ sort })}
          resultCount={total}
        />

        <CategoryStrip
          categories={categories ?? []}
          activeId={filters.category}
          onSelect={(category) => updateFilters({ category, query: '' })}
        />

        {loading ? (
          <CardSkeletons count={PAGE_SIZE} />
        ) : (
          <ProductGrid
            products={products}
            density={density}
            wishlist={wishlist}
            onToggleSave={toggleWishlist}
            onEdit={openEdit}
            onDelete={setPendingDelete}
            onSelect={setSelectedId}
          />
        )}

        <Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page })} />
      </Container>

      <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />

      {/* key: switching between "new" and a product REMOUNTS the form with fresh initial state */}
      <ProductForm
        key={editing?.id ?? 'new'}
        show={showForm}
        editing={editing}
        categories={categories ?? []}
        onSubmit={handleSave}
        onClose={closeForm}
      />

      <ConfirmDialog
        show={!!pendingDelete}
        title="Delete product"
        body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
