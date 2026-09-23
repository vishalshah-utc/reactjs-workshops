import { useEffect } from 'react';
import { Alert, Card, Placeholder } from 'react-bootstrap';
import { Link, useLoaderData } from 'react-router';
import type { inventoryLoader } from './inventoryLoader';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Pager } from '../../components/Pager';
import { BulkBar } from '../../components/inventory/BulkBar';
import { FeedBar } from '../../components/inventory/FeedBar';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InventoryToolbar } from '../../components/inventory/InventoryToolbar';
import { RecentlyInspected } from '../../components/inventory/RecentlyInspected';
import { pageChanged, selectFilters } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  consoleClosed,
  consoleOpened,
  inventoryRetried,
  selectInventoryError,
  selectInventoryStatus,
  selectInventoryTotal,
  selectPageCount,
  selectUnitsOnPage,
  selectVisibleCount,
} from '../../store/inventory';

/**
 * F1, and the clearest single before/after in the demo.
 *
 * DEMO 24b:
 *
 *   const filters = useAppSelector(selectFilters);
 *   useEffect(() => {
 *     const promise = dispatch(loadInventory(filters));
 *     return () => promise.abort();
 *   }, [dispatch, filters]);
 *
 * Five lines, and they knew a lot: that loading is a thunk, that a thunk
 * promise has `.abort()`, that the effect has to re-run on every filter change,
 * and that `filters` is reference-stable enough for that to be safe.
 *
 * TODAY:
 *
 *   useEffect(() => {
 *     dispatch(consoleOpened());
 *     return () => { dispatch(consoleClosed()); };
 *   }, [dispatch]);
 *
 * The effect did not disappear — be honest about that — but it stopped knowing
 * anything. It announces a lifecycle and nothing else: no filters in the
 * dependency array, no promise, no abort, no idea that a request exists. The
 * epic owns when to fetch, how often, what to cancel and what to retry, and
 * `consoleClosed` is the `takeUntil` that stops all of it, the socket included.
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

  // Still a route loader, still on purpose: unchanging server state the toolbar
  // cannot render without. The PRODUCTS are the experiment.
  const { categories } = useLoaderData<typeof inventoryLoader>();

  useEffect(() => {
    dispatch(consoleOpened());
    return () => {
      dispatch(consoleClosed());
    };
  }, [dispatch]);

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
        <FeedBar />
        <RecentlyInspected />
        <BulkBar />

        {status === 'loading' && <RowSkeletons />}

        {status === 'error' && (
          <ErrorNotice
            error={error}
            title="Could not load the catalogue"
            // One action. The epic knows it means "load again with the current
            // filters", and it has already retried twice with backoff before
            // this notice appeared.
            onRetry={() => dispatch(inventoryRetried())}
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
          nothing, so a reload puts every number back. The live feed is a <strong>mock</strong> served by the Vite dev
          server — see <code>vite/mockStockFeed.ts</code>.
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
