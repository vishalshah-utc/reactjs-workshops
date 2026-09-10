import { cn } from '@/lib/utils';

/**
 * Thin wrappers over real table elements.
 *
 * They stay real `<table>`, `<thead>`, `<tr>`, `<td>` — not divs with
 * `display: table`. Screen readers announce "row 3 of 24, column Price" only
 * for genuine table semantics, and keyboard table navigation depends on them.
 * Session 9 replaces this with a generic, virtualized DataTable, still built
 * on the same elements.
 */
export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export const TableHeader = ({ className, ...props }: React.ComponentProps<'thead'>) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.ComponentProps<'tr'>) => (
  <tr className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ComponentProps<'th'>) => (
  <th className={cn('text-muted-foreground h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap', className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.ComponentProps<'td'>) => (
  <td className={cn('p-3 align-middle', className)} {...props} />
);

export const TableCaption = ({ className, ...props }: React.ComponentProps<'caption'>) => (
  <caption className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
);
