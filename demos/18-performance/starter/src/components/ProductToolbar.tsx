import { useRef } from 'react';
import { Badge, Button, Form, InputGroup, Stack } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import type { SortKey } from '../lib/catalog';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useRenderCount } from '../hooks/useRenderCount';
import styles from './ProductToolbar.module.css';

/** Sort options as data — the <select> is rendered FROM this list. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: '', label: 'Default order' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Best rated' },
];

// TODO(lab-1.4): add a DEV-ONLY `<Form.Check type="switch" label="Slow mode">` here, behind
//   `import.meta.env.DEV`, driven by a `slow` / `onSlowChange` prop pair from ProductsPage.
// TODO(lab-2.1): the search DRAFT moves in here. Take `query` + `onQueryCommit` instead of
//   `query` + `onQueryChange`, keep the draft in this component's own useState, debounce the
//   commit with useDebouncedCallback(onQueryCommit, 400), and adopt an outside change to `query`
//   with the "adjust state when a prop changes" pattern. ProductsPage loses four locals.
// TODO(lab-4.1): a second input — the client-side quick filter over the page already loaded.
//   CONTROLLED (`quickFilter` / `onQuickFilterChange`): the grid needs the value, so the page owns it.
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
  useRenderCount('ProductToolbar'); // watch the console while you type: the box re-renders, the badge doesn't care

  // A DOM ref: null during render, the <input> once React has committed. Only ever touched in a handler.
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcut('/', () => {
    searchRef.current?.focus();
    searchRef.current?.select(); // the old query is selected: typing replaces it, Escape keeps it
  });

  return (
    // Stack's `gap` is responsive; its `direction` is not (one string, no breakpoints). So: a vertical Stack —
    // the mobile default — turned into a row from md up by the utility that Stack itself is made of.
    <Stack gap={2} className="mb-3 flex-md-row align-items-md-center">
      <InputGroup className={styles.search}>
        <InputGroup.Text>
          <Search />
        </InputGroup.Text>
        <Form.Control
          ref={searchRef}
          type="search"
          placeholder="Search products — press /"
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
        className={styles.sort}
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

      {/* role="status" is an implicit aria-live="polite": a screen reader hears "24 results" after the list changes. */}
      <Badge bg="secondary" className="align-self-start align-self-md-center ms-md-auto" role="status">
        {resultCount} results
      </Badge>
    </Stack>
  );
}
