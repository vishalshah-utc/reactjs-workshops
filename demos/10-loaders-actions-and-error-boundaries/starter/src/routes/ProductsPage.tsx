import { useCallback, useState } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { useOutletContext } from 'react-router';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/services/products';
import { env } from '../config/env';
import { useApi } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useProductFilters } from '../hooks/useProductFilters';
import { PageHeader } from '../components/PageHeader';
import { CategoryStrip } from '../components/CategoryStrip';
import { ProductToolbar } from '../components/ProductToolbar';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm } from '../components/ProductForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorNotice } from '../components/ErrorNotice';
import { CardSkeletons } from '../components/Skeletons';
import { Pager } from '../components/Pager';
import { ApiError } from '../lib/ApiError';
import { parseSort, PLACEHOLDER_THUMBNAIL } from '../lib/catalog';
import type { CategoryOption, Density, Product, ProductDraft } from '../types';
import type { RootOutletContext } from './RootLayout';

const PAGE_SIZE = env.pageSize;

/** DummyJSON's create response echoes only what you sent — fill the fields a card needs to render. */
const CARD_DEFAULTS: Pick<Product, 'rating' | 'discountPercentage' | 'thumbnail'> = {
  rating: 0,
  discountPercentage: 0,
  thumbnail: PLACEHOLDER_THUMBNAIL,
};

// TODO(lab-1.1): export productsLoader({ request }: LoaderFunctionArgs) — read filters from request.url, Promise.allSettled products + categories, forward request.signal; the component reads useLoaderData()
// TODO(lab-3.2): export productsAction({ request }: ActionFunctionArgs) — intent 'create' | 'update' | 'delete'; validate and RETURN errors; redirect on success
// TODO(lab-4.1): delete through useFetcher() — no navigation, automatic revalidation
export function ProductsPage() {
  // The URL is the source of truth for every filter. Shared state comes from the layout.
  const { filters, updateFilters } = useProductFilters();
  const { wishlist, toggleWishlist } = useOutletContext<RootOutletContext>();
  const [density, setDensity] = useState<Density>('comfortable');
  const debouncedQuery = useDebouncedValue(filters.query, 400);

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

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const products = result?.products ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

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

  async function handleSave(payload: ProductDraft) {
    const saved = editing ? await updateProduct(editing.id, payload) : await createProduct(payload);
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
      await deleteProduct(product.id);
      setResult((current) =>
        current
          ? { ...current, products: current.products.filter((p) => p.id !== product.id), total: current.total - 1 }
          : current,
      );
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
        />
      )}

      <Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page }, { replace: false })} />

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
