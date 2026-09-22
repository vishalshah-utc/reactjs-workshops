import { useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  categoryChanged,
  filtersCleared,
  lowStockToggled,
  latencyChanged,
  searchChanged,
  selectFilters,
  sortChanged,
  type SortKey,
} from '../../store/filters';
import { env } from '../../config/env';
import type { CategoryOption } from '../../types';

/** Dev-only. DummyJSON's `?delay=` in milliseconds, on every request. */
const LATENCIES = [
  { value: 0, label: 'No added latency' },
  { value: 2000, label: '2 s — watch the race' },
  { value: 4000, label: '4 s — watch it slowly' },
];

const SORTS: { value: string; label: string }[] = [
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'stock:asc', label: 'Stock, lowest first' },
  { value: 'stock:desc', label: 'Stock, highest first' },
  { value: 'price:asc', label: 'Price, lowest first' },
  { value: 'price:desc', label: 'Price, highest first' },
];

interface InventoryToolbarProps {
  categories: CategoryOption[];
}

export function InventoryToolbar({ categories }: InventoryToolbarProps) {
  const dispatch = useAppDispatch();
  // ONE subscription to the filters object. It is a stable reference between
  // filter changes, so this component re-renders only when a filter changes.
  const filters = useAppSelector(selectFilters);

  /**
   * The draft is LOCAL. Every keystroke in the store would be an action per
   * character in the devtools and a render of every subscriber; debouncing into
   * the store keeps the action log readable and the fetch count honest.
   */
  const [draft, setDraft] = useState(filters.q);
  const commit = useDebouncedCallback((value: string) => dispatch(searchChanged(value)), 400);

  // Reset and sign-out both empty `filters.q`; the box has to follow or it
  // lies. Adjusted during render rather than in an effect — see StockCell.
  const [lastCommitted, setLastCommitted] = useState(filters.q);
  if (filters.q !== lastCommitted) {
    setLastCommitted(filters.q);
    setDraft(filters.q);
  }

  return (
    <Row className="g-2 align-items-end mb-3">
      <Col md={4}>
        <Form.Label htmlFor="inv-search" className="small text-muted mb-1">
          Search
        </Form.Label>
        <Form.Control
          id="inv-search"
          type="search"
          value={draft}
          placeholder="Title or description"
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
        />
      </Col>

      <Col md={3}>
        <Form.Label htmlFor="inv-category" className="small text-muted mb-1">
          Category
        </Form.Label>
        <Form.Select
          id="inv-category"
          value={filters.category}
          onChange={(event) => dispatch(categoryChanged(event.target.value))}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Form.Select>
      </Col>

      <Col md={3}>
        <Form.Label htmlFor="inv-sort" className="small text-muted mb-1">
          Sort
        </Form.Label>
        <Form.Select
          id="inv-sort"
          value={`${filters.sortBy}:${filters.order}`}
          onChange={(event) => {
            const [sortBy, order] = event.target.value.split(':');
            // The prepare callback takes two arguments; the action has one payload.
            dispatch(sortChanged(sortBy as SortKey, order === 'desc' ? 'desc' : 'asc'));
          }}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </Form.Select>
      </Col>

      <Col md={2} className="d-flex align-items-center gap-2">
        <Form.Check
          type="switch"
          id="inv-low-stock"
          label="Low stock"
          checked={filters.lowStockOnly}
          onChange={() => dispatch(lowStockToggled())}
        />
        <Button variant="outline-secondary" size="sm" onClick={() => dispatch(filtersCleared())}>
          Reset
        </Button>
      </Col>

      {/* An INSTRUMENT, not a feature. `import.meta.env.DEV` is a compile-time
          constant, so this whole block is unreachable in a build and Rollup
          drops it — the same trick Demo 18 used for the render profiler. */}
      {env.isDev && (
        <Col xs={12}>
          <Form.Label htmlFor="inv-latency" className="small text-muted mb-1">
            Simulated latency (development only)
          </Form.Label>
          <Form.Select
            id="inv-latency"
            size="sm"
            style={{ maxWidth: 260 }}
            value={filters.delayMs}
            onChange={(event) => dispatch(latencyChanged(Number(event.target.value)))}
          >
            {LATENCIES.map((latency) => (
              <option key={latency.value} value={latency.value}>
                {latency.label}
              </option>
            ))}
          </Form.Select>
        </Col>
      )}
    </Row>
  );
}
