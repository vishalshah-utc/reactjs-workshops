import type { ReactNode } from 'react';
import { Text } from './Text';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** A SLOT: any renderable thing. One button, three buttons, a dropdown, a live count. */
  actions?: ReactNode;
}

/**
 * Title + optional description + an `actions` slot. This component never needs
 * to know what goes in the slot — which is why it will never need another prop.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        {/* tabIndex={-1}: focusable from code (RouteAnnouncer moves focus here after a navigation), never in the Tab order. */}
        {/* Polymorphic: an <h1> with the `title` role's classes. tabIndex is an <h1> prop, so it type-checks; `href` would not. */}
        <Text as="h1" variant="title" className="mb-1" tabIndex={-1}>
          {title}
        </Text>
        {description && <Text variant="muted">{description}</Text>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
    </div>
  );
}
