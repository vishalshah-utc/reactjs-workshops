import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { SortKey } from '../lib/catalog';

/** Everything the server needs to know about what the user is looking at. */
export interface ProductFilters {
  query: string;
  sort: SortKey;
  category: string;
  /** 0-based in the app (for skip); 1-based in the URL (for humans). */
  page: number;
}

/**
 * The product list's filters, read from and written to the QUERY STRING.
 *
 * The URL is the single source of truth — there is no useState mirror to
 * fall out of sync with it, every filter combination is a shareable link,
 * and the back button undoes filter changes for free.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const page = Number(searchParams.get('page') ?? '1');
    return {
      query: searchParams.get('q') ?? '',
      // The URL is untyped text; the cast is a promise we keep in updateFilters, where only SortKeys are written.
      sort: (searchParams.get('sort') ?? '') as SortKey,
      category: searchParams.get('category') ?? 'all',
      page: Number.isFinite(page) && page > 0 ? page - 1 : 0,
    };
  }, [searchParams]);

  /**
   * Merge a patch into the current params. Empty values are REMOVED so the URL
   * never carries `?q=&category=all`. Any change except paging resets the page.
   */
  const updateFilters = useCallback(
    (patch: Partial<ProductFilters>, { replace = true }: { replace?: boolean } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous); // copy — never mutate the argument

          const write = (key: string, value: string | number | undefined, emptyValue?: string | number) => {
            if (value === undefined) return;
            if (value === '' || value === emptyValue) next.delete(key);
            else next.set(key, String(value));
          };

          write('q', patch.query);
          write('sort', patch.sort);
          write('category', patch.category, 'all');
          if (patch.page !== undefined) write('page', patch.page + 1, 1);
          else next.delete('page'); // a filter change invalidates the current page

          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  return { filters, updateFilters };
}
