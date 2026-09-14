import { useState } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import {
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useOutletContext,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/services/products';
import { env } from '../config/env';
import { ApiError } from '../lib/ApiError';
import { parseSort, type SortKey } from '../lib/catalog';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useProductFilters } from '../hooks/useProductFilters';
import { PageHeader } from '../components/PageHeader';
import { CategoryStrip } from '../components/CategoryStrip';
import { ProductToolbar } from '../components/ProductToolbar';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm, type ProductFormActionData } from '../components/ProductForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pager } from '../components/Pager';
import type { CategoryOption, Density, Product, ProductDraft } from '../types';
import type { RootOutletContext } from './RootLayout';

const PAGE_SIZE = env.pageSize;

// ---------------------------------------------------------------------------
// Loader: runs BEFORE the component, on every navigation to this route and
// again after every action. It reads the URL from `request.url` — no hooks.
// ---------------------------------------------------------------------------
export async function productsLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const sort = (url.searchParams.get('sort') ?? '') as SortKey;
  const page = Math.max(0, Number(url.searchParams.get('page') ?? '1') - 1);
  const { sortBy, order } = parseSort(sort);

  // Both requests start at the same instant — no waterfall. Categories are
  // optional, so their failure must not sink the page: allSettled, not all.
  const [productsResult, categoriesResult] = await Promise.allSettled([
    listProducts({ q, category, sortBy, order, page, limit: PAGE_SIZE, signal: request.signal }),
    listCategories({ signal: request.signal }),
  ]);

  if (productsResult.status === 'rejected') throw productsResult.reason; // → the route ErrorBoundary

  const categories: CategoryOption[] =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value.map((c) => ({ id: c.slug, name: c.name })) : [];

  return { result: productsResult.value, categories };
}

// ---------------------------------------------------------------------------
// Action: every mutation on this route, discriminated by `intent`.
// Expected failures (validation) are RETURNED; unexpected ones are thrown.
// ---------------------------------------------------------------------------
interface DeleteActionData {
  ok: boolean;
  deleted?: string;
  error?: string;
}

export async function productsAction({ request }: ActionFunctionArgs): Promise<ProductFormActionData | DeleteActionData | Response> {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const url = new URL(request.url);
  const text = (key: string) => String(formData.get(key) ?? '');

  /** Redirect back to the same list (filters intact), with the modal closed and a flash. */
  const done = (flash: string) => {
    url.searchParams.delete('new');
    url.searchParams.delete('edit');
    url.searchParams.set('flash', flash);
    return redirect(url.pathname + url.search);
  };

  if (intent === 'delete') {
    try {
      const removed = await deleteProduct(text('id'));
      return { ok: true, deleted: removed.title };
    } catch (error) {
      return { ok: false, error: ApiError.from(error).message };
    }
  }

  if (intent === 'create' || intent === 'update') {
    const values = {
      title: text('title').trim(),
      price: text('price'),
      category: text('category'),
      stock: text('stock'),
      description: text('description').trim(),
    };

    const errors: ProductFormActionData['errors'] = {};
    if (values.title.length < 2) errors.title = 'Give it a name of at least 2 characters.';
    if (!(Number(values.price) > 0)) errors.price = 'Price must be more than zero.';
    if (!values.category) errors.category = 'Pick a category.';
    if (!(Number(values.stock) >= 0)) errors.stock = 'Stock cannot be negative.';
    if (Object.keys(errors).length > 0) return { errors, values }; // RETURN — the form stays open, input intact

    const payload: ProductDraft = { ...values, price: Number(values.price), stock: Number(values.stock) };

    try {
      const saved = intent === 'update' ? await updateProduct(text('id'), payload) : await createProduct(payload);
      return done(`“${saved.title}” ${intent === 'update' ? 'updated' : 'created'} (server id ${saved.id}).`);
    } catch (error) {
      return { errors: { form: ApiError.from(error).message }, values }; // a server failure still keeps the user on the form
    }
  }

  throw data({ message: `Unknown intent: ${String(intent)}` }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Component: no loading state, no error state, no effects for data.
// ---------------------------------------------------------------------------
// TODO(lab-5.2): useRouteLoaderData<typeof rootLoader>('root') → isAdmin; show Add/Edit/Delete only to admins; the action rejects non-admins with a 403
export function ProductsPage() {
  const { result, categories } = useLoaderData<typeof productsLoader>();
  const actionData = useActionData<typeof productsAction>();
  const navigation = useNavigation();
  const location = useLocation();
  const fetcher = useFetcher<typeof productsAction>();
  const { wishlist, toggleWishlist } = useOutletContext<RootOutletContext>();
  const { filters, updateFilters } = useProductFilters();
  const [searchParams, setSearchParams] = useSearchParams();

  const [density, setDensity] = useState<Density>('comfortable');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  // --- Search box: instant to type in, debounced to the URL (and therefore to the loader) ---
  const [queryDraft, setQueryDraft] = useState(filters.query);
  const commitQuery = useDebouncedCallback((query: string) => updateFilters({ query }), 400);

  // If the URL's q changes from OUTSIDE (back button, a shared link), adopt it.
  // "Adjusting state when a prop changes" — the React-docs pattern, no effect needed.
  const [seenQuery, setSeenQuery] = useState(filters.query);
  if (filters.query !== seenQuery) {
    setSeenQuery(filters.query);
    setQueryDraft(filters.query);
  }

  function handleQueryChange(value: string) {
    setQueryDraft(value);
    commitQuery(value);
  }

  // --- The modal and the flash message are URL state too: ?new=1, ?edit=<id>, ?flash=… ---
  const editingId = searchParams.get('edit');
  const editing = editingId ? (result.products.find((p) => String(p.id) === editingId) ?? null) : null;
  const formOpen = searchParams.has('new') || !!editing;
  const flash = searchParams.get('flash');

  function setParam(key: string, value: string | number | null) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === null) next.delete(key);
        else next.set(key, String(value));
        return next;
      },
      { replace: true },
    );
  }

  // The action returns different shapes for different intents; narrow to the form's.
  const formActionData = actionData && 'errors' in actionData ? actionData : undefined;
  const deleteData = fetcher.data && 'ok' in fetcher.data ? fetcher.data : undefined;

  const submitting = navigation.state === 'submitting' && navigation.formData?.get('intent') !== 'delete';
  const deletingId = fetcher.formData?.get('id')?.toString() ?? null;

  function confirmDelete() {
    if (!pendingDelete) return;
    // A fetcher submits WITHOUT navigating. The dialog can close right away;
    // the card shows busy via fetcher.formData until the action settles.
    fetcher.submit({ intent: 'delete', id: pendingDelete.id }, { method: 'post' });
    setPendingDelete(null);
  }

  const products = result.products;
  const total = result.total;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="All products"
        description={`${total} products`}
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
            <Button size="sm" onClick={() => setParam('new', 1)}>
              <PlusLg className="me-1" />
              Add product
            </Button>
          </>
        }
      />

      {flash && (
        <Alert variant="success" dismissible onClose={() => setParam('flash', null)}>
          {flash} DummyJSON simulates writes — the list you see was re-fetched and does not include it.
        </Alert>
      )}

      {deleteData?.deleted && fetcher.state === 'idle' && (
        <Alert variant="success">
          “{deleteData.deleted}” deleted — the server confirmed it, then the list re-fetched (and, DummyJSON being
          simulated, it came back).
        </Alert>
      )}
      {deleteData?.ok === false && fetcher.state === 'idle' && <Alert variant="danger">{deleteData.error}</Alert>}

      <ProductToolbar
        query={queryDraft}
        onQueryChange={handleQueryChange}
        sort={filters.sort}
        onSortChange={(sort) => updateFilters({ sort })}
        resultCount={total}
      />

      <CategoryStrip
        categories={categories}
        activeId={filters.category}
        onSelect={(category) => {
          setQueryDraft('');
          updateFilters({ category, query: '' });
        }}
      />

      <ProductGrid
        products={products}
        density={density}
        wishlist={wishlist}
        onToggleSave={toggleWishlist}
        onEdit={(product) => setParam('edit', product.id)}
        onDelete={setPendingDelete}
        busyId={deletingId}
      />

      <Pager page={filters.page} pageCount={pageCount} onChange={(page) => updateFilters({ page }, { replace: false })} />

      {/* key: switching between "new" and a product remounts the form with fresh defaultValues */}
      <ProductForm
        key={editing?.id ?? 'new'}
        show={formOpen}
        editing={editing}
        categories={categories}
        action={location.pathname + location.search}
        actionData={formActionData}
        submitting={submitting}
        onClose={() => {
          setParam('new', null);
          setParam('edit', null);
        }}
      />

      <ConfirmDialog
        show={!!pendingDelete}
        title="Delete product"
        body={`Delete “${pendingDelete?.title}”? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
