import { Alert, Card } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listCategories } from '../../api/services/products';
import { BulkBar } from '../../components/inventory/BulkBar';
import { InventoryFilters } from '../../components/inventory/InventoryFilters';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { RecentlyInspected } from '../../components/inventory/RecentlyInspected';

/**
 * The loader still earns its place — for the data the STORE has no business
 * owning. The category list is server state that never changes and that the
 * route cannot render without. The products are the store's, on purpose, and
 * that is the whole experiment.
 */
export async function inventoryLoader({ request }: LoaderFunctionArgs) {
  return { categories: await listCategories({ signal: request.signal }) };
}

/** Admin-only. The guard is on the ROUTE (requireRole in router.tsx), not in here. */
export function InventoryPage() {
  const { categories } = useLoaderData<typeof inventoryLoader>();

  /**
   * TODO(lab-2.6): drive the page from the store's status machine.
   *   · on mount, `fetchPage(0)` — but only when `status === 'idle'`, because
   *     the store is a module singleton and survives navigation;
   *   · `loading` with nothing on screen → a skeleton; `loading` with rows
   *     already there → keep them and dim them. Two different truths;
   *   · `error` → `<ErrorNotice error={error} onRetry={retry} />`;
   *   · `ready` with no visible ids → an empty state, not a blank card;
   *   · `<Pager page={page} pageCount={pageCount} onChange={goToPage} />`.
   */
  return (
    <>
      <Card>
        <Card.Header className="fw-semibold">Inventory console</Card.Header>
        <Card.Body>
          <InventoryFilters categories={categories} />
          <BulkBar />
          <Alert variant="light" className="border">
            The store is inert until Lab 2. Every action is a stub, so the table below stays empty.
          </Alert>
          <InventoryTable />
        </Card.Body>
      </Card>

      <RecentlyInspected />
    </>
  );
}
