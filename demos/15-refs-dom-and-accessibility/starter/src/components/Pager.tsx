import { Pagination } from 'react-bootstrap';

interface PagerProps {
  /** 0-based, like `skip`. Displayed 1-based, like humans. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  // TODO(lab-3.3): scrollTargetRef?: RefObject<HTMLElement | null> — after onChange, scrollIntoView({ behavior: 'smooth', block: 'start' })
  // TODO(lab-5.3): behavior: prefersReducedMotion() ? 'auto' : 'smooth'
}

/** Controlled: the parent owns `page`; this renders it and reports clicks. */
export function Pager({ page, pageCount, onChange }: PagerProps) {
  if (pageCount <= 1) return null;

  return (
    <Pagination className="justify-content-center mt-4 mb-0">
      <Pagination.Prev disabled={page === 0} onClick={() => onChange(page - 1)} />
      <Pagination.Item disabled>
        Page {page + 1} of {pageCount}
      </Pagination.Item>
      <Pagination.Next disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)} />
    </Pagination>
  );
}
