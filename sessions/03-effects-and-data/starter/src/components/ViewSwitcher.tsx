import { LayoutDashboardIcon, StoreIcon } from 'lucide-react';
import type { View } from '@/types';
import { cn } from '@/lib/utils';

interface ViewSwitcherProps {
  view: View;
  onChange: (view: View) => void;
}

/**
 * Storefront / Back-office toggle.
 *
 * A stand-in for routing. It works, but notice two things it cannot do:
 * refresh keeps you on the storefront no matter where you were, and there is
 * no URL you can send anyone. Session 4 replaces this with React Router and
 * opens by making exactly that complaint.
 */
export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  const tabs: Array<{ id: View; label: string; icon: typeof StoreIcon }> = [
    { id: 'storefront', label: 'Storefront', icon: StoreIcon },
    { id: 'backoffice', label: 'Back-office', icon: LayoutDashboardIcon },
  ];

  return (
    <div className="bg-muted flex items-center gap-0.5 rounded-md p-0.5" role="tablist" aria-label="Switch view">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={view === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs font-medium transition-colors',
            view === tab.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <tab.icon className="size-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
