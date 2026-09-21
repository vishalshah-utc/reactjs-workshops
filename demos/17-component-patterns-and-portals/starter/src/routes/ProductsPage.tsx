import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BarChart, Grid, Grid3x3Gap, PlusLg } from 'react-bootstrap-icons';
import {
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/services/products';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../lib/ApiError';
import { tokenStore } from '../lib/tokenStore';
import { parseSort, type SortKey } from '../lib/catalog';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useProductFilters } from '../hooks/useProductFilters';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { withRetry } from '../lib/retry';
import { PageHeader } from '../components/PageHeader';
import { CategoryStrip } from '../components/CategoryStrip';
import { ProductToolbar } from '../components/ProductToolbar';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm, type ProductFormActionData } from '../components/ProductForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pager } from '../components/Pager';
import { PriceHistogram } from '../components/PriceHistogram';
import { pushToast, useToastDispatch } from '../context/ToastContext';
import type { CategoryOption, Density, Product, ProductDraft } from '../types';
import { useCartStore } from '../store/cart';
import { useWishlistStore } from '../store/wishlist';
import type { rootLoader } from './RootLayout';

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
  // Reads are idempotent, so a transient failure is worth a second try. The
  // action's POST/PATCH/DELETE are NOT wrapped — see lib/retry.ts.
  const [productsResult, categoriesResult] = await Promise.allSettled([
    withRetry(() => listProducts({ q, category, sortBy, order, page, limit: PAGE_SIZE, signal: request.signal }), {
      signal: request.signal,
    }),
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
  // Authorisation at the ACTION, too: hidden buttons are UX, not security.
  // (And the real enforcement is on the server — a user can edit this JavaScript.)
  if (tokenStore.getUser()?.role !== 'admin') {
    throw data({ message: 'Only admins can change the catalogue.' }, { status: 403, statusText: 'Forbidden' });
  }

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
export function ProductsPage() {
  const { result, categories } = useLoaderData<typeof productsLoader>();
  const actionData = useActionData<typeof productsAction>();
  const navigation = useNavigation();
  const location = useLocation();
  const fetcher = useFetcher<typeof productsAction>();
  // Client state from the stores — no Outlet context, no props from the layout.
  const wishlist = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
  const notify = useToastDispatch();
  const { filters, updateFilters } = useProductFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const rootData = useRouteLoaderData<typeof rootLoader>('root'); // the root loader's data, from any page
  const isAdmin = rootData?.user?.role === 'admin';

  const [density, setDensity] = useState<Density>('comfortable');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [showChart, setShowChart] = useState(false);

  // The grid's root node — for the Pager to scroll back to. One ref, handed to two components as a plain prop.
  const gridRef = useRef<HTMLDivElement>(null);
  const chartPanelRef = useRef<HTMLDivElement>(null);

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

  // What the screen does NOT need: which search we already reported. A ref — changing it must not re-render,
  // and it must survive renders. Compare `lastFlash` below: the same shape, written in Demo 12 before you had the word for it.
  const lastReportedQuery = useRef<string | null>(null);
  useEffect(() => {
    if (filters.query === lastReportedQuery.current) return;
    logger.debug(`[search] "${filters.query}" → ${result.total} results (was "${lastReportedQuery.current ?? ''}")`);
    lastReportedQuery.current = filters.query;
  }, [filters.query, result.total]);

  function toggleChart() {
    if (showChart) {
      setShowChart(false);
      return;
    }
    // flushSync: render NOW, synchronously, so the panel exists on the next line. Without it, setState is batched,
    // the panel doesn't exist yet, and chartPanelRef.current is null. Rare and deliberate — hence the comment.
    flushSync(() => setShowChart(true));
    chartPanelRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  // --- The modal is URL state: ?new=1, ?edit=<id>. The action's ?flash=… is too — for one render. ---
  const editingId = searchParams.get('edit');
  const editing = editingId ? (result.products.find((p) => String(p.id) === editingId) ?? null) : null;
  const formOpen = searchParams.has('new') || !!editing;
  const flash = searchParams.get('flash');

  // A router action is a plain function: no hooks, so no Context. The URL carries its message across
  // the redirect (Demo 10), and the component that SEES it is the one that reports it — toast once,
  // then drop the param. The ref keeps "once" true under StrictMode, which runs effects twice in dev.
  const lastFlash = useRef<string | null>(null);
  useEffect(() => {
    if (!flash) {
      lastFlash.current = null;
      return;
    }
    if (flash === lastFlash.current) return;
    lastFlash.current = flash;
    notify(pushToast(`${flash} DummyJSON simulates writes — the list was re-fetched and does not include it.`));
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('flash');
        return next;
      },
      { replace: true },
    );
  }, [flash, notify, setSearchParams]);

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

  // A fetcher's result arrives as DATA, not a redirect — same rule: report it when it settles.
  useEffect(() => {
    if (fetcher.state !== 'idle' || !deleteData) return;
    notify(
      deleteData.ok
        ? pushToast(`“${deleteData.deleted}” deleted — the server confirmed it, then the list re-fetched (and, DummyJSON being simulated, it came back).`)
        : pushToast(deleteData.error ?? 'Delete failed.', 'danger'),
    );
  }, [fetcher.state, deleteData, notify]);

  const submitting = navigation.state === 'submitting' && navigation.formData?.get('intent') !== 'delete';
  const deletingId = fetcher.formData?.get('id')?.toString() ?? null;

  function confirmDelete() {
    if (!pendingDelete) return;
    // A fetcher submits WITHOUT navigating. The dialog can close right away;
    // the card shows busy via fetcher.formData until the action settles.
    fetcher.submit({ intent: 'delete', id: pendingDelete.id }, { method: 'post' });
    setPendingDelete(null);
  }

  // OPTIMISTIC: while a delete is in flight, render the list WITHOUT that product.
  // No snapshot, no rollback code — if the action fails, the fetcher goes idle,
  // fetcher.formData clears, and the product is simply rendered again.
  const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;
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
            {/* A disclosure, not a toggle button: aria-expanded + aria-controls tell assistive tech WHAT it opens. */}
            <Button size="sm" variant="outline-secondary" aria-expanded={showChart} aria-controls="price-histogram" onClick={toggleChart}>
              <BarChart className="me-1" />
              Prices
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setParam('new', 1)}>
                <PlusLg className="me-1" />
                Add product
              </Button>
            )}
          </>
        }
      />

      <ProductToolbar
        query={queryDraft}
        onQueryChange={handleQueryChange}
        sort={filters.sort}
        onSortChange={(sort) => updateFilters({ sort })}
        resultCount={total}
      />

      {/* TODO(lab-2.3): the strip's props become value / onChange — still CONTROLLED here, the URL owns the category */}
      <CategoryStrip
        categories={categories}
        activeId={filters.category}
        onSelect={(category) => {
          setQueryDraft('');
          updateFilters({ category, query: '' });
        }}
      />

      {showChart && (
        <div ref={chartPanelRef} className="mb-3">
          <PriceHistogram products={products} />
        </div>
      )}

      <ProductGrid
        ref={gridRef}
        products={products}
        density={density}
        wishlist={wishlist}
        onToggleSave={toggleWishlist}
        onAddToCart={addToCart}
        onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}
        onDelete={isAdmin ? setPendingDelete : undefined}
        busyId={deletingId}
      />

      <Pager
        page={filters.page}
        pageCount={pageCount}
        scrollTargetRef={gridRef}
        // preventScrollReset: the Pager scrolls to the grid itself; ScrollRestoration must not jump to the top first.
        onChange={(page) => updateFilters({ page }, { replace: false, preventScrollReset: true })}
      />

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
