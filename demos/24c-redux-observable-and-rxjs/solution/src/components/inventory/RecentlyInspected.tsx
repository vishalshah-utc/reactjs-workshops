import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recentCleared, selectRecentProducts } from '../../store/recent';

/**
 * F6. The last eight products opened from the console, surviving a reload.
 *
 * The list is persisted; the TITLES are not. A title is the catalogue's, and
 * caching somebody else's data in localStorage is how a UI shows a name that
 * was changed three weeks ago. So the store keeps ids, and a title appears
 * only when the product happens to be on the page in front of you.
 */
export function RecentlyInspected() {
  const dispatch = useAppDispatch();
  const recent = useAppSelector(selectRecentProducts);

  if (recent.length === 0) return null;

  return (
    <Card className="mb-3">
      <Card.Body className="py-2 d-flex align-items-center gap-2 flex-wrap">
        <span className="small text-muted me-1">Recently inspected</span>
        {recent.map((item) => (
          <Link key={item.id} to={`/products/${item.id}`} className="text-decoration-none">
            <Badge bg="light" text="dark" className="border">
              {item.title ?? `#${item.id}`}
            </Badge>
          </Link>
        ))}
        <Button size="sm" variant="link" className="ms-auto p-0 small" onClick={() => dispatch(recentCleared())}>
          Clear
        </Button>
      </Card.Body>
    </Card>
  );
}
