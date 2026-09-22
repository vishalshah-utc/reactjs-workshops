import { useQuery } from '@tanstack/react-query';
import { Badge, Spinner } from 'react-bootstrap';
import { stockQuery } from '../api/queries';
import { formatTime } from '../lib/format';

interface LiveStockBadgeProps {
  productId: number;
}

/**
 * Stock, polled — the one number on this page that is worth a timer.
 *
 * `select` turns 194 rows into ONE number before React sees it, and TanStack
 * compares the SELECTED value: the poll lands every fifteen seconds, and this
 * component re-renders only when this product's own stock changed. Demo 18's
 * lesson about subscribing narrowly, applied to a cache.
 */
export function LiveStockBadge({ productId }: LiveStockBadgeProps) {
  const {
    data: stock,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    ...stockQuery(),
    select: (rows) => rows.find((row) => row.id === productId)?.stock,
  });

  if (stock === undefined) return null;

  return (
    // aria-live="polite": the number changes without anybody clicking, so a screen reader
    // has to be told. "polite" queues it behind whatever the user is doing.
    <Badge bg="light" text="dark" className="border d-inline-flex align-items-center gap-1" aria-live="polite">
      {isFetching ? <Spinner size="sm" animation="border" style={{ width: 10, height: 10 }} aria-hidden="true" /> : <span aria-hidden="true">●</span>}
      Live: {stock} in stock
      <span className="text-muted fw-normal">· {formatTime(dataUpdatedAt)}</span>
    </Badge>
  );
}
