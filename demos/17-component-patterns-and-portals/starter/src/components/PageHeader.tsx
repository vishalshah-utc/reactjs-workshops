import type { ReactNode } from 'react';

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
        {/* tabIndex={-1}: focusable from code (RouteAnnouncer moves focus here after a navigation), never in the Tab order. */}
        {/* TODO(lab-3.1): <Text as="h1" variant="title" tabIndex={-1}> and <Text variant="muted"> — the polymorphic component */}
        <h1 className="h3 mb-1" tabIndex={-1}>
          {title}
        </h1>
        {description && <p className="text-muted mb-0">{description}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
    </div>
  );
}
