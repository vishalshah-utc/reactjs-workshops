import { useState } from 'react';
import { Alert, Badge, Card, Form, Placeholder, Spinner, Table } from 'react-bootstrap';
import { Link, useLoaderData } from 'react-router';
import type { inventoryLoader } from './inventoryLoader';
import { useGetInventoryQuery, useSetStockMutation } from '../../api/inventoryApi';
import { ErrorNotice } from '../../components/ErrorNotice';
import { Pager } from '../../components/Pager';
import { InventoryToolbar } from '../../components/inventory/InventoryToolbar';
import { formatPrice } from '../../lib/format';
import { StockBadge } from '../../components/StockBadge';
import { LOW_STOCK, PAGE_SIZE, pageChanged, selectFilters, type FiltersState } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { ApiErrorInfo } from '../../lib/errorInfo';

/**
 * The SAME console, built on RTK Query.
 *
 * Read this next to InventoryPage.tsx and store/inventory.ts. The feature is
 * identical. The thunk, the status machine, the requestId race guard, the
 * `condition` dedupe, the AbortController wiring and the entity adapter have
 * all gone — not been moved, gone — because `createApi` generates them.
 */
export function InventoryQueryPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  // The ONE thing here that still comes from a route loader. Unchanging server
  // state the toolbar cannot render without, so the route blocks on it and the
  // store has nothing to add. The PRODUCTS are the experiment.
  const { categories } = useLoaderData<typeof inventoryLoader>();

  /**
   * One line for F1 and F3 together. The argument IS the cache key: change a
   * filter and this is a different entry, so there is nothing to race. The old
   * entry is still in the cache, which is why going back to page 1 is instant.
   *
   * `isFetching` (a request is in flight) vs `isLoading` (and we have nothing
   * to show) is the distinction that lets the table stay on screen, dimmed,
   * instead of collapsing into a skeleton on every keystroke.
   */
  const { data, error, isLoading, isFetching, refetch } = useGetInventoryQuery(filters);

  const rows = (data?.products ?? []).filter((product) => !filters.lowStockOnly || product.stock < LOW_STOCK);
  const pageCount = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <Card>
      <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <span className="fw-semibold">Inventory console · RTK Query</span>
        {isFetching && !isLoading && (
          <Badge bg="info">
            <Spinner animation="border" size="sm" className="me-1" /> refreshing
          </Badge>
        )}
        <Link to="/account/inventory" className="small">
          ← Back to the hand-written thunk version
        </Link>
      </Card.Header>

      <Card.Body>
        <InventoryToolbar categories={categories} />

        {isLoading && <Placeholder as="div" animation="glow" className="py-4" xs={12} />}

        {/* The error is already an ApiErrorInfo: that is what the custom
            baseQuery returns, so nothing here knows about axios either. */}
        {error !== undefined && (
          <ErrorNotice error={error as ApiErrorInfo} title="Could not load the catalogue" onRetry={() => void refetch()} />
        )}

        {!isLoading && !error && rows.length === 0 && (
          <Alert variant="light" className="border text-center text-muted mb-0">
            Nothing matches those filters.
          </Alert>
        )}

        {rows.length > 0 && (
          <Table hover responsive className="align-middle mb-0" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th className="d-none d-md-table-cell">Category</th>
                <th className="text-end d-none d-sm-table-cell">Price</th>
                <th>Stock</th>
                <th className="d-none d-lg-table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}`} className="text-decoration-none">
                      {product.title}
                    </Link>
                    <div className="small text-muted">#{product.id}</div>
                  </td>
                  <td className="d-none d-md-table-cell text-muted text-capitalize">{product.category}</td>
                  <td className="text-end d-none d-sm-table-cell">{formatPrice(product.price)}</td>
                  <td>
                    <QueryStockCell id={product.id} stock={product.stock} filters={filters} />
                  </td>
                  <td className="d-none d-lg-table-cell">
                    <StockBadge stock={product.stock} lowStockThreshold={LOW_STOCK} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <Card.Footer>
        <Pager page={filters.page} pageCount={pageCount} onChange={(page) => dispatch(pageChanged(page))} />
      </Card.Footer>
    </Card>
  );
}

interface QueryStockCellProps {
  id: number;
  stock: number;
  filters: FiltersState;
}

function QueryStockCell({ id, stock, filters }: QueryStockCellProps) {
  const [draft, setDraft] = useState(String(stock));
  // Follow the cache — including the optimistic write and its rollback.
  const [lastStock, setLastStock] = useState(stock);
  if (stock !== lastStock) {
    setLastStock(stock);
    setDraft(String(stock));
  }

  /**
   * `selectFromResult` is the performance escape hatch: this component
   * subscribes to the mutation's result but re-renders only when the two
   * fields it names change. Without it, every mutation state change in the
   * component re-renders it.
   */
  const [setStock, { isLoading: saving, error: saveError }] = useSetStockMutation({
    selectFromResult: ({ isLoading, error }) => ({ isLoading, error }),
  });

  return (
    <div className="d-flex flex-column gap-1" style={{ minWidth: 120 }}>
      <div className="d-flex align-items-center gap-1">
        <Form.Control
          size="sm"
          type="number"
          min={0}
          value={draft}
          disabled={saving}
          aria-label={`Stock for product ${id}`}
          style={{ width: 80 }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const next = Number(draft);
            if (!Number.isFinite(next) || next < 0 || next === stock) {
              setDraft(String(stock));
              return;
            }
            // No `.unwrap()`: the rollback is in onQueryStarted, and this
            // component does not need to know whether it worked.
            void setStock({ id, stock: next, filters });
          }}
        />
        {saving && <Spinner animation="border" size="sm" role="status" aria-label="Saving" />}
      </div>
      {saveError !== undefined && <span className="small text-danger">{(saveError as ApiErrorInfo).message}</span>}
    </div>
  );
}
