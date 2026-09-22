import type { ReactNode } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: ReactNode;
  /** What to say while the action is running. Defaults to the idle label. */
  pendingLabel?: string;
  variant?: string;
  className?: string;
}

/**
 * A submit button that knows whether its form is busy — WITHOUT being told.
 *
 * `useFormStatus` reads the nearest `<form>` ABOVE this component, the way
 * `useContext` reads the nearest provider. That is the whole point: the form
 * passes no `isPending` prop, so this button drops into any form in the app
 * and is correct in all of them.
 *
 * The rule that catches everyone once: it must be rendered INSIDE the form.
 * Call `useFormStatus()` in the same component that renders the `<form>` and
 * it returns `pending: false` for ever — there is no form above it yet.
 *
 * It lives in `react-dom`, not `react`: the pending state belongs to a DOM
 * `<form>` submission, not to React's core.
 */
export function SubmitButton({ children, pendingLabel, variant = 'primary', className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending}>
      {pending && <Spinner as="span" size="sm" animation="border" className="me-2" aria-hidden="true" />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
