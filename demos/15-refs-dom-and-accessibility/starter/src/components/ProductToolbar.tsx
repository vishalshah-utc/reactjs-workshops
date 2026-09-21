import { Badge, Button, Form, InputGroup, Stack } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import type { SortKey } from '../lib/catalog';

/** Sort options as data — the <select> is rendered FROM this list. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: '', label: 'Default order' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Best rated' },
];

interface ProductToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  resultCount: number;
}

/**
 * CONTROLLED: the parent owns `query` and `sort`; this component renders them
 * and reports changes. It has no useState — it could not "forget" or "drift".
 */
export function ProductToolbar({ query, onQueryChange, sort, onSortChange, resultCount }: ProductToolbarProps) {
  // TODO(lab-1.1): useRenderCount('ProductToolbar') — then type in the box and read the console
  // TODO(lab-2.2): useRef<HTMLInputElement>(null) on the search input; useKeyboardShortcut('/', …) focuses and selects it

  return (
    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
      <InputGroup style={{ maxWidth: 360 }}>
        <InputGroup.Text>
          <Search />
        </InputGroup.Text>
        <Form.Control
          type="search"
          placeholder="Search products…"
          aria-label="Search products"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <Button variant="outline-secondary" onClick={() => onQueryChange('')}>
            Clear
          </Button>
        )}
      </InputGroup>

      <Form.Select
        aria-label="Sort products"
        style={{ maxWidth: 200 }}
        value={sort}
        // The DOM gives us a string; the cast lives HERE, once, not at every call site.
        onChange={(e) => onSortChange(e.target.value as SortKey)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>

      {/* TODO(lab-5.2): role="status" — the count is announced when it changes */}
      <Badge bg="secondary" className="ms-auto">
        {resultCount} results
      </Badge>
    </Stack>
  );
}
