import { Form } from 'react-bootstrap';

interface StockCellProps {
  id: number;
}

/**
 * TODO(lab-4.3): one row's stock, edited in place.
 *
 * Subscribe to TWO things and nothing else: this product's stock
 * (`selectProductById`) and this row's save state (the `makeSelectRowState`
 * factory, instantiated once per row inside a `useMemo`).
 *
 * Commit on blur and on Enter; abandon on Escape. `dispatch(saveStock({ id, stock }))`
 * and then forget about it — the reducers own the optimistic write, the
 * confirmation and the rollback, so this component never awaits anything and
 * never holds a `try/catch`.
 *
 * Show the row's spinner while `status === 'saving'` and the row's message
 * while `status === 'error'`. Per-row state, never one global flag.
 */
export function StockCell({ id }: StockCellProps) {
  return <Form.Control size="sm" type="number" disabled aria-label={`Stock for product ${id}`} style={{ width: 80 }} />;
}
