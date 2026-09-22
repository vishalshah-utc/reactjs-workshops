import { Button } from 'react-bootstrap';
import { useInventoryStore } from '../../store/inventory';
import { LOW_STOCK } from '../../store/inventory/types';

/**
 * Read-only for now: it shows the number and nothing else.
 *
 * TODO(lab-4.2): make it editable. Click → a number input; Enter or the tick
 * saves through `commitStock`, Escape cancels. While the row is pending show a
 * spinner and disable it; when the row carries an error show the message ON
 * THIS ROW with a dismiss.
 *
 * Note the subscriptions: this cell reads `entities[id]?.stock` and this row's
 * status, never `entities` and never `rows`. Twelve of these on screen, and a
 * failed edit on row seven re-renders row seven.
 */
export function StockCell({ id }: { id: number }) {
  const stock = useInventoryStore((state) => state.entities[id]?.stock ?? 0);

  return (
    <Button size="sm" variant={stock < LOW_STOCK ? 'outline-warning' : 'outline-secondary'} disabled>
      {stock}
    </Button>
  );
}
