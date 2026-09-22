import { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { ArrowCounterclockwise, Check2, XLg } from 'react-bootstrap-icons';
import { useInventoryStore } from '../../store/inventory';
import { selectProduct, selectRowState } from '../../store/inventory/selectors';
import { LOW_STOCK } from '../../store/inventory/types';

/**
 * One cell, three subscriptions, all of them narrow: this product, this row's
 * status, and the action. Twelve of these on screen and a failed edit on row
 * seven re-renders row seven.
 */
export function StockCell({ id }: { id: number }) {
  const stock = useInventoryStore((state) => selectProduct(id)(state)?.stock ?? 0);
  const row = useInventoryStore(selectRowState(id));
  const commitStock = useInventoryStore((state) => state.commitStock);
  const dismissRowError = useInventoryStore((state) => state.dismissRowError);

  // `editing` is null when the cell is idle, and holds the DRAFT while it is
  // being edited. One piece of state, not two — so there is no moment where
  // "editing" and "the draft" can disagree, and no effect syncing them. (An
  // effect that copies a value into state is the mistake `eslint-plugin-
  // react-hooks` calls "cascading renders", and it is right: the store already
  // holds the truth, so the copy only exists while the user is typing over it.)
  const [editing, setEditing] = useState<number | null>(null);
  const draft = editing ?? stock;
  const setDraft = (value: number) => setEditing(value);

  function save() {
    setEditing(null);
    if (Number.isFinite(draft) && draft !== stock) void commitStock(id, draft);
  }

  if (editing !== null) {
    return (
      <div className="d-flex align-items-center gap-1" style={{ maxWidth: 140 }}>
        <Form.Control
          type="number"
          size="sm"
          min={0}
          autoFocus
          value={Number.isNaN(draft) ? '' : draft}
          aria-label={`Stock for product ${id}`}
          onChange={(event) => setDraft((event.target as HTMLInputElement).valueAsNumber)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
            if (event.key === 'Escape') setEditing(null);
          }}
        />
        <Button size="sm" variant="outline-success" onClick={save} aria-label="Save stock">
          <Check2 />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => setEditing(null)}
          aria-label="Cancel"
        >
          <XLg />
        </Button>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        size="sm"
        variant={stock < LOW_STOCK ? 'outline-warning' : 'outline-secondary'}
        disabled={row.pending}
        onClick={() => setEditing(stock)}
        // aria-live so a rollback is announced, not just repainted
        aria-live="polite"
      >
        {row.pending ? <Spinner animation="border" size="sm" /> : stock}
      </Button>
      {row.error && (
        <span className="text-danger small d-inline-flex align-items-center gap-1">
          <ArrowCounterclockwise />
          {row.error}
          <Button size="sm" variant="link" className="p-0 small" onClick={() => dismissRowError(id)}>
            dismiss
          </Button>
        </span>
      )}
    </div>
  );
}
