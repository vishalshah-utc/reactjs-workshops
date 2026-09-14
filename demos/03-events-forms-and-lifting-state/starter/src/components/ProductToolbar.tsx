import { Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import type { SortKey } from '../lib/catalog';

/** Sort options as data — the <select> is rendered FROM this list. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: '', label: 'Default order' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Best rated' },
];

/**
 * A search box that does nothing yet — type in it and watch nothing happen.
 * Lab 1.1 makes it CONTROLLED: the parent owns the value and hears every change.
 */
// TODO(lab-1.1): make this controlled — `query`/`onQueryChange`, `sort`/`onSortChange` (typed with SortKey) — and add the sort select
export function ProductToolbar() {
  return (
    <InputGroup className="mb-3" style={{ maxWidth: 360 }}>
      <InputGroup.Text>
        <Search />
      </InputGroup.Text>
      <Form.Control type="search" placeholder="Search products…" aria-label="Search products" />
    </InputGroup>
  );
}
