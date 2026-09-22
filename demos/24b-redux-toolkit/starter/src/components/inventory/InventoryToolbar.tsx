import { Col, Form, Row } from 'react-bootstrap';
import { env } from '../../config/env';
import type { CategoryOption } from '../../types';

interface InventoryToolbarProps {
  categories: CategoryOption[];
}

/**
 * TODO(lab-1.5): read with a selector, write with an action.
 *
 *  - `const dispatch = useAppDispatch();`
 *  - `const filters = useAppSelector(selectFilters);` — ONE subscription to a
 *    stable object, so this re-renders only when a filter actually changes;
 *  - the search box keeps a LOCAL draft and debounces into the store through
 *    `useDebouncedCallback` (Demo 7). Every keystroke in the store would be an
 *    action per character in the devtools and a render of every subscriber;
 *  - the category select, the sort select and the "Low stock" switch each
 *    dispatch their action directly. `sortChanged` takes TWO arguments — that
 *    is the `prepare` callback from Lab 1.
 *
 * When `filters.q` changes underneath you (Reset, sign-out), the draft has to
 * follow. Adjust it DURING the render, not in an effect — the linter's
 * `set-state-in-effect` rule will tell you the same thing.
 *
 * The "Simulated latency" select at the bottom is already written for you
 * except for its dispatch: it is an INSTRUMENT, not a feature, it dispatches
 * `latencyChanged`, and it is behind `env.isDev` so a build drops it entirely.
 * Every Verify step in this demo that says "make it slow" uses it.
 */
export function InventoryToolbar({ categories }: InventoryToolbarProps) {
  return (
    <Row className="g-2 align-items-end mb-3">
      <Col md={4}>
        <Form.Label htmlFor="inv-search" className="small text-muted mb-1">
          Search
        </Form.Label>
        <Form.Control id="inv-search" type="search" placeholder="Title or description" disabled />
      </Col>
      <Col md={3}>
        <Form.Label htmlFor="inv-category" className="small text-muted mb-1">
          Category
        </Form.Label>
        <Form.Select id="inv-category" disabled>
          <option value="">All categories ({categories.length})</option>
        </Form.Select>
      </Col>
      <Col md={5} className="small text-muted">
        Lab 1 wires this toolbar to the store.
      </Col>

      {env.isDev && (
        <Col xs={12}>
          <Form.Label htmlFor="inv-latency" className="small text-muted mb-1">
            Simulated latency (development only)
          </Form.Label>
          <Form.Select id="inv-latency" size="sm" style={{ maxWidth: 260 }} disabled>
            <option>No added latency</option>
            <option>2 s — watch the race</option>
            <option>4 s — watch it slowly</option>
          </Form.Select>
        </Col>
      )}
    </Row>
  );
}
