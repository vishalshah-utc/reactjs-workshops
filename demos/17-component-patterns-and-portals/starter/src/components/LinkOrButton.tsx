import type { ReactNode } from 'react';
import type { ButtonVariants } from '../lib/variants';

// TODO(lab-3.2): a DISCRIMINATED UNION of props — `variant: 'link'` requires `to` (and forbids `disabled`);
// `variant: 'button'` requires `onClick` (and forbids `to`); both share the cva axes and render through button()
export type LinkOrButtonProps = ButtonVariants & {
  variant: 'link' | 'button';
  className?: string;
  children: ReactNode;
};

/** Placeholder: a plain button, whatever the variant. */
export function LinkOrButton({ className, children }: LinkOrButtonProps) {
  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}
