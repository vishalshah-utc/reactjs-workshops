import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { useInventoryStore } from '../../store/inventory';

/**
 * The only part of this store that survives a reload. It renders IDS — the
 * title next to each one is looked up in `entities` and simply omitted when the
 * product is not loaded, which is what makes persisting ids safe.
 */
export function RecentlyInspected() {
  const ids = useInventoryStore(useShallow((state) => state.recent.ids));
  const titles = useInventoryStore(useShallow((state) => state.recent.ids.map((id) => state.entities[id]?.title ?? `#${id}`)));
  const clearRecent = useInventoryStore((state) => state.clearRecent);

  if (ids.length === 0) return null;

  return (
    <Card className="mt-3">
      <Card.Body className="py-2 d-flex flex-wrap align-items-center gap-2">
        <span className="small text-muted me-1">Recently inspected</span>
        {ids.map((id, index) => (
          <Link key={id} to={`/products/${id}`} className="text-decoration-none">
            <Badge bg="secondary" className="fw-normal">
              {titles[index]}
            </Badge>
          </Link>
        ))}
        <Button size="sm" variant="link" className="ms-auto p-0 small" onClick={clearRecent}>
          Clear
        </Button>
      </Card.Body>
    </Card>
  );
}
