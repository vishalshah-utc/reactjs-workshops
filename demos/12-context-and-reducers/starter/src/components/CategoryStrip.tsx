import { Badge, Nav } from 'react-bootstrap';
import type { CategoryOption } from '../types';

interface CategoryStripProps {
  categories: CategoryOption[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * A CONTROLLED component: it owns no state. The parent tells it which pill is
 * active (`activeId`) and it reports clicks (`onSelect`).
 * `count` is optional — the API's category list doesn't carry one.
 */
export function CategoryStrip({ categories, activeId, onSelect }: CategoryStripProps) {
  return (
    <Nav
      variant="pills"
      className="flex-nowrap overflow-auto pb-2 mb-3"
      activeKey={activeId}
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
            {category.count != null && (
              <Badge bg="secondary" pill className="ms-1">
                {category.count}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}
