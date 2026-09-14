import { Form } from 'react-bootstrap';

/**
 * Lab 1 builds this from scratch, in three steps. Right now it renders a
 * label and an input and knows nothing about values, changes or errors.
 */
// TODO(lab-1.1): the STRUCTURE — an interface with controlId, label, type = 'text', placeholder; value pinned, no onChange (yet)
// TODO(lab-1.2): make it CONTROLLED — `value: string` in, `onChange: (value: string) => void` out: a value, not an event
// TODO(lab-1.3): `onBlur`, `error`, `hint` — displayed here, never decided here; extend BaseFieldProps and use FieldShell
export function TextField({ controlId, label }: { controlId: string; label: string }) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control />
    </Form.Group>
  );
}
