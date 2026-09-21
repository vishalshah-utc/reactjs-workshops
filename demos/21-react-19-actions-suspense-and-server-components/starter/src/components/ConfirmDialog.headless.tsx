import { useEffect, useId, useRef, type MouseEvent } from 'react';
import { Button } from 'react-bootstrap';
import type { ConfirmDialogProps } from './ConfirmDialog';
import styles from './ConfirmDialog.module.css';

/**
 * HEADLESS: the browser's <dialog> supplies the behaviour — showModal() puts it in the top layer, traps focus,
 * closes on Escape, restores focus to the opener, and paints a ::backdrop. We supply the look (a CSS Module for
 * the box and backdrop, Bootstrap utilities inside) and the React glue: `show` in, `onCancel`/`onConfirm` out.
 */
export function ConfirmDialogHeadless({ show, title, body, confirmLabel = 'Confirm', variant = 'danger', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Declarative in, imperative out: `show` is a prop; the DOM's open/closed state is a method call. This effect is the bridge.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) dialog.showModal(); // NOT show(): only showModal() gives the top layer, the focus trap and Escape
    else if (!show && dialog.open) dialog.close();
  }, [show]);

  // Padding is 0, so a click whose target is the <dialog> itself landed on the ::backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !busy) onCancel();
  }

  return (
    // onCancel fires for Escape (before the dialog closes; preventDefault keeps it open while busy).
    // onClose fires after ANY close — Escape, our close() above, a form method="dialog" — so `show` guards against reporting our own close.
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={() => {
        if (show) onCancel();
      }}
      onClick={handleBackdropClick}
    >
      <div className="d-flex align-items-center justify-content-between gap-3 border-bottom px-3 py-2">
        <h2 id={titleId} className="h6 mb-0">
          {title}
        </h2>
        <Button variant="link" size="sm" className="text-body text-decoration-none" aria-label="Close" onClick={onCancel} disabled={busy}>
          ✕
        </Button>
      </div>
      <div className="p-3">{body}</div>
      <div className="d-flex justify-content-end gap-2 border-top px-3 py-2">
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
