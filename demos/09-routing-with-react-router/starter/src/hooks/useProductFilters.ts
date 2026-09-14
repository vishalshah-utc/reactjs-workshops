import { useState } from 'react';
import type { SortKey } from '../lib/catalog';

/** Everything the server needs to know about what the user is looking at. */
export interface ProductFilters {
  query: string;
  sort: SortKey;
  category: string;
  /** 0-based. */
  page: number;
}

const INITIAL_FILTERS: ProductFilters = { query: '', sort: '', category: 'all', page: 0 };

/**
 * The same filters object App has used since Demo 7 — held in React state,
 * which means: not in the URL, not shareable, lost on refresh.
 * Lab 4.1 moves it into useSearchParams.
 */
// TODO(lab-4.1): read from useSearchParams; write with replace:true; page is 1-based in the URL, 0-based here
export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);

  function updateFilters(patch: Partial<ProductFilters>) {
    setFilters((current) => ({ ...current, page: 0, ...patch }));
  }

  return { filters, updateFilters };
}
