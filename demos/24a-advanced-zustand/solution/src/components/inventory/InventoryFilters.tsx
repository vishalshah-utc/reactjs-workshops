import { useState } from 'react';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { useShallow } from 'zustand/react/shallow';
import { env } from '../../config/env';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useInventoryStore } from '../../store/inventory';
import { LOW_STOCK, type SortKey } from '../../store/inventory/types';
import type { ApiCategory } from '../../types';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'stock', label: 'Stock' },
  { value: 'price', label: 'Price' },
];

/**
 * The debounce lives HERE, not in the store.
 *
 * A store action should do one thing, immediately, and be testable without
 * timers. "Wait 400 ms after the last keystroke" is a property of this input
 * box; a second caller of `setFilter` — a preset link, a test — must not
 * inherit it.
 */
export function InventoryFilters({ categories }: { categories: ApiCategory[] }) {
  const { filters, setFilter, clearFilters, debugDelayMs, setDebugDelay } = useInventoryStore(
    useShallow((state) => ({
      filters: state.filters,
      setFilter: state.setFilter,
      clearFilters: state.clearFilters,
      debugDelayMs: state.debugDelayMs,
      setDebugDelay: state.setDebugDelay,
    })),
  );

  const [draft, setDraft] = useState(filters.q);
  const pushSearch = useDebouncedCallback((value: string) => setFilter('q', value), 400);

  return (
    <Row className="g-2 align-items-end mb-3">
      <Col xs={12} md={4}>
        <Form.Label className="small fw-semibold">Search</Form.Label>
        <Form.Control
          type="search"
          size="sm"
          value={draft}
          placeholder="Title or description"
          onChange={(event) => {
            setDraft(event.target.value);
            pushSearch(event.target.value);
          }}
        />
      </Col>
      <Col xs={6} md={3}>
        <Form.Label className="small fw-semibold">Category</Form.Label>
        <Form.Select size="sm" value={filters.category} onChange={(event) => setFilter('category', event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col xs={6} md={2}>
        <Form.Label className="small fw-semibold">Sort by</Form.Label>
        <Form.Select size="sm" value={filters.sortBy} onChange={(event) => setFilter('sortBy', event.target.value as SortKey)}>
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col xs={6} md={2}>
        <Form.Label className="small fw-semibold">Order</Form.Label>
        <Form.Select size="sm" value={filters.order} onChange={(event) => setFilter('order', event.target.value as 'asc' | 'desc')}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Form.Select>
      </Col>
      <Col xs={6} md={1} className="d-grid">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            setDraft('');
            clearFilters();
          }}
        >
          Reset
        </Button>
      </Col>

      <Col xs={12} className="d-flex flex-wrap align-items-center gap-3 mt-2">
        <Form.Check
          type="switch"
          id="inventory-low-stock"
          checked={filters.lowStockOnly}
          onChange={(event) => setFilter('lowStockOnly', event.target.checked)}
          label={
            <span className="small">
              Low stock only <Badge bg="warning" text="dark">{`< ${LOW_STOCK}`}</Badge>
            </span>
          }
        />

        {/* Dev-only, and deliberately visible: a race you cannot reproduce is a race you cannot fix. */}
        {env.isDev && (
          <Form.Group className="d-flex align-items-center gap-2 ms-auto">
            <Form.Label className="small text-muted mb-0" htmlFor="inventory-delay">
              Simulated latency
            </Form.Label>
            <Form.Select
              id="inventory-delay"
              size="sm"
              style={{ width: 110 }}
              value={debugDelayMs}
              onChange={(event) => setDebugDelay(Number(event.target.value))}
            >
              <option value={0}>none</option>
              <option value={2000}>2000 ms</option>
              <option value={4000}>4000 ms</option>
            </Form.Select>
          </Form.Group>
        )}
      </Col>
    </Row>
  );
}
