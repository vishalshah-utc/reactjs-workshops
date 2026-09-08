import type { ReactNode } from 'react';
import { PackageOpenIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * "There is genuinely nothing here" — which is NOT the same as "still
 * loading" and NOT the same as "it broke".
 *
 * Conflating the three is the most common async-UI mistake. A grid that shows
 * "No products found" for 400ms before the first response lands makes a
 * working app feel broken.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      {icon ?? <PackageOpenIcon className="text-muted-foreground size-8" />}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
