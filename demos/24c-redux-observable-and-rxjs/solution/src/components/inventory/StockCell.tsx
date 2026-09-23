import { useMemo, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { ArrowCounterclockwise, Check2 } from 'react-bootstrap-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  makeSelectFlash,
  makeSelectRowState,
  rowErrorDismissed,
  selectProductById,
  stockSaveRequested,
} from '../../store/inventory';

interface StockCellProps {
  id: number;
}

/**
 * F4. One row's stock, edited in place.
 *
 * The component subscribes to TWO things and nothing else: this product, and
 * this row's save state. Edit row 7 and rows 1–6 do not re-render, because
 * their `selectProductById` results are the same objects they were before.
 */
export function StockCell({ id }: StockCellProps) {
  const dispatch = useAppDispatch();

  // A selector factory, instantiated once per mounted row (see inventory.ts).
  const selectRowState = useMemo(() => makeSelectRowState(), []);
  const rowState = useAppSelector((state) => selectRowState(state, id));
  const stock = useAppSelector((state) => selectProductById(state, id)?.stock ?? 0);

  // The live feed's highlight. One more selector factory, one more per-row
  // subscription — a tick that touches two rows re-renders two cells.
  const selectFlash = useMemo(() => makeSelectFlash(), []);
  const flash = useAppSelector((state) => selectFlash(state, id));

  const [draft, setDraft] = useState(String(stock));
  const [editing, setEditing] = useState(false);

  /**
   * The optimistic write, the rollback, the bulk restock AND the live feed all
   * change `stock` underneath this component. When the cell is not being
   * edited, follow the store.
   *
   * The feed is why this matters more than it did in Demo 24b: a number can
   * now change while you are looking at it and not touching it. Note the
   * matching guard in the `feed/ticked` reducer — a row that is mid-save is
   * skipped, because the user's intention outranks the server's opinion.
   *
   * This is React's "adjusting state when a prop changes" pattern, not an
   * effect: it runs DURING the render, React throws the render away and
   * re-runs it immediately, and nothing is ever painted with the stale value.
   * An effect would paint the old number for one frame — and the linter's
   * `set-state-in-effect` rule exists to say so.
   */
  const [lastStock, setLastStock] = useState(stock);
  if (stock !== lastStock) {
    setLastStock(stock);
    if (!editing) setDraft(String(stock));
  }

  const saving = rowState?.status === 'saving';

  function commit() {
    setEditing(false);
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0) {
      setDraft(String(stock));
      return;
    }
    if (next === stock) return;
    if (rowState?.status === 'error') dispatch(rowErrorDismissed(id));
    /**
     * A plain action, not a thunk. Nothing is returned, so there is no promise
     * to `void`, nothing to `await` and nothing to `.unwrap()`. The reducer
     * writes the optimistic value; `saveStockEpic` sees the same action and
     * sends the PATCH. Neither knows about the other.
     */
    dispatch(stockSaveRequested({ id, stock: next }));
  }

  return (
    <div className="d-flex flex-column gap-1" style={{ minWidth: 130 }}>
      <div className="d-flex align-items-center gap-1">
        <Form.Control
          size="sm"
          type="number"
          className={flash ? `feed-flash feed-flash-${flash}` : undefined}
          min={0}
          value={draft}
          aria-label={`Stock for product ${id}`}
          style={{ width: 80 }}
          disabled={saving}
          onFocus={() => setEditing(true)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setDraft(String(stock));
              setEditing(false);
              event.currentTarget.blur();
            }
          }}
        />
        {saving && <Spinner animation="border" size="sm" role="status" aria-label="Saving" />}
        {!saving && rowState?.status === 'error' && (
          <Button
            size="sm"
            variant="link"
            className="p-0 text-danger"
            title={rowState.error}
            aria-label={`Dismiss error for product ${id}`}
            onClick={() => dispatch(rowErrorDismissed(id))}
          >
            <ArrowCounterclockwise />
          </Button>
        )}
        {!saving && !rowState && editing && <Check2 className="text-success" aria-hidden />}
      </div>

      {rowState?.status === 'error' && (
        <span className="small text-danger" role="status">
          {rowState.error}
        </span>
      )}
    </div>
  );
}
