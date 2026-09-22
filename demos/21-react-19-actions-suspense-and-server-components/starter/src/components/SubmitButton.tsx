import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';

interface SubmitButtonProps {
  children: ReactNode;
  /** What to say while the action is running. Defaults to the idle label. */
  pendingLabel?: string;
  variant?: string;
  className?: string;
}

/**
 * A submit button that knows whether its form is busy — WITHOUT being told.
 * Today it knows nothing: it is an ordinary button.
 */
// TODO(lab-1.2): read `const { pending } = useFormStatus()` (from 'react-dom', not 'react')
// and use it to disable the button, swap in `pendingLabel` and show a <Spinner>.
// The hook reads the nearest <form> ABOVE this component, so this file must never
// render the <form> itself — that is the mistake everyone makes once.
export function SubmitButton({ children, variant = 'primary', className }: SubmitButtonProps) {
  return (
    <Button type="submit" variant={variant} className={className}>
      {children}
    </Button>
  );
}
