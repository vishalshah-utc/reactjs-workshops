import type { RefObject } from 'react';
import { Pagination } from 'react-bootstrap';
import { useControllableState } from '../hooks/useControllableState';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

interface PagerProps {
  /** CONTROLLED: the parent owns the page (the URL, on /products). 0-based, like `skip`; displayed 1-based, like humans. */
  value?: number;
  /** UNCONTROLLED: where to start; the Pager keeps its own page from then on. */
  defaultValue?: number;
  pageCount: number;
  /** Fires in both modes. */
  onChange?: (page: number) => void;
  /**
   * Something to bring back into view after a page change — the grid, usually.
   * A ref is just an object with a `current` property; it travels as a prop like any other value.
   */
  scrollTargetRef?: RefObject<HTMLElement | null>;
}

/**
 * Controlled OR uncontrolled — the caller decides by passing `value` or not, exactly as with an <input>.
 * The URL-driven list stays controlled; a pager inside a self-contained widget can just work.
 */
export function Pager({ value, defaultValue = 0, pageCount, onChange, scrollTargetRef }: PagerProps) {
  const [page, setPage] = useControllableState({ value, defaultValue, onChange });

  if (pageCount <= 1) return null;

  function go(next: number) {
    setPage(next);
    // A handler, not render — reading .current here is fine. The node can be null (an empty grid), hence `?.`.
    // Smooth scrolling is motion: honour the OS "reduce motion" setting.
    scrollTargetRef?.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <Pagination className="justify-content-center mt-4 mb-0" aria-label="Pages">
      <Pagination.Prev disabled={page === 0} onClick={() => go(page - 1)} />
      <Pagination.Item disabled>
        Page {page + 1} of {pageCount}
      </Pagination.Item>
      <Pagination.Next disabled={page >= pageCount - 1} onClick={() => go(page + 1)} />
    </Pagination>
  );
}
