import { Spinner } from 'react-bootstrap';

/** A single spinner. Lab 2.3 replaces it with card-shaped placeholders that don't shift the layout. */
// TODO(lab-2.3): render `count` card-shaped <Placeholder> skeletons in the same grid as the real cards
export function CardSkeletons() {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading…</span>
      </Spinner>
    </div>
  );
}
