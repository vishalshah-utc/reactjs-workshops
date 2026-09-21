import { useRef, useState } from 'react';
import { Badge, Button, Form, InputGroup, Stack } from 'react-bootstrap';
import { Funnel, Search } from 'react-bootstrap-icons';
import type { SortKey } from '../lib/catalog';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
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

interface ProductToolbarProps {
  /** What the URL currently carries. The box keeps its own draft from here. */
  query: string;
  /** Called when the typing PAUSES — not on every keystroke. */
  onQueryCommit: (query: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  /** The client-side filter over the page already loaded. The PAGE owns this one — the grid needs the value. */
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
  resultCount: number;
  /** DEV ONLY: the slow-mode switch (Demo 18 Lab 1). */
  slow: boolean;
  onSlowChange: (slow: boolean) => void;
}

/**
 * The search box owns its own DRAFT.
 *
 * Until Demo 18 the draft lived in `ProductsPage`, which meant every keystroke
 * re-rendered the page — the header, the category strip, the pager and twelve
 * product cards — to change the value of one `<input>`. Pushing the state down
 * to the only component that shows it is the cheapest possible fix: no `memo`,
 * no dependency arrays, one less prop pair on the page (📖 study-notes 15 §7).
 *
 * `sort` and `quickFilter` stay CONTROLLED, and for the same reason in reverse:
 * something above this component needs their values.
 */
export function ProductToolbar({ query, onQueryCommit, sort, onSortChange, quickFilter, onQuickFilterChange, resultCount, slow, onSlowChange }: ProductToolbarProps) {
  useRenderCount('ProductToolbar'); // watch the console while you type: only this line fires now

  const [draft, setDraft] = useState(query);
  const commit = useDebouncedCallback(onQueryCommit, 400);

  // If `q` changes from OUTSIDE (back button, a shared link, a category click that clears it), adopt it.
  // "Adjusting state when a prop changes" — the React-docs pattern, no effect needed.
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    setDraft(query);
  }

  // A DOM ref: null during render, the <input> once React has committed. Only ever touched in a handler.
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcut('/', () => {
    searchRef.current?.focus();
    searchRef.current?.select(); // the old query is selected: typing replaces it, Escape keeps it
  });

  function handleChange(value: string) {
    setDraft(value); // instant — this component and nothing else
    commit(value); // 400 ms later — the URL, the loader, the network
  }

  return (
    <Stack gap={2} className="mb-3">
      {/* Stack's `gap` is responsive; its `direction` is not (one string, no breakpoints). So: a vertical Stack —
          the mobile default — turned into a row from md up by the utility that Stack itself is made of. */}
      <Stack gap={2} className="flex-md-row align-items-md-center">
        <InputGroup className={styles.search}>
          <InputGroup.Text>
            <Search />
          </InputGroup.Text>
          <Form.Control
            ref={searchRef}
            type="search"
            placeholder="Search products — press /"
            aria-label="Search products"
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
          />
          {draft && (
            <Button variant="outline-secondary" onClick={() => handleChange('')}>
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

      <Stack gap={2} className="flex-md-row align-items-md-center">
        {/* NOT the search box: this one never touches the URL and never fetches. It narrows the page you already
            have, on the client, as you type — which is exactly the update `useDeferredValue` is designed for. */}
        <InputGroup className={styles.search}>
          <InputGroup.Text>
            <Funnel />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Filter these results (no reload)"
            aria-label="Filter the products on this page"
            value={quickFilter}
            onChange={(e) => onQuickFilterChange(e.target.value)}
          />
        </InputGroup>

        {/* Dev-only, and `import.meta.env.DEV` on purpose: Vite replaces it with `false` at build time and the
            bundler deletes the whole branch, so the switch cannot exist in production. */}
        {import.meta.env.DEV && (
          <Form.Check
            type="switch"
            id="slow-mode"
            className="text-nowrap"
            label="Slow mode"
            title="Burn ~4.5 ms of main thread inside every product card's render"
            checked={slow}
            onChange={(e) => onSlowChange(e.target.checked)}
          />
        )}
      </Stack>
    </Stack>
  );
}
