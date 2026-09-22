import { Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router';

/**
 * TODO(lab-6.5): the SAME console, built on RTK Query.
 *
 *   const { data, error, isLoading, isFetching, refetch } = useGetInventoryQuery(filters);
 *
 * One line for F1 and F3 together: the argument IS the cache key, so changing a
 * filter is a different entry and there is nothing to race. The thunk, the
 * status machine, the requestId guard, the `condition` dedupe, the
 * AbortController wiring and the entity adapter do not move here — they are
 * gone, because `createApi` generates them.
 *
 * Reuse `<InventoryToolbar>` and `<Pager>` unchanged: the filters slice is
 * still the filters slice. Build the rows inline with `useSetStockMutation` and
 * `selectFromResult`, and keep this page next to InventoryPage.tsx while you
 * count the lines.
 *
 * `isFetching` (a request is in flight) versus `isLoading` (and we have nothing
 * to show) is the distinction that lets the table stay on screen, dimmed,
 * instead of collapsing into a skeleton on every keystroke.
 */
export function InventoryQueryPage() {
  return (
    <Card>
      <Card.Header className="fw-semibold d-flex justify-content-between flex-wrap gap-2">
        <span>Inventory console · RTK Query</span>
        <Link to="/account/inventory" className="small">
          ← Back to the hand-written thunk version
        </Link>
      </Card.Header>
      <Card.Body>
        <Alert variant="light" className="border text-center text-muted mb-0">
          Lab 6 builds this page.
        </Alert>
      </Card.Body>
    </Card>
  );
}
