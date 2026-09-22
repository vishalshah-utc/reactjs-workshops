import { useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { Grid, Grid3x3Gap, Infinity as InfinityIcon, ListUl, PlusLg } from 'react-bootstrap-icons';
import { useQuery } from '@tanstack/react-query';
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { categoriesQuery, productKeys, productListQuery } from '../api/queries';
import { createProduct, updateProduct } from '../api/services/products';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../lib/ApiError';
import { queryClient } from '../lib/queryClient';
import { tokenStore } from '../lib/tokenStore';
import { useDeleteProduct } from '../hooks/useProductMutations';
import { useProductFilters } from '../hooks/useProductFilters';
import { CategoryStrip } from '../components/CategoryStrip';
import { EndlessGrid } from '../components/EndlessGrid';
import { ProductToolbar } from '../components/ProductToolbar';
import { ProductGrid } from '../components/ProductGrid';
import { ProductForm, type ProductFormActionData } from '../components/ProductForm';
import { ProductRowList } from '../components/ProductRowList';
import { ProductsSurface } from '../components/ProductsSurface';
import { PageMeta } from '../components/PageMeta';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pager } from '../components/Pager';
import { RenderProfiler } from '../components/RenderProfiler';
import { pushToast, useToastDispatch } from '../context/ToastContext';
import type { Density, Product, ProductDraft } from '../types';
import { useCartStore } from '../store/cart';
import { useWishlistStore } from '../store/wishlist';
import type { rootLoader } from './RootLayout';

const PAGE_SIZE = env.pageSize;

// ---------------------------------------------------------------------------
// Loader: runs BEFORE the component, on every navigation to this route and
// again after every action. It reads the URL from `request.url` — no hooks.
// ---------------------------------------------------------------------------
export async function productsLoader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);

  // Both requests start at the same instant — no waterfall. Categories are
  // optional, so their failure must not sink the page: allSettled, not all.
  //
  // `ensureQueryData` REPLACES `withRetry` here, and must: TanStack Query
  // retries a failed query itself (lib/queryClient.ts sets the policy from the
  // same `isRetryable` predicate), so keeping both would give 3 × 2 attempts
  // and a navigation that hangs for half a minute.
  //
  // The second call is the one to watch. `categoriesQuery` has
  // `staleTime: Infinity`, so after the first page load every later navigation
  // resolves it from memory with no request at all — and there is one of those
  // on every keystroke of the search box.
  const [listResult] = await Promise.allSettled([
    queryClient.ensureQueryData(productListQuery(searchParams)),
    queryClient.ensureQueryData(categoriesQuery()),
  ]);

  if (listResult.status === 'rejected') throw listResult.reason; // → the route ErrorBoundary
  return listResult.value;
}

// ---------------------------------------------------------------------------
// Action: every mutation on this route, discriminated by `intent`.
// Expected failures (validation) are RETURNED; unexpected ones are thrown.
// ---------------------------------------------------------------------------
//
// Why this is STILL a router action, in an app that now has mutations: this is a
// FORM. Validation errors come back to the fields that failed, a redirect closes
// the modal, the URL carries the flash across it, and none of it needs
// JavaScript. `useMutation` is a function caller — it has no opinion about forms
// at all. The rule the app follows from today: forms post to actions, buttons
// call mutations, and everything that READS goes through the cache.
export async function productsAction({ request }: ActionFunctionArgs): Promise<ProductFormActionData | Response> {
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
      // THE BRIDGE. An action is a plain function with no hooks — but `queryClient` is a
      // module, so an action can import it and tell the cache what it just changed. Without
      // this line the router revalidates its loaders and the detail page keeps the old title.
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
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
  const loaded = useLoaderData<typeof productsLoader>();
  const actionData = useActionData<typeof productsAction>();
  const navigation = useNavigation();
  const location = useLocation();
  // Client state from the stores — no Outlet context, no props from the layout.
  const wishlist = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
  const notify = useToastDispatch();
  const { filters, updateFilters } = useProductFilters();
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * The loader already blocked on this, so the cache is warm and the hook reads
   * it synchronously; `initialData` tells TypeScript so. The page now re-renders
   * when the CACHE changes — after a delete, after an edit, after a price tick —
   * and not only when the router navigates.
   *
   * `searchParams` also carries `?new`, `?edit` and `?flash`. `productListQuery`
   * ignores them, so opening the modal is not a cache miss.
   */
  const { data: result } = useQuery({ ...productListQuery(searchParams), initialData: loaded });
  // No loader data at all for the categories: the loader filled the cache, this reads it.
  const { data: categories = [] } = useQuery(categoriesQuery());
  const deleteProduct = useDeleteProduct();
  const rootData = useRouteLoaderData<typeof rootLoader>('root'); // the root loader's data, from any page
  const isAdmin = rootData?.user?.role === 'admin';

  // Density is a VIEW preference two siblings need — the toggle in the header and the grid below it — so it
  // cannot be pushed down to either. It stays LOCAL: nobody sends a link to a density, and the state dies with
  // the page without anybody missing it. `?view=` below made the opposite call, for the opposite reason.
  const [density, setDensity] = useState<Density>('comfortable');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [showAll, setShowAll] = useState(false);
  // DEV instrument (Demo 18 Lab 1). Plain state, not a search param: flipping it must not refetch anything.
  const [slow, setSlow] = useState(false);

  /**
   * Which grid — and it IS in the URL, unlike `density` above.
   *
   * Demo 18 kept view preferences out of the query string because a search-param
   * change re-runs this route's loader, which meant a network request behind a
   * purely visual switch. It does not any more: the loader's `ensureQueryData`
   * finds the page in the cache and returns it synchronously. The cost that made
   * the decision went away, so the decision changes — and `?view=endless` is now
   * a link somebody can send (Lab 7).
   */
  const view = searchParams.get('view') === 'endless' ? 'endless' : 'pages';

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

  // The action has one intent left, so this is the only shape it returns.
  const formActionData = actionData && 'errors' in actionData ? actionData : undefined;

  const submitting = navigation.state === 'submitting';
  // `variables` is what the last `mutate()` was called with — the id, here. One mutation object
  // per component, so this is "the delete in flight", which is exactly what the card needs.
  const deletingId = deleteProduct.isPending ? String(deleteProduct.variables) : null;

  function confirmDelete() {
    if (!pendingDelete) return;
    const { id, title } = pendingDelete;
    // `mutate` never throws — that is the point of it. Per-call callbacks run AFTER the hook's
    // own, and are for what this component wants to say; cache maintenance stays in the hook.
    deleteProduct.mutate(id, {
      onSuccess: () => notify(pushToast(`“${title}” deleted — the cache dropped it, then refetched from the server (and, DummyJSON being simulated, it came back).`)),
      onError: (error) => notify(pushToast(ApiError.from(error).message, 'danger')),
    });
    setPendingDelete(null);
  }

  // No optimistic filtering HERE any more. `onMutate` already removed the product from the
  // cached list, so `result` arrives without it — and `onError` puts it back. The component
  // renders what the cache says, which is the whole point.
  const products = result.products;
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
      {/* One line per route, and the tab finally says where you are. The title reflects
          the FILTERS, not just the route — a bookmark of ?q=mascara should say so. */}
      <PageMeta
        title={needle || loaded.products.length !== total ? `${total} products` : 'All products'}
        description={`Browse ${total} products across every category in ShopScope.`}
      />

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
            {/* A LINK in disguise: the state it toggles is a search param, so this view is shareable. */}
            <Button
              size="sm"
              variant={view === 'endless' ? 'secondary' : 'outline-secondary'}
              aria-pressed={view === 'endless'}
              onClick={() => setParam('view', view === 'endless' ? null : 'endless')}
            >
              <InfinityIcon className="me-1" />
              {view === 'endless' ? 'Endless' : 'Pages'}
            </Button>
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
          {view === 'endless' ? (
            // The infinite view owns its own data: one cache entry holding every page loaded so far.
            <EndlessGrid density={density} wishlist={wishlist} onToggleSave={toggleWishlist} onAddToCart={addToCart} slow={slow} />
          ) : (
            // Stale = the deferred value has not caught up. Dim the list rather than blocking the input.
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
          )}
        </RenderProfiler>

        {view === 'pages' && (
          <Pager
            value={filters.page}
            pageCount={pageCount}
            scrollTargetRef={gridRef}
            // preventScrollReset: the Pager scrolls to the grid itself; ScrollRestoration must not jump to the top first.
            onChange={(page) => updateFilters({ page }, { replace: false, preventScrollReset: true })}
          />
        )}

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
