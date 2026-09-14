import { Badge, Nav } from 'react-bootstrap';
import type { CategoryOption } from '../types';

interface CategoryStripProps {
  categories: CategoryOption[];
  activeId: string;
  /** Reports the id in the PARENT's vocabulary — a string, not an event. */
  onSelect: (id: string) => void;
}

/**
 * A CONTROLLED component: it owns no state. The parent tells it which pill is
 * active (`activeId`) and it reports clicks (`onSelect`). That is the default
 * shape for anything reusable — the same strip can drive a grid, a URL, or a
 * server query, and it never has to know which.
 */
// TODO(lab-2.2): categories now come from the API without counts — make the count badge optional
export function CategoryStrip({ categories, activeId, onSelect }: CategoryStripProps) {
  return (
    <Nav
      variant="pills"
      className="flex-nowrap overflow-auto pb-2 mb-3"
      activeKey={activeId}
      // react-bootstrap's onSelect hands us `string | null`; "all" is our null.
      onSelect={(key) => onSelect(key ?? 'all')}
    >
      <Nav.Item>
        <Nav.Link eventKey="all" className="text-nowrap">
          All
        </Nav.Link>
      </Nav.Item>
      {categories.map((category) => (
        <Nav.Item key={category.id}>
          <Nav.Link eventKey={category.id} className="text-capitalize text-nowrap">
            {category.name}
            <Badge bg="secondary" pill className="ms-1">
              {category.count}
            </Badge>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}
