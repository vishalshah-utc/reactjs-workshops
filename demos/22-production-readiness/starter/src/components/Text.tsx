import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';

/** The typographic roles this app has, as data. A role is a NAME for a set of classes — the caller never types `h3 mb-0`. */
export type TextVariant = 'title' | 'subtitle' | 'eyebrow' | 'body' | 'muted' | 'mono';

const VARIANT_CLASS: Record<TextVariant, string> = {
  title: 'h3 mb-0',
  subtitle: 'h6 text-muted mb-0',
  eyebrow: 'text-muted small text-uppercase',
  body: 'mb-0',
  muted: 'text-muted mb-0',
  mono: 'font-monospace',
};

/**
 * `Omit` over a UNION collapses it to the keys the members share — `Omit<A | B, K>` is `Omit<A & B-ish, K>`, and
 * the member-specific props vanish. Wrapping it in a conditional type makes TypeScript apply it to EACH member
 * (conditional types distribute over naked type parameters). Every polymorphic component needs this one line.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** The props that are OURS, regardless of what element renders. */
interface TextOwnProps<T extends ElementType> {
  /** Which element to render. Any tag or component; `'p'` by default. */
  as?: T;
  variant?: TextVariant;
  className?: string;
  children?: ReactNode;
}

/**
 * Our props, plus every prop the chosen element accepts — minus the ones we define ourselves, so `className`
 * is declared once. `ComponentPropsWithoutRef<'h2'>` is what an <h2> takes; `<'a'>` adds `href`; `<typeof Link>`
 * adds `to`. Without the ref: this component does not forward one (React 19 would let it — see TextField).
 */
export type TextProps<T extends ElementType> = TextOwnProps<T> & DistributiveOmit<ComponentPropsWithoutRef<T>, keyof TextOwnProps<T>>;

/**
 * A POLYMORPHIC component: `<Text as="h1" variant="title">` renders an <h1>, and `href` on it is a compile error
 * because an <h1> has no href — the props follow the element. The generic defaults to 'p' when `as` is omitted.
 */
export function Text<T extends ElementType = 'p'>({ as, variant = 'body', className, ...rest }: TextProps<T>) {
  // A capitalised variable holding a tag name or a component — JSX renders whatever it holds. The cast is the one
  // place TypeScript cannot follow: `T` may be any element, and JSX needs a concrete type to check the spread.
  const Component: ElementType = as ?? 'p';
  return <Component className={clsx(VARIANT_CLASS[variant], className)} {...rest} />;
}
