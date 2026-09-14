import { Button, Modal } from 'react-bootstrap';

interface ProductFormProps {
  show: boolean;
  onClose: () => void;
}

/**
 * The "Add product" dialog. It opens and closes; it has no fields yet.
 * Lab 3.1 gives it controlled inputs, validation, and a submit handler.
 */
// TODO(lab-3.1): controlled fields (title, price, category, stock, description), validation, onCreate(payload: ProductDraft)
export function ProductForm({ show, onClose }: ProductFormProps) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">Add a product</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-muted">No fields yet — see Lab 3.</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
