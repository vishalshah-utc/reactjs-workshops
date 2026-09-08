import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  // TODO(lab-2.1): Add an `actions?: ReactNode` prop — a SLOT the caller fills
  // with whatever it likes, instead of this component growing a prop for every
  // possible button. Import the type with `import type { ReactNode } from 'react'`.
  // Then render it on the right-hand side. Guide, Lab 2 step A.
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
}
