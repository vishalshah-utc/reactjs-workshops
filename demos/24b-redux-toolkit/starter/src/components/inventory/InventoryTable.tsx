import { Alert } from 'react-bootstrap';

/**
 * TODO(lab-3.3): the table, driven by IDS.
 *
 *  - `useAppSelector(selectVisibleIds)` here, then `visibleIds.map((id) => <InventoryRow id={id} />)`;
 *  - each `InventoryRow` selects its OWN entity with `selectProductById(state, id)`
 *    and its own selection flag through the `makeSelectIsSelected` factory.
 *
 * The alternative — select the whole array here and map objects — re-renders
 * all twelve rows whenever any one of them changes, which is exactly what
 * normalisation exists to avoid. You will measure that in Verify.
 *
 * The title link dispatches `inspected(id)` — that is what F6 records.
 * The stock column is `<StockCell id={id} />`, which Lab 4 builds.
 */
export function InventoryTable() {
  return (
    <Alert variant="light" className="border text-center text-muted mb-0">
      Lab 3 builds this table.
    </Alert>
  );
}
