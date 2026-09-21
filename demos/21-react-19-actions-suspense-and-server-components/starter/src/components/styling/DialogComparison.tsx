import { useState } from 'react';
import { Badge, Button, Card, Stack } from 'react-bootstrap';
import { ConfirmDialog } from '../ConfirmDialog';
import { ConfirmDialogHeadless } from '../ConfirmDialog.headless';
import { Dialog } from '../dialog/Dialog';

type Open = 'styled' | 'headless' | 'portal' | null;

/**
 * The same confirmation, three implementations: React Bootstrap's Modal (a STYLED library — behaviour and look in
 * one package), a native <dialog> with our own 40 lines (HEADLESS — the browser supplies the behaviour), and our
 * createPortal Dialog (Demo 17 — every behaviour written out by hand). Open each; press Escape; watch where focus goes.
 */
export function DialogComparison() {
  const [open, setOpen] = useState<Open>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  // How many clicks INSIDE the portal dialog reached the <div onClick> that wraps it in the React tree — even though,
  // in the DOM, the dialog lives under #dialog-root and that div is in #root.
  const [bubbled, setBubbled] = useState(0);
  const close = () => setOpen(null);

  return (
    <section aria-labelledby="dialogs-heading" className="mt-4">
      <h2 id="dialogs-heading" className="h5">
        Styled vs headless vs hand-rolled
      </h2>
      <Card>
        <Card.Body>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button variant="outline-primary" onClick={() => setOpen('styled')}>
              Open React Bootstrap Modal
            </Button>
            <Button variant="outline-primary" onClick={() => setOpen('headless')}>
              Open native &lt;dialog&gt;
            </Button>
            <Button variant="outline-primary" onClick={() => setOpen('portal')}>
              Open createPortal dialog
            </Button>
            {outcome && (
              <span className="small text-muted ms-auto" role="status">
                Last: {outcome}
              </span>
            )}
          </Stack>
          <p className="small text-muted mt-3 mb-0">
            Clicks inside the portal dialog that bubbled to its React parent:{' '}
            <Badge bg="secondary" pill>
              {bubbled}
            </Badge>{' '}
            — the dialog's DOM is under <code>#dialog-root</code>; the listener is on a <code>&lt;div&gt;</code> in <code>#root</code>.
          </p>
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={open === 'styled'}
        title="Styled: React Bootstrap Modal"
        body="Escape, backdrop click, focus trap and focus return are the library's. So are the CSS classes — every one is Bootstrap's."
        confirmLabel="Confirm"
        variant="primary"
        onConfirm={() => {
          setOutcome('confirmed (styled)');
          close();
        }}
        onCancel={() => {
          setOutcome('cancelled (styled)');
          close();
        }}
      />
      <ConfirmDialogHeadless
        show={open === 'headless'}
        title="Headless: native <dialog>"
        body="Escape, focus trap, top layer and ::backdrop are the browser's. The look is ours — a CSS Module and Bootstrap utilities."
        confirmLabel="Confirm"
        variant="primary"
        onConfirm={() => {
          setOutcome('confirmed (headless)');
          close();
        }}
        onCancel={() => {
          setOutcome('cancelled (headless)');
          close();
        }}
      />

      {/* A click handler on the REACT parent of the portal. In the DOM these are not ancestors and descendants;
          in React they are, and synthetic events follow the React tree. This is the proof. */}
      <div onClick={() => setBubbled((n) => n + 1)}>
        <Dialog
          open={open === 'portal'}
          title="Hand-rolled: createPortal"
          onClose={() => {
            setOutcome('cancelled (portal)');
            close();
          }}
          footer={
            <>
              <Button variant="outline-secondary" onClick={() => { setOutcome('cancelled (portal)'); close(); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setOutcome('confirmed (portal)');
                  close();
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          Portal, role="dialog", aria-modal, Escape, backdrop click, focus trap, focus restore and a scroll lock — each written out in
          Dialog.tsx and useFocusTrap.ts. Click anywhere in here and watch the counter behind.
        </Dialog>
      </div>
    </section>
  );
}
