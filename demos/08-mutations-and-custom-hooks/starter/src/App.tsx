import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, ButtonGroup, Container } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import { listCategories, listProducts } from './api/services/products';
import { env } from './config/env';
import { logger } from './config/logger';
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
import type { CategoryOption, Density, Product, ProductDraft, ProductListResponse } from './types';

const PAGE_SIZE = env.pageSize;

/** Everything the server needs to know about what the user is looking at. */
interface Filters {
  query: string;
  sort: SortKey;
  category: string;
  /** 0-based. */
  page: number;
}

const INITIAL_FILTERS: Filters = { query: '', sort: '', category: 'all', page: 0 };

export default function App() {
  // State that changes TOGETHER lives together. Four useStates would let them disagree.
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [density, setDensity] = useState<Density>('comfortable');

  // The input stays instant; the network only sees the settled value.
  const debouncedQuery = useDebouncedValue(filters.query, 400);

  // The current page of results: { products, total, skip, limit }
  const [result, setResult] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Categories have their own lifetime: loaded once, never re-fetched per keystroke
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // TODO(lab-2.2): handleSave — await createProduct / updateProduct, merge the SERVER's response into the list
  // TODO(lab-3.1): handleDelete — await deleteProduct with a `deleting` flag; never clear pendingDelete until it settles
  // TODO(lab-4.2): replace the two fetch effects with useApi

  /**
   * Change any filter. A filter change invalidates the current page, so `page`
   * goes back to 0 — unless the patch IS a page change, which overrides it.
   * One rule, one place; no effect needed.
   */
  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, page: 0, ...patch }));
  }

  useEffect(() => {
    const controller = new AbortController();
    const { sortBy, order } = parseSort(filters.sort);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await listProducts({
          q: debouncedQuery,
          category: filters.category === 'all' ? '' : filters.category,
          sortBy,
          order,
          page: filters.page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        setResult(data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(ApiError.from(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [debouncedQuery, filters.category, filters.sort, filters.page, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    listCategories({ signal: controller.signal })
      .then((list) => setCategories(list.map((c) => ({ id: c.slug, name: c.name }))))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        // Deliberately NOT surfaced: the app is fully usable without the filter strip.
        logger.warn('Category list unavailable', ApiError.from(err).message);
      });

    return () => controller.abort();
  }, []);

  const products = result?.products ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  function toggleWishlist(id: number) {
    setWishlist((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function handleCreate(payload: ProductDraft) {
    const created: Product = { ...payload, id: Date.now(), rating: 0, discountPercentage: 0, thumbnail: PLACEHOLDER_THUMBNAIL };
    setResult((current) => (current ? { ...current, products: [created, ...current.products] } : current));
    setShowForm(false);
    setFlash(`“${created.title}” added (locally — the server learns about it in Demo 8).`);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setResult((current) =>
      current ? { ...current, products: current.products.filter((p) => p.id !== product.id) } : current,
    );
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

        <ErrorNotice error={error} onRetry={() => setReloadKey((k) => k + 1)} />

        <ProductToolbar
          query={filters.query}
          onQueryChange={(query) => updateFilters({ query })}
          sort={filters.sort}
          onSortChange={(sort) => updateFilters({ sort })}
          resultCount={total}
        />

        <CategoryStrip
          categories={categories}
          activeId={filters.category}
          // Search wins over category in the service — clear it so the pill visibly takes effect.
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
            onDelete={setPendingDelete}
            onSelect={setSelectedId}
          />
        )}

        <Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page })} />
      </Container>

      <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />

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
