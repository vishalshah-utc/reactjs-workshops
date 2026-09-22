import { Alert, Badge, Button, ProgressBar, Stack } from 'react-bootstrap';
import { ArrowCounterclockwise, BoxSeam } from 'react-bootstrap-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  bulkRestockRequested,
  bulkSnapshotDropped,
  bulkUndoRequested,
  selectBulk,
  selectHasSnapshot,
  selectSelectedIds,
  selectionCleared,
} from '../../store/inventory';

const RESTOCK_AMOUNT = 10;

/**
 * F5. Selection, bulk restock, honest partial failure, and undo.
 *
 * Note what this component does NOT contain: the twelve requests, the
 * concurrency limit and the cancellation. It dispatches ONE action and reads
 * the progress back out of the store — which is why the operation survives
 * navigating away from this page.
 */
export function BulkBar() {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedIds);
  const bulk = useAppSelector(selectBulk);
  const hasSnapshot = useAppSelector(selectHasSnapshot);

  const running = bulk.status === 'running';

  return (
    <Stack gap={2} className="mb-3">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <Badge bg={selectedIds.length ? 'primary' : 'secondary'}>{selectedIds.length} selected</Badge>

        <Button
          size="sm"
          variant="primary"
          disabled={selectedIds.length === 0 || running}
          onClick={() => dispatch(bulkRestockRequested(RESTOCK_AMOUNT, selectedIds))}
        >
          <BoxSeam className="me-1" />+{RESTOCK_AMOUNT} stock to selected
        </Button>

        <Button
          size="sm"
          variant="outline-secondary"
          disabled={selectedIds.length === 0 || running}
          onClick={() => dispatch(selectionCleared())}
        >
          Clear selection
        </Button>

        {hasSnapshot && !running && (
          <Button size="sm" variant="outline-warning" onClick={() => dispatch(bulkUndoRequested())}>
            <ArrowCounterclockwise className="me-1" />
            Undo restock
          </Button>
        )}
      </div>

      {running && (
        <ProgressBar
          now={bulk.total ? (bulk.done / bulk.total) * 100 : 0}
          label={`${bulk.done} / ${bulk.total}`}
          aria-label="Bulk restock progress"
        />
      )}

      {bulk.status === 'done' && (
        <Alert
          variant={bulk.failed.length ? 'warning' : 'success'}
          dismissible
          onClose={() => dispatch(bulkSnapshotDropped())}
          className="mb-0 py-2"
        >
          {/* An honest report: how many worked, how many did not, and why. */}
          {bulk.total - bulk.failed.length} of {bulk.total} rows restocked.
          {bulk.failed.length > 0 && (
            <ul className="mb-0 small mt-1">
              {bulk.failed.map((failure) => (
                <li key={failure.id}>
                  #{failure.id}: {failure.reason}
                </li>
              ))}
            </ul>
          )}
          {bulk.failed.length === 0 && ' Dismissing this discards the undo snapshot.'}
        </Alert>
      )}
    </Stack>
  );
}
