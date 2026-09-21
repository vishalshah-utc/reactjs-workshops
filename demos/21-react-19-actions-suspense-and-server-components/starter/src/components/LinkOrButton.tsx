import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router';
import { button, type ButtonVariants } from '../lib/variants';

/** What both shapes share: the cva axes (tone, size, block), a class and content. */
interface CommonProps extends ButtonVariants {
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * A DISCRIMINATED UNION of props: `variant` decides which OTHER props exist. `variant: 'link'` requires `to` and
 * cannot take `disabled` (a link cannot be disabled — hide it instead); `variant: 'button'` requires `onClick`
 * and cannot take `to`. Forget `to` on a link and the compiler says so; pass `to` to a button and it says so too.
 * `to?: never` is how you say "this prop must NOT be here" — optional, but the only value it accepts is nothing.
 */
export type LinkOrButtonProps = CommonProps &
  (
    | { variant: 'link'; to: string; onClick?: MouseEventHandler<HTMLAnchorElement>; disabled?: never }
    | { variant: 'button'; to?: never; onClick: MouseEventHandler<HTMLButtonElement>; disabled?: boolean; type?: 'button' | 'submit' }
  );

/**
 * A router <Link> or a <button>, dressed identically by the `button` variant map. react-bootstrap's <Button as={Link}>
 * does not type-check against the router; this does — and it is the same three lines the header, the drawer and
 * the detail page each had their own version of.
 */
export function LinkOrButton(props: LinkOrButtonProps) {
  const { tone, size, block, className, children, 'aria-label': ariaLabel } = props;
  const classes = button({ tone, size, block, className });

  // Narrowing on the discriminant: inside this branch `props.to` is a string and `props.onClick` is an anchor handler.
  if (props.variant === 'link') {
    return (
      <Link to={props.to} className={classes} onClick={props.onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={props.type ?? 'button'} className={classes} onClick={props.onClick} disabled={props.disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
