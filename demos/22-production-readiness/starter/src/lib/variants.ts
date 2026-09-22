import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Variant maps: the classes a component MAY wear, written as data. `badge({ tone: 'low' })` returns
 * 'badge text-bg-warning'; an unknown tone is a compile error. Every combination is a lookup — never a
 * string you build by hand. The classes themselves are Bootstrap's: cva owns the API, not the CSS.
 */
export const badge = cva('badge', {
  variants: {
    tone: {
      ok: 'bg-success-subtle text-success-emphasis',
      low: 'text-bg-warning',
      out: 'text-bg-danger',
      neutral: 'text-bg-secondary',
    },
    size: {
      sm: 'px-1 py-0',
      md: '',
      lg: 'fs-6 px-3 py-2',
    },
    pill: {
      true: 'rounded-pill', // a boolean variant: `pill` / `pill={false}`, no value to remember
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

/**
 * Bootstrap's button classes for the elements that CANNOT be a <Button>: a router <Link> that should
 * look like one (react-bootstrap's `as` prop does not type-check against it). Until today those were
 * hand-typed strings — "btn btn-light btn-sm" — in three files.
 */
export const button = cva('btn', {
  variants: {
    tone: {
      primary: 'btn-primary',
      light: 'btn-light',
      outlineLight: 'btn-outline-light',
      ghost: 'btn-outline-secondary',
      link: 'btn-link',
    },
    size: {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    },
    block: {
      true: 'w-100',
    },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
});

/** The props a component gets by ACCEPTING a variant map — derived from the map, so the two cannot drift. */
export type BadgeVariants = VariantProps<typeof badge>;
export type ButtonVariants = VariantProps<typeof button>;
