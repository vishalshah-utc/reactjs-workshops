import { Nav } from 'react-bootstrap';

/**
 * A row of category pills. It holds NO state of its own: it is told which
 * pill is active and calls back when one is clicked. Lab 3.1 finishes it.
 */
// TODO(lab-3.1): props { categories: CategoryOption[]; activeId: string; onSelect: (id: string) => void } — render one pill per category
export function CategoryStrip() {
  return (
    <Nav variant="pills" className="mb-3">
      <Nav.Item>
        <Nav.Link active>All</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}
