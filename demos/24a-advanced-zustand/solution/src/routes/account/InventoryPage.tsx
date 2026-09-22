import { useEffect } from 'react';
import { Alert, Card, Placeholder, Table } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listCategories } from '../../api/services/products';
import { BulkBar } from '../../components/inventory/BulkBar';
import { InventoryFilters } from '../../components/inventory/InventoryFilters';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { RecentlyInspected } from '../../components/inventory/RecentlyInspected';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Pager } from '../../components/Pager';
import { useInventoryStore } from '../../store/inventory';
import {
  selectError,
  selectPage,
  selectPageCount,
  selectStatus,
  selectTotal,
  selectVisibleIds,
} from '../../store/inventory/selectors';

/**
 * The loader still earns its place — for the data the STORE has no business
 * owning. The category list is server state that never changes and that the
 * route genuinely cannot render without. The products are the store's, on
 * purpose, and that is the whole experiment.
 */
export async function inventoryLoader({ request }: LoaderFunctionArgs) {
  return { categories: await listCategories({ signal: request.signal }) };
}

function TableSkeleton() {
  return (
    <Table className="align-middle mb-0" aria-busy="true" aria-label="Loading inventory">
      <tbody>
        {Array.from({ length: 6 }, (_, row) => (
          <tr key={row}>
            <td colSpan={5}>
              <Placeholder as="div" animation="glow">
                <Placeholder xs={row % 2 ? 8 : 6} />
              </Placeholder>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Admin-only. The guard is on the ROUTE (requireRole in router.tsx), not in here. */
export function InventoryPage() {
  const { categories } = useLoaderData<typeof inventoryLoader>();

  const status = useInventoryStore(selectStatus);
  const error = useInventoryStore(selectError);
  const total = useInventoryStore(selectTotal);
  const page = useInventoryStore(selectPage);
  const pageCount = useInventoryStore(selectPageCount);
  const visibleIds = useInventoryStore(selectVisibleIds);
  const fetchPage = useInventoryStore((state) => state.fetchPage);
  const goToPage = useInventoryStore((state) => state.goToPage);
  const retry = useInventoryStore((state) => state.retry);

  // The store is a module singleton, so it survives navigation: come back to
  // this page and the last page of products is still there. Fetch only when
  // there is nothing to show.
  useEffect(() => {
    if (useInventoryStore.getState().status === 'idle') void fetchPage(0);
  }, [fetchPage]);

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Inventory console</span>
          <span className="text-muted small">{status === 'ready' ? `${total} products` : status}</span>
        </Card.Header>
        <Card.Body>
          <InventoryFilters categories={categories} />
          <BulkBar />

          {status === 'error' && <ErrorNotice error={error} onRetry={retry} title="Could not load the catalogue" />}

          {/* `loading` with rows already on screen keeps the rows and dims them;
              `loading` from empty shows the skeleton. Two different truths. */}
          {status === 'loading' && visibleIds.length === 0 && <TableSkeleton />}

          {status === 'ready' && visibleIds.length === 0 && (
            <Alert variant="light" className="border text-center mb-0">
              Nothing matches these filters.
            </Alert>
          )}

          {visibleIds.length > 0 && (
            <div style={{ opacity: status === 'loading' ? 0.5 : 1, transition: 'opacity .15s' }}>
              <InventoryTable />
            </div>
          )}

          <Pager page={page} pageCount={pageCount} onChange={goToPage} />
        </Card.Body>
      </Card>

      <RecentlyInspected />
    </>
  );
}
