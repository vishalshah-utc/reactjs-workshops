import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from 'react-bootstrap';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons. A slot, so the dialog never learns what "confirm" means. */
  footer?: ReactNode;
}

/** The element the portal renders into — added to index.html next to #root, so a dialog is never inside a page's stacking context. */
function getDialogRoot(): HTMLElement {
  const root = document.getElementById('dialog-root');
  if (!root) throw new Error('Missing <div id="dialog-root"> in index.html.');
  return root;
}

/**
 * A modal dialog through createPortal — everything React Bootstrap's <Modal> does, written out once so you know
 * what you are paying a library for:
 *   1. the PORTAL — rendered under #dialog-root, so no ancestor's overflow:hidden or z-index can clip it;
 *   2. role="dialog" + aria-modal + aria-labelledby — what a screen reader needs to say "dialog, Delete product";
 *   3. Escape closes, a click on the backdrop closes, a click inside does not;
 *   4. a focus TRAP, and focus RESTORED to the opener on close (useFocusTrap);
 *   5. the page behind it does not scroll.
 * The look is Bootstrap's own modal classes — the CSS is already on the page; only the behaviour is ours.
 */
export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    // 3. Escape — on the document, so it works wherever focus is (the trap keeps it inside anyway).
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    // 5. Scroll lock: remember what was there, put it back. Two dialogs at once would need a counter — one reason libraries exist.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // `.modal-dialog` has pointer-events: none and `.modal-content` turns them back on — so a click whose target is
  // the `.modal` wrapper itself landed outside the panel: on the backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  // createPortal(children, container): the React tree says "child of whoever rendered <Dialog>"; the DOM says
  // "child of #dialog-root". Context flows in, events bubble out — through the REACT tree, not the DOM one.
  // Two siblings, as Bootstrap lays them out: the dimmed backdrop (opacity .5 — a PARENT with that opacity would
  // fade the panel too), then the `.modal` layer that holds the panel.
  return createPortal(
    <>
      <div className="modal-backdrop show" />
      <div className="modal d-block" tabIndex={-1} onClick={handleBackdropClick}>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 id={titleId} className="modal-title h6">
                {title}
              </h2>
              <CloseButton aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>,
    getDialogRoot(),
  );
}
