import type { ReactNode } from 'react';

export type TextVariant = 'title' | 'subtitle' | 'eyebrow' | 'body' | 'muted' | 'mono';

// TODO(lab-3.1): make this POLYMORPHIC — `as?: T extends ElementType`, props = own props & DistributiveOmit<ComponentPropsWithoutRef<T>, own keys>,
// a VARIANT_CLASS map from TextVariant to Bootstrap classes, default element 'p'
interface TextProps {
  variant?: TextVariant;
  className?: string;
  children?: ReactNode;
}

/** Placeholder: always a <p>. */
export function Text({ className, children }: TextProps) {
  return <p className={className}>{children}</p>;
}
