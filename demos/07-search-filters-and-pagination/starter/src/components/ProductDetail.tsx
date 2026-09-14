import { Offcanvas } from 'react-bootstrap';

interface ProductDetailProps {
  /** null = nothing selected, drawer closed. */
  id: number | null;
  onClose: () => void;
}

/**
 * A slide-in panel that shows the id it was given and nothing else.
 * Lab 4.1 fetches the full product and renders it — with its own three states.
 */
// TODO(lab-4.1): fetch getProduct(id) in an effect (abortable, guarded by `if (id === null)`), render loading / error / product
export function ProductDetail({ id, onClose }: ProductDetailProps) {
  return (
    <Offcanvas show={id !== null} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="h6">Product #{id}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="text-muted">Nothing fetched yet — see Lab 4.</Offcanvas.Body>
    </Offcanvas>
  );
}
