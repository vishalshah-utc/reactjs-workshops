import type { ReactNode } from 'react';
import { Form } from 'react-bootstrap';

export interface FieldShellProps {
  /** Unique id for the label/control pair. A prop, never a constant — duplicate ids break label focus. */
  controlId: string;
  label: ReactNode;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Label + control + hint/feedback. Every field component reuses it, so the
 * spacing, the label style and the error placement are decided ONCE.
 */
export function FieldShell({ controlId, label, error, hint, children }: FieldShellProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label className="small fw-semibold">{label}</Form.Label>
      {children}
      {hint && !error && <Form.Text>{hint}</Form.Text>}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

/** The props every field component shares. */
export interface BaseFieldProps {
  controlId: string;
  label: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

