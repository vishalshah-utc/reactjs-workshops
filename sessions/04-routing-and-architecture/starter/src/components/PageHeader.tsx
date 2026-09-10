import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /**
   * A SLOT. Anything the caller wants on the right-hand side — buttons, a
   * toggle, a count, three of those at once.
   *
   * The alternative is a prop per possibility: `actionLabel`, `onAction`,
   * `secondaryActionLabel`, `showCount`… and a new prop every time somebody
   * needs something slightly different. A `ReactNode` prop says "you decide"
   * and never needs changing again.
   */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
