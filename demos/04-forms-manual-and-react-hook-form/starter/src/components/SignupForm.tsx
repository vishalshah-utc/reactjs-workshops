import { Button, Modal } from 'react-bootstrap';

interface SignupFormProps {
  show: boolean;
  onClose: () => void;
}

/** A placeholder dialog. Lab 3.2 builds the real form with react-hook-form over the field library. */
// TODO(lab-3.2): useForm<SignupValues>({ mode: 'onTouched', defaultValues: SIGNUP_EMPTY }); <Field> per input; rules on each Field; handleSubmit(onValid)
export function SignupForm({ show, onClose }: SignupFormProps) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">Create your ShopScope account</Modal.Title>
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
