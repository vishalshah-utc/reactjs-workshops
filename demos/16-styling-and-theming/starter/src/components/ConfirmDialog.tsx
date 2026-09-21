import type { ReactNode } from 'react';
import { Button, Modal } from 'react-bootstrap';
import type { ButtonProps } from 'react-bootstrap';

/** Exported: ConfirmDialog.headless.tsx implements the SAME props with a native <dialog>. The props are the contract; the library is a detail. */
export interface ConfirmDialogProps {
  show: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  variant?: ButtonProps['variant'];
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A reusable confirmation. `window.confirm` blocks the main thread, can't be
 * styled, and can't show a spinner — this can. Controlled: the parent owns
 * `show` and decides what confirm/cancel mean.
 */
export function ConfirmDialog({
  show,
  title,
  body,
  confirmLabel = 'Confirm',
  variant = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
