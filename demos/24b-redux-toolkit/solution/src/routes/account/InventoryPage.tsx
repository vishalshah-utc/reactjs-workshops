import { useEffect } from 'react';
import { Alert, Card, Placeholder } from 'react-bootstrap';
import { Link, useLoaderData } from 'react-router';
import type { inventoryLoader } from './inventoryLoader';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Pager } from '../../components/Pager';
import { BulkBar } from '../../components/inventory/BulkBar';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InventoryToolbar } from '../../components/inventory/InventoryToolbar';
import { RecentlyInspected } from '../../components/inventory/RecentlyInspected';
import { pageChanged, selectFilters } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loadInventory,
  selectInventoryError,
  selectInventoryStatus,
  selectInventoryTotal,
  selectPageCount,
  selectUnitsOnPage,
  selectVisibleCount,
} from '../../store/inventory';

/**
 * F1. No loader. The STORE owns the async, and this page is the thing that
 * asks it to start.
 *
 * That is a deliberate choice and it costs something: no blocking navigation,
 * no route error boundary, and a skeleton the user sees. What it buys is that
 * the data, the filters, the per-row edit state and the bulk progress are all
 * in one place that survives this component — navigate away mid-restock and
 * come back, and the progress bar is still where it should be.
 */
export function InventoryPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const status = useAppSelector(selectInventoryStatus);
  const error = useAppSelector(selectInventoryError);
  const total = useAppSelector(selectInventoryTotal);
  const pageCount = useAppSelector(selectPageCount);
  const visibleCount = useAppSelector(selectVisibleCount);
  const units = useAppSelector(selectUnitsOnPage);

  // The ONE thing here that still comes from a route loader. Unchanging server
  // state the toolbar cannot render without, so the route blocks on it and the
  // store has nothing to add. The PRODUCTS are the experiment.
  const { categories } = useLoaderData<typeof inventoryLoader>();

  /**
   * F3, both halves of it.
   *
   * `filters` is the slice's state object, so its identity changes only when a
   * filter actually changes — this effect therefore runs exactly once per
   * filter change and not once per render.
   *
   * The returned `.abort()` is the AbortController half: it aborts the thunk,
   * which aborts the `signal` the service was given, which aborts the axios
   * request. The requestId check inside the reducer is the other half, for the
   * response that was already on the wire when the abort fired.
   */
  useEffect(() => {
    const promise = dispatch(loadInventory(filters));
    return () => promise.abort();
  }, [dispatch, filters]);

  return (
    <Card>
      <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <span className="fw-semibold">Inventory console</span>
        <span className="small text-muted">
          {status === 'ready' && `${visibleCount} of ${total} products · ${units} units on this page`}
        </span>
        <Link to="/account/inventory/rtkq" className="small">
          Same page, built with RTK Query →
        </Link>
      </Card.Header>

      <Card.Body>
        <InventoryToolbar categories={categories} />
        <RecentlyInspected />
        <BulkBar />

        {/* The status machine, rendered. Four values, four branches, and no
            combination of booleans that could show two of them at once. */}
        {status === 'loading' && <RowSkeletons />}

        {status === 'error' && (
          <ErrorNotice
            error={error}
            title="Could not load the catalogue"
            onRetry={() => dispatch(loadInventory(filters))}
          />
        )}

        {status === 'ready' && visibleCount === 0 && (
          <Alert variant="light" className="border text-center text-muted mb-0">
            Nothing matches those filters.
            {filters.lowStockOnly && ' Try turning “Low stock” off.'}
          </Alert>
        )}

        {status === 'ready' && visibleCount > 0 && <InventoryTable />}
      </Card.Body>

      <Card.Footer>
        <Pager page={filters.page} pageCount={pageCount} onChange={(page) => dispatch(pageChanged(page))} />
        <p className="small text-muted text-center mb-0 mt-2">
          Reads are real. DummyJSON <strong>simulates</strong> writes: a PATCH returns the right response and changes
          nothing, so a reload puts every number back.
        </p>
      </Card.Footer>
    </Card>
  );
}

function RowSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading inventory">
      {Array.from({ length: count }, (_, index) => (
        <Placeholder key={index} as="div" animation="glow" className="py-2 border-bottom">
          <Placeholder xs={4} /> <Placeholder xs={2} /> <Placeholder xs={1} />
        </Placeholder>
      ))}
    </div>
  );
}
