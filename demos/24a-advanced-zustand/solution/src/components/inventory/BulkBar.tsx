import { Alert, Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { ArrowCounterclockwise, BoxArrowUp } from 'react-bootstrap-icons';
import { useShallow } from 'zustand/react/shallow';
import { useInventoryStore } from '../../store/inventory';
import { selectVisibleIds } from '../../store/inventory/selectors';

const RESTOCK_BY = 10;

/**
 * Selection, the bulk action, and the honest report. Nothing here knows how the
 * requests are run — that is `mapWithConcurrency` inside the store's action.
 */
export function BulkBar() {
  const visibleIds = useInventoryStore(selectVisibleIds);
  const selectedCount = useInventoryStore((state) => state.selected.length);
  const bulkStatus = useInventoryStore((state) => state.bulkStatus);
  const report = useInventoryStore((state) => state.bulkReport);
  const canUndo = useInventoryStore((state) => state.undoSnapshot !== null);

  const { selectMany, clearSelection, bulkRestock, undoBulk, dismissReport } = useInventoryStore(
    useShallow((state) => ({
      selectMany: state.selectMany,
      clearSelection: state.clearSelection,
      bulkRestock: state.bulkRestock,
      undoBulk: state.undoBulk,
      dismissReport: state.dismissReport,
    })),
  );

  const running = bulkStatus === 'running';

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => selectMany(visibleIds)} disabled={visibleIds.length === 0}>
            Select page
          </Button>
          <Button variant="outline-secondary" onClick={clearSelection} disabled={selectedCount === 0}>
            Clear
          </Button>
        </ButtonGroup>

        <span className="text-muted small">{selectedCount} selected</span>

        <Button size="sm" variant="primary" disabled={selectedCount === 0 || running} onClick={() => void bulkRestock(RESTOCK_BY)}>
          {running ? <Spinner animation="border" size="sm" className="me-1" /> : <BoxArrowUp className="me-1" />}
          {`+${RESTOCK_BY} stock to selected`}
        </Button>

        {canUndo && (
          <Button size="sm" variant="outline-warning" onClick={undoBulk} disabled={running}>
            <ArrowCounterclockwise className="me-1" />
            Undo
          </Button>
        )}
      </div>

      {report && (
        <Alert
          variant={report.failed.length === 0 ? 'success' : 'warning'}
          dismissible
          onClose={dismissReport}
          className="py-2"
        >
          <div className="small">
            {/* PARTIAL failure, said out loud. "Something went wrong" would be a lie about 9 of 10 rows. */}
            {`${report.succeeded.length} of ${report.attempted} updated`}
            {report.failed.length > 0 && ` · ${report.failed.length} rolled back`}
          </div>
          {report.failed.length > 0 && (
            <ul className="small mb-0 mt-1">
              {report.failed.map((failure) => (
                <li key={failure.id}>
                  <span className="font-monospace">#{failure.id}</span> — {failure.message}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
    </>
  );
}
