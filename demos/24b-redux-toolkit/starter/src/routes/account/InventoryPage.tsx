import { Alert, Card } from 'react-bootstrap';
import { Link, useLoaderData } from 'react-router';
import type { inventoryLoader } from './inventoryLoader';
import { BulkBar } from '../../components/inventory/BulkBar';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { InventoryToolbar } from '../../components/inventory/InventoryToolbar';
import { RecentlyInspected } from '../../components/inventory/RecentlyInspected';

/**
 * F1. No loader. The STORE owns the async, and this page is the thing that asks
 * it to start.
 *
 * That is a deliberate choice and it costs something: no blocking navigation,
 * no route error boundary, and a skeleton the user sees. What it buys is that
 * the data, the filters, the per-row edit state and the bulk progress are all
 * in one place that survives this component.
 */
export function InventoryPage() {
  // The ONE thing here that still comes from a route loader. Unchanging server
  // state the toolbar cannot render without, so the route blocks on it and the
  // store has nothing to add. The PRODUCTS are the experiment.
  const { categories } = useLoaderData<typeof inventoryLoader>();

  /**
   * TODO(lab-2.5): ask the store to load, and abort when you stop caring.
   *
   *   const filters = useAppSelector(selectFilters);
   *   useEffect(() => {
   *     const promise = dispatch(loadInventory(filters));
   *     return () => promise.abort();
   *   }, [dispatch, filters]);
   *
   * `filters` is the slice's state object, so its identity changes only when a
   * filter actually changes — this effect runs once per filter change, not once
   * per render. The returned `.abort()` is the AbortController half of F3: it
   * aborts the thunk, which aborts the `signal` the service was given, which
   * aborts the axios request. The requestId check in the reducer is the other
   * half, for the response that was already on the wire.
   */

  /**
   * TODO(lab-3.4): render the status machine.
   *
   * Four values, four branches, and no combination of booleans that could show
   * two of them at once: `loading` → skeleton rows, `error` → `<ErrorNotice>`
   * with a Retry that re-dispatches, `ready` with nothing visible → an empty
   * state, `ready` with rows → `<InventoryTable />`. Then the `<Pager>` in the
   * footer, dispatching `pageChanged`.
   */
  return (
    <Card>
      <Card.Header className="fw-semibold d-flex justify-content-between flex-wrap gap-2">
        <span>Inventory console</span>
        <Link to="/account/inventory/rtkq" className="small">
          Same page, built with RTK Query →
        </Link>
      </Card.Header>
      <Card.Body>
        <InventoryToolbar categories={categories} />
        <RecentlyInspected />
        <BulkBar />
        <InventoryTable />
      </Card.Body>
      <Card.Footer>
        <Alert variant="light" className="border mb-0 small text-muted">
          Reads are real. DummyJSON <strong>simulates</strong> writes: a PATCH returns the right response and changes
          nothing, so a reload puts every number back.
        </Alert>
      </Card.Footer>
    </Card>
  );
}
