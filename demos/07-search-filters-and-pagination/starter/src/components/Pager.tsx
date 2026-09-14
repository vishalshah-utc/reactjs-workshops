import { Pagination } from 'react-bootstrap';

interface PagerProps {
  onPrev: () => void;
  onNext: () => void;
}

/** Previous / Next only. Lab 3.2 shows the page count and disables the ends. */
// TODO(lab-3.2): props { page: number; pageCount: number; onChange: (page: number) => void }; "Page X of Y"; hide when there is one page
export function Pager({ onPrev, onNext }: PagerProps) {
  return (
    <Pagination className="justify-content-center mt-4">
      <Pagination.Prev onClick={onPrev} />
      <Pagination.Next onClick={onNext} />
    </Pagination>
  );
}
