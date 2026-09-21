import type { ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons. A slot, so the dialog never learns what "confirm" means. */
  footer?: ReactNode;
}

// TODO(lab-4.1): createPortal into #dialog-root (index.html): Bootstrap's .modal-backdrop + .modal markup, role="dialog",
// aria-modal, aria-labelledby (useId), Escape and backdrop-click close, body scroll lock — then useFocusTrap (lab-4.2)
/** Placeholder: renders nothing. */
export function Dialog(_props: DialogProps) {
  return null;
}
