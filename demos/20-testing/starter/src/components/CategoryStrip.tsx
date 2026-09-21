import { Badge, Nav } from 'react-bootstrap';
import { useControllableState } from '../hooks/useControllableState';
import type { CategoryOption } from '../types';

interface CategoryStripProps {
  categories: CategoryOption[];
  /** CONTROLLED: the parent owns the active category id ('all' for none). */
  value?: string;
  /** UNCONTROLLED: the pill to start on. */
  defaultValue?: string;
  /** Fires in both modes — the `onChange` contract: always the VALUE, never an event or a key that may be null. */
  onChange?: (id: string) => void;
}

/**
 * Controlled OR uncontrolled. On /products the URL owns the category and this is controlled; drop it into a
 * widget with no URL and it manages itself. `count` is optional — the API's category list doesn't carry one.
 */
export function CategoryStrip({ categories, value, defaultValue = 'all', onChange }: CategoryStripProps) {
  const [activeId, setActiveId] = useControllableState({ value, defaultValue, onChange });

  return (
    <Nav
      variant="pills"
      className="flex-nowrap overflow-auto pb-2 mb-3"
      activeKey={activeId}
      onSelect={(key) => setActiveId(key ?? 'all')}
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
