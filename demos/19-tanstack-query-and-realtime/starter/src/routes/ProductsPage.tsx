import { useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { Grid, Grid3x3Gap, ListUl, PlusLg } from 'react-bootstrap-icons';
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
import { useProductFilters } from '../hooks/useProductFilters';
import { withRetry } from '../lib/retry';
import { CategoryStrip } from '../components/CategoryStrip';
import { ProductToolbar } from '../components/ProductToolbar';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm, type ProductFormActionData } from '../components/ProductForm';
import { ProductRowList } from '../components/ProductRowList';
import { ProductsSurface } from '../components/ProductsSurface';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pager } from '../components/Pager';
import { RenderProfiler } from '../components/RenderProfiler';
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
// TODO(lab-2.3): route both halves of this through the cache —
// `queryClient.ensureQueryData(productListQuery(searchParams))` and
// `ensureQueryData(categoriesQuery())` inside the same `Promise.allSettled`.
// `withRetry` comes OUT: TanStack Query retries the query itself, and two retry
// layers is 3 × 2 attempts and a navigation that hangs.
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

// TODO(lab-3.3): this action STAYS (it is a form: validation, a redirect, no
// JavaScript required) — but it must now tell the cache what it changed. After a
// successful create/update, `await queryClient.invalidateQueries({ queryKey:
// productKeys.all })`. An action has no hooks; the client is a module, so it can
// simply import it. Delete the `intent === 'delete'` branch — Lab 3 moves that
// one to a mutation.
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
  // TODO(lab-2.4): read both through the cache instead —
  // `useQuery({ ...productListQuery(searchParams), initialData: loaded })` and
  // `useQuery(categoriesQuery())`. The loader already blocked on them, so this
  // is a synchronous read; what it buys is a page that re-renders when the CACHE
  // changes, not only when the router navigates.
  const { result, categories } = useLoaderData<typeof productsLoader>();
  const actionData = useActionData<typeof productsAction>();
  const navigation = useNavigation();
  const location = useLocation();
  // TODO(lab-3.2): swap this fetcher for `const deleteProduct = useDeleteProduct()`.
  // `deleteProduct.isPending` + `deleteProduct.variables` replace `fetcher.state`
  // and `fetcher.formData`; the toasts move into per-call `onSuccess`/`onError`.
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

  // Density is a VIEW preference two siblings need — the toggle in the header and the grid below it — so it
  // cannot be pushed down to either. It is not in the URL either, and deliberately: React Router re-runs this
  // route's loader on any search-param change, so `?density=compact` would put a network request behind a
  // purely visual switch. It stays here, and `useTransition` below makes the click feel instant anyway.
  const [density, setDensity] = useState<Density>('comfortable');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [showAll, setShowAll] = useState(false);
  // DEV instrument (Demo 18 Lab 1). Plain state, not a search param: flipping it must not refetch anything.
  const [slow, setSlow] = useState(false);

  // TODO(lab-7.1): `const view = searchParams.get('view') === 'endless' ? 'endless' : 'pages'`.
  // Demo 18 kept view preferences OUT of the URL because a search-param change
  // re-ran the loader and fetched. After Lab 2 it does not — so the reason is
  // gone and this one belongs in the URL, where it is shareable.

  // Re-rendering twelve slow cards takes ~100 ms, and a click that takes 100 ms to acknowledge feels broken.
  // A transition renders the new density in the BACKGROUND: the button updates immediately, the old grid stays
  // on screen, and `isPending` says so out loud (📖 study-notes 15 §9).
  const [densityPending, startDensityTransition] = useTransition();

  // The grid's root node — for the Pager to scroll back to. One ref, handed to two components as a plain prop.
  const gridRef = useRef<HTMLDivElement>(null);

  // --- The client-side quick filter: no URL, no loader, no network. Just this page's products, narrowed. ---
  // This state CANNOT be pushed down: the grid renders the result, so the value has to live above both.
  // That is precisely the case useDeferredValue exists for.
  const [quickFilter, setQuickFilter] = useState('');
  const deferredFilter = useDeferredValue(quickFilter);
  // React re-renders twice: once urgently with the new input value and the OLD deferredFilter, then again in the
  // background with the new one. While those disagree, what is on screen is one keystroke behind — say so.
  const filterIsStale = quickFilter !== deferredFilter;

  // What the screen does NOT need: which search we already reported. A ref — changing it must not re-render,
  // and it must survive renders. Compare `lastFlash` below: the same shape, written in Demo 12 before you had the word for it.
  const lastReportedQuery = useRef<string | null>(null);
  useEffect(() => {
    if (filters.query === lastReportedQuery.current) return;
    logger.debug(`[search] "${filters.query}" → ${result.total} results (was "${lastReportedQuery.current ?? ''}")`);
    lastReportedQuery.current = filters.query;
  }, [filters.query, result.total]);

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

  // TODO(lab-4.2): delete these two lines. `onMutate` already removed the product
  // from the cached list, so `result` arrives without it — and `onError` puts it
  // back. The component renders what the cache says.
  // OPTIMISTIC: while a delete is in flight, render the list WITHOUT that product.
  // No snapshot, no rollback code — if the action fails, the fetcher goes idle,
  // fetcher.formData clears, and the product is simply rendered again.
  const products = deletingId ? result.products.filter((p) => String(p.id) !== deletingId) : result.products;
  const total = result.total;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  // The quick filter runs against the DEFERRED value, never the live one — that is the whole trick.
  // Cheap on twelve products; the point is that it is the GRID's render that costs, not this filter.
  const needle = deferredFilter.trim().toLowerCase();
  const visible = needle
    ? products.filter((product) => `${product.title} ${product.brand ?? ''} ${product.category}`.toLowerCase().includes(needle))
    : products;

  return (
    <>
      {/* The page hands the surface three ELEMENTS and its children. The surface owns the price-chart
          disclosure; opening it re-renders the surface and nothing that arrived through these props. */}
      <ProductsSurface
        title="All products"
        description={`${total} products`}
        products={visible}
        actions={
          <>
            <ButtonGroup size="sm" aria-label="Grid density">
              <Button
                variant={density === 'comfortable' ? 'secondary' : 'outline-secondary'}
                aria-pressed={density === 'comfortable'}
                onClick={() => startDensityTransition(() => setDensity('comfortable'))}
              >
                <Grid className="me-1" />
                Comfortable
              </Button>
              <Button
                variant={density === 'compact' ? 'secondary' : 'outline-secondary'}
                aria-pressed={density === 'compact'}
                onClick={() => startDensityTransition(() => setDensity('compact'))}
              >
                <Grid3x3Gap className="me-1" />
                Compact
              </Button>
            </ButtonGroup>
            {/* isPending: the transition is still rendering. A spinner, not a disabled button — the UI stays usable. */}
            {densityPending && <Spinner size="sm" role="status" aria-label="Re-laying out the grid" />}
            {/* TODO(lab-5.4): a Pages ⇄ Endless toggle here, and below, render
                <EndlessGrid> instead of <ProductGrid> + <Pager> when `view === 'endless'`. */}
            <Button size="sm" variant="outline-secondary" aria-expanded={showAll} aria-controls="all-products" onClick={() => setShowAll((open) => !open)}>
              <ListUl className="me-1" />
              {showAll ? 'Hide all' : `Show all ${total}`}
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setParam('new', 1)}>
                <PlusLg className="me-1" />
                Add product
              </Button>
            )}
          </>
        }
        toolbar={
          <>
            <ProductToolbar
              query={filters.query}
              onQueryCommit={(query) => updateFilters({ query })}
              sort={filters.sort}
              onSortChange={(sort) => updateFilters({ sort })}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              resultCount={total}
              slow={slow}
              onSlowChange={setSlow}
            />

            {/* CONTROLLED: the URL owns the category (useProductFilters); the strip renders it and reports clicks. */}
            <CategoryStrip categories={categories} value={filters.category} onChange={(category) => updateFilters({ category, query: '' })} />
          </>
        }
      >
        {/* Every commit of this subtree is logged with its duration. Open the console, flip Slow mode, type. */}
        <RenderProfiler id="grid">
          {/* Stale = the deferred value has not caught up. Dim the list rather than blocking the input. */}
          <div style={{ opacity: filterIsStale ? 0.55 : 1, transition: 'opacity 120ms linear' }} aria-busy={filterIsStale}>
            <ProductGrid
              ref={gridRef}
              products={visible}
              density={density}
              wishlist={wishlist}
              onToggleSave={toggleWishlist}
              onAddToCart={addToCart}
              onEdit={isAdmin ? (product) => setParam('edit', product.id) : undefined}
              onDelete={isAdmin ? setPendingDelete : undefined}
              busyId={deletingId}
              slow={slow}
            />
          </div>
        </RenderProfiler>

        <Pager
          value={filters.page}
          pageCount={pageCount}
          scrollTargetRef={gridRef}
          // preventScrollReset: the Pager scrolls to the grid itself; ScrollRestoration must not jump to the top first.
          onChange={(page) => updateFilters({ page }, { replace: false, preventScrollReset: true })}
        />

        {showAll && (
          <div id="all-products" className="mt-4">
            <RenderProfiler id="virtual-list">
              <ProductRowList slow={slow} />
            </RenderProfiler>
          </div>
        )}
      </ProductsSurface>

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
