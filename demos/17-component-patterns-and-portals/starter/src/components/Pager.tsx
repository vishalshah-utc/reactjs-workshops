import type { RefObject } from 'react';
import { Pagination } from 'react-bootstrap';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

// TODO(lab-2.2): accept `value` OR `defaultValue` (+ `onChange` in both modes) through useControllableState — controlled and uncontrolled
interface PagerProps {
  /** 0-based, like `skip`. Displayed 1-based, like humans. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /**
   * Something to bring back into view after a page change — the grid, usually.
   * A ref is just an object with a `current` property; it travels as a prop like any other value.
   */
  scrollTargetRef?: RefObject<HTMLElement | null>;
}

/** Controlled: the parent owns `page`; this renders it and reports clicks. */
export function Pager({ page, pageCount, onChange, scrollTargetRef }: PagerProps) {
  if (pageCount <= 1) return null;

  function go(next: number) {
    onChange(next);
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
