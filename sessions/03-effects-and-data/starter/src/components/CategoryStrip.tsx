import { cn } from '@/lib/utils';

interface CategoryStripProps {
  categories: Array<{ id: string; name: string; count: number }>;
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * A horizontally scrolling row of category chips.
 *
 * This component holds NO state. It is handed the current selection and a
 * function to call when the user picks a different one. Everything it knows
 * comes in through props, and everything it decides goes out through a
 * callback — which makes it trivial to reason about, and trivial to test.
 *
 * The pattern has a name: a "controlled" component. Session 2 formalises it.
 */
export function CategoryStrip({ categories, activeId, onSelect }: CategoryStripProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={isActive}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-background hover:bg-accent border-border',
            )}
          >
            {category.name}
            <span className={cn('text-xs tabular-nums', isActive ? 'opacity-75' : 'text-muted-foreground')}>
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
