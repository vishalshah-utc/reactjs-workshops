import { useState } from 'react';
import { Button, Card, Stack } from 'react-bootstrap';
import { ConfirmDialog } from '../ConfirmDialog';
import { ConfirmDialogHeadless } from '../ConfirmDialog.headless';

type Open = 'styled' | 'headless' | null;

/**
 * The same ConfirmDialog props, two implementations: React Bootstrap's Modal (a STYLED library —
 * behaviour and look in one package) and a native <dialog> with our own 40 lines (HEADLESS — the browser
 * supplies the behaviour, a CSS Module supplies the look). Open both; press Escape; watch where focus goes.
 */
export function DialogComparison() {
  const [open, setOpen] = useState<Open>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const close = () => setOpen(null);

  // TODO(lab-4.4): a third button and a <Dialog> (createPortal) inside a <div onClick> that counts clicks bubbling out of the portal
  return (
    <section aria-labelledby="dialogs-heading" className="mt-4">
      <h2 id="dialogs-heading" className="h5">
        Styled vs headless
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
            {outcome && (
              <span className="small text-muted ms-auto" role="status">
                Last: {outcome}
              </span>
            )}
          </Stack>
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
    </section>
  );
}
